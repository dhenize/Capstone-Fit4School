import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemList } from './entities/itemlist.entity';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(ItemList)
    private readonly itemListRepository: Repository<ItemList>,
  ) {}

  async findAll(): Promise<ItemList[]> {
    return this.itemListRepository.find();
  }

  async findByGradeLevel(grade_lvl: string): Promise<ItemList[]> {
    if (!grade_lvl || grade_lvl === 'all') {
      return this.findAll();
    }
    
    // Map frontend grade values to database values
    const gradeMap: { [key: string]: string } = {
      'preschool': 'Kindergarten',
      'elementary': 'Elementary', 
      'juniorhigh': 'Junior Highschool',
      'junior high': 'Junior Highschool',
      'Kindergarten': 'Kindergarten',
      'Elementary': 'Elementary',
      'Junior Highschool': 'Junior Highschool'
    };
    
    const dbGrade = gradeMap[grade_lvl] || grade_lvl;
    
    return this.itemListRepository.find({
      where: { grade_lvl: dbGrade }
    });
  }

  async findDistinctCategories(): Promise<any[]> {
    try {
      const items = await this.itemListRepository
        .createQueryBuilder('item')
        .select(['item.category', 'item.gender', 'item.grade_lvl'])
        .distinct(true)
        .where('item.unif_pic != :noImage', { noImage: 'no_image' })
        .getRawMany();
      
      return items;
    } catch (error) {
      console.error('Error in findDistinctCategories:', error);
      return [];
    }
  }

  async getDisplayItems(): Promise<any[]> {
    try {
      // Get one item per category-gender-grade combination for display
      const query = `
        SELECT DISTINCT 
          category, gender, grade_lvl, 
          MIN(item_id) as item_id,
          MIN(item_name) as item_name,
          MIN(unif_pic) as unif_pic,
          MIN(price) as price
        FROM tbl_itemlist 
        WHERE unif_pic != 'no_image'
        GROUP BY category, gender, grade_lvl
        ORDER BY gender, grade_lvl, category
      `;
      
      return this.itemListRepository.query(query);
    } catch (error) {
      console.error('Error in getDisplayItems:', error);
      return [];
    }
  }

  async findByCategoryGenderGrade(category: string, gender: string, grade_lvl: string): Promise<ItemList[]> {
    try {
      // Map grade to database format
      const gradeMap: { [key: string]: string } = {
        'preschool': 'Kindergarten',
        'elementary': 'Elementary',
        'juniorhigh': 'Junior Highschool',
        'junior high': 'Junior Highschool'
      };
      
      const dbGrade = gradeMap[grade_lvl] || grade_lvl;
      
      const query: any = {};
      
      if (category && category !== 'all') query.category = category;
      if (gender && gender !== 'all') query.gender = gender;
      if (dbGrade && dbGrade !== 'all') query.grade_lvl = dbGrade;
      
      return this.itemListRepository.find({
        where: query,
        order: { size: 'ASC' }
      });
    } catch (error) {
      console.error('Error in findByCategoryGenderGrade:', error);
      return [];
    }
  }

  async findById(item_id: string): Promise<ItemList | null> {
    try {
      return this.itemListRepository.findOne({
        where: { item_id }
      });
    } catch (error) {
      console.error('Error in findById:', error);
      return null;
    }
  }

  async findSizesByCategoryGenderGrade(category: string, gender: string, grade_lvl: string): Promise<string[]> {
    try {
      const items = await this.findByCategoryGenderGrade(category, gender, grade_lvl);
      const sizes = [...new Set(items.map(item => item.size))];
      return sizes.sort((a, b) => {
        const sizeOrder: { [key: string]: number } = { 'S': 1, 'M': 2, 'L': 3 };
        const aOrder = sizeOrder[a] || parseInt(a) + 10;
        const bOrder = sizeOrder[b] || parseInt(b) + 10;
        return aOrder - bOrder;
      });
    } catch (error) {
      console.error('Error in findSizesByCategoryGenderGrade:', error);
      return [];
    }
  }
}