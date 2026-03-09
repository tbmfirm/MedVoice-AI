import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMigrationSafety() {
  console.log('Checking migration safety...\n');

  // Check for duplicate confirmationCodes
  console.log('1. Checking for duplicate confirmationCodes in appointments...');
  const appointments = await prisma.appointment.findMany({
    where: {
      confirmationCode: { not: null },
    },
    select: {
      id: true,
      confirmationCode: true,
    },
  });

  const confirmationCodeMap = new Map<string, number>();
  appointments.forEach((apt) => {
    if (apt.confirmationCode) {
      confirmationCodeMap.set(
        apt.confirmationCode,
        (confirmationCodeMap.get(apt.confirmationCode) || 0) + 1
      );
    }
  });

  const duplicateCodes = Array.from(confirmationCodeMap.entries()).filter(
    ([_, count]) => count > 1
  );

  if (duplicateCodes.length > 0) {
    console.log(`   ⚠️  Found ${duplicateCodes.length} duplicate confirmationCodes:`);
    duplicateCodes.forEach(([code, count]) => {
      console.log(`      - "${code}": ${count} appointments`);
    });
  } else {
    console.log('   ✅ No duplicate confirmationCodes found');
  }

  // Check for duplicate slugs
  console.log('\n2. Checking for duplicate slugs in organizations...');
  const organizations = await prisma.organization.findMany({
    where: {
      slug: { not: null },
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  const slugMap = new Map<string, number>();
  organizations.forEach((org) => {
    if (org.slug) {
      slugMap.set(org.slug, (slugMap.get(org.slug) || 0) + 1);
    }
  });

  const duplicateSlugs = Array.from(slugMap.entries()).filter(
    ([_, count]) => count > 1
  );

  if (duplicateSlugs.length > 0) {
    console.log(`   ⚠️  Found ${duplicateSlugs.length} duplicate slugs:`);
    duplicateSlugs.forEach(([slug, count]) => {
      console.log(`      - "${slug}": ${count} organizations`);
    });
  } else {
    console.log('   ✅ No duplicate slugs found');
  }

  // Check for null confirmationCodes that need to be generated
  console.log('\n3. Checking appointments without confirmationCodes...');
  const appointmentsWithoutCode = await prisma.appointment.count({
    where: {
      confirmationCode: null,
    },
  });

  if (appointmentsWithoutCode > 0) {
    console.log(`   ℹ️  Found ${appointmentsWithoutCode} appointments without confirmationCodes`);
    console.log('      These will need confirmationCodes generated before migration');
  } else {
    console.log('   ✅ All appointments have confirmationCodes');
  }

  // Summary
  console.log('\n=== Summary ===');
  if (duplicateCodes.length === 0 && duplicateSlugs.length === 0) {
    console.log('✅ Migration is safe! No duplicates found.');
    console.log('   You can proceed with: npm run db:push');
  } else {
    console.log('⚠️  Migration requires fixes before proceeding:');
    if (duplicateCodes.length > 0) {
      console.log(`   - Fix ${duplicateCodes.length} duplicate confirmationCodes`);
    }
    if (duplicateSlugs.length > 0) {
      console.log(`   - Fix ${duplicateSlugs.length} duplicate slugs`);
    }
  }

  await prisma.$disconnect();
}

checkMigrationSafety().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
