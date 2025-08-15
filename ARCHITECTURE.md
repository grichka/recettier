# Architecture

- React SPA (Single Page Application)
  - Using Vite
  - Using Material UI
  - Following best practices and always seeking to have common components where possible
- Authentication with Google Sign-In (OAuth 2.0)
- Storage with Google Drive
  - Use a folder for recipes in JSON format
  - Use a folder for pictures and other static content
  - Use a folder for storing each shopping list in JSON with their status
- Deployed as GitHub Pages

## Architecture Analysis & Recommendations

### Strengths
- Simple, focused single-user approach
- Leverages Google ecosystem for auth and storage
- Modern React stack with Vite for fast development
- Static deployment keeps costs minimal

### Recommendations

#### 1. Data Structure & Organization
- **Folder Structure**: Consider a hierarchical structure in Google Drive:
  ```
  /Recettier/
    ├── recipes/
    │   ├── metadata.json (recipe index)
    │   └── recipe-{id}.json
    ├── ingredients/
    │   └── ingredients-registry.json
    ├── shopping-lists/
    │   └── list-{id}.json
    └── media/
        ├── recipe-images/
        └── thumbnails/
  ```

#### 2. Performance Considerations
- **Caching Strategy**: Implement local storage/IndexedDB for offline access
- **Image Optimization**: Use thumbnail generation for recipe images
- **Lazy Loading**: Load recipes on-demand rather than all at once

#### 3. Data Synchronization
- **Conflict Resolution**: Handle concurrent edits (though single-user, multiple devices possible)
- **Incremental Sync**: Only sync changed data, not entire datasets
- **Version Control**: Consider adding version timestamps to prevent data loss

#### 4. Enhanced Features
- **Search & Filtering**: Full-text search across recipes and ingredients
- **Meal Planning**: Weekly/monthly meal planning with shopping list generation
- **Nutritional Information**: Integration with nutrition APIs
- **Recipe Sharing**: Export recipes as shareable links or PDFs

#### 5. Technical Improvements
- **State Management**: Consider Zustand or Context API for global state
- **Error Handling**: Robust error handling for Google Drive API failures
- **Progressive Web App**: Add PWA capabilities for mobile experience
- **Testing**: Unit and integration tests for core functionality

#### 6. Security & Privacy
- **Scoped Permissions**: Request minimal Google Drive permissions
- **Data Validation**: Validate all data before storing
- **Rate Limiting**: Handle Google API rate limits gracefully

## Architecture Diagrams

### System Overview
```mermaid
graph TB
    subgraph "Client Side"
        A[React SPA] --> B[Google Auth]
        A --> C[Material UI Components]
        A --> D[Local Storage/Cache]
    end
    
    subgraph "Google Services"
        E[Google OAuth 2.0]
        F[Google Drive API]
    end
    
    subgraph "Storage Structure"
        G[Recipes Folder]
        H[Shopping Lists Folder]
        I[Media Folder]
        J[Ingredients Registry]
    end
    
    subgraph "Deployment"
        K[GitHub Pages]
    end
    
    A --> E
    A --> F
    F --> G
    F --> H
    F --> I
    F --> J
    A --> K
```

### Data Flow Architecture

```mermaid
sequenceDiagram
    participant U as User
    participant R as React App
    participant G as Google Auth
    participant D as Google Drive
    participant C as Cache
    
    U->>R: Open Application
    R->>G: Check Authentication
    G-->>R: Auth Status
    
    alt Not Authenticated
        R->>G: Initiate OAuth Flow
        G->>U: Google Sign-In
        U->>G: Credentials
        G-->>R: Access Token
    end
    
    R->>D: Fetch User Data
    D-->>R: Recipes, Lists, Ingredients
    R->>C: Cache Data Locally
    
    U->>R: Create/Edit Recipe
    R->>C: Update Local Cache
    R->>D: Sync to Google Drive
    D-->>R: Confirmation
    
    U->>R: Generate Shopping List
    R->>C: Process Ingredients
    R->>D: Save Shopping List
```

### Component Architecture

```mermaid
graph TD
    subgraph "App Structure"
        A[App.tsx] --> B[Router]
        B --> C[AuthProvider]
        C --> D[DataProvider]
    end
    
    subgraph "Pages"
        E[RecipesPage]
        F[ShoppingListsPage]
        G[IngredientsPage]
        H[SettingsPage]
    end
    
    subgraph "Components"
        I[RecipeCard]
        J[IngredientSelector]
        K[ShoppingListItem]
        L[SearchBar]
        M[ImageUploader]
    end
    
    subgraph "Services"
        N[GoogleDriveService]
        O[AuthService]
        P[CacheService]
        Q[SyncService]
    end
    
    D --> E
    D --> F
    D --> G
    D --> H
    
    E --> I
    E --> L
    F --> K
    G --> J
    
    E --> N
    F --> N
    G --> N
    
    C --> O
    D --> P
    D --> Q
```

### Recipe Data Model

```mermaid
erDiagram
    Recipe {
        string id
        string title
        string description
        array ingredients
        array instructions
        int prep_time
        int cook_time
        int servings
        string difficulty
        array tags
        string image_url
        datetime created_at
        datetime updated_at
    }
    
    Ingredient {
        string name
        string category
        string default_unit
        array alternative_names
    }
    
    RecipeIngredient {
        string ingredient_id
        float quantity
        string unit
        string notes
    }
    
    ShoppingList {
        string id
        string name
        array items
        string status
        datetime created_at
        datetime updated_at
    }
    
    ShoppingListItem {
        string ingredient_id
        float quantity
        string unit
        boolean purchased
        float price
        string store
    }
    
    Recipe ||--o{ RecipeIngredient : contains
    Ingredient ||--o{ RecipeIngredient : used_in
    ShoppingList ||--o{ ShoppingListItem : contains
    Ingredient ||--o{ ShoppingListItem : item_for
```

## Technical Implementation Notes

### Google Drive Integration

- Use the Google Drive API v3 for file operations
- Implement proper error handling for network failures
- Consider batch operations for multiple file uploads
- Use resumable uploads for large media files

### State Management Strategy

```typescript
// Example store structure using Zustand
interface AppState {
  user: User | null;
  recipes: Recipe[];
  ingredients: Ingredient[];
  shoppingLists: ShoppingList[];
  isLoading: boolean;
  error: string | null;
}
```

### Caching Strategy

- Use IndexedDB for offline recipe storage
- Implement cache invalidation based on timestamps
- Store user preferences in localStorage
- Cache recipe images with service worker

### Performance Optimizations

- Implement virtual scrolling for large recipe lists
- Use React.memo for expensive components
- Lazy load images with intersection observer
- Debounce search inputs
