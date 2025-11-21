import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { UserStudent } from './user-student.entity';

@Entity('tbl_user')
export class User {
  @PrimaryColumn()
  user_id: string;

  @Column()
  fname: string;

  @Column()
  lname: string;

  @Column({
    type: 'enum',
    enum: ['parent', 'legal guardian', 'student'],
  })
  roles: string;

  @Column({ default: 'User' })
  gen_roles: string;

  @Column()
  email: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column()
  contact_number: string;

  @Column({ default: 'profile_pic_default.png' }) //I need to change this
  profile_pic: string;

  @Column({ default: 'Active' })
  user_status: string;

  @Column()
  password: string;

  @OneToMany(() => UserStudent, userStudent => userStudent.user)
  userStudents: UserStudent[];
}