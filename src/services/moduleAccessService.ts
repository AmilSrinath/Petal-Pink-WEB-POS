import { API_BASE_URL } from '../config';

const API_BASE = `${API_BASE_URL}/api`;

// const API_BASE_URL = 'https://pos.petalpink.lk/api';

export interface ModuleAccess {
  moduleId: number;
  moduleName: string;
  hasAccess: boolean;
}

export interface AccessibleModule {
  moduleId: number;
  moduleName: string;
}

/**
 * Fetch all modules with access status for a user
 */
export async function fetchModuleAccess(userId: number): Promise<ModuleAccess[]> {
  try {
    const response = await fetch(`${API_BASE}/module/access/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch module access: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('[v0] Error fetching module access:', error);
    throw error;
  }
}

/**
 * Fetch only accessible modules for a user
 */
export async function fetchAccessibleModules(userId: number): Promise<AccessibleModule[]> {
  try {
    const response = await fetch(`${API_BASE}/module/accessible/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch accessible modules: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('[v0] Error fetching accessible modules:', error);
    throw error;
  }
}

/**
 * Check if user has access to a specific module
 */
export async function hasModuleAccess(userId: number, moduleName: string): Promise<boolean> {
  try {
    const modules = await fetchModuleAccess(userId);
    const module = modules.find(
      (m) => m.moduleName.toLowerCase() === moduleName.toLowerCase()
    );
    return module?.hasAccess ?? false;
  } catch (error) {
    console.error('[v0] Error checking module access:', error);
    return false;
  }
}
