/**
 * Env-Mage - Cross-Platform Tests
 * Verifies that file operations work correctly on different OS platforms
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { normalize } from 'path';
import { validateCommand } from '../src/commands/validate';
import { readFile, writeFile, fileExists, getTempDir, createPath } from '../src/utils/fileUtils';

describe('Cross-Platform Compatibility', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = getTempDir('cross-platform-test-');
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to clean up temp dir ${tempDir}`, error);
    }
  });

  describe('File Path Handling', () => {
    it('should handle forward slashes in paths', () => {
      const filePath = join(tempDir, 'test-file.txt');
      const content = 'test content';

      // Use forward slash path
      const forwardSlashPath = filePath.replace(/\\/g, '/');

      // Write and read with forward slashes
      writeFile(forwardSlashPath, content);
      expect(fileExists(forwardSlashPath)).toBe(true);
      expect(readFile(forwardSlashPath)).toBe(content);
    });

    it('should handle backslashes in paths', () => {
      const filePath = join(tempDir, 'test-file.txt');
      const content = 'test content';

      // Use backslash path (Windows style)
      const backslashPath = filePath.replace(/\//g, '\\');

      // Write and read with backslashes
      writeFile(backslashPath, content);
      expect(fileExists(backslashPath)).toBe(true);
      expect(readFile(backslashPath)).toBe(content);
    });

    it('should normalize mixed slash paths', () => {
      const filePath = join(tempDir, 'test-file.txt');
      const content = 'test content';

      // Use mixed slash path
      const mixedPath = tempDir + '/test-file.txt';

      // Write and read with mixed slashes
      writeFile(mixedPath, content);
      expect(fileExists(filePath)).toBe(true);
      expect(readFile(filePath)).toBe(content);
    });
  });

  describe('Line Ending Handling', () => {
    it('should normalize Windows CRLF line endings', () => {
      const filePath = join(tempDir, '.env');
      const windowsContent = 'KEY1=value1\r\nKEY2=value2\r\n';
      const normalizedContent = 'KEY1=value1\nKEY2=value2\n';

      writeFile(filePath, windowsContent);
      const content = readFile(filePath);

      expect(content).toEqual(normalizedContent);
    });

    it('should work with Unix LF line endings', () => {
      const filePath = join(tempDir, '.env');
      const unixContent = 'KEY1=value1\nKEY2=value2\n';

      writeFile(filePath, unixContent);
      const content = readFile(filePath);

      expect(content).toEqual(unixContent);
    });
  });

  describe('createPath utility', () => {
    it('should create consistent paths across platforms', () => {
      const path1 = createPath(tempDir, 'folder', 'file.txt');
      const path2 = join(tempDir, 'folder', 'file.txt');

      expect(normalize(path1)).toEqual(normalize(path2));
    });
  });
});
