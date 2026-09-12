import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/permissions.decorator';
import { ok } from '../../common/dto/api-response.dto';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterCustomerDto,
  RequestOtpDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterCustomerDto) {
    return this.auth.registerCustomer(dto).then((data) => ok(data));
  }

  @Public()
  @Post('login')
  login(
    @Body() dto: LoginDto,
    @Req() req: { ip?: string; headers: Record<string, string> },
  ) {
    return this.auth
      .login(dto, { ip: req.ip, userAgent: req.headers['user-agent'] })
      .then((data) => ok(data));
  }

  @Public()
  @Post('refresh')
  refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: { ip?: string; headers: Record<string, string> },
  ) {
    return this.auth
      .refresh(dto.refreshToken, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      })
      .then((data) => ok(data));
  }

  @Public()
  @Post('logout')
  logout(@Body() dto: RefreshTokenDto, @CurrentUser() user?: AuthUser) {
    return this.auth
      .logout(dto.refreshToken, user?.id)
      .then((data) => ok(data));
  }

  @Public()
  @Post('otp/request')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.auth.requestOtp(dto).then((data) => ok(data));
  }

  @Public()
  @Post('otp/verify')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto).then((data) => ok(data));
  }

  @Public()
  @Post('password/forgot')
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto).then((data) => ok(data));
  }

  @Public()
  @Post('password/reset')
  reset(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto).then((data) => ok(data));
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id).then((data) => ok(data));
  }

  @ApiBearerAuth()
  @Get('sessions')
  sessions(@CurrentUser() user: AuthUser) {
    return this.auth.listSessions(user.id).then((data) => ok(data));
  }

  @ApiBearerAuth()
  @Delete('sessions/:id')
  revoke(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.auth.revokeSession(user.id, id).then((data) => ok(data));
  }
}
