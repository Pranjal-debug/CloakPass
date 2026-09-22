#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const isWindows = process.platform === 'win32';
const rootDir = process.cwd();

const args = process.argv.slice(2);
const sourceFile = path.resolve(rootDir, 'contract', 'cloakpass.compact');
const targetDir = path.resolve(rootDir, 'contract', 'managed', 'cloakpass');

if (!fs.existsSync(sourceFile)) {
  console.error(`Error: source file not found: ${sourceFile}`);
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });

function toWslPath(winPath) {
  const norm = path.resolve(winPath).replace(/\\/g, '/');
  const match = norm.match(/^([a-zA-Z]):\/(.*)$/);
  if (match) {
    const drive = match[1].toLowerCase();
    const rest = match[2];
    return `/mnt/${drive}/${rest}`;
  }
  return norm;
}

let cmd, cmdArgs;
if (isWindows) {
  cmd = 'wsl';
  const wslSource = toWslPath(sourceFile);
  const wslTarget = toWslPath(targetDir);
  const extraFlags = args.filter(a => a.startsWith('-'));
  cmdArgs = ['bash', '-c', `~/.local/bin/compact compile ${extraFlags.join(' ')} "${wslSource}" "${wslTarget}"`];
} else {
  cmd = 'compact';
  cmdArgs = ['compile', ...args, sourceFile, targetDir];
}

console.log(`Executing Compact compiler...`);
console.log(`Source: ${sourceFile}`);
console.log(`Target: ${targetDir}`);

const result = spawnSync(cmd, cmdArgs, { stdio: 'inherit' });

if (result.status !== 0) {
  console.error(`Compilation failed with exit code ${result.status}`);
  process.exit(result.status || 1);
}

console.log(`\nCompilation successful! Managed directory updated at ${targetDir}`);
if (fs.existsSync(path.join(targetDir, 'zkir'))) {
  const circuits = fs.readdirSync(path.join(targetDir, 'zkir')).filter(f => f.endsWith('.zkir'));
  console.log(`Generated ZKIR circuits: ${circuits.join(', ')}`);
}
if (fs.existsSync(path.join(targetDir, 'keys'))) {
  const keys = fs.readdirSync(path.join(targetDir, 'keys'));
  console.log(`Generated cryptographic keys: ${keys.join(', ')}`);
}
