import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OrgContextType {
  activeOrgId: string | null;
  setActiveOrgId: (id: string) => Promise<void>;
  clearActiveOrg: () => Promise<void>;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: ReactNode }) {
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(null);

  useEffect(() => {
    // Load saved org on app start
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('activeOrgId');
        if (saved) {
          setActiveOrgIdState(saved);
        }
      } catch (error) {
        console.warn('Failed to load saved org:', error);
      }
    })();
  }, []);

  const setActiveOrgId = async (id: string) => {
    try {
      await AsyncStorage.setItem('activeOrgId', id);
      setActiveOrgIdState(id);
    } catch (error) {
      console.warn('Failed to save org:', error);
      setActiveOrgIdState(id); // Still set in memory
    }
  };

  const clearActiveOrg = async () => {
    try {
      await AsyncStorage.removeItem('activeOrgId');
      setActiveOrgIdState(null);
    } catch (error) {
      console.warn('Failed to clear org:', error);
      setActiveOrgIdState(null); // Still clear in memory
    }
  };

  return (
    <OrgContext.Provider value={{ activeOrgId, setActiveOrgId, clearActiveOrg }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (context === undefined) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
}