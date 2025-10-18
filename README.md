# 🧙‍♂️ Env-Mage CLI v1

A powerful CLI tool for managing `.env` files — init, validate, sync, diff, typegen, scan, lint, and encrypt/decrypt. Available directly through npm with no additional build steps required.

## ✨ Features

- **init** - Generate `.env.example` from `.env`
- **validate** - Check for mismatched keys
- **sync** - Sync keys between env files
- **diff** - Compare two env files
- **typegen** - Generate TypeScript types from `.env.example`
- **scan** - Find `process.env.*` usage in code
- **lint** - Lint `.env` files for syntax issues
- **encrypt/decrypt** - Secure env files with AES-256

## 🚀 Quick Start

### Installation

```bash
# Install globally
npm install -g env-mage

# Or use with npx without installing
npx env-mage <command>

# Or install as a dev dependency
npm install --save-dev env-mage
```

> **Note**: Env-Mage is distributed as a complete npm package with all code included. No separate build files or compilation steps are needed.

### Usage

```bash
# Create a template .env.example from your .env
env-mage init

# Check for consistency between .env and .env.example
env-mage validate

# Find differences between .env and .env.example
env-mage diff

# Generate TypeScript types from your .env
env-mage typegen
```

## 📘 Command Reference

### `init`

Generate a `.env.example` template from your `.env` file, removing sensitive values while preserving keys.

```bash
# Basic usage
env-mage init

# With custom paths
env-mage init --env .env.production --output .env.example

# Create a backup
env-mage init --backup
```

### `validate`

Check consistency between `.env` and `.env.example` files, identifying missing or extra variables.

```bash
# Basic usage
env-mage validate

# Strict mode (fails if extra keys exist)
env-mage validate --strict

# Custom paths
env-mage validate --env .env.staging --example .env.example
```

### `sync`

Synchronize environment variables between files with customizable strategies.

```bash
# Basic usage (merge strategy)
env-mage sync

# Choose a strategy
env-mage sync --strategy overwrite  # overwrite existing values
env-mage sync --strategy preserve   # keep existing values
env-mage sync --strategy merge      # smart merge (default)

# Custom paths
env-mage sync --source .env.example --target .env.local
```

### `diff`

Show detailed differences between two environment files with color-coded output.

```bash
# Basic usage
env-mage diff

# Custom paths
env-mage diff --from .env.development --to .env.production
```

### `typegen`

Generate TypeScript type definitions from your environment variables.

```bash
# Basic usage
env-mage typegen

# Choose output format
env-mage typegen --format interface  # TypeScript interface (default)
env-mage typegen --format type       # TypeScript type
env-mage typegen --format const      # const assertions

# Specify output file
env-mage typegen --output src/env.types.ts
```

### `scan`

Scan your codebase for all `process.env` usage to identify required variables.

```bash
# Basic usage
env-mage scan

# Specify directory
env-mage scan --path ./src

# Filter by extensions
env-mage scan --extensions .ts,.js,.jsx,.tsx

# Exclude patterns
env-mage scan --exclude node_modules,dist,build
```

### `lint`

Validate your `.env` file format and detect potential issues.

```bash
# Basic usage
env-mage lint

# Include warnings
env-mage lint --warnings

# Strict mode
env-mage lint --strict

# Custom path
env-mage lint --file .env.local
```

## � Architecture

Env-Mage is designed as a modern, ESM-compatible npm package. Unlike some tools that require separate build steps or external dependencies, all Env-Mage code is directly included in the npm package.

- **Complete Package**: All application code is distributed through npm
- **ESM Modules**: Uses native JavaScript modules for better tree-shaking and compatibility
- **No External Build Steps**: Works immediately after installation
- **TypeScript Definitions**: Includes full TypeScript typings for IDE integration

## �📝 License

MIT
