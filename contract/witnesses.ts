import { type Ledger, type Witnesses } from './managed/cloakpass/contract/index.js';
import { type WitnessContext } from '@midnight-ntwrk/compact-runtime';

/**
 * Off-chain private state for CloakPass.
 * Holds secrets, blinding salts, and user credentials on the client device.
 * Never disclosed to the network or ledger.
 */
export type CloakPassPrivateState = {
  secret: Uint8Array;
  salt: Uint8Array;
};

export const createCloakPassPrivateState = (
  secret: Uint8Array = new Uint8Array(32),
  salt: Uint8Array = new Uint8Array(32),
): CloakPassPrivateState => ({
  secret,
  salt,
});

export const witnesses: Witnesses<CloakPassPrivateState> = {
  pass_secret: ({ privateState }: WitnessContext<Ledger, CloakPassPrivateState>): [CloakPassPrivateState, Uint8Array] => {
    return [privateState, privateState.secret];
  },
  pass_salt: ({ privateState }: WitnessContext<Ledger, CloakPassPrivateState>): [CloakPassPrivateState, Uint8Array] => {
    return [privateState, privateState.salt];
  },
  get_pass_path: (
    { ledger, privateState }: WitnessContext<Ledger, CloakPassPrivateState>,
    commitment: Uint8Array,
  ): [CloakPassPrivateState, any] => {
    // Find the Merkle membership path from the public ledger's HistoricMerkleTree
    const path = ledger.passCommitments.findPathForLeaf(commitment);
    if (!path) {
      throw new Error(`Commitment leaf not found in passCommitments Merkle tree`);
    }
    return [privateState, path];
  },
};

export type { Ledger, WitnessContext };
