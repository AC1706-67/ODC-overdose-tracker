import React from 'react';
import { TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

interface SignOutButtonProps {
  style?: any;
  textStyle?: any;
  showIcon?: boolean;
}

export function SignOutButton({ style, textStyle, showIcon = true }: SignOutButtonProps) {
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/login');
          }
        },
      ]
    );
  };

  return (
    <TouchableOpacity style={[styles.button, style]} onPress={handleSignOut}>
      {showIcon && <LogOut size={20} color="#dc2626" />}
      <Text style={[styles.text, textStyle]}>Sign Out</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  text: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});