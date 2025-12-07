"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import RouteGuard from '@/components/auth/RouteGuard';

interface Article {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  publishedAt?: string;
  status: 'draft' | 'published';
  author: {
    name: string;
    id: string;
  };
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ArticlesAdminPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await apiClient.get<Article[]>('/articles/admin');
        setArticles(response.data);
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || article.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    
    try {
      await apiClient.delete(`/articles/admin/${id}`);
      setArticles(articles.filter(article => article.id !== id));
    } catch (error) {
      console.error('Failed to delete article:', error);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      await apiClient.put(`/articles/admin/${id}`, { status: newStatus });
      setArticles(articles.map(article => 
        article.id === id ? { ...article, status: newStatus as 'draft' | 'published' } : article
      ));
    } catch (error) {
      console.error('Failed to update article status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="bg-gray-300 dark:bg-gray-700 rounded h-24"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <RouteGuard requiredPermission="articles.manage">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Articles</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your articles and content
            </p>
          </div>
          <Link
            href="/articles/admin/create"
            className="bg-[#0f936c] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#0a7354] transition-colors"
          >
            Create Article
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search articles..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f936c] focus:border-[#0f936c]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-[#0f936c] text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('published')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  statusFilter === 'published'
                    ? 'bg-[#0f936c] text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Published
              </button>
              <button
                onClick={() => setStatusFilter('draft')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  statusFilter === 'draft'
                    ? 'bg-[#0f936c] text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Draft
              </button>
            </div>
          </div>
        </div>

        {/* Articles List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {filteredArticles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredArticles.map((article) => (
                    <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {article.title}
                          </div>
                          {article.excerpt && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">
                              {article.excerpt}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {article.author.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          article.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {article.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(article.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/articles/admin/${article.id}`}
                            className="text-[#0f936c] hover:text-[#0a7354]"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleToggleStatus(article.id, article.status)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {article.status === 'published' ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            onClick={() => handleDelete(article.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 dark:text-gray-400">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No articles found matching your criteria.' 
                  : 'No articles yet. Create your first article!'}
              </div>
              {searchTerm || statusFilter !== 'all' ? (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="mt-4 text-[#0f936c] hover:text-[#0a7354] font-medium"
                >
                  Clear filters
                </button>
              ) : (
                <Link
                  href="/articles/admin/create"
                  className="mt-4 inline-block bg-[#0f936c] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#0a7354] transition-colors"
                >
                  Create Article
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </RouteGuard>
  );
}
