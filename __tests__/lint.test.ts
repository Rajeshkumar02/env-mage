/**
 * Env-Mage - Lint Command Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { lintCommand } from '../src/commands/lint';

describe('Lint Command', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(__dirname, 'temp-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should pass validation for well-formed .env file', () => {
    const envFile = join(tempDir, '.env');
    writeFileSync(envFile, 'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123\nPORT=3000');

    const result = lintCommand({ file: envFile });

    expect(result.success).toBe(true);
    expect(result.message).toContain('No issues found');
  });

  it('should detect errors in malformed .env file', () => {
    const envFile = join(tempDir, '.env');
    writeFileSync(envFile, 'DATABASE_URL postgres://localhost\nAPI_KEY==secret123\nPORT');

    const result = lintCommand({ file: envFile, strict: true });

    expect(result.success).toBe(false);
    expect(result.message).toContain('error');
  });

  it('should detect unquoted values with spaces', () => {
    const envFile = join(tempDir, '.env');
    writeFileSync(envFile, 'DESCRIPTION=This is a value with spaces\nAPI_KEY=secret');

    const result = lintCommand({ file: envFile, strict: true });

    expect(result.success).toBe(false);
  });

  it('should handle quoted values with spaces', () => {
    const envFile = join(tempDir, '.env');
    writeFileSync(envFile, 'DESCRIPTION="This is a quoted value"\nAPI_KEY=secret');

    const result = lintCommand({ file: envFile });

    expect(result.success).toBe(true);
  });

  it('should report warnings for suspicious patterns when warnings enabled', () => {
    const envFile = join(tempDir, '.env');
    writeFileSync(
      envFile,
      'PASSWORD=password123\nAPI_KEY=12345\nDATABASE_URL=postgres://localhost'
    );

    const result = lintCommand({ file: envFile, warnings: true });

    expect(result.success).toBe(true);
  });

  it('should fail when file does not exist', () => {
    const envFile = join(tempDir, 'nonexistent.env');

    const result = lintCommand({ file: envFile });

    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });

  it('should handle empty .env file', () => {
    const envFile = join(tempDir, '.env');
    writeFileSync(envFile, '');

    const result = lintCommand({ file: envFile });

    expect(result.success).toBe(true);
  });

  it('should validate format in strict mode', () => {
    const envFile = join(tempDir, '.env');
    writeFileSync(envFile, '# Comment\nDATABASE_URL=postgres://localhost\nAPI_KEY=secret123');

    const result = lintCommand({ file: envFile, strict: true });

    expect(result.success).toBe(true);
  });
});
