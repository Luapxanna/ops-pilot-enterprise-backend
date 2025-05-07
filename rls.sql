Alter table "Organization" enable row level security;
Alter table "UserOrganization" enable row level security;
Alter table "User" enable row level security;
Alter table "Session" enable row level security;

CREATE POLICY tenant_isolation ON "Organization"
USING ("tenantId" = current_setting('app.tenant_id')::TEXT);

CREATE POLICY organization_membership ON "UserOrganization"
USING ("userId" = current_setting('app.user_id')::TEXT);

CREATE POLICY user_access ON "User"
USING ("id" = current_setting('app.user_id')::TEXT OR "tenantId" = current_setting('app.tenant_id')::TEXT);

CREATE POLICY session_isolation ON "Session"
USING ("userId" = current_setting('app.user_id')::TEXT);

CREATE POLICY unique_tenant_constraint ON "User"
USING ("tenantId" = current_setting('app.tenant_id')::TEXT);