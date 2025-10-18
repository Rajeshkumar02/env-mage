/**
 * Env-Mage - Typegen Command Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { typegenCommand } from '../src/commands/typegen';

describe('Typegen Command', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(__dirname, 'temp-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should generate TypeScript interface from .env file', () => {
    const envFile = join(tempDir, '.env');
    const outputFile = join(tempDir, 'env.types.ts');

    writeFileSync(envFile, 'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123\nPORT=3000');

    const result = typegenCommand({ env: envFile, output: outputFile, format: 'interface' });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Generated');

    const content = readFileSync(outputFile, 'utf-8');
    expect(content).toContain('interface');
    expect(content).toContain('DATABASE_URL');
    expect(content).toContain('API_KEY');
    expect(content).toContain('PORT');
  });

  it('should generate TypeScript type from .env file', () => {
    const envFile = join(tempDir, '.env');
    const outputFile = join(tempDir, 'env.types.ts');

    writeFileSync(envFile, 'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123');

    const result = typegenCommand({ env: envFile, output: outputFile, format: 'type' });

    expect(result.success).toBe(true);

    const content = readFileSync(outputFile, 'utf-8');
    expect(content).toContain('type');
    expect(content).toContain('DATABASE_URL');
  });

  it('should generate const object from .env file', () => {
    const envFile = join(tempDir, '.env');
    const outputFile = join(tempDir, 'env.types.ts');

    writeFileSync(envFile, 'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123');

    const result = typegenCommand({ env: envFile, output: outputFile, format: 'const' });

    expect(result.success).toBe(true);

    const content = readFileSync(outputFile, 'utf-8');
    expect(content).toContain('const');
    expect(content).toContain('DATABASE_URL');
  });

  it('should handle comments in .env file', () => {
    const envFile = join(tempDir, '.env');
    const outputFile = join(tempDir, 'env.types.ts');

    writeFileSync(
      envFile,
      '# Database config\nDATABASE_URL=postgres://localhost\n# API config\nAPI_KEY=secret123'
    );

    const result = typegenCommand({ env: envFile, output: outputFile, format: 'interface' });

    expect(result.success).toBe(true);

    const content = readFileSync(outputFile, 'utf-8');
    expect(content).toContain('DATABASE_URL');
    expect(content).toContain('API_KEY');
  });

  it('should fail when .env file does not exist', () => {
    const envFile = join(tempDir, 'nonexistent.env');
    const outputFile = join(tempDir, 'env.types.ts');

    const result = typegenCommand({ env: envFile, output: outputFile });

    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });

  it('should generate with strict mode enabled', () => {
    const envFile = join(tempDir, '.env');
    const outputFile = join(tempDir, 'env.types.ts');

    writeFileSync(envFile, 'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123');

    const result = typegenCommand({
      env: envFile,
      output: outputFile,
      format: 'interface',
      strict: true,
    });

    expect(result.success).toBe(true);

    const content = readFileSync(outputFile, 'utf-8');
    expect(content).toContain('DATABASE_URL');
  });
});
