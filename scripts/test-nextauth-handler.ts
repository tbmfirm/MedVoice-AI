import { config } from 'dotenv';
import { resolve } from 'path';
import NextAuth from 'next-auth';
import { authOptions } from '../lib/auth/config';

// Load .env.local
const envPath = resolve(process.cwd(), '.env.local');
config({ path: envPath });

// Test script to see what NextAuth actually returns
console.log('Testing NextAuth handler...\n');

const result = NextAuth(authOptions);

console.log('Type of result:', typeof result);
console.log('Is function:', typeof result === 'function');
console.log('Is object:', typeof result === 'object');
console.log('Result:', result);

if (result && typeof result === 'object') {
  console.log('\nObject keys:', Object.keys(result));
  if ('handlers' in result) {
    console.log('Has handlers property');
    console.log('Handlers:', (result as any).handlers);
  }
  if ('GET' in result) {
    console.log('Has GET property');
  }
  if ('POST' in result) {
    console.log('Has POST property');
  }
}
