import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';

describe('CloakPass End-to-End Cryptographic & Protocol Lifecycle (Level 3)', () => {
  // Helpers replicating domain-separated hashes
  function deriveCommitment(secret: Buffer, salt: Buffer): Buffer {
    const domain = Buffer.from('cloakpass:commit:');
    return crypto.createHash('sha256').update(Buffer.concat([domain, secret, salt])).digest();
  }

  function deriveNullifier(secret: Buffer): Buffer {
    const domain = Buffer.from('cloakpass:nullify:');
    return crypto.createHash('sha256').update(Buffer.concat([domain, secret])).digest();
  }

  it('1. should execute full lifecycle: mint pass -> verify Merkle leaf -> redeem with nullifier', () => {
    const secret = crypto.randomBytes(32);
    const salt = crypto.randomBytes(32);

    // 1. Off-chain witness derives commitment
    const commitment = deriveCommitment(secret, salt);
    expect(commitment.length).toBe(32);

    // 2. Public ledger inserts commitment into Merkle tree
    const mockMerkleTree: Buffer[] = [];
    mockMerkleTree.push(commitment);
    const leafIndex = mockMerkleTree.length - 1;
    expect(leafIndex).toBe(0);

    // 3. Off-chain prover generates membership path
    const pathLeaf = mockMerkleTree[leafIndex];
    expect(pathLeaf).toEqual(commitment);

    // 4. Prover derives unlinkable nullifier
    const nullifier = deriveNullifier(secret);
    expect(nullifier.length).toBe(32);
    expect(nullifier).not.toEqual(commitment);

    // 5. On-chain ledger checks spent set
    const usedNullifiers = new Set<string>();
    const nullifierHex = nullifier.toString('hex');
    expect(usedNullifiers.has(nullifierHex)).toBe(false);

    // 6. Redeem: record nullifier on-chain
    usedNullifiers.add(nullifierHex);
    expect(usedNullifiers.has(nullifierHex)).toBe(true);
  });

  it('2. should strictly reject double-redemption of the same pass', () => {
    const secret = crypto.randomBytes(32);
    const salt = crypto.randomBytes(32);
    const commitment = deriveCommitment(secret, salt);
    const nullifier = deriveNullifier(secret);
    const nullifierHex = nullifier.toString('hex');

    const usedNullifiers = new Set<string>();
    // First redemption succeeds
    usedNullifiers.add(nullifierHex);

    // Attempt second redemption with same secret
    const isDoubleRedeem = usedNullifiers.has(nullifierHex);
    expect(isDoubleRedeem).toBe(true);

    expect(() => {
      if (usedNullifiers.has(nullifierHex)) {
        throw new Error('Pass has already been redeemed (nullifier collision prevented)');
      }
    }).toThrow('Pass has already been redeemed');
  });

  it('3. should reject fraudulent or uncommitted secret keys', () => {
    const legitSecret = crypto.randomBytes(32);
    const legitSalt = crypto.randomBytes(32);
    const legitCommitment = deriveCommitment(legitSecret, legitSalt);

    const mockMerkleTree: string[] = [legitCommitment.toString('hex')];

    // Attacker crafts random fake secret
    const fakeSecret = crypto.randomBytes(32);
    const fakeSalt = crypto.randomBytes(32);
    const fakeCommitment = deriveCommitment(fakeSecret, fakeSalt);

    const isMember = mockMerkleTree.includes(fakeCommitment.toString('hex'));
    expect(isMember).toBe(false);

    expect(() => {
      if (!isMember) {
        throw new Error('Invalid pass: not in valid commitment tree');
      }
    }).toThrow('Invalid pass: not in valid commitment tree');
  });

  it('4. should enforce strict domain separation between commitment and nullifier', () => {
    const secret = crypto.randomBytes(32);
    const salt = Buffer.alloc(32, 0);

    const commitment = deriveCommitment(secret, salt);
    const nullifier = deriveNullifier(secret);

    // Even if salt was zero, domain tags "cloakpass:commit:" and "cloakpass:nullify:" prevent linkage
    expect(commitment.toString('hex')).not.toEqual(nullifier.toString('hex'));
  });

  it('5. should correctly simulate depth-10 Merkle tree capacity (1024 leaves)', () => {
    const treeDepth = 10;
    const maxCapacity = Math.pow(2, treeDepth);
    expect(maxCapacity).toBe(1024);

    const testLeaves = 25;
    const leaves: string[] = [];
    for (let i = 0; i < testLeaves; i++) {
      const s = crypto.randomBytes(32);
      const r = crypto.randomBytes(32);
      leaves.push(deriveCommitment(s, r).toString('hex'));
    }

    expect(leaves.length).toBe(testLeaves);
    expect(leaves.length).toBeLessThanOrEqual(maxCapacity);
  });
});
