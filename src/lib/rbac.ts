import { authManager } from './auth';

export interface MenuItem {
  id: string;
  title: string;
  icon?: string;
  path: string;
  permissions?: string[];
  roles?: string[];
  children?: MenuItem[];
}

export const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: 'home',
    path: '/dashboard',
  },
  {
    id: 'articles',
    title: 'Articles',
    icon: 'document-text',
    path: '/articles',
    permissions: ['articles.manage'],
    children: [
      {
        id: 'articles-public',
        title: 'Public Articles',
        path: '/articles/public',
      },
      {
        id: 'articles-admin',
        title: 'Manage Articles',
        path: '/articles/admin',
        permissions: ['articles.manage'],
      },
    ],
  },
  {
    id: 'documents',
    title: 'Documents',
    icon: 'folder',
    path: '/documents',
    permissions: ['documents.manage'],
  },
  {
    id: 'work-programs',
    title: 'Work Programs',
    icon: 'briefcase',
    path: '/work-programs',
    permissions: ['work_programs.manage'],
  },
  {
    id: 'cash',
    title: 'Cash Management',
    icon: 'banknotes',
    path: '/cash',
    permissions: ['cash.manage'],
    children: [
      {
        id: 'cash-periods',
        title: 'Periods',
        path: '/cash/periods',
      },
      {
        id: 'cash-transactions',
        title: 'Transactions',
        path: '/cash/transactions',
      },
      {
        id: 'cash-verification',
        title: 'Verification',
        path: '/cash/verification',
        permissions: ['cash.verify'],
      },
    ],
  },
  {
    id: 'users',
    title: 'Users',
    icon: 'users',
    path: '/users',
    permissions: ['users.manage'],
  },
  {
    id: 'divisions',
    title: 'Divisions',
    icon: 'building-office',
    path: '/divisions',
    permissions: ['divisions.manage'],
    children: [
      {
        id: 'divisions-list',
        title: 'Divisions',
        path: '/divisions',
      },
      {
        id: 'subdivisions',
        title: 'Subdivisions',
        path: '/divisions/subdivisions',
      },
    ],
  },
  {
    id: 'profile',
    title: 'Profile',
    icon: 'user',
    path: '/profile',
  },
];

class RBACManager {
  /**
   * Helper private untuk mengecek status Admin secara konsisten
   * Sesuai JSON Backend: user.roles = ["ADMIN"]
   */
  private isAdmin(user: any): boolean {
    return user && Array.isArray(user.roles) && user.roles.includes('ADMIN');
  }

  // Check if user can access a specific menu item
  canAccessMenuItem(menuItem: MenuItem): boolean {
    const user = authManager.getUser();
    if (!user) return false;

    // Admin can access everything
    if (this.isAdmin(user)) return true;

    // Check if user has required permissions
    if (menuItem.permissions && menuItem.permissions.length > 0) {
      return authManager.hasAnyPermission(menuItem.permissions);
    }

    // Check if user has required roles
    if (menuItem.roles && menuItem.roles.length > 0) {
      return authManager.hasAnyRole(menuItem.roles);
    }

    // If no specific permissions or roles required, allow access
    return true;
  }

  // Get filtered menu items based on user permissions
  getAccessibleMenuItems(): MenuItem[] {
    const user = authManager.getUser();
    if (!user) return [];

    return menuItems.filter(item => {
      // Check if user can access this item
      if (!this.canAccessMenuItem(item)) return false;

      // If item has children, filter them too
      if (item.children && item.children.length > 0) {
        // Create a copy to avoid mutating original menuItems
        const accessibleChildren = item.children.filter(child => this.canAccessMenuItem(child));
        
        // Update the item's children with only accessible ones
        item.children = accessibleChildren;

        // Only show parent if it has accessible children
        return accessibleChildren.length > 0;
      }

      return true;
    });
  }

  // Check if user can access a specific route
  canAccessRoute(path: string): boolean {
    const findMenuItemByPath = (items: MenuItem[], targetPath: string): MenuItem | null => {
      for (const item of items) {
        if (item.path === targetPath) return item;
        if (item.children) {
          const found = findMenuItemByPath(item.children, targetPath);
          if (found) return found;
        }
      }
      return null;
    };

    const menuItem = findMenuItemByPath(menuItems, path);
    return menuItem ? this.canAccessMenuItem(menuItem) : true;
  }

  // Get all permissions for a role
  getRolePermissions(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      'ADMIN': ['*'], // All permissions
      'MEMBER': [],
      'HR': ['users.manage', 'divisions.manage'],
      'Secretary': ['documents.manage', 'work_programs.manage'],
      'Media': ['articles.manage'],
      'Finance': ['cash.manage', 'cash.verify'],
      'Director': ['work_programs.manage', 'cash.manage', 'documents.manage'],
    };

    return rolePermissions[role] || [];
  }

  // Check if user has a specific permission based on role
  hasPermissionByRole(permission: string): boolean {
    const user = authManager.getUser();
    if (!user) return false;

    if (this.isAdmin(user)) return true;

    // Cek setiap role yang dimiliki user di array roles
    if (user.roles && Array.isArray(user.roles)) {
      return user.roles.some((roleName: string) => {
        const rolePermissions = this.getRolePermissions(roleName);
        return rolePermissions.includes('*') || rolePermissions.includes(permission);
      });
    }

    return false;
  }

  // Get user's effective permissions (from role + assigned permissions)
  getEffectivePermissions(): string[] {
    const user = authManager.getUser();
    if (!user) return [];

    if (this.isAdmin(user)) return ['*'];

    let allPermissions: string[] = [];

    // Kumpulkan permission dari semua roles
    if (user.roles && Array.isArray(user.roles)) {
      user.roles.forEach((roleName: string) => {
        allPermissions = [...allPermissions, ...this.getRolePermissions(roleName)];
      });
    }

    const userPermissions = user.permissions || [];
    
    // Combine and deduplicate permissions
    const combined = [...allPermissions, ...userPermissions];
    return [...new Set(combined)];
  }

  // Check if user can perform a specific action on a resource
  canPerformAction(resource: string, action: string): boolean {
    const permission = `${resource}.${action}`;
    return authManager.hasPermission(permission) || this.hasPermissionByRole(permission);
  }
}

export const rbacManager = new RBACManager();
export default rbacManager;