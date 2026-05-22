import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Platform, Linking } from 'react-native';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { orderApi } from '@/api/orderApi';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { router } from 'expo-router';

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState('Assigned');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const { showToast } = useToast();

  const tabs = ['Assigned', 'History'];

  const fetchOrders = async () => {
    try {
      const res = await orderApi.getAssignedOrders();
      if (res.success) {
        setOrders(res.data || []);
      }
    } catch (error) {
      console.error('Error fetching orders', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const filteredOrders = orders.filter((order: any) => {
    if (activeTab === 'Assigned') {
      // Assigned only shows orders that are NOT Delivered, Cancelled, Returned, AND NOT Placed
      return !['Delivered', 'Cancelled', 'Returned', 'Placed'].includes(order.orderStatus);
    } else {
      // History shows Delivered, Cancelled, Returned, AND Placed
      return ['Delivered', 'Cancelled', 'Returned', 'Placed'].includes(order.orderStatus);
    }
  });

  const handleUpdateStatus = async (orderId: string, currentStatus: string) => {
    let nextStatus = '';
    let codMethod = '';

    if (currentStatus === 'Placed') nextStatus = 'Packed';
    else if (currentStatus === 'Packed') nextStatus = 'Shipped';
    else if (currentStatus === 'Shipped') nextStatus = 'Out for Delivery';
    else if (currentStatus === 'Out for Delivery') {
      nextStatus = 'Delivered';
      // If COD, ask for payment method
      codMethod = 'Cash';
    }

    if (!nextStatus) return;

    Alert.alert(
      'Update Status',
      `Change status to ${nextStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setUpdatingOrderId(orderId);
            const res = await orderApi.updateOrderStatus(orderId, nextStatus, codMethod);
            setUpdatingOrderId(null);
            if (res.success) {
              showToast(`Status updated to ${nextStatus}`, 'success');
              fetchOrders();
            } else {
              showToast(res.message || 'Failed to update status', 'error');
            }
          }
        }
      ]
    );
  };

  const openInMaps = (order: any) => {
    const addr = `${order.shippingAddress?.street}, ${order.shippingAddress?.city}, ${order.shippingAddress?.zip}`;
    const url = Platform.select({
      ios: `maps:0,0?q=${addr}`,
      android: `geo:0,0?q=${addr}`,
    });
    if (url) Linking.openURL(url);
  };

  const handleOrderPress = (item: any) => {
    router.push({
      pathname: '/order-details',
      params: { orderId: item._id, orderData: JSON.stringify(item) }
    });
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={() => handleOrderPress(item)}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderId}>Order #{item._id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: Colors.primary + '15' }]}>
          <Text style={[styles.typeText, { color: Colors.primary }]}>{item.orderStatus}</Text>
        </View>
      </View>

      <View style={styles.customerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.customer?.name || 'C')[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.customerName}>{item.customer?.name || 'Customer'}</Text>
          <Text style={styles.itemCount}>{item.items?.length || 0} Items • {item.paymentMethod}</Text>
        </View>
        <TouchableOpacity style={styles.phoneButton} onPress={() => Linking.openURL(`tel:${item.customer?.phone}`)}>
          <Icon name="phone" size={18} color={Colors.primary} library="material" />
        </TouchableOpacity>
      </View>

      <View style={styles.addressBox}>
        <Icon name="location-on" size={18} color={Colors.textTertiary} />
        <Text style={styles.addressText} numberOfLines={2}>{item.shippingAddress?.street}, {item.shippingAddress?.city}</Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.statusBox}>
          <View style={[styles.statusDot, { backgroundColor: item.orderStatus === 'Delivered' ? Colors.success : Colors.warning }]} />
          <Text style={styles.statusLabel}>₹{item.totalAmount}</Text>
        </View>
        
        {activeTab === 'Assigned' && item.orderStatus !== 'Placed' && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity 
                style={[styles.acceptButton, { backgroundColor: Colors.gray100 }]}
                onPress={() => openInMaps(item)}
            >
                <Icon name="map" size={16} color={Colors.textPrimary} library="material" />
            </TouchableOpacity>
            <TouchableOpacity 
                style={styles.acceptButton}
                onPress={() => handleOrderPress(item)}
            >
                <Text style={styles.acceptText}>View Details</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dispatch Center</Text>
        <View style={styles.tabWrapper}>
          {tabs.map((tab) => (
            <TouchableOpacity 
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              {activeTab === tab && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', marginTop: 100 }}>
              <Icon name="shopping-bag" size={64} color={Colors.gray200} library="feather" />
              <Text style={{ color: Colors.gray400, marginTop: 16 }}>No orders found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  tabWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 10,
    position: 'relative',
  },
  activeTab: {},
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '800',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 4,
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  timeText: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
    fontWeight: '500',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  itemCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  phoneButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressBox: {
    flexDirection: 'row',
    backgroundColor: Colors.gray50,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 12,
    lineHeight: 20,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  acceptButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  acceptText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
  },
});
