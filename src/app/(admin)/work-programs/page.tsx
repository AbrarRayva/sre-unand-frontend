"use client";

import React, { useState, useEffect } from 'react';
import { workProgramService, userService } from '@/services';
import { WorkProgram } from '@/services/workProgramService';
import { User } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Division {
  id: number;
  name: string;
  description?: string;
  sub_divisions?: any[];
}

export default function WorkProgramsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [workPrograms, setWorkPrograms] = useState<WorkProgram[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingProgram, setEditingProgram] = useState<WorkProgram | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Filter and paginate programs
  const filteredPrograms = workPrograms.filter(program => {
    const matchesSearch = searchTerm === '' || 
      program.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDivision = filterDivision === '' || 
      program.division_id?.toString() === filterDivision;
    
    const matchesStatus = filterStatus === '' || 
      program.status === filterStatus;
    
    return matchesSearch && matchesDivision && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPrograms = filteredPrograms.slice(startIndex, startIndex + itemsPerPage);
  
  const [formData, setFormData] = useState({
    name: '',
    division_id: '',
    targets: '',
    status: 'PLANNED' as 'PLANNED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED',
    pic_ids: [] as number[],
  });

  const fetchWorkPrograms = async () => {
    setLoading(true);
    try {
      const data = await workProgramService.getWorkPrograms();
      setWorkPrograms(data);
    } catch (error) {
      console.error('Failed to fetch work programs:', error);
      setError('Gagal memuat program kerja');
    } finally {
      setLoading(false);
    }
  };

  const fetchDivisions = async () => {
    setLoadingDivisions(true);
    try {
      const data = await userService.getDivisions();
      setDivisions(data);
    } catch (error) {
      console.error('Failed to fetch divisions:', error);
    } finally {
      setLoadingDivisions(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoadingUsers(false);
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
    fetchWorkPrograms();
    fetchDivisions();
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validation
    if (!formData.division_id || formData.division_id === '') {
      setError('Divisi harus dipilih!');
      return;
    }

    if (formData.pic_ids.length === 0) {
      setError('Minimal 1 PIC harus dipilih!');
      return;
    }

    try {
      const programData = {
        name: formData.name,
        division_id: parseInt(formData.division_id),
        targets: formData.targets.split('\n').filter(t => t.trim() !== ''),
        status: formData.status,
        pic_ids: formData.pic_ids,
      };

      if (editingProgram) {
        await workProgramService.updateWorkProgram(editingProgram.id, programData);
        setSuccessMessage('Program kerja berhasil diupdate!');
      } else {
        await workProgramService.createWorkProgram(programData);
        setSuccessMessage('Program kerja berhasil dibuat!');
      }
      
      await fetchWorkPrograms();
      resetForm();
    } catch (error: any) {
      console.error('Failed to save work program:', error);
      setError(error.response?.data?.message || 'Gagal menyimpan program kerja');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      division_id: '',
      targets: '',
      status: 'PLANNED',
      pic_ids: [],
    });
    setEditingProgram(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (program: WorkProgram) => {
    setEditingProgram(program);
    setFormData({
      name: program.name,
      division_id: program.division_id?.toString() || '',
      targets: program.targets?.join('\n') || '',
      status: program.status || 'PLANNED',
      pic_ids: program.pic_ids || [],
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingProgram(null);
    setFormData({
      name: '',
      division_id: '',
      targets: '',
      status: 'PLANNED',
      pic_ids: [],
    });
    setIsDialogOpen(true);
  };

  const togglePIC = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      pic_ids: prev.pic_ids.includes(userId)
        ? prev.pic_ids.filter(id => id !== userId)
        : [...prev.pic_ids, userId],
    }));
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus program kerja ini?')) {
      try {
        await workProgramService.deleteWorkProgram(id);
        setSuccessMessage('Program kerja berhasil dihapus!');
        await fetchWorkPrograms();
      } catch (error: any) {
        console.error('Failed to delete work program:', error);
        setError(error.response?.data?.message || 'Gagal menghapus program kerja');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-500 text-white';
      case 'ONGOING': return 'bg-blue-500 text-white';
      case 'CANCELLED': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Selesai';
      case 'ONGOING': return 'Berjalan';
      case 'CANCELLED': return 'Dibatalkan';
      case 'PLANNED': return 'Direncanakan';
      default: return status;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Program Kerja</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>Tambah Program Kerja</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProgram ? 'Edit Program Kerja' : 'Tambah Program Kerja Baru'}</DialogTitle>
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
              <div>
                <Label htmlFor="name">Nama Program Kerja *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Workshop Kepemimpinan"
                  required
                />
              </div>

              <div>
                <Label htmlFor="division_id">Divisi *</Label>
                <select
                  id="division_id"
                  value={formData.division_id}
                  onChange={(e) => setFormData({ ...formData, division_id: e.target.value })}
                  className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  required
                  disabled={loadingDivisions}
                >
                  <option value="">Pilih Divisi</option>
                  {divisions.map(div => (
                    <option key={div.id} value={div.id}>{div.name}</option>
                  ))}
                </select>
                {loadingDivisions && <p className="text-xs text-gray-500 mt-1">Loading divisions...</p>}
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="PLANNED">Direncanakan</option>
                  <option value="ONGOING">Sedang Berjalan</option>
                  <option value="COMPLETED">Selesai</option>
                  <option value="CANCELLED">Dibatalkan</option>
                </select>
              </div>

              <div>
                <Label htmlFor="targets">Target (satu per baris) *</Label>
                <textarea
                  id="targets"
                  value={formData.targets}
                  onChange={(e) => setFormData({ ...formData, targets: e.target.value })}
                  placeholder="Target 1&#10;Target 2&#10;Target 3"
                  className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 min-h-[100px]"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Tulis satu target per baris</p>
              </div>

              <div>
                <Label>PIC (Person In Charge) *</Label>
                {loadingUsers ? (
                  <p className="text-sm text-gray-500">Loading users...</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 max-h-[200px] overflow-y-auto">
                    {users.map(user => (
                      <label key={user.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.pic_ids.includes(Number(user.id))}
                          onChange={() => togglePIC(Number(user.id))}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{user.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Pilih minimal 1 PIC</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Cari Program</Label>
              <Input
                id="search"
                placeholder="Cari nama program..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="filterDivision">Filter Divisi</Label>
              <select
                id="filterDivision"
                value={filterDivision}
                onChange={(e) => setFilterDivision(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="">Semua Divisi</option>
                {divisions.map(div => (
                  <option key={div.id} value={div.id}>{div.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="filterStatus">Filter Status</Label>
              <select
                id="filterStatus"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="">Semua Status</option>
                <option value="PLANNED">Direncanakan</option>
                <option value="ONGOING">Sedang Berjalan</option>
                <option value="COMPLETED">Selesai</option>
                <option value="CANCELLED">Dibatalkan</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterDivision('');
                  setFilterStatus('');
                }}
              >
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Programs Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {paginatedPrograms.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            {searchTerm || filterDivision || filterStatus 
              ? 'Tidak ada program kerja yang sesuai dengan filter.'
              : 'Belum ada program kerja. Klik "Tambah Program Kerja" untuk membuat yang baru.'}
          </div>
        ) : (
          paginatedPrograms.map((program: WorkProgram) => (
            <Card key={program.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2">{program.name}</CardTitle>
                  <Badge className={getStatusColor(program.status)}>
                    {getStatusLabel(program.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Divisi:</p>
                    <p className="text-sm">{program.division?.name || '-'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Target:</p>
                    <ul className="text-sm list-disc list-inside space-y-1">
                      {program.targets?.slice(0, 3).map((target: string, index: number) => (
                        <li key={index} className="line-clamp-1">{target}</li>
                      ))}
                      {program.targets?.length > 3 && (
                        <li className="text-gray-500">+{program.targets.length - 3} target lainnya</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">PIC:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {program.users?.map((user: any) => (
                        <Badge key={user.id} variant="secondary" className="text-xs">
                          {user.name}
                        </Badge>
                      )) || <span className="text-sm text-gray-500">-</span>}
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">
                      Dibuat: {program.created_at ? format(new Date(program.created_at), 'dd MMM yyyy', { locale: id }) : '-'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(program)} className="flex-1">
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(program.id)} className="flex-1">
                    Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {filteredPrograms.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
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
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredPrograms.length)} of {filteredPrograms.length}
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
