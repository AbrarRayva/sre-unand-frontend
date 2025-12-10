"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/apiClient';
import RouteGuard from '@/components/auth/RouteGuard';

const articleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  status: z.enum(['draft', 'published']),
  thumbnail: z.string().optional(),
});

type ArticleFormData = z.infer<typeof articleSchema>;

export default function CreateArticlePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      status: 'draft',
    },
  });

  const onSubmit = async (data: ArticleFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/articles/admin', data);
      router.push('/articles/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create article. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RouteGuard requiredPermission="articles.manage">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Article</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Write and publish your content
            </p>
          </div>
          <Link
            href="/articles/admin"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            ← Back to Articles
          </Link>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                {...register('title')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f936c] focus:border-[#0f936c]"
                placeholder="Enter article title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Excerpt
              </label>
              <textarea
                {...register('excerpt')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f936c] focus:border-[#0f936c]"
                placeholder="Brief description of the article (optional)"
              />
              {errors.excerpt && (
                <p className="mt-1 text-sm text-red-600">{errors.excerpt.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Thumbnail URL
              </label>
              <input
                {...register('thumbnail')}
                type="url"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f936c] focus:border-[#0f936c]"
                placeholder="https://example.com/image.jpg"
              />
              {errors.thumbnail && (
                <p className="mt-1 text-sm text-red-600">{errors.thumbnail.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content *
              </label>
              <textarea
                {...register('content')}
                rows={15}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f936c] focus:border-[#0f936c]"
                placeholder="Write your article content here..."
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                You can use HTML tags for formatting.
              </p>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f936c] focus:border-[#0f936c]"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/articles/admin"
                className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-[#0f936c] text-white rounded-md hover:bg-[#0a7354] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Creating...' : 'Create Article'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </RouteGuard>
  );
}
