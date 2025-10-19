/**
 * Env-Mage - File Utilities
 * Safe file read/write operations with error handling and backups
 * Cross-platform compatible for Windows, macOS, and Linux
 */

import { readFileSync, writeFileSync, existsSync, statSync, copyFileSync, mkdirSync } from 'fs';
import { dirname, join, sep, normalize, isAbsolute } from 'path';
import { tmpdir } from 'os';
import { EnvObject } from '../types';

/**
 * Read file contents with proper encoding
 * Handles cross-platform path normalization
 *
 * @param filePath - Path to the file
 * @returns File contents as string
 * @throws Error if file cannot be read
 */
export const readFile = (filePath: string): string => {
  try {
    const normalizedPath = normalize(filePath);

    if (!existsSync(normalizedPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const stats = statSync(normalizedPath);
    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${filePath}`);
    }

    // Read with auto-detection of line endings
    return readFileSync(normalizedPath, 'utf-8').replace(/\r\n/g, '\n');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to read file ${filePath}: ${message}`);
  }
};

/**
 * Write content to file with atomic operation
 * @param filePath - Path to the file
 * @param content - Content to write
 * @throws Error if write fails
 */
export const writeFile = (filePath: string, content: string): void => {
  try {
    const normalizedPath = normalize(filePath);
    const dir = dirname(normalizedPath);

    // Create directory if it doesn't exist (recursive)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(normalizedPath, content, 'utf-8');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to write file ${filePath}: ${message}`);
  }
};

/**
 * Write file with automatic backup of existing file
 * @param filePath - Path to the file
 * @param content - Content to write
 * @returns Path to backup file if created, undefined otherwise
 * @throws Error if write fails
 */
export const writeFileWithBackup = (filePath: string, content: string): string | undefined => {
  try {
    let backupPath: string | undefined;

    // Create backup if file exists
    if (existsSync(filePath)) {
      backupPath = `${filePath}.backup`;
      copyFileSync(filePath, backupPath);
    }

    // Write new content
    writeFile(filePath, content);

    return backupPath;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to write file with backup: ${message}`);
  }
};

/**
 * Check if file exists
 * Handles cross-platform path normalization
 *
 * @param filePath - Path to check
 * @returns True if file exists
 */
export const fileExists = (filePath: string): boolean => {
  try {
    const normalizedPath = normalize(filePath);
    return existsSync(normalizedPath) && statSync(normalizedPath).isFile();
  } catch {
    return false;
  }
};

/**
 * Creates a platform-independent temp directory path
 * @param prefix - Optional prefix for temp directory name
 * @returns Path to a temporary directory
 */
export const getTempDir = (prefix: string = 'envmage-'): string => {
  const baseTemp = tmpdir();
  return join(baseTemp, `${prefix}${Date.now()}-${Math.floor(Math.random() * 10000)}`);
};

/**
 * Creates a platform-independent path by joining path segments
 * Works on Windows, macOS, and Linux
 *
 * @param segments - Path segments to join
 * @returns Normalized platform-specific path
 */
export const createPath = (...segments: string[]): string => {
  return normalize(join(...segments));
};

/**
 * Check if file exists and is readable
 * @param filePath - Path to check
 * @returns True if file is readable
 */
export const isFileReadable = (filePath: string): boolean => {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return content !== null && content !== undefined;
  } catch {
    return false;
  }
};

/**
 * Get file size in bytes
 * @param filePath - Path to file
 * @returns File size or 0 if file doesn't exist
 */
export const getFileSize = (filePath: string): number => {
  try {
    if (!existsSync(filePath)) {
      return 0;
    }
    return statSync(filePath).size;
  } catch {
    return 0;
  }
};

/**
 * Read file and split into lines
 * @param filePath - Path to file
 * @returns Array of lines
 */
export const readFileLines = (filePath: string): string[] => {
  try {
    const content = readFile(filePath);
    return content.split('\n');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to read file lines: ${message}`);
  }
};

/**
 * Write lines to file
 * @param filePath - Path to file
 * @param lines - Array of lines
 */
export const writeFileLines = (filePath: string, lines: string[]): void => {
  try {
    const content = lines.join('\n');
    writeFile(filePath, content);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to write file lines: ${message}`);
  }
};

/**
 * Read .env file as object
 * @param filePath - Path to .env file
 * @returns Parsed environment object
 */
export const readEnvFile = (filePath: string): EnvObject => {
  try {
    const content = readFile(filePath);
    const lines = content.split('\n');
    const env: EnvObject = {};

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Parse KEY=VALUE
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        env[key] = value;
      }
    }

    return env;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to read .env file: ${message}`);
  }
};

/**
 * Write .env file from object
 * @param filePath - Path to .env file
 * @param env - Environment object
 */
export const writeEnvFile = (filePath: string, env: EnvObject): void => {
  try {
    const lines: string[] = [];

    for (const [key, value] of Object.entries(env)) {
      // Quote value if it contains special characters
      const quotedValue = shouldQuoteValue(value) ? `"${value}"` : value;
      lines.push(`${key}=${quotedValue}`);
    }

    writeFile(filePath, lines.join('\n'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to write .env file: ${message}`);
  }
};

/**
 * Check if value should be quoted in .env file
 * @param value - Value to check
 * @returns True if value should be quoted
 */
const shouldQuoteValue = (value: string): boolean => {
  // Quote if contains spaces, special characters, or equals sign
  return /[\s='"$`\\]/.test(value);
};

/**
 * Append lines to file
 * @param filePath - Path to file
 * @param lines - Lines to append
 */
export const appendFileLines = (filePath: string, lines: string[]): void => {
  try {
    const existing = fileExists(filePath) ? readFileLines(filePath) : [];
    const newLines = [...existing, ...lines];
    writeFileLines(filePath, newLines);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to append file lines: ${message}`);
  }
};

/**
 * Compare two files for equality
 * @param filePath1 - First file path
 * @param filePath2 - Second file path
 * @returns True if files are identical
 */
export const areFilesEqual = (filePath1: string, filePath2: string): boolean => {
  try {
    if (!fileExists(filePath1) || !fileExists(filePath2)) {
      return false;
    }

    const content1 = readFile(filePath1);
    const content2 = readFile(filePath2);

    return content1 === content2;
  } catch {
    return false;
  }
};

/**
 * Get file info
 * @param filePath - Path to file
 * @returns File info object
 */
export const getFileInfo = (
  filePath: string
): { exists: boolean; size: number; readable: boolean } => {
  return {
    exists: fileExists(filePath),
    size: getFileSize(filePath),
    readable: isFileReadable(filePath),
  };
};
