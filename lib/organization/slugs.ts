import { prisma } from '@/lib/db';

/**
 * Generate URL-friendly slug from organization name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Ensure slug is unique by appending a number if needed
 */
export async function ensureUniqueSlug(
  slug: string,
  excludeOrganizationId?: string
): Promise<string> {
  let uniqueSlug = slug;
  let counter = 1;

  while (true) {
    const existing = await prisma.organization.findFirst({
      where: { slug: uniqueSlug },
    });

    if (!existing || existing.id === excludeOrganizationId) {
      return uniqueSlug;
    }

    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
}

/**
 * Find organization by slug for public booking page
 * Note: Using findFirst until slug is made unique in schema
 */
export async function findOrganizationBySlug(slug: string) {
  return prisma.organization.findFirst({
    where: { slug },
    include: {
      locations: {
        where: { isActive: true },
      },
      users: {
        where: { role: 'clinician' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      bookingPageSettings: true,
      appointmentTypes: {
        where: { isActive: true },
      },
      clinicSchedule: true,
    },
  });
}
