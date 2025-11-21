import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('tbl_itemlist')
export class ItemList {
  @PrimaryColumn()
  item_id: string;

  @Column()
  item_name: string;

  @Column({ 
    type: 'enum', 
    enum: ['Polo','Pants','Shorts','Blouse','Skirt','Vest','Full','PE Full','PE Shirt','PE Jogger'] 
  })
  category: string;

  @Column({ 
    type: 'enum', 
    enum: ['Boys','Girls','Unisex'] 
  })
  gender: string;

  @Column({ 
    type: 'enum', 
    enum: ['Kindergarten','Elementary','Junior Highschool'] 
  })
  grade_lvl: string;

  @Column()
  unif_pic: string;

  @Column()
  size: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  chest: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  length: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  hips: number;
}