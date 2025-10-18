/**
 * Env-Mage - Init Command
 * Generate .env.example from .env
 */

import { readFile, writeFileWithBackup, fileExists, writeFile } from '../utils/fileUtils';
import { parseEnvContent, stringifyEnv } from '../utils/envParser';
import { logger } from '../utils/logger';
import { DEFAULTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';
import { CommandResult } from '../types';

/**
 * Initialize .env.example by copying keys from .env
 * Removes all values, keeping only the keys
 *
 * @param envFile - Path to .env file (default: .env)
 * @param exampleFile - Path to .env.example (default: .env.example)
 * @param backup - Create backup if example file exists
 * @returns Command result
 */
export const initCommand = (
  envFile: string = DEFAULTS.ENV_FILE,
  exampleFile: string = DEFAULTS.ENV_EXAMPLE_FILE,
  backup: boolean = true
): CommandResult => {
  try {
    // Check if .env exists
    if (!fileExists(envFile)) {
      return {
        success: false,
        message: ERROR_MESSAGES.NO_ENV_FILE,
        error: new Error(ERROR_MESSAGES.NO_ENV_FILE),
      };
    }

    // Read .env file
    const envContent = readFile(envFile);
    const envObject = parseEnvContent(envContent);

    // Get all keys, set empty values
    const exampleObject: Record<string, string> = {};
    for (const key of Object.keys(envObject)) {
      exampleObject[key] = '';
    }

    const exampleContent = stringifyEnv(exampleObject);

    // Write .env.example with backup
    let backupPath: string | undefined;
    if (backup) {
      backupPath = writeFileWithBackup(exampleFile, exampleContent);
    } else {
      writeFile(exampleFile, exampleContent);
    }

    const keyCount = Object.keys(exampleObject).length;
    const message = SUCCESS_MESSAGES.INIT_COMPLETE(keyCount);

    return {
      success: true,
      message,
      data: {
        file: exampleFile,
        keyCount,
        backupPath,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Init command failed: ${message}`,
      error: error instanceof Error ? error : new Error(message),
    };
  }
};

/**
 * Run init command with logging
 * Displays colored output and progress
 *
 * @param envFile - Path to .env file
 * @param exampleFile - Path to .env.example
 * @param backup - Create backup
 */
export const runInitCommand = async (
  envFile: string = DEFAULTS.ENV_FILE,
  exampleFile: string = DEFAULTS.ENV_EXAMPLE_FILE,
  backup: boolean = true
): Promise<void> => {
  try {
    logger.section('Initialize .env.example');

    // Check if .env exists
    if (!fileExists(envFile)) {
      logger.error(`${ERROR_MESSAGES.NO_ENV_FILE}`);
      process.exit(1);
    }

    logger.info(`Reading from: ${envFile}`);

    // Execute init command
    const result = initCommand(envFile, exampleFile, backup);

    if (result.success) {
      logger.success(result.message);

      if (result.data && typeof result.data === 'object' && 'keyCount' in result.data) {
        const data = result.data as { keyCount: number; backupPath?: string };
        logger.info(`Created file: ${exampleFile}`);
        logger.info(`Total keys: ${data.keyCount}`);

        if (data.backupPath) {
          logger.info(`Backup created: ${data.backupPath}`);
        }
      }
    } else {
      logger.error(result.message);
      process.exit(1);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to initialize: ${message}`);
    process.exit(1);
  }
};
