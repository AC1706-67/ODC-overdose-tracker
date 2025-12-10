import React, { useState, useEffect } from 'react';
import { View, Text, Switch, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { blockchainService, BlockchainConfig } from '../src/services/blockchain';
import { useOrg } from '../src/context/OrgContext';

interface BlockchainSettingsProps {
  organizationId?: string;
}

/**
 * Blockchain Settings Component
 * 
 * Allows organization admins to configure blockchain integration settings.
 * Currently provides UI for future blockchain functionality.
 */
export default function BlockchainSettings({ organizationId }: BlockchainSettingsProps) {
  const { currentOrg } = useOrg();
  const orgId = organizationId || currentOrg?.id;
  
  const [config, setConfig] = useState<Partial<BlockchainConfig>>({
    blockchainEnabled: false,
    preferredNetwork: 'polygon',
    autoSubmit: false,
    verificationRequired: true,
    maxGasPriceGwei: 50,
    retryAttempts: 3
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [orgId]);

  const loadConfig = async () => {
    if (!orgId) return;
    
    setIsLoading(true);
    try {
      const existingConfig = await blockchainService.getBlockchainConfig(orgId);
      if (existingConfig) {
        setConfig(existingConfig);
      }
    } catch (error) {
      console.error('Error loading blockchain config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!orgId) return;
    
    setIsSaving(true);
    try {
      const result = await blockchainService.updateBlockchainConfig(orgId, config);
      if (result.success) {
        Alert.alert('Success', 'Blockchain settings saved successfully');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error saving blockchain config:', error);
      Alert.alert('Error', 'Failed to save blockchain settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (key: keyof BlockchainConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (!orgId) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ color: '#666', textAlign: 'center' }}>
          No organization selected
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Blockchain Settings
      </Text>
      
      <View style={{ backgroundColor: '#f0f8ff', padding: 15, borderRadius: 8, marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e40af', marginBottom: 8 }}>
          🔗 Blockchain Integration (Coming Soon)
        </Text>
        <Text style={{ color: '#1e40af', lineHeight: 20 }}>
          Configure how your organization's data will be secured on the blockchain. 
          This feature is currently in development and will provide immutable record-keeping 
          for incidents and outreach activities.
        </Text>
      </View>

      {/* Enable Blockchain */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5'
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600' }}>Enable Blockchain</Text>
          <Text style={{ color: '#666', fontSize: 14, marginTop: 4 }}>
            Store incident and outreach data on blockchain for immutability
          </Text>
        </View>
        <Switch
          value={config.blockchainEnabled}
          onValueChange={(value) => updateConfig('blockchainEnabled', value)}
          disabled={true} // Disabled until blockchain is implemented
        />
      </View>

      {/* Preferred Network */}
      <View style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
          Preferred Network
        </Text>
        <Text style={{ color: '#666', fontSize: 14, marginBottom: 12 }}>
          Choose which blockchain network to use for storing data
        </Text>
        <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8 }}>
          <Picker
            selectedValue={config.preferredNetwork}
            onValueChange={(value) => updateConfig('preferredNetwork', value)}
            enabled={false} // Disabled until blockchain is implemented
          >
            <Picker.Item label="Polygon (Recommended - Low fees)" value="polygon" />
            <Picker.Item label="Ethereum (Most secure)" value="ethereum" />
            <Picker.Item label="Arbitrum (Fast & cheap)" value="arbitrum" />
            <Picker.Item label="Optimism (Ethereum L2)" value="optimism" />
          </Picker>
        </View>
      </View>

      {/* Auto Submit */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5'
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600' }}>Auto Submit to Blockchain</Text>
          <Text style={{ color: '#666', fontSize: 14, marginTop: 4 }}>
            Automatically submit new records to blockchain (costs gas fees)
          </Text>
        </View>
        <Switch
          value={config.autoSubmit}
          onValueChange={(value) => updateConfig('autoSubmit', value)}
          disabled={true} // Disabled until blockchain is implemented
        />
      </View>

      {/* Verification Required */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5'
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600' }}>Require Verification</Text>
          <Text style={{ color: '#666', fontSize: 14, marginTop: 4 }}>
            Verify that data was successfully stored on blockchain
          </Text>
        </View>
        <Switch
          value={config.verificationRequired}
          onValueChange={(value) => updateConfig('verificationRequired', value)}
          disabled={true} // Disabled until blockchain is implemented
        />
      </View>

      {/* Max Gas Price */}
      <View style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
          Max Gas Price (Gwei)
        </Text>
        <Text style={{ color: '#666', fontSize: 14, marginBottom: 12 }}>
          Maximum gas price willing to pay for transactions
        </Text>
        <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8 }}>
          <Picker
            selectedValue={config.maxGasPriceGwei}
            onValueChange={(value) => updateConfig('maxGasPriceGwei', value)}
            enabled={false} // Disabled until blockchain is implemented
          >
            <Picker.Item label="20 Gwei (Slow, cheap)" value={20} />
            <Picker.Item label="50 Gwei (Standard)" value={50} />
            <Picker.Item label="100 Gwei (Fast)" value={100} />
            <Picker.Item label="200 Gwei (Very fast, expensive)" value={200} />
          </Picker>
        </View>
      </View>

      {/* Retry Attempts */}
      <View style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
          Retry Attempts
        </Text>
        <Text style={{ color: '#666', fontSize: 14, marginBottom: 12 }}>
          Number of times to retry failed blockchain submissions
        </Text>
        <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8 }}>
          <Picker
            selectedValue={config.retryAttempts}
            onValueChange={(value) => updateConfig('retryAttempts', value)}
            enabled={false} // Disabled until blockchain is implemented
          >
            <Picker.Item label="1 attempt" value={1} />
            <Picker.Item label="3 attempts (Recommended)" value={3} />
            <Picker.Item label="5 attempts" value={5} />
            <Picker.Item label="10 attempts" value={10} />
          </Picker>
        </View>
      </View>

      {/* Benefits Section */}
      <View style={{ marginTop: 30, padding: 15, backgroundColor: '#f9fafb', borderRadius: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
          Benefits of Blockchain Integration
        </Text>
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 14, color: '#374151' }}>
            • <Text style={{ fontWeight: '600' }}>Immutable Records:</Text> Data cannot be altered once stored
          </Text>
        </View>
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 14, color: '#374151' }}>
            • <Text style={{ fontWeight: '600' }}>Decentralized Verification:</Text> Independent verification of data integrity
          </Text>
        </View>
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 14, color: '#374151' }}>
            • <Text style={{ fontWeight: '600' }}>Cross-Organization Trust:</Text> Verifiable data sharing between organizations
          </Text>
        </View>
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 14, color: '#374151' }}>
            • <Text style={{ fontWeight: '600' }}>Audit Trail:</Text> Complete history of all data modifications
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 14, color: '#374151' }}>
            • <Text style={{ fontWeight: '600' }}>Future Incentives:</Text> Potential for token rewards for data contribution
          </Text>
        </View>
      </View>

      {/* Save Button - Disabled for now */}
      <View style={{ 
        marginTop: 30, 
        padding: 15, 
        backgroundColor: '#e5e7eb', 
        borderRadius: 8,
        opacity: 0.6
      }}>
        <Text style={{ 
          textAlign: 'center', 
          fontSize: 16, 
          fontWeight: '600',
          color: '#6b7280'
        }}>
          Save Settings (Coming Soon)
        </Text>
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}