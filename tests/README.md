# Tests Directory

This directory contains various test scripts and utilities for the Strength & Conditioning Application.

## Available Tests

### `test-supabase-connection.js`
Tests the connection to Supabase database and verifies authentication setup.

**Usage:**
```bash
node tests/test-supabase-connection.js
```

**Requirements:**
- Node.js
- npm packages: `@supabase/supabase-js`, `dotenv`
- `.env` file with Supabase credentials

**What it tests:**
- Environment variables are properly loaded
- Supabase client can be created
- Basic authentication connection works
- Database access is functional

## Running Tests

Make sure you have the required dependencies installed:
```bash
npm install @supabase/supabase-js dotenv
```

Then run any test from the project root directory:
```bash
node tests/test-supabase-connection.js
```