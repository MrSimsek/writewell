'use client';

import { useState, useRef, useEffect } from 'react';
import { useNotes } from '@/contexts/NotesContext';
import { useTheme } from '@/contexts/ThemeContext';

interface SidebarProps {
  isCollapsed: boolean;
  isMobile?: boolean;
  isOpen?: boolean;
  onToggle: () => void;
  onClose?: () => void;
}

export default function Sidebar({ isCollapsed, isMobile = false, isOpen = false, onToggle, onClose }: SidebarProps) {
  const {
    notes,
    folders,
    selectedNoteId,
    selectedFolderId,
    createNote,
    deleteNote,
    selectNote,
    selectFolder,
    createFolder,
    updateFolder,
    deleteFolder,
    getNotesByFolder,
  } = useNotes();
  const { theme, toggleTheme } = useTheme();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showDropdown, setShowDropdown] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const rootNotes = getNotesByFolder(null);
  const rootFolders = folders.filter((f) => f.parentId === null);

  const handleCreateNote = () => {
    createNote(selectedFolderId);
  };

  const handleNewNote = () => {
    handleCreateNote();
    setShowDropdown(false);
  };

  const handleNewFolderClick = () => {
    // Create folder immediately with default name
    const newFolder = createFolder('New Folder', selectedFolderId);
    setEditingFolderId(newFolder.id);
    setEditingFolderName('New Folder');
    setShowDropdown(false);
    // Select and expand the new folder
    selectFolder(newFolder.id);
    setExpandedFolders((prev) => new Set(prev).add(newFolder.id));
    // Focus input after a brief delay to ensure it's rendered
    setTimeout(() => {
      folderInputRef.current?.focus();
      folderInputRef.current?.select();
    }, 0);
  };

  const handleFolderNameSubmit = (folderId: string) => {
    if (editingFolderName.trim()) {
      updateFolder(folderId, { name: editingFolderName.trim() });
    } else {
      // If empty, delete the folder
      deleteFolder(folderId);
    }
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  const handleFolderNameCancel = (folderId: string) => {
    // If still "New Folder", delete it
    const folder = folders.find((f) => f.id === folderId);
    if (folder?.name === 'New Folder') {
      deleteFolder(folderId);
    }
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getNotePreview = (content: string) => {
    const text = content.replace(/\n/g, ' ').trim();
    return text.length > 50 ? text.substring(0, 50) + '...' : text || 'No content';
  };

  // Close sidebar when note is selected on mobile
  useEffect(() => {
    if (isMobile && selectedNoteId && onClose) {
      onClose();
    }
  }, [selectedNoteId, isMobile, onClose]);

  return (
    <>
      {/* Collapsed Sidebar - Just toggle button (desktop only) */}
      {!isMobile && isCollapsed && (
        <div className={`flex h-screen w-12 flex-col items-center border-r ${theme === 'dark' ? 'border-zinc-700 bg-zinc-900' : 'border-zinc-200 bg-zinc-50'}`} style={{ fontFamily: 'var(--font-serif)' }}>
          <button
            onClick={onToggle}
            className={`mt-4 rounded p-2 ${theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100' : 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'}`}
            title="Show sidebar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Expanded Sidebar */}
      {(!isCollapsed || isMobile) && (
        <div
          className={`flex h-screen flex-col border-r ${theme === 'dark' ? 'border-zinc-700 bg-zinc-900 text-zinc-100' : 'border-zinc-200 bg-zinc-50 text-zinc-900'} transition-all duration-300 ${
            isMobile
              ? `fixed left-0 top-0 z-50 w-80 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
              : 'w-64'
          }`}
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {/* Header */}
          <div className={`flex items-center justify-between border-b ${theme === 'dark' ? 'border-zinc-700' : 'border-zinc-200'} p-3 md:p-4`}>
            <h1 className="text-base md:text-lg font-semibold">Notes</h1>
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`rounded p-2 md:p-1.5 ${theme === 'dark' ? 'text-zinc-400 active:bg-zinc-700 hover:bg-zinc-700 hover:text-zinc-100' : 'text-zinc-600 active:bg-zinc-200 hover:bg-zinc-200 hover:text-zinc-900'} transition-colors touch-manipulation`}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              {/* Plus Button with Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`rounded p-2 md:p-1.5 ${theme === 'dark' ? 'text-zinc-400 active:bg-zinc-700 hover:bg-zinc-700 hover:text-zinc-100' : 'text-zinc-600 active:bg-zinc-200 hover:bg-zinc-200 hover:text-zinc-900'} transition-colors touch-manipulation`}
                  title="New"
                >
                  <svg className="h-5 w-5 md:h-5 md:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className={`absolute right-0 top-full mt-1 w-44 md:w-40 rounded-md border ${theme === 'dark' ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-200 bg-white'} shadow-lg z-50`}>
                    <button
                      onClick={handleNewNote}
                      className={`flex w-full items-center gap-2 px-4 md:px-3 py-3 md:py-2 text-left text-sm ${theme === 'dark' ? 'text-zinc-300 active:bg-zinc-700 hover:bg-zinc-700' : 'text-zinc-700 active:bg-zinc-100 hover:bg-zinc-100'} transition-colors first:rounded-t-md touch-manipulation`}
                    >
                      <svg className="h-5 w-5 md:h-4 md:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>New Note</span>
                    </button>
                    <button
                      onClick={handleNewFolderClick}
                      className={`flex w-full items-center gap-2 px-4 md:px-3 py-3 md:py-2 text-left text-sm ${theme === 'dark' ? 'text-zinc-300 active:bg-zinc-700 hover:bg-zinc-700' : 'text-zinc-700 active:bg-zinc-100 hover:bg-zinc-100'} transition-colors last:rounded-b-md touch-manipulation`}
                    >
                      <svg className="h-5 w-5 md:h-4 md:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <span>New Folder</span>
                    </button>
                  </div>
                )}
              </div>
              
              {(isMobile || !isCollapsed) && (
                <button
                  onClick={onToggle}
                  className={`rounded p-1.5 ${theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100' : 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'} transition-colors`}
                  title={isMobile ? 'Close sidebar' : 'Hide sidebar'}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMobile ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    )}
                  </svg>
                </button>
              )}
            </div>
          </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {/* Folders Section */}
        <div className={`border-b ${theme === 'dark' ? 'border-zinc-700' : 'border-zinc-200'} pb-2`}>
          <div className="px-3 md:px-4 pt-2 md:pt-3 pb-2">
            <h2 className={`text-[10px] md:text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Folders</h2>
          </div>
          {rootFolders.length > 0 ? (
            <div className="px-1 md:px-2">
              {rootFolders.map((folder) => {
                const folderNotes = getNotesByFolder(folder.id);
                const isExpanded = expandedFolders.has(folder.id);
                const isSelected = selectedFolderId === folder.id;
                const isEditing = editingFolderId === folder.id;

                return (
                  <div key={folder.id}>
                    <div className="group flex items-center gap-1 px-2">
                      <button
                        onClick={() => toggleFolder(folder.id)}
                        className={`p-1 ${theme === 'dark' ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'}`}
                        disabled={isEditing}
                      >
                        <svg
                          className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      {isEditing ? (
                        <input
                          ref={folderInputRef}
                          type="text"
                          value={editingFolderName}
                          onChange={(e) => setEditingFolderName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleFolderNameSubmit(folder.id);
                            } else if (e.key === 'Escape') {
                              handleFolderNameCancel(folder.id);
                            }
                          }}
                          onBlur={() => handleFolderNameSubmit(folder.id)}
                          className={`flex-1 rounded ${theme === 'dark' ? 'bg-zinc-700 text-zinc-100 focus:ring-zinc-600' : 'bg-zinc-200 text-zinc-900 focus:ring-zinc-400'} px-2 py-1.5 text-sm focus:outline-none focus:ring-1`}
                          autoFocus
                        />
                      ) : (
                        <>
                          <button
                            onClick={() => selectFolder(folder.id)}
                            className={`flex-1 rounded px-2 md:px-2 py-1.5 md:py-1.5 text-left text-xs md:text-sm font-medium transition-colors touch-manipulation ${
                              isSelected
                                ? theme === 'dark' ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-200 text-zinc-900'
                                : theme === 'dark' ? 'text-zinc-400 active:bg-zinc-800 hover:bg-zinc-800 hover:text-zinc-100' : 'text-zinc-600 active:bg-zinc-100 hover:bg-zinc-100 hover:text-zinc-900'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 md:gap-2">
                              <svg className="h-3.5 w-3.5 md:h-4 md:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                />
                              </svg>
                              <span className="flex-1 truncate">{folder.name}</span>
                              <span className={`text-[10px] md:text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{folderNotes.length}</span>
                            </div>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this folder? Notes will be moved to root.')) {
                                deleteFolder(folder.id);
                              }
                            }}
                            className={`p-1 ${theme === 'dark' ? 'text-zinc-600 hover:text-zinc-400' : 'text-zinc-400 hover:text-zinc-600'} opacity-0 group-hover:opacity-100 transition-opacity`}
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`px-4 py-2 text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>No folders</div>
          )}
        </div>

        {/* Notes Section */}
        <div className="flex-1 pt-2">
          <div className="px-3 md:px-4 pt-2 md:pt-3 pb-2">
            <h2 className={`text-[10px] md:text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {selectedFolderId ? 'Notes in Folder' : 'All Notes'}
            </h2>
          </div>
          {(() => {
            const notesToShow = selectedFolderId
              ? getNotesByFolder(selectedFolderId)
              : rootNotes;
            
            return notesToShow.length > 0 ? (
              <div className="px-1 md:px-2">
                {notesToShow.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => selectNote(note.id)}
                    className={`mb-1 w-full rounded px-2 md:px-3 py-2 md:py-2.5 text-left transition-colors touch-manipulation ${
                      selectedNoteId === note.id
                        ? theme === 'dark' ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-200 text-zinc-900'
                        : theme === 'dark' ? 'text-zinc-400 active:bg-zinc-800 hover:bg-zinc-800 hover:text-zinc-100' : 'text-zinc-600 active:bg-zinc-100 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    <div className="text-xs md:text-sm font-medium">{note.title}</div>
                    <div className={`mt-0.5 text-[10px] md:text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{getNotePreview(note.content)}</div>
                    <div className={`mt-1 text-[10px] md:text-xs ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-500'}`}>{formatDate(note.updatedAt)}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className={`px-3 md:px-4 py-2 text-[10px] md:text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {selectedFolderId ? 'No notes in this folder' : 'No notes'}
              </div>
            );
          })()}
        </div>
        </div>
      </div>
      )}
    </>
  );
}

