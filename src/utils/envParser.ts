/**
 * Env-Mage - Environment File Parser
 * Parse and validate .env file format
 */

import { EnvObject, EnvEntry } from '../types';
import { PATTERNS } from './constants';

/**
 * Parse .env file content into key-value pairs
 * Handles quoted values, multiline values, and comments
 *
 * @param content - Raw .env file content
 * @returns Parsed environment object
 */
export const parseEnvContent = (content: string): EnvObject => {
  const lines = content.split('\n');
  const env: EnvObject = {};
  let currentKey: string | null = null;
  let currentValue = '';

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Handle multiline values (line continuation with backslash)
    if (currentKey !== null) {
      if (line.endsWith('\\')) {
        currentValue += line.slice(0, -1) + '\n';
        continue;
      } else {
        currentValue += line;
        env[currentKey] = processValue(currentValue);
        currentKey = null;
        currentValue = '';
        continue;
      }
    }

    // Remove leading/trailing whitespace
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      continue;
    }

    // Skip comments
    if (PATTERNS.COMMENT.test(trimmed)) {
      continue;
    }

    // Match KEY=VALUE pattern
    const match = trimmed.match(PATTERNS.ENV_LINE);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      // Handle export prefix (export KEY=VALUE)
      const exportMatch = trimmed.match(/^\s*export\s+([^=]+)=(.*)$/i);
      if (exportMatch) {
        const exportKey = exportMatch[1].trim();
        value = exportMatch[2].trim();
        env[exportKey] = processValue(value);
        continue;
      }

      // Check for line continuation
      if (value.endsWith('\\')) {
        currentKey = key;
        currentValue = value.slice(0, -1);
        continue;
      }

      env[key] = processValue(value);
    }
  }

  // Handle any remaining multiline value
  if (currentKey !== null) {
    env[currentKey] = processValue(currentValue);
  }

  return env;
};

/**
 * Process a single value from .env file
 * Handles quoted strings and escaping
 *
 * @param value - Raw value string
 * @returns Processed value
 */
const processValue = (value: string): string => {
  // Remove quotes if present (both single and double)
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
};

/**
 * Validate .env file content
 * Checks for syntax errors, duplicate keys, etc.
 *
 * @param content - Raw .env file content
 * @returns Array of validation errors
 */
export const validateEnvContent = (content: string): string[] => {
  const lines = content.split('\n');
  const errors: string[] = [];
  const keys = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    let line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || PATTERNS.COMMENT.test(trimmed)) {
      continue;
    }

    // Check for multiline continuation
    if (line.endsWith('\\')) {
      line = line.slice(0, -1).trim();
    }

    // Match KEY=VALUE pattern
    const match = trimmed.match(PATTERNS.ENV_LINE);
    if (!match) {
      // Try export syntax
      const exportMatch = trimmed.match(/^\s*export\s+([^=]+)=(.*)$/i);
      if (!exportMatch) {
        errors.push(`Line ${lineNum}: Invalid syntax - expected KEY=VALUE format`);
      } else {
        const key = exportMatch[1].trim();
        validateKey(key, lineNum, keys, errors);
      }
      continue;
    }

    const key = match[1].trim();
    const value = match[2].trim();

    // Validate key
    validateKey(key, lineNum, keys, errors);

    // Validate value syntax (unquoted values with spaces)
    if (value && !isQuoted(value) && /\s/.test(value)) {
      errors.push(
        `Line ${lineNum}: Unquoted value with spaces - consider quoting: ${key}="${value}"`
      );
    }
  }

  return errors;
};

/**
 * Validate a single environment variable key
 *
 * @param key - Key to validate
 * @param lineNum - Line number for error reporting
 * @param keys - Set of already seen keys
 * @param errors - Error accumulator
 */
const validateKey = (key: string, lineNum: number, keys: Set<string>, errors: string[]): void => {
  // Check for empty key
  if (!key) {
    errors.push(`Line ${lineNum}: Empty key`);
    return;
  }

  // Check for invalid characters
  if (!PATTERNS.ENV_KEY.test(key)) {
    errors.push(
      `Line ${lineNum}: Invalid key "${key}" - use uppercase letters, numbers, and underscores`
    );
    return;
  }

  // Check for duplicates
  if (keys.has(key)) {
    errors.push(`Line ${lineNum}: Duplicate key "${key}"`);
    return;
  }

  keys.add(key);
};

