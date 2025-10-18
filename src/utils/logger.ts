/**
 * Env-Mage - Logger Utility
 * Handles colored console output and logging
 */

import kleur from 'kleur';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

/**
 * Logger class for consistent colored output
 */
export class Logger {
  private enableColors: boolean;

  constructor(enableColors: boolean = true) {
    this.enableColors = enableColors;
  }

  /**
   * Disable colors for JSON output
   */
  disableColors(): void {
    this.enableColors = false;
  }

  /**
   * Enable colors
   */
  enableColorsOutput(): void {
    this.enableColors = true;
  }

  /**
   * Format message with color if enabled
   */
  private colorize(message: string, color: (s: string) => string): string {
    return this.enableColors ? color(message) : message;
  }

  /**
   * Log info message
   */
  info(message: string): void {
    console.log(this.colorize(`ℹ️  ${message}`, kleur.blue));
  }

  /**
   * Log success message
   */
  success(message: string): void {
    console.log(this.colorize(`✅ ${message}`, kleur.green));
  }

  /**
   * Log warning message
   */
  warn(message: string): void {
    console.log(this.colorize(`⚠️  ${message}`, kleur.yellow));
  }

  /**
   * Log error message
   */
  error(message: string): void {
    console.error(this.colorize(`❌ ${message}`, kleur.red));
  }

  /**
   * Log debug message
   */
  debug(message: string): void {
    console.log(this.colorize(`🐛 ${message}`, kleur.gray));
  }

  /**
   * Log generic message with symbol
   */
  log(message: string, symbol: string = '→'): void {
    console.log(`${symbol} ${message}`);
  }

  /**
   * Log a section header
   */
  section(title: string): void {
    console.log();
    console.log(this.colorize(kleur.bold(title), kleur.blue));
    console.log(this.colorize(kleur.dim('─'.repeat(title.length)), kleur.gray));
  }

  /**
   * Log a table of results
   */
  table(headers: string[], rows: string[][]): void {
    console.table({ headers, rows });
  }

  /**
   * Log statistics
   */
  stats(stats: Record<string, number | string>): void {
    this.section('Statistics');
    Object.entries(stats).forEach(([key, value]) => {
      const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
      console.log(`  ${formattedKey}: ${this.colorize(String(value), kleur.green)}`);
    });
  }

  /**
   * Log validation results
   */
  validationResult(valid: boolean, matched: number, missing: number, extra: number): void {
    this.section('Validation Result');
    if (valid) {
      this.success(`All keys matched (${matched} total)`);
    } else {
      if (missing > 0) {
        this.warn(`Missing: ${missing} keys`);
      }
      if (extra > 0) {
        this.warn(`Extra: ${extra} keys`);
      }
    }
  }

  /**
   * Log diff results
   */
  diffResult(added: number, removed: number, modified: number, matching: number): void {
    this.section('Diff Result');
    if (matching > 0) {
      this.success(`${matching} unchanged`);
    }
    if (added > 0) {
      this.info(`${added} added`);
    }
    if (modified > 0) {
      this.warn(`${modified} modified`);
    }
    if (removed > 0) {
      this.error(`${removed} removed`);
    }
  }

  /**
   * Log key difference
   */
  diffKey(key: string, oldValue?: string, newValue?: string, removed = false): void {
    if (removed) {
      console.log(this.colorize(`  ⊘ ${key}`, kleur.red));
    } else if (!oldValue && newValue) {
      console.log(this.colorize(`  ✚ ${key} = ${newValue}`, kleur.green));
    } else if (oldValue && !newValue) {
      console.log(this.colorize(`  ✕ ${key} = ${oldValue}`, kleur.red));
    } else if (oldValue !== newValue) {
      console.log(this.colorize(`  ~ ${key}:`, kleur.yellow));
      console.log(this.colorize(`    • old: ${oldValue}`, kleur.gray));
      console.log(this.colorize(`    • new: ${newValue}`, kleur.green));
    } else {
      console.log(this.colorize(`  ✓ ${key}`, kleur.gray));
    }
  }

  /**
   * Log error with suggestion
   */
  errorWithSuggestion(error: string, suggestion: string): void {
    this.error(error);
    const suggestionText = `  💡 Suggestion: ${suggestion}`;
    const colorFn = (s: string) => kleur.dim(kleur.yellow(s));
    console.log(this.colorize(suggestionText, colorFn));
  }

  /**
   * Log a progress message
   */
  progress(current: number, total: number, message: string): void {
    const percent = Math.round((current / total) * 100);
    console.log(`[${percent}%] ${message}`);
  }

  /**
   * Clear console
   */
  clear(): void {
    console.clear();
  }

  /**
   * Log empty line
   */
  newline(): void {
    console.log();
  }

  /**
   * Log multiple messages
   */
  group(messages: string[]): void {
    messages.forEach((msg) => this.log(msg));
  }
}

/**
 * Create a default logger instance
 */
export const createLogger = (colors: boolean = true): Logger => {
  return new Logger(colors);
};

/**
 * Default logger instance
 */
export const logger = new Logger();
