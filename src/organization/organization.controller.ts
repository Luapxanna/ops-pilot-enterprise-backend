import { api } from 'encore.dev/api';
import { organizationService } from './organization.service';

interface CreateOrganizationRequest {
  name: string;
  description?: string;
  tenantId: string;
}

interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
}

// POST /organization
export const createOrganization = api(
  { expose: true, method: 'POST', path: '/organization' },
  async (req: CreateOrganizationRequest) => {
    const organization = await organizationService.createOrganization(req);
    return { organization };
  }
);

// GET /organization/:id
export const getOrganization = api(
  { expose: true, method: 'GET', path: '/organization/:id' },
  async (req: { id: string }) => {
    const organization = await organizationService.getOrganizationById(req.id);
    if (!organization) {
      return { statusCode: 404, body: { error: 'Organization not found' } };
    }
    return { statusCode: 200, body: organization };
  }
);

// PUT /organization/:id
export const updateOrganization = api(
  { expose: true, method: 'PUT', path: '/organization/:id' },
  async (req: { id: string } & UpdateOrganizationRequest) => {
    const organization = await organizationService.updateOrganization(req.id, req);
    return { statusCode: 200, body: organization };
  }
);

// DELETE /organization/:id
export const deleteOrganization = api(
  { expose: true, method: 'DELETE', path: '/organization/:id' },
  async (req: { id: string }) => {
    await organizationService.deleteOrganization(req.id);
    return { statusCode: 204 };
  }
);

// GET /organizations
export const listOrganizations = api(
  { expose: true, method: 'GET', path: '/organizations' },
  async (req: { tenantId: string }) => {
    const organizations = await organizationService.listOrganizations(req.tenantId);
    return { organizations };
  }
);