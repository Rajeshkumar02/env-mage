/**
 * Env-Mage - Type Definitions
 * Core interfaces and types used throughout the CLI
 */

/**
 * Parsed environment variables as key-value pairs
 */
export type EnvObject = Record<string, string>;

/**
 * Represents a key-value pair with its source
 */
export interface EnvEntry {
  key: string;
  value: string;
  line?: number;
}

/**
 * Validation result for a single environment file
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  keys: Set<string>;
}

/**
 * Validation error details
 */
export interface ValidationError {
  type: 'syntax' | 'duplicate' | 'empty_key' | 'invalid_format';
  line: number;
  message: string;
  suggestion?: string;
}

/**
 * Validation warning details
 */
export interface ValidationWarning {
  type: 'missing_key' | 'extra_key' | 'unquoted_value' | 'unusual_format';
  key: string;
  message: string;
  suggestion?: string;
}

/**
 * Comparison result between two env files
 */
export interface DiffResult {
  identical: boolean;
  added: DiffEntry[];
  removed: DiffEntry[];
  modified: DiffEntry[];
  matching: DiffEntry[];
}

/**
 * Single diff entry
 */
export interface DiffEntry {
  key: string;
  oldValue?: string;
  newValue?: string;
}

/**
 * Scan result for process.env usage in code
 */
export interface ScanResult {
  found: ScanMatch[];
  missing: string[];
  unused: string[];
  totalMatches: number;
  totalVariables: number;
}

/**
 * Single scan match in code
 */
export interface ScanMatch {
  variable: string;
  file: string;
  line: number;
  column: number;
  context: string;
}

/**
 * Lint result for env file
 */
export interface LintResult {
  valid: boolean;
  errors: LintError[];
  warnings: LintWarning[];
  stats: {
    totalLines: number;
    validLines: number;
    errorCount: number;
    warningCount: number;
  };
}

/**
 * Lint error details
 */
export interface LintError {
  line: number;
  type: 'duplicate_key' | 'syntax_error' | 'invalid_chars' | 'empty_line';
  message: string;
  suggestion?: string;
}

/**
 * Lint warning details
 */
export interface LintWarning {
  line: number;
  type: 'unquoted_value' | 'whitespace' | 'unusual_format';
  message: string;
  suggestion?: string;
}

/**
 * Sync options
 */
export interface SyncOptions {
  source: string;
  target: string;
  force?: boolean;
  backup?: boolean;
  verbose?: boolean;
}

/**
 * Sync result
 */
export interface SyncResult {
  synced: number;
  skipped: number;
  total: number;
  backupPath?: string;
  errors: SyncError[];
}

/**
 * Sync error details
 */
export interface SyncError {
  key: string;
  message: string;
}

/**
 * Encryption options
 */
export interface EncryptOptions {
  file: string;
  passphrase?: string;
  algorithm?: string;
  backup?: boolean;
}

/**
 * Encryption result
 */
export interface EncryptResult {
  success: boolean;
  inputFile: string;
  outputFile: string;
  algorithm: string;
  backup?: string;
  message: string;
}

/**
 * Decryption options
 */
export interface DecryptOptions {
  file: string;
  passphrase?: string;
  outputFile?: string;
  backup?: boolean;
}

/**
 * Decryption result
 */
export interface DecryptResult {
  success: boolean;
  inputFile: string;
  outputFile: string;
  backup?: string;
  message: string;
}

/**
 * TypeGen options
 */
export interface TypeGenOptions {
  envFile: string;
  outputFile: string;
  optional?: boolean;
}

/**
 * TypeGen result
 */
export interface TypeGenResult {
  success: boolean;
  outputFile: string;
  typeCount: number;
  content: string;
}

/**
 * Common CLI command context
 */
export interface CommandContext {
  verbose?: boolean;
  json?: boolean;
  force?: boolean;
  dry?: boolean;
}

/**
 * Command execution result
 * Enhanced with file information for better cross-platform support
 */
export interface CommandResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: Error;
  envFileName?: string; // Name of the environment file (without path)
  exampleFileName?: string; // Name of the example/template file (without path)
  filePath?: string; // Absolute path used in the operation
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  colors: boolean;
  json: boolean;
}

/**
 * Parse options
 */
export interface ParseOptions {
  trim: boolean;
  expandEnv: boolean;
  interpolate: boolean;
}
