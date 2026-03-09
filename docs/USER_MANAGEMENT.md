# User Management & Access Control

## Overview

The system supports three user roles with different access levels:
- **Super Admin**: Can view/manage all clinics and users
- **Clinic Admin**: Can view/manage only their clinic
- **Staff**: Can view appointments and patients for their clinic (read-only for most settings)

## Access Control

### How Staff and Admin Access Pages

1. **Authentication Required**: All `/admin/*` routes require login
   - Unauthenticated users are redirected to `/login`
   - Login page: `http://localhost:3000/login`

2. **Role-Based Access**:
   - **Staff** (`role: 'staff'`): Can access:
     - Dashboard (`/admin`)
     - Appointments (`/admin/appointments`)
     - Patients (`/admin/patients`)
   - **Clinic Admin** (`role: 'admin'` with `organizationId`): Can access:
     - All staff pages
     - Users (`/admin/users`) - only their clinic's users
     - Doctors (`/admin/doctors`)
     - Settings (`/admin/settings`)
   - **Super Admin** (`role: 'admin'` without `organizationId` or with special flag): Can access:
     - All pages
     - All clinics' data
     - Organization switcher in header

3. **Middleware Protection**: 
   - `middleware.ts` checks for session cookie
   - Page components verify roles using `getCurrentUser()` and `requireAdmin()`

## Creating Users

### Method 1: Admin Dashboard (Recommended)

1. **Login as Admin**:
   - Go to `/login`
   - Sign in with admin credentials

2. **Navigate to Users Page**:
   - Click "Users" in the sidebar (admin only)
   - Or go to `/admin/users`

3. **Create New User**:
   - Click "Add User" button
   - Fill in the form:
     - **First Name** (required)
     - **Last Name** (required)
     - **Email** (required, must be unique)
     - **Password** (required for new users)
     - **Phone** (optional)
     - **Role**: Staff, Admin, or Clinician
     - **Organization** (if super admin, can select any org)
   - Click "Create User"

### Method 2: API Endpoint

```bash
POST /api/admin/users
Content-Type: application/json
Authorization: Required (admin only)

{
  "organizationId": "org_id_here",
  "email": "user@example.com",
  "password": "secure_password",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "staff" // or "admin" or "clinician"
}
```

### Method 3: Database Script

Create a script to seed initial admin user:

```typescript
// scripts/create-admin.ts
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';

async function createAdmin() {
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.error('No organization found. Create one first.');
    return;
  }

  const passwordHash = await hashPassword('your-secure-password');
  
  const admin = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'admin@example.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    },
  });

  console.log('✅ Admin user created:', admin.email);
}

createAdmin();
```

Run: `npx tsx scripts/create-admin.ts`

## Managing Users

### Edit User

1. Go to `/admin/users`
2. Click the edit icon (pencil) next to the user
3. Update fields (password optional - leave blank to keep current)
4. Click "Save Changes"

### Delete User

1. Go to `/admin/users`
2. Click the delete icon (trash) next to the user
3. Confirm deletion
4. **Note**: You cannot delete your own account

### Reset Password

1. Edit the user
2. Enter new password in the password field
3. Save changes

## User Roles Explained

### Staff (`role: 'staff'`)
- **Can**: View appointments, view patients, edit appointments (limited)
- **Cannot**: Delete appointments, manage users, access settings

### Clinic Admin (`role: 'admin'` with `organizationId`)
- **Can**: Everything staff can do, plus:
  - Create/edit/delete appointments
  - Manage users in their clinic
  - Manage doctors and schedules
  - Access clinic settings
- **Cannot**: View other clinics' data

### Super Admin (`role: 'admin'` without `organizationId`)
- **Can**: Everything, plus:
  - View all clinics
  - Manage all users across all clinics
  - Access system-wide settings
  - Switch between organizations

## Security Features

1. **Password Hashing**: All passwords are hashed with bcrypt (10 salt rounds)
2. **Account Lockout**: After 5 failed login attempts, account is locked for 30 minutes
3. **Session Management**: JWT tokens with 30-day expiration
4. **Role Verification**: Every API route checks user role and organization
5. **Organization Filtering**: Staff/clinic admin can only see their clinic's data

## API Protection

All admin API routes are protected:
- `/api/admin/*` - Requires authentication
- Role checks in each route
- Organization filtering applied automatically

Example:
```typescript
// Staff can only see their clinic's appointments
const orgFilter = getOrganizationFilter(user);
// Returns { organizationId: user.organizationId } for staff
// Returns null for super admin (no filter)
```

## Troubleshooting

### "Unauthorized" Error
- Check if user is logged in
- Verify user role matches required role
- Check if user's organizationId matches the resource's organizationId

### Cannot Access Users Page
- Only admins can access `/admin/users`
- Staff will be redirected with error

### Cannot Create User for Another Clinic
- Clinic admins can only create users for their own clinic
- Super admins can create users for any clinic

## Next Steps

1. **Create First Admin User**: Use the database script method above
2. **Login**: Go to `/login` and sign in
3. **Create More Users**: Use the admin dashboard
4. **Test Access**: Try accessing different pages as staff vs admin
