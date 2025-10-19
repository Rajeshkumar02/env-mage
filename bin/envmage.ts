#!/usr/bin/env node

/**
 * EnvMage CLI - Executable Entry Point
 * This file is called when running: EnvMage [command]
 */

import { runCLI } from '../src/index';

// Run the CLI with command line arguments
// Skip first two arguments (node and script path)
runCLI(process.argv);
