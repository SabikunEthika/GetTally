import { Body, Controller, Get, Headers, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: { name: string; email: string; phone: string; password: string; businessName?: string }) {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  logout(@Headers('authorization') authorization?: string) {
    return this.authService.revokeToken((authorization || '').replace(/^Bearer\s+/i, ''));
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() request: { user: { sellerId: number } }) {
    return this.authService.profile(request.user.sellerId);
  }

  @UseGuards(AuthGuard)
  @Patch('profile')
  updateProfile(@Req() request: { user: { sellerId: number } }, @Body() body: { name?: string; phone?: string; businessName?: string; city?: string; bio?: string; monthlyGoal?: number; profileComplete?: boolean }) {
    return this.authService.updateProfile(request.user.sellerId, body);
  }
}