/**
 * Check if value is quoted
 *
 * @param value - Value to check
 * @returns True if value is quoted
 */
const isQuoted = (value: string): boolean => {
  return (
    (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))
  );
};

/**
 * Parse .env file entries with line numbers
 * Useful for error reporting
 *
 * @param content - Raw .env file content
 * @returns Array of environment entries with line numbers
 */
export const parseEnvEntries = (content: string): EnvEntry[] => {
  const lines = content.split('\n');
  const entries: EnvEntry[] = [];
  let currentLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    currentLine = i + 1;

    // Skip empty lines and comments
    if (!trimmed || PATTERNS.COMMENT.test(trimmed)) {
      continue;
    }

    // Match KEY=VALUE pattern
    const match = trimmed.match(PATTERNS.ENV_LINE);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      // Handle export syntax
      const exportMatch = trimmed.match(/^\s*export\s+([^=]+)=(.*)$/i);
      if (exportMatch) {
        value = exportMatch[2].trim();
      }

      entries.push({
        key,
        value: processValue(value),
        line: currentLine,
      });
    }
  }

  return entries;
};

/**
 * Stringify environment object back to .env format
 *
 * @param env - Environment object
 * @returns Formatted .env content
 */
export const stringifyEnv = (env: EnvObject): string => {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(env)) {
    const quotedValue = shouldQuoteValue(value) ? `"${value}"` : value;
    lines.push(`${key}=${quotedValue}`);
  }

  return lines.join('\n');
};

/**
 * Check if value should be quoted in .env file
 *
 * @param value - Value to check
 * @returns True if value should be quoted
 */
const shouldQuoteValue = (value: string): boolean => {
  // Quote if contains spaces, special characters, or equals sign
  return /[\s='"$`\\\n]/.test(value);
};

/**
 * Merge multiple environment objects
 * Later keys override earlier ones
 *
 * @param envs - Array of environment objects to merge
 * @returns Merged environment object
 */
export const mergeEnv = (...envs: EnvObject[]): EnvObject => {
  return envs.reduce((acc, env) => ({ ...acc, ...env }), {});
};

/**
 * Filter environment object by keys
 *
 * @param env - Environment object
 * @param keys - Keys to include
 * @returns Filtered environment object
 */
export const filterEnv = (env: EnvObject, keys: string[]): EnvObject => {
  const result: EnvObject = {};
  const keySet = new Set(keys);

  for (const [key, value] of Object.entries(env)) {
    if (keySet.has(key)) {
      result[key] = value;
    }
  }

  return result;
};

/**
 * Get missing keys between two environment objects
 *
 * @param target - Target environment
 * @param source - Source environment
 * @returns Array of missing keys
 */
export const getMissingKeys = (target: EnvObject, source: EnvObject): string[] => {
  return Object.keys(source).filter((key) => !(key in target));
};

/**
 * Get extra keys in target compared to source
 *
 * @param target - Target environment
 * @param source - Source environment
 * @returns Array of extra keys
 */
export const getExtraKeys = (target: EnvObject, source: EnvObject): string[] => {
  return Object.keys(target).filter((key) => !(key in source));
};

/**
 * Get keys that exist in both but have different values
 *
 * @param env1 - First environment
 * @param env2 - Second environment
 * @returns Array of keys with different values
 */
export const getDifferentKeys = (env1: EnvObject, env2: EnvObject): string[] => {
  const keys = new Set([...Object.keys(env1), ...Object.keys(env2)]);

  return Array.from(keys).filter((key) => env1[key] !== env2[key]);
};

/**
 * Extract variables used from a string (like process.env.VAR)
 * Useful for scanning code
 *
 * @param code - Code string to scan
 * @returns Array of variable names found
 */
export const extractVariablesFromCode = (code: string): string[] => {
  const matches = code.match(PATTERNS.PROCESS_ENV);
  if (!matches) {
    return [];
  }

  // Remove duplicates
  return Array.from(new Set(matches.map((match) => match.replace('process.env.', ''))));
};
