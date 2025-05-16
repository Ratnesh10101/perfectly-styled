"use client";

import { useEffect, type ComponentType, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';
import type { UserMeta } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  checkMeta?: (meta: UserMeta | null) => boolean;
  redirectPath?: string;
  loadingMessage?: string;
}

const ProtectedRoute = ({ children, checkMeta, redirectPath = '/login', loadingMessage = "Loading your secure page..." }: ProtectedRouteProps) => {
  const { currentUser, userMeta, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.push(redirectPath);
      } else if (checkMeta && !checkMeta(userMeta)) {
        router.push(userMeta?.questionnaireComplete ? '/payment' : '/questionnaire');
      }
    }
  }, [currentUser, userMeta, loading, router, checkMeta, redirectPath]);

  if (loading || !currentUser || (checkMeta && !checkMeta(userMeta))) {
    return <LoadingSpinner fullPage/>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

// Higher-Order Component version if preferred
export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options?: {
    checkMeta?: (meta: UserMeta | null) => boolean;
    redirectPath?: string;
    loadingMessage?: string;
  }
) {
  const ComponentWithAuth = (props: P) => {
    return (
      <ProtectedRoute 
        checkMeta={options?.checkMeta} 
        redirectPath={options?.redirectPath}
        loadingMessage={options?.loadingMessage}
      >
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
  ComponentWithAuth.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return ComponentWithAuth;
}
