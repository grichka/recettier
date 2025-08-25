import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IngredientsService } from '../../src/services/ingredients';
import type { Ingredient, IngredientCategory, IngredientsRegistry } from '../../src/types/recipe';

// Mock dependencies
vi.mock('../../src/services/googleDrive', () => ({
  GoogleDriveService: {
    getInstance: vi.fn(() => ({
      initialize: vi.fn(),
      getIngredientsFolderId: vi.fn(() => 'folder-id'),
      findFileByName: vi.fn(),
      readFileContent: vi.fn(),
      createFile: vi.fn(),
      updateFileContent: vi.fn(),
    })),
    INGREDIENTS_REGISTRY_FILE: 'ingredients-registry.json',
  },
  googleDriveService: {
    initialize: vi.fn(),
    getIngredientsFolderId: vi.fn(() => 'folder-id'),
    findFileByName: vi.fn(),
    readFileContent: vi.fn(),
    createFile: vi.fn(),
    updateFileContent: vi.fn(),
  },
}));

vi.mock('../../src/services/localStorage', () => ({
  localStorage: {
    initialize: vi.fn(),
    getLocalData: vi.fn(),
    loadFromRegistry: vi.fn(),
    getCategoriesArray: vi.fn(),
    getIngredientsArray: vi.fn(),
    getLastSyncTime: vi.fn(),
    hasPendingChanges: vi.fn(),
    getPendingChangesCount: vi.fn(),
    addCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    addIngredient: vi.fn(),
    updateIngredient: vi.fn(),
    deleteIngredient: vi.fn(),
    clearPendingChanges: vi.fn(),
    updateLastSyncTime: vi.fn(),
  },
}));

// Import mocked modules
import { googleDriveService } from '../../src/services/googleDrive';
import { localStorage } from '../../src/services/localStorage';

// Mock types for Google Drive service
interface MockGoogleDriveService {
  initialize: ReturnType<typeof vi.fn>;
  getIngredientsFolderId: ReturnType<typeof vi.fn>;
  findFileByName: ReturnType<typeof vi.fn>;
  createFile: ReturnType<typeof vi.fn>;
  updateFile: ReturnType<typeof vi.fn>;
  downloadFile: ReturnType<typeof vi.fn>;
  readFileContent: ReturnType<typeof vi.fn>;
  updateFileContent: ReturnType<typeof vi.fn>;
}

// Mock types for localStorage service
interface MockLocalStorage {
  initialize: ReturnType<typeof vi.fn>;
  getLocalData: ReturnType<typeof vi.fn>;
  loadFromRegistry: ReturnType<typeof vi.fn>;
  clearPendingChanges: ReturnType<typeof vi.fn>;
  updateLastSyncTime: ReturnType<typeof vi.fn>;
  getCategoriesArray: ReturnType<typeof vi.fn>;
  getIngredientsArray: ReturnType<typeof vi.fn>;
  getLastSyncTime: ReturnType<typeof vi.fn>;
  hasPendingChanges: ReturnType<typeof vi.fn>;
  getPendingChangesCount: ReturnType<typeof vi.fn>;
  addCategory: ReturnType<typeof vi.fn>;
  updateCategory: ReturnType<typeof vi.fn>;
  deleteCategory: ReturnType<typeof vi.fn>;
  addIngredient: ReturnType<typeof vi.fn>;
  updateIngredient: ReturnType<typeof vi.fn>;
  deleteIngredient: ReturnType<typeof vi.fn>;
}

const mockGoogleDriveService = googleDriveService as unknown as MockGoogleDriveService;
const mockLocalStorage = localStorage as unknown as MockLocalStorage;

