'use client';

import { useEffect, useState } from 'react';
import { useIsConfigured } from '@/lib/store';
import SetupForm from '@/components/SetupForm';
import NotesApp from '@/components/NotesApp';

export default function Home() {
  const isConfigured = useIsConfigured();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Éviter les erreurs d'hydratation en attendant le montage
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si pas configuré, afficher le formulaire de setup
  if (!isConfigured) {
    return <SetupForm />;
  }

  // Si configuré, afficher l'application
  return <NotesApp />;
}
