import { Injectable, ConflictException, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { Student } from './entities/student.entity';
import { UserStudent } from './entities/user-student.entity';
import { EmailService } from './email.service';

const tempUserCredentials = new Map<string, string>();
const tempOtpStorage = new Map<string, { code: string; expiresAt: Date }>();

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    
    @InjectRepository(UserStudent)
    private userStudentRepository: Repository<UserStudent>,
    
    private emailService: EmailService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['userStudents', 'userStudents.student']
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.user_status !== 'Active') {
      throw new UnauthorizedException('Account is not active. Please complete your registration.');
    }

    const storedPassword = tempUserCredentials.get(email);
    if (!storedPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, storedPassword);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      success: true,
      message: 'Login successful',
      user: user,
    };
  }

  async initiateSignup(signupData: {
    email: string;
    password: string;
  }) {
    const existingUser = await this.userRepository.findOne({
      where: { email: signupData.email }
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(signupData.password, 12);
    const userId = 'USR' + Date.now();

    tempUserCredentials.set(signupData.email, hashedPassword);

    const user = this.userRepository.create({
      user_id: userId,
      fname: 'Pending',
      lname: 'Pending',
      email: signupData.email,
      contact_number: 'Pending',
      user_status: 'Inactive',
      roles: 'parent',
      profile_pic: 'profile_pic_default.png',
      gen_roles: 'User'
    });

    await this.userRepository.save(user);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    tempOtpStorage.set(signupData.email, {
      code: otp,
      expiresAt: expiresAt
    });

    const emailSent = await this.emailService.sendOtpEmail(signupData.email, otp);

    return {
      success: true,
      message: emailSent ? 'OTP sent to your email' : 'Signup initiated but email failed',
      user_id: userId,
      email: signupData.email,
      test_otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    };
  }

  async verifyOtp(email: string, code: string) {
    const otpData = tempOtpStorage.get(email);

    if (!otpData) {
      throw new BadRequestException('Invalid OTP or OTP expired');
    }

    if (new Date() > otpData.expiresAt) {
      tempOtpStorage.delete(email);
      throw new BadRequestException('OTP expired');
    }

    if (otpData.code !== code) {
      throw new BadRequestException('Invalid OTP');
    }

    tempOtpStorage.delete(email);

    return {
      success: true,
      message: 'OTP verified successfully',
    };
  }

  async resendOtp(email: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store new OTP in memory
    tempOtpStorage.set(email, {
      code: otp,
      expiresAt: expiresAt
    });

    const emailSent = await this.emailService.sendOtpEmail(email, otp);

    return {
      success: true,
      message: emailSent ? 'New OTP sent to your email' : 'Failed to send OTP',
      test_otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    };
  }

  async completeProfile(profileData: {
    email: string;
    firstName: string;
    lastName: string;
    contactNumber: string;
    role: string;
  }) {
    const user = await this.userRepository.findOne({
      where: { email: profileData.email }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.fname = profileData.firstName;
    user.lname = profileData.lastName;
    user.contact_number = profileData.contactNumber;
    user.roles = profileData.role;
    user.user_status = 'Active';

    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Profile completed',
      user_id: user.user_id,
    };
  }

  async checkStudent(studentId: string) {
    const student = await this.studentRepository.findOne({
      where: { student_id: studentId }
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return {
      exists: true,
      student: {
        student_id: student.student_id,
        fname: student.fname,
        lname: student.lname,
        gender: student.gender,
        sch_level: student.sch_level,
        full_name: `${student.fname} ${student.lname}`.trim(),
      },
    };
  }

  async verifyStudent(userId: string, studentId: string, role: string) {
    const student = await this.studentRepository.findOne({
      where: { student_id: studentId }
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const user = await this.userRepository.findOne({
      where: { user_id: userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingRelation = await this.userStudentRepository.findOne({
      where: {
        user_id: userId,
        student_id: studentId
      }
    });

    if (existingRelation) {
      throw new ConflictException('This student is already linked to your account');
    }

    const userStudent = this.userStudentRepository.create({
      user_id: userId,
      student_id: studentId
    });

    await this.userStudentRepository.save(userStudent);

    return {
      success: true,
      message: 'Student verification successful',
      student_name: `${student.fname} ${student.lname}`,
    };
  }

  async getUserStudents(userId: string) {
    const userStudents = await this.userStudentRepository.find({
      where: { user_id: userId },
      relations: ['student']
    });

    return userStudents.map(us => ({
      userstud_id: us.userstud_id,
      student: us.student
    }));
  }
}