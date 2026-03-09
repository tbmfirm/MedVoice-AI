import { provisionClinicNumber } from './lib/twilio/provisioning';
import { prisma } from './lib/db';

async function testProvisioning() {
  const org = await prisma.organization.findFirst();
  
  if (!org) {
    console.log('No organization found. Run test-setup.ts first.');
    return;
  }

  console.log('Provisioning number for:', org.name);
  const result = await provisionClinicNumber(org.id, '415'); // SF area code
  
  if (result.success) {
    console.log('✅ Number provisioned:', result.phoneNumber);
    console.log('SID:', result.phoneNumberSid);
  } else {
    console.log('❌ Error:', result.error);
  }
}

testProvisioning().catch(console.error);
