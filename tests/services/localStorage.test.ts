/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { localStorage } from '../../src/services/localStorage';
import type { Ingredient, IngredientCategory, IngredientsRegistry } from '../../src/types/recipe';

// Mock IndexedDB with simplified approach
let mockStoredData: any = null;
let mockInitError: Error | null = null;

// Create a comprehensive mock for IndexedDB operations
const mockIndexedDB = {
  open: vi.fn().mockImplementation(() => {
    const request: any = {
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: {
        transaction: vi.fn().mockReturnValue({
          objectStore: vi.fn().mockReturnValue({
            get: vi.fn().mockImplementation(() => {
              const getRequest: any = {
                onsuccess: null,
                onerror: null,
                result: mockStoredData,
              };
              // Trigger success callback immediately
              setTimeout(() => {
                if (getRequest.onsuccess) {
                  getRequest.onsuccess({ target: getRequest });
                }
              }, 0);
              return getRequest;
            }),
            put: vi.fn().mockImplementation((data: any) => {
              const putRequest: any = {
                onsuccess: null,
                onerror: null,
              };
              // Update mock data and trigger success
              setTimeout(() => {
                mockStoredData = data;
                if (putRequest.onsuccess) {
                  putRequest.onsuccess({ target: putRequest });
                }
              }, 0);
              return putRequest;
            }),
          }),
          oncomplete: null,
          onerror: null,
        }),
        close: vi.fn(),
      },
    };

    // Simulate async open and trigger success immediately
    setTimeout(() => {
      if (mockInitError) {
        if (request.onerror) {
          request.onerror({ target: request, error: mockInitError });
        }
      } else {
        if (request.onsuccess) {
          request.onsuccess({ target: request });
        }
      }
    }, 0);

    return request;
  }),
};

Object.defineProperty(globalThis, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
});

Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
  writable: true,
});

