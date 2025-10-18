#!/usr/bin/env node

/**
 * EnvWizard CLI - Executable Entry Point
 * This file is called when running: envwizard [command]
 */

import { runCLI } from '../src/index';

// Run the CLI with command line arguments
// Skip first two arguments (node and script path)
runCLI(process.argv);
