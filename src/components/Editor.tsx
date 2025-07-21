'use client';

import { useState, useRef, useEffect } from 'react';
import { useNotesStore } from '@/lib/store';
import type { Page } from '@/lib/database';
import TextTooltip from './TextTooltip';
import RichTextRenderer from './RichTextRenderer';

interface EditorProps {
  page: Page;
  onOpenAIModal: (context: {
    type: 'explain' | 'command';
    selectedText?: string;
    command?: string;
    position?: { x: number; y: number };
  }) => void;
}

export default function Editor({ page, onOpenAIModal }: EditorProps) {
  const { updatePage } = useNotesStore();
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);
  const [isTypingSlash, setIsTypingSlash] = useState(false);
  const [slashCommand, setSlashCommand] = useState('');
  const [slashPosition, setSlashPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState<{
    selectedText: string;
    position: { x: number; y: number };
  } | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Synchronize states with active page (only when page changes)
  useEffect(() => {
    setTitle(page.title);
    setContent(page.content);
  }, [page.id]);

  // Auto-save (only if local states differ from page)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (title !== page.title || content !== page.content) {
        updatePage(page.id, { title, content });
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [title, content, page.id, updatePage]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    setContent(newContent);

    // Detect "/" input
    if (newContent[cursorPosition - 1] === '/') {
      const rect = e.target.getBoundingClientRect();
      const lines = newContent.substring(0, cursorPosition).split('\n');
      const currentLine = lines.length - 1;
      const charInLine = lines[currentLine].length - 1;
      
      // Estimate cursor position
      const lineHeight = 24; // approximate line height
      const charWidth = 8; // approximate character width
      
      setSlashPosition({
        x: rect.left + charInLine * charWidth,
        y: rect.top + currentLine * lineHeight + lineHeight
      });
      
      setIsTypingSlash(true);
      setSlashCommand('');
    } else if (isTypingSlash) {
      // Continue typing command (allow spaces now)
      const lastSlashIndex = newContent.lastIndexOf('/', cursorPosition);
      if (lastSlashIndex !== -1 && cursorPosition > lastSlashIndex) {
        const command = newContent.substring(lastSlashIndex + 1, cursorPosition);
        if (command.includes('\n')) {
          setIsTypingSlash(false);
        } else {
          setSlashCommand(command);
        }
      } else {
        setIsTypingSlash(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isTypingSlash && e.key === 'Enter') {
      e.preventDefault();
      executeSlashCommand();
    } else if (isTypingSlash && e.key === 'Escape') {
      setIsTypingSlash(false);
      setSlashCommand('');
    }
  };

  const executeSlashCommand = () => {
    if (slashCommand.trim()) {
      onOpenAIModal({
        type: 'command',
        command: slashCommand,
        position: slashPosition
      });
      
      // Remove "/" command from content
      const textarea = contentRef.current;
      if (textarea) {
        const cursorPosition = textarea.selectionStart;
        const lastSlashIndex = content.lastIndexOf('/', cursorPosition);
        if (lastSlashIndex !== -1) {
          const newContent = content.substring(0, lastSlashIndex) + content.substring(cursorPosition);
          setContent(newContent);
          
          // Reposition cursor
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = lastSlashIndex;
            textarea.focus();
          }, 0);
        }
      }
    }
    
    setIsTypingSlash(false);
    setSlashCommand('');
  };

  const handleTextSelection = () => {
    const textarea = contentRef.current;
    if (textarea) {
      const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      if (selectedText.trim()) {
        // Check if selected text is already part of a marker [[text:id]]
        const startIndex = textarea.selectionStart;
        const endIndex = textarea.selectionEnd;
        
        // Search for markers in and around selection
        const contextBefore = content.substring(Math.max(0, startIndex - 50), startIndex);
        const contextAfter = content.substring(endIndex, Math.min(content.length, endIndex + 50));
        const fullContext = contextBefore + selectedText + contextAfter;
        
        // Check if selection is already in a marker [[...]]
        const isInMarker = /\[\[[^\]]*$/.test(contextBefore) && /^[^\[]*\]\]/.test(contextAfter);
        
        // Exclude selections that already include complete markers
        const hasCompleteMarker = /\[\[.*?\]\]/.test(selectedText);
        
        // Allow selection everywhere except in incomplete markers
        if (!isInMarker && !hasCompleteMarker) {
          const rect = textarea.getBoundingClientRect();
          
          setTooltipData({
            selectedText: selectedText.trim(),
            position: { x: rect.left + rect.width / 2, y: rect.top - 50 }
          });
          setShowTooltip(true);
        } else {
          setShowTooltip(false);
        }
      } else {
        setShowTooltip(false);
      }
    }
  };

  const handleTooltipExplain = () => {
    if (tooltipData) {
      onOpenAIModal({
        type: 'explain',
        selectedText: tooltipData.selectedText,
        position: tooltipData.position
      });
    }
  };

  const handleCloseTooltip = () => {
    setShowTooltip(false);
    setTooltipData(null);
  };

  const insertTextAtCursor = (text: string, selectedText?: string) => {
    const textarea = contentRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      if (selectedText) {
        // Fixed contextual citation system
        const beforeSelection = content.substring(0, start);
        const afterSelection = content.substring(end);
        
        // Verify that selected text matches exactly
        const actualSelectedText = content.substring(start, end);
        if (actualSelectedText !== selectedText) {
          console.warn('Selected text mismatch:', { expected: selectedText, actual: actualSelectedText });
          return;
        }
        
        // Generate unique ID for this citation
        const citationId = Date.now().toString();
        
        // Replace EXACTLY the selected text with marker
        const markedText = `[[${selectedText}:${citationId}]]`;
        
        // Find where to insert citation (end of line/paragraph)
        let insertPos = end;
        const afterText = afterSelection;
        const nextLineBreak = afterText.indexOf('\n');
        
        if (nextLineBreak !== -1 && nextLineBreak < 100) {
          insertPos = end + nextLineBreak;
        }
        
        // Build new content by replacing exactly the selection
        const newContentBeforeInsertion = beforeSelection + markedText + afterSelection;
        
        // Insert citation at the correct position
        const insertionPoint = beforeSelection.length + markedText.length + (insertPos - end);
        const beforeCitation = newContentBeforeInsertion.substring(0, insertionPoint);
        const afterCitation = newContentBeforeInsertion.substring(insertionPoint);
        
        // Citation without indentation, always at the same level
        const citation = `\n\n> [${citationId}] ${text.split('\n').join(' ')}\n`;
        
        const finalContent = beforeCitation + citation + afterCitation;
        setContent(finalContent);
        
        // Reposition cursor après la citation
        setTimeout(() => {
          const newPos = beforeCitation.length + citation.length;
          textarea.selectionStart = textarea.selectionEnd = newPos;
          textarea.focus();
        }, 0);
      } else {
        // Mode insertion normale (commande slash)
        const newContent = content.substring(0, start) + text + content.substring(end);
        setContent(newContent);
        
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + text.length;
          textarea.focus();
        }, 0);
      }
    }
  };

  const handlePreviewTextSelect = (selectedText: string, startIndex: number, endIndex: number) => {
    // Passer en mode édition temporairement pour la sélection
    setIsPreviewMode(false);
    
    // Simuler la sélection dans le mode édition
    setTimeout(() => {
      const rect = contentRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltipData({
          selectedText,
          position: { x: rect.left + rect.width / 2, y: rect.top + 100 }
        });
        setShowTooltip(true);
      }
    }, 100);
  };

  // Exposer la fonction d'insertion pour le parent
  useEffect(() => {
    (window as Window & { insertTextAtCursor?: (text: string, selectedText?: string) => void }).insertTextAtCursor = insertTextAtCursor;
    return () => {
      delete (window as Window & { insertTextAtCursor?: (text: string, selectedText?: string) => void }).insertTextAtCursor;
    };
  }, [content]);

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-bold text-gray-900 bg-transparent border-none outline-none flex-1 placeholder-gray-400"
            placeholder="Page title..."
          />
          {/* Bouton de basculement mode */}
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`
                px-3 py-1 rounded-lg text-sm font-medium transition-all
                ${isPreviewMode
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }
              `}
            >
              {isPreviewMode ? '📝 Edit' : '👁️ Preview'}
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Last modified: {new Date(page.updatedAt).toLocaleString('en-US')}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        {isPreviewMode ? (
          /* Mode prévisualisation avec rendu riche */
          <div className="w-full h-full overflow-auto p-6">
            <RichTextRenderer
              content={content}
              onTextSelect={handlePreviewTextSelect}
              className="min-h-full"
            />
            {content.trim() === '' && (
              <div className="text-gray-400 italic">
                No content to display. Switch to edit mode to start writing.
              </div>
            )}
          </div>
        ) : (
          /* Mode édition classique */
          <textarea
            ref={contentRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onMouseUp={handleTextSelection}
            onSelect={handleTextSelection}
            className="w-full h-full resize-none outline-none p-6 text-gray-900 leading-relaxed"
            placeholder="Start writing...

Tips:
• Type '/' to use AI
• Select text to get explanations
• Use Ctrl+S to save (auto-saves every second)
• Click 👁️ Preview to see final render with styled citations"
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace' }}
          />
        )}

        {/* Indicateur de commande slash */}
        {isTypingSlash && (
          <div
            className="absolute bg-gray-900 text-white px-2 py-1 rounded text-sm pointer-events-none z-10"
            style={{
              left: slashPosition.x,
              top: slashPosition.y + 25,
              transform: 'translateX(-50%)'
            }}
          >
            /{slashCommand}
            <div className="text-xs opacity-75 mt-1">
              Press Enter to execute
            </div>
          </div>
        )}

        {/* Tooltip de sélection de texte */}
        {showTooltip && tooltipData && (
          <TextTooltip
            position={tooltipData.position}
            selectedText={tooltipData.selectedText}
            onExplain={handleTooltipExplain}
            onClose={handleCloseTooltip}
          />
        )}
      </div>

      {/* Footer avec tips */}
      <div className="border-t border-gray-200 px-6 py-2 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex gap-4">
            {isPreviewMode ? (
              <>
                <span>👁️ Preview mode active</span>
                <span>✨ Select to generate citations</span>
                <span>🔄 Hover on text to see links</span>
              </>
            ) : (
              <>
                <span>� Tapez &quot;/&quot; pour l&apos;IA</span>
                <span>✨ Sélectionnez pour expliquer</span>
                <span>👁️ Cliquez aperçu pour le rendu final</span>
              </>
            )}
          </div>
          <div>
            {content.length} characters
          </div>
        </div>
      </div>
    </div>
  );
}