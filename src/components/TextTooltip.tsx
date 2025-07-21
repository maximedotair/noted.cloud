'use client';

import { useState, useEffect } from 'react';

interface TextTooltipProps {
  position: { x: number; y: number };
  selectedText: string;
  onExplain: () => void;
  onClose: () => void;
}

export default function TextTooltip({ position, selectedText, onExplain, onClose }: TextTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleExplain = () => {
    onExplain();
    onClose();
  };

  return (
    <div
      className={`fixed bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg z-50 transform transition-all duration-200 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{
        left: position.x,
        top: position.y - 50,
        transform: 'translateX(-50%)',
        maxWidth: '200px'
      }}
    >
      <div className="text-xs mb-2 opacity-75 truncate">
        &quot;{selectedText.substring(0, 30)}{selectedText.length > 30 ? '...' : ''}&quot;
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleExplain}
          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
        >
          ✨ Explain
        </button>
        <button
          onClick={onClose}
          className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs transition-colors"
        >
          ✕
        </button>
      </div>
      
      {/* Flèche pointant vers le texte sélectionné */}
      <div 
        className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"
      />
    </div>
  );
}