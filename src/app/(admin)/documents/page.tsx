"use client";

import React, { useState, useEffect } from 'react';
import { documentService } from '@/services';
import { Document } from '@/services/documentService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function DocumentsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccessLevel, setFilterAccessLevel] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter and paginate documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === '' || 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAccessLevel = filterAccessLevel === '' || 
      doc.access_level === filterAccessLevel;
    
    return matchesSearch && matchesAccessLevel;
  });

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDocuments = filteredDocuments.slice(startIndex, startIndex + itemsPerPage);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    access_level: 'PUBLIC' as 'PUBLIC' | 'BOARD' | 'EXECUTIVE',
  });

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await documentService.getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setError('Gagal memuat dokumen');
    } finally {
      setLoading(false);
    }
  };

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  React.useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = documentService.validateFile(file);
      if (!validation.valid) {
        setError(validation.error || 'File tidak valid');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      const validation = documentService.validateFile(file);
      if (!validation.valid) {
        setError(validation.error || 'File tidak valid');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validation for upload
    if (!editingDocument && !selectedFile) {
      setError('File harus dipilih!');
      return;
    }

    try {
      if (editingDocument) {
        // Update metadata only
        await documentService.updateDocument(editingDocument.id, {
          title: formData.title,
          description: formData.description || undefined,
          access_level: formData.access_level,
        });
        setSuccessMessage('Dokumen berhasil diupdate!');
      } else {
        // Upload new document
        await documentService.uploadDocument({
          document: selectedFile!,
          title: formData.title,
          description: formData.description || undefined,
          access_level: formData.access_level,
        });
        setSuccessMessage('Dokumen berhasil diupload!');
      }
      
      await fetchDocuments();
      resetForm();
    } catch (error: any) {
      console.error('Failed to save document:', error);
      setError(error.response?.data?.message || 'Gagal menyimpan dokumen');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      access_level: 'PUBLIC',
    });
    setSelectedFile(null);
    setEditingDocument(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (doc: Document) => {
    setEditingDocument(doc);
    setFormData({
      title: doc.title,
      description: doc.description || '',
      access_level: doc.access_level,
    });
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  const openUploadDialog = () => {
    setEditingDocument(null);
    setFormData({
      title: '',
      description: '',
      access_level: 'PUBLIC',
    });
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus dokumen ini?')) {
      try {
        await documentService.deleteDocument(id);
        setSuccessMessage('Dokumen berhasil dihapus!');
        await fetchDocuments();
      } catch (error: any) {
        console.error('Failed to delete document:', error);
        setError(error.response?.data?.message || 'Gagal menghapus dokumen');
      }
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const blob = await documentService.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Failed to download document:', error);
      setError('Gagal mendownload dokumen');
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'PUBLIC': return 'bg-green-500 text-white';
      case 'BOARD': return 'bg-blue-500 text-white';
      case 'EXECUTIVE': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getAccessLevelLabel = (level: string) => {
    switch (level) {
      case 'PUBLIC': return 'Publik';
      case 'BOARD': return 'Board';
      case 'EXECUTIVE': return 'Executive';
      default: return level;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Arsip Dokumen</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openUploadDialog}>Upload Dokumen</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingDocument ? 'Edit Dokumen' : 'Upload Dokumen Baru'}</DialogTitle>
            </DialogHeader>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            {successMessage && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{successMessage}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingDocument && (
                <div>
                  <Label>File Dokumen *</Label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
                      isDragging 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="file"
                      id="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    />
                    <label htmlFor="file" className="cursor-pointer">
                      {selectedFile ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatFileSize(selectedFile.size)}
                          </p>
                          <p className="text-xs text-blue-600 mt-2">Klik untuk ganti file</p>
                        </div>
                      ) : (
                        <div>
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Drag & drop file atau <span className="text-blue-600">klik untuk pilih</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT (Max 5MB)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {editingDocument && (
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    File saat ini: {editingDocument.file_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    (Upload file baru tidak didukung saat edit. Hapus dan upload ulang untuk ganti file)
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="title">Judul Dokumen *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Laporan Keuangan Q4 2024"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi singkat tentang dokumen..."
                  className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 min-h-[80px]"
                />
              </div>

              <div>
                <Label htmlFor="access_level">Tingkat Akses *</Label>
                <select
                  id="access_level"
                  value={formData.access_level}
                  onChange={(e) => setFormData({ ...formData, access_level: e.target.value as any })}
                  className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="PUBLIC">Publik (Semua user)</option>
                  <option value="BOARD">Board (Director & Executive)</option>
                  <option value="EXECUTIVE">Executive (P, VP, SEC only)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Tentukan siapa yang bisa mengakses dokumen ini
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingDocument ? 'Update' : 'Upload'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Global Messages */}
      {error && !isDialogOpen && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {successMessage && !isDialogOpen && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      {/* Search & Filter Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Cari Dokumen</Label>
              <Input
                id="search"
                placeholder="Cari judul atau nama file..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="filterAccessLevel">Filter Akses</Label>
              <select
                id="filterAccessLevel"
                value={filterAccessLevel}
                onChange={(e) => setFilterAccessLevel(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="">Semua Tingkat Akses</option>
                <option value="PUBLIC">Publik</option>
                <option value="BOARD">Board</option>
                <option value="EXECUTIVE">Executive</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterAccessLevel('');
                }}
              >
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Dokumen</CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedDocuments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm || filterAccessLevel
                ? 'Tidak ada dokumen yang sesuai dengan filter.'
                : 'Belum ada dokumen. Klik "Upload Dokumen" untuk menambahkan yang baru.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dokumen
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Akses
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ukuran
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diupload
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedDocuments.map((doc: Document) => (
                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                            <svg className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {doc.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {doc.file_name}
                            </div>
                            {doc.description && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-md line-clamp-2">
                                {doc.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={getAccessLevelColor(doc.access_level)}>
                          {getAccessLevelLabel(doc.access_level)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(doc.file_size)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <div>
                          {doc.created_at ? format(new Date(doc.created_at), 'dd MMM yyyy', { locale: id }) : '-'}
                        </div>
                        {doc.uploader && (
                          <div className="text-xs text-gray-400">
                            oleh {doc.uploader.name}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDownload(doc)}
                          >
                            Download
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleEdit(doc)}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDelete(doc.id)}
                          >
                            Hapus
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredDocuments.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Label htmlFor="itemsPerPage">Items per page:</Label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredDocuments.length)} of {filteredDocuments.length}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
