'use client';

import { useState, useEffect } from 'react';
import { NotesProvider } from '@/contexts/NotesContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import Sidebar from '@/components/Sidebar';
import Editor from '@/components/Editor';

function AppContent() {
  const { theme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSidebarToggle = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const handleSidebarClose = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-zinc-900' : 'bg-zinc-50'}`}>
      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className={`fixed inset-0 z-40 ${theme === 'dark' ? 'bg-black/50' : 'bg-black/30'}`}
          onClick={handleSidebarClose}
        />
      )}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        isMobile={isMobile}
        isOpen={isSidebarOpen}
        onToggle={handleSidebarToggle}
        onClose={handleSidebarClose}
      />
      <Editor
        isSidebarCollapsed={isSidebarCollapsed}
        isMobile={isMobile}
        onMenuClick={handleSidebarToggle}
      />
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <NotesProvider>
        <AppContent />
      </NotesProvider>
    </ThemeProvider>
  );
}
