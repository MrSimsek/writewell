export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  fontSize: number; // in pixels
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

