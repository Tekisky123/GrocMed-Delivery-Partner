import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Icon } from '@/components/ui/Icon';

export default function AppMap() {
  return (
    <View style={styles.webFallback}>
      <Text style={styles.webText}>Interactive Map is active on Mobile Devices</Text>
      <Text style={styles.webSubText}>Displaying high-fidelity tracking interface</Text>
      
      <View style={styles.visualRider}>
        <Icon name="navigation" size={60} color={Colors.primary} library="feather" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webFallback: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  webText: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  webSubText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  visualRider: {
    marginTop: 60,
    transform: [{ rotate: '45deg' }],
  },
});
