import { prisma } from '@/lib/db';
import type { AuditLogCreateInput } from '@/lib/types';

/**
 * Create an audit log entry for HIPAA compliance and tracking
 */
export async function createAuditLog(input: AuditLogCreateInput) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        organizationId: input.organizationId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        userId: input.userId,
        userEmail: input.userEmail,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        details: input.details || {},
        changes: input.changes || {},
      },
    });
    return auditLog;
  } catch (error) {
    // Don't throw error for audit log failures - log to console instead
    console.error('Failed to create audit log:', error);
    return null;
  }
}

/**
 * Get audit logs for an organization with pagination
 */
export async function getAuditLogs(
  organizationId: string,
  options: {
    page?: number;
    pageSize?: number;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}
) {
  const page = options.page || 1;
  const pageSize = options.pageSize || 50;
  const skip = (page - 1) * pageSize;

  const where: any = {
    organizationId,
  };

  if (options.action) {
    where.action = options.action;
  }

  if (options.resourceType) {
    where.resourceType = options.resourceType;
  }

  if (options.startDate || options.endDate) {
    where.createdAt = {};
    if (options.startDate) {
      where.createdAt.gte = options.startDate;
    }
    if (options.endDate) {
      where.createdAt.lte = options.endDate;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data: logs,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
