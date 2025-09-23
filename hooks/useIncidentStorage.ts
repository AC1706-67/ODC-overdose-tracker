import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export interface Incident {
  incident_id: string;
  timestamp: string;
  zip_code: string;
  gender: string;
  approx_age: string;
  narcan_used: boolean;
  survival: string;
  client_id: string;
  synced: boolean;
}

export interface IncidentSubmit {
  zip_code: string;
  gender: string;
  approx_age: string;
  narcan_used: boolean;
  survival: string;
}

const INCIDENTS_KEY = 'incidents';

export function useIncidentStorage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      const stored = await AsyncStorage.getItem(INCIDENTS_KEY);
      if (stored) {
        const parsedIncidents = JSON.parse(stored);
        setIncidents(parsedIncidents);
        setPendingCount(parsedIncidents.filter((i: Incident) => !i.synced).length);
      }
    } catch (error) {
      console.error('Error loading incidents:', error);
    }
  };

  const submitIncident = async (incidentData: IncidentSubmit) => {
    const newIncident: Incident = {
      incident_id: generateUUID(),
      timestamp: new Date().toISOString(),
      ...incidentData,
      client_id: generateUUID(),
      synced: false,
    };

    const updatedIncidents = [...incidents, newIncident];
    setIncidents(updatedIncidents);
    setPendingCount(updatedIncidents.filter(i => !i.synced).length);

    try {
      await AsyncStorage.setItem(INCIDENTS_KEY, JSON.stringify(updatedIncidents));
      
      // Try to sync immediately if online
      await syncIncident(newIncident);
    } catch (error) {
      console.error('Error storing incident:', error);
      throw error;
    }
  };

  const syncIncident = async (incident: Incident) => {
    try {
      // Submit to Supabase
      const { data, error } = await supabase
        .from('incidents')
        .insert({
          zip_code: incident.zip_code,
          gender: incident.gender,
          approx_age: incident.approx_age,
          narcan_used: incident.narcan_used,
          survival: incident.survival,
          client_id: incident.client_id,
        })
        .select('incident_id')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return;
      }

      // Mark as synced
      const updatedIncidents = incidents.map(i =>
        i.incident_id === incident.incident_id ? { ...i, synced: true } : i
      );
      setIncidents(updatedIncidents);
      setPendingCount(updatedIncidents.filter(i => !i.synced).length);
      await AsyncStorage.setItem(INCIDENTS_KEY, JSON.stringify(updatedIncidents));
    } catch (error) {
      console.error('Error syncing incident:', error);
      // Incident remains unsynced for retry later
    }
  };

  const syncPending = async () => {
    const pendingIncidents = incidents.filter(i => !i.synced);
    
    for (const incident of pendingIncidents) {
      await syncIncident(incident);
    }
  };

  return {
    incidents,
    pendingCount,
    submitIncident,
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