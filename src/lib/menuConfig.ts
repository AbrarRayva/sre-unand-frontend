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
    key: 'profile',
    label: 'Profile',
    icon: 'UserIcon',
    route: '/profile',
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
      },
      {
        key: 'cash-periods',
        label: 'Periode Kas',
        route: '/finance/periods',
        requiredPermissions: ['cash.manage'],
      },
      {
        key: 'cash-statistics',
        label: 'Statistik',
        route: '/finance/statistics',
        requiredPermissions: ['cash.manage'],
      },
    ],
  },
  {
    key: 'work-programs',
    label: 'Program Kerja',
    icon: 'ClipboardDocumentListIcon',
    route: '/work-programs',
    requiredPermissions: ['work_programs.view'],
  },
  {
    key: 'articles',
    label: 'Artikel',
    icon: 'NewspaperIcon',
    children: [
      {
        key: 'articles-public',
        label: 'Artikel Publik',
        route: '/articles/public',
      },
      {
        key: 'articles-admin',
        label: 'Kelola Artikel',
        route: '/articles/admin',
        requiredPermissions: ['articles.manage'],
      },
    ],
  },
  {
    key: 'documents',
    label: 'Arsip Dokumen',
    icon: 'DocumentIcon',
    route: '/documents',
    requiredPermissions: ['documents.view'],
  },
  {
    key: 'users',
    label: 'Manajemen User',
    icon: 'UsersIcon',
    route: '/users',
    requiredPermissions: ['users.view'],
  },
  {
    key: 'divisions',
    label: 'Divisi',
    icon: 'BuildingOfficeIcon',
    children: [
      {
        key: 'divisions-list',
        label: 'Daftar Divisi',
        route: '/divisions',
        requiredPermissions: ['divisions.view'],
      },
    ],
  },
];

export const hasPermission = (user: User | null, permissions?: string[], roles?: string[]): boolean => {
  if (!user) return false;
  
  // Check roles first (from roles array or single role field)
  const userRoles = user.roles || (user.role ? [user.role] : []);
  if (roles && roles.length > 0) {
    const hasRole = roles.some(role => userRoles.includes(role));
    if (!hasRole) return false;
  }
  
  // Check permissions (with fallback for ADMIN having all permissions)
  if (permissions && permissions.length > 0) {
    // ADMIN has all permissions
    if (userRoles.includes('ADMIN')) {
      return true;
    }
    
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
