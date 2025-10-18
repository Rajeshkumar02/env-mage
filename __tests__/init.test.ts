/**
 * Env-Mage - Init Command Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { initCommand } from '../src/commands/init';

describe('Init Command', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(__dirname, 'temp-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should generate .env.example from .env file', () => {
    // Create test .env file
    const envFile = join(tempDir, '.env');
    writeFileSync(envFile, 'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123\nPORT=3000');

    // Run command
    const exampleFile = join(tempDir, '.env.example');
    const result = initCommand(envFile, exampleFile, false);

    // Assert
    expect(result.success).toBe(true);
    expect(result.message).toContain('Created');
    if (result.data && typeof result.data === 'object') {
      expect((result.data as any).keyCount).toBe(3);
    }

    // Check file was created
    const content = readFileSync(exampleFile, 'utf-8');
    expect(content).toContain('DATABASE_URL=');
    expect(content).toContain('API_KEY=');
    expect(content).toContain('PORT=');
  });

  it('should fail if .env does not exist', () => {
    const result = initCommand(join(tempDir, 'nonexistent.env'), join(tempDir, '.env.example'));
    expect(result.success).toBe(false);
    expect(result.message).toContain('No .env file found');
  });

  it('should handle multiline values', () => {
    const envFile = join(tempDir, '.env');
    writeFileSync(envFile, 'PRIVATE_KEY="-----BEGIN\\nMULTILINE\\nKEY-----END"\nAPI_KEY=secret');

    const exampleFile = join(tempDir, '.env.example');
    const result = initCommand(envFile, exampleFile, false);

    expect(result.success).toBe(true);
    if (result.data && typeof result.data === 'object') {
      expect((result.data as any).keyCount).toBe(2);
    }
  });

  it('should handle comments in .env file', () => {
    const envFile = join(tempDir, '.env');
    writeFileSync(
      envFile,
      '# Database config\nDATABASE_URL=postgres://localhost\n# API config\nAPI_KEY=secret123'
    );

    const exampleFile = join(tempDir, '.env.example');
    const result = initCommand(envFile, exampleFile, false);

    expect(result.success).toBe(true);
    if (result.data && typeof result.data === 'object') {
      expect((result.data as any).keyCount).toBe(2);
    }
  });

  it('should create backup when backup flag is true', () => {
    const envFile = join(tempDir, '.env');
    const exampleFile = join(tempDir, '.env.example');

    writeFileSync(envFile, 'KEY1=value1');
    writeFileSync(exampleFile, 'OLD_KEY=old_value');

    const result = initCommand(envFile, exampleFile, true);

    expect(result.success).toBe(true);
    if (result.data && typeof result.data === 'object') {
      expect((result.data as any).backupPath).toBeDefined();
    }
  });
});
