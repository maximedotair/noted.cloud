'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
    const lines = content.split('\n');
    const elements: React.ReactElement[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim().startsWith('>')) {
        // Rendu d'une citation avec formatage Markdown
        const citationMatch = line.match(/^>\s*\[([^\]]+)\]\s*(.+)$/);
        if (citationMatch) {
          const citationId = citationMatch[1];
          const citationContent = citationMatch[2];
          
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
                className="text-gray-700 italic leading-relaxed cursor-text select-text"
                onMouseUp={handleTextSelection}
              >
                <ReactMarkdown
                  components={{
                    code(props) {
                      const { className, children } = props;
                      const match = /language-(\w+)/.exec(className || '');
                      const isInline = !match;
                      return !isInline ? (
                        <SyntaxHighlighter
                          style={tomorrow}
                          language={match?.[1] || 'text'}
                          PreTag="div"
                          className="text-sm"
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {citationContent}
                </ReactMarkdown>
              </div>
            </div>
          );
        }
      } else if (line.trim() === '') {
        // Ligne vide
        elements.push(<div key={`empty-${i}`} className="h-4" />);
      } else {
        // Ligne normale avec formatage Markdown et highlights
        const processedLine = line;
        
        // Traiter les marqueurs [[texte:id]] dans le contenu
        let processedContent = processedLine;
        const highlightRegex = /\[\[([^:]+):([^\]]+)\]\]/g;
        
        // Remplacer les marqueurs par le texte sans span HTML
        processedContent = processedContent.replace(highlightRegex, (match, text, id) => {
          return text; // Retourner simplement le texte sans span
        });
        
        elements.push(
          <div
            key={`line-${i}`}
            className="leading-relaxed cursor-text select-text"
            onMouseUp={handleTextSelection}
          >
            <ReactMarkdown
              components={{
                code(props) {
                  const { className, children } = props;
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match;
                  return !isInline ? (
                    <SyntaxHighlighter
                      style={tomorrow}
                      language={match?.[1] || 'text'}
                      PreTag="div"
                      className="text-sm"
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {processedContent}
            </ReactMarkdown>
          </div>
        );
      }
    }

    return elements;
  };

  return (
    <div className={`max-w-none ${className}`} style={{ lineHeight: '1.7' }}>
      {renderContent()}
      
      
    </div>
  );
}