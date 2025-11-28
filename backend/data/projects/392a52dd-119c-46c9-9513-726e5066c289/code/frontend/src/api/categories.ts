import api from './api';
import { CustomCategory, CustomCategoryCreate } from '../types/categories';
import { UUID } from '../types/common';

export const fetchCategories = async (familyId: UUID): Promise<CustomCategory[]> => {
  try {
    const response = await api.get(`/v1/custom-categories?family_id=${familyId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const createCategory = async (categoryData: CustomCategoryCreate): Promise<CustomCategory> => {
  try {
    const response = await api.post('/v1/custom-categories', categoryData);
    return response.data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const updateCategory = async (categoryId: UUID, categoryData: CustomCategoryCreate): Promise<CustomCategory> => {
  try {
    const response = await api.put(`/v1/custom-categories/${categoryId}`, categoryData);
    return response.data;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (categoryId: UUID): Promise<void> => {
  try {
    await api.delete(`/v1/custom-categories/${categoryId}`);
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};
