import { prisma } from './lib/db';
import { isWithinBusinessHours, getDaySchedule, isDayClosed } from './lib/clinic/schedule';

async function testSchedule() {
  const org = await prisma.organization.findFirst({
    include: { clinicSchedule: true },
  });

  if (!org?.clinicSchedule) {
    console.log('No schedule found. Run test-setup.ts first.');
    return;
  }

  const schedule = org.clinicSchedule;
  
  console.log('Testing business hours...');
  console.log('Current time in', schedule.timezone);
  console.log('Within business hours:', isWithinBusinessHours(schedule));
  
  console.log('\nDay schedules:');
  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
    const daySchedule = getDaySchedule(schedule, day);
    const closed = isDayClosed(schedule, day);
    console.log(`${day}: ${closed ? 'CLOSED' : `${daySchedule.open} - ${daySchedule.close}`}`);
  });
}

testSchedule().catch(console.error);