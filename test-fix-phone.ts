import { prisma } from './lib/db';

async function fixPhone() {
  try {
    // Fix the phone number format (remove space)
    const result = await prisma.organization.updateMany({
      where: { name: 'Test Clinic' },
      data: {
        twilioPhoneNumber: '+15559876543', // No space
      },
    });
    
    console.log('✅ Updated', result.count, 'organization(s)');
    
    // Verify
    const org = await prisma.organization.findFirst({
      where: { twilioPhoneNumber: '+15559876543' },
      select: { id: true, name: true, twilioPhoneNumber: true },
    });
    
    console.log('Verified organization:', org);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixPhone();
