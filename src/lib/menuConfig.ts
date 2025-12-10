import { User } from './auth';

export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  route?: string;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  children?: MenuItem[];
}

export const menuConfig: MenuItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'HomeIcon',
    route: '/dashboard',
  },
  {
    key: 'finance',
    label: 'Keuangan',
    icon: 'BanknotesIcon',
    requiredPermissions: ['cash.view_own'],
    children: [
      {
        key: 'my-transactions',
        label: 'Transaksi Saya',
        route: '/finance/my-transactions',
        requiredPermissions: ['cash.view_own'],
      },
      {
        key: 'cash-management',
        label: 'Manajemen Kas',
        route: '/finance/admin',
        requiredPermissions: ['cash.manage'],
        requiredRoles: ['Finance', 'ADMIN'],
      },
      {
        key: 'cash-periods',
        label: 'Periode Kas',
        route: '/finance/periods',
        requiredPermissions: ['cash.manage'],
        requiredRoles: ['Finance', 'ADMIN'],
      },
    ],
  },
  {
    key: 'work-programs',
    label: 'Program Kerja',
    icon: 'ClipboardDocumentListIcon',
    requiredPermissions: ['work_programs.view'],
    children: [
      {
        key: 'programs-list',
        label: 'Daftar Proker',
        route: '/work-programs',
        requiredPermissions: ['work_programs.view'],
      },
      {
        key: 'programs-manage',
        label: 'Kelola Proker',
        route: '/work-programs/admin',
        requiredPermissions: ['work_programs.manage'],
        requiredRoles: ['Director', 'ADMIN'],
      },
    ],
  },
  {
    key: 'articles',
    label: 'Artikel',
    icon: 'NewspaperIcon',
    requiredPermissions: ['articles.view'],
    children: [
      {
        key: 'articles-public',
        label: 'Artikel Publik',
        route: '/articles/public',
        requiredPermissions: ['articles.view'],
      },
      {
        key: 'articles-admin',
        label: 'Kelola Artikel',
        route: '/articles/admin',
        requiredPermissions: ['articles.manage'],
        requiredRoles: ['Media', 'ADMIN'],
      },
    ],
  },
  {
    key: 'documents',
    label: 'Arsip Dokumen',
    icon: 'DocumentIcon',
    requiredPermissions: ['documents.view'],
    children: [
      {
        key: 'documents-list',
        label: 'Daftar Dokumen',
        route: '/documents',
        requiredPermissions: ['documents.view'],
      },
      {
        key: 'documents-upload',
        label: 'Upload Dokumen',
        route: '/documents/upload',
        requiredPermissions: ['documents.manage'],
        requiredRoles: ['Secretary', 'ADMIN'],
      },
    ],
  },
  {
    key: 'users',
    label: 'Manajemen User',
    icon: 'UsersIcon',
    requiredPermissions: ['users.view'],
    requiredRoles: ['HR', 'ADMIN'],
    children: [
      {
        key: 'users-list',
        label: 'Daftar User',
        route: '/users',
        requiredPermissions: ['users.view'],
        requiredRoles: ['HR', 'ADMIN'],
      },
      {
        key: 'users-manage',
        label: 'Kelola User',
        route: '/users/admin',
        requiredPermissions: ['users.manage'],
        requiredRoles: ['HR', 'ADMIN'],
      },
    ],
  },
  {
    key: 'divisions',
    label: 'Divisi',
    icon: 'BuildingOfficeIcon',
    requiredPermissions: ['divisions.view'],
    children: [
      {
        key: 'divisions-list',
        label: 'Daftar Divisi',
        route: '/divisions',
        requiredPermissions: ['divisions.view'],
      },
    ],
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: 'UserIcon',
    route: '/profile',
  },
];

export const hasPermission = (user: User | null, permissions?: string[], roles?: string[]): boolean => {
  if (!user) return false;
  
  // Check roles
  if (roles && roles.length > 0) {
    const hasRole = roles.includes(user.role);
    if (!hasRole) return false;
  }
  
  // Check permissions
  if (permissions && permissions.length > 0) {
    const userPermissions = user.permissions || [];
    const hasAllPermissions = permissions.every(permission => 
      userPermissions.includes(permission)
    );
    if (!hasAllPermissions) return false;
  }
  
  return true;
};

export const filterMenuByPermissions = (menu: MenuItem[], user: User | null): MenuItem[] => {
  return menu
    .filter(item => hasPermission(user, item.requiredPermissions, item.requiredRoles))
    .map(item => ({
      ...item,
      children: item.children 
        ? filterMenuByPermissions(item.children, user)
        : undefined
    }))
    .filter(item => !item.children || item.children.length > 0);
};
