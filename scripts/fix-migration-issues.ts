import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate unique confirmation code
 */
function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate URL-friendly slug from name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function fixMigrationIssues() {
  console.log('Fixing migration issues...\n');

  // 1. Fix duplicate confirmationCodes
  console.log('1. Fixing duplicate confirmationCodes...');
  const appointments = await prisma.appointment.findMany({
    where: {
      confirmationCode: { not: null },
    },
    select: {
      id: true,
      confirmationCode: true,
    },
  });

  const confirmationCodeMap = new Map<string, string[]>();
  appointments.forEach((apt) => {
    if (apt.confirmationCode) {
      if (!confirmationCodeMap.has(apt.confirmationCode)) {
        confirmationCodeMap.set(apt.confirmationCode, []);
      }
      confirmationCodeMap.get(apt.confirmationCode)!.push(apt.id);
    }
  });

  let fixedCodes = 0;
  for (const [code, ids] of confirmationCodeMap.entries()) {
    if (ids.length > 1) {
      // Keep first one, regenerate others
      for (let i = 1; i < ids.length; i++) {
        let newCode = generateConfirmationCode();
        let exists = true;
        let attempts = 0;
        
        // Ensure uniqueness
        while (exists && attempts < 10) {
          const existing = await prisma.appointment.findUnique({
            where: { confirmationCode: newCode },
          });
          if (!existing) {
            exists = false;
          } else {
            newCode = generateConfirmationCode();
            attempts++;
          }
        }

        await prisma.appointment.update({
          where: { id: ids[i] },
          data: { confirmationCode: newCode },
        });
        fixedCodes++;
        console.log(`   Fixed appointment ${ids[i]}: ${code} → ${newCode}`);
      }
    }
  }

  if (fixedCodes > 0) {
    console.log(`   ✅ Fixed ${fixedCodes} duplicate confirmationCodes\n`);
  } else {
    console.log('   ✅ No duplicate confirmationCodes to fix\n');
  }

  // 2. Generate confirmationCodes for appointments without them
  console.log('2. Generating confirmationCodes for appointments without them...');
  const appointmentsWithoutCode = await prisma.appointment.findMany({
    where: {
      confirmationCode: null,
    },
    select: {
      id: true,
    },
  });

  let generatedCodes = 0;
  for (const apt of appointmentsWithoutCode) {
    let newCode = generateConfirmationCode();
    let exists = true;
    let attempts = 0;

    while (exists && attempts < 10) {
      const existing = await prisma.appointment.findUnique({
        where: { confirmationCode: newCode },
      });
      if (!existing) {
        exists = false;
      } else {
        newCode = generateConfirmationCode();
        attempts++;
      }
    }

    await prisma.appointment.update({
      where: { id: apt.id },
      data: { confirmationCode: newCode },
    });
    generatedCodes++;
  }

  if (generatedCodes > 0) {
    console.log(`   ✅ Generated ${generatedCodes} confirmationCodes\n`);
  } else {
    console.log('   ✅ All appointments already have confirmationCodes\n');
  }

  // 3. Fix duplicate slugs
  console.log('3. Fixing duplicate slugs...');
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

  const slugMap = new Map<string, string[]>();
  organizations.forEach((org) => {
    if (org.slug) {
      if (!slugMap.has(org.slug)) {
        slugMap.set(org.slug, []);
      }
      slugMap.get(org.slug)!.push(org.id);
    }
  });

  let fixedSlugs = 0;
  for (const [slug, ids] of slugMap.entries()) {
    if (ids.length > 1) {
      // Keep first one, regenerate others
      for (let i = 1; i < ids.length; i++) {
        const org = await prisma.organization.findUnique({
          where: { id: ids[i] },
          select: { name: true },
        });

        if (org) {
          let baseSlug = generateSlug(org.name);
          let newSlug = baseSlug;
          let exists = true;
          let counter = 1;

        while (exists) {
          const existing = await prisma.organization.findFirst({
            where: { slug: newSlug },
          });
          if (!existing || existing.id === ids[i]) {
            exists = false;
          } else {
            newSlug = `${baseSlug}-${counter}`;
            counter++;
          }
        }

          await prisma.organization.update({
            where: { id: ids[i] },
            data: { slug: newSlug },
          });
          fixedSlugs++;
          console.log(`   Fixed organization ${ids[i]}: ${slug} → ${newSlug}`);
        }
      }
    }
  }

  if (fixedSlugs > 0) {
    console.log(`   ✅ Fixed ${fixedSlugs} duplicate slugs\n`);
  } else {
    console.log('   ✅ No duplicate slugs to fix\n');
  }

  // 4. Generate slugs for organizations without them
  console.log('4. Generating slugs for organizations without them...');
  const orgsWithoutSlug = await prisma.organization.findMany({
    where: {
      slug: null,
    },
    select: {
      id: true,
      name: true,
    },
  });

  let generatedSlugs = 0;
  for (const org of orgsWithoutSlug) {
    let baseSlug = generateSlug(org.name);
    let newSlug = baseSlug;
    let exists = true;
    let counter = 1;

    while (exists) {
      const existing = await prisma.organization.findFirst({
        where: { slug: newSlug },
      });
      if (!existing) {
        exists = false;
      } else {
        newSlug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    await prisma.organization.update({
      where: { id: org.id },
      data: { slug: newSlug },
    });
    generatedSlugs++;
    console.log(`   Generated slug for "${org.name}": ${newSlug}`);
  }

  if (generatedSlugs > 0) {
    console.log(`   ✅ Generated ${generatedSlugs} slugs\n`);
  } else {
    console.log('   ✅ All organizations already have slugs\n');
  }

  console.log('=== Summary ===');
  console.log('✅ All migration issues have been fixed!');
  console.log('   You can now safely run: npm run db:push');

  await prisma.$disconnect();
}

fixMigrationIssues().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
