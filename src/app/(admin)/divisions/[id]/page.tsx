"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { userService } from '@/services/userService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface User {
  id: number;
  name: string;
  email: string;
  position?: string;
  sub_division?: {
    id: number;
    name: string;
  };
  roles?: Array<{
    id: number;
    name: string;
  }>;
}

interface SubDivision {
  id: number;
  name: string;
  division_id: number;
}

interface Division {
  id: number;
  name: string;
  description?: string;
  sub_divisions?: SubDivision[];
  users?: User[];
}

const POSITION_LABELS: Record<string, string> = {
  'P': 'President',
  'VP': 'Vice President',
  'SEC': 'Secretary',
  'DIRECTOR': 'Director',
  'MANAGER': 'Manager',
  'STAFF': 'Staff',
};

export default function DivisionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const divisionId = params.id as string;

  const [division, setDivision] = useState<Division | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'subdivisions'>('members');

  useEffect(() => {
    if (divisionId) {
      loadDivisionData();
    }
  }, [divisionId]);

  const loadDivisionData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [divisionData, membersData] = await Promise.all([
        userService.getDivision(parseInt(divisionId)),
        userService.getDivisionMembers(parseInt(divisionId)),
      ]);

      setDivision(divisionData);
      setMembers(membersData);
    } catch (err: any) {
      console.error('Failed to load division data:', err);
      setError(err.message || 'Failed to load division data');
    } finally {
      setLoading(false);
    }
  };

  const getPositionBadgeColor = (position?: string) => {
    if (!position) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    
    switch (position) {
      case 'P':
      case 'VP':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'DIRECTOR':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'MANAGER':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'SEC':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getMembersBySubDivision = (subDivisionId: number) => {
    return members.filter(member => member.sub_division?.id === subDivisionId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f936c] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading division details...</p>
        </div>
      </div>
    );
  }

  if (error || !division) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-12">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-600 dark:text-red-400 mb-4">
              {error || 'Division not found'}
            </p>
            <Button onClick={() => router.push('/divisions')} variant="outline">
              Kembali ke Daftar Divisi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button 
          onClick={() => router.push('/divisions')} 
          variant="outline"
          size="sm"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {division.name}
          </h1>
          {division.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {division.description}
            </p>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Anggota</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {members.length}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sub-Divisi</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {division.sub_divisions?.length || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Posisi Tertinggi</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-2">
                  {members.find(m => m.position === 'DIRECTOR')
                    ? 'Director'
                    : members.find(m => m.position === 'MANAGER')
                    ? 'Manager'
                    : 'Staff'}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('members')}
              className={`pb-3 px-4 font-medium text-sm transition-colors ${
                activeTab === 'members'
                  ? 'border-b-2 border-[#0f936c] text-[#0f936c]'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Anggota ({members.length})
            </button>
            <button
              onClick={() => setActiveTab('subdivisions')}
              className={`pb-3 px-4 font-medium text-sm transition-colors ${
                activeTab === 'subdivisions'
                  ? 'border-b-2 border-[#0f936c] text-[#0f936c]'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Sub-Divisi ({division.sub_divisions?.length || 0})
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'members' ? (
            // Members Table
            members.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400">Belum ada anggota di divisi ini.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Posisi</TableHead>
                      <TableHead>Sub-Divisi</TableHead>
                      <TableHead>Roles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map(member => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Badge className={getPositionBadgeColor(member.position)}>
                            {POSITION_LABELS[member.position || ''] || member.position || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {member.sub_division?.name || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {member.roles?.map(role => (
                              <Badge key={role.id} variant="secondary" className="text-xs">
                                {role.name}
                              </Badge>
                            )) || '-'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : (
            // Sub-divisions List
            division.sub_divisions && division.sub_divisions.length > 0 ? (
              <div className="space-y-4">
                {division.sub_divisions.map(subDiv => {
                  const subDivMembers = getMembersBySubDivision(subDiv.id);
                  return (
                    <Card key={subDiv.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{subDiv.name}</CardTitle>
                          <Badge variant="outline">
                            {subDivMembers.length} Anggota
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {subDivMembers.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {subDivMembers.map(member => (
                              <div 
                                key={member.id}
                                className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2"
                              >
                                <div className="h-8 w-8 bg-[#0f936c] rounded-full flex items-center justify-center text-white font-medium text-sm">
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {member.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {POSITION_LABELS[member.position || ''] || member.position || 'Staff'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Belum ada anggota di sub-divisi ini.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400">Belum ada sub-divisi di divisi ini.</p>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
