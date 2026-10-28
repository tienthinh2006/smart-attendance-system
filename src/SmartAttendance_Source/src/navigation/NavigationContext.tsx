/**
 * NAVIGATION CONTEXT & STATE ROUTER
 * Giải pháp Zero-dependency hoàn hảo cho quản lý màn hình và Tabs
 */
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type MainTab = 'dashboard' | 'employees' | 'shifts' | 'history' | 'reports';

interface NavigationContextType {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  // Modal triggers
  isAddEmployeeOpen: boolean;
  setIsAddEmployeeOpen: (open: boolean) => void;
  isAddShiftOpen: boolean;
  setIsAddShiftOpen: (open: boolean) => void;
  enrollEmployeeId: string | null;
  setEnrollEmployeeId: (empId: string | null) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<MainTab>('dashboard');
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isAddShiftOpen, setIsAddShiftOpen] = useState(false);
  const [enrollEmployeeId, setEnrollEmployeeId] = useState<string | null>(null);

  return (
    <NavigationContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isAddEmployeeOpen,
        setIsAddEmployeeOpen,
        isAddShiftOpen,
        setIsAddShiftOpen,
        enrollEmployeeId,
        setEnrollEmployeeId,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export function useNavigation(): NavigationContextType {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

