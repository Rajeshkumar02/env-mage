/**
 * Env-Mage - Diff Command Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { diffCommand } from '../src/commands/diff';

describe('Diff Command', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(__dirname, 'temp-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should detect added keys', () => {
    const fromFile = join(tempDir, '.env');
    const toFile = join(tempDir, '.env.example');

    writeFileSync(fromFile, 'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123');
    writeFileSync(toFile, 'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123\nPORT=3000');

    const result = diffCommand({ from: fromFile, to: toFile });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Added');
  });

  it('should detect removed keys', () => {
    const fromFile = join(tempDir, '.env');
    const toFile = join(tempDir, '.env.example');

    writeFileSync(fromFile, 'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123\nPORT=3000');
    writeFileSync(toFile, 'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123');

    const result = diffCommand({ from: fromFile, to: toFile });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Removed');
  });

  it('should detect changed values', () => {
    const fromFile = join(tempDir, '.env');
    const toFile = join(tempDir, '.env.example');

    writeFileSync(fromFile, 'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123');
    writeFileSync(toFile, 'DATABASE_URL=postgres://production\nAPI_KEY=prod_secret');

    const result = diffCommand({ from: fromFile, to: toFile });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Changed');
  });

  it('should show no differences when files match', () => {
    const fromFile = join(tempDir, '.env');
    const toFile = join(tempDir, '.env.example');

    const content = 'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123\nPORT=3000';
    writeFileSync(fromFile, content);
    writeFileSync(toFile, content);

    const result = diffCommand({ from: fromFile, to: toFile });

    expect(result.success).toBe(true);
    expect(result.message).toContain('identical');
  });

  it('should fail when from file does not exist', () => {
    const fromFile = join(tempDir, 'nonexistent.env');
    const toFile = join(tempDir, '.env.example');

    writeFileSync(toFile, 'KEY=value');

    const result = diffCommand({ from: fromFile, to: toFile });

    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });

  it('should fail when to file does not exist', () => {
    const fromFile = join(tempDir, '.env');
    const toFile = join(tempDir, 'nonexistent.env.example');

    writeFileSync(fromFile, 'KEY=value');

    const result = diffCommand({ from: fromFile, to: toFile });

    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });
});
