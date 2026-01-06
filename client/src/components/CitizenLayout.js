import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import CitizenSidebar from './CitizenSidebar';
import CitizenHeader from './CitizenHeader';

const CitizenLayout = ({ children, showSidebar = true, onRefresh, showRefresh = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const hoverTimeoutRef = useRef(null);

  // Close sidebar when route changes or on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
        setIsHovering(false);
        setIsPinned(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    setIsPinned(newState);
    if (!newState) {
      setIsHovering(false);
    }
  };

  const handleSidebarHover = (hovering) => {
    setIsHovering(hovering);
    
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    if (hovering && !isPinned) {
      setSidebarOpen(true);
    } else if (!hovering && !isPinned) {
      // Add a longer delay before closing to allow for clicks
      hoverTimeoutRef.current = setTimeout(() => {
        if (!isPinned) {
          setSidebarOpen(false);
        }
      }, 500);
    }
  };

  const handleSidebarClick = () => {
    // Pin the sidebar when clicked
    setIsPinned(true);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  if (!showSidebar) {
    return (
      <div className="min-h-screen bg-white">
        <CitizenHeader onRefresh={onRefresh} showRefresh={showRefresh} />
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <CitizenHeader 
        onRefresh={onRefresh} 
        showRefresh={showRefresh}
        onToggleSidebar={toggleSidebar}
        sidebarOpen={sidebarOpen}
        onSidebarHover={handleSidebarHover}
      />

      {/* Hover trigger area - invisible strip on the left edge */}
      <div
        className="fixed left-0 top-0 w-4 h-full z-30"
        onMouseEnter={() => handleSidebarHover(true)}
        onMouseLeave={() => handleSidebarHover(false)}
        style={{ pointerEvents: 'auto' }}
      />

      {/* Sidebar - Only shown when toggled or hovered */}
      {showSidebar && (
        <CitizenSidebar 
          isOpen={sidebarOpen} 
          onToggle={toggleSidebar} 
          onRefresh={onRefresh}
          onMouseEnter={() => handleSidebarHover(true)}
          onMouseLeave={() => handleSidebarHover(false)}
          onClick={handleSidebarClick}
          isPinned={isPinned}
        />
      )}

      {/* Main Content */}
      <main className="relative">
        {children}
      </main>
    </div>
  );
};

export default CitizenLayout;