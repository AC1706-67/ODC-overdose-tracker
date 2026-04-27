export function validateOdometer(start: number, end: number): string | null {
  if (!start || !end) {
    return 'Both start and end odometer readings are required';
  }
  if (end <= start) {
    return 'End odometer must be greater than start odometer';
  }
  if (end - start > 1000) {
    return 'Trip distance seems unusually high. Please verify readings.';
  }
  return null;
}

export function calculateMiles(start: number, end: number): number {
  return Math.round((end - start) * 10) / 10;
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatMiles(miles: number): string {
  return miles.toFixed(1);
}
