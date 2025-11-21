"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useNotes } from "@/contexts/NotesContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useDialog } from "@/contexts/DialogContext";

interface EditorProps {
  isSidebarCollapsed: boolean;
  isMobile?: boolean;
  onMenuClick?: () => void;
}

const DEBOUNCE_DELAY = 300;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 48;
const DEFAULT_FONT_SIZE = 16;

export default function Editor({
  isSidebarCollapsed,
  isMobile = false,
  onMenuClick,
}: EditorProps) {
  const { notes, selectedNoteId, updateNote, deleteNote, tags, createTag } =
    useNotes();
  const { theme } = useTheme();
  const { showDialog } = useDialog();
  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  // Local state
  const [title, setTitle] = useState("");
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showBubbleMenu, setShowBubbleMenu] = useState(false);
  const [bubbleMenuPosition, setBubbleMenuPosition] = useState({ top: 0, left: 0 });
  const bubbleMenuRef = useRef<HTMLDivElement>(null);

  // Refs
  const titleInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializingRef = useRef(false);
  const headingMenuRef = useRef<HTMLDivElement>(null);

  // TipTap editor configuration
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
    ],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: `prose focus:outline-none max-w-none min-h-[400px] ${theme === 'dark' ? 'prose-invert text-zinc-100' : 'text-zinc-900'}`,
        style: `font-size: ${fontSize}px; line-height: 1.6; font-family: var(--font-serif);`,
      },
    },
    onUpdate: ({ editor }) => {
      if (!isInitializingRef.current && selectedNoteId) {
        debouncedSave(selectedNoteId, {
          title,
          content: editor.getHTML(),
        });
      }
    },
  });

  // Debounced save function
  const debouncedSave = useCallback(
    (noteId: string, updates: { title: string; content: string }) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        updateNote(noteId, updates);
      }, DEBOUNCE_DELAY);
    },
    [updateNote]
  );

  // Initialize editor when note changes
  useEffect(() => {
    if (!editor) return;

    if (selectedNote) {
      isInitializingRef.current = true;

      // Update local state
      setTitle(selectedNote.title);
      setFontSize(selectedNote.fontSize);
      setNoteTags(selectedNote.tags);

      // Update editor content only if different
      const currentContent = editor.getHTML();
      if (currentContent !== selectedNote.content) {
        editor.commands.setContent(selectedNote.content || "");
      }

      // Update font size
      editor.view.dom.style.fontSize = `${selectedNote.fontSize}px`;

      // Reset flag after a brief delay
      setTimeout(() => {
        isInitializingRef.current = false;
      }, 100);
    } else {
      // Clear editor when no note is selected
      setTitle("");
      setFontSize(DEFAULT_FONT_SIZE);
      setNoteTags([]);
      editor.commands.setContent("");
    }
  }, [editor, selectedNoteId, selectedNote?.id, selectedNote?.updatedAt]);

  // Update font size in editor
  useEffect(() => {
    if (editor) {
      editor.view.dom.style.fontSize = `${fontSize}px`;
    }
  }, [editor, fontSize]);

  // Update editor theme class
  useEffect(() => {
    if (editor) {
      const editorElement = editor.view.dom;
      editorElement.classList.remove('prose-invert');
      if (theme === 'dark') {
        editorElement.classList.add('prose-invert');
      }
    }
  }, [editor, theme]);

  // Auto-save title changes
  useEffect(() => {
    if (!selectedNoteId || !selectedNote || isInitializingRef.current) return;

    if (editor) {
      debouncedSave(selectedNoteId, {
        title,
        content: editor.getHTML(),
      });
    }
  }, [title, selectedNoteId, editor, debouncedSave, selectedNote]);

  // Auto-save font size changes
  useEffect(() => {
    if (!selectedNoteId || !selectedNote || isInitializingRef.current) return;

    updateNote(selectedNoteId, { fontSize });
  }, [fontSize, selectedNoteId, updateNote, selectedNote]);

  // Auto-save tags
  useEffect(() => {
    if (!selectedNoteId || !selectedNote || isInitializingRef.current) return;

    updateNote(selectedNoteId, { tags: noteTags });
  }, [noteTags, selectedNoteId, updateNote, selectedNote]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Handlers
  const handleAddTag = useCallback(() => {
    if (newTagName.trim()) {
      const tag = createTag(newTagName.trim());
      if (!noteTags.includes(tag.name)) {
        setNoteTags((prev) => [...prev, tag.name]);
      }
      setNewTagName("");
      setShowTagInput(false);
    }
  }, [newTagName, noteTags, createTag]);

  const handleRemoveTag = useCallback((tagName: string) => {
    setNoteTags((prev) => prev.filter((t) => t !== tagName));
  }, []);

  const handleFontSizeChange = useCallback((delta: number) => {
    setFontSize((prev) =>
      Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, prev + delta))
    );
  }, []);

  const handleDeleteNote = useCallback(() => {
    if (selectedNote) {
      showDialog({
        title: "Delete Note",
        message: "Delete this note?",
        confirmText: "Delete",
        cancelText: "Cancel",
        variant: "danger",
        onConfirm: () => deleteNote(selectedNote.id),
      });
    }
  }, [selectedNote, deleteNote, showDialog]);

  // Close heading menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showHeadingMenu && headingMenuRef.current && !headingMenuRef.current.contains(event.target as Node)) {
        setShowHeadingMenu(false);
      }
    };

    if (showHeadingMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHeadingMenu]);

  // Track text selection for bubble menu
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection;
      const hasSelection = from !== to;

      if (hasSelection) {
        try {
          // Get the selection coordinates (these are viewport-relative)
          const { view } = editor;
          const { state } = view;
          const { selection } = state;
          
          const start = view.coordsAtPos(selection.$from.pos);
          const end = view.coordsAtPos(selection.$to.pos);

          // Position the bubble menu above the selection
          // coordsAtPos returns viewport coordinates, so we use fixed positioning
          const top = Math.min(start.top, end.top);
          const left = (start.left + end.left) / 2;

          setBubbleMenuPosition({ top, left });
          setShowBubbleMenu(true);
        } catch (error) {
          // If there's an error getting coordinates, hide the menu
          setShowBubbleMenu(false);
        }
      } else {
        setShowBubbleMenu(false);
      }
    };

    // Listen to selection changes
    const updateSelection = () => {
      setTimeout(handleSelectionUpdate, 0);
    };

    // Use DOM events for better compatibility
    const editorElement = editor.view.dom;
    editorElement.addEventListener('mouseup', updateSelection);
    editorElement.addEventListener('keyup', updateSelection);
    editor.on('selectionUpdate', handleSelectionUpdate);
    editor.on('transaction', handleSelectionUpdate);

    return () => {
      editorElement.removeEventListener('mouseup', updateSelection);
      editorElement.removeEventListener('keyup', updateSelection);
      editor.off('selectionUpdate', handleSelectionUpdate);
      editor.off('transaction', handleSelectionUpdate);
    };
  }, [editor]);

  // Close bubble menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showBubbleMenu && bubbleMenuRef.current && !bubbleMenuRef.current.contains(event.target as Node)) {
        // Check if click is in the editor
        const editorElement = editor?.view.dom;
        if (editorElement && !editorElement.contains(event.target as Node)) {
          setShowBubbleMenu(false);
        }
      }
    };

    if (showBubbleMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBubbleMenu, editor]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowToolbar((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Empty state
  if (!selectedNote) {
    return (
      <div className={`flex h-screen flex-1 items-center justify-center ${theme === 'dark' ? 'bg-zinc-900 text-zinc-400' : 'bg-zinc-50 text-zinc-600'}`}>
        <div className="text-center px-4">
          {isMobile && onMenuClick && (
            <button
              onClick={onMenuClick}
              className={`absolute left-4 top-4 rounded p-2 ${theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100' : 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'}`}
              title="Menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}
          <svg
            className={`mx-auto h-12 md:h-16 w-12 md:w-16 ${theme === 'dark' ? 'text-zinc-700' : 'text-zinc-300'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="mt-4 text-base md:text-lg">
            Select a note to start writing
          </p>
          <p className={`mt-2 text-xs md:text-sm ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
            or create a new note
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={editorRef}
      className={`flex h-screen flex-1 flex-col ${theme === 'dark' ? 'bg-zinc-900' : 'bg-zinc-50'}`}
      style={{ fontFamily: "var(--font-serif)" }}
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
    >
      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto px-8 md:px-16 lg:px-24 xl:px-32 py-4 md:py-6 lg:py-8">
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className={`mb-3 md:mb-4 w-full bg-transparent text-2xl md:text-3xl font-semibold ${theme === 'dark' ? 'text-zinc-100 placeholder-zinc-600' : 'text-zinc-900 placeholder-zinc-400'} focus:outline-none`}
            style={{
              fontSize: `${Math.min(fontSize * 1.5, isMobile ? 28 : 48)}px`,
              fontFamily: "var(--font-serif)",
            }}
          />
          
          {/* Custom Bubble Menu - Shows when text is selected */}
          {editor && showBubbleMenu && (
            <div
              ref={bubbleMenuRef}
              className={`fixed flex items-center gap-1 p-1.5 rounded-lg border shadow-lg z-50 ${theme === 'dark' ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-200 bg-white'}`}
              style={{
                top: `${bubbleMenuPosition.top - 50}px`,
                left: `${bubbleMenuPosition.left}px`,
                transform: 'translateX(-50%)',
              }}
            >
              {/* Bold */}
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`rounded p-2 transition-colors touch-manipulation ${
                  editor.isActive('bold')
                    ? theme === 'dark' ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-300 text-zinc-900'
                    : theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100' : 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                }`}
                title="Bold"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
                </svg>
              </button>

              {/* Italic */}
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`rounded p-2 transition-colors touch-manipulation ${
                  editor.isActive('italic')
                    ? theme === 'dark' ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-300 text-zinc-900'
                    : theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100' : 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                }`}
                title="Italic"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </button>

              {/* Strikethrough */}
              <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`rounded p-2 transition-colors touch-manipulation ${
                  editor.isActive('strike')
                    ? theme === 'dark' ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-300 text-zinc-900'
                    : theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100' : 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                }`}
                title="Strikethrough"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                </svg>
              </button>

              {/* Code */}
              <button
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={`rounded p-2 transition-colors touch-manipulation ${
                  editor.isActive('code')
                    ? theme === 'dark' ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-300 text-zinc-900'
                    : theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100' : 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                }`}
                title="Code"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </button>

              {/* Divider */}
              <div className={`w-px h-6 ${theme === 'dark' ? 'bg-zinc-700' : 'bg-zinc-300'}`} />

              {/* Heading */}
              <div className="relative" ref={headingMenuRef}>
                <button
                  onClick={() => setShowHeadingMenu(!showHeadingMenu)}
                  className={`rounded p-2 transition-colors touch-manipulation ${
                    editor.isActive('heading')
                      ? theme === 'dark' ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-300 text-zinc-900'
                      : theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100' : 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                  }`}
                  title="Heading"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </button>
                {showHeadingMenu && (
                  <div className={`absolute left-0 top-full mt-1 w-32 rounded-md border ${theme === 'dark' ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-200 bg-white'} shadow-lg z-50`}>
                    <button
                      onClick={() => {
                        editor.chain().focus().toggleHeading({ level: 1 }).run();
                        setShowHeadingMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm ${theme === 'dark' ? 'text-zinc-300 hover:bg-zinc-700' : 'text-zinc-700 hover:bg-zinc-100'} first:rounded-t-md`}
                    >
                      Heading 1
                    </button>
                    <button
                      onClick={() => {
                        editor.chain().focus().toggleHeading({ level: 2 }).run();
                        setShowHeadingMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm ${theme === 'dark' ? 'text-zinc-300 hover:bg-zinc-700' : 'text-zinc-700 hover:bg-zinc-100'}`}
                    >
                      Heading 2
                    </button>
                    <button
                      onClick={() => {
                        editor.chain().focus().toggleHeading({ level: 3 }).run();
                        setShowHeadingMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm ${theme === 'dark' ? 'text-zinc-300 hover:bg-zinc-700' : 'text-zinc-700 hover:bg-zinc-100'} last:rounded-b-md`}
                    >
                      Heading 3
                    </button>
                  </div>
                )}
              </div>

              {/* Bullet List */}
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`rounded p-2 transition-colors touch-manipulation ${
                  editor.isActive('bulletList')
                    ? theme === 'dark' ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-300 text-zinc-900'
                    : theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100' : 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                }`}
                title="Bullet List"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                </svg>
              </button>

              {/* Numbered List */}
              <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`rounded p-2 transition-colors touch-manipulation ${
                  editor.isActive('orderedList')
                    ? theme === 'dark' ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-300 text-zinc-900'
                    : theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100' : 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                }`}
                title="Numbered List"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </button>

              {/* Blockquote */}
              <button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`rounded p-2 transition-colors touch-manipulation ${
                  editor.isActive('blockquote')
                    ? theme === 'dark' ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-300 text-zinc-900'
                    : theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100' : 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                }`}
                title="Blockquote"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </button>
            </div>
          )}

          {editor && <EditorContent editor={editor} />}
        </div>
      </div>

      {/* Toolbar - Moved to bottom */}
      <div
        className={`flex items-center justify-between border-t ${theme === 'dark' ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-200 bg-zinc-100'} px-4 py-2 transition-all duration-200 ${
          showToolbar
            ? "opacity-100 max-h-16"
            : "opacity-0 max-h-0 overflow-hidden"
        }`}
      >
        <div className="flex items-center gap-4">
          {/* Font Size Controls */}
          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={() => handleFontSizeChange(-2)}
              className={`rounded p-2 md:p-1.5 ${theme === 'dark' ? 'text-zinc-400 active:bg-zinc-700 hover:bg-zinc-700 hover:text-zinc-100' : 'text-zinc-600 active:bg-zinc-200 hover:bg-zinc-200 hover:text-zinc-900'} transition-colors touch-manipulation`}
              title="Decrease font size"
            >
              <svg
                className="h-5 w-5 md:h-4 md:w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
            </button>
            <span className={`min-w-[2.5rem] md:min-w-[3rem] text-center text-xs md:text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
              {fontSize}px
            </span>
            <button
              onClick={() => handleFontSizeChange(2)}
              className={`rounded p-2 md:p-1.5 ${theme === 'dark' ? 'text-zinc-400 active:bg-zinc-700 hover:bg-zinc-700 hover:text-zinc-100' : 'text-zinc-600 active:bg-zinc-200 hover:bg-zinc-200 hover:text-zinc-900'} transition-colors touch-manipulation`}
              title="Increase font size"
            >
              <svg
                className="h-5 w-5 md:h-4 md:w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2">
            {noteTags.map((tagName) => (
              <span
                key={tagName}
                className={`flex items-center gap-1 rounded-full ${theme === 'dark' ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-200 text-zinc-700'} px-2 md:px-2.5 py-0.5 text-[10px] md:text-xs`}
              >
                {tagName}
                <button
                  onClick={() => handleRemoveTag(tagName)}
                  className={`ml-1 p-0.5 ${theme === 'dark' ? 'text-zinc-500 active:text-zinc-300 hover:text-zinc-300' : 'text-zinc-400 active:text-zinc-600 hover:text-zinc-600'} transition-colors touch-manipulation`}
                  title="Remove tag"
                >
                  <svg
                    className="h-3.5 w-3.5 md:h-3 md:w-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            ))}
            {showTagInput ? (
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddTag();
                  } else if (e.key === "Escape") {
                    setShowTagInput(false);
                    setNewTagName("");
                  }
                }}
                onBlur={handleAddTag}
                placeholder="Tag name"
                className={`w-24 rounded ${theme === 'dark' ? 'bg-zinc-700 text-zinc-100 placeholder-zinc-500 focus:ring-zinc-600' : 'bg-zinc-200 text-zinc-900 placeholder-zinc-400 focus:ring-zinc-400'} px-2 py-0.5 text-xs focus:outline-none focus:ring-1`}
                autoFocus
              />
            ) : (
              <button
                onClick={() => setShowTagInput(true)}
                className={`rounded p-1.5 md:p-1 ${theme === 'dark' ? 'text-zinc-500 active:bg-zinc-700 hover:bg-zinc-700 hover:text-zinc-300' : 'text-zinc-400 active:bg-zinc-200 hover:bg-zinc-200 hover:text-zinc-600'} transition-colors touch-manipulation`}
                title="Add tag"
              >
                <svg
                  className="h-5 w-5 md:h-4 md:w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDeleteNote}
          className={`rounded p-2 md:p-1.5 ${theme === 'dark' ? 'text-zinc-500 active:bg-zinc-700 hover:bg-zinc-700 hover:text-red-400' : 'text-zinc-400 active:bg-zinc-200 hover:bg-zinc-200 hover:text-red-600'} transition-colors touch-manipulation`}
          title="Delete note"
        >
          <svg
            className="h-5 w-5 md:h-4 md:w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
