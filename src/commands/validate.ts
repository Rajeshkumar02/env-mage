/**
 * Env-Mage - Validate Command
 * Check for mismatched keys between .env and .env.example
 */

import { fileExists, readFile } from '../utils/fileUtils';
import { parseEnvContent, getMissingKeys, getExtraKeys } from '../utils/envParser';
import { logger } from '../utils/logger';
import { DEFAULTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';
import { CommandResult } from '../types';

/**
 * Validation options
 */
export interface ValidateOptions {
  envFile?: string;
  exampleFile?: string;
  strict?: boolean;
}

/**
 * Find a matching example file for a specific env file
 * e.g., .env.staging -> .env.staging.example
 */
const findMatchingExampleFile = (envFile: string): string | undefined => {
  // Extract the file name without path
  const fileName = envFile.split('/').pop()?.split('\\').pop();
  if (!fileName) return undefined;

  // Create the example file name
  const exampleFileName = `${fileName}.example`;
  // Create the full path by replacing the original filename with the example filename
  const examplePath = envFile.replace(fileName, exampleFileName);

  return fileExists(examplePath) ? examplePath : undefined;
};

/**
 * Validate .env against .env.example
 * Checks for missing and extra keys
 *
 * @param options - Validation options
 * @returns Command result with validation details
 */
export const validateCommand = (options: ValidateOptions = {}): CommandResult => {
  const { envFile = DEFAULTS.ENV_FILE, strict = false } = options;

  // Try to find a matching example file if none specified
  let exampleFile = options.exampleFile;

  if (!exampleFile) {
    // First check for a type-specific example file (e.g., .env.staging.example)
    const matchingExample = findMatchingExampleFile(envFile);
    if (matchingExample) {
      exampleFile = matchingExample;
    } else {
      exampleFile = DEFAULTS.ENV_EXAMPLE_FILE;
    }
  }

  try {
    // Check if both files exist
    if (!fileExists(envFile)) {
      return {
        success: false,
        message: ERROR_MESSAGES.FILE_NOT_FOUND(envFile),
        error: new Error(ERROR_MESSAGES.FILE_NOT_FOUND(envFile)),
      };
    }

    if (!fileExists(exampleFile)) {
      return {
        success: false,
        message: ERROR_MESSAGES.FILE_NOT_FOUND(exampleFile),
        error: new Error(ERROR_MESSAGES.FILE_NOT_FOUND(exampleFile)),
      };
    }

    // Parse both files
    const envContent = readFile(envFile);
    const exampleContent = readFile(exampleFile);

    const env = parseEnvContent(envContent);
    const example = parseEnvContent(exampleContent);

    // Get differences
    const missing = getMissingKeys(env, example);
    const extra = getExtraKeys(env, example);
    const matched = Object.keys(example).filter((key) => key in env).length;

    // Extract filenames from paths for better reporting
    const envFileName = envFile.split('/').pop()?.split('\\').pop();
    const exampleFileName = exampleFile.split('/').pop()?.split('\\').pop();

    // Determine success
    const isValid = missing.length === 0;
    const shouldFail = missing.length > 0 || (strict && extra.length > 0);

    const data = {
      valid: isValid && (!strict || extra.length === 0),
      matched,
      missingCount: missing.length,
      extraCount: extra.length,
      missing,
      extra,
    };

    if (isValid && (extra.length === 0 || !strict)) {
      return {
        success: true,
        message: `All keys are valid between files`,
        data,
        envFileName,
        exampleFileName,
      };
    }

    const messages: string[] = [];
    if (missing.length > 0) {
      messages.push(`Missing keys in ${envFileName}: ${missing.join(', ')}`);
    }
    if (extra.length > 0) {
      messages.push(`Extra keys in ${envFileName}: ${extra.join(', ')}`);
    }

    return {
      success: !shouldFail,
      message: messages.join(' | '),
      data,
      envFileName,
      exampleFileName,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Validation failed: ${message}`,
      error: error instanceof Error ? error : new Error(message),
    };
  }
};

/**
 * Run validate command with logging
 * Displays colored output and detailed results
 *
 * @param options - Validation options
 */
export const runValidateCommand = async (options: ValidateOptions = {}): Promise<void> => {
  try {
    logger.section('Validate Environment Files');

    const { envFile = DEFAULTS.ENV_FILE, exampleFile = DEFAULTS.ENV_EXAMPLE_FILE } = options;

    logger.info(`Checking: ${envFile} against ${exampleFile}`);

    // Execute validate command
    const result = validateCommand(options);

    if (!result.data || typeof result.data !== 'object') {
      logger.error(result.message);
      process.exit(1);
    }

    const data = result.data as {
      valid: boolean;
      matched: number;
      missingCount: number;
      extraCount: number;
      missing: string[];
      extra: string[];
    };

    // Display validation result
    logger.validationResult(data.valid, data.matched, data.missingCount, data.extraCount);

    // Show details
    if (data.missing.length > 0) {
      logger.warn(`Missing keys (${data.missing.length}):`);
      data.missing.forEach((key) => {
        console.log(`  • ${key}`);
      });
    }

    if (data.extra.length > 0) {
      logger.warn(`Extra keys (${data.extra.length}):`);
      data.extra.forEach((key) => {
        console.log(`  • ${key}`);
      });
    }

    if (data.valid) {
      logger.success(`All ${data.matched} keys validated successfully!`);
    } else {
      if (options.strict) {
        process.exit(1);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Validation failed: ${message}`);
    process.exit(1);
  }
};

export default {
  validateCommand,
  runValidateCommand,
};
