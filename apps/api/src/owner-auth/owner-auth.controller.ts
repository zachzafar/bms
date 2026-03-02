import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { OwnerAuthService } from './owner-auth.service';

@Controller('owner-auth')
export class OwnerAuthController {
  constructor(private readonly ownerAuthService: OwnerAuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('magic-link')
  async requestMagicLink(@Body() body: { email: string; tenantId: string }) {
    await this.ownerAuthService.requestMagicLink(body.email, body.tenantId);
    return { message: 'If an owner account exists for that email, a login link has been sent.' };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('verify')
  async verifyMagicLink(@Body() body: { token: string }) {
    return this.ownerAuthService.verifyMagicLink(body.token);
  }
}
