/**
 * Env-Mage - Sync Command Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { syncCommand } from '../src/commands/sync';

describe('Sync Command', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(__dirname, 'temp-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should merge keys from source to target', () => {
    const sourceFile = join(tempDir, '.env');
    const targetFile = join(tempDir, '.env.example');

    writeFileSync(sourceFile, 'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123\nPORT=3000');
    writeFileSync(targetFile, 'DATABASE_URL=\nAPI_KEY=');

    const result = syncCommand({ source: sourceFile, target: targetFile, strategy: 'merge' });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Synced');

    const content = readFileSync(targetFile, 'utf-8');
    expect(content).toContain('PORT=');
  });

  it('should overwrite target with source keys', () => {
    const sourceFile = join(tempDir, '.env');
    const targetFile = join(tempDir, '.env.example');

    writeFileSync(sourceFile, 'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123');
    writeFileSync(targetFile, 'DATABASE_URL=\nAPI_KEY=\nPORT=3000\nEXTRA=value');

    const result = syncCommand({ source: sourceFile, target: targetFile, strategy: 'overwrite' });

    expect(result.success).toBe(true);

    const content = readFileSync(targetFile, 'utf-8');
    expect(content).not.toContain('PORT=');
    expect(content).not.toContain('EXTRA=');
  });

  it('should preserve target keys with preserve strategy', () => {
    const sourceFile = join(tempDir, '.env');
    const targetFile = join(tempDir, '.env.example');

    writeFileSync(sourceFile, 'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123\nPORT=3000');
    writeFileSync(targetFile, 'DATABASE_URL=prod://prod\nAPI_KEY=prod_secret');

    const result = syncCommand({ source: sourceFile, target: targetFile, strategy: 'preserve' });

    expect(result.success).toBe(true);

    const content = readFileSync(targetFile, 'utf-8');
    expect(content).toContain('DATABASE_URL=prod://prod');
    expect(content).toContain('API_KEY=prod_secret');
  });

  it('should fail if source file does not exist', () => {
    const sourceFile = join(tempDir, 'nonexistent.env');
    const targetFile = join(tempDir, '.env.example');

    writeFileSync(targetFile, 'KEY=value');

    const result = syncCommand({ source: sourceFile, target: targetFile });

    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });

  it('should create backup when backup is true', () => {
    const sourceFile = join(tempDir, '.env');
    const targetFile = join(tempDir, '.env.example');

    writeFileSync(sourceFile, 'KEY1=value1');
    writeFileSync(targetFile, 'OLD_KEY=old_value');

    const result = syncCommand({ source: sourceFile, target: targetFile, backup: true });

    expect(result.success).toBe(true);
    expect(result.message).toContain('backup');
  });

  it('should handle empty source file', () => {
    const sourceFile = join(tempDir, '.env');
    const targetFile = join(tempDir, '.env.example');

    writeFileSync(sourceFile, '');
    writeFileSync(targetFile, 'KEY=value');

    const result = syncCommand({ source: sourceFile, target: targetFile, strategy: 'overwrite' });

    expect(result.success).toBe(true);
  });
});
