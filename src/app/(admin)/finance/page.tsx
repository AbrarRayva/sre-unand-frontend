"use client";

import React, { useState } from 'react';
import { 
  useFinancePeriods, 
  useCreatePeriod, 
  useUpdatePeriod, 
  useDeletePeriod,
  useFinanceStatistics 
} from '@/hooks';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function FinancePage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    late_fee_per_day: '',
    due_date: '',
    is_active: true,
  });

  const { data: periods, isLoading } = useFinancePeriods();
  const createPeriodMutation = useCreatePeriod();
  const updatePeriodMutation = useUpdatePeriod();
  const deletePeriodMutation = useDeletePeriod();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const periodData = {
      name: formData.name,
      amount: parseFloat(formData.amount),
      late_fee_per_day: parseFloat(formData.late_fee_per_day),
      due_date: formData.due_date,
      is_active: formData.is_active,
    };

    if (editingPeriod) {
      updatePeriodMutation.mutate({ 
        id: editingPeriod.id, 
        data: periodData 
      });
    } else {
      createPeriodMutation.mutate(periodData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      late_fee_per_day: '',
      due_date: '',
      is_active: true,
    });
    setEditingPeriod(null);
    setIsCreateDialogOpen(false);
  };

  const handleEdit = (period: any) => {
    setEditingPeriod(period);
    setFormData({
      name: period.name,
      amount: period.amount.toString(),
      late_fee_per_day: period.late_fee_per_day.toString(),
      due_date: period.due_date,
      is_active: period.is_active,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus periode ini?')) {
      deletePeriodMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manajemen Kas</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingPeriod(null)}>
              Tambah Periode
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPeriod ? 'Edit Periode' : 'Tambah Periode Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Periode</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount">Jumlah</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="late_fee_per_day">Denda per Hari</Label>
                <Input
                  id="late_fee_per_day"
                  type="number"
                  value={formData.late_fee_per_day}
                  onChange={(e) => setFormData({ ...formData, late_fee_per_day: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="due_date">Tanggal Jatuh Tempo</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <Label htmlFor="is_active">Aktif</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Batal
                </Button>
                <Button type="submit" disabled={createPeriodMutation.isPending || updatePeriodMutation.isPending}>
                  {editingPeriod ? 'Update' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {periods?.map((period: any) => (
          <Card key={period.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{period.name}</CardTitle>
              <Badge variant={period.is_active ? "default" : "secondary"}>
                {period.is_active ? "Aktif" : "Tidak Aktif"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {period.amount.toLocaleString('id-ID')}</div>
              <p className="text-xs text-muted-foreground">
                Denda: Rp {period.late_fee_per_day.toLocaleString('id-ID')}/hari
              </p>
              <p className="text-xs text-muted-foreground">
                Jatuh Tempo: {format(new Date(period.due_date), 'dd MMM yyyy', { locale: id })}
              </p>
              <div className="mt-4 flex space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(period)}>
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(period.id)}>
                  Hapus
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semua Periode</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Denda/Hari</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods?.map((period: any) => (
                <TableRow key={period.id}>
                  <TableCell>{period.name}</TableCell>
                  <TableCell>Rp {period.amount.toLocaleString('id-ID')}</TableCell>
                  <TableCell>Rp {period.late_fee_per_day.toLocaleString('id-ID')}</TableCell>
                  <TableCell>
                    {format(new Date(period.due_date), 'dd MMM yyyy', { locale: id })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={period.is_active ? "default" : "secondary"}>
                      {period.is_active ? "Aktif" : "Tidak Aktif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(period)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(period.id)}>
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
