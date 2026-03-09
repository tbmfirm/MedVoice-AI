import { prisma } from './lib/db';

async function verifySchema() {
  try {
    // Test if CallLog table exists
    console.log('Testing CallLog table...');
    const callLogCount = await prisma.callLog.count();
    console.log('✅ CallLog table exists, count:', callLogCount);
    
    // Test if ClinicSchedule table exists
    console.log('Testing ClinicSchedule table...');
    const scheduleCount = await prisma.clinicSchedule.count();
    console.log('✅ ClinicSchedule table exists, count:', scheduleCount);
    
    // Test organization with schedule
    const org = await prisma.organization.findFirst({
      where: { twilioPhoneNumber: '+15559876543' },
      include: { clinicSchedule: true },
    });
    
    if (org) {
      console.log('✅ Organization found with twilioPhoneNumber');
      console.log('✅ Has schedule:', !!org.clinicSchedule);
      if (org.clinicSchedule) {
        console.log('Schedule routing mode:', org.clinicSchedule.callRoutingMode);
        console.log('Schedule timezone:', org.clinicSchedule.timezone);
      }
    } else {
      console.log('❌ Organization not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Schema verification failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('This likely means the database schema needs to be updated.');
      console.error('Run: npm run db:push');
    }
    process.exit(1);
  }
}

verifySchema();
