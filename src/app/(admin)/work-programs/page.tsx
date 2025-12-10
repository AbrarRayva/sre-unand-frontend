"use client";

import React, { useState } from 'react';
import { workProgramService } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function WorkProgramsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [workPrograms, setWorkPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    division_id: '',
    targets: '',
    status: 'PLANNED',
    pic_ids: '',
  });

  const fetchWorkPrograms = async () => {
    setLoading(true);
    try {
      const data = await workProgramService.getWorkPrograms();
      setWorkPrograms(data);
    } catch (error) {
      console.error('Failed to fetch work programs:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchWorkPrograms();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const programData = {
        ...formData,
        division_id: parseInt(formData.division_id),
        targets: formData.targets.split(',').map(t => t.trim()),
        pic_ids: formData.pic_ids.split(',').map(id => parseInt(id.trim())),
        status: formData.status as 'PLANNED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED',
      };
      await workProgramService.createWorkProgram(programData);
      fetchWorkPrograms();
      resetForm();
    } catch (error) {
      console.error('Failed to create work program:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      division_id: '',
      targets: '',
      status: 'PLANNED',
      pic_ids: '',
    });
    setIsCreateDialogOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus program kerja ini?')) {
      try {
        await workProgramService.deleteWorkProgram(id);
        fetchWorkPrograms();
      } catch (error) {
        console.error('Failed to delete work program:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'ONGOING': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manajemen Program Kerja</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Tambah Program Kerja</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Program Kerja Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Program</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="division_id">ID Divisi</Label>
                <Input
                  id="division_id"
                  type="number"
                  value={formData.division_id}
                  onChange={(e) => setFormData({ ...formData, division_id: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="targets">Target (pisahkan dengan koma)</Label>
                <Input
                  id="targets"
                  value={formData.targets}
                  onChange={(e) => setFormData({ ...formData, targets: e.target.value })}
                  placeholder="Target 1, Target 2, Target 3"
                  required
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
                  <option value="PLANNED">Direncanakan</option>
                  <option value="ONGOING">Sedang Berjalan</option>
                  <option value="COMPLETED">Selesai</option>
                  <option value="CANCELLED">Dibatalkan</option>
                </select>
              </div>
              <div>
                <Label htmlFor="pic_ids">PIC IDs (pisahkan dengan koma)</Label>
                <Input
                  id="pic_ids"
                  value={formData.pic_ids}
                  onChange={(e) => setFormData({ ...formData, pic_ids: e.target.value })}
                  placeholder="1, 2, 3"
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
        {workPrograms?.map((program: any) => (
          <Card key={program.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{program.name}</CardTitle>
                <Badge className={getStatusColor(program.status)}>
                  {program.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Divisi: {program.division?.name || `ID: ${program.division_id}`}
                </p>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Target:</p>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    {program.targets?.map((target: string, index: number) => (
                      <li key={index}>{target}</li>
                    ))}
                  </ul>
                </div>
                <p className="text-sm text-gray-600">
                  PIC: {program.users?.map((user: any) => user.name).join(', ') || '-'}
                </p>
                <p className="text-xs text-gray-500">
                  Dibuat: {format(new Date(program.created_at), 'dd MMM yyyy', { locale: id })}
                </p>
              </div>
              <div className="mt-4">
                <Button size="sm" variant="destructive" onClick={() => handleDelete(program.id)}>
                  Hapus
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semua Program Kerja</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Divisi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>PIC</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workPrograms?.map((program: any) => (
                <TableRow key={program.id}>
                  <TableCell>{program.name}</TableCell>
                  <TableCell>{program.division?.name || `ID: ${program.division_id}`}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(program.status)}>
                      {program.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {program.users?.map((user: any) => user.name).join(', ') || '-'}
                  </TableCell>
                  <TableCell>
                    {format(new Date(program.created_at), 'dd MMM yyyy', { locale: id })}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(program.id)}>
                      Hapus
                    </Button>
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