describe('LocalStorage Service', () => {
  // Helper function to assert mockStoredData is not null
  const assertMockData = (): any => {
    if (!mockStoredData) {
      throw new Error('mockStoredData is null');
    }
    return mockStoredData;
  };

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

  beforeEach(async () => {
    vi.clearAllMocks();
    mockInitError = null;
    mockStoredData = {
      ingredients: {},
      categories: {},
      baselineIngredients: {},
      baselineCategories: {},
      pendingChanges: [],
      lastLocalUpdate: new Date(),
      lastSyncTime: new Date(),
    };
  });

  describe('Initialization', () => {
    it('should initialize the database successfully', async () => {
      await localStorage.initialize();
      expect(mockIndexedDB.open).toHaveBeenCalled();
    });

    it('should handle database initialization errors', async () => {
      mockInitError = new Error('DB init failed');
      await expect(localStorage.initialize()).rejects.toThrow('DB init failed');
    });
  });

  describe('Local Data Management', () => {
    it('should return default empty data when no data exists', async () => {
      mockStoredData = null;
      const data = await localStorage.getLocalData();
      
      expect(data).toEqual({
        ingredients: {},
        categories: {},
        baselineIngredients: {},
        baselineCategories: {},
        pendingChanges: [],
        lastLocalUpdate: expect.any(Date),
        lastSyncTime: null,
      });
    });

    it('should load existing data correctly', async () => {
      const existingData = {
        ingredients: { [mockIngredient.id]: mockIngredient },
        categories: { [mockCategory.id]: mockCategory },
        baselineIngredients: {},
        baselineCategories: {},
        pendingChanges: [],
        lastLocalUpdate: new Date(),
        lastSyncTime: new Date(),
      };
      mockStoredData = existingData;

      const data = await localStorage.getLocalData();
      expect(data).toEqual(existingData);
    });

    it('should handle backward compatibility with missing baseline fields', async () => {
      const legacyData: any = {
        ingredients: { [mockIngredient.id]: mockIngredient },
        categories: { [mockCategory.id]: mockCategory },
        baselineIngredients: {},
        baselineCategories: {},
        pendingChanges: [],
        lastLocalUpdate: new Date(),
        lastSyncTime: new Date(),
        // Testing backward compatibility - baseline fields exist but empty
      };
      mockStoredData = legacyData;

      const data = await localStorage.getLocalData();
      expect(data).toHaveProperty('baselineIngredients', {});
      expect(data).toHaveProperty('baselineCategories', {});
    });
  });

  describe('Registry Operations', () => {
    it('should load from registry and set baseline correctly', async () => {
      await localStorage.loadFromRegistry(mockRegistry);

      // Check if data was stored
      expect(mockStoredData).toMatchObject({
        ingredients: mockRegistry.ingredients,
        categories: mockRegistry.categories,
        baselineIngredients: mockRegistry.ingredients,
        baselineCategories: mockRegistry.categories,
      });
    });
  });

  describe('Category Operations', () => {
    it('should add category and create pending change', async () => {
      await localStorage.addCategory(mockCategory);
      const data = assertMockData();
      expect(data.categories[mockCategory.id]).toEqual(mockCategory);
      expect(data.pendingChanges).toHaveLength(1);
      expect(data.pendingChanges[0]).toMatchObject({
        type: 'category',
        operation: 'create',
        data: mockCategory,
      });
    });

    it('should update category and create pending change', async () => {
      // First add category to current data and baseline 
      await localStorage.addCategory(mockCategory);
      
      // Set up baseline so the service recognizes this as an update
      mockStoredData.baselineCategories = { [mockCategory.id]: mockCategory };
      mockStoredData.pendingChanges = []; // Clear add pending change

      const updatedCategory = { ...mockCategory, name: 'Updated Name' };
      await localStorage.updateCategory(updatedCategory);
      
      const data = assertMockData();
      expect(data.categories[mockCategory.id]).toEqual(updatedCategory);
      expect(data.pendingChanges).toHaveLength(1);
      expect(data.pendingChanges[0]).toMatchObject({
        type: 'category',
        operation: 'update',
        data: updatedCategory,
      });
    });

    it('should delete category and create pending change', async () => {
      // First add the category to both current and baseline data
      await localStorage.addCategory(mockCategory);
      
      // Set up baseline to include this category
      mockStoredData.baselineCategories = { [mockCategory.id]: mockCategory };
      mockStoredData.pendingChanges = []; // Clear any pending changes from add
      
      await localStorage.deleteCategory(mockCategory.id);
      expect(mockStoredData.categories[mockCategory.id]).toBeUndefined();
      expect(mockStoredData.pendingChanges).toHaveLength(1);
      expect(mockStoredData.pendingChanges[0]).toMatchObject({
        type: 'category',
        operation: 'delete',
      });
    });

    it('should get categories array', async () => {
      mockStoredData.categories = { [mockCategory.id]: mockCategory };
      
      const categories = await localStorage.getCategoriesArray();
      expect(categories).toEqual([mockCategory]);
    });
  });

  describe('Ingredient Operations', () => {
    it('should add ingredient and create pending change', async () => {
      await localStorage.addIngredient(mockIngredient);
      expect(mockStoredData.ingredients[mockIngredient.id]).toEqual(mockIngredient);
      expect(mockStoredData.pendingChanges).toHaveLength(1);
      expect(mockStoredData.pendingChanges[0]).toMatchObject({
        type: 'ingredient',
        operation: 'create',
        data: mockIngredient,
      });
    });

    it('should update ingredient and create pending change', async () => {
      // First add ingredient to current data and baseline 
      await localStorage.addIngredient(mockIngredient);
      mockStoredData.baselineIngredients = { [mockIngredient.id]: mockIngredient };
      mockStoredData.pendingChanges = []; // Clear add pending change

      const updatedIngredient = { ...mockIngredient, name: 'Updated Carrot' };
      await localStorage.updateIngredient(updatedIngredient);
      expect(mockStoredData.ingredients[mockIngredient.id]).toEqual(updatedIngredient);
      expect(mockStoredData.pendingChanges).toHaveLength(1);
      expect(mockStoredData.pendingChanges[0]).toMatchObject({
        type: 'ingredient',
        operation: 'update',
        data: updatedIngredient,
      });
    });

    it('should delete ingredient and create pending change', async () => {
      // First add the ingredient to both current and baseline data
      await localStorage.addIngredient(mockIngredient);
      
      // Set up baseline to include this ingredient
      mockStoredData.baselineIngredients = { [mockIngredient.id]: mockIngredient };
      mockStoredData.pendingChanges = []; // Clear any pending changes from add
      
      await localStorage.deleteIngredient(mockIngredient.id);
      expect(mockStoredData.ingredients[mockIngredient.id]).toBeUndefined();
      expect(mockStoredData.pendingChanges).toHaveLength(1);
      expect(mockStoredData.pendingChanges[0]).toMatchObject({
        type: 'ingredient',
        operation: 'delete',
      });
    });

    it('should get ingredients array', async () => {
      mockStoredData.ingredients = { [mockIngredient.id]: mockIngredient };
      
      const ingredients = await localStorage.getIngredientsArray();
      expect(ingredients).toEqual([mockIngredient]);
    });
  });

  describe('Pending Changes Management', () => {
    it('should check if has pending changes', async () => {
      mockStoredData.pendingChanges = [{ type: 'add', entityType: 'category', entityId: 'test' }];
      
      const hasPending = await localStorage.hasPendingChanges();
      expect(hasPending).toBe(true);
    });

    it('should get pending changes count', async () => {
      mockStoredData.pendingChanges = [
        { type: 'add', entityType: 'category', entityId: 'test1' },
        { type: 'update', entityType: 'ingredient', entityId: 'test2' },
      ];
      
      const count = await localStorage.getPendingChangesCount();
      expect(count).toBe(2);
    });

    it('should clear pending changes and update baseline', async () => {
      const currentData = {
        ingredients: { [mockIngredient.id]: mockIngredient },
        categories: { [mockCategory.id]: mockCategory },
        baselineIngredients: {},
        baselineCategories: {},
        pendingChanges: [{ type: 'add', entityType: 'category', entityId: 'test' }],
        lastLocalUpdate: new Date(),
        lastSyncTime: null,
      };
      mockStoredData = currentData;
      
      await localStorage.clearPendingChanges();
      
      expect(mockStoredData.pendingChanges).toHaveLength(0);
      expect(mockStoredData.baselineIngredients).toEqual(currentData.ingredients);
      expect(mockStoredData.baselineCategories).toEqual(currentData.categories);
    });

    it('should get last sync time', async () => {
      const syncTime = new Date();
      mockStoredData.lastSyncTime = syncTime;
      
      const result = await localStorage.getLastSyncTime();
      expect(result).toEqual(syncTime);
    });

    it('should update last sync time', async () => {
      const syncTime = new Date();
      
      await localStorage.updateLastSyncTime(syncTime);
      expect(mockStoredData.lastSyncTime).toEqual(syncTime);
    });
  });

  describe('Smart Pending Changes Calculation', () => {
    it('should not create pending change when adding and deleting same item', async () => {
      // Start with empty data
      mockStoredData = {
        ingredients: {},
        categories: {},
        baselineIngredients: {},
        baselineCategories: {},
        pendingChanges: [],
        lastLocalUpdate: new Date(),
        lastSyncTime: null,
      };
      
      // Add an ingredient
      await localStorage.addIngredient(mockIngredient);
      expect(mockStoredData.pendingChanges).toHaveLength(1);
      
      // Delete the same ingredient
      await localStorage.deleteIngredient(mockIngredient.id);
      
      // Should result in no pending changes (net zero)
      expect(mockStoredData.pendingChanges).toHaveLength(0);
    });

    it('should create delete pending change when deleting item from baseline', async () => {
      // Start with item in baseline (exists on server)
      mockStoredData = {
        ingredients: { [mockIngredient.id]: mockIngredient },
        categories: {},
        baselineIngredients: { [mockIngredient.id]: mockIngredient }, // Item exists on server
        baselineCategories: {},
        pendingChanges: [],
        lastLocalUpdate: new Date(),
        lastSyncTime: new Date(),
      };
      
      // Delete the ingredient
      await localStorage.deleteIngredient(mockIngredient.id);
      
      // Should create a delete pending change
      expect(mockStoredData.pendingChanges).toHaveLength(1);
      expect(mockStoredData.pendingChanges[0]).toMatchObject({
        type: 'ingredient',
        operation: 'delete',
      });
    });
  });
});