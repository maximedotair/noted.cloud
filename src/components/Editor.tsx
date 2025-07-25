"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useNotesStore } from "@/lib/store";
import type { Page } from "@/lib/database";
import RichTextRenderer from "./RichTextRenderer";
import AISidebar from "./AISidebar";
import ShareModal from "./ShareModal";
import { useToast } from "./Toast";

interface EditorProps {
  page: Page;
  apiKey: string;
  model: string;
  isMobile?: boolean;
}

export default function Editor({
  page,
  apiKey,
  model,
  isMobile = false,
}: EditorProps) {
  const { updatePage, settings, updateSettings } = useNotesStore();
  const { showSuccess, showError } = useToast();
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);
  const [titleManuallyEdited, setTitleManuallyEdited] = useState(false);
  const [isTypingSlash, setIsTypingSlash] = useState(false);
  const [slashCommand, setSlashCommand] = useState("");
  const [slashPosition, setSlashPosition] = useState({ x: 0, y: 0 });
  const [selectionContext, setSelectionContext] = useState<{
    text: string;
    start: number;
    end: number;
  } | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAISidebarExpanded, setIsAISidebarExpanded] = useState(true);
  const [isAISidebarVisible, setIsAISidebarVisible] = useState(true); // Visible par défaut
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Synchronize states with active page (only when page changes)
  useEffect(() => {
    setTitle(page.title);
    setContent(page.content);
    setTitleManuallyEdited(page.title !== "New page");
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

  // Gérer l'état de l'AI Sidebar sur mobile
  useEffect(() => {
    if (isMobile) {
      setIsAISidebarExpanded(false);
    } else {
      setIsAISidebarExpanded(true);
    }
  }, [isMobile]);


  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setTitleManuallyEdited(newTitle.trim() !== "");
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const cursorPosition = e.target.selectionStart;

    setContent(newContent);

    if (!titleManuallyEdited) {
      const firstLine = newContent.trim().split("\n")[0];
      if (firstLine) {
        const newTitle =
          firstLine.length > 50
            ? firstLine.substring(0, 50) + "..."
            : firstLine;
        setTitle(newTitle);
      } else {
        setTitle("New page");
      }
    }

    // Si la sélection est annulée (curseur simple), réinitialiser l'assistant
    if (e.target.selectionStart === e.target.selectionEnd) {
      setSelectionContext(null);
    }

    // Detect "/" input
    if (newContent[cursorPosition - 1] === "/") {
      const rect = e.target.getBoundingClientRect();
      const lines = newContent.substring(0, cursorPosition).split("\n");
      const currentLine = lines.length - 1;
      const charInLine = lines[currentLine].length - 1;

      // Estimate cursor position
      const lineHeight = isMobile ? 28 : 24;
      const charWidth = isMobile ? 10 : 8;

      setSlashPosition({
        x: rect.left + charInLine * charWidth,
        y: rect.top + currentLine * lineHeight + lineHeight,
      });

      setIsTypingSlash(true);
      setSlashCommand("");
    } else if (isTypingSlash) {
      // Continue typing command (allow spaces now)
      const lastSlashIndex = newContent.lastIndexOf("/", cursorPosition);
      if (lastSlashIndex !== -1 && cursorPosition > lastSlashIndex) {
        const command = newContent.substring(
          lastSlashIndex + 1,
          cursorPosition,
        );
        if (command.includes("\n")) {
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
    if (isTypingSlash && e.key === "Enter") {
      e.preventDefault();
      executeSlashCommand();
    } else if (isTypingSlash && e.key === "Escape") {
      setIsTypingSlash(false);
      setSlashCommand("");
    }
  };

  const executeSlashCommand = () => {
    if (slashCommand.trim()) {
      // LOG: Diagnostic - vérifier si cette fonctionnalité est utilisée
      console.log("🔍 DIAGNOSTIC: executeSlashCommand appelée avec:", slashCommand);
      console.log("🔍 DIAGNOSTIC: onOpenAIModal serait appelée ici");
      
      // TEMPORAIRE: Remplacer onOpenAIModal par la logique AISidebar existante
      // Au lieu d'utiliser onOpenAIModal, intégrer avec le système AI existant
      setSelectionContext({
        text: `/${slashCommand}`,
        start: 0,
        end: 0,
      });
      
      // Montrer l'AISidebar si AI est activé
      if (settings.aiAssistantEnabled) {
        setIsAISidebarVisible(true);
        console.log("🔍 DIAGNOSTIC: AISidebar activé au lieu de onOpenAIModal");
      } else {
        console.log("🔍 DIAGNOSTIC: AI désactivé, commande slash ignorée");
      }

      // Remove "/" command from content
      const textarea = contentRef.current;
      if (textarea) {
        const cursorPosition = textarea.selectionStart;
        const lastSlashIndex = content.lastIndexOf("/", cursorPosition);
        if (lastSlashIndex !== -1) {
          const newContent =
            content.substring(0, lastSlashIndex) +
            content.substring(cursorPosition);
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
    setSlashCommand("");
  };

  const handleTextSelection = async () => {
    const textarea = contentRef.current;
    if (textarea) {
      const text = textarea.value.substring(
        textarea.selectionStart,
        textarea.selectionEnd,
      );
      if (text.trim()) {
        // Ignorer si toute la sélection correspond à tout le contenu (Cmd+A / Ctrl+A)
        // mais seulement si le contenu a plusieurs lignes (pour éviter d'ignorer les textes courts)
        const isSelectAll = textarea.selectionStart === 0 && 
                           textarea.selectionEnd === textarea.value.length;
        
        if (isSelectAll) {
          // Compter le nombre de lignes dans le contenu
          const lineCount = textarea.value.split('\n').length;
          // Ignorer seulement si c'est une sélection complète ET qu'il y a plusieurs lignes
          if (lineCount > 1) {
            setSelectionContext(null);
            return;
          }
        }

        // Check if selected text is already part of a marker [[text:id]]
        const startIndex = textarea.selectionStart;
        const endIndex = textarea.selectionEnd;

        // Search for markers in and around selection
        const contextBefore = content.substring(
          Math.max(0, startIndex - 50),
          startIndex,
        );
        const contextAfter = content.substring(
          endIndex,
          Math.min(content.length, endIndex + 50),
        );

        // Check if selection is already in a marker [[...]]
        const isInMarker =
          /\[\[[^\]]*$/.test(contextBefore) && /^[^\[]*\]\]/.test(contextAfter);

        // Exclude selections that already include complete markers
        const hasCompleteMarker = /\[\[.*?\]\]/.test(text);

        // Allow selection everywhere except in incomplete markers
        if (!isInMarker && !hasCompleteMarker) {
          setSelectionContext({
            text: text.trim(),
            start: textarea.selectionStart,
            end: textarea.selectionEnd,
          });

          // Montrer automatiquement l'AISidebar si AI est activé
          if (settings.aiAssistantEnabled) {
            setIsAISidebarVisible(true);
            
            // Sur mobile/responsive, réduire le clavier virtuel
            if (isMobile && contentRef.current) {
              contentRef.current.blur();
            }
          }

          // Sur mobile avec AI activé, appel direct à l'API
          if (isMobile && settings.aiAssistantEnabled) {
            // Pas d'action automatique en mobile - l'AISidebar gère l'explication
          }
        } else {
          setSelectionContext(null);
        }
      } else {
        setSelectionContext(null);
      }
    }
  };

  const insertTextAtCursor = useCallback(
    (text: string, selectedText?: string) => {
      const textarea = contentRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        // Trouver la position de la ligne actuelle
        const lines = content.substring(0, start).split("\n");
        const currentLineIndex = lines.length - 1;

        // Trouver la position de fin de la ligne actuelle
        let lineEndPos = start;
        const remainingContent = content.substring(start);
        const nextLineBreak = remainingContent.indexOf("\n");

        if (nextLineBreak !== -1) {
          lineEndPos = start + nextLineBreak;
        } else {
          lineEndPos = content.length;
        }

        // Ajouter le texte à la ligne suivante avec une ligne d'espace
        const beforeLine = content.substring(0, lineEndPos);
        const afterLine = content.substring(lineEndPos);

        // Toujours ajouter une ligne d'espace avant le texte
        const separator = "\n\n";
        const newContent = beforeLine + separator + text + afterLine;

        setContent(newContent);

        // Positionner le curseur après le texte ajouté
        setTimeout(() => {
          const newPos = beforeLine.length + separator.length + text.length;
          textarea.selectionStart = textarea.selectionEnd = newPos;
          textarea.focus();
        }, 0);
      }
    },
    [content],
  );

  const handlePreviewTextSelect = (text: string) => {
    // This is a simplified selection from preview, no context needed for now
    setSelectionContext({ text: text.trim(), start: 0, end: 0 });
  };

  // Exposer la fonction d'insertion pour le parent
  useEffect(() => {
    (
      window as Window & {
        insertTextAtCursor?: (text: string, selectedText?: string) => void;
      }
    ).insertTextAtCursor = insertTextAtCursor;
    return () => {
      delete (
        window as Window & {
          insertTextAtCursor?: (text: string, selectedText?: string) => void;
        }
      ).insertTextAtCursor;
    };
  }, [insertTextAtCursor]);

  // Écouter l'événement "add-to-note" depuis l'AISidebar
  useEffect(() => {
    const handleAddToNote = (event: CustomEvent) => {
      const { content: noteContent } = event.detail;
      if (noteContent) {
        // Ajouter le texte brut sans système de citations
        insertTextAtCursor(noteContent);
        
        // Effacer la sélection dans le textarea
        if (contentRef.current) {
          const textarea = contentRef.current;
          // Placer le curseur à la fin du texte inséré
          const newPosition = textarea.selectionEnd;
          textarea.setSelectionRange(newPosition, newPosition);
        }
      }
    };

    window.addEventListener("add-to-note", handleAddToNote as EventListener);
    return () => {
      window.removeEventListener(
        "add-to-note",
        handleAddToNote as EventListener,
      );
    };
  }, [insertTextAtCursor]);

  return (
    <div className="h-screen w-full flex flex-col bg-white relative">
      {/* Header (A) - hauteur fixe, toujours visible */}
      <div
        className={`border-b border-gray-200 flex-shrink-0 ${isMobile ? "px-4 py-3" : "px-6 py-3"}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              className={`font-bold text-gray-900 bg-transparent border-none outline-none w-full placeholder-gray-400 ${
                isMobile ? "text-lg" : "text-2xl"
              }`}
              placeholder="Page title..."
            />
            <div
              className={`text-gray-400 mt-1 ${isMobile ? "text-xs" : "text-xs"}`}
            >
              Last modified:{" "}
              {new Date(page.updatedAt).toLocaleString(
                isMobile ? "fr-FR" : "en-US",
              )}
            </div>
          </div>

          {/* Boutons d'action */}
          <div
            className={`flex items-center gap-2 ml-4 ${isMobile ? "flex-wrap" : ""}`}
          >
            {/* Bouton Share */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className={`rounded-lg font-medium transition-all bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 ${
                isMobile ? "px-2 py-1 text-xs" : "px-3 py-1 text-sm"
              }`}
            >
              {isMobile ? "🔗" : "🔗 Share"}
            </button>

            {/* Bouton Preview */}
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`
                rounded-lg font-medium transition-all
                ${
                  isPreviewMode
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                }
                ${isMobile ? "px-2 py-1 text-xs" : "px-3 py-1 text-sm"}
              `}
            >
              {isPreviewMode
                ? isMobile
                  ? "📝"
                  : "📝 Edit"
                : isMobile
                  ? "👁️"
                  : "👁️ Preview"}
            </button>

            {/* Bouton AI Assistant */}
            <button
              onClick={() => {
                updateSettings({
                  aiAssistantEnabled: !settings.aiAssistantEnabled,
                });
              }}
              className={`
                rounded-lg font-medium transition-all shadow-sm
                ${
                  settings.aiAssistantEnabled
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border border-green-400 hover:from-green-600 hover:to-emerald-600 shadow-green-200"
                    : "bg-gradient-to-r from-gray-500 to-gray-600 text-white border border-gray-400 hover:from-gray-600 hover:to-gray-700 shadow-gray-200"
                }
                ${isMobile ? "px-2 py-1 text-xs" : "px-4 py-2 text-sm font-bold"}
              `}
              title={
                settings.aiAssistantEnabled
                  ? "Disable AI Assistant"
                  : "Enable AI Assistant"
              }
            >
              {settings.aiAssistantEnabled
                ? isMobile
                  ? "🤖"
                  : "✨ AI ACTIVE"
                : isMobile
                  ? "🤖"
                  : "🚫 AI OFF"}
            </button>

          </div>
        </div>
      </div>

      {/* Conteneur principal avec calcul de hauteur */}
      <div 
        className="flex-1 flex flex-col min-h-0 overflow-hidden"
        style={{
          height: `calc(100vh - ${
            !isPreviewMode && settings.aiAssistantEnabled 
              ? isAISidebarVisible 
                ? (isMobile ? '16rem' : '19rem') // Header + AISidebar
                : (isMobile ? '7.5rem' : '6.5rem') // Header + AISidebar fermé
              : '4rem' // Juste le header
          })`
        }}
      >
        {/* Editor (B) - utilise tout l'espace disponible */}
        {isPreviewMode ? (
          /* Mode prévisualisation GitHub-style */
          <div className="h-full overflow-y-auto">
            <div className={`min-h-full ${isMobile ? "p-4" : "p-6"}`}>
              <RichTextRenderer
                content={content}
                onTextSelect={handlePreviewTextSelect}
                className=""
              />
              {content.trim() === "" && (
                <div className="text-gray-400 italic">
                  {isMobile
                    ? "No content to display. Switch to edit mode to start writing."
                    : "No content to display. Switch to edit mode to start writing."}
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
            onFocus={() => {
              // Cacher l'AISidebar quand l'utilisateur clique dans l'éditeur
              setIsAISidebarVisible(false);
            }}
            onTouchEnd={handleTextSelection} // Support tactile
            className={`w-full h-full resize-none outline-none text-gray-900 leading-relaxed overflow-y-auto ${
              isMobile ? "p-4 text-base" : "p-6 text-base"
            }`}
            placeholder={
             `Start writing...

Tips:
• Select text to get explanations
• Click 👁️ Preview to see markdown rendering
• Click 🤖 to enable or disable AI assistant
• Click 🔗 to share the note`}
            style={{
              fontFamily: isMobile
                ? 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                : 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            }}
          />
        )}

        {/* Indicateur de commande slash */}
        {isTypingSlash && (
          <div
            className={`absolute bg-gray-900 text-white rounded pointer-events-none z-10 ${
              isMobile ? "px-3 py-2 text-sm" : "px-2 py-1 text-sm"
            }`}
            style={{
              left: slashPosition.x,
              top: slashPosition.y + (isMobile ? 30 : 25),
              transform: "translateX(-50%)",
            }}
          >
            /{slashCommand}
            <div
              className={`opacity-75 mt-1 ${isMobile ? "text-xs" : "text-xs"}`}
            >
              Press Enter to execute
            </div>
          </div>
        )}
      </div>

      {/* AISidebar (C) - Position absolue en bas, hauteur fixe */}
      {!isPreviewMode && settings.aiAssistantEnabled && (
        <div 
          className="absolute bottom-0 left-0 right-0 border-t-2 border-gray-300 bg-white shadow-2xl"
          style={{
            height: isAISidebarVisible ? (isMobile ? '12rem' : '15rem') : (isMobile ? '3.5rem' : '2.5rem'),
            zIndex: 9999
          }}
        >
          <AISidebar
            selectionContext={selectionContext}
            fullContent={content}
            apiKey={apiKey}
            model={model}
            isMobile={isMobile}
            isVisible={isAISidebarVisible}
            onToggleVisibility={() => setIsAISidebarVisible(!isAISidebarVisible)}
            onAddToNote={() => {
              // Fermer l'AISidebar après "Add to note"
              setIsAISidebarVisible(false);
              // Réinitialiser la sélection pour revenir au mode par défaut
              setSelectionContext(null);
            }}
          />
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <ShareModal
          page={page}
          onClose={() => setIsShareModalOpen(false)}
          isMobile={isMobile}
        />
      )}

   
    </div>
  );
}
