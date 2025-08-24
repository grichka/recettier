/**
 * Google Drive Service
 * 
 * Handles all Google Drive API operations for the Recettier app.
 * Manages file operations, folder discovery, and data synchronization.
 */

import { googleAuthService } from './googleAuth';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  parents?: string[];
}

export interface AppFolderStructure {
  recettierRoot: DriveFolder;
  ingredients: DriveFolder;
  recipes?: DriveFolder;
  shoppingLists?: DriveFolder;
  media?: DriveFolder;
}

export interface FileContent {
  content: string;
  metadata: DriveFile;
}

export class GoogleDriveService {
  private static instance: GoogleDriveService;
  private appFolders: AppFolderStructure | null = null;
  
  // MIME types
  private static readonly FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
  private static readonly JSON_MIME_TYPE = 'application/json';
  
  // App folder names
  private static readonly ROOT_FOLDER_NAME = 'Recettier';
  private static readonly INGREDIENTS_FOLDER_NAME = 'ingredients';
  private static readonly RECIPES_FOLDER_NAME = 'recipes';
  private static readonly SHOPPING_LISTS_FOLDER_NAME = 'shopping-lists';
  private static readonly MEDIA_FOLDER_NAME = 'media';
  
  // App file names
  public static readonly INGREDIENTS_REGISTRY_FILE = 'ingredients-registry.json';
  public static readonly CATEGORIES_FILE = 'categories.json';

  static getInstance(): GoogleDriveService {
    if (!GoogleDriveService.instance) {
      GoogleDriveService.instance = new GoogleDriveService();
    }
    return GoogleDriveService.instance;
  }

  /**
   * Initialize the service and discover existing folder structure
   */
  async initialize(): Promise<void> {
    await googleAuthService.initialize();
    
    if (!googleAuthService.isSignedIn()) {
      throw new Error('User must be signed in to use Google Drive');
    }

    // Discover existing folder structure
    await this.discoverAppFolders();
  }

  /**
   * Discover existing Recettier folder structure in Google Drive
   * If folders don't exist, create them
   */
  private async discoverAppFolders(): Promise<void> {
    try {
      console.log('Discovering Recettier folder structure...');
      
      // Find or create the root Recettier folder
      let recettierRoot = await this.findFolderByName(GoogleDriveService.ROOT_FOLDER_NAME);
      
      if (!recettierRoot) {
        console.log('Recettier folder not found, creating it...');
        recettierRoot = await this.createFolder(GoogleDriveService.ROOT_FOLDER_NAME);
        console.log('Created Recettier root folder:', recettierRoot.id);
      } else {
        console.log('Found existing Recettier root folder:', recettierRoot.id);
      }

      // Find or create ingredients folder
      let ingredients = await this.findFolderByName(
        GoogleDriveService.INGREDIENTS_FOLDER_NAME, 
        recettierRoot.id
      );
      
      if (!ingredients) {
        console.log('Ingredients folder not found, creating it...');
        ingredients = await this.createFolder(
          GoogleDriveService.INGREDIENTS_FOLDER_NAME, 
          recettierRoot.id
        );
        console.log('Created ingredients folder:', ingredients.id);
      } else {
        console.log('Found existing ingredients folder:', ingredients.id);
      }

      // Optionally find or create other folders
      let recipes = await this.findFolderByName(GoogleDriveService.RECIPES_FOLDER_NAME, recettierRoot.id);
      if (!recipes) {
        console.log('Creating recipes folder...');
        recipes = await this.createFolder(GoogleDriveService.RECIPES_FOLDER_NAME, recettierRoot.id);
      }

      let shoppingLists = await this.findFolderByName(GoogleDriveService.SHOPPING_LISTS_FOLDER_NAME, recettierRoot.id);
      if (!shoppingLists) {
        console.log('Creating shopping-lists folder...');
        shoppingLists = await this.createFolder(GoogleDriveService.SHOPPING_LISTS_FOLDER_NAME, recettierRoot.id);
      }

      let media = await this.findFolderByName(GoogleDriveService.MEDIA_FOLDER_NAME, recettierRoot.id);
      if (!media) {
        console.log('Creating media folder...');
        media = await this.createFolder(GoogleDriveService.MEDIA_FOLDER_NAME, recettierRoot.id);
      }

      this.appFolders = {
        recettierRoot,
        ingredients,
        recipes,
        shoppingLists,
        media
      };

      console.log('App folder structure ready:', this.appFolders);
    } catch (error) {
      console.error('Failed to discover/create app folders:', error);
      throw error;
    }
  }

