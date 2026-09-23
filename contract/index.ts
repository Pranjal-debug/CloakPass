import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { witnesses } from './witnesses.js';

export {
  Contract,
  ledger,
  pureCircuits,
  type Witnesses,
  type Ledger,
  type ImpureCircuits,
  type PureCircuits,
} from './managed/cloakpass/contract/index.js';
import { Contract } from './managed/cloakpass/contract/index.js';

const __filename = fileURLToPath(import.meta.url);
const currentDir = path.dirname(__filename);
export const zkConfigPath = path.resolve(currentDir, 'managed', 'cloakpass');

export const CompiledCloakPassContract: any = (CompiledContract.make as any)(
  'CloakPassContract',
  Contract,
).pipe(
  (CompiledContract.withWitnesses as any)(witnesses),
  (CompiledContract.withCompiledFileAssets as any)(zkConfigPath),
);
