/**
 * Env-Mage - Diff Command
 * Show visual differences between two .env files
 */

import { readFile, fileExists } from '../utils/fileUtils';
import {
  parseEnvContent,
  getDifferentKeys,
  getMissingKeys,
  getExtraKeys,
} from '../utils/envParser';
import { logger } from '../utils/logger';
import { DEFAULTS } from '../utils/constants';
import { CommandResult } from '../types';

/**
 * Diff options interface
 */
export interface DiffOptions {
  from?: string;
  to?: string;
}

/**
 * Compare two .env files and show differences
 * @param options - Diff configuration
 * @returns Command result with differences
 */
export const diffCommand = (options: DiffOptions = {}): CommandResult => {
  try {
    const fromFile = options.from || DEFAULTS.ENV_FILE;
    const toFile = options.to || DEFAULTS.ENV_EXAMPLE_FILE;

    // Check if files exist
    if (!fileExists(fromFile)) {
      return {
        success: false,
        message: `File not found: ${fromFile}`,
        error: new Error(`File not found: ${fromFile}`),
      };
    }

    if (!fileExists(toFile)) {
      return {
        success: false,
        message: `File not found: ${toFile}`,
        error: new Error(`File not found: ${toFile}`),
      };
    }

    // Read and parse files
    const fromContent = readFile(fromFile);
    const toContent = readFile(toFile);

    const fromObject = parseEnvContent(fromContent);
    const toObject = parseEnvContent(toContent);

    // Get differences
    const added = getMissingKeys(fromObject, toObject); // Keys in toObject but not fromObject
    const removed = getExtraKeys(fromObject, toObject); // Keys in fromObject but not toObject
    const changed = getDifferentKeys(fromObject, toObject); // Keys with different values
    const unchanged = Object.keys(fromObject).filter(
      (k) => !added.includes(k) && !removed.includes(k) && !changed.includes(k)
    );

    let message = '';
    if (added.length === 0 && removed.length === 0 && changed.length === 0) {
      message = `Files are identical. No differences found.`;
    } else {
      message = `Diff complete: ${added.length > 0 ? `Added: ${added.join(', ')}` : ''} ${
        removed.length > 0 ? `Removed: ${removed.join(', ')}` : ''
      } ${changed.length > 0 ? `Changed: ${changed.join(', ')}` : ''}`;
    }

    return {
      success: true,
      message,
      data: {
        from: fromFile,
        to: toFile,
        added,
        removed,
        changed,
        unchanged,
        summary: {
          added: added.length,
          removed: removed.length,
          changed: changed.length,
          unchanged: unchanged.length,
        },
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error during diff';
    return {
      success: false,
      message: `Diff failed: ${message}`,
      error: error instanceof Error ? error : new Error(message),
    };
  }
};

/**
 * Async variant with formatted logging
 */
export const runDiffCommand = async (options: DiffOptions = {}): Promise<CommandResult> => {
  logger.section('Comparing .env Files');

  const result = diffCommand(options);

  if (!result.success) {
    logger.error(result.message);
    return result;
  }

  if (typeof result.data !== 'object' || !result.data) {
    return result;
  }

  const data = result.data as {
    from: string;
    to: string;
    added: string[];
    removed: string[];
    changed: string[];
    unchanged: string[];
    summary: { added: number; removed: number; changed: number; unchanged: number };
  };

  logger.info(`From: ${data.from}`);
  logger.info(`To: ${data.to}`);
  console.log('');

  // Summary
  logger.stats(data.summary);
  console.log('');

  // Show changes
  if (data.added.length > 0) {
    logger.section(`Added (${data.added.length})`);
    data.added.forEach((key) => {
      logger.diffKey(key, undefined, 'added');
    });
    console.log('');
  }

  if (data.removed.length > 0) {
    logger.section(`Removed (${data.removed.length})`);
    data.removed.forEach((key) => {
      logger.diffKey(key, 'removed', undefined);
    });
    console.log('');
  }

  if (data.changed.length > 0) {
    logger.section(`Changed (${data.changed.length})`);
    data.changed.forEach((key) => {
      logger.diffKey(key);
    });
    console.log('');
  }

  return result;
};
