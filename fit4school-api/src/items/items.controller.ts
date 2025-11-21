import { Controller, Get, Query, Param } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemList } from './entities/itemlist.entity';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  async getItems(@Query('grade') grade?: string): Promise<ItemList[]> {
    return this.itemsService.findByGradeLevel(grade || '');
  }

  @Get('display')
  async getDisplayItems() {
    return this.itemsService.getDisplayItems();
  }

  @Get('categories')
  async getCategories() {
    return this.itemsService.findDistinctCategories();
  }

  @Get('filter')
  async getFilteredItems(
    @Query('category') category?: string,
    @Query('gender') gender?: string,
    @Query('grade') grade?: string,
  ): Promise<ItemList[]> {
    return this.itemsService.findByCategoryGenderGrade(
      category || '',
      gender || '',
      grade || ''
    );
  }

  @Get('sizes')
  async getSizes(
    @Query('category') category?: string,
    @Query('gender') gender?: string,
    @Query('grade') grade?: string,
  ): Promise<string[]> {
    return this.itemsService.findSizesByCategoryGenderGrade(
      category || '',
      gender || '',
      grade || ''
    );
  }

  @Get(':id')
  async getItemById(@Param('id') id: string): Promise<ItemList | null> {
    return this.itemsService.findById(id);
  }
}