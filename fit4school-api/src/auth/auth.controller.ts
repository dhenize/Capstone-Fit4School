import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupData: any) {
    return this.authService.initiateSignup(signupData);
  }

  @Post('login')
  async login(@Body() loginData: { email: string; password: string }) {
    return this.authService.login(loginData.email, loginData.password);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { email: string; code: string }) {
    return this.authService.verifyOtp(body.email, body.code);
  }

  @Post('resend-otp')
  async resendOtp(@Body() body: { email: string }) {
    return this.authService.resendOtp(body.email);
  }

  @Post('complete-profile')
  async completeProfile(@Body() body: any) {
    return this.authService.completeProfile(body);
  }

  @Get('student/:studentId')
  async checkStudent(@Param('studentId') studentId: string) {
    return this.authService.checkStudent(studentId);
  }

  @Post('verify-student')
  async verifyStudent(@Body() body: { userId: string; studentId: string; role: string }) {
    return this.authService.verifyStudent(body.userId, body.studentId, body.role);
  }

  @Get('user/:userId/students')
  async getUserStudents(@Param('userId') userId: string) {
    return this.authService.getUserStudents(userId);
  }

  @Get('test')
  test() {
    return { 
      message: 'Auth endpoints are working!',
      timestamp: new Date().toISOString()
    };
  }
}