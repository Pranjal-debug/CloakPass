export const relative = (_from: string, to: string) => to;
export const sep = '/';
export const isAbsolute = (p: string) => p.startsWith('/');
export const resolve = (...args: string[]) => args.join('/');
export const join = (...args: string[]) => args.join('/');
export default { relative, sep, isAbsolute, resolve, join };
