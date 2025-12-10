"use client";

import React, { useState } from 'react';
import { articleService } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function ArticlesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    status: 'DRAFT',
  });

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const data = await articleService.getAllArticles();
      setArticles(data);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchArticles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await articleService.createArticle({
        ...formData,
        status: formData.status as 'DRAFT' | 'PUBLISHED'
      });
      fetchArticles();
      resetForm();
    } catch (error) {
      console.error('Failed to create article:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      status: 'DRAFT',
    });
    setIsCreateDialogOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus artikel ini?')) {
      try {
        await articleService.deleteArticle(id);
        fetchArticles();
      } catch (error) {
        console.error('Failed to delete article:', error);
      }
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await articleService.publishArticle(id);
      fetchArticles();
    } catch (error) {
      console.error('Failed to publish article:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manajemen Artikel</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Tambah Artikel</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tambah Artikel Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Judul</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="excerpt">Ringkasan</Label>
                <Input
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Ringkasan artikel (opsional)"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Diterbitkan</option>
                </select>
              </div>
              <div>
                <Label htmlFor="content">Konten</Label>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-2 border rounded h-32"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Batal
                </Button>
                <Button type="submit">Simpan</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles?.map((article: any) => (
          <Card key={article.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
                <Badge className={getStatusColor(article.status)}>
                  {article.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {article.excerpt && (
                  <p className="text-sm text-gray-600 line-clamp-3">{article.excerpt}</p>
                )}
                <p className="text-xs text-gray-500">
                  Author: {article.author?.name || '-'}
                </p>
                <p className="text-xs text-gray-500">
                  Dibuat: {format(new Date(article.created_at), 'dd MMM yyyy', { locale: id })}
                </p>
                {article.published_at && (
                  <p className="text-xs text-gray-500">
                    Diterbitkan: {format(new Date(article.published_at), 'dd MMM yyyy', { locale: id })}
                  </p>
                )}
              </div>
              <div className="mt-4 flex space-x-2">
                {article.status === 'DRAFT' && (
                  <Button size="sm" onClick={() => handlePublish(article.id)}>
                    Terbitkan
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => handleDelete(article.id)}>
                  Hapus
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semua Artikel</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles?.map((article: any) => (
                <TableRow key={article.id}>
                  <TableCell className="max-w-xs truncate">{article.title}</TableCell>
                  <TableCell>{article.author?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(article.status)}>
                      {article.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(article.created_at), 'dd MMM yyyy', { locale: id })}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {article.status === 'DRAFT' && (
                        <Button size="sm" onClick={() => handlePublish(article.id)}>
                          Terbitkan
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(article.id)}>
                        Hapus
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
