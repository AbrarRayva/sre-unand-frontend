"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authManager } from '@/lib/auth';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
}

export function RouteGuard({ children, requiredPermissions, requiredRoles }: RouteGuardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = authManager.getToken();
        
        if (!token) {
          router.push('/login');
          return;
        }

        const user = await authManager.fetchMe();
        
        // Check role-based access
        if (requiredRoles && requiredRoles.length > 0) {
          const hasRole = requiredRoles.includes(user.role || '');
          if (!hasRole) {
            router.push('/unauthorized');
            return;
          }
        }

        // Check permission-based access
        if (requiredPermissions && requiredPermissions.length > 0) {
          const userPermissions = user.permissions || [];
          
          const hasPermission = requiredPermissions.some(perm => 
            userPermissions.includes(perm)
          );
          
          if (!hasPermission) {
            router.push('/unauthorized');
            return;
          }
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, requiredPermissions, requiredRoles]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#0f936c]"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect
  }

  return <>{children}</>;
}

// HOC for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: { requiredPermissions?: string[]; requiredRoles?: string[] }
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <RouteGuard 
        requiredPermissions={options?.requiredPermissions}
        requiredRoles={options?.requiredRoles}
      >
        <Component {...props} />
      </RouteGuard>
    );
  };
}
