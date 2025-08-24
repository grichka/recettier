/**
 * Ingredients Service
 * 
 * Manages ingredients registry with local IndexedDB storage and Google Drive synchronization.
 * Provides CRUD operations, search functionality, and staged changes before sync.
 */

import type { 
  Ingredient, 
  IngredientCategory, 
  IngredientsRegistry, 
  IngredientSearchResult 
} from '../types/recipe';
import { googleDriveService, GoogleDriveService } from './googleDrive';
import { localStorage as localDB } from './localStorage';

export interface IngredientCreateData {
  id?: string; // Optional custom ID
  name: string;
  categoryId: string;
  defaultUnit: string;
  alternativeNames?: string[];
  description?: string;
  storageInfo?: Ingredient['storageInfo'];
  nutritionInfo?: Ingredient['nutritionInfo'];
  purchaseInfo?: Ingredient['purchaseInfo'];
  tags?: string[];
}

export interface IngredientUpdateData extends Partial<IngredientCreateData> {
  id: string;
}

export interface CategoryCreateData {
  id?: string; // Optional custom ID
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export class IngredientsService {
  private static instance: IngredientsService;
  private isLoading = false;

  static getInstance(): IngredientsService {
    if (!IngredientsService.instance) {
      IngredientsService.instance = new IngredientsService();
    }
    return IngredientsService.instance;
  }

  /**
   * Initialize the service and load registry
   */
  async initialize(): Promise<void> {
    if (this.isLoading) {
      // Wait for current loading to complete
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    this.isLoading = true;
    
    try {
      // Initialize local database
      await localDB.initialize();
      
      // Initialize Google Drive service
      await googleDriveService.initialize();
      
      // Check if we have local data
      const localData = await localDB.getLocalData();
      if (!localData.lastSyncTime) {
        // No previous sync, try to load from Google Drive
        await this.syncFromGoogleDrive();
      }
    } catch (error) {
      console.error('Failed to initialize ingredients service:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Sync data from Google Drive to local storage
   */
  async syncFromGoogleDrive(): Promise<void> {
    try {
      const ingredientsFolderId = googleDriveService.getIngredientsFolderId();
      
      // Try to find ingredients registry file
      const registryFile = await googleDriveService.findFileByName(
        GoogleDriveService.INGREDIENTS_REGISTRY_FILE,
        ingredientsFolderId
      );

      if (registryFile) {
        // File exists, load it
        const content = await googleDriveService.readFileContent(registryFile.id);
        const registry: IngredientsRegistry = JSON.parse(content);
        // Load the registry into local storage
        await localDB.loadFromRegistry(registry);
        console.log('Loaded ingredients registry from Google Drive');
      } else {
        // Create default registry and save to both local and remote
        const defaultRegistry = this.createDefaultRegistry();
        await localDB.loadFromRegistry(defaultRegistry);
        await this.saveRegistryToGoogleDrive(defaultRegistry);
        console.log('Created new ingredients registry');
      }
    } catch (error) {
      console.error('Failed to sync from Google Drive:', error);
      // Create default registry locally
      const defaultRegistry = this.createDefaultRegistry();
      await localDB.loadFromRegistry(defaultRegistry);
    }
  }

  /**
   * Save pending changes to Google Drive
   */
  async saveToGoogleDrive(): Promise<void> {
    try {
      const localData = await localDB.getLocalData();
      
      // Create registry from local data
      const registry: IngredientsRegistry = {
        ingredients: localData.ingredients,
        categories: localData.categories,
        version: '1.0.0',
        lastUpdated: new Date(),
        metadata: {
          totalIngredients: Object.keys(localData.ingredients).length,
          totalCategories: Object.keys(localData.categories).length
        }
      };

      await this.saveRegistryToGoogleDrive(registry);
      
      // Clear pending changes and update sync time
      await localDB.clearPendingChanges();
      await localDB.updateLastSyncTime(new Date());
      
      console.log('Successfully saved to Google Drive');
    } catch (error) {
      console.error('Failed to save to Google Drive:', error);
      throw error;
    }
  }

  /**
   * Save registry to Google Drive
   */
  private async saveRegistryToGoogleDrive(registry: IngredientsRegistry): Promise<void> {
    const content = JSON.stringify(registry, null, 2);
    const ingredientsFolderId = googleDriveService.getIngredientsFolderId();
    
    // Try to find existing file
    const existingFile = await googleDriveService.findFileByName(
      GoogleDriveService.INGREDIENTS_REGISTRY_FILE,
      ingredientsFolderId
    );

    if (existingFile) {
      // Update existing file
      await googleDriveService.updateFileContent(existingFile.id, content);
    } else {
      // Create new file
      await googleDriveService.createFile(
        GoogleDriveService.INGREDIENTS_REGISTRY_FILE,
        content,
        ingredientsFolderId
      );
    }
  }

  /**
   * Create default registry
   */
  private createDefaultRegistry(): IngredientsRegistry {
    const now = new Date();
    return {
      ingredients: {},
      categories: {},
      version: '1.0.0',
      lastUpdated: now,
      metadata: {
        totalIngredients: 0,
        totalCategories: 0
      }
    };
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<IngredientCategory[]> {
    return await localDB.getCategoriesArray();
  }

  /**
   * Get all ingredients
   */
  async getIngredients(): Promise<Ingredient[]> {
    return await localDB.getIngredientsArray();
  }

  /**
   * Get last sync time
   */
  async getLastSyncTime(): Promise<Date | null> {
    return await localDB.getLastSyncTime();
  }

  /**
   * Check if there are pending changes
   */
  async hasPendingChanges(): Promise<boolean> {
    return await localDB.hasPendingChanges();
  }

  /**
   * Get pending changes count
   */
  async getPendingChangesCount(): Promise<number> {
    return await localDB.getPendingChangesCount();
  }

  // CRUD Operations - now save to local storage instead of immediately syncing

  /**
   * Add a new category
   */
  async addCategory(data: CategoryCreateData): Promise<IngredientCategory> {
    const category: IngredientCategory = {
      id: data.id || crypto.randomUUID(),
      name: data.name,
      description: data.description,
      color: data.color,
      icon: data.icon
    };

    await localDB.addCategory(category);
    return category;
  }

  /**
   * Update a category
   */
  async updateCategory(data: Partial<CategoryCreateData> & { id: string }): Promise<IngredientCategory> {
    const categories = await localDB.getCategoriesArray();
    const existing = categories.find(c => c.id === data.id);
    if (!existing) {
      throw new Error('Category not found');
    }

    const updated: IngredientCategory = {
      ...existing,
      ...data
    };

    await localDB.updateCategory(updated);
    return updated;
  }

  /**
   * Delete a category
   */
  async deleteCategory(categoryId: string): Promise<void> {
    await localDB.deleteCategory(categoryId);
  }

  /**
   * Add a new ingredient
   */
  async addIngredient(data: IngredientCreateData): Promise<Ingredient> {
    const categories = await localDB.getCategoriesArray();
    const category = categories.find(c => c.id === data.categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    const now = new Date();
    const ingredient: Ingredient = {
      id: data.id || crypto.randomUUID(),
      name: data.name,
      category: category,
      defaultUnit: data.defaultUnit,
      alternativeNames: data.alternativeNames || [],
      description: data.description,
      storageInfo: data.storageInfo,
      nutritionInfo: data.nutritionInfo,
      purchaseInfo: data.purchaseInfo,
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now
    };

    await localDB.addIngredient(ingredient);
    return ingredient;
  }

  /**
   * Update an ingredient
   */
  async updateIngredient(data: IngredientUpdateData): Promise<Ingredient> {
    const ingredients = await localDB.getIngredientsArray();
    const existing = ingredients.find(i => i.id === data.id);
    if (!existing) {
      throw new Error('Ingredient not found');
    }

    let category = existing.category;
    if (data.categoryId && data.categoryId !== existing.category.id) {
      const categories = await localDB.getCategoriesArray();
      const newCategory = categories.find(c => c.id === data.categoryId);
      if (!newCategory) {
        throw new Error('Category not found');
      }
      category = newCategory;
    }

    const updated: Ingredient = {
      ...existing,
      ...data,
      category,
      updatedAt: new Date()
    };

    await localDB.updateIngredient(updated);
    return updated;
  }

  /**
   * Delete an ingredient
   */
  async deleteIngredient(ingredientId: string): Promise<void> {
    await localDB.deleteIngredient(ingredientId);
  }

  /**
   * Search ingredients
   */
  searchIngredients(query: string): IngredientSearchResult[] {
    // TODO: Implement search logic
    console.log('Search query:', query);
    return [];
  }
}

// Export singleton instance
export const ingredients = IngredientsService.getInstance();