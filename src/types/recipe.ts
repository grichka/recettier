export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  defaultUnit: string;
  alternativeNames: string[];
  description?: string;
  storageInfo?: StorageInfo;
  nutritionInfo?: NutritionInfo;
  purchaseInfo?: PurchaseInfo;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IngredientCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface StorageInfo {
  location: 'pantry' | 'refrigerator' | 'freezer' | 'room_temperature';
  shelfLife?: number; // in days
  storageInstructions?: string;
  freezable: boolean;
}

export interface NutritionInfo {
  caloriesPerUnit?: number;
  servingSize?: string;
  macros?: {
    protein?: number; // grams per serving
    carbs?: number;   // grams per serving
    fat?: number;     // grams per serving
    fiber?: number;   // grams per serving
  };
  allergens?: string[];
}

export interface PurchaseInfo {
  averagePrice?: number;
  priceUnit?: string;
  preferredBrands?: string[];
  preferredStores?: string[];
  seasonalAvailability?: string[];
  lastPurchaseDate?: Date;
  lastPurchasePrice?: number;
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
  unit: string;
  notes?: string;
  optional?: boolean;
  substitutions?: IngredientSubstitution[];
}

export interface IngredientSubstitution {
  ingredientId: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface IngredientsRegistry {
  ingredients: Record<string, Ingredient>;
  categories: Record<string, IngredientCategory>;
  version: string;
  lastUpdated: Date;
  metadata: {
    totalIngredients: number;
    totalCategories: number;
  };
}

export interface IngredientSearchResult {
  ingredient: Ingredient;
  score: number;
  matchType: 'name' | 'alternativeName' | 'category' | 'tag';
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingListItem[];
  status: 'draft' | 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoppingListItem {
  ingredientId: string;
  quantity: number;
  unit: string;
  purchased: boolean;
  price?: number;
  store?: string;
  notes?: string;
}