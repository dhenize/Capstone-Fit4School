import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { UserStudent } from './user-student.entity';

@Entity('tbl_stud')
export class Student {
  @PrimaryColumn()
  student_id: string;

  @Column()
  fname: string;

  @Column()
  lname: string;

  @Column({
    type: 'enum',
    enum: ['male', 'female'],
  })
  gender: string;

  @Column({
    type: 'enum',
    enum: ['kindergarten', 'elementary', 'junior highschool'],
  })
  sch_level: string;

  @OneToMany(() => UserStudent, userStudent => userStudent.student)
  userStudents: UserStudent[];
}