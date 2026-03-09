// Script to check if environment variables are loaded correctly
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load .env.local file if it exists
const envPath = resolve(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  config({ path: envPath });
  console.log('✅ Loaded .env.local from:', envPath);
} else {
  console.log('⚠️  .env.local not found at:', envPath);
  // Try loading .env as fallback
  config();
}

console.log('\nEnvironment Variables Check:\n');
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? `✅ Set (${process.env.NEXTAUTH_SECRET.substring(0, 10)}...)` : '❌ Missing');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '❌ Missing');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

if (!process.env.NEXTAUTH_SECRET) {
  console.log('\n⚠️  NEXTAUTH_SECRET is not set!');
  console.log('Generate one with: openssl rand -base64 32');
}

if (!process.env.NEXTAUTH_URL) {
  console.log('\n⚠️  NEXTAUTH_URL is not set!');
  console.log('Set it to your ngrok URL: https://your-ngrok-url.ngrok-free.app');
}
