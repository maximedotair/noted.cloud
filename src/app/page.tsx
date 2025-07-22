'use client';

import { useEffect, useState } from 'react';
import { useNotesStore, useIsConfigured } from '@/lib/store';
import SetupForm from '@/components/SetupForm';
import NotesApp from '@/components/NotesApp';

export default function Home() {
  const isConfigured = useIsConfigured();
  const initialize = useNotesStore((state) => state.initialize);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      await initialize();
      setIsInitializing(false);
    };
    init();
  }, [initialize]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (isConfigured) {
    return <NotesApp />;
  }

  return <SetupForm />;
}
