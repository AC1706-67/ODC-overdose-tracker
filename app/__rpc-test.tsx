import { useState } from 'react';
import { View, Text, Button, Alert, TextInput, StyleSheet } from 'react-native';
import { createLocation } from '@/lib/locations';
import { createTeamMember } from '@/lib/teamMembers';

export default function RpcTest() {
  const [locName, setLocName] = useState('Test Spot');
  const [fullName, setFullName] = useState('Coach Andres');

  const runLocation = async () => {
    try {
      const loc = await createLocation('recovery-alliance', locName);
      Alert.alert('Location', `OK: ${loc.name} (${loc.id})`);
    } catch (e: any) {
      Alert.alert('Location ERROR', e?.message ?? 'Unknown error');
    }
  };

  const runMember = async () => {
    try {
      const m = await createTeamMember('recovery-alliance', fullName);
      Alert.alert('Member', `OK: ${m.full_name} (${m.id})`);
    } catch (e: any) {
      Alert.alert('Member ERROR', e?.message ?? 'Unknown error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RPC Test</Text>

      <TextInput
        value={locName}
        onChangeText={setLocName}
        placeholder="Location name"
        style={styles.input}
      />
      <Button title="Create Location" onPress={runLocation} />

      <TextInput
        value={fullName}
        onChangeText={setFullName}
        placeholder="Full name"
        style={[styles.input, styles.inputSpaced]}
      />
      <Button title="Create Team Member" onPress={runMember} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
    borderColor: '#d1d5db',
  },
  inputSpaced: {
    marginTop: 16,
  },
});
