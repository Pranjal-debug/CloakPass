#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';

function toWslPath(arg) {
  if (typeof arg !== 'string') return arg;
  if (!arg.includes('\\') && !arg.includes(':') && !arg.includes('/')) return arg;
  // If it's a file or directory path
  const resolved = path.resolve(arg).replace(/\\/g, '/');
  const match = resolved.match(/^([a-zA-Z]):\/(.*)$/);
  if (match) {
    return `/mnt/${match[1].toLowerCase()}/${match[2]}`;
  }
  return arg;
}

const isWindows = process.platform === 'win32';
const rawArgs = process.argv.slice(2);

if (isWindows) {
  const convertedArgs = rawArgs.map(arg => {
    if (arg.startsWith('-')) return arg;
    if (arg === 'compile' || arg === 'check' || arg === 'list' || arg === 'update' || arg === 'version') return arg;
    return `"${toWslPath(arg)}"`;
  });
  const cmd = `~/.local/bin/compact ${convertedArgs.join(' ')}`;
  const res = spawnSync('wsl', ['bash', '-c', cmd], { stdio: 'inherit' });
  process.exit(res.status ?? 0);
} else {
  const res = spawnSync('compact', rawArgs, { stdio: 'inherit' });
  process.exit(res.status ?? 0);
}
