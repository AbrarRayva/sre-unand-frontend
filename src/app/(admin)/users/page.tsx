"use client";

import React, { useState, useEffect } from 'react';
import { userService } from '@/services';
import { User } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Division {
  id: number;
  name: string;
  description?: string;
  sub_divisions?: SubDivision[];
}

interface SubDivision {
  id: number;
  name: string;
  division_id: number;
}

interface Role {
  id: number;
  name: string;
  permissions?: any[];
}

const POSITIONS = [
  { value: 'STAFF', label: 'Staff' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'DIRECTOR', label: 'Director' },
  { value: 'SEC', label: 'Secretary' },
  { value: 'VP', label: 'Vice President' },
  { value: 'P', label: 'President' },
] as const;

export default function UsersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter and paginate users
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDivision = filterDivision === '' || 
      user.division_id?.toString() === filterDivision;
    
    const matchesPosition = filterPosition === '' || 
      user.position === filterPosition;
    
    return matchesSearch && matchesDivision && matchesPosition;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    position: 'STAFF' as const,
    division_id: '',
    sub_division_id: '',
    roles: [] as number[],
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
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

  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const data = await userService.getRoles();
      setRoles(data);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setLoadingRoles(false);
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
    fetchUsers();
    fetchDivisions();
    fetchRoles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    
    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        position: formData.position,
        division_id: parseInt(formData.division_id),
        sub_division_id: parseInt(formData.sub_division_id),
        roles: formData.roles,
      };

      if (editingUser) {
        // Update existing user
        await userService.updateUser(Number(editingUser.id), userData);
        setSuccessMessage('User berhasil diupdate!');
      } else {
        // Create new user
        await userService.createUser(userData);
        setSuccessMessage('User berhasil ditambahkan!');
      }
      
      await fetchUsers();
      resetForm();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Failed to save user:', error);
      setError(error.response?.data?.message || error.message || 'Gagal menyimpan user');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't show password
      position: (user.position || 'STAFF') as any,
      division_id: user.division_id?.toString() || '',
      sub_division_id: user.sub_division_id?.toString() || '',
      roles: user.roles?.map((r: any) => r.id) || [],
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const toggleRole = (roleId: number) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(roleId)
        ? prev.roles.filter(id => id !== roleId)
        : [...prev.roles, roleId],
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      position: 'STAFF',
      division_id: '',
      sub_division_id: '',
      roles: [],
    });
    setEditingUser(null);
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      try {
        await userService.deleteUser(id);
        fetchUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manajemen User</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>Tambah User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Tambah User Baru'}</DialogTitle>
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
                <Label htmlFor="name">Nama</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              {!editingUser && (
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              )}
              <div>
                <Label htmlFor="position">Posisi</Label>
                <select
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value as any })}
                  className="w-full p-2 border rounded"
                >
                  <option value="STAFF">Staff</option>
                  <option value="MANAGER">Manager</option>
                  <option value="DIRECTOR">Director</option>
                  <option value="SEC">Secretary</option>
                  <option value="VP">Vice President</option>
                  <option value="P">President</option>
                </select>
              </div>
              <div>
                <Label htmlFor="division_id">Divisi *</Label>
                <select
                  id="division_id"
                  value={formData.division_id}
                  onChange={(e) => setFormData({ ...formData, division_id: e.target.value, sub_division_id: '' })}
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
                <Label htmlFor="sub_division_id">Sub Divisi *</Label>
                <select
                  id="sub_division_id"
                  value={formData.sub_division_id}
                  onChange={(e) => setFormData({ ...formData, sub_division_id: e.target.value })}
                  className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  required
                  disabled={!formData.division_id || loadingDivisions}
                >
                  <option value="">Pilih Sub Divisi</option>
                  {formData.division_id && divisions
                    .find(d => d.id === parseInt(formData.division_id))
                    ?.sub_divisions?.map(subDiv => (
                      <option key={subDiv.id} value={subDiv.id}>{subDiv.name}</option>
                    ))}
                </select>
                {!formData.division_id && <p className="text-xs text-gray-500 mt-1">Pilih divisi terlebih dahulu</p>}
              </div>
              <div>
                <Label>Roles *</Label>
                {loadingRoles ? (
                  <p className="text-sm text-gray-500">Loading roles...</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700">
                    {roles.map(role => (
                      <label key={role.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.roles.includes(role.id)}
                          onChange={() => toggleRole(role.id)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{role.name}</span>
                      </label>
                    ))}
                  </div>
                )}
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

      {/* Search & Filter Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Cari User</Label>
              <Input
                id="search"
                placeholder="Cari nama atau email..."
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
              <Label htmlFor="filterPosition">Filter Posisi</Label>
              <select
                id="filterPosition"
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="">Semua Posisi</option>
                <option value="STAFF">Staff</option>
                <option value="MANAGER">Manager</option>
                <option value="DIRECTOR">Director</option>
                <option value="SEC">Secretary</option>
                <option value="VP">Vice President</option>
                <option value="P">President</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterDivision('');
                  setFilterPosition('');
                }}
              >
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar User</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Posisi</TableHead>
                <TableHead>Divisi</TableHead>
                <TableHead>Sub-Divisi</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {searchTerm || filterDivision || filterPosition 
                      ? 'Tidak ada user yang sesuai dengan filter.'
                      : 'Belum ada user. Klik "Tambah User" untuk menambahkan user baru.'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers?.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.position || '-'}</Badge>
                  </TableCell>
                  <TableCell>{user.division?.name || '-'}</TableCell>
                  <TableCell>
                    {user.sub_division?.name || user.subDivision?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles?.map((role: any) => (
                        <Badge key={role.id} variant="secondary" className="text-xs">
                          {role.name}
                        </Badge>
                      )) || <span className="text-gray-500 text-sm">-</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(Number(user.id))}>
                        Hapus
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
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
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length}
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
    </div>
  );
}