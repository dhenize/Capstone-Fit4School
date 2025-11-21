import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Student } from './student.entity';

@Entity('tbl_user_students')
export class UserStudent {
  @PrimaryGeneratedColumn()
  userstud_id: number;

  @Column()
  user_id: string;

  @Column()
  student_id: string;

  @ManyToOne(() => User, user => user.userStudents)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Student, student => student.userStudents)
  @JoinColumn({ name: 'student_id' })
  student: Student;
}