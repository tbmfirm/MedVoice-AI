import { prisma } from '../lib/db';
import { hashPassword } from '../lib/auth/password';

async function createAdmin() {
  try {
    // Get first organization or create one
    let org = await prisma.organization.findFirst();
    
    if (!org) {
      console.log('No organization found. Creating a demo organization...');
      org = await prisma.organization.create({
        data: {
          name: 'Demo Clinic',
          email: 'demo@clinic.com',
          phone: '+1234567890',
        },
      });
      console.log('✅ Created organization:', org.name);
    }

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        email: 'admin@example.com',
      },
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:', existingAdmin.email);
      console.log('   To create a new admin, use a different email.');
      return;
    }

    // Get password from command line or use default
    const password = process.argv[2] || 'admin123';
    const email = process.argv[3] || 'admin@example.com';
    const firstName = process.argv[4] || 'Admin';
    const lastName = process.argv[5] || 'User';

    console.log('\n📝 Creating admin user...');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   Organization:', org.name);
    console.log('');

    const passwordHash = await hashPassword(password);

    const admin = await prisma.user.create({
      data: {
        organizationId: org.id,
        email,
        passwordHash,
        firstName,
        lastName,
        role: 'admin',
        emailVerified: true,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Email:', admin.email);
    console.log('   Password:', password);
    console.log('   Role:', admin.role);
    console.log('\n🔗 Login URL: http://localhost:3000/login');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
