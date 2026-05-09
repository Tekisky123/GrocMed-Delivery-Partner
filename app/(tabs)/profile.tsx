import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const { partner, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout }
      ]
    );
  };

  const menuItems = [
    { label: 'Personal Details', icon: 'person', library: 'material' as const, color: '#3B82F6' },
    { label: 'Notification Settings', icon: 'notifications', library: 'material' as const, color: '#8B5CF6' },
    { label: 'Verification Status', icon: 'verified-user', library: 'material' as const, color: Colors.success },
    { label: 'Help & Support', icon: 'support-agent', library: 'material' as const, color: Colors.neutral },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatar, { backgroundColor: Colors.primary + '10', alignItems: 'center', justifyContent: 'center' }]}>
               <Icon name="person" size={60} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.name}>{partner?.name || 'Partner'}</Text>
          <Text style={styles.id}>Partner ID: #{partner?.id ? partner.id.slice(-6).toUpperCase() : '------'}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.miniStat}>
              <Text style={styles.statVal}>{partner?.isActive ? 'Online' : 'Offline'}</Text>
              <Text style={styles.statLabel}>Status</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.miniStat}>
              <Text style={styles.statVal}>{partner?.phone}</Text>
              <Text style={styles.statLabel}>Phone</Text>
            </View>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuBox}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={[styles.menuItem, index === menuItems.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                <Icon name={item.icon} size={20} color={item.color} library={item.library} />
              </View>
              <Text style={styles.menuText}>{item.label}</Text>
              <Icon name="chevron-right" size={20} color={Colors.gray300} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
          <Icon name="logout" size={20} color={Colors.error} library="material" />
          <Text style={styles.signOutText}>Sign Out Partner</Text>
        </TouchableOpacity>

        <Text style={styles.version}>GrocMed Delivery • v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 34,
    borderWidth: 4,
    borderColor: Colors.gray50,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginLeft: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  id: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginTop: 4,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 24,
    backgroundColor: Colors.gray50,
    padding: 16,
    borderRadius: 20,
    width: '100%',
  },
  miniStat: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    backgroundColor: Colors.gray200,
    marginVertical: 4,
  },
  menuBox: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray50,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error + '08',
    padding: 18,
    borderRadius: 20,
    marginBottom: 30,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.error,
    marginLeft: 10,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '500',
    marginBottom: 20,
  },
});
