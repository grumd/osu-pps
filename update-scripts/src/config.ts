import fs from 'node:fs';
import path from 'node:path';

/** Root of the update-scripts package (the folder containing config.json). */
export const PACKAGE_ROOT = path.resolve(import.meta.dirname, '..');

interface Config {
  client_id: number;
  client_secret: string;
  /** Legacy API v1 key, only used by fun-scripts. */
  apikey?: string;
  debug?: boolean;
}

function loadConfig(): Config {
  const configPath = path.join(PACKAGE_ROOT, 'config.json');
  if (!fs.existsSync(configPath)) {
    // The OAuth client throws when credentials are actually needed;
    // this allows running offline steps and tests without a config.json
    console.warn(`config.json not found at ${configPath} — see DOCUMENTATION.md`);
    return { client_id: 0, client_secret: '' };
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf8')) as Config;
}

export const config = loadConfig();

export const DEBUG = Boolean(config.debug) || process.argv.includes('--debug');
export const SKIP_PUSH = process.argv.includes('--no-push');
