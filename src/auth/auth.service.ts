import { betterAuth } from 'better-auth';
import { PrismaClient } from '@prisma/client';
import { UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseUrl: process.env.BETTER_AUTH_URL!,
  emailAndPassword: {
    enabled: true,
  },
});

interface RegisterUserDTO {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  tenantId?: string;
  role?: UserRole;
}

export class AuthService {
  async register(userData: RegisterUserDTO) {
    // Create user in Better Auth
    // Assuming the correct method is `registerUser` based on the library's documentation
    const authUser = await auth.api.signUpEmail({
      body: {
        name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        email: userData.email,
        password: userData.password,
      },
    });

    // Create user in our database
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: await bcrypt.hash(userData.password, 10), // Hash the password before storing
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || 'USER',
        tenantId: userData.tenantId,
      },
    });

    // Generate JWT token
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
      process.env.JWT_SECRET!, // Use a secure secret key
      { expiresIn: '1h' } // Token expiration time
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
      },
      process.env.JWT_REFRESH_SECRET!, // Use a separate secret for refresh tokens
      { expiresIn: '7d' } // Refresh token expiration time
    );

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      },
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }
}

export const authService = new AuthService();