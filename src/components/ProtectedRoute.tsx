import React from 'react';
import { Navigate } from 'react-router-dom';
import { useModuleAccess } from '../context/ModuleAccessContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  moduleName: string;
}

export function ProtectedRoute({ children, moduleName }: ProtectedRouteProps) {
  const { hasAccess, loading } = useModuleAccess();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  if (!hasAccess(moduleName)) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this module.</p>
        </div>
        <a
          href="/#/"
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