describe('Ingredients Service', () => {
  let ingredientsService: IngredientsService;

  const mockCategory: IngredientCategory = {
    id: 'cat1',
    name: 'Vegetables',
    description: 'Fresh vegetables',
    color: '#4caf50',
    icon: '🥬',
  };

  const mockIngredient: Ingredient = {
    id: 'ing1',
    name: 'Carrot',
    category: mockCategory,
    defaultUnit: 'g',
    alternativeNames: ['Orange carrot'],
    description: 'Fresh orange carrot',
    tags: ['orange', 'vegetable'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockRegistry: IngredientsRegistry = {
    ingredients: { ing1: mockIngredient },
    categories: { cat1: mockCategory },
    version: '1.0.0',
    lastUpdated: new Date('2024-01-01'),
    metadata: {
      totalIngredients: 1,
      totalCategories: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    ingredientsService = IngredientsService.getInstance();
    
    // Setup default mock responses
    mockLocalStorage.initialize.mockResolvedValue(undefined);
    mockGoogleDriveService.initialize.mockResolvedValue(undefined);
    mockLocalStorage.getLocalData.mockResolvedValue({
      ingredients: {},
      categories: {},
      baselineIngredients: {},
      baselineCategories: {},
      pendingChanges: [],
      lastLocalUpdate: new Date(),
      lastSyncTime: null,
    });
    mockLocalStorage.getCategoriesArray.mockResolvedValue([]);
    mockLocalStorage.getIngredientsArray.mockResolvedValue([]);
    mockLocalStorage.getLastSyncTime.mockResolvedValue(null);
    mockLocalStorage.hasPendingChanges.mockResolvedValue(false);
    mockLocalStorage.getPendingChangesCount.mockResolvedValue(0);
  });

  describe('Initialization', () => {
    it('should initialize successfully when no existing data', async () => {
      mockLocalStorage.getLocalData.mockResolvedValue({
        ingredients: {},
        categories: {},
        baselineIngredients: {},
        baselineCategories: {},
        pendingChanges: [],
        lastLocalUpdate: new Date(),
        lastSyncTime: null,
      });
      mockGoogleDriveService.findFileByName.mockResolvedValue(null);

      await ingredientsService.initialize();

      expect(mockLocalStorage.initialize).toHaveBeenCalled();
      expect(mockGoogleDriveService.initialize).toHaveBeenCalled();
    });

    it('should load existing registry from Google Drive', async () => {
      mockLocalStorage.getLocalData.mockResolvedValue({
        ingredients: {},
        categories: {},
        baselineIngredients: {},
        baselineCategories: {},
        pendingChanges: [],
        lastLocalUpdate: new Date(),
        lastSyncTime: null,
      });
      mockGoogleDriveService.findFileByName.mockResolvedValue({ id: 'file-id' });
      mockGoogleDriveService.readFileContent.mockResolvedValue(JSON.stringify(mockRegistry));

      await ingredientsService.initialize();

      expect(mockGoogleDriveService.readFileContent).toHaveBeenCalledWith('file-id');
      expect(mockLocalStorage.loadFromRegistry).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: {
            ing1: expect.objectContaining({
              id: 'ing1',
              name: 'Carrot',
              createdAt: expect.any(String), // Date gets serialized to string
              updatedAt: expect.any(String),
            })
          },
          categories: {
            cat1: expect.objectContaining({
              id: 'cat1',
              name: 'Vegetables',
            })
          },
          version: '1.0.0',
          lastUpdated: expect.any(String),
          metadata: {
            totalIngredients: 1,
            totalCategories: 1,
          },
        })
      );
    });

    it('should create default registry when no file exists on Google Drive', async () => {
      mockLocalStorage.getLocalData.mockResolvedValue({
        ingredients: {},
        categories: {},
        baselineIngredients: {},
        baselineCategories: {},
        pendingChanges: [],
        lastLocalUpdate: new Date(),
        lastSyncTime: null,
      });
      mockGoogleDriveService.findFileByName.mockResolvedValue(null);

      await ingredientsService.initialize();

      expect(mockLocalStorage.loadFromRegistry).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: {},
          categories: {},
          version: '1.0.0',
          metadata: {
            totalIngredients: 0,
            totalCategories: 0,
          },
        })
      );
    });

    it('should handle initialization errors gracefully', async () => {
      mockLocalStorage.initialize.mockRejectedValue(new Error('Init failed'));

      await expect(ingredientsService.initialize()).rejects.toThrow('Init failed');
    });

    it('should skip sync when local data exists', async () => {
      mockLocalStorage.getLocalData.mockResolvedValue({
        ingredients: {},
        categories: {},
        baselineIngredients: {},
        baselineCategories: {},
        pendingChanges: [],
        lastLocalUpdate: new Date(),
        lastSyncTime: new Date(), // Has previous sync
      });

      await ingredientsService.initialize();

      expect(mockGoogleDriveService.findFileByName).not.toHaveBeenCalled();
    });
  });

  describe('Data Access Methods', () => {
    it('should get categories', async () => {
      const categories = [mockCategory];
      mockLocalStorage.getCategoriesArray.mockResolvedValue(categories);

      const result = await ingredientsService.getCategories();

      expect(result).toEqual(categories);
      expect(mockLocalStorage.getCategoriesArray).toHaveBeenCalled();
    });

    it('should get ingredients', async () => {
      const ingredients = [mockIngredient];
      mockLocalStorage.getIngredientsArray.mockResolvedValue(ingredients);

      const result = await ingredientsService.getIngredients();

      expect(result).toEqual(ingredients);
      expect(mockLocalStorage.getIngredientsArray).toHaveBeenCalled();
    });

    it('should get last sync time', async () => {
      const syncTime = new Date();
      mockLocalStorage.getLastSyncTime.mockResolvedValue(syncTime);

      const result = await ingredientsService.getLastSyncTime();

      expect(result).toEqual(syncTime);
      expect(mockLocalStorage.getLastSyncTime).toHaveBeenCalled();
    });

    it('should check if has pending changes', async () => {
      mockLocalStorage.hasPendingChanges.mockResolvedValue(true);

      const result = await ingredientsService.hasPendingChanges();

      expect(result).toBe(true);
      expect(mockLocalStorage.hasPendingChanges).toHaveBeenCalled();
    });

    it('should get pending changes count', async () => {
      mockLocalStorage.getPendingChangesCount.mockResolvedValue(5);

      const result = await ingredientsService.getPendingChangesCount();

      expect(result).toBe(5);
      expect(mockLocalStorage.getPendingChangesCount).toHaveBeenCalled();
    });
  });

  describe('Category Operations', () => {
    it('should add category successfully', async () => {
      const categoryData = {
        name: 'Test Category',
        description: 'Test description',
        color: '#ff0000',
        icon: '🍎',
      };

      const result = await ingredientsService.addCategory(categoryData);

      expect(result).toEqual(expect.objectContaining({
        id: expect.any(String),
        name: categoryData.name,
        description: categoryData.description,
        color: categoryData.color,
        icon: categoryData.icon,
      }));
      expect(mockLocalStorage.addCategory).toHaveBeenCalledWith(result);
    });

    it('should add category with custom ID', async () => {
      const categoryData = {
        id: 'custom-id',
        name: 'Test Category',
      };

      const result = await ingredientsService.addCategory(categoryData);

      expect(result.id).toBe('custom-id');
      expect(mockLocalStorage.addCategory).toHaveBeenCalledWith(result);
    });

    it('should update category successfully', async () => {
      mockLocalStorage.getCategoriesArray.mockResolvedValue([mockCategory]);

      const updateData = {
        id: mockCategory.id,
        name: 'Updated Name',
        color: '#ff0000',
      };

      const result = await ingredientsService.updateCategory(updateData);

      expect(result).toEqual({
        ...mockCategory,
        name: 'Updated Name',
        color: '#ff0000',
      });
      expect(mockLocalStorage.updateCategory).toHaveBeenCalledWith(result);
    });

    it('should throw error when updating non-existent category', async () => {
      mockLocalStorage.getCategoriesArray.mockResolvedValue([]);

      const updateData = {
        id: 'non-existent',
        name: 'Updated Name',
      };

      await expect(ingredientsService.updateCategory(updateData)).rejects.toThrow('Category not found');
    });

    it('should delete category successfully', async () => {
      await ingredientsService.deleteCategory('cat1');

      expect(mockLocalStorage.deleteCategory).toHaveBeenCalledWith('cat1');
    });
  });

  describe('Ingredient Operations', () => {
    beforeEach(() => {
      mockLocalStorage.getCategoriesArray.mockResolvedValue([mockCategory]);
      
      // Mock crypto.randomUUID
      Object.defineProperty(globalThis, 'crypto', {
        value: {
          randomUUID: vi.fn(() => 'test-uuid-123'),
        },
        writable: true,
      });
    });

    it('should add ingredient successfully', async () => {
      const ingredientData = {
        name: 'Test Ingredient',
        categoryId: mockCategory.id,
        defaultUnit: 'kg',
        description: 'Test description',
        alternativeNames: ['Alt name'],
        tags: ['tag1', 'tag2'],
      };

      const result = await ingredientsService.addIngredient(ingredientData);

      expect(result).toEqual(expect.objectContaining({
        id: expect.any(String),
        name: ingredientData.name,
        category: mockCategory,
        defaultUnit: ingredientData.defaultUnit,
        description: ingredientData.description,
        alternativeNames: ingredientData.alternativeNames,
        tags: ingredientData.tags,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }));
      expect(mockLocalStorage.addIngredient).toHaveBeenCalledWith(result);
    });

    it('should add ingredient with custom ID', async () => {
      const ingredientData = {
        id: 'custom-ingredient-id',
        name: 'Test Ingredient',
        categoryId: mockCategory.id,
        defaultUnit: 'kg',
      };

      const result = await ingredientsService.addIngredient(ingredientData);

      expect(result.id).toBe('custom-ingredient-id');
      expect(mockLocalStorage.addIngredient).toHaveBeenCalledWith(result);
    });

    it('should throw error when adding ingredient with non-existent category', async () => {
      mockLocalStorage.getCategoriesArray.mockResolvedValue([]);

      const ingredientData = {
        name: 'Test Ingredient',
        categoryId: 'non-existent',
        defaultUnit: 'kg',
      };

      await expect(ingredientsService.addIngredient(ingredientData)).rejects.toThrow('Category not found');
    });

    it('should update ingredient successfully', async () => {
      mockLocalStorage.getIngredientsArray.mockResolvedValue([mockIngredient]);

      const updateData = {
        id: mockIngredient.id,
        name: 'Updated Ingredient',
        description: 'Updated description',
      };

      const result = await ingredientsService.updateIngredient(updateData);

      expect(result).toEqual({
        ...mockIngredient,
        name: 'Updated Ingredient',
        description: 'Updated description',
        updatedAt: expect.any(Date),
      });
      expect(mockLocalStorage.updateIngredient).toHaveBeenCalledWith(result);
    });

    it('should update ingredient category', async () => {
      const newCategory = { ...mockCategory, id: 'cat2', name: 'New Category' };
      mockLocalStorage.getIngredientsArray.mockResolvedValue([mockIngredient]);
      mockLocalStorage.getCategoriesArray.mockResolvedValue([mockCategory, newCategory]);

      const updateData = {
        id: mockIngredient.id,
        categoryId: 'cat2',
      };

      const result = await ingredientsService.updateIngredient(updateData);

      expect(result.category).toEqual(newCategory);
      expect(mockLocalStorage.updateIngredient).toHaveBeenCalledWith(result);
    });

    it('should throw error when updating ingredient with non-existent category', async () => {
      mockLocalStorage.getIngredientsArray.mockResolvedValue([mockIngredient]);
      mockLocalStorage.getCategoriesArray.mockResolvedValue([mockCategory]);

      const updateData = {
        id: mockIngredient.id,
        categoryId: 'non-existent',
      };

      await expect(ingredientsService.updateIngredient(updateData)).rejects.toThrow('Category not found');
    });

    it('should throw error when updating non-existent ingredient', async () => {
      mockLocalStorage.getIngredientsArray.mockResolvedValue([]);

      const updateData = {
        id: 'non-existent',
        name: 'Updated Name',
      };

      await expect(ingredientsService.updateIngredient(updateData)).rejects.toThrow('Ingredient not found');
    });

    it('should delete ingredient successfully', async () => {
      await ingredientsService.deleteIngredient('ing1');

      expect(mockLocalStorage.deleteIngredient).toHaveBeenCalledWith('ing1');
    });
  });

  describe('Google Drive Sync', () => {
    it('should sync from Google Drive successfully', async () => {
      mockGoogleDriveService.findFileByName.mockResolvedValue({ id: 'file-id' });
      mockGoogleDriveService.readFileContent.mockResolvedValue(JSON.stringify(mockRegistry));

      await ingredientsService.syncFromGoogleDrive();

      expect(mockGoogleDriveService.readFileContent).toHaveBeenCalledWith('file-id');
      expect(mockLocalStorage.loadFromRegistry).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: {
            ing1: expect.objectContaining({
              id: 'ing1',
              name: 'Carrot',
              createdAt: expect.any(String), // Date gets serialized to string
              updatedAt: expect.any(String),
            })
          },
          categories: {
            cat1: expect.objectContaining({
              id: 'cat1',
              name: 'Vegetables',
            })
          },
          version: '1.0.0',
          lastUpdated: expect.any(String),
          metadata: {
            totalIngredients: 1,
            totalCategories: 1,
          },
        })
      );
    });

    it('should create default registry when file not found', async () => {
      mockGoogleDriveService.findFileByName.mockResolvedValue(null);

      await ingredientsService.syncFromGoogleDrive();

      expect(mockLocalStorage.loadFromRegistry).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: {},
          categories: {},
        })
      );
      expect(mockGoogleDriveService.createFile).toHaveBeenCalled();
    });

    it('should save to Google Drive successfully', async () => {
      mockLocalStorage.getLocalData.mockResolvedValue({
        ingredients: { ing1: mockIngredient },
        categories: { cat1: mockCategory },
        baselineIngredients: {},
        baselineCategories: {},
        pendingChanges: [],
        lastLocalUpdate: new Date(),
        lastSyncTime: null,
      });
      mockGoogleDriveService.findFileByName.mockResolvedValue({ id: 'file-id' });

      await ingredientsService.saveToGoogleDrive();

      expect(mockGoogleDriveService.updateFileContent).toHaveBeenCalledWith(
        'file-id',
        expect.stringContaining('"ingredients"')
      );
      expect(mockLocalStorage.clearPendingChanges).toHaveBeenCalled();
      expect(mockLocalStorage.updateLastSyncTime).toHaveBeenCalledWith(expect.any(Date));
    });

    it('should create file when saving to Google Drive and file does not exist', async () => {
      mockLocalStorage.getLocalData.mockResolvedValue({
        ingredients: {},
        categories: {},
        baselineIngredients: {},
        baselineCategories: {},
        pendingChanges: [],
        lastLocalUpdate: new Date(),
        lastSyncTime: null,
      });
      mockGoogleDriveService.findFileByName.mockResolvedValue(null);

      await ingredientsService.saveToGoogleDrive();

      expect(mockGoogleDriveService.createFile).toHaveBeenCalledWith(
        'ingredients-registry.json',
        expect.stringContaining('"ingredients"'),
        'folder-id'
      );
    });

    it('should handle Google Drive sync errors', async () => {
      mockGoogleDriveService.findFileByName.mockRejectedValue(new Error('Drive error'));

      await ingredientsService.syncFromGoogleDrive();

      // Should create default registry on error
      expect(mockLocalStorage.loadFromRegistry).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: {},
          categories: {},
        })
      );
    });
  });

  describe('Search Functionality', () => {
    it('should search ingredients (basic implementation)', () => {
      const results = ingredientsService.searchIngredients('carrot');
      
      // Currently returns empty array, but logs the query
      expect(results).toEqual([]);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = IngredientsService.getInstance();
      const instance2 = IngredientsService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
});