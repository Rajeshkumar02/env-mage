/**
 * Env-Mage CLI - Main Entry Point
 * Sets up Commander.js and registers all commands
 */

import { Command } from 'commander';
import { logger } from './utils/logger';
import { initCommand } from './commands/init';
import { validateCommand } from './commands/validate';
import { syncCommand } from './commands/sync';
import { diffCommand } from './commands/diff';
import { typegenCommand } from './commands/typegen';
import { scanCommand } from './commands/scan';
import { lintCommand } from './commands/lint';

const version = '1.1.0';

/**
 * Create and configure the main CLI program
 */
export const createProgram = (): Command => {
  const program = new Command();

  program
    .name('env-mage')
    .description(
      'CLI for managing .env files - init, validate, sync, diff, typegen, scan, lint, encrypt'
    )
    .version(version)
    .helpOption('-h, --help', 'Display help for command');

  // Init command - Generate .env.example
  program
    .command('init')
    .description('Generate .env.example from .env')
    .option('-e, --env <file>', 'Path to .env file', '.env')
    .option('-o, --output <file>', 'Path to output .env.example file', '.env.example')
    .option('--no-backup', 'Do not create backup if file exists')
    .action(async (options) => {
      try {
        const result = initCommand(options.env, options.output, options.backup);

        if (result.success) {
          logger.success(result.message);
        } else {
          logger.error(result.message);
          process.exit(1);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Init command failed: ${message}`);
        process.exit(1);
      }
    });

  // Validate command - Check for key mismatches
  program
    .command('validate')
    .description('Validate .env against .env.example')
    .option('-e, --env <file>', 'Path to .env file', '.env')
    .option('-x, --example <file>', 'Path to .env.example file', '.env.example')
    .option('-s, --strict', 'Fail on warnings', false)
    .action(async (options) => {
      try {
        const result = validateCommand({
          envFile: options.env,
          exampleFile: options.example,
          strict: options.strict,
        });

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

        // Display results
        logger.section('Validation Results');
        logger.validationResult(data.valid, data.matched, data.missingCount, data.extraCount);

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

        if (!result.success) {
          process.exit(1);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Validation failed: ${message}`);
        process.exit(1);
      }
    });

  // Sync command - Synchronize keys
  program
    .command('sync')
    .description('Sync keys between .env files')
    .option('-s, --source <file>', 'Source .env file', '.env')
    .option('-t, --target <file>', 'Target .env file', '.env.example')
    .option('-S, --strategy <type>', 'Sync strategy: merge, overwrite, preserve', 'merge')
    .option('--no-backup', 'Do not create backup')
    .action(async (options) => {
      try {
        const result = syncCommand({
          source: options.source,
          target: options.target,
          strategy: options.strategy as 'merge' | 'overwrite' | 'preserve',
          backup: options.backup,
        });

        if (result.success) {
          logger.success(result.message);
        } else {
          logger.error(result.message);
          process.exit(1);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Sync command failed: ${message}`);
        process.exit(1);
      }
    });

  // Diff command - Show differences
  program
    .command('diff')
    .description('Show differences between .env files')
    .option('-f, --from <file>', 'First file to compare', '.env')
    .option('-t, --to <file>', 'Second file to compare', '.env.example')
    .action(async (options) => {
      try {
        const result = diffCommand({
          from: options.from,
          to: options.to,
        });

        if (!result.data || typeof result.data !== 'object') {
          logger.error(result.message);
          process.exit(1);
        }

        const data = result.data as {
          added: string[];
          removed: string[];
          changed: string[];
          summary: { added: number; removed: number; changed: number };
        };

        logger.section('Diff Results');
        logger.stats(data.summary);

        if (data.added.length > 0) {
          console.log('');
          logger.warn(`Added (${data.added.length}):`);
          data.added.forEach((k) => console.log(`  + ${k}`));
        }

        if (data.removed.length > 0) {
          console.log('');
          logger.warn(`Removed (${data.removed.length}):`);
          data.removed.forEach((k) => console.log(`  - ${k}`));
        }

        if (data.changed.length > 0) {
          console.log('');
          logger.warn(`Changed (${data.changed.length}):`);
          data.changed.forEach((k) => console.log(`  ~ ${k}`));
        }

        if (!result.success) {
          process.exit(1);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Diff command failed: ${message}`);
        process.exit(1);
      }
    });

  // Typegen command - Generate types
  program
    .command('typegen')
    .description('Generate TypeScript types from .env')
    .option('-e, --env <file>', 'Path to .env file', '.env')
    .option('-o, --output <file>', 'Output file path', 'env.types.ts')
    .option('-f, --format <type>', 'Output format: interface, type, const', 'interface')
    .option('--strict', 'Strict typing (no optional properties)')
    .action(async (options) => {
      try {
        const result = typegenCommand({
          env: options.env,
          output: options.output,
          format: options.format as 'interface' | 'type' | 'const',
          strict: options.strict,
        });

        if (result.success) {
          logger.success(result.message);
        } else {
          logger.error(result.message);
          process.exit(1);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Typegen command failed: ${message}`);
        process.exit(1);
      }
    });

  // Scan command - Scan for usage
  program
    .command('scan')
    .description('Scan codebase for process.env usage')
    .option('-p, --path <dir>', 'Directory to scan', '.')
    .option('-e, --extensions <list>', 'File extensions to scan', '.ts,.tsx,.js,.jsx')
    .option('-x, --exclude <list>', 'Directories to exclude', 'node_modules,.git,dist,build,.next')
    .action(async (options) => {
      try {
        const result = scanCommand({
          path: options.path,
          extensions: options.extensions.split(','),
          exclude: options.exclude.split(','),
        });

        if (!result.data || typeof result.data !== 'object') {
          logger.error(result.message);
          process.exit(1);
        }

        const data = result.data as {
          uniqueVariables: string[];
          filesScanned: number;
          summary: { total: number; files: number };
        };

        logger.success(result.message);
        console.log('');
        logger.stats({
          'files scanned': data.filesScanned,
          'unique variables': data.summary.total,
        });

        if (data.uniqueVariables.length > 0) {
          console.log('');
          logger.section('Variables Found');
          data.uniqueVariables.forEach((v) => console.log(`  • ${v}`));
        }

        if (!result.success) {
          process.exit(1);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Scan command failed: ${message}`);
        process.exit(1);
      }
    });

  // Lint command - Validate format
  program
    .command('lint')
    .description('Lint .env file for issues')
    .option('-f, --file <file>', 'File to lint', '.env')
    .option('-S, --strict', 'Treat warnings as errors')
    .option('-w, --warnings', 'Show warnings in addition to errors')
    .action(async (options) => {
      try {
        const result = lintCommand({
          file: options.file,
          strict: options.strict,
          warnings: options.warnings,
        });

        if (!result.data || typeof result.data !== 'object') {
          logger.error(result.message);
          process.exit(1);
        }

        const data = result.data as {
          errorCount: number;
          warningCount: number;
          keyCount: number;
          issues: Array<{ line: number; message: string; severity: string }>;
        };

        if (result.success) {
          logger.success(result.message);
        } else {
          logger.error(result.message);
        }

        console.log('');
        logger.stats({
          keys: data.keyCount,
          errors: data.errorCount,
          warnings: data.warningCount,
        });

        if (data.issues.length > 0) {
          console.log('');
          logger.section('Issues');
          data.issues.forEach((issue) => {
            const prefix = issue.severity === 'error' ? '❌' : '⚠️';
            console.log(`  ${prefix} Line ${issue.line}: ${issue.message}`);
          });
        }

        if (!result.success) {
          process.exit(1);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Lint command failed: ${message}`);
        process.exit(1);
      }
    });

  // Help for main command
  program.on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log('  $ env-mage init                              Generate .env.example from .env');
    console.log('  $ env-mage validate                          Check .env against .env.example');
    console.log('  $ env-mage init -e .env.production           Use custom .env file');
    console.log('  $ env-mage validate --strict                 Fail on any mismatch');
  });

  return program;
};

/**
 * Run the CLI
 * @param args - Command line arguments (typically process.argv)
 */
export const runCLI = (args: string[]): void => {
  const program = createProgram();
  program.parse(args);
};

// Execute CLI if run directly
const currentFile = import.meta.url.replace(/\\/g, '/').replace('file:///', '');
const scriptFile = process.argv[1].replace(/\\/g, '/');

if (currentFile === scriptFile || currentFile.endsWith(scriptFile)) {
  runCLI(process.argv);
}

// Export for testing
export default createProgram;
