import { api } from 'encore.dev/api';
import { tenantService } from './tenant.service';

interface CreateTenantRequest {
  name: string;
  isActive?: boolean;
}

interface UpdateTenantRequest {
  name?: string;
  isActive?: boolean;
}

// POST /tenant
export const createTenant = api(
  { expose: true, method: 'POST', path: '/tenant' },
  async (req: CreateTenantRequest) => {
    const tenant = await tenantService.createTenant(req);
    return { statusCode: 201, body: tenant };
  }
);

// GET /tenant/:id
export const getTenant = api(
  { expose: true, method: 'GET', path: '/tenant/:id' },
  async (req: { id: string }) => {
    const tenant = await tenantService.getTenantById(req.id);
    if (!tenant) {
      return { statusCode: 404, body: { error: 'Tenant not found' } };
    }
    return { statusCode: 200, body: tenant };
  }
);

// PUT /tenant/:id
export const updateTenant = api(
  { expose: true, method: 'PUT', path: '/tenant/:id' },
  async (req: { id: string } & UpdateTenantRequest) => {
    const tenant = await tenantService.updateTenant(req.id, req);
    return { statusCode: 200, body: tenant };
  }
);

// DELETE /tenant/:id
export const deleteTenant = api(
  { expose: true, method: 'DELETE', path: '/tenant/:id' },
  async (req: { id: string }) => {
    await tenantService.deleteTenant(req.id);
    return { statusCode: 204 };
  }
);

// GET /tenants
export const listTenants = api(
  { expose: true, method: 'GET', path: '/tenants' },
  async () => {
    const tenants = await tenantService.listTenants();
    return { tenants };
  }
);

// POST /tenant/current
export const setCurrentTenant = api(
  { expose: true, method: 'POST', path: '/tenant/current' },
  async (req: { id: string }) => {
    await tenantService.setCurrentTenant(req.id);
    return { statusCode: 200, body: { message: 'Current tenant set successfully' } };
  }
);