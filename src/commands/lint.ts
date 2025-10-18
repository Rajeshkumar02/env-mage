/**
 * Env-Mage - Lint Command
 * Validate .env file format and check for issues
 */

import { readFile, fileExists } from '../utils/fileUtils';
import { validateEnvContent, parseEnvContent } from '../utils/envParser';
import { logger } from '../utils/logger';
import { DEFAULTS } from '../utils/constants';
import { CommandResult } from '../types';

/**
 * Lint options interface
 */
export interface LintOptions {
  file?: string;
  strict?: boolean;
  warnings?: boolean;
}

/**
 * Lint validation result
 */
export interface LintResult {
  valid: boolean;
  errorCount: number;
  warningCount: number;
  errors: Array<{
    line: number;
    message: string;
    severity: 'error' | 'warning';
  }>;
}

/**
 * Lint .env file
 * @param options - Lint configuration
 * @returns Command result with lint errors/warnings
 */
export const lintCommand = (options: LintOptions = {}): CommandResult => {
  try {
    const envFile = options.file || DEFAULTS.ENV_FILE;
    const strict = options.strict ?? false;

    // Check if file exists
    if (!fileExists(envFile)) {
      return {
        success: false,
        message: `File not found: ${envFile}`,
        error: new Error(`File not found: ${envFile}`),
      };
    }

    const content = readFile(envFile);
    const validationErrors = validateEnvContent(content);
    const parseResult = parseEnvContent(content);

    const issues: Array<{
      line: number;
      message: string;
      severity: 'error' | 'warning';
    }> = [];

    // Collect validation errors
    for (const error of validationErrors) {
      const lineMatch = error.match(/^Line (\d+):/);
      const lineNum = lineMatch ? parseInt(lineMatch[1]) : 0;
      issues.push({
        line: lineNum,
        message: error.replace(/^Line \d+: /, ''),
        severity: 'error',
      });
    }

    // Additional checks
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Check for empty lines with spaces
      if (line.trim() === '' && line.length > 0) {
        issues.push({
          line: lineNum,
          message: 'Line contains only whitespace',
          severity: 'warning',
        });
      }

      // Check for unquoted values with spaces
      const unquotedMatch = line.match(/^[A-Z_][A-Z0-9_]*\s*=\s*([^"'`].* .*)/);
      if (unquotedMatch && !line.includes('#')) {
        issues.push({
          line: lineNum,
          message: 'Value with spaces should be quoted',
          severity: 'warning',
        });
      }
    }

    const errorCount = issues.filter((i) => i.severity === 'error').length;
    const warningCount = issues.filter((i) => i.severity === 'warning').length;
    const valid = errorCount === 0 && (!strict || warningCount === 0);

    return {
      success: valid,
      message: valid
        ? `✅ No issues found (${Object.keys(parseResult).length} keys)`
        : `❌ Found ${errorCount} error(s) and ${warningCount} warning(s)`,
      data: {
        file: envFile,
        valid,
        errorCount,
        warningCount,
        keyCount: Object.keys(parseResult).length,
        issues: options.warnings ? issues : issues.filter((i) => i.severity === 'error'),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error during lint';
    return {
      success: false,
      message: `Lint failed: ${message}`,
      error: error instanceof Error ? error : new Error(message),
    };
  }
};

/**
 * Async variant with formatted output
 */
export const runLintCommand = async (options: LintOptions = {}): Promise<CommandResult> => {
  logger.section('Linting .env File');
  logger.info(`File: ${options.file || DEFAULTS.ENV_FILE}`);
  logger.info(`Strict mode: ${options.strict ? 'enabled' : 'disabled'}`);
  console.log('');

  const result = lintCommand(options);

  if (typeof result.data !== 'object' || !result.data) {
    logger.error(result.message);
    return result;
  }

  const data = result.data as {
    file: string;
    valid: boolean;
    errorCount: number;
    warningCount: number;
    keyCount: number;
    issues: Array<{
      line: number;
      message: string;
      severity: 'error' | 'warning';
    }>;
  };

  if (result.success) {
    logger.success(result.message);
  } else {
    logger.error(result.message);
  }
  console.log('');

  if (data.issues.length > 0) {
    logger.section('Issues');
    data.issues.forEach((issue) => {
      const prefix = issue.severity === 'error' ? '❌' : '⚠️';
      const color = issue.severity === 'error' ? 'error' : 'warn';
      console.log(`  ${prefix} Line ${issue.line}: ${issue.message} (${issue.severity})`);
    });
    console.log('');
  }

  logger.stats({
    errors: data.errorCount,
    warnings: data.warningCount,
    keys: data.keyCount,
  });

  return result;
};
