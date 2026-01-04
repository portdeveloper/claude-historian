const DEBUG = process.env.DEBUG === '1';

export function debug(...args: unknown[]) {
  if (DEBUG) console.error('[debug]', ...args);
}
