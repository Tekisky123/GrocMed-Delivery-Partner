import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Platform, Linking, Modal, Image, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { orderApi } from '@/api/orderApi';
import { useToast } from '@/contexts/ToastContext';

export default function OrderDetailsScreen() {
  const { orderData } = useLocalSearchParams();
  const order = useMemo(() => orderData ? JSON.parse(orderData as string) : null, [orderData]);
  const { showToast } = useToast();

  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Online' | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);


  const handleUpdateStatus = async (forcedStatus?: string, forcedMethod?: string, forcedScreenshot?: string) => {
    if (!order) return;
    
    let nextStatus = forcedStatus || '';
    if (!nextStatus) {
        if (order.orderStatus === 'Shipped') nextStatus = 'Out for Delivery';
        else if (order.orderStatus === 'Out for Delivery') nextStatus = 'Delivered';
    }

    if (!nextStatus) {
        showToast('Status is already updated or not in delivery phase.', 'info');
        return;
    }

    // COD Collection Check
    if (nextStatus === 'Delivered' && order.paymentMethod === 'COD' && !forcedMethod) {
        setIsPaymentModalVisible(true);
        return;
    }

    setIsUpdating(true);
    const res = await orderApi.updateOrderStatus(order._id, nextStatus, forcedMethod);
    setIsUpdating(false);

    if (res.success) {
      showToast(`Order status updated to ${nextStatus}`, 'success');
      setIsPaymentModalVisible(false);
      router.back();
    } else {
      showToast(res.message || 'Failed to update status', 'error');
    }
  };

  const confirmCODelivery = () => {
    if (!paymentMethod) {
        showToast('Please select a payment method', 'error');
        return;
    }
    handleUpdateStatus('Delivered', paymentMethod);
  };

  const openInMaps = () => {
    if (!order) return;
    const addr = `${order.shippingAddress?.street}, ${order.shippingAddress?.city}, ${order.shippingAddress?.zip}`;
    const url = Platform.select({
      ios: `maps:0,0?q=${addr}`,
      android: `geo:0,0?q=${addr}`,
    });
    if (url) Linking.openURL(url);
  };

  if (!order) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
             <View>
                <Text style={styles.statusLabel}>Order Status</Text>
                <Text style={styles.statusValue}>{order.orderStatus}</Text>
             </View>
             <View style={styles.orderValBox}>
                <Text style={styles.valText}>₹{order.totalAmount}</Text>
                <Text style={[styles.payMode, { color: order.paymentStatus === 'Paid' ? Colors.success : Colors.error }]}>
                    {order.paymentMethod} • {order.paymentStatus}
                </Text>
             </View>
          </View>
          
          <View style={styles.line} />
          
          <View style={styles.infoRow}>
            <Icon name="calendar-today" size={18} color={Colors.textTertiary} />
            <Text style={styles.infoText}>Placed on {new Date(order.createdAt).toLocaleDateString()}</Text>
          </View>
          <View style={[styles.infoRow, { marginTop: 12 }]}>
            <Icon name="tag" size={18} color={Colors.textTertiary} />
            <Text style={styles.infoText}>#{order._id.slice(-8).toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          <View style={styles.customerCard}>
            <View style={styles.custAvatar}>
              <Text style={styles.avatarTxt}>{(order.customer?.name || 'C')[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.custName}>{order.customer?.name || 'Customer'}</Text>
              <Text style={styles.custPhone}>{order.customer?.phone}</Text>
            </View>
            <TouchableOpacity 
              style={styles.callBtn}
              onPress={() => Linking.openURL(`tel:${order.customer?.phone}`)}
            >
              <Icon name="phone" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Location</Text>
          <View style={styles.addressCard}>
            <View style={styles.addressRow}>
               <Icon name="location-on" size={24} color={Colors.primary} />
               <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.addressText}>{order.shippingAddress?.street}, {order.shippingAddress?.city}</Text>
                  <Text style={styles.zipText}>{order.shippingAddress?.zip}</Text>
               </View>
            </View>
            <TouchableOpacity style={styles.mapBtn} onPress={openInMaps}>
               <Icon name="map" size={20} color={Colors.primary} library="material" />
               <Text style={styles.mapBtnText}>View on Google Maps</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items?.map((item: any, index: number) => (
            <View key={index} style={styles.itemRow}>
               <View style={styles.itemDot} />
               <Text style={styles.itemName}>{item.name}</Text>
               <Text style={styles.itemQty}>x{item.quantity}</Text>
               <Text style={styles.itemPrice}>₹{item.price}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.deliverBtn} activeOpacity={0.9} onPress={() => handleUpdateStatus()}>
          <LinearGradient
            colors={Colors.gradientPrimary as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btnGradient}
          >
            <Text style={styles.btnTxt}>
                {order.orderStatus === 'Out for Delivery' ? 'Mark as Delivered' : 'Update Status'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Payment Collection Modal */}
      <Modal
        visible={isPaymentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment Collection</Text>
              <TouchableOpacity onPress={() => setIsPaymentModalVisible(false)}>
                <Icon name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalInfo}>
              <Text style={styles.modalSubTitle}>Order #{order._id.slice(-6).toUpperCase()}</Text>
              <Text style={styles.modalAmount}>Amount to Collect: ₹{order.totalAmount}</Text>
            </View>

            <Text style={styles.label}>Select Received Method:</Text>
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
                <TouchableOpacity 
                    style={[styles.optionCard, paymentMethod === 'Cash' && styles.optionCardActive]} 
                    onPress={() => setPaymentMethod('Cash')}
                >
                    <Icon name="payments" size={32} color={paymentMethod === 'Cash' ? Colors.primary : Colors.gray400} />
                    <Text style={[styles.optionText, paymentMethod === 'Cash' && styles.optionTextActive]}>Cash</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.optionCard, paymentMethod === 'Online' && styles.optionCardActive]} 
                    onPress={() => setPaymentMethod('Online')}
                >
                    <Icon name="qr-code-scanner" size={32} color={paymentMethod === 'Online' ? Colors.primary : Colors.gray400} />
                    <Text style={[styles.optionText, paymentMethod === 'Online' && styles.optionTextActive]}>Online</Text>
                </TouchableOpacity>
            </View>


            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setIsPaymentModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmBtn, !paymentMethod && { opacity: 0.5 }]} 
                onPress={confirmCODelivery}
                disabled={!paymentMethod || isUpdating}
              >
                {isUpdating ? <ActivityIndicator color="white" /> : <Text style={styles.confirmText}>Confirm Delivery</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusValue: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primary,
    marginTop: 4,
  },
  orderValBox: {
    alignItems: 'flex-end',
  },
  valText: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  payMode: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  line: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 12,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
    marginLeft: 4,
  },
  customerCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  custAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarTxt: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  custName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  custPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  addressText: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '600',
    lineHeight: 22,
  },
  zipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '10',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  mapBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  itemQty: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginHorizontal: 12,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  deliverBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  btnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnTxt: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  modalInfo: {
    backgroundColor: Colors.gray50,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  modalSubTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  modalAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary,
    marginTop: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  optionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  optionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '05',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  optionTextActive: {
    color: Colors.primary,
  },
  uploadBox: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.gray50,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  uploadText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: Colors.gray100,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '900',
    color: 'white',
  },
});
