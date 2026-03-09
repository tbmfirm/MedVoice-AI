# Database Setup Guide

This document outlines the database setup and configuration for MedVoice AI.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or remote)
- Database connection string

## Installation

1. Install dependencies:
```bash
npm install
```

This will install:
- `@prisma/client` - Prisma ORM client
- `prisma` - Prisma CLI (dev dependency)

## Environment Variables

Create a `.env.local` file in the root directory with the following:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/medvoice_ai?schema=public"

# Resend API Key (for email)
RESEND_API_KEY=your_resend_api_key_here

# Application Environment
NODE_ENV=development

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database URL Format

The `DATABASE_URL` follows this format:
```
postgresql://[user]:[password]@[host]:[port]/[database]?schema=[schema]
```

Example for local PostgreSQL:
```
postgresql://postgres:password@localhost:5432/medvoice_ai?schema=public
```

Example for remote PostgreSQL (e.g., Supabase, Railway, etc.):
```
postgresql://user:password@host.railway.app:5432/railway?schema=public
```

## Database Setup Steps

### 1. Generate Prisma Client

Generate the Prisma Client based on your schema:
```bash
npm run db:generate
```

### 2. Create Database

If using local PostgreSQL, create the database:
```bash
createdb medvoice_ai
```

Or use your PostgreSQL client to create the database.

### 3. Run Migrations

For development, push the schema to your database:
```bash
npm run db:push
```

For production, use migrations:
```bash
npm run db:migrate
```

This will:
- Create all tables defined in `prisma/schema.prisma`
- Set up indexes and relationships
- Create the database structure

### 4. (Optional) Seed Database

If you have seed data, run:
```bash
npm run db:seed
```

### 5. Verify Setup

Open Prisma Studio to view and manage your database:
```bash
npm run db:studio
```

This will open a web interface at `http://localhost:5555` where you can:
- View all tables
- Add/edit/delete records
- Explore relationships

## Database Schema Overview

The database includes the following main models:

### Core Models

1. **Organization** - Medical practices/clinics
   - Stores practice information, subscription tier, HIPAA compliance status

2. **User** - System users (admins, staff, clinicians)
   - Authentication, roles, permissions

3. **Patient** - Patient records
   - Demographics, contact info, EMR integration

4. **Appointment** - Scheduled appointments
   - Links patients to organizations, syncs with EMR systems

5. **Call** - Call records
   - Tracks all inbound/outbound calls, AI agent interactions, transcripts

6. **EMRIntegration** - EMR system integrations
   - Epic, Cerner, Athena, etc. connection details

7. **OrganizationSettings** - Practice-specific settings
   - AI voice configuration, business hours, notification preferences

8. **AuditLog** - HIPAA compliance audit trail
   - Tracks all data access and modifications

## Available Scripts

- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database (development)
- `npm run db:migrate` - Create and apply migrations (development)
- `npm run db:migrate:deploy` - Apply migrations (production)
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with initial data
- `npm run db:reset` - Reset database (WARNING: deletes all data)

## Database Connection

The database connection is handled in `lib/db.ts`. It uses a singleton pattern to prevent multiple connections in development.

```typescript
import { prisma } from '@/lib/db';

// Use prisma client in your code
const users = await prisma.user.findMany();
```

## HIPAA Compliance

The database schema includes several HIPAA compliance features:

1. **Audit Logging** - All data access is logged in the `AuditLog` table
2. **Consent Tracking** - Patient consent is tracked with timestamps
3. **Access Controls** - User roles and permissions for data access
4. **Data Encryption** - Sensitive fields (like API keys) should be encrypted at the application level

## Production Considerations

1. **Connection Pooling** - Use a connection pooler like PgBouncer
2. **Backups** - Set up regular database backups
3. **Encryption** - Encrypt sensitive fields (API keys, secrets) before storing
4. **Migrations** - Always use migrations in production, never `db:push`
5. **Monitoring** - Set up database monitoring and alerts
6. **Indexes** - Review and optimize indexes based on query patterns

## Troubleshooting

### Connection Issues

If you're having connection issues:
1. Verify your `DATABASE_URL` is correct
2. Check that PostgreSQL is running
3. Verify network/firewall settings for remote databases
4. Check database credentials

### Migration Issues

If migrations fail:
1. Check for pending migrations: `npx prisma migrate status`
2. Review migration files in `prisma/migrations/`
3. For development, you can reset: `npm run db:reset` (WARNING: deletes data)

### Prisma Client Issues

If Prisma Client is out of sync:
1. Regenerate: `npm run db:generate`
2. Restart your development server

## Next Steps

After setting up the database:
1. Set up authentication system
2. Create API routes for CRUD operations
3. Implement data validation
4. Set up audit logging middleware
5. Configure EMR integrations
