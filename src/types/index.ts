// Re-export all types
export * from './auth';
export * from './recipe';

import type { User } from './auth';
import type { Recipe, Ingredient, ShoppingList } from './recipe';

export interface AppState {
  user: User | null;
  recipes: Recipe[];
  ingredients: Ingredient[];
  shoppingLists: ShoppingList[];
  isLoading: boolean;
  error: string | null;
}