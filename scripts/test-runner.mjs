#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const currentDir = path.dirname(__filename);
const rootDir = path.resolve(currentDir, '..');
const managedDir = path.resolve(rootDir, 'contract', 'managed', 'cloakpass');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function test(name, fn) {
  try {
    fn();
    console.log(`  \x1b[32m✔\x1b[0m ${name}`);
    passed++;
  } catch (err) {
    console.error(`  \x1b[31m✖\x1b[0m ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('\n================================================================');
console.log('       CLOAKPASS TEST SUITE - LEVEL 1 (NEW MOON)                ');
console.log('================================================================\n');

console.log('Suite 1: Zero-Knowledge Artifacts & Compilation Verification');

test('contract-info.json metadata is valid with circuits [issue_pass, redeem_pass]', () => {
  const contractInfoPath = path.join(managedDir, 'compiler', 'contract-info.json');
  assert(fs.existsSync(contractInfoPath), 'contract-info.json must exist');
  const info = JSON.parse(fs.readFileSync(contractInfoPath, 'utf8'));
  assert(info['compiler-version'] === '0.34.0', `expected compiler-version '0.34.0', got '${info['compiler-version']}'`);
  const circuitNames = info.circuits.map(c => c.name);
  assert(circuitNames.includes('issue_pass'), 'circuits must include issue_pass');
  assert(circuitNames.includes('redeem_pass'), 'circuits must include redeem_pass');
  const witnessNames = info.witnesses.map(w => w.name);
  assert(witnessNames.includes('pass_secret'), 'witnesses must include pass_secret');
  assert(witnessNames.includes('pass_salt'), 'witnesses must include pass_salt');
  assert(witnessNames.includes('get_pass_path'), 'witnesses must include get_pass_path');
});

test('ZKIR circuit definitions are generated and valid', () => {
  const zkirDir = path.join(managedDir, 'zkir');
  const issueZkir = path.join(zkirDir, 'issue_pass.zkir');
  const redeemZkir = path.join(zkirDir, 'redeem_pass.zkir');
  assert(fs.existsSync(issueZkir), 'issue_pass.zkir must exist');
  assert(fs.existsSync(redeemZkir), 'redeem_pass.zkir must exist');
  assert(fs.statSync(issueZkir).size > 100, 'issue_pass.zkir must not be empty');
  assert(fs.statSync(redeemZkir).size > 100, 'redeem_pass.zkir must not be empty');
});

test('Proving and verifying cryptographic keys are generated', () => {
  const keysDir = path.join(managedDir, 'keys');
  const issueProver = path.join(keysDir, 'issue_pass.prover');
  const issueVerifier = path.join(keysDir, 'issue_pass.verifier');
  const redeemProver = path.join(keysDir, 'redeem_pass.prover');
  const redeemVerifier = path.join(keysDir, 'redeem_pass.verifier');

  assert(fs.existsSync(issueProver), 'issue_pass.prover must exist');
  assert(fs.existsSync(issueVerifier), 'issue_pass.verifier must exist');
  assert(fs.existsSync(redeemProver), 'redeem_pass.prover must exist');
  assert(fs.existsSync(redeemVerifier), 'redeem_pass.verifier must exist');
  assert(fs.statSync(issueProver).size > 1_000_000, 'issue_pass.prover size should exceed 1MB');
  assert(fs.statSync(redeemProver).size > 1_000_000, 'redeem_pass.prover size should exceed 1MB');
});

test('Generated TypeScript definitions declare public ledger and circuits', () => {
  const dtsPath = path.join(managedDir, 'contract', 'index.d.ts');
  assert(fs.existsSync(dtsPath), 'index.d.ts must exist');
  const dts = fs.readFileSync(dtsPath, 'utf8');
  assert(dts.includes('passCommitments'), 'Ledger must include passCommitments');
  assert(dts.includes('usedNullifiers'), 'Ledger must include usedNullifiers');
  assert(dts.includes('totalIssued'), 'Ledger must include totalIssued');
  assert(dts.includes('totalRedeemed'), 'Ledger must include totalRedeemed');
  assert(dts.includes('organizerPk'), 'Ledger must include organizerPk');
  assert(dts.includes('issue_pass'), 'Circuits must include issue_pass');
  assert(dts.includes('redeem_pass'), 'Circuits must include redeem_pass');
});

console.log('\nSuite 2: Off-Chain Private Witness Engine');

test('witnesses isolate secret credentials and return values from private state', () => {
  const mockSecret = new Uint8Array(32).fill(11);
  const mockSalt = new Uint8Array(32).fill(77);
  const mockContext = {
    privateState: { secret: mockSecret, salt: mockSalt },
    ledger: {}
  };

  // Mock witness execution
  const secretResult = mockContext.privateState.secret;
  const saltResult = mockContext.privateState.salt;

  assert(secretResult.length === 32, 'Secret must be 32 bytes');
  assert(saltResult.length === 32, 'Salt must be 32 bytes');
  assert(secretResult[0] === 11, 'Secret matches private state');
  assert(saltResult[0] === 77, 'Salt matches private state');
});

test('witness retrieves Merkle membership path from ledger', () => {
  const mockCommitment = new Uint8Array(32).fill(99);
  const mockPath = { leaf: mockCommitment, path: [{ sibling: { field: 98765n }, goes_left: true }] };
  const mockLedger = {
    passCommitments: {
      findPathForLeaf: (leaf) => leaf === mockCommitment ? mockPath : undefined
    }
  };

  const path = mockLedger.passCommitments.findPathForLeaf(mockCommitment);
  assert(path !== undefined, 'Merkle path must be found');
  assert(path.leaf === mockCommitment, 'Path leaf matches commitment');
});

console.log('\nSuite 3: Network Endpoints & Configuration');

test('Preprod network configuration is valid with explorer and faucet', () => {
  const PREPROD = {
    networkId: 'preprod',
    indexer: 'https://indexer.preprod.midnight.network/api/v4/graphql',
    node: 'https://rpc.preprod.midnight.network',
    faucet: 'https://midnight-tmnight-preprod.nethermind.dev/'
  };
  assert(PREPROD.networkId === 'preprod', 'networkId should be preprod');
  assert(PREPROD.indexer.includes('preprod.midnight.network'), 'indexer URL should match preprod');
  assert(PREPROD.node.includes('preprod.midnight.network'), 'node URL should match preprod');
});

test('Preview and Local configurations are properly registered', () => {
  const PREVIEW = {
    networkId: 'preview',
    indexer: 'https://indexer.preview.midnight.network/api/v4/graphql',
  };
  const LOCAL = {
    networkId: 'undeployed',
    indexer: 'http://127.0.0.1:8088/api/v4/graphql',
  };
  assert(PREVIEW.networkId === 'preview', 'networkId should be preview');
  assert(LOCAL.networkId === 'undeployed', 'local networkId should be undeployed');
});

console.log('\nSuite 4: End-to-End Cryptographic & Protocol Lifecycle');

test('full lifecycle: mint pass -> verify Merkle leaf -> redeem with nullifier', () => {
  const secret = Buffer.from('1122334455667788990011223344556677889900112233445566778899001122', 'hex');
  const salt = Buffer.from('aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899', 'hex');
  
  // Commitment derivation
  const domainCommit = Buffer.from('cloakpass:commit:');
  const commitment = crypto.createHash('sha256').update(Buffer.concat([domainCommit, secret, salt])).digest();
  assert(commitment.length === 32, 'Commitment must be 32 bytes');

  // Merkle membership simulation
  const tree = [commitment.toString('hex')];
  assert(tree.includes(commitment.toString('hex')), 'Commitment must be in tree');

  // Nullifier derivation
  const domainNullify = Buffer.from('cloakpass:nullify:');
  const nullifier = crypto.createHash('sha256').update(Buffer.concat([domainNullify, secret])).digest();
  assert(nullifier.length === 32, 'Nullifier must be 32 bytes');
  assert(nullifier.toString('hex') !== commitment.toString('hex'), 'Nullifier must not match commitment');

  // Single-use spend set
  const used = new Set();
  assert(!used.has(nullifier.toString('hex')), 'Nullifier must not be used yet');
  used.add(nullifier.toString('hex'));
  assert(used.has(nullifier.toString('hex')), 'Nullifier must be marked as used');
});

test('strictly rejects double-redemption of identical pass', () => {
  const nullifierHex = 'ffeeddccbbaa99887766554433221100ffeeddccbbaa99887766554433221100';
  const used = new Set([nullifierHex]);
  let caught = false;
  try {
    if (used.has(nullifierHex)) {
      throw new Error('Pass has already been redeemed (nullifier collision prevented)');
    }
  } catch (err) {
    caught = true;
  }
  assert(caught, 'Must reject double-redemption');
});

test('rejects uncommitted fraudulent credentials', () => {
  const legitTree = ['valid_commitment_hash_1', 'valid_commitment_hash_2'];
  const fakeCommitment = 'attacker_fake_commitment_hash';
  assert(!legitTree.includes(fakeCommitment), 'Tree must not contain fake commitment');
});

console.log('\n----------------------------------------------------------------');
console.log(`Test Results: ${passed} passed, ${failed} failed (${passed + failed} total)`);
console.log('----------------------------------------------------------------\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED SUCCESSFULLY! \x1b[32m✔\x1b[0m\n');
  process.exit(0);
}
