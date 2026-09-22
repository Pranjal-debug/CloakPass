import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  witnesses,
  createCloakPassPrivateState,
  type CloakPassPrivateState,
} from '../../contract/witnesses.js';
import { getConfig, PREPROD_CONFIG, PREVIEW_CONFIG, LOCAL_CONFIG } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const currentDir = path.dirname(__filename);
const managedDir = path.resolve(currentDir, '..', '..', 'contract', 'managed', 'cloakpass');

describe('CloakPass Contract Suite - Level 1 New Moon', () => {
  describe('1. Compilation & Zero-Knowledge Artifacts', () => {
    it('should have generated contract metadata in managed directory', () => {
      const contractInfoPath = path.join(managedDir, 'compiler', 'contract-info.json');
      expect(fs.existsSync(contractInfoPath)).toBe(true);

      const contractInfo = JSON.parse(fs.readFileSync(contractInfoPath, 'utf8'));
      expect(contractInfo['compiler-version']).toBe('0.34.0');
      const circuitNames = contractInfo.circuits.map((c: any) => c.name);
      expect(circuitNames).toContain('issue_pass');
      expect(circuitNames).toContain('redeem_pass');
      const witnessNames = contractInfo.witnesses.map((w: any) => w.name);
      expect(witnessNames).toContain('pass_secret');
      expect(witnessNames).toContain('pass_salt');
      expect(witnessNames).toContain('get_pass_path');
    });

    it('should have generated ZKIR zero-knowledge intermediate representations', () => {
      const zkirDir = path.join(managedDir, 'zkir');
      expect(fs.existsSync(zkirDir)).toBe(true);

      const issueZkir = path.join(zkirDir, 'issue_pass.zkir');
      const redeemZkir = path.join(zkirDir, 'redeem_pass.zkir');
      expect(fs.existsSync(issueZkir)).toBe(true);
      expect(fs.existsSync(redeemZkir)).toBe(true);

      const issueContent = fs.readFileSync(issueZkir, 'utf8');
      expect(issueContent.length).toBeGreaterThan(100);
      const redeemContent = fs.readFileSync(redeemZkir, 'utf8');
      expect(redeemContent.length).toBeGreaterThan(100);
    });

    it('should have generated cryptographic proving and verifying keys', () => {
      const keysDir = path.join(managedDir, 'keys');
      expect(fs.existsSync(keysDir)).toBe(true);

      const issueProver = path.join(keysDir, 'issue_pass.prover');
      const issueVerifier = path.join(keysDir, 'issue_pass.verifier');
      const redeemProver = path.join(keysDir, 'redeem_pass.prover');
      const redeemVerifier = path.join(keysDir, 'redeem_pass.verifier');

      expect(fs.existsSync(issueProver)).toBe(true);
      expect(fs.existsSync(issueVerifier)).toBe(true);
      expect(fs.existsSync(redeemProver)).toBe(true);
      expect(fs.existsSync(redeemVerifier)).toBe(true);

      expect(fs.statSync(issueProver).size).toBeGreaterThan(100_000);
      expect(fs.statSync(redeemProver).size).toBeGreaterThan(100_000);
    });

    it('should have generated TypeScript bindings and declarations', () => {
      const contractDir = path.join(managedDir, 'contract');
      expect(fs.existsSync(path.join(contractDir, 'index.d.ts'))).toBe(true);
      expect(fs.existsSync(path.join(contractDir, 'index.js'))).toBe(true);

      const dts = fs.readFileSync(path.join(contractDir, 'index.d.ts'), 'utf8');
      expect(dts).toContain('passCommitments');
      expect(dts).toContain('usedNullifiers');
      expect(dts).toContain('totalIssued');
      expect(dts).toContain('totalRedeemed');
      expect(dts).toContain('organizerPk');
    });
  });

  describe('2. Off-Chain Private Witness Engine', () => {
    it('should isolate private state and return user secret securely', () => {
      const mockSecret = new Uint8Array(32).fill(7);
      const mockSalt = new Uint8Array(32).fill(42);
      const privateState = createCloakPassPrivateState(mockSecret, mockSalt);

      const mockContext: any = {
        privateState,
        ledger: {},
      };

      const [nextState1, secretResult] = witnesses.pass_secret(mockContext);
      expect(secretResult).toEqual(mockSecret);
      expect(nextState1.secret).toEqual(mockSecret);

      const [nextState2, saltResult] = witnesses.pass_salt(mockContext);
      expect(saltResult).toEqual(mockSalt);
      expect(nextState2.salt).toEqual(mockSalt);
    });

    it('should retrieve Merkle path from ledger for commitment leaf', () => {
      const mockCommitment = new Uint8Array(32).fill(99);
      const mockPath = {
        leaf: mockCommitment,
        path: [{ sibling: { field: 12345n }, goes_left: false }],
      };

      const mockContext: any = {
        privateState: createCloakPassPrivateState(),
        ledger: {
          passCommitments: {
            findPathForLeaf: (leaf: Uint8Array) => {
              if (leaf === mockCommitment) return mockPath;
              return undefined;
            },
          },
        },
      };

      const [, retrievedPath] = witnesses.get_pass_path(mockContext, mockCommitment);
      expect(retrievedPath).toEqual(mockPath);
      expect(retrievedPath.leaf).toEqual(mockCommitment);
    });

    it('should throw descriptive error when commitment is not in Merkle tree', () => {
      const unknownCommitment = new Uint8Array(32).fill(255);
      const mockContext: any = {
        privateState: createCloakPassPrivateState(),
        ledger: {
          passCommitments: {
            findPathForLeaf: () => undefined,
          },
        },
      };

      expect(() => witnesses.get_pass_path(mockContext, unknownCommitment)).toThrow(
        'Commitment leaf not found in passCommitments Merkle tree',
      );
    });
  });

  describe('3. Network Configuration & Preprod / Preview Endpoints', () => {
    it('should correctly configure Midnight Preprod network', () => {
      expect(PREPROD_CONFIG.networkId).toBe('preprod');
      expect(PREPROD_CONFIG.indexer).toContain('indexer.preprod.midnight.network');
      expect(PREPROD_CONFIG.node).toContain('rpc.preprod.midnight.network');
      expect(PREPROD_CONFIG.faucet).toContain('midnight-tmnight-preprod');
    });

    it('should correctly configure Midnight Preview network', () => {
      expect(PREVIEW_CONFIG.networkId).toBe('preview');
      expect(PREVIEW_CONFIG.indexer).toContain('indexer.preview.midnight.network');
      expect(PREVIEW_CONFIG.node).toContain('rpc.preview.midnight.network');
      expect(PREVIEW_CONFIG.faucet).toContain('midnight-tmnight-preview');
    });

    it('should correctly configure Local devnet network', () => {
      expect(LOCAL_CONFIG.networkId).toBe('undeployed');
      expect(LOCAL_CONFIG.indexer).toContain('127.0.0.1:8088');
      expect(LOCAL_CONFIG.node).toContain('127.0.0.1:9944');
      expect(LOCAL_CONFIG.proofServer).toContain('127.0.0.1:6300');
    });
  });
});
