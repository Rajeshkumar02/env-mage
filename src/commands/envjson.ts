/**
 * EnvJson Command
 * Generates a JSON structure from .env file
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseEnvContent } from '../utils/envParser';
import { logger } from '../utils/logger';

interface Result {
  success: boolean;
  message: string;
}

/**
 * Generate a JSON structure from .env file
 * @param envPath Path to the .env file
 * @param outputPath Path to the output JSON file
 * @param includeValues Whether to include actual values or placeholder values
 * @returns Result object with success status and message
 */
export function envJsonCommand(
  envPath: string = '.env',
  outputPath: string = '.env.json',
  includeValues: boolean = false
): Result {
  try {
    // Resolve paths
    const resolvedEnvPath = path.resolve(process.cwd(), envPath);
    const resolvedOutputPath = path.resolve(process.cwd(), outputPath);

    // Check if .env file exists
    if (!fs.existsSync(resolvedEnvPath)) {
      return {
        success: false,
        message: `No ${envPath} file found. Run "env-mage init" first`,
      };
    }

    // Read and parse .env file
    const content = fs.readFileSync(resolvedEnvPath, 'utf8');
    const envVars = parseEnvContent(content);

    // Create JSON structure
    const jsonStructure: Record<string, string | null> = {};

    for (const [key, value] of Object.entries(envVars)) {
      // If includeValues is false, replace values with null or placeholder
      jsonStructure[key] = includeValues ? value : null;
    }

    // Write to output file
    const jsonContent = JSON.stringify(jsonStructure, null, 2);
    fs.writeFileSync(resolvedOutputPath, jsonContent);

    return {
      success: true,
      message: `✅ Created ${outputPath} with ${Object.keys(jsonStructure).length} keys`,
    };
  } catch (error) {
    logger.debug(`Error in envJson command: ${error}`);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error in envJson command',
    };
  }
}
