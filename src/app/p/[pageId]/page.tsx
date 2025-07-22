'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DatabaseService } from '@/lib/database';
import type { Page } from '@/lib/database';
import RichTextRenderer from '@/components/RichTextRenderer';
import Link from 'next/link';

export default function PublicPage() {
  const params = useParams();
  const pageId = params.pageId as string;

  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!pageId) return;
    
    const fetchPage = async () => {
      try {
        const response = await fetch(`/api/p/${pageId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch: ${response.status}`);
        }
        const fetchedPage = await response.json();
        setPage(fetchedPage);
      } catch (err) {
        console.error('Error fetching public page:', err);
        setError((err as Error).message || 'Could not load the page.');
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [pageId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
          <p className="text-gray-600">{error}</p>
          <Link href="/" className="mt-6 inline-block bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <main className="pt-8 pl-8 pb-24">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{page.title}</h1>
      
        <div className="prose prose-lg max-w-none">
          <RichTextRenderer content={page.content} onTextSelect={() => {}} />
        </div>
      </main>
      <footer className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 p-4">
        <div className="container mx-auto flex items-center justify-center text-center">
          <p className="text-gray-700 text-sm">
            Powered by{' '}
            <Link href="/" className="font-semibold text-blue-600 hover:underline">
              Noted.cloud
            </Link>
            . Create and share your own notes for free! Enriched by LLM.
          </p>
        </div>
      </footer>
    </div>
  );
}
