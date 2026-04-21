import React, { createContext, useContext, useState, useEffect } from 'react';
import { ModuleAccess, fetchModuleAccess } from '../services/moduleAccessService';

interface ModuleAccessContextType {
  modules: ModuleAccess[];
  loading: boolean;
  error: string | null;
  hasAccess: (moduleName: string) => boolean;
}

const ModuleAccessContext = createContext<ModuleAccessContextType | undefined>(undefined);

export function ModuleAccessProvider({ children, userId }: { children: React.ReactNode; userId: number }) {
  const [modules, setModules] = useState<ModuleAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModuleAccess = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchModuleAccess(userId);
        setModules(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load module access';
        setError(errorMessage);
        console.error('[v0] Module access error:', errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadModuleAccess();
    }
  }, [userId]);

  const hasAccess = (moduleName: string): boolean => {
    const module = modules.find(
      (m) => m.moduleName.toLowerCase() === moduleName.toLowerCase()
    );
    return module?.hasAccess ?? false;
  };

  return (
    <ModuleAccessContext.Provider value={{ modules, loading, error, hasAccess }}>
      {children}
    </ModuleAccessContext.Provider>
  );
}

export function useModuleAccess() {
  const context = useContext(ModuleAccessContext);
  if (!context) {
    throw new Error('useModuleAccess must be used within ModuleAccessProvider');
  }
  return context;
}
