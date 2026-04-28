export interface Vehicle {
  id: string;
  organization_id: string;
  name: string;
  license_plate: string | null;
  status: 'active' | 'inactive' | 'deleted';
  starting_odometer: number | null;
  starting_odometer_date: string | null;
  make_model: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string;
  vehicle_id: string;
  organization_id: string;
  driver_id: string;
  trip_date: string;
  start_odometer: number;
  end_odometer: number;
  miles_driven: number;
  trip_type: 'transport' | 'outreach';
  participant_alias: string | null;
  purpose: string | null;
  notes: string | null;
  start_photo_path: string | null;
  end_photo_path: string | null;
  created_at: string;
  updated_at: string;
}

export type TripInsert = Omit<Trip, 'id' | 'created_at' | 'updated_at'>;
export type VehicleInsert = Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>;
