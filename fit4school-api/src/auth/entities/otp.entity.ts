import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tbl_otp')
export class OTP {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  code: string;

  @Column()
  expires_at: Date;

  @Column({ default: false })
  used: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP(6)' })
  created_at: Date;
}