  /**
   * Find a folder by name, optionally within a parent folder
   */
  private async findFolderByName(name: string, parentId?: string): Promise<DriveFolder | null> {
    try {
      let query = `name='${name}' and mimeType='${GoogleDriveService.FOLDER_MIME_TYPE}' and trashed=false`;
      
      if (parentId) {
        query += ` and '${parentId}' in parents`;
      }

      const response = await window.gapi.client.drive.files.list({
        q: query,
        fields: 'files(id, name, parents)',
        spaces: 'drive'
      });

      const files = response.result.files;
      
      if (files && files.length > 0) {
        const folder = files[0];
        return {
          id: folder.id!,
          name: folder.name!,
          parents: folder.parents
        };
      }

      return null;
    } catch (error) {
      console.error(`Error finding folder ${name}:`, error);
      throw new Error(`Failed to find folder: ${name}`);
    }
  }

  /**
   * Search for folders with similar names (case-insensitive)
   */
  async searchSimilarFolders(name: string, parentId?: string): Promise<DriveFolder[]> {
    try {
      let query = `mimeType='${GoogleDriveService.FOLDER_MIME_TYPE}' and trashed=false`;
      
      if (parentId) {
        query += ` and '${parentId}' in parents`;
      }

      const response = await window.gapi.client.drive.files.list({
        q: query,
        fields: 'files(id, name, parents)',
        spaces: 'drive'
      });

      const files = response.result.files || [];
      
      // Filter folders that contain the search term (case-insensitive)
      const similarFolders = files
        .filter((file: { name?: string; id?: string; parents?: string[] }) => 
          file.name && file.name.toLowerCase().includes(name.toLowerCase())
        )
        .map((file: { name?: string; id?: string; parents?: string[] }) => ({
          id: file.id!,
          name: file.name!,
          parents: file.parents
        }));

      return similarFolders;
    } catch (error) {
      console.error(`Error searching for similar folders to ${name}:`, error);
      return [];
    }
  }

  /**
   * Find a file by name within a specific folder
   */
  async findFileByName(fileName: string, parentFolderId: string): Promise<DriveFile | null> {
    try {
      const query = `name='${fileName}' and '${parentFolderId}' in parents and trashed=false`;

      const response = await window.gapi.client.drive.files.list({
        q: query,
        fields: 'files(id, name, mimeType, parents, createdTime, modifiedTime, size)',
        spaces: 'drive'
      });

      const files = response.result.files;
      
      if (files && files.length > 0) {
        const file = files[0];
        return {
          id: file.id!,
          name: file.name!,
          mimeType: file.mimeType!,
          parents: file.parents,
          createdTime: file.createdTime,
          modifiedTime: file.modifiedTime,
          size: file.size
        };
      }

      return null;
    } catch (error) {
      console.error(`Error finding file ${fileName}:`, error);
      throw new Error(`Failed to find file: ${fileName}`);
    }
  }

  /**
   * Create a new folder
   */
  async createFolder(name: string, parentId?: string): Promise<DriveFolder> {
    try {
      const metadata: { name: string; mimeType: string; parents?: string[] } = {
        name: name,
        mimeType: GoogleDriveService.FOLDER_MIME_TYPE
      };

      if (parentId) {
        metadata.parents = [parentId];
      }

      const response = await window.gapi.client.drive.files.create({
        resource: metadata,
        fields: 'id, name, parents'
      });

      const folder = response.result;
      return {
        id: folder.id!,
        name: folder.name!,
        parents: folder.parents
      };
    } catch (error) {
      console.error(`Error creating folder ${name}:`, error);
      throw new Error(`Failed to create folder: ${name}`);
    }
  }

  /**
   * Read file content as text
   */
  async readFileContent(fileId: string): Promise<string> {
    try {
      const response = await window.gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
      });

