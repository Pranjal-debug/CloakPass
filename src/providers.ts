import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { type NetworkConfig } from './config.js';
import { type ImpureCircuits } from '../contract/index.js';

export type CloakPassCircuits = keyof ImpureCircuits<unknown>;
export type CloakPassProviders = MidnightProviders<any>;

export function buildProviders(
  wallet: any,
  zkConfigPath: string,
  config: NetworkConfig,
): CloakPassProviders {
  const zkConfigProvider = new NodeZkConfigProvider<CloakPassCircuits>(zkConfigPath);
  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: `cloakpass-state-${Date.now()}`,
      privateStoragePasswordProvider: () => 'CloakPass-Security-Key-2026!',
      accountId: wallet.getCoinPublicKey ? wallet.getCoinPublicKey() : new Uint8Array(32),
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
