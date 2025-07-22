'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNotesStore } from '@/lib/store';
import type { Page } from '@/lib/database';
import RichTextRenderer from './RichTextRenderer';
import AISidebar from './AISidebar';
import ShareModal from './ShareModal';

interface EditorProps {
  page: Page;
  onOpenAIModal: (context: {
    type: 'explain' | 'command';
    selectedText?: string;
    command?: string;
    position?: { x: number; y: number };
  }) => void;
  apiKey: string;
  model: string;
}

export default function Editor({ page, onOpenAIModal, apiKey, model }: EditorProps) {
  const { updatePage, settings, updateSettings } = useNotesStore();
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);
  const [titleManuallyEdited, setTitleManuallyEdited] = useState(false);
  const [isTypingSlash, setIsTypingSlash] = useState(false);
  const [slashCommand, setSlashCommand] = useState('');
  const [slashPosition, setSlashPosition] = useState({ x: 0, y: 0 });
  const [selectionContext, setSelectionContext] = useState<{ text: string; start: number; end: number } | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Synchronize states with active page (only when page changes)
  useEffect(() => {
    setTitle(page.title);
    setContent(page.content);
    setTitleManuallyEdited(page.title !== 'New page');
  }, [page.id, page.title, page.content]);

  // Auto-save (only if local states differ from page)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (title !== page.title || content !== page.content) {
        updatePage(page.id, { title, content });
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [title, content, page.id, page.title, page.content, updatePage]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setTitleManuallyEdited(newTitle.trim() !== '');
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    setContent(newContent);

    if (!titleManuallyEdited) {
      const firstLine = newContent.trim().split('\n')[0];
      if (firstLine) {
        const newTitle = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
        setTitle(newTitle);
      } else {
        setTitle('New page');
      }
    }

    // Si la sélection est annulée (curseur simple), réinitialiser l'assistant
    if (e.target.selectionStart === e.target.selectionEnd) {
      setSelectionContext(null);
    }

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
      const text = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      if (text.trim()) {
        // Check if selected text is already part of a marker [[text:id]]
        const startIndex = textarea.selectionStart;
        const endIndex = textarea.selectionEnd;
        
        // Search for markers in and around selection
        const contextBefore = content.substring(Math.max(0, startIndex - 50), startIndex);
        const contextAfter = content.substring(endIndex, Math.min(content.length, endIndex + 50));
        
        // Check if selection is already in a marker [[...]]
        const isInMarker = /\[\[[^\]]*$/.test(contextBefore) && /^[^\[]*\]\]/.test(contextAfter);
        
        // Exclude selections that already include complete markers
        const hasCompleteMarker = /\[\[.*?\]\]/.test(text);
        
        // Allow selection everywhere except in incomplete markers
        if (!isInMarker && !hasCompleteMarker) {
          setSelectionContext({ text: text.trim(), start: textarea.selectionStart, end: textarea.selectionEnd });
        } else {
          setSelectionContext(null);
        }
      } else {
        setSelectionContext(null);
      }
    }
  };

  const insertTextAtCursor = useCallback((text: string, selectedText?: string) => {
    const textarea = contentRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // Trouver la position de la ligne actuelle
      const lines = content.substring(0, start).split('\n');
      const currentLineIndex = lines.length - 1;
      
      // Trouver la position de fin de la ligne actuelle
      let lineEndPos = start;
      const remainingContent = content.substring(start);
      const nextLineBreak = remainingContent.indexOf('\n');
      
      if (nextLineBreak !== -1) {
        lineEndPos = start + nextLineBreak;
      } else {
        lineEndPos = content.length;
      }
      
      // Ajouter le texte à la ligne suivante avec une ligne d'espace
      const beforeLine = content.substring(0, lineEndPos);
      const afterLine = content.substring(lineEndPos);
      
      // Toujours ajouter une ligne d'espace avant le texte
      const separator = '\n\n';
      const newContent = beforeLine + separator + text + afterLine;
      
      setContent(newContent);
      
      // Positionner le curseur après le texte ajouté
      setTimeout(() => {
        const newPos = beforeLine.length + separator.length + text.length;
        textarea.selectionStart = textarea.selectionEnd = newPos;
        textarea.focus();
      }, 0);
    }
  }, [content]);

  const handlePreviewTextSelect = (text: string) => {
    // This is a simplified selection from preview, no context needed for now
    setSelectionContext({ text: text.trim(), start: 0, end: 0 });
  };

  // Exposer la fonction d'insertion pour le parent
  useEffect(() => {
    (window as Window & { insertTextAtCursor?: (text: string, selectedText?: string) => void }).insertTextAtCursor = insertTextAtCursor;
    return () => {
      delete (window as Window & { insertTextAtCursor?: (text: string, selectedText?: string) => void }).insertTextAtCursor;
    };
  }, [insertTextAtCursor]);

  // Écouter l'événement "add-to-note" depuis l'AISidebar
  useEffect(() => {
    const handleAddToNote = (event: CustomEvent) => {
      const { content: noteContent } = event.detail;
      if (noteContent) {
        // Ajouter le texte brut sans système de citations
        insertTextAtCursor(noteContent);
      }
    };

    window.addEventListener('add-to-note', handleAddToNote as EventListener);
    return () => {
      window.removeEventListener('add-to-note', handleAddToNote as EventListener);
    };
  }, [insertTextAtCursor]);

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              className="text-2xl font-bold text-gray-900 bg-transparent border-none outline-none w-full placeholder-gray-400"
              placeholder="Page title..."
            />
            <div className="text-xs text-gray-400 mt-1">
              Last modified: {new Date(page.updatedAt).toLocaleString('en-US')}
            </div>
          </div>
          {/* Bouton de basculement mode */}
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-3 py-1 rounded-lg text-sm font-medium transition-all bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
            >
              🔗 Share
            </button>
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
            <button
              onClick={() => {
                updateSettings({ aiAssistantEnabled: !settings.aiAssistantEnabled });
              }}
              className={`
                px-3 py-1 rounded-lg text-sm font-medium transition-all
                ${settings.aiAssistantEnabled
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-red-100 text-red-700 border border-red-200'
                }
              `}
              title={settings.aiAssistantEnabled ? 'Disable AI Assistant' : 'Enable AI Assistant'}
            >
              {settings.aiAssistantEnabled ? '🤖 AI ON' : '🤖 AI OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        {isPreviewMode ? (
          /* Mode prévisualisation GitHub-style */
          <div className="absolute inset-0 overflow-y-auto overflow-x-hidden">
            <div className="p-6 min-h-full">
              <RichTextRenderer
                content={content}
                onTextSelect={handlePreviewTextSelect}
                className=""
              />
              {content.trim() === '' && (
                <div className="text-gray-400 italic">
                  No content to display. Switch to edit mode to start writing.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Mode édition GitHub-style */
          <textarea
            ref={contentRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onMouseUp={handleTextSelection}
            onSelect={handleTextSelection}
            className="w-full h-full resize-none outline-none p-6 text-gray-900 leading-relaxed overflow-auto"
            placeholder="Start writing...

Tips:
• Type '/' to use AI
• Select text to get explanations
• Use Ctrl+S to save (auto-saves every second)
• Click 👁️ Preview to see GitHub-style markdown"
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
      </div>
      
      {/* AI Sidebar at bottom */}
      {!isPreviewMode && (
        <div className="border-t border-gray-200">
          <AISidebar
            selectionContext={selectionContext}
            fullContent={content}
            apiKey={apiKey}
            model={model}
          />
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <ShareModal
          page={page}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
      
      {/* Footer avec tips */}
      <div className="border-t border-gray-200 px-6 py-2 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex gap-4">
            {isPreviewMode ? (
              <>
                <span>👁️ Preview mode active</span>
                <span>📖 GitHub-style markdown viewer</span>
              </>
            ) : (
              <>
                <span>📝 GitHub-style markdown editor</span>
                <span>✨ Select text for AI explanations</span>
                <span>👁️ Preview mode hides AI assistant</span>
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