import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { orderApi } from '@/api/orderApi';
import { authApi } from '@/api/authApi';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { partner } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        orderApi.getDashboardStats(),
        orderApi.getAssignedOrders()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (ordersRes.success && ordersRes.data?.length > 0) {
        const current = ordersRes.data.find((o: any) => 
          !['Delivered', 'Cancelled', 'Returned'].includes(o.orderStatus)
        );
        setActiveOrder(current);
      }
    } catch (error) {
      console.error('Error fetching dashboard data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const dashboardStats = [
    { label: 'Today Orders', value: `${stats?.todayDeliveries || 0}`, icon: 'shopping-bag', library: 'lucide' as const, color: Colors.primary },
    { label: 'Monthly Done', value: `${stats?.monthlyDeliveries || 0}`, icon: 'check-circle', library: 'material' as const, color: Colors.success },
  ];

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{partner?.name || 'Partner'}</Text>
          </View>
          <TouchableOpacity style={styles.statusBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>{partner?.isActive ? 'Online' : 'Offline'}</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {dashboardStats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.iconBox, { backgroundColor: stat.color + '15' }]}>
                <Icon name={stat.icon} size={20} color={stat.color} library={stat.library} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Active Order Card */}
        {activeOrder && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Current Assignment</Text>
              <TouchableOpacity onPress={() => router.push({
                pathname: '/order-details',
                params: { orderId: activeOrder._id, orderData: JSON.stringify(activeOrder) }
              })}>
                <Text style={styles.seeAll}>Details</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.activeOrderCard} 
              activeOpacity={0.9}
              onPress={() => router.push({
                pathname: '/order-details',
                params: { orderId: activeOrder._id, orderData: JSON.stringify(activeOrder) }
              })}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
              >
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>Order #{activeOrder._id.slice(-6).toUpperCase()}</Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>{activeOrder.orderStatus}</Text>
                  </View>
                </View>

                <View style={styles.addressSection}>
                  <View style={styles.addressRow}>
                    <View style={styles.addressIconBox}>
                      <View style={styles.dot} />
                      <View style={styles.line} />
                    </View>
                    <View>
                      <Text style={styles.addressLabel}>Status</Text>
                      <Text style={styles.addressText}>Ready for Delivery</Text>
                    </View>
                  </View>

                  <View style={[styles.addressRow, { marginTop: 12 }]}>
                    <View style={styles.addressIconBox}>
                      <View style={[styles.dot, { backgroundColor: '#FFF' }]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.addressLabel}>Drop-off</Text>
                      <Text style={styles.addressText}>{activeOrder.shippingAddress?.street}</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => router.push({
                    pathname: '/order-details',
                    params: { orderId: activeOrder._id, orderData: JSON.stringify(activeOrder) }
                  })}
                >
                  <Text style={styles.actionButtonText}>Start Navigation</Text>
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {/* Recent Performance */}
        <Text style={styles.sectionTitle}>Recent History</Text>
        {(stats?.recentActivities || []).length > 0 ? (
          stats.recentActivities.map((activity: any) => (
            <View key={activity.id} style={styles.recentItem}>
              <View style={styles.recentIcon}>
                <Icon name="check-circle" size={24} color={Colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recentTitle}>Order #{activity.orderId.slice(-6).toUpperCase()}</Text>
                <Text style={styles.recentTime}>{activity.status} at {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              {activity.amount && <Text style={styles.recentPrice}>₹{activity.amount}</Text>}
              <Icon name="chevron-right" size={20} color={Colors.gray300} />
            </View>
          ))
        ) : (
          <View className="py-8 items-center">
            <Text className="text-gray-400">No recent deliveries</Text>
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: (width - 50) / 2,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
  },
  activeOrderCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 30,
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  gradient: {
    padding: 24,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  orderId: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  typeBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  addressSection: {
    marginBottom: 24,
  },
  addressRow: {
    flexDirection: 'row',
  },
  addressIconBox: {
    width: 20,
    alignItems: 'center',
    marginRight: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  line: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 4,
  },
  addressLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: Colors.primary,
    fontWeight: '900',
    fontSize: 15,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  recentTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  recentPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.success,
    marginRight: 8,
  },
});
