import { api } from 'encore.dev/api';
import { authService } from './auth.service';

interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  tenantId?: string;
}

// POST /auth/register
export const register = api(
  { expose: true, method: "POST", path: "/auth/register" },
  async (req: RegisterRequest) => {
    try {
      const result = await authService.register({
        email: req.email,
        password: req.password,
        firstName: req.firstName,
        lastName: req.lastName,
        tenantId: req.tenantId
      });

      return {
        statusCode: 201,
        body: {
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            role: result.user.role
          },
          token: result.accessToken,
          refreshToken: result.refreshToken
        }
      };
    } catch (error) {
      return {
        statusCode: 400,
        body: {
          error: error instanceof Error ? error.message : 'Registration failed'
        }
      };
    }
});

// POST /auth/login
export const login = api(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req: { email: string; password: string; tenantId?: string }) => {
    try {
      const result = await authService.login(req.email, req.password, req.tenantId);

      return {
        statusCode: 200,
        body: {
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            role: result.user.role,
          },
          token: result.accessToken,
          refreshToken: result.refreshToken,
        },
      };
    } catch (error) {
      return {
        statusCode: 401,
        body: {
          error: error instanceof Error ? error.message : "Login failed",
        },
      };
    }
  }
);




