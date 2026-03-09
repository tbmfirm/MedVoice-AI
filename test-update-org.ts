import { prisma } from './lib/db';

async function updateOrg() {
  try {
    const result = await prisma.organization.updateMany({
      where: { name: 'Test Clinic' },
      data: {
        twilioPhoneNumber: '+15559876543',
      },
    });
    
    console.log('✅ Updated', result.count, 'organization(s)');
    
    // Verify the update
    const org = await prisma.organization.findFirst({
      where: { name: 'Test Clinic' },
      select: { id: true, name: true, twilioPhoneNumber: true },
    });
    
    console.log('Updated organization:', org);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateOrg();
