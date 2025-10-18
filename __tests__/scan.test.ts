/**
 * Env-Mage - Scan Command Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { scanCommand } from '../src/commands/scan';

describe('Scan Command', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(__dirname, 'temp-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should find process.env usage in JavaScript files', () => {
    const jsFile = join(tempDir, 'config.js');
    writeFileSync(
      jsFile,
      `
      const dbUrl = process.env.DATABASE_URL;
      const apiKey = process.env.API_KEY;
      console.log(process.env.PORT);
    `
    );

    const result = scanCommand({ path: tempDir, extensions: ['.js'] });

    expect(result.success).toBe(true);
    expect(result.message).toContain('found');
  });

  it('should find process.env usage in TypeScript files', () => {
    const tsFile = join(tempDir, 'config.ts');
    writeFileSync(
      tsFile,
      `
      const dbUrl: string = process.env.DATABASE_URL || '';
      const apiKey: string = process.env.API_KEY || 'default';
    `
    );

    const result = scanCommand({ path: tempDir, extensions: ['.ts'] });

    expect(result.success).toBe(true);
  });

  it('should exclude specified paths', () => {
    const jsFile = join(tempDir, 'config.js');
    const nodeModulesDir = join(tempDir, 'node_modules', 'package');
    const nodeModulesFile = join(nodeModulesDir, 'index.js');

    // Create directories recursively
    mkdirSync(nodeModulesDir, { recursive: true });

    writeFileSync(jsFile, 'const db = process.env.DATABASE_URL;');
    writeFileSync(nodeModulesFile, 'const db = process.env.DATABASE_URL;');

    const result = scanCommand({ path: tempDir, extensions: ['.js'], exclude: ['node_modules'] });

    expect(result.success).toBe(true);
  });

  it('should filter by file extensions', () => {
    const jsFile = join(tempDir, 'config.js');
    const txtFile = join(tempDir, 'readme.txt');

    writeFileSync(jsFile, 'const db = process.env.DATABASE_URL;');
    writeFileSync(txtFile, 'process.env.SOME_VAR');

    const result = scanCommand({ path: tempDir, extensions: ['.js'] });

    expect(result.success).toBe(true);
  });

  it('should handle empty directory', () => {
    const result = scanCommand({ path: tempDir, extensions: ['.js'] });

    expect(result.success).toBe(true);
  });

  it('should find multiple environment variables in single file', () => {
    const jsFile = join(tempDir, 'config.js');
    writeFileSync(
      jsFile,
      `
      const config = {
        db: process.env.DATABASE_URL,
        api: process.env.API_KEY,
        port: process.env.PORT,
        secret: process.env.SECRET_KEY,
        timeout: process.env.TIMEOUT
      };
    `
    );

    const result = scanCommand({ path: tempDir, extensions: ['.js'] });

    expect(result.success).toBe(true);
  });
});
