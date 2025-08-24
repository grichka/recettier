import type { Ingredient, IngredientCategory, IngredientsRegistry } from '../types/recipe';

interface LocalData {
  ingredients: Record<string, Ingredient>;
  categories: Record<string, IngredientCategory>;
  // Baseline data represents what's currently on Google Drive
  baselineIngredients: Record<string, Ingredient>;
  baselineCategories: Record<string, IngredientCategory>;
  pendingChanges: PendingChange[];
  lastLocalUpdate: Date;
  lastSyncTime: Date | null;
}

interface PendingChange {
  id: string;
  type: 'ingredient' | 'category';
  operation: 'create' | 'update' | 'delete';
  timestamp: Date;
  data?: Ingredient | IngredientCategory;
}

const DB_NAME = 'recettier-ingredients';
const DB_VERSION = 1;
const STORE_NAME = 'local-data';
const DATA_KEY = 'ingredients-data';

class LocalStorageService {
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  private async ensureDatabase(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initialize();
    }
    return this.db!;
  }

  async getLocalData(): Promise<LocalData> {
    const db = await this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(DATA_KEY);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const data = request.result;
        if (data) {
          // Convert date strings back to Date objects
          const localData: LocalData = {
            ...data,
            lastLocalUpdate: new Date(data.lastLocalUpdate),
            lastSyncTime: data.lastSyncTime ? new Date(data.lastSyncTime) : null,
            pendingChanges: data.pendingChanges.map((change: PendingChange & { timestamp: string }) => ({
              ...change,
              timestamp: new Date(change.timestamp)
            })),
            // Handle backward compatibility - if baseline fields don't exist, initialize them
            baselineIngredients: data.baselineIngredients || {},
            baselineCategories: data.baselineCategories || {}
          };
          resolve(localData);
        } else {
          // Return default empty data
          resolve({
            ingredients: {},
            categories: {},
            baselineIngredients: {},
            baselineCategories: {},
            pendingChanges: [],
            lastLocalUpdate: new Date(),
            lastSyncTime: null
          });
        }
      };
    });
  }

  async saveLocalData(data: LocalData): Promise<void> {
    const db = await this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(data, DATA_KEY);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async addPendingChange(change: Omit<PendingChange, 'id' | 'timestamp'>): Promise<void> {
    const data = await this.getLocalData();
    const newChange: PendingChange = {
      ...change,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    // Remove any existing pending changes for the same item
    data.pendingChanges = data.pendingChanges.filter(
      existing => !(existing.type === change.type && existing.data && 
        'id' in existing.data && change.data && 'id' in change.data && 
        existing.data.id === change.data.id)
    );

    data.pendingChanges.push(newChange);
    data.lastLocalUpdate = new Date();
    await this.saveLocalData(data);
  }

  async clearPendingChanges(): Promise<void> {
    const data = await this.getLocalData();
    data.pendingChanges = [];
    // Update baseline to match current state
    data.baselineIngredients = { ...data.ingredients };
    data.baselineCategories = { ...data.categories };
    await this.saveLocalData(data);
  }

  private recalculatePendingChanges(data: LocalData): void {
    const pendingChanges: PendingChange[] = [];

    // Check for ingredient changes
    const currentIngredientIds = new Set(Object.keys(data.ingredients));
    const baselineIngredientIds = new Set(Object.keys(data.baselineIngredients));

    // New ingredients (create)
    for (const id of currentIngredientIds) {
      if (!baselineIngredientIds.has(id)) {
        pendingChanges.push({
          id: crypto.randomUUID(),
          type: 'ingredient',
          operation: 'create',
          timestamp: new Date(),
          data: data.ingredients[id]
        });
      } else {
        // Check for updates (compare objects)
        const current = data.ingredients[id];
        const baseline = data.baselineIngredients[id];
        if (JSON.stringify(current) !== JSON.stringify(baseline)) {
          pendingChanges.push({
            id: crypto.randomUUID(),
            type: 'ingredient',
            operation: 'update',
            timestamp: new Date(),
            data: current
          });
        }
      }
    }

    // Deleted ingredients
    for (const id of baselineIngredientIds) {
      if (!currentIngredientIds.has(id)) {
        pendingChanges.push({
          id: crypto.randomUUID(),
          type: 'ingredient',
          operation: 'delete',
          timestamp: new Date(),
          data: data.baselineIngredients[id]
        });
      }
    }

    // Check for category changes
    const currentCategoryIds = new Set(Object.keys(data.categories));
    const baselineCategoryIds = new Set(Object.keys(data.baselineCategories));

    // New categories (create)
    for (const id of currentCategoryIds) {
      if (!baselineCategoryIds.has(id)) {
        pendingChanges.push({
          id: crypto.randomUUID(),
          type: 'category',
          operation: 'create',
          timestamp: new Date(),
          data: data.categories[id]
        });
      } else {
        // Check for updates (compare objects)
        const current = data.categories[id];
        const baseline = data.baselineCategories[id];
        if (JSON.stringify(current) !== JSON.stringify(baseline)) {
          pendingChanges.push({
            id: crypto.randomUUID(),
            type: 'category',
            operation: 'update',
            timestamp: new Date(),
            data: current
          });
        }
      }
    }

    // Deleted categories
    for (const id of baselineCategoryIds) {
      if (!currentCategoryIds.has(id)) {
        pendingChanges.push({
          id: crypto.randomUUID(),
          type: 'category',
          operation: 'delete',
          timestamp: new Date(),
          data: data.baselineCategories[id]
        });
      }
    }

    data.pendingChanges = pendingChanges;
  }

  async updateLastSyncTime(syncTime: Date): Promise<void> {
    const data = await this.getLocalData();
    data.lastSyncTime = syncTime;
    await this.saveLocalData(data);
  }

  async addCategory(category: IngredientCategory): Promise<void> {
    const data = await this.getLocalData();
    data.categories[category.id] = category;
    data.lastLocalUpdate = new Date();
    
    // Recalculate pending changes based on difference from baseline
    this.recalculatePendingChanges(data);
    
    await this.saveLocalData(data);
  }

  async updateCategory(category: IngredientCategory): Promise<void> {
    const data = await this.getLocalData();
    data.categories[category.id] = category;
    data.lastLocalUpdate = new Date();
    
    // Recalculate pending changes based on difference from baseline
    this.recalculatePendingChanges(data);
    
    await this.saveLocalData(data);
  }

  async deleteCategory(categoryId: string): Promise<void> {
    const data = await this.getLocalData();
    if (data.categories[categoryId]) {
      delete data.categories[categoryId];
      data.lastLocalUpdate = new Date();
      
      // Recalculate pending changes based on difference from baseline
      this.recalculatePendingChanges(data);
      
      await this.saveLocalData(data);
    }
  }

  async addIngredient(ingredient: Ingredient): Promise<void> {
    const data = await this.getLocalData();
    data.ingredients[ingredient.id] = ingredient;
    data.lastLocalUpdate = new Date();
    
    // Recalculate pending changes based on difference from baseline
    this.recalculatePendingChanges(data);
    
    await this.saveLocalData(data);
  }

  async updateIngredient(ingredient: Ingredient): Promise<void> {
    const data = await this.getLocalData();
    data.ingredients[ingredient.id] = ingredient;
    data.lastLocalUpdate = new Date();
    
    // Recalculate pending changes based on difference from baseline
    this.recalculatePendingChanges(data);
    
    await this.saveLocalData(data);
  }

  async deleteIngredient(ingredientId: string): Promise<void> {
    const data = await this.getLocalData();
    if (data.ingredients[ingredientId]) {
      delete data.ingredients[ingredientId];
      data.lastLocalUpdate = new Date();
      
      // Recalculate pending changes based on difference from baseline
      this.recalculatePendingChanges(data);
      
      await this.saveLocalData(data);
    }
  }

  async loadFromRegistry(registry: IngredientsRegistry): Promise<void> {
    const data = await this.getLocalData();
    data.ingredients = registry.ingredients;
    data.categories = registry.categories;
    // Update baseline to match what's on Google Drive
    data.baselineIngredients = { ...registry.ingredients };
    data.baselineCategories = { ...registry.categories };
    data.lastSyncTime = registry.lastUpdated;
    // Clear pending changes since we're syncing from Google Drive
    data.pendingChanges = [];
    await this.saveLocalData(data);
  }

  async getIngredientsArray(): Promise<Ingredient[]> {
    const data = await this.getLocalData();
    return Object.values(data.ingredients);
  }

  async getCategoriesArray(): Promise<IngredientCategory[]> {
    const data = await this.getLocalData();
    return Object.values(data.categories);
  }

  async hasPendingChanges(): Promise<boolean> {
    const data = await this.getLocalData();
    return data.pendingChanges.length > 0;
  }

  async getPendingChangesCount(): Promise<number> {
    const data = await this.getLocalData();
    return data.pendingChanges.length;
  }

  async getLastSyncTime(): Promise<Date | null> {
    const data = await this.getLocalData();
    return data.lastSyncTime;
  }
}

export const localStorage = new LocalStorageService();
export type { LocalData, PendingChange };