import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface RegisterUserDTO {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  tenantId?: string;
}

export class AuthService {
  async register(userData: RegisterUserDTO) {
    try {
      // Input validation
      if (!userData.email || !userData.password) {
        throw new Error('Email and password are required');
      }

      if (userData.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Check if user exists in local database
      const existingUser = await prisma.user.findUnique({
        where: { email_tenantId: { email: userData.email, tenantId: userData.tenantId || '' } },
      });

      if (existingUser) {
        throw new Error('User already exists');
      }
      try {
        // Hash password for local storage
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = await prisma.user.create({
          data: {
            id: randomBytes(16).toString('hex'),
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            role: 'USER',
            tenantId: userData.tenantId,
            password: hashedPassword,
            emailVerified: false,
          },
          include: {
            organizations: {
              include: {
                organization: true
              }
            }
          }
        });
        
        // Get user's organizations
        const userOrgs = user.organizations.map(uo => ({
          id: uo.organization.id,
          role: uo.role,
          name: uo.organization.name
        }));

        // Generate JWT token with organization info
        const accessToken = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
            organizations: userOrgs
          },
          process.env.JWT_SECRET!,
          { expiresIn: '15m' }
        );
        
        // Generate refresh token
        const refreshTokenValue = randomBytes(40).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await prisma.refreshToken.create({
          data: {
            token: refreshTokenValue,
            userId: user.id,
            expiresAt,
          },
        });
        return {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            tenantId: user.tenantId,
            organizations: userOrgs
          },
          accessToken,
          refreshToken: refreshTokenValue,
        };
      } catch (authError) {
        console.error('Better Auth signup error:', authError);
        throw new Error('Failed to create authentication account');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(email: string, password: string, tenantId?: string) {
    try {
      // Find user in database first with their organizations
      const user = await prisma.user.findUnique({
        where: { email_tenantId: { email, tenantId: tenantId || '' } },
        include: {
          organizations: {
            include: {
              organization: true
            }
          }
        }
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Verify password using bcrypt
      const passwordValid = await bcrypt.compare(password, user.password);
      if (!passwordValid) {
        throw new Error('Invalid password');
      }

      // Get user's organizations
      const userOrgs = user.organizations.map(uo => ({
        id: uo.organization.id,
        role: uo.role,
        name: uo.organization.name
      }));
      
      // Generate new tokens with organization info
      const accessToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          organizations: userOrgs
        },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      );
      
      const refreshTokenValue = randomBytes(40).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await prisma.refreshToken.create({
        data: {
          token: refreshTokenValue,
          userId: user.id,
          expiresAt,
        },
      });
      
      await prisma.session.create({
        data: {
          userId: user.id,
          token: accessToken,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });
      
      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId,
          organizations: userOrgs
        },
        accessToken,
        refreshToken: refreshTokenValue,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Authentication failed');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      // Find the refresh token in the database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { 
          user: {
            include: {
              organizations: {
                include: {
                  organization: true
                }
              }
            }
          } 
        },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new Error('Invalid or expired refresh token');
      }

      // Delete the used refresh token (one-time use)
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      // Get user's organizations
      const userOrgs = storedToken.user.organizations.map(uo => ({
        id: uo.organization.id,
        role: uo.role,
        name: uo.organization.name
      }));

      // Generate new tokens with organization info
      const accessToken = jwt.sign(
        {
          userId: storedToken.user.id,
          email: storedToken.user.email,
          role: storedToken.user.role,
          tenantId: storedToken.user.tenantId,
          organizations: userOrgs
        },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      );

      // Generate a new refresh token
      const newRefreshTokenValue = randomBytes(40).toString('hex');
      
      // Store new refresh token
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
      
      await prisma.refreshToken.create({
        data: {
          token: newRefreshTokenValue,
          userId: storedToken.user.id,
          expiresAt,
        },
      });

      return {
        accessToken,
        refreshToken: newRefreshTokenValue,
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  async logout(refreshToken: string) {
    try {
      // Delete refresh token from database
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();