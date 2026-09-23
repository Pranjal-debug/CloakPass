export const readFile = async () => new Uint8Array(32);
export const writeFile = async () => {};
export const access = async () => {};
export const mkdir = async () => {};
export const stat = async () => ({ isFile: () => true, isDirectory: () => false });
export default { readFile, writeFile, access, mkdir, stat };
