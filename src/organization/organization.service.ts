import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateOrganizationDTO {
  name: string;
  description?: string;
  tenantId: string;
}

interface UpdateOrganizationDTO {
  name?: string;
  description?: string;
}

export class OrganizationService {
  async createOrganization(data: CreateOrganizationDTO) {
    return prisma.organization.create({
      data,
    });
  }

  async getOrganizationById(id: string) {
    return prisma.organization.findUnique({
      where: { id },
    });
  }

  async updateOrganization(id: string, data: UpdateOrganizationDTO) {
    return prisma.organization.update({
      where: { id },
      data,
    });
  }

  async deleteOrganization(id: string) {
    return prisma.organization.delete({
      where: { id },
    });
  }

  async listOrganizations(tenantId: string) {
    return prisma.organization.findMany({
      where: { tenantId },
    });
  }
}

export const organizationService = new OrganizationService();