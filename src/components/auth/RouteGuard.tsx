"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authManager } from '@/lib/auth';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredPermissions?: string[];
  requiredRole?: string;
  requiredRoles?: string[];
  fallbackPath?: string;
}

export default function RouteGuard({
  children,
  requiredPermission,
  requiredPermissions = [],
  requiredRole,
  requiredRoles = [],
  fallbackPath = '/403',
}: RouteGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        if (!authManager.isAuthenticated()) {
          router.push('/login');
          return;
        }

        // Try to fetch current user data
        try {
          await authManager.fetchMe();
        } catch {
          // If fetch fails, user might be logged out
          router.push('/login');
          return;
        }

        // Check role-based access
        if (requiredRole && !authManager.hasRole(requiredRole)) {
          router.push(fallbackPath);
          return;
        }

        if (requiredRoles.length > 0 && !authManager.hasAnyRole(requiredRoles)) {
          router.push(fallbackPath);
          return;
        }

        // Check permission-based access
        if (requiredPermission && !authManager.hasPermission(requiredPermission)) {
          router.push(fallbackPath);
          return;
        }

        if (requiredPermissions.length > 0 && !authManager.hasAnyPermission(requiredPermissions)) {
          router.push(fallbackPath);
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [
    router,
    requiredPermission,
    requiredPermissions,
    requiredRole,
    requiredRoles,
    fallbackPath,
  ]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f936c] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
