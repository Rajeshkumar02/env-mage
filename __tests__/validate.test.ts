/**
 * Env-Mage - Validate Command Tests
 * Cross-platform compatibility tests for various env file types
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { validateCommand } from '../src/commands/validate';
import { getTempDir } from '../src/utils/fileUtils';

describe('Validate Command', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = getTempDir('validate-test-');
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to clean up temp dir ${tempDir}`, error);
    }
  });

  it('should pass validation when .env and .env.example match', () => {
    const envFile = join(tempDir, '.env');
    const exampleFile = join(tempDir, '.env.example');

    writeFileSync(envFile, 'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123\nPORT=3000');
    writeFileSync(exampleFile, 'DATABASE_URL=\nAPI_KEY=\nPORT=');

    const result = validateCommand({ envFile, exampleFile, strict: false });

    expect(result.success).toBe(true);
    expect(result.message).toContain('valid');
  });

  it('should fail validation when .env has missing keys', () => {
    const envFile = join(tempDir, '.env');
    const exampleFile = join(tempDir, '.env.example');

    writeFileSync(envFile, 'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123');
    writeFileSync(exampleFile, 'DATABASE_URL=\nAPI_KEY=\nPORT=');

    const result = validateCommand({ envFile, exampleFile, strict: false });

    expect(result.success).toBe(false);
    expect(result.message).toContain('Missing keys');
  });

  it('should fail validation when .env has extra keys in strict mode', () => {
    const envFile = join(tempDir, '.env');
    const exampleFile = join(tempDir, '.env.example');

    writeFileSync(
      envFile,
      'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123\nPORT=3000\nEXTRA_KEY=value'
    );
    writeFileSync(exampleFile, 'DATABASE_URL=\nAPI_KEY=\nPORT=');

    const result = validateCommand({ envFile, exampleFile, strict: true });

    expect(result.success).toBe(false);
    expect(result.message).toContain('Extra keys');
  });

  it('should pass validation when .env has extra keys in non-strict mode', () => {
    const envFile = join(tempDir, '.env');
    const exampleFile = join(tempDir, '.env.example');

    writeFileSync(
      envFile,
      'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123\nPORT=3000\nEXTRA_KEY=value'
    );
    writeFileSync(exampleFile, 'DATABASE_URL=\nAPI_KEY=\nPORT=');

    const result = validateCommand({ envFile, exampleFile, strict: false });

    expect(result.success).toBe(true);
  });

  it('should fail when .env.example file does not exist', () => {
    const envFile = join(tempDir, '.env');
    writeFileSync(envFile, 'DATABASE_URL=postgres://localhost');

    const result = validateCommand({
      envFile,
      exampleFile: join(tempDir, 'nonexistent.env.example'),
      strict: false,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });

  it('should handle empty .env file', () => {
    const envFile = join(tempDir, '.env');
    const exampleFile = join(tempDir, '.env.example');

    writeFileSync(envFile, '');
    writeFileSync(exampleFile, '');

    const result = validateCommand({ envFile, exampleFile, strict: false });

    expect(result.success).toBe(true);
  });

  describe('Different Environment File Types', () => {
    it('should validate .env.local against .env.example', () => {
      const envFile = join(tempDir, '.env.local');
      const exampleFile = join(tempDir, '.env.example');

      writeFileSync(envFile, 'API_URL=https://api.local\nSECRET_KEY=local-secret\nDEBUG=true');
      writeFileSync(exampleFile, 'API_URL=\nSECRET_KEY=\nDEBUG=');

      const result = validateCommand({ envFile, exampleFile, strict: false });

      expect(result.success).toBe(true);
      expect(result.message).toContain('valid');
      expect(result.envFileName).toBe('.env.local');
      expect(result.exampleFileName).toBe('.env.example');
    });

    it('should validate .env.production against .env.example', () => {
      const envFile = join(tempDir, '.env.production');
      const exampleFile = join(tempDir, '.env.example');

      writeFileSync(envFile, 'API_URL=https://api.prod\nSECRET_KEY=prod-secret\nDEBUG=false');
      writeFileSync(exampleFile, 'API_URL=\nSECRET_KEY=\nDEBUG=');

      const result = validateCommand({ envFile, exampleFile, strict: false });

      expect(result.success).toBe(true);
      expect(result.message).toContain('valid');
      expect(result.envFileName).toBe('.env.production');
    });

    it('should validate .env.development against custom example file', () => {
      const envFile = join(tempDir, '.env.development');
      const exampleFile = join(tempDir, '.env.development.example');

      writeFileSync(envFile, 'API_URL=https://api.dev\nSECRET_KEY=dev-secret\nDEBUG=true');
      writeFileSync(exampleFile, 'API_URL=\nSECRET_KEY=\nDEBUG=');

      const result = validateCommand({ envFile, exampleFile, strict: false });

      expect(result.success).toBe(true);
      expect(result.message).toContain('valid');
      expect(result.envFileName).toBe('.env.development');
      expect(result.exampleFileName).toBe('.env.development.example');
    });

    it('should validate .env.test with missing keys and report specific file type', () => {
      const envFile = join(tempDir, '.env.test');
      const exampleFile = join(tempDir, '.env.example');

      writeFileSync(envFile, 'API_URL=https://api.test');
      writeFileSync(exampleFile, 'API_URL=\nSECRET_KEY=\nDEBUG=');

      const result = validateCommand({ envFile, exampleFile, strict: false });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Missing keys in .env.test');
      expect(result.envFileName).toBe('.env.test');
    });

    it('should automatically find type-specific example file', () => {
      const envFile = join(tempDir, '.env.staging');
      const specificExampleFile = join(tempDir, '.env.staging.example');

      writeFileSync(envFile, 'API_URL=https://api.staging\nSECRET_KEY=staging-secret');
      writeFileSync(specificExampleFile, 'API_URL=\nSECRET_KEY=');

      const result = validateCommand({ envFile }); // Not specifying example file

      expect(result.success).toBe(true);
      expect(result.envFileName).toBe('.env.staging');
      expect(result.exampleFileName).toBe('.env.staging.example');
    });
  });
});
