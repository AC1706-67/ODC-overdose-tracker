import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export interface Distribution {
  distribution_id: string;
  timestamp: string;
  zip_code: string;
  kit_type: string;
  kits_given: number;
  last_kit_outcome?: string;
  responder_id?: string;
  synced: boolean;
}

export interface DistributionSubmit {
  zip_code: string;
  kit_type: string;
  kits_given: number;
  last_kit_outcome?: string;
}

const DISTRIBUTIONS_KEY = 'distributions';

export function useDistributionStorage() {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    loadDistributions();
  }, []);

  const loadDistributions = async () => {
    try {
      const stored = await AsyncStorage.getItem(DISTRIBUTIONS_KEY);
      if (stored) {
        const parsedDistributions = JSON.parse(stored);
        setDistributions(parsedDistributions);
        setPendingCount(parsedDistributions.filter((d: Distribution) => !d.synced).length);
      }
    } catch (error) {
      console.error('Error loading distributions:', error);
    }
  };

  const submitDistribution = async (distributionData: DistributionSubmit) => {
    const newDistribution: Distribution = {
      distribution_id: generateUUID(),
      timestamp: new Date().toISOString(),
      ...distributionData,
      responder_id: generateUUID(),
      synced: false,
    };

    const updatedDistributions = [...distributions, newDistribution];
    setDistributions(updatedDistributions);
    setPendingCount(updatedDistributions.filter(d => !d.synced).length);

    try {
      await AsyncStorage.setItem(DISTRIBUTIONS_KEY, JSON.stringify(updatedDistributions));
      
      // Try to sync immediately if online
      await syncDistribution(newDistribution);
    } catch (error) {
      console.error('Error storing distribution:', error);
      throw error;
    }
  };

  const syncDistribution = async (distribution: Distribution) => {
    try {
      // Submit to Supabase
      const { data, error } = await supabase
        .from('distributions')
        .insert({
          zip_code: distribution.zip_code,
          kit_type: distribution.kit_type,
          kits_given: distribution.kits_given,
          last_kit_outcome: distribution.last_kit_outcome,
          responder_id: distribution.responder_id,
        })
        .select('distribution_id')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return;
      }

      // Mark as synced
      const updatedDistributions = distributions.map(d =>
        d.distribution_id === distribution.distribution_id ? { ...d, synced: true } : d
      );
      setDistributions(updatedDistributions);
      setPendingCount(updatedDistributions.filter(d => !d.synced).length);
      await AsyncStorage.setItem(DISTRIBUTIONS_KEY, JSON.stringify(updatedDistributions));
    } catch (error) {
      console.error('Error syncing distribution:', error);
      // Distribution remains unsynced for retry later
    }
  };

  const syncPending = async () => {
    const pendingDistributions = distributions.filter(d => !d.synced);
    
    for (const distribution of pendingDistributions) {
      await syncDistribution(distribution);
    }
  };

  return {
    distributions,
    pendingCount,
    submitDistribution,
    syncPending,
  };
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}