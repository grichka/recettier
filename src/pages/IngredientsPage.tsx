import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Alert, 
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  ListItemSecondaryAction,
  MenuItem,
  Stack,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Collapse,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  CloudSync as CloudSyncIcon, 
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Info as InfoIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { ingredients as ingredientsService, type CategoryCreateData } from '../services/ingredients';
import type { Ingredient, IngredientCategory } from '../types/recipe';

const IngredientsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error' | 'not-signed-in'>('checking');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [pendingChangesCount, setPendingChangesCount] = useState(0);
  
  // Dialog states
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [ingredientDialogOpen, setIngredientDialogOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{type: 'category' | 'ingredient', id: string, name: string} | null>(null);
  const [categoryDetailsOpen, setCategoryDetailsOpen] = useState(false);
  const [ingredientDetailsOpen, setIngredientDetailsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<IngredientCategory | null>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [isEditingIngredient, setIsEditingIngredient] = useState(false);

  // Form state for new categories
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#1976d2');
  const [newIngredientId, setNewIngredientId] = useState('');
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientCategory, setNewIngredientCategory] = useState<string>('');
  const [newIngredientUnit, setNewIngredientUnit] = useState('');
  const [newIngredientDescription, setNewIngredientDescription] = useState('');
  const [newIngredientAlternativeNames, setNewIngredientAlternativeNames] = useState('');
  const [newIngredientTags, setNewIngredientTags] = useState('');

  // Form state for editing ingredients
  const [editIngredientId, setEditIngredientId] = useState('');
  const [editIngredientName, setEditIngredientName] = useState('');
  const [editIngredientCategory, setEditIngredientCategory] = useState('');
  const [editIngredientUnit, setEditIngredientUnit] = useState('');
  const [editIngredientDescription, setEditIngredientDescription] = useState('');
  const [editIngredientAlternativeNames, setEditIngredientAlternativeNames] = useState('');
  const [editIngredientTags, setEditIngredientTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Search and filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'recent' | 'updated'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'grouped'>('list');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Filtered and sorted ingredients
  const filteredAndSortedIngredients = useMemo(() => {
    let filtered = ingredients;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(ingredient => 
        ingredient.name.toLowerCase().includes(query) ||
        ingredient.description?.toLowerCase().includes(query) ||
        ingredient.category.name.toLowerCase().includes(query) ||
        ingredient.alternativeNames.some(name => name.toLowerCase().includes(query)) ||
        ingredient.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        ingredient.defaultUnit.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(ingredient => 
        selectedCategories.includes(ingredient.category.id)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = a.category.name.localeCompare(b.category.name);
          break;
        case 'recent':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'updated':
          comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }, [ingredients, searchQuery, selectedCategories, sortBy, sortOrder]);

  // Group ingredients by category for grouped view
  const groupedIngredients = useMemo(() => {
    const groups: Record<string, Ingredient[]> = {};
    
    filteredAndSortedIngredients.forEach(ingredient => {
      const categoryId = ingredient.category.id;
      if (!groups[categoryId]) {
        groups[categoryId] = [];
      }
      groups[categoryId].push(ingredient);
    });

    return groups;
  }, [filteredAndSortedIngredients]);

  // Helper function to refresh pending changes status
  const refreshPendingChanges = useCallback(async () => {
    try {
      const pending = await ingredientsService.hasPendingChanges();
      const count = await ingredientsService.getPendingChangesCount();
      setHasPendingChanges(pending);
      setPendingChangesCount(count);
    } catch (error) {
      console.error('Error checking pending changes:', error);
    }
  }, []);

  const initializeService = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setConnectionStatus('checking');

    try {
      console.log('Starting initialization...');
      
      // Initialize ingredients service (this will also initialize Google Drive service)
      await ingredientsService.initialize();
      
      // Load ingredients and categories
      const loadedIngredients = await ingredientsService.getIngredients();
      const loadedCategories = await ingredientsService.getCategories();
      const syncTime = await ingredientsService.getLastSyncTime();
      
      setIngredients(loadedIngredients);
      setCategories(loadedCategories);
      setLastSyncTime(syncTime);
      setConnectionStatus('connected');
      
      // Check pending changes
      await refreshPendingChanges();
      
      console.log('Ingredients service initialized successfully');
      console.log('Loaded ingredients:', loadedIngredients.length);
      console.log('Loaded categories:', loadedCategories.length);
      
    } catch (error) {
      console.error('Error initializing ingredients service:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize');
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, [refreshPendingChanges]);

  useEffect(() => {
    if (isAuthenticated) {
      initializeService();
    } else {
      setConnectionStatus('not-signed-in');
    }
  }, [isAuthenticated, initializeService]);

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await ingredientsService.syncFromGoogleDrive();
      
      // Reload data
      const loadedIngredients = await ingredientsService.getIngredients();
      const loadedCategories = await ingredientsService.getCategories();
      const syncTime = await ingredientsService.getLastSyncTime();
      
      setIngredients(loadedIngredients);
      setCategories(loadedCategories);
      setLastSyncTime(syncTime);
      
      // Refresh pending changes (should be cleared after sync from Google Drive)
      await refreshPendingChanges();
      
      console.log('Successfully refreshed ingredients');
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to refresh data');
      console.error('Failed to refresh ingredients:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Category handlers
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const newCategoryData: CategoryCreateData = {
        ...(newCategoryId.trim() && { id: newCategoryId.trim() }),
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
        color: newCategoryColor,
        icon: newCategoryIcon || '📁'
      };
      
      await ingredientsService.addCategory(newCategoryData);
      const updatedCategories = await ingredientsService.getCategories();
      setCategories(updatedCategories);
      
      // Reset form
      setNewCategoryId('');
      setNewCategoryName('');
      setNewCategoryDescription('');
      setNewCategoryIcon('');
      setNewCategoryColor('#1976d2');
      setCategoryDialogOpen(false);
      
      // Refresh pending changes
      await refreshPendingChanges();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to add category');
      setError(error.message);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    setDeleteTarget({ type: 'category', id: categoryId, name: category.name });
    setConfirmDeleteOpen(true);
  };

  const handleShowCategoryDetails = (category: IngredientCategory) => {
    setSelectedCategory(category);
    setCategoryDetailsOpen(true);
  };

  // Ingredient handlers
  const handleAddIngredient = async () => {
    if (!newIngredientName.trim() || !newIngredientCategory || !newIngredientUnit.trim()) return;

    try {
      const alternativeNames = newIngredientAlternativeNames 
        ? newIngredientAlternativeNames.split(',').map(name => name.trim()).filter(name => name)
        : [];
      
      const tags = newIngredientTags 
        ? newIngredientTags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];

      await ingredientsService.addIngredient({
        id: newIngredientId.trim() || undefined,
        name: newIngredientName.trim(),
        categoryId: newIngredientCategory,
        defaultUnit: newIngredientUnit.trim(),
        description: newIngredientDescription.trim() || undefined,
        alternativeNames: alternativeNames.length > 0 ? alternativeNames : undefined,
        tags: tags.length > 0 ? tags : undefined
      });
      
      // Refresh local data and pending changes
      const updatedIngredients = await ingredientsService.getIngredients();
      setIngredients(updatedIngredients);
      await refreshPendingChanges();
      
      // Reset form
      setNewIngredientId('');
      setNewIngredientName('');
      setNewIngredientCategory('');
      setNewIngredientUnit('');
      setNewIngredientDescription('');
      setNewIngredientAlternativeNames('');
      setNewIngredientTags('');
      setIngredientDialogOpen(false);
    } catch (error) {
      console.error('Error adding ingredient:', error);
      setError('Failed to add ingredient. Please try again.');
    }
  };  const handleDeleteIngredient = async (ingredientId: string) => {
    const ingredient = ingredients.find(i => i.id === ingredientId);
    if (!ingredient) return;
    
    setDeleteTarget({ type: 'ingredient', id: ingredientId, name: ingredient.name });
    setConfirmDeleteOpen(true);
  };

  const handleShowIngredientDetails = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setIngredientDetailsOpen(true);
    setIsEditingIngredient(false);
  };

  const handleEditIngredient = () => {
    if (!selectedIngredient) return;
    
    setEditIngredientId(selectedIngredient.id);
    setEditIngredientName(selectedIngredient.name);
    setEditIngredientCategory(selectedIngredient.category.id);
    setEditIngredientUnit(selectedIngredient.defaultUnit);
    setEditIngredientDescription(selectedIngredient.description || '');
    setEditIngredientAlternativeNames(selectedIngredient.alternativeNames?.join(', ') || '');
    setEditIngredientTags(selectedIngredient.tags?.join(', ') || '');
    setIsEditingIngredient(true);
  };

  const handleCancelEditIngredient = () => {
    setIsEditingIngredient(false);
    setEditIngredientId('');
    setEditIngredientName('');
    setEditIngredientCategory('');
    setEditIngredientUnit('');
    setEditIngredientDescription('');
    setEditIngredientAlternativeNames('');
    setEditIngredientTags('');
  };

  const handleSaveIngredient = async () => {
    if (!selectedIngredient || !editIngredientName.trim() || !editIngredientCategory || !editIngredientUnit.trim()) return;

    try {
      const alternativeNames = editIngredientAlternativeNames 
        ? editIngredientAlternativeNames.split(',').map(name => name.trim()).filter(name => name)
        : [];
      
      const tags = editIngredientTags 
        ? editIngredientTags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];

      await ingredientsService.updateIngredient({
        id: selectedIngredient.id,
        name: editIngredientName.trim(),
        categoryId: editIngredientCategory,
        defaultUnit: editIngredientUnit.trim(),
        description: editIngredientDescription.trim() || undefined,
        alternativeNames: alternativeNames.length > 0 ? alternativeNames : undefined,
        tags: tags.length > 0 ? tags : undefined
      });
      
      // Refresh local data and pending changes
      const updatedIngredients = await ingredientsService.getIngredients();
      setIngredients(updatedIngredients);
      await refreshPendingChanges();
      
      setIsEditingIngredient(false);
      setIngredientDetailsOpen(false);
      handleCancelEditIngredient();
    } catch (error) {
      console.error('Error updating ingredient:', error);
      setError('Failed to update ingredient. Please try again.');
    }
  };

  // Confirmation handler
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      if (deleteTarget.type === 'category') {
        await ingredientsService.deleteCategory(deleteTarget.id);
        const updatedCategories = await ingredientsService.getCategories();
        const updatedIngredients = await ingredientsService.getIngredients();
        setCategories(updatedCategories);
        setIngredients(updatedIngredients); // Refresh ingredients as they might be affected
        await refreshPendingChanges();
      } else {
        await ingredientsService.deleteIngredient(deleteTarget.id);
        const updatedIngredients = await ingredientsService.getIngredients();
        setIngredients(updatedIngredients);
        await refreshPendingChanges();
      }
      
      setConfirmDeleteOpen(false);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(`Failed to delete ${deleteTarget?.type}`);
      setError(error.message);
    }
  };

  // Save to Google Drive
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      await ingredientsService.saveToGoogleDrive();
      const newSyncTime = await ingredientsService.getLastSyncTime();
      setLastSyncTime(newSyncTime);
      setHasPendingChanges(false);
      setPendingChangesCount(0);
      console.log('Successfully saved to Google Drive');
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to save to Google Drive');
      console.error('Failed to save to Google Drive:', error);
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Ingredients Registry
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Please sign in with Google to access your ingredients registry.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Ingredients Registry
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save to Drive'}
            </Button>
            <IconButton 
              onClick={handleRefresh} 
              disabled={isLoading}
              color="primary"
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Connection Status */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ 
            padding: '12px 16px !important', 
            display: 'flex', 
            alignItems: 'center',
            '&:last-child': {
              paddingBottom: '12px !important'
            }
          }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
              <Box display="flex" alignItems="center" gap={1}>
                <CloudSyncIcon 
                  color={connectionStatus === 'connected' ? 'success' : 'action'} 
                  fontSize="small"
                />
                <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1 }}>
                  Google Drive
                </Typography>
                {connectionStatus === 'connected' && (
                  <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
                )}
                {connectionStatus === 'error' && (
                  <ErrorIcon color="error" sx={{ fontSize: 16 }} />
                )}
                {connectionStatus === 'checking' && (
                  <CircularProgress size={14} />
                )}
                {connectionStatus === 'connected' && (
                  <Typography variant="caption" color="success.main" sx={{ lineHeight: 1 }}>
                    Connected
                  </Typography>
                )}
                {hasPendingChanges && (
                  <Chip 
                    label={`${pendingChangesCount} pending`}
                    size="small"
                    color="warning"
                    sx={{ fontSize: '0.7rem', height: '20px' }}
                  />
                )}
              </Box>
              
              {lastSyncTime && connectionStatus === 'connected' && (
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                  Last synced: {lastSyncTime.toLocaleString()}
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {isLoading && (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress />
          </Box>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Categories ({categories.length})
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setCategoryDialogOpen(true)}
                >
                  Add Category
                </Button>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {categories.map((category) => (
                  <Chip
                    key={category.id}
                    label={`${category.icon || '📁'} ${category.name}`}
                    variant="outlined"
                    onClick={() => handleShowCategoryDetails(category)}
                    onDelete={() => handleDeleteCategory(category.id)}
                    deleteIcon={<DeleteIcon />}
                    sx={{ 
                      borderColor: category.color || 'primary.main',
                      color: category.color || 'primary.main',
                      cursor: 'pointer',
                      minHeight: '40px', // Touch-friendly
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Ingredients List */}
        <Card>
          <CardContent>
            {/* Header with title and add button */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                Ingredients ({filteredAndSortedIngredients.length}{ingredients.length !== filteredAndSortedIngredients.length ? ` of ${ingredients.length}` : ''})
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setIngredientDialogOpen(true)}
              >
                Add Ingredient
              </Button>
            </Box>

            {/* Search and Controls */}
            <Box mb={3}>
              {/* Search Bar */}
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search ingredients by name, category, tags, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchQuery('')}
                        edge="end"
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              {/* Controls Row */}
              <Box display="flex" gap={2} alignItems="center" flexWrap="wrap" justifyContent="space-between">
                <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                  {/* Sort Controls */}
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Sort by</InputLabel>
                    <Select
                      value={sortBy}
                      label="Sort by"
                      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    >
                      <MenuItem value="name">Name</MenuItem>
                      <MenuItem value="category">Category</MenuItem>
                      <MenuItem value="recent">Recently Added</MenuItem>
                      <MenuItem value="updated">Recently Updated</MenuItem>
                    </Select>
                  </FormControl>

                  <ToggleButton
                    value={sortOrder}
                    selected={sortOrder === 'desc'}
                    onChange={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    size="small"
                    title={`Sort ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
                  >
                    <SortIcon sx={{ transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none' }} />
                  </ToggleButton>

                  {/* View Mode Toggle */}
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_, newMode) => newMode && setViewMode(newMode)}
                    size="small"
                  >
                    <ToggleButton value="list" title="List view">
                      <ViewListIcon />
                    </ToggleButton>
                    <ToggleButton value="grouped" title="Group by category">
                      <ViewModuleIcon />
                    </ToggleButton>
                  </ToggleButtonGroup>

                  {/* Filters Button */}
                  <Button
                    variant={showFilters ? "contained" : "outlined"}
                    size="small"
                    startIcon={<FilterListIcon />}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    Filters
                    {selectedCategories.length > 0 && (
                      <Badge badgeContent={selectedCategories.length} color="primary" sx={{ ml: 1 }} />
                    )}
                  </Button>
                </Box>

                {/* Reset All Button - prominently placed */}
                {(searchQuery || selectedCategories.length > 0 || sortBy !== 'name' || sortOrder !== 'asc') && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategories([]);
                      setSortBy('name');
                      setSortOrder('asc');
                      setShowFilters(false);
                    }}
                    color="secondary"
                    sx={{ flexShrink: 0 }}
                  >
                    Reset All
                  </Button>
                )}
              </Box>

              {/* Filters Panel */}
              <Collapse in={showFilters}>
                <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Filter by Categories
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {categories.map((category) => (
                      <Chip
                        key={category.id}
                        label={`${category.icon || '📁'} ${category.name}`}
                        variant={selectedCategories.includes(category.id) ? "filled" : "outlined"}
                        onClick={() => {
                          setSelectedCategories(prev => 
                            prev.includes(category.id)
                              ? prev.filter(id => id !== category.id)
                              : [...prev, category.id]
                          );
                        }}
                        sx={{ 
                          borderColor: category.color || 'primary.main',
                          color: selectedCategories.includes(category.id) 
                            ? 'white' 
                            : (category.color || 'primary.main'),
                          backgroundColor: selectedCategories.includes(category.id) 
                            ? (category.color || 'primary.main') 
                            : 'transparent',
                          '&:hover': {
                            backgroundColor: selectedCategories.includes(category.id)
                              ? (category.color || 'primary.main')
                              : 'rgba(0, 0, 0, 0.04)'
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Paper>
              </Collapse>
            </Box>
            
            {filteredAndSortedIngredients.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {searchQuery || selectedCategories.length > 0 
                    ? "No ingredients match your search criteria."
                    : "No ingredients found in your registry."
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchQuery || selectedCategories.length > 0 
                    ? "Try adjusting your search or filters."
                    : "Your ingredients will appear here once you start adding them."
                  }
                </Typography>
              </Box>
            ) : viewMode === 'grouped' ? (
              /* Grouped View */
              <Box>
                {Object.entries(groupedIngredients).map(([categoryId, ingredientsInCategory]) => {
                  const category = categories.find(c => c.id === categoryId);
                  if (!category) return null;
                  
                  return (
                    <Accordion key={categoryId} defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip 
                            label={`${category.icon || '📁'} ${category.name}`}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              borderColor: category.color || 'primary.main',
                              color: category.color || 'primary.main',
                            }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            ({ingredientsInCategory.length} ingredient{ingredientsInCategory.length !== 1 ? 's' : ''})
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0 }}>
                        <List disablePadding>
                          {ingredientsInCategory.map((ingredient, index) => (
                            <React.Fragment key={ingredient.id}>
                              <ListItem sx={{ px: 0, minHeight: '60px' }}>
                                <ListItemText
                                  primary={
                                    <Box 
                                      display="flex" 
                                      alignItems="center" 
                                      gap={1}
                                      onClick={() => handleShowIngredientDetails(ingredient)}
                                      sx={{ cursor: 'pointer', flexGrow: 1 }}
                                    >
                                      <Typography variant="subtitle1" component="span">
                                        {ingredient.name}
                                      </Typography>
                                      <InfoIcon fontSize="small" color="action" />
                                    </Box>
                                  }
                                  secondary={
                                    <Box onClick={() => handleShowIngredientDetails(ingredient)} sx={{ cursor: 'pointer' }}>
                                      <Typography variant="body2" color="text.secondary" component="div">
                                        Default unit: {ingredient.defaultUnit}
                                      </Typography>
                                      {ingredient.alternativeNames.length > 0 && (
                                        <Typography variant="body2" color="text.secondary" component="div">
                                          Also known as: {ingredient.alternativeNames.join(', ')}
                                        </Typography>
                                      )}
                                      {ingredient.description && (
                                        <Typography variant="body2" color="text.secondary" component="div">
                                          {ingredient.description}
                                        </Typography>
                                      )}
                                    </Box>
                                  }
                                  secondaryTypographyProps={{ component: 'div' }}
                                />
                                <ListItemSecondaryAction>
                                  <IconButton 
                                    edge="end" 
                                    aria-label="delete"
                                    onClick={() => handleDeleteIngredient(ingredient.id)}
                                    color="error"
                                    sx={{ minWidth: '40px', minHeight: '40px' }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </ListItemSecondaryAction>
                              </ListItem>
                              {index < ingredientsInCategory.length - 1 && <Divider />}
                            </React.Fragment>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
            ) : (
              /* List View */
              <List>
                {filteredAndSortedIngredients.map((ingredient, index) => (
                  <React.Fragment key={ingredient.id}>
                    <ListItem sx={{ minHeight: '60px' }}>
                      <ListItemText
                        primary={
                          <Box 
                            display="flex" 
                            alignItems="center" 
                            gap={1}
                            onClick={() => handleShowIngredientDetails(ingredient)}
                            sx={{ cursor: 'pointer', flexGrow: 1 }}
                          >
                            <Typography variant="subtitle1" component="span">
                              {ingredient.name}
                            </Typography>
                            <Chip 
                              label={`${ingredient.category.icon || '📁'} ${ingredient.category.name}`}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                borderColor: ingredient.category.color || 'primary.main',
                                color: ingredient.category.color || 'primary.main',
                                fontSize: '0.75rem'
                              }}
                            />
                            <InfoIcon fontSize="small" color="action" />
                          </Box>
                        }
                        secondary={
                          <Box onClick={() => handleShowIngredientDetails(ingredient)} sx={{ cursor: 'pointer' }}>
                            <Typography variant="body2" color="text.secondary" component="div">
                              Default unit: {ingredient.defaultUnit}
                            </Typography>
                            {ingredient.alternativeNames.length > 0 && (
                              <Typography variant="body2" color="text.secondary" component="div">
                                Also known as: {ingredient.alternativeNames.join(', ')}
                              </Typography>
                            )}
                            {ingredient.description && (
                              <Typography variant="body2" color="text.secondary" component="div">
                                {ingredient.description}
                              </Typography>
                            )}
                          </Box>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={() => handleDeleteIngredient(ingredient.id)}
                          color="error"
                          sx={{ minWidth: '40px', minHeight: '40px' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < filteredAndSortedIngredients.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleConfirmDelete}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Category Details Dialog */}
        <Dialog
          open={categoryDetailsOpen}
          onClose={() => setCategoryDetailsOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedCategory?.icon} {selectedCategory?.name}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                <Typography variant="body1">
                  {selectedCategory?.description || 'No description provided'}
                </Typography>
              </Box>
              {selectedCategory?.color && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Color</Typography>
                  <Box 
                    sx={{ 
                      width: 20, 
                      height: 20, 
                      backgroundColor: selectedCategory.color,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider'
                    }} 
                  />
                </Box>
              )}
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Ingredients in this category</Typography>
                <Typography variant="body2">
                  {ingredients.filter(i => i.category.id === selectedCategory?.id).length} ingredient(s)
                </Typography>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCategoryDetailsOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Ingredient Details Dialog */}
        <Dialog
          open={ingredientDetailsOpen}
          onClose={() => setIngredientDetailsOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {isEditingIngredient ? 'Edit Ingredient' : selectedIngredient?.name}
          </DialogTitle>
          <DialogContent>
            {isEditingIngredient ? (
              <Box sx={{ pt: 1 }}>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      margin="dense"
                      label="Ingredient ID"
                      fullWidth
                      variant="outlined"
                      value={editIngredientId}
                      disabled
                      helperText="ID cannot be changed"
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      autoFocus
                      margin="dense"
                      label="Ingredient Name"
                      fullWidth
                      variant="outlined"
                      required
                      value={editIngredientName}
                      onChange={(e) => setEditIngredientName(e.target.value)}
                      sx={{ flex: 1 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      select
                      margin="dense"
                      label="Category"
                      fullWidth
                      variant="outlined"
                      required
                      value={editIngredientCategory}
                      onChange={(e) => setEditIngredientCategory(e.target.value)}
                      sx={{ flex: 1 }}
                    >
                      <MenuItem value="">Select a category</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      margin="dense"
                      label="Default Unit"
                      fullWidth
                      variant="outlined"
                      required
                      value={editIngredientUnit}
                      onChange={(e) => setEditIngredientUnit(e.target.value)}
                      placeholder="g, ml, piece, cup, spoon, clove..."
                      helperText="e.g., g, ml, piece, cup, tbsp, clove"
                      sx={{ flex: 1 }}
                    />
                  </Box>
                  <TextField
                    margin="dense"
                    label="Description"
                    fullWidth
                    variant="outlined"
                    multiline
                    rows={2}
                    value={editIngredientDescription}
                    onChange={(e) => setEditIngredientDescription(e.target.value)}
                  />
                  <TextField
                    margin="dense"
                    label="Alternative Names"
                    fullWidth
                    variant="outlined"
                    value={editIngredientAlternativeNames}
                    onChange={(e) => setEditIngredientAlternativeNames(e.target.value)}
                    placeholder="Separate with commas"
                    helperText="Separate multiple names with commas"
                  />
                  <TextField
                    margin="dense"
                    label="Tags"
                    fullWidth
                    variant="outlined"
                    value={editIngredientTags}
                    onChange={(e) => setEditIngredientTags(e.target.value)}
                    placeholder="organic, spicy, seasonal..."
                    helperText="Separate tags with commas"
                  />
                </Stack>
              </Box>
            ) : (
              <Stack spacing={2} sx={{ pt: 1 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip 
                      label={`${selectedIngredient?.category.icon || '📁'} ${selectedIngredient?.category.name}`}
                      variant="outlined"
                      sx={{ 
                        borderColor: selectedIngredient?.category.color || 'primary.main',
                        color: selectedIngredient?.category.color || 'primary.main',
                      }}
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Default Unit</Typography>
                  <Typography variant="body1">{selectedIngredient?.defaultUnit}</Typography>
                </Box>
                {selectedIngredient?.description && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                    <Typography variant="body1">{selectedIngredient.description}</Typography>
                  </Box>
                )}
                {selectedIngredient?.alternativeNames && selectedIngredient.alternativeNames.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Alternative Names</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {selectedIngredient.alternativeNames.map((name, index) => (
                        <Chip key={index} label={name} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </Box>
                )}
                {selectedIngredient?.tags && selectedIngredient.tags.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Tags</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {selectedIngredient.tags.map((tag, index) => (
                        <Chip key={index} label={tag} size="small" color="primary" />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            {isEditingIngredient ? (
              <>
                <Button onClick={handleCancelEditIngredient}>Cancel</Button>
                <Button 
                  onClick={handleSaveIngredient}
                  variant="contained"
                  disabled={!editIngredientName.trim() || !editIngredientCategory || !editIngredientUnit.trim()}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setIngredientDetailsOpen(false)}>Close</Button>
                <Button onClick={handleEditIngredient} variant="contained">
                  Edit
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
        <Dialog open={ingredientDialogOpen} onClose={() => setIngredientDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Add New Ingredient</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    margin="dense"
                    label="Ingredient ID (optional)"
                    fullWidth
                    variant="outlined"
                    value={newIngredientId}
                    onChange={(e) => setNewIngredientId(e.target.value)}
                    placeholder="Auto-generated if empty"
                    helperText="Leave empty to auto-generate"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    autoFocus
                    margin="dense"
                    label="Ingredient Name"
                    fullWidth
                    variant="outlined"
                    required
                    value={newIngredientName}
                    onChange={(e) => setNewIngredientName(e.target.value)}
                    sx={{ flex: 1 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    select
                    margin="dense"
                    label="Category"
                    fullWidth
                    variant="outlined"
                    required
                    value={newIngredientCategory}
                    onChange={(e) => setNewIngredientCategory(e.target.value)}
                    sx={{ flex: 1 }}
                  >
                    <MenuItem value="">Select a category</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    margin="dense"
                    label="Default Unit"
                    fullWidth
                    variant="outlined"
                    required
                    value={newIngredientUnit}
                    onChange={(e) => setNewIngredientUnit(e.target.value)}
                    placeholder="g, ml, piece, cup, spoon, clove..."
                    helperText="e.g., g, ml, piece, cup, tbsp, clove"
                    sx={{ flex: 1 }}
                  />
                </Box>
                <TextField
                  margin="dense"
                  label="Description"
                  fullWidth
                  variant="outlined"
                  multiline
                  rows={2}
                  value={newIngredientDescription}
                  onChange={(e) => setNewIngredientDescription(e.target.value)}
                />
                <TextField
                  margin="dense"
                  label="Alternative Names"
                  fullWidth
                  variant="outlined"
                  value={newIngredientAlternativeNames}
                  onChange={(e) => setNewIngredientAlternativeNames(e.target.value)}
                  placeholder="Separate with commas"
                  helperText="Separate multiple names with commas"
                />
                <TextField
                  margin="dense"
                  label="Tags"
                  fullWidth
                  variant="outlined"
                  value={newIngredientTags}
                  onChange={(e) => setNewIngredientTags(e.target.value)}
                  placeholder="organic, spicy, seasonal..."
                  helperText="Separate tags with commas"
                />
              </Stack>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIngredientDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAddIngredient}
              variant="contained"
              disabled={!newIngredientName.trim() || !newIngredientCategory || !newIngredientUnit.trim()}
            >
              Add Ingredient
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Category Dialog */}
        <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <TextField
                margin="dense"
                label="Category ID (optional)"
                fullWidth
                variant="outlined"
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value)}
                placeholder="Auto-generated if empty"
                helperText="Leave empty to auto-generate"
                sx={{ mb: 2 }}
              />
              <TextField
                autoFocus
                margin="dense"
                label="Category Name"
                fullWidth
                variant="outlined"
                required
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Description"
                fullWidth
                variant="outlined"
                multiline
                rows={2}
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Icon (emoji)"
                fullWidth
                variant="outlined"
                value={newCategoryIcon}
                onChange={(e) => setNewCategoryIcon(e.target.value)}
                placeholder="📁"
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Color"
                type="color"
                fullWidth
                variant="outlined"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAddCategory}
              variant="contained"
              disabled={!newCategoryName.trim()}
            >
              Add Category
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default IngredientsPage;