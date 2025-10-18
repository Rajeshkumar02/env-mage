/**
 * Env-Mage - Scan Command
 * Scan codebase for process.env usage
 */

import { readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { readFile } from '../utils/fileUtils';
import { extractVariablesFromCode } from '../utils/envParser';
import { logger } from '../utils/logger';
import { PATTERNS } from '../utils/constants';
import { CommandResult } from '../types';

/**
 * Scan options interface
 */
export interface ScanOptions {
  path?: string;
  extensions?: string[];
  exclude?: string[];
}

/**
 * Scan directory for process.env usage
 * @param options - Scan configuration
 * @returns Command result with found variables
 */
export const scanCommand = (options: ScanOptions = {}): CommandResult => {
  try {
    const scanPath = options.path || '.';
    const extensions = options.extensions || ['.ts', '.tsx', '.js', '.jsx'];
    const exclude = options.exclude || ['node_modules', '.git', 'dist', 'build', '.next'];

    const foundVariables = new Set<string>();
    const fileResults: Record<string, string[]> = {};
    let filesScanned = 0;

    /**
     * Recursively scan directory
     */
    function scanDir(dir: string): void {
      try {
        const entries = readdirSync(dir);

        for (const entry of entries) {
          // Skip excluded
          if (exclude.includes(entry)) continue;

          const fullPath = join(dir, entry);
          const stat = statSync(fullPath);

          if (stat.isDirectory()) {
            scanDir(fullPath);
          } else if (stat.isFile()) {
            const ext = extname(entry);
            if (extensions.includes(ext)) {
              filesScanned++;
              try {
                const content = readFile(fullPath);
                const vars = extractVariablesFromCode(content);

                if (vars.length > 0) {
                  fileResults[fullPath] = vars;
                  vars.forEach((v) => foundVariables.add(v));
                }
              } catch {
                // Skip files that can't be read
              }
            }
          }
        }
      } catch (error) {
        // Skip directories that can't be read
      }
    }

    // Start scan
    scanDir(scanPath);

    return {
      success: true,
      message: `✅ Scanned ${filesScanned} files, found ${foundVariables.size} unique variables`,
      data: {
        path: scanPath,
        filesScanned,
        uniqueVariables: Array.from(foundVariables).sort(),
        fileResults,
        summary: {
          total: foundVariables.size,
          files: Object.keys(fileResults).length,
        },
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error during scan';
    return {
      success: false,
      message: `Scan failed: ${message}`,
      error: error instanceof Error ? error : new Error(message),
    };
  }
};

/**
 * Async variant with detailed logging
 */
export const runScanCommand = async (options: ScanOptions = {}): Promise<CommandResult> => {
  logger.section('Scanning Codebase');
  logger.info(`Path: ${options.path || '.'}`);
  logger.info(`Extensions: ${(options.extensions || ['.ts', '.tsx', '.js', '.jsx']).join(', ')}`);
  logger.info(
    `Exclude: ${(options.exclude || ['node_modules', '.git', 'dist', 'build', '.next']).join(', ')}`
  );
  console.log('');

  const result = scanCommand(options);

  if (!result.success) {
    logger.error(result.message);
    return result;
  }

  if (typeof result.data !== 'object' || !result.data) {
    return result;
  }

  const data = result.data as {
    path: string;
    filesScanned: number;
    uniqueVariables: string[];
    fileResults: Record<string, string[]>;
    summary: { total: number; files: number };
  };

  logger.success(result.message);
  console.log('');

  if (data.uniqueVariables.length > 0) {
    logger.section(`Found Variables (${data.uniqueVariables.length})`);
    data.uniqueVariables.forEach((v) => {
      console.log(`  • ${v}`);
    });
    console.log('');
  }

  if (Object.keys(data.fileResults).length > 0) {
    logger.section('Files with Variables');
    Object.entries(data.fileResults).forEach(([file, vars]) => {
      logger.info(`${file} (${vars.length} vars)`);
      vars.forEach((v) => {
        console.log(`    • ${v}`);
      });
    });
  }

  return result;
};
