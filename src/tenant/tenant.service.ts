import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateTenantDTO {
  name: string;
  isActive?: boolean;
}

interface UpdateTenantDTO {
  name?: string;
  isActive?: boolean;
}

export class TenantService {
  async createTenant(data: CreateTenantDTO) {
    return prisma.tenant.create({
      data,
    });
  }

  async getTenantById(id: string) {
    return prisma.tenant.findUnique({
      where: { id },
    });
  }

  async updateTenant(id: string, data: UpdateTenantDTO) {
    return prisma.tenant.update({
      where: { id },
      data,
    });
  }

  async deleteTenant(id: string) {
    return prisma.tenant.delete({
      where: { id },
    });
  }

  async listTenants() {
    return prisma.tenant.findMany();
  }

  async setCurrentTenant(tenantId: string) {
    // Set the current tenant in the application context
    await prisma.$executeRawUnsafe(`SET app.tenant_id = '${tenantId}'`);
  }
}

export const tenantService = new TenantService();