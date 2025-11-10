import { Tabs } from 'expo-router';
import { Activity, BarChart3, Package, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOrg } from '@/src/context/OrgContext';
import { canUseOutreach } from '@/src/lib/featureAccess';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { activeOrg, loading } = useOrg();
  const outreachEnabled = !loading && canUseOutreach(activeOrg);

  if (loading) {
    return null; // Or a loading spinner
  }
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#dc2626',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: Math.max(insets.bottom, 8), // Use safe area or minimum 8px
          paddingTop: 8,
          height: 80 + Math.max(insets.bottom, 8), // Adjust height for safe area
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Incidents',
          tabBarIcon: ({ size, color }) => (
            <Activity size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="distribution"
        options={{
          title: 'Outreach',
          href: outreachEnabled ? '/distribution' : null,
          tabBarIcon: ({ size, color}) => (
            <Package size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}