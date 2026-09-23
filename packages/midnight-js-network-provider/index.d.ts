export interface NetworkEndpoints {
  networkId: string;
  indexer: string;
  indexerWS: string;
  node: string;
  proofServer: string;
  faucet?: string;
  explorer: string;
}

export interface NetworkProvider {
  readonly networkId: string;
  readonly endpoints: NetworkEndpoints;
  getIndexerUrl(): string;
  getIndexerWsUrl(): string;
  getNodeRpcUrl(): string;
  getProofServerUrl(): string;
  getExplorerUrl(contractAddress?: string): string;
  queryIndexerStatus(): Promise<{ blockHeight: number; blockHash: string; status: string }>;
}

export declare const NETWORK_CONFIGS: Record<string, NetworkEndpoints>;
export declare class DefaultNetworkProvider implements NetworkProvider {
  readonly networkId: string;
  readonly endpoints: NetworkEndpoints;
  constructor(networkId?: string, customEndpoints?: Partial<NetworkEndpoints>);
  getIndexerUrl(): string;
  getIndexerWsUrl(): string;
  getNodeRpcUrl(): string;
  getProofServerUrl(): string;
  getExplorerUrl(contractAddress?: string): string;
  queryIndexerStatus(): Promise<{ blockHeight: number; blockHash: string; status: string }>;
}

export declare function createNetworkProvider(networkId?: string, customEndpoints?: Partial<NetworkEndpoints>): NetworkProvider;
