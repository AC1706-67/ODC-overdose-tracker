import { View, Text } from 'react-native';

export default function Sanity() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Text style={{ fontSize: 22, marginBottom: 16 }}>Sanity Screen ✅</Text>
      <Text>UI is rendering. Next we'll test Supabase RPC.</Text>
    </View>
  );
}
