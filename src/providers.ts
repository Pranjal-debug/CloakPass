import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { type NetworkConfig } from './config.js';
import { type ImpureCircuits } from '../contract/index.js';

export type CloakPassCircuits = keyof ImpureCircuits<unknown>;
export type CloakPassProviders = MidnightProviders<any>;

/**
 * Builds Midnight providers for browser / dApp clients
 */
export function buildWebProviders(
  wallet: any,
  config: NetworkConfig,
  zkConfigProvider?: any,
): CloakPassProviders {
  const memoryStore = new Map<string, any>();
  const privateStateProvider = {
    get: async (key: string) => memoryStore.get(key) ?? null,
    set: async (key: string, value: any) => { memoryStore.set(key, value); },
    remove: async (key: string) => { memoryStore.delete(key); },
    clear: async () => { memoryStore.clear(); },
  };

  const zkProvider = zkConfigProvider || {
    getProverKey: async (_circuitId: string) => new Uint8Array(32),
    getVerifierKey: async (_circuitId: string) => new Uint8Array(32),
    getZkIR: async (_circuitId: string) => new Uint8Array(32),
  };

  return {
    privateStateProvider: privateStateProvider as any,
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider: zkProvider,
    proofProvider: httpClientProofProvider(config.proofServer, zkProvider as any),
    walletProvider: wallet,
    midnightProvider: wallet,
  };
}

/**
 * Universal provider builder for CloakPass.
 * Supports both Node.js (LevelDB, filesystem keys) and Web environments (in-memory vault, HTTP proof client).
 */
export function buildProviders(
  wallet: any,
  zkConfigPathOrProvider: string | any,
  config: NetworkConfig,
): CloakPassProviders {
  const isBrowser = typeof globalThis !== 'undefined' && 'window' in (globalThis as Record<string, any>);
  if (isBrowser || typeof zkConfigPathOrProvider !== 'string') {
    return buildWebProviders(
      wallet,
      config,
      typeof zkConfigPathOrProvider === 'object' ? zkConfigPathOrProvider : undefined,
    );
  }
  const zkConfigProvider = new NodeZkConfigProvider<CloakPassCircuits>(zkConfigPathOrProvider);
  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: `cloakpass-state-${Date.now()}`,
      privateStoragePasswordProvider: () => 'CloakPass-Security-Key-2026!',
      accountId: wallet?.getCoinPublicKey ? wallet.getCoinPublicKey() : new Uint8Array(32),
    }),
    publicDataProvider: indexerPublicDataProvider(
      config.indexer,
      config.indexerWS,
    ),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(
      config.proofServer,
      zkConfigProvider,
    ),
    walletProvider: wallet,
    midnightProvider: wallet,
  };
}
