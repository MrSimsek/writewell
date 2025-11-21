'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Note, Folder, Tag } from '@/types';
import { storage } from '@/lib/storage';

interface NotesContextType {
  notes: Note[];
  folders: Folder[];
  tags: Tag[];
  selectedNoteId: string | null;
  selectedFolderId: string | null;
  createNote: (folderId?: string | null) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  selectNote: (id: string | null) => void;
  createFolder: (name: string, parentId?: string | null) => Folder;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  selectFolder: (id: string | null) => void;
  createTag: (name: string) => Tag;
  deleteTag: (id: string) => void;
  getNotesByFolder: (folderId: string | null) => Note[];
  getNotesByTag: (tagName: string) => Note[];
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadedNotes = storage.getNotes();
      const loadedFolders = storage.getFolders();
      const loadedTags = storage.getTags();
      setNotes(loadedNotes);
      setFolders(loadedFolders);
      setTags(loadedTags);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      storage.saveNotes(notes);
    }
  }, [notes]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      storage.saveFolders(folders);
    }
  }, [folders]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      storage.saveTags(tags);
    }
  }, [tags]);

  const createNote = useCallback((folderId: string | null = null): Note => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '',
      folderId,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fontSize: 16,
    };
    setNotes((prev) => [...prev, newNote]);
    setSelectedNoteId(newNote.id);
    return newNote;
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, ...updates, updatedAt: Date.now() } : note
      )
    );
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
    if (selectedNoteId === id) {
      setSelectedNoteId(null);
    }
  }, [selectedNoteId]);

  const createFolder = useCallback((name: string, parentId: string | null = null): Folder => {
    const newFolder: Folder = {
      id: Date.now().toString(),
      name,
      parentId,
      createdAt: Date.now(),
    };
    setFolders((prev) => [...prev, newFolder]);
    return newFolder;
  }, []);

  const updateFolder = useCallback((id: string, updates: Partial<Folder>) => {
    setFolders((prev) =>
      prev.map((folder) => (folder.id === id ? { ...folder, ...updates } : folder))
    );
  }, []);

  const deleteFolder = useCallback((id: string) => {
    // Move notes to root (null folderId)
    setNotes((prev) =>
      prev.map((note) => (note.folderId === id ? { ...note, folderId: null } : note))
    );
    // Delete folder
    setFolders((prev) => prev.filter((folder) => folder.id !== id));
    if (selectedFolderId === id) {
      setSelectedFolderId(null);
    }
  }, [selectedFolderId]);

  const createTag = useCallback((name: string): Tag => {
    const existingTag = tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existingTag) return existingTag;

    const newTag: Tag = {
      id: Date.now().toString(),
      name,
    };
    setTags((prev) => [...prev, newTag]);
    return newTag;
  }, [tags]);

  const deleteTag = useCallback((id: string) => {
    // Remove tag from all notes
    setNotes((prev) =>
      prev.map((note) => ({
        ...note,
        tags: note.tags.filter((tagName) => {
          const tag = tags.find((t) => t.id === id);
          return tag ? tagName !== tag.name : true;
        }),
      }))
    );
    // Delete tag
    setTags((prev) => prev.filter((tag) => tag.id !== id));
  }, [tags]);

  const getNotesByFolder = useCallback(
    (folderId: string | null) => {
      return notes.filter((note) => note.folderId === folderId);
    },
    [notes]
  );

  const getNotesByTag = useCallback(
    (tagName: string) => {
      return notes.filter((note) => note.tags.includes(tagName));
    },
    [notes]
  );

  return (
    <NotesContext.Provider
      value={{
        notes,
        folders,
        tags,
        selectedNoteId,
        selectedFolderId,
        createNote,
        updateNote,
        deleteNote,
        selectNote: setSelectedNoteId,
        createFolder,
        updateFolder,
        deleteFolder,
        selectFolder: setSelectedFolderId,
        createTag,
        deleteTag,
        getNotesByFolder,
        getNotesByTag,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}

