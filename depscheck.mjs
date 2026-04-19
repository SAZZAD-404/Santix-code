#!/usr/bin/env node

import { existsSync } from 'fs';
import process from 'process';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local if it exists
if (existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else {
  // Create a minimal .env.local so the app can start
  console.warn('\x1b[33m⚠️  .env.local not found, using defaults. Add your API keys to .env.local\x1b[0m');
}

function checkNodeVersion() {
  const version = process.version.match(/^v(\d+)/)[1];
  if (parseInt(version) < 20) {
    console.error('\x1b[31m❌ Node.js 20 or greater is required. Current version:', process.version, '\x1b[0m');
    console.error("Run `nvm use`, and if that doesn't work run `nvm install; nvm use`.");
    process.exit(1);
  }
}

function checkEnvVars() {
  if (
    !process.env.XAI_API_KEY &&
    !process.env.GOOGLE_API_KEY &&
    !process.env.ANTHROPIC_API_KEY &&
    !process.env.OPENAI_API_KEY &&
    !process.env.GOOGLE_VERTEX_CREDENTIALS_JSON
  ) {
    // Just warn - users can add keys via the Settings UI
    console.warn('\x1b[33m⚠️  No server-side AI API keys set in .env.local\x1b[0m');
    console.warn('Add at least one to .env.local: ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY, XAI_API_KEY');
    console.warn('Or add your keys via the Settings page in the app.');
  }
}

checkNodeVersion();
checkEnvVars();
