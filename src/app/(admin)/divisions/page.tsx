"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { userService } from '@/services/userService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Division {
  id: number;
  name: string;
  description?: string;
  sub_divisions?: Array<{
    id: number;
    name: string;
    division_id: number;
  }>;
  users?: Array<{
    id: number;
    name: string;
    email: string;
    position?: string;
  }>;
}

export default function DivisionsPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDivisions();
  }, []);

  const loadDivisions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await userService.getDivisions();
      setDivisions(data);
    } catch (err: any) {
      console.error('Failed to load divisions:', err);
      setError(err.message || 'Failed to load divisions');
    } finally {
      setLoading(false);
    }
  };

  const filteredDivisions = divisions.filter(division =>
    division.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (division.description && division.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f936c] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading divisions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Divisi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Daftar divisi dan sub-divisi organisasi
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Cari Divisi</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="search">Pencarian</Label>
            <Input
              id="search"
              placeholder="Cari nama divisi atau deskripsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Divisions Grid */}
      {filteredDivisions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'Tidak ada divisi yang ditemukan.' : 'Belum ada divisi.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDivisions.map(division => (
            <Link 
              key={division.id} 
              href={`/divisions/${division.id}`}
              className="block"
            >
              <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{division.name}</CardTitle>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {division.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {division.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    {/* Sub-divisions count */}
                    <div className="flex items-center text-sm">
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">
                        {division.sub_divisions?.length || 0} Sub-Divisi
                      </span>
                    </div>

                    {/* Members count */}
                    <div className="flex items-center text-sm">
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">
                        {division.users?.length || 0} Anggota
                      </span>
                    </div>
                  </div>

                  {/* Sub-divisions badges */}
                  {division.sub_divisions && division.sub_divisions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Sub-Divisi:</p>
                      <div className="flex flex-wrap gap-1">
                        {division.sub_divisions.slice(0, 3).map(subDiv => (
                          <Badge key={subDiv.id} variant="secondary" className="text-xs">
                            {subDiv.name}
                          </Badge>
                        ))}
                        {division.sub_divisions.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{division.sub_divisions.length - 3} lainnya
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Statistik</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Divisi</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-2">
                {divisions.length}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Sub-Divisi</p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-2">
                {divisions.reduce((acc, div) => acc + (div.sub_divisions?.length || 0), 0)}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Total Anggota</p>
              <p className="text-3xl font-bold text-purple-700 dark:text-purple-300 mt-2">
                {divisions.reduce((acc, div) => acc + (div.users?.length || 0), 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
