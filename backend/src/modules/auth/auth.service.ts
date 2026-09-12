import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OtpPurpose } from '@prisma/client';
import {
  generateOtp,
  hashPassword,
  hashToken,
  randomToken,
  verifyPassword,
} from '../../common/utils/crypto.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterCustomerDto,
  RequestOtpDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async registerCustomer(dto: RegisterCustomerDto) {
    const email = dto.email.toLowerCase();
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email }, ...(dto.phone ? [{ phone: dto.phone }] : [])] },
    });
    if (exists)
      throw new ConflictException('Email or phone already registered');

    const user = await this.prisma.user.create({
      data: {
        email,
        phone: dto.phone,
        passwordHash: await hashPassword(dto.password),
        firstName: dto.firstName,
        lastName: dto.lastName,
        displayName: `${dto.firstName} ${dto.lastName}`.trim(),
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        customerProfile: {
          create: { referralCode: randomToken(6).toUpperCase().slice(0, 8) },
        },
      },
    });

    await this.audit.log({
      actorId: user.id,
      action: 'auth.register',
      resource: 'User',
      resourceId: user.id,
    });
    return this.issueTokens(user.id, { deviceName: 'registration' });
  }

  async login(dto: LoginDto, meta: { ip?: string; userAgent?: string }) {
    if (!dto.email && !dto.phone)
      throw new BadRequestException('Email or phone is required');
    const identifier = (dto.email ?? dto.phone)!.toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: dto.email
        ? { email: dto.email.toLowerCase(), deletedAt: null }
        : { phone: dto.phone!, deletedAt: null },
    });

    const fail = async (reason: string): Promise<never> => {
      await this.prisma.loginAttempt.create({
        data: {
          userId: user?.id,
          identifier,
          success: false,
          ipAddress: meta.ip,
          userAgent: meta.userAgent,
          reason,
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    };

    if (!user?.passwordHash) return fail('not_found');
    if (user.status === 'SUSPENDED') return fail('suspended');

    const since = new Date(Date.now() - 15 * 60 * 1000);
    const failures = await this.prisma.loginAttempt.count({
      where: { identifier, success: false, createdAt: { gte: since } },
    });
    if (failures >= 10) {
      throw new UnauthorizedException(
        'Too many failed attempts. Try again later.',
      );
    }
    if (!(await verifyPassword(user.passwordHash, dto.password)))
      return fail('bad_password');

    await this.prisma.loginAttempt.create({
      data: {
        userId: user.id,
        identifier,
        success: true,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    });
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'auth.login',
      resource: 'User',
      resourceId: user.id,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    });
    return this.issueTokens(user.id, {
      deviceName: dto.deviceName,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
  }

  async refresh(
    refreshToken: string,
    meta: { ip?: string; userAgent?: string },
  ) {
    const tokenHash = hashToken(refreshToken);
    const session = await this.prisma.refreshSession.findUnique({
      where: { tokenHash },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(session.userId, {
      deviceName: session.deviceName ?? undefined,
      ip: meta.ip ?? session.ipAddress ?? undefined,
      userAgent: meta.userAgent ?? session.userAgent ?? undefined,
    });
  }

  async logout(refreshToken: string, userId?: string) {
    await this.prisma.refreshSession.updateMany({
      where: {
        tokenHash: hashToken(refreshToken),
        ...(userId ? { userId } : {}),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  listSessions(userId: string) {
    return this.prisma.refreshSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        deviceName: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.prisma.refreshSession.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async requestOtp(dto: RequestOtpDto) {
    const code = generateOtp(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.prisma.otpChallenge.create({
      data: {
        destination: dto.destination.toLowerCase(),
        purpose: dto.purpose,
        codeHash: hashToken(code),
        expiresAt,
      },
    });
    const payload: Record<string, unknown> = {
      success: true,
      message: 'OTP sent',
      expiresAt,
    };
    if ((process.env.NODE_ENV ?? 'development') !== 'production') {
      payload.debugCode = code;
    }
    return payload;
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const challenge = await this.prisma.otpChallenge.findFirst({
      where: {
        destination: dto.destination.toLowerCase(),
        purpose: dto.purpose,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!challenge) throw new BadRequestException('OTP expired or not found');
    if (challenge.attempts >= challenge.maxAttempts) {
      throw new BadRequestException('OTP attempts exceeded');
    }
    const matches = challenge.codeHash === hashToken(dto.code);
    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: {
        attempts: { increment: 1 },
        consumedAt: matches ? new Date() : undefined,
      },
    });
    if (!matches) throw new BadRequestException('Invalid OTP');
    return { success: true, verified: true };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (user?.email) {
      await this.requestOtp({
        destination: user.email,
        purpose: OtpPurpose.RESET_PASSWORD,
      });
    }
    return { success: true, message: 'If the account exists, an OTP was sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    await this.verifyOtp({
      destination: dto.email,
      code: dto.code,
      purpose: OtpPurpose.RESET_PASSWORD,
    });
    const user = await this.prisma.user.update({
      where: { email: dto.email.toLowerCase() },
      data: { passwordHash: await hashPassword(dto.newPassword) },
    });
    await this.prisma.refreshSession.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'auth.password_reset',
      resource: 'User',
      resourceId: user.id,
    });
    return { success: true };
  }

  me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        displayName: true,
        locale: true,
        status: true,
        twoFactorEnabled: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        customerProfile: true,
        memberships: {
          where: { isActive: true },
          include: { role: true, hotelGroup: true, property: true },
        },
      },
    });
  }

  private async issueTokens(
    userId: string,
    meta: { deviceName?: string; ip?: string; userAgent?: string },
  ) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, typ: 'access' },
      {
        secret: this.config.getOrThrow<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>('jwt.accessTtl') as any,
      },
    );
    const refreshToken = randomToken();
    await this.prisma.refreshSession.create({
      data: {
        userId,
        tokenHash: hashToken(refreshToken),
        deviceName: meta.deviceName,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
        expiresAt: this.refreshExpiry(),
      },
    });
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.config.get<string>('jwt.accessTtl'),
    };
  }

  private refreshExpiry() {
    const ttl = this.config.get<string>('jwt.refreshTtl') ?? '30d';
    const days = ttl.endsWith('d') ? parseInt(ttl, 10) : 30;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
}
