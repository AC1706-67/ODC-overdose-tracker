import { Stack } from 'expo-router';

export default function OdometerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="log-trip" />
      <Stack.Screen name="history" />
      <Stack.Screen name="vehicles" />
      <Stack.Screen name="trip/[id]" />
    </Stack>
  );
}
