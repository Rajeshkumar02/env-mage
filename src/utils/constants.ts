/**
 * Env-Mage - Constants and Patterns
 * Regex patterns, error messages, and default values
 */

/**
 * Regex patterns for parsing and validation
 */
export const PATTERNS = {
  /**
   * Match valid .env key (alphanumeric, underscores, uppercase)
   * Examples: DATABASE_URL, API_KEY, PORT
   */
  ENV_KEY: /^[A-Z_][A-Z0-9_]*$/,

  /**
   * Match environment variable in code (process.env.VARIABLE)
   * Captures: process.env.VARIABLE_NAME
   */
  PROCESS_ENV: /process\.env\.([A-Z_][A-Z0-9_]*)/g,
  
  /**
   * Match environment variable access with optional chaining (process?.env?.VARIABLE or variations)
   * Captures all variations: process?.env?.VAR, process?.env.VAR, process.env?.VAR
   */
  PROCESS_ENV_OPTIONAL: /process\??\.env\??\.\??([A-Z_][A-Z0-9_]*)/g,

  /**
   * Match .env file line (KEY=VALUE)
   * Handles quoted values, comments, and empty lines
   */
  ENV_LINE: /^\s*([A-Z_][A-Z0-9_]*)=(.*)$/i,

  /**
   * Match comment lines
   */
  COMMENT: /^\s*#/,

  /**
   * Match empty lines
   */
  EMPTY: /^\s*$/,

  /**
   * Match quoted strings (single or double)
   */
  QUOTED: /^["'](.+)["']$/,

  /**
   * Match multiline values (with line continuation)
   */
  MULTILINE: /\\$/,

  /**
   * Match invalid characters in key
   */
  INVALID_KEY_CHARS: /[^A-Z0-9_]/i,

  /**
   * Match export statement (for bash scripts)
   */
  EXPORT_PREFIX: /^\s*export\s+/i,
};

/**
 * Default file names and paths
 */
export const DEFAULTS = {
  /**
   * Primary env file
   */
  ENV_FILE: '.env',

  /**
   * Example env file
   */
  ENV_EXAMPLE_FILE: '.env.example',

  /**
   * Common env file patterns
   */
  ENV_FILE_PATTERNS: [
    '.env',
    '.env.local',
    '.env.development',
    '.env.test',
    '.env.production',
    '.env.staging',
  ],

  /**
   * Production env file
   */
  ENV_PRODUCTION: '.env.production',

  /**
   * Local env file
   */
  ENV_LOCAL: '.env.local',

  /**
   * TypeScript definitions output
   */
  ENV_TYPES_FILE: 'env.d.ts',

  /**
   * Encrypted env file
   */
  ENV_ENCRYPTED_FILE: '.env.enc',

  /**
   * Backup suffix
   */
  BACKUP_SUFFIX: '.backup',

  /**
   * Default source directory for scanning
   */
  SCAN_DIR: './src',

  /**
   * Default encryption algorithm
   */
  ENCRYPTION_ALGORITHM: 'aes-256-gcm',
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  FILE_NOT_FOUND: (file: string) => `File not found: ${file}`,
  FILE_READ_ERROR: (file: string) => `Failed to read file: ${file}`,
  FILE_WRITE_ERROR: (file: string) => `Failed to write file: ${file}`,
  INVALID_ENV_FILE: (file: string) => `Invalid .env file format: ${file}`,
  INVALID_KEY: (key: string) => `Invalid environment variable key: ${key}`,
  DUPLICATE_KEY: (key: string, line: number) => `Duplicate key "${key}" at line ${line}`,
  EMPTY_KEY: (line: number) => `Empty key at line ${line}`,
  MISSING_KEYS: (keys: string[]) => `Missing keys in .env: ${keys.join(', ')}`,
  EXTRA_KEYS: (keys: string[]) => `extra keys in .env: ${keys.join(', ')}`,
  ENCRYPTION_FAILED: 'Encryption failed',
  DECRYPTION_FAILED: 'Decryption failed',
  INVALID_PASSPHRASE: 'Invalid passphrase provided',
  NO_FILES_SCANNED: 'No TypeScript/JavaScript files found to scan',
  NO_ENV_VARS_FOUND: 'No process.env usage found in code',
  NO_ENV_FILE: 'No .env file found. Run "env-mage init" first',
};

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  INIT_COMPLETE: (count: number) => `✅ Created .env.example with ${count} keys`,
  VALIDATION_PASSED: (count: number) => `✅ All keys are valid between files`,
  SYNC_COMPLETE: (count: number, backup: boolean = false) =>
    backup ? `✅ Synced ${count} new keys with backup created` : `✅ Synced ${count} new keys`,
  DIFF_COMPLETE: `✅ Files are identical. No differences found.`,
  DIFF_WITH_CHANGES: (added: string[], removed: string[], changed: string[]) => {
    const parts = [];
    if (added.length) parts.push(`Added: ${added.join(', ')}`);
    if (removed.length) parts.push(`Removed: ${removed.join(', ')}`);
    if (changed.length) parts.push(`Changed: ${changed.join(', ')}`);
    return parts.join(' ');
  },
  TYPEGEN_COMPLETE: (file: string) => `✅ Generated TypeScript types in ${file}`,
  SCAN_COMPLETE: (count: number) => `✅ Found ${count} environment variable usages`,
  LINT_PASSED: (count: number) => `✅ File is valid (${count} keys)`,
  ENCRYPTION_COMPLETE: (file: string) => `✅ Encrypted file saved as ${file}`,
  DECRYPTION_COMPLETE: (file: string) => `✅ Decrypted file saved as ${file}`,
};

