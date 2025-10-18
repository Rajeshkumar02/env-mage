/**
 * Env-Mage - Sync Command
 * Synchronize keys between two .env files
 */

import { readFile, writeFileWithBackup, fileExists, writeFile } from '../utils/fileUtils';
import { parseEnvContent, mergeEnv, getMissingKeys, getExtraKeys } from '../utils/envParser';
import { logger } from '../utils/logger';
import { DEFAULTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';
import { CommandResult } from '../types';

/**
 * Sync options interface
 */
export interface SyncOptions {
  source?: string;
  target?: string;
  strategy?: 'merge' | 'overwrite' | 'preserve';
  backup?: boolean;
}

/**
 * Synchronize keys from source to target .env file
 * @param options - Sync configuration
 * @returns Command result
 */
export const syncCommand = (options: SyncOptions = {}): CommandResult => {
  try {
    const sourceFile = options.source || DEFAULTS.ENV_FILE;
    const targetFile = options.target || DEFAULTS.ENV_EXAMPLE_FILE;
    const strategy = options.strategy || 'merge';
    const backup = options.backup !== false;

    // Check if source exists
    if (!fileExists(sourceFile)) {
      return {
        success: false,
        message: `Source file not found: ${sourceFile}`,
        error: new Error(`Source file not found: ${sourceFile}`),
      };
    }

    // Check if target exists
    if (!fileExists(targetFile)) {
      return {
        success: false,
        message: `Target file not found: ${targetFile}`,
        error: new Error(`Target file not found: ${targetFile}`),
      };
    }

    // Read files
    const sourceContent = readFile(sourceFile);
    const targetContent = readFile(targetFile);

    const sourceObject = parseEnvContent(sourceContent);
    const targetObject = parseEnvContent(targetContent);

    let mergedObject: Record<string, string>;

    switch (strategy) {
      case 'overwrite': {
        // Replace target entirely with source keys and values
        mergedObject = { ...sourceObject };
        break;
      }

      case 'preserve': {
        // Keep all target keys, add missing from source
        mergedObject = { ...targetObject };
        const missingKeys = getMissingKeys(targetObject, sourceObject);
        for (const key of missingKeys) {
          mergedObject[key] = sourceObject[key];
        }
        break;
      }

      case 'merge':
      default: {
        // Merge both files, source takes precedence for structure
        mergedObject = mergeEnv(targetObject, sourceObject);
        break;
      }
    }

    // Format as .env file
    const formatEnvFile = (envObj: Record<string, string>): string => {
      return Object.entries(envObj)
        .map(([key, value]) => {
          // If value contains spaces or special characters, quote it
          if (value && /\s|[&|><\\;]/.test(value)) {
            return `${key}="${value}"`;
          }
          return `${key}=${value}`;
        })
        .join('\n');
    };

    // Format content and write with backup
    const formattedContent = formatEnvFile(mergedObject);

    // Write result with backup
    let backupPath: string | undefined;
    if (backup) {
      backupPath = writeFileWithBackup(targetFile, formattedContent);
    } else {
      writeFile(targetFile, formattedContent);
    }

    const addedCount = getMissingKeys(targetObject, sourceObject).length;
    const keptCount = Object.keys(targetObject).filter((k) => mergedObject[k]).length;

    return {
      success: true,
      message: backup
        ? `✅ Synced ${addedCount} new keys, kept ${keptCount} existing (strategy: ${strategy}, backup created)`
        : `✅ Synced ${addedCount} new keys, kept ${keptCount} existing (strategy: ${strategy})`,
      data: {
        file: targetFile,
        strategy,
        addedCount,
        keptCount,
        backupPath,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error during sync';
    return {
      success: false,
      message: `Sync failed: ${message}`,
      error: error instanceof Error ? error : new Error(message),
    };
  }
};

/**
 * Async variant with logging
 */
export const runSyncCommand = async (options: SyncOptions = {}): Promise<CommandResult> => {
  logger.section('Syncing .env Files');
  logger.info(`Source: ${options.source || DEFAULTS.ENV_FILE}`);
  logger.info(`Target: ${options.target || DEFAULTS.ENV_EXAMPLE_FILE}`);
  logger.info(`Strategy: ${options.strategy || 'merge'}`);

  const result = syncCommand(options);

  if (!result.success) {
    logger.error(result.message);
  }

  return result;
};