      return response.body || '';
    } catch (error) {
      console.error(`Error reading file content:`, error);
      throw new Error(`Failed to read file content`);
    }
  }

  /**
   * Read file with metadata
   */
  async readFile(fileId: string): Promise<FileContent> {
    try {
      // Get file metadata
      const metadataResponse = await window.gapi.client.drive.files.get({
        fileId: fileId,
        fields: 'id, name, mimeType, parents, createdTime, modifiedTime, size'
      });

      // Get file content
      const contentResponse = await window.gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
      });

      const metadata = metadataResponse.result;
      return {
        content: contentResponse.body || '',
        metadata: {
          id: metadata.id!,
          name: metadata.name!,
          mimeType: metadata.mimeType!,
          parents: metadata.parents,
          createdTime: metadata.createdTime,
          modifiedTime: metadata.modifiedTime,
          size: metadata.size
        }
      };
    } catch (error) {
      console.error(`Error reading file:`, error);
      throw new Error(`Failed to read file`);
    }
  }

  /**
   * Create a new file with content
   */
  async createFile(name: string, content: string, parentFolderId: string, mimeType: string = GoogleDriveService.JSON_MIME_TYPE): Promise<DriveFile> {
    try {
      const metadata = {
        name: name,
        parents: [parentFolderId],
        mimeType: mimeType
      };

      // Create a FormData object for multipart upload
      const delimiter = '-------314159265358979323846';
      const close_delim = `\r\n--${delimiter}--`;

      let body = `--${delimiter}\r\n`;
      body += 'Content-Type: application/json\r\n\r\n';
      body += JSON.stringify(metadata) + '\r\n';
      body += `--${delimiter}\r\n`;
      body += `Content-Type: ${mimeType}\r\n\r\n`;
      body += content;
      body += close_delim;

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleAuthService.getAccessToken()}`,
          'Content-Type': `multipart/related; boundary="${delimiter}"`
        },
        body: body
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        id: result.id,
        name: result.name,
        mimeType: result.mimeType,
        parents: result.parents
      };
    } catch (error) {
      console.error(`Error creating file ${name}:`, error);
      throw new Error(`Failed to create file: ${name}`);
    }
  }

  /**
   * Update file content
   */
  async updateFileContent(fileId: string, content: string, mimeType: string = GoogleDriveService.JSON_MIME_TYPE): Promise<DriveFile> {
    try {
      const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${googleAuthService.getAccessToken()}`,
          'Content-Type': mimeType
        },
        body: content
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        id: result.id,
        name: result.name,
        mimeType: result.mimeType,
        parents: result.parents
      };
    } catch (error) {
      console.error(`Error updating file:`, error);
      throw new Error(`Failed to update file`);
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      await window.gapi.client.drive.files.delete({
        fileId: fileId
      });
    } catch (error) {
      console.error(`Error deleting file:`, error);
      throw new Error(`Failed to delete file`);
    }
  }

  /**
   * List files in a folder
   */
  async listFiles(folderId: string, mimeType?: string): Promise<DriveFile[]> {
    try {
      let query = `'${folderId}' in parents and trashed=false`;
      
      if (mimeType) {
        query += ` and mimeType='${mimeType}'`;
      }

      const response = await window.gapi.client.drive.files.list({
        q: query,
        fields: 'files(id, name, mimeType, parents, createdTime, modifiedTime, size)',
        orderBy: 'modifiedTime desc',
        spaces: 'drive'
      });

      return (response.result.files || []).map((file: { 
        id?: string; 
        name?: string; 
        mimeType?: string; 
        parents?: string[];
        createdTime?: string;
        modifiedTime?: string;
        size?: string;
      }) => ({
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
        parents: file.parents,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        size: file.size
      }));
    } catch (error) {
      console.error(`Error listing files in folder:`, error);
      throw new Error(`Failed to list files`);
    }
  }

  /**
   * Get the ingredients folder ID
   */
  getIngredientsFolderId(): string {
    if (!this.appFolders?.ingredients) {
      throw new Error('Ingredients folder not found. Please run initialize() first.');
    }
    return this.appFolders.ingredients.id;
  }

  /**
   * Get the app folder structure
   */
  getAppFolders(): AppFolderStructure | null {
    return this.appFolders;
  }

  /**
   * Check if service is ready to use
   */
  isReady(): boolean {
    return !!this.appFolders && googleAuthService.isSignedIn();
  }

  /**
   * Get diagnostic information about the Google Drive connection
   */
  async getDiagnosticInfo(): Promise<{
    isSignedIn: boolean;
    hasValidToken: boolean;
    foldersFound: boolean;
    folderStructure: AppFolderStructure | null;
    similarFolders?: DriveFolder[];
    error?: string;
  }> {
    try {
      const isSignedIn = googleAuthService.isSignedIn();
      const hasValidToken = await googleAuthService.ensureValidToken();
      
      let similarFolders: DriveFolder[] = [];
      
      if (isSignedIn && hasValidToken && !this.appFolders) {
        // Search for folders that might be the Recettier folder
        similarFolders = await this.searchSimilarFolders('recettier');
      }

      return {
        isSignedIn,
        hasValidToken,
        foldersFound: !!this.appFolders,
        folderStructure: this.appFolders,
        similarFolders: similarFolders.length > 0 ? similarFolders : undefined
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        isSignedIn: googleAuthService.isSignedIn(),
        hasValidToken: false,
        foldersFound: false,
        folderStructure: null,
        error: errorMessage
      };
    }
  }
}

export const googleDriveService = GoogleDriveService.getInstance();