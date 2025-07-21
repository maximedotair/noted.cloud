'use client';

import React, { useState, useEffect } from 'react';

interface HighlightedText {
  id: string;
  text: string;
  citationId: string;
}

interface Citation {
  id: string;
  content: string;
}

interface RichTextRendererProps {
  content: string;
  onTextSelect: (selectedText: string, startIndex: number, endIndex: number) => void;
  className?: string;
}

export default function RichTextRenderer({ content, onTextSelect, className = '' }: RichTextRendererProps) {
  const [highlights, setHighlights] = useState<HighlightedText[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Parser le contenu pour extraire les marqueurs et citations
  useEffect(() => {
    const parseContent = () => {
      const newHighlights: HighlightedText[] = [];
      const newCitations: Citation[] = [];

      // Extraire les textes marqués [[texte:id]]
      const highlightRegex = /\[\[([^:]+):([^\]]+)\]\]/g;
      let match;
      while ((match = highlightRegex.exec(content)) !== null) {
        newHighlights.push({
          id: match[2],
          text: match[1],
          citationId: match[2]
        });
      }

      // Extraire les citations > [id] contenu
      const citationRegex = /^>\s*\[([^\]]+)\]\s*(.+)$/gm;
      let citationMatch;
      while ((citationMatch = citationRegex.exec(content)) !== null) {
        newCitations.push({
          id: citationMatch[1],
          content: citationMatch[2]
        });
      }

      setHighlights(newHighlights);
      setCitations(newCitations);
    };

    parseContent();
  }, [content]);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim();
      onTextSelect(selectedText, 0, selectedText.length);
    }
  };

  const renderContent = () => {
    const processedContent = content;
    const elements: React.ReactElement[] = [];

    // Séparer par lignes pour traitement
    const lines = processedContent.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim().startsWith('>')) {
        // Rendu d'une citation
        const citationMatch = line.match(/^>\s*\[([^\]]+)\]\s*(.+)$/);
        if (citationMatch) {
          const citationId = citationMatch[1];
          const citationContent = citationMatch[2];
          
          // Traiter les marqueurs dans les citations comme du texte normal
          const citationElements: (string | React.ReactElement)[] = [];
          let lastIndex = 0;
          
          // Chercher les marqueurs dans le contenu de la citation
          const highlightRegex = /\[\[([^:]+):([^\]]+)\]\]/g;
          let match;
          
          while ((match = highlightRegex.exec(citationContent)) !== null) {
            const beforeMatch = citationContent.substring(lastIndex, match.index);
            if (beforeMatch) {
              citationElements.push(beforeMatch);
            }

            const highlightId = match[2];
            const highlightText = match[1];
            
            citationElements.push(
              <span
                key={`citation-highlight-${highlightId}`}
                className={`
                  bg-yellow-100
                  border-b-2 border-yellow-400
                  cursor-help
                  transition-all duration-200 px-1 rounded-sm
                  ${hoveredId === highlightId ? 'bg-yellow-200 border-yellow-500 shadow-sm' : ''}
                `}
                onMouseEnter={() => setHoveredId(highlightId)}
                onMouseLeave={() => setHoveredId(null)}
                onMouseUp={handleTextSelection}
                title={`Ce texte a une citation #${highlightId.slice(-4)}`}
              >
                {highlightText}
              </span>
            );

            lastIndex = match.index + match[0].length;
          }
          
          // Ajouter le reste du contenu
          if (lastIndex < citationContent.length) {
            citationElements.push(citationContent.substring(lastIndex));
          }
          
          // Si aucun highlight trouvé, garder le contenu simple
          if (citationElements.length === 0) {
            citationElements.push(citationContent);
          }
          
          elements.push(
            <div
              key={`citation-${i}`}
              className={`
                my-3 pl-4 pr-3 py-3
                border-l-4 border-blue-500
                bg-blue-50
                rounded-r-lg
                transition-all duration-200
                ${hoveredId === citationId ? 'bg-blue-100 border-blue-600 shadow-md' : ''}
              `}
              onMouseEnter={() => setHoveredId(citationId)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div
                className="text-gray-700 italic leading-relaxed cursor-text select-text whitespace-pre-wrap"
                onMouseUp={handleTextSelection}
              >
                {citationElements}
              </div>
            </div>
          );
        }
      } else if (line.trim() === '') {
        // Ligne vide
        elements.push(<div key={`empty-${i}`} className="h-4" />);
      } else {
        // Ligne de texte normale avec possible highlights
        const processedLine = line;
        const lineElements: (string | React.ReactElement)[] = [];
        let lastIndex = 0;

        // Trouver et remplacer les marqueurs dans cette ligne
        const highlightRegex = /\[\[([^:]+):([^\]]+)\]\]/g;
        let match;
        
        while ((match = highlightRegex.exec(line)) !== null) {
          const beforeMatch = processedLine.substring(lastIndex, match.index);
          if (beforeMatch) {
            lineElements.push(beforeMatch);
          }

          const highlightId = match[2];
          const highlightText = match[1];
          
          lineElements.push(
            <span
              key={`highlight-${highlightId}`}
              className={`
                bg-yellow-100 
                border-b-2 border-yellow-400 
                cursor-help 
                transition-all duration-200 px-1 rounded-sm
                ${hoveredId === highlightId ? 'bg-yellow-200 border-yellow-500 shadow-sm' : ''}
              `}
              onMouseEnter={() => setHoveredId(highlightId)}
              onMouseLeave={() => setHoveredId(null)}
              onMouseUp={handleTextSelection}
              title={`Ce texte a une citation #${highlightId.slice(-4)}`}
            >
              {highlightText}
            </span>
          );

          lastIndex = match.index + match[0].length;
        }

        // Ajouter le reste de la ligne
        if (lastIndex < processedLine.length) {
          lineElements.push(processedLine.substring(lastIndex));
        }

        // Si aucun highlight trouvé, garder la ligne simple
        if (lineElements.length === 0) {
          lineElements.push(processedLine);
        }

        elements.push(
          <div 
            key={`line-${i}`} 
            className="leading-relaxed cursor-text select-text"
            onMouseUp={handleTextSelection}
          >
            {lineElements}
          </div>
        );
      }
    }

    return elements;
  };

  return (
    <div className={`prose prose-gray max-w-none ${className}`}>
      {renderContent()}
      
      {/* Debug info (peut être supprimé en production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded text-xs">
          <div className="font-bold mb-2">Debug Info:</div>
          <div>Highlights: {highlights.length}</div>
          <div>Citations: {citations.length}</div>
          <div>Hovered ID: {hoveredId || 'none'}</div>
        </div>
      )}
    </div>
  );
}