/**
 * Env-Mage - Integration Tests
 * Test interactions between multiple commands
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { initCommand } from '../src/commands/init';
import { validateCommand } from '../src/commands/validate';
import { syncCommand } from '../src/commands/sync';
import { diffCommand } from '../src/commands/diff';
import { typegenCommand } from '../src/commands/typegen';

describe('Integration Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(__dirname, 'temp-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should initialize and then validate successfully', () => {
    const envFile = join(tempDir, '.env');
    const exampleFile = join(tempDir, '.env.example');

    // Create .env with values
    writeFileSync(envFile, 'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123\nPORT=3000');

    // Initialize .env.example
    const initResult = initCommand(envFile, exampleFile);
    expect(initResult.success).toBe(true);

    // Validate
    const validateResult = validateCommand({ envFile, exampleFile });
    expect(validateResult.success).toBe(true);
  });

  it('should sync and then diff correctly', () => {
    const sourceFile = join(tempDir, 'source.env');
    const targetFile = join(tempDir, 'target.env');

    // Write source
    writeFileSync(sourceFile, 'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123\nPORT=3000');

    // Write initial target
    writeFileSync(targetFile, 'DATABASE_URL=\nAPI_KEY=');

    // Sync
    const syncResult = syncCommand({ source: sourceFile, target: targetFile, strategy: 'merge' });
    expect(syncResult.success).toBe(true);

    // Diff should show no significant differences
    const diffResult = diffCommand({ from: sourceFile, to: targetFile });
    expect(diffResult.success).toBe(true);
  });

  it('should validate and generate types from validated .env', () => {
    const envFile = join(tempDir, '.env');
    const exampleFile = join(tempDir, '.env.example');
    const typeFile = join(tempDir, 'env.types.ts');

    // Setup files
    writeFileSync(envFile, 'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123\nPORT=3000');
    writeFileSync(exampleFile, 'DATABASE_URL=\nAPI_KEY=\nPORT=');

    // Validate
    const validateResult = validateCommand({ envFile, exampleFile });
    expect(validateResult.success).toBe(true);

    // Generate types
    const typegenResult = typegenCommand({ env: envFile, output: typeFile, format: 'interface' });
    expect(typegenResult.success).toBe(true);

    // Verify type file was created
    const typeContent = readFileSync(typeFile, 'utf-8');
    expect(typeContent).toContain('DATABASE_URL');
  });

  it('should init, sync, and then diff all together', () => {
    const envFile = join(tempDir, '.env');
    const exampleFile = join(tempDir, '.env.example');
    const backupFile = join(tempDir, 'backup.env');

    // Create source .env
    writeFileSync(envFile, 'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123\nPORT=3000');

    // Initialize example
    const initResult = initCommand(envFile, exampleFile);
    expect(initResult.success).toBe(true);

    // Create backup file with different content
    writeFileSync(backupFile, 'DATABASE_URL=postgres://old\nAPI_KEY=old_secret');

    // Sync from backup to example
    const syncResult = syncCommand({ source: backupFile, target: exampleFile, strategy: 'merge' });
    expect(syncResult.success).toBe(true);

    // Diff should show differences
    const diffResult = diffCommand({ from: backupFile, to: envFile });
    expect(diffResult.success).toBe(true);
  });

  it('should handle full workflow: init -> validate -> sync -> typegen', () => {
    const envFile = join(tempDir, '.env');
    const exampleFile = join(tempDir, '.env.example');
    const typeFile = join(tempDir, 'types.ts');

    // Step 1: Create .env and initialize .env.example
    writeFileSync(
      envFile,
      'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123\nPORT=3000\nLOG_LEVEL=debug'
    );
    const initResult = initCommand(envFile, exampleFile);
    expect(initResult.success).toBe(true);

    // Step 2: Validate that they match
    const validateResult = validateCommand({ envFile, exampleFile });
    expect(validateResult.success).toBe(true);

    // Step 3: Create another env file and sync to example
    const newEnvFile = join(tempDir, 'new.env');
    writeFileSync(
      newEnvFile,
      'DATABASE_URL=postgres://new\nAPI_KEY=new_key\nPORT=5000\nLOG_LEVEL=info\nNEW_VAR=added'
    );
    const syncResult = syncCommand({ source: newEnvFile, target: exampleFile, strategy: 'merge' });
    expect(syncResult.success).toBe(true);

    // Step 4: Generate types from the synced example
    const typegenResult = typegenCommand({
      env: exampleFile,
      output: typeFile,
      format: 'interface',
    });
    expect(typegenResult.success).toBe(true);

    const typeContent = readFileSync(typeFile, 'utf-8');
    expect(typeContent).toContain('NEW_VAR');
  });

  it('should handle overwrites and validation properly', () => {
    const sourceFile = join(tempDir, 'source.env');
    const targetFile = join(tempDir, 'target.env');

    // Create files
    writeFileSync(sourceFile, 'KEY1=value1\nKEY2=value2');
    writeFileSync(targetFile, 'KEY1=old1\nKEY2=old2\nKEY3=old3');

    // Overwrite target with source
    const syncResult = syncCommand({
      source: sourceFile,
      target: targetFile,
      strategy: 'overwrite',
    });
    expect(syncResult.success).toBe(true);

    // Validate that KEY3 is gone
    const content = readFileSync(targetFile, 'utf-8');
    expect(content).not.toContain('KEY3');
    expect(content).toContain('KEY1=value1');
  });

  it('should generate different type formats correctly', () => {
    const envFile = join(tempDir, '.env');

    writeFileSync(envFile, 'DATABASE_URL=postgres://localhost\nAPI_KEY=secret123');

    // Generate interface
    const interfaceFile = join(tempDir, 'interface.ts');
    const ifaceResult = typegenCommand({
      env: envFile,
      output: interfaceFile,
      format: 'interface',
    });
    expect(ifaceResult.success).toBe(true);
    expect(readFileSync(interfaceFile, 'utf-8')).toContain('interface');

    // Generate type
    const typeFile = join(tempDir, 'type.ts');
    const typeResult = typegenCommand({ env: envFile, output: typeFile, format: 'type' });
    expect(typeResult.success).toBe(true);
    expect(readFileSync(typeFile, 'utf-8')).toContain('type ');

    // Generate const
    const constFile = join(tempDir, 'const.ts');
    const constResult = typegenCommand({ env: envFile, output: constFile, format: 'const' });
    expect(constResult.success).toBe(true);
    expect(readFileSync(constFile, 'utf-8')).toContain('const');
  });
});