/**
 * Warning messages
 */
export const WARNING_MESSAGES = {
  MISSING_KEYS: (count: number, keys: string[]) =>
    `⚠️  ${count} missing keys: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`,
  EXTRA_KEYS: (count: number, keys: string[]) =>
    `⚠️  ${count} extra keys: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`,
  UNQUOTED_VALUE: (line: number) => `⚠️  Unquoted value with special chars at line ${line}`,
  UNUSUAL_FORMAT: (line: number) => `⚠️  Unusual format at line ${line}`,
  NO_BACKUP_CREATED: 'No backup created (file may not exist)',
};

/**
 * Suggestion messages
 */
export const SUGGESTIONS = {
  USE_INIT: 'Run "env-mage init" to generate .env.example',
  USE_VALIDATE: 'Run "env-mage validate" to check for mismatches',
  USE_SYNC: 'Run "env-mage sync" to synchronize environment files',
  USE_LINT: 'Run "env-mage lint" to check for syntax errors',
  ADD_TO_EXAMPLE: 'Add this key to .env.example',
  REMOVE_FROM_ENV: 'Remove this key from .env if no longer needed',
  USE_QUOTES: 'Consider quoting values with special characters',
  FIX_DUPLICATE: 'Remove or rename one of the duplicate keys',
  USE_TYPEGEN: 'Run "env-mage typegen" to generate TypeScript types',
};

/**
 * Environment variable type mappings
 */
export const ENV_TYPES = {
  PORT: 'string',
  DATABASE_URL: 'string',
  API_KEY: 'string',
  API_SECRET: 'string',
  SECRET: 'string',
  TOKEN: 'string',
  PASSPHRASE: 'string',
  TIMEOUT: 'number',
  MAX_RETRIES: 'number',
  DEBUG: 'boolean',
  ENABLED: 'boolean',
  PRODUCTION: 'boolean',
};

/**
 * Common env variable prefixes and their contexts
 */
export const ENV_PREFIXES = {
  DATABASE: ['DATABASE_URL', 'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD'],
  API: ['API_KEY', 'API_SECRET', 'API_URL', 'API_BASE_URL', 'API_TIMEOUT'],
  AUTH: ['AUTH_SECRET', 'JWT_SECRET', 'SESSION_SECRET', 'OAUTH_CLIENT_ID'],
  REDIS: ['REDIS_URL', 'REDIS_HOST', 'REDIS_PORT'],
  S3: ['S3_BUCKET', 'S3_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
  MAIL: ['MAIL_HOST', 'MAIL_PORT', 'MAIL_USER', 'MAIL_PASSWORD'],
  SENTRY: ['SENTRY_DSN', 'SENTRY_ENVIRONMENT'],
};

/**
 * Reserved env variables (should not be modified)
 */
export const RESERVED_VARS = new Set([
  'NODE_ENV',
  'PATH',
  'HOME',
  'USER',
  'SHELL',
  'LANG',
  'LC_ALL',
]);

/**
 * Maximum file sizes (in bytes)
 */
export const MAX_SIZES = {
  ENV_FILE: 10 * 1024 * 1024, // 10MB
  SCAN_FILE: 5 * 1024 * 1024, // 5MB
};

/**
 * Exit codes
 */
export const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  COMMAND_ERROR: 2,
  FILE_NOT_FOUND: 3,
  VALIDATION_ERROR: 4,
  ENCRYPTION_ERROR: 5,
  PERMISSION_ERROR: 6,
};

/**
 * Timeout durations (in ms)
 */
export const TIMEOUTS = {
  FILE_OPERATION: 5000,
  ENCRYPTION: 10000,
  SCAN: 30000,
};
