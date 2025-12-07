"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';

interface Article {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  publishedAt: string;
  author: {
    name: string;
  };
  thumbnail?: string;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await apiClient.get<Article>(`/articles/published/${params.id}`);
        setArticle(response.data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load article';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchArticle();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-8"></div>
            <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400 mb-8">
              {error || 'Article not found'}
            </div>
            <div className="space-x-4">
              <Link
                href="/articles/public"
                className="inline-block bg-[#0f936c] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#0a7354] transition-colors"
              >
                Browse Articles
              </Link>
              <button
                onClick={() => router.back()}
                className="inline-block border border-gray-300 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/articles/public"
              className="text-[#0f936c] hover:text-[#0a7354] font-medium"
            >
              ← Back to Articles
            </Link>
            <Link
              href="/"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Home
            </Link>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {article.thumbnail && (
            <img
              src={article.thumbnail}
              alt={article.title}
              className="w-full h-64 md:h-96 object-cover"
            />
          )}
          
          <div className="p-8">
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {article.title}
              </h1>
              
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <div>
                  <span className="font-medium">{article.author.name}</span>
                  <span className="mx-2">•</span>
                  <time dateTime={article.publishedAt}>
                    {new Date(article.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                </div>
              </div>
            </header>

            <div className="prose prose-lg max-w-none dark:prose-invert">
              <div
                dangerouslySetInnerHTML={{ __html: article.content }}
                className="text-gray-700 dark:text-gray-300 leading-relaxed"
              />
            </div>
          </div>
        </article>

        {/* Related Actions */}
        <div className="mt-12 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            ← Previous Page
          </button>
          
          <Link
            href="/articles/public"
            className="inline-block bg-[#0f936c] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#0a7354] transition-colors"
          >
            Browse More Articles
          </Link>
        </div>
      </div>
    </div>
  );
}
