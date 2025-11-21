import { Note, Folder, Tag } from '@/types';

const STORAGE_KEYS = {
  NOTES: 'writewell_notes',
  FOLDERS: 'writewell_folders',
  TAGS: 'writewell_tags',
};

export const storage = {
  // Generic storage methods
  get: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },

  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  },

  // Notes
  getNotes: (): Note[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.NOTES);
    return data ? JSON.parse(data) : [];
  },

  saveNotes: (notes: Note[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  },

  // Folders
  getFolders: (): Folder[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.FOLDERS);
    return data ? JSON.parse(data) : [];
  },

  saveFolders: (folders: Folder[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
  },

  // Tags
  getTags: (): Tag[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.TAGS);
    return data ? JSON.parse(data) : [];
  },

  saveTags: (tags: Tag[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
  },
};

