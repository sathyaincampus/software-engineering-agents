import { UUID } from './common';

export interface CustomCategoryBase {
  name: string;
  color: string;
}

export interface CustomCategoryCreate extends CustomCategoryBase {
  family_id: UUID;
}

export interface CustomCategory extends CustomCategoryBase {
  category_id: UUID;
  family_id: UUID;
  created_at: string;
  updated_at: string;
}
