import React, { useMemo, useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Dimensions, Platform,
  Linking, Modal, Image, ActivityIndicator, ScrollView, StatusBar,
  TextInput
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { orderApi } from '@/api/orderApi';
import { useToast } from '@/contexts/ToastContext';

const { width: SW, height: SH } = Dimensions.get('window');
const FALLBACK_IMAGE = require('../assets/payment.png');

// ─── Fullscreen Image Viewer ──────────────────────────────────────────────────
function FullscreenImageViewer({
  visible,
  imageSource,
  onClose,
}: {
  visible: boolean;
  imageSource: { uri: string } | number;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={fs.root}>
        {/* Close Button */}
        <TouchableOpacity style={fs.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <View style={fs.closePill}>
            <Icon name="close" size={20} color="#fff" />
            <Text style={fs.closeLabel}>Close</Text>
          </View>
        </TouchableOpacity>

        {/* Title badge */}
        <View style={fs.badge}>
          <Icon name="qr-code-scanner" size={16} color={Colors.primary} />
          <Text style={fs.badgeText}>Payment QR / Details</Text>
        </View>

        {/* Image */}
        <Image
          source={imageSource}
          style={fs.image}
          resizeMode="contain"
        />

        {/* Bottom hint */}
        <View style={fs.hint}>
          <Text style={fs.hintText}>Show this to customer for online payment</Text>
        </View>
      </View>
    </Modal>
  );
}

// ─── Payment Collection Modal ─────────────────────────────────────────────────
function PaymentModal({
  visible,
  orderId,
  totalAmount,
  paymentMethod,
  isUpdating,
  paymentImageSource,
  onSelectMethod,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  orderId: string;
  totalAmount: number;
  paymentMethod: 'Cash' | 'Online' | 'Split' | null;
  isUpdating: boolean;
  paymentImageSource: { uri: string } | number;
  onSelectMethod: (m: 'Cash' | 'Online' | 'Split') => void;
  onConfirm: (cash?: number, online?: number) => void;
  onClose: () => void;
}) {
  const [fsVisible, setFsVisible] = useState(false);
  const [cashVal, setCashVal] = useState('');
  const [onlineVal, setOnlineVal] = useState('');

  const sanitizeNumberInput = (text: string) => {
    let cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
  };

  // Reset inputs when modal is closed or opened
  useEffect(() => {
    if (!visible) {
      setCashVal('');
      setOnlineVal('');
    }
  }, [visible]);

  const cashAmount = parseFloat(cashVal) || 0;
  const onlineAmount = parseFloat(onlineVal) || 0;
  const sumAmount = cashAmount + onlineAmount;
  
  // Validation checks for split payment
  const isSplitValid = Math.abs(sumAmount - totalAmount) < 0.01;
  const isConfirmDisabled = isUpdating || !paymentMethod || (paymentMethod === 'Split' && !isSplitValid);

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={m.overlay}>
          <View style={m.sheet}>
            {/* Handle bar */}
            <View style={m.handle} />

            {/* Header */}
            <View style={m.header}>
              <Text style={m.title}>Collect Payment</Text>
              <TouchableOpacity style={m.headerClose} onPress={onClose}>
                <Icon name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Order summary pill */}
            <View style={m.summaryPill}>
              <View>
                <Text style={m.summaryLabel}>Order #{orderId.slice(-6).toUpperCase()}</Text>
                <Text style={m.summaryAmount}>₹{totalAmount}</Text>
              </View>
              <View style={m.amountBadge}>
                <Icon name="payments" size={18} color={Colors.primary} />
                <Text style={m.amountBadgeText}>COD</Text>
              </View>
            </View>

            {/* Payment method selector */}
            <Text style={m.sectionLabel}>How did customer pay?</Text>
            <View style={m.methodRow}>
              {/* Cash */}
              <TouchableOpacity
                style={[m.methodCard, paymentMethod === 'Cash' && m.methodCardActive]}
                onPress={() => onSelectMethod('Cash')}
                activeOpacity={0.8}
              >
                <View style={[m.methodIcon, paymentMethod === 'Cash' && m.methodIconActive]}>
                  <Icon name="payments" size={24} color={paymentMethod === 'Cash' ? '#fff' : Colors.gray400} />
                </View>
                <Text style={[m.methodLabel, paymentMethod === 'Cash' && m.methodLabelActive, { fontSize: 12 }]}>Cash</Text>
                {paymentMethod === 'Cash' && (
                  <View style={m.checkBadge}>
                    <Icon name="check" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>

              {/* Online */}
              <TouchableOpacity
                style={[m.methodCard, paymentMethod === 'Online' && m.methodCardActive]}
                onPress={() => onSelectMethod('Online')}
                activeOpacity={0.8}
              >
                <View style={[m.methodIcon, paymentMethod === 'Online' && m.methodIconActive]}>
                  <Icon name="qr-code-scanner" size={24} color={paymentMethod === 'Online' ? '#fff' : Colors.gray400} />
                </View>
                <Text style={[m.methodLabel, paymentMethod === 'Online' && m.methodLabelActive, { fontSize: 12 }]}>Online</Text>
                {paymentMethod === 'Online' && (
                  <View style={m.checkBadge}>
                    <Icon name="check" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>

              {/* Split */}
              <TouchableOpacity
                style={[m.methodCard, paymentMethod === 'Split' && m.methodCardActive]}
                onPress={() => onSelectMethod('Split')}
                activeOpacity={0.8}
              >
                <View style={[m.methodIcon, paymentMethod === 'Split' && m.methodIconActive]}>
                  <Icon name="call-split" size={24} color={paymentMethod === 'Split' ? '#fff' : Colors.gray400} library="material" />
                </View>
                <Text style={[m.methodLabel, paymentMethod === 'Split' && m.methodLabelActive, { fontSize: 12 }]}>Split</Text>
                {paymentMethod === 'Split' && (
                  <View style={m.checkBadge}>
                    <Icon name="check" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Split inputs */}
            {paymentMethod === 'Split' && (
              <View style={m.splitSection}>
                <View style={m.inputGroupRow}>
                  <View style={m.inputGroup}>
                    <Text style={m.inputLabel}>Cash Amount (₹)</Text>
                    <TextInput
                      style={m.textInput}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor={Colors.gray400}
                      value={cashVal}
                      onChangeText={(val) => setCashVal(sanitizeNumberInput(val))}
                    />
                  </View>
                  <View style={m.inputGroup}>
                    <Text style={m.inputLabel}>Online Amount (₹)</Text>
                    <TextInput
                      style={m.textInput}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor={Colors.gray400}
                      value={onlineVal}
                      onChangeText={(val) => setOnlineVal(sanitizeNumberInput(val))}
                    />
                  </View>
                </View>

                {/* Split Status indicator */}
                <View style={m.statusIndicatorRow}>
                  {!isSplitValid ? (
                    sumAmount < totalAmount ? (
                      <View style={[m.statusPill, m.statusPillWarning]}>
                        <Icon name="warning" size={14} color="#E65100" />
                        <Text style={[m.statusText, { color: '#E65100' }]}>
                          Remaining: ₹{(totalAmount - sumAmount).toFixed(2)}
                        </Text>
                      </View>
                    ) : (
                      <View style={[m.statusPill, m.statusPillDanger]}>
                        <Icon name="error" size={14} color="#C62828" />
                        <Text style={[m.statusText, { color: '#C62828' }]}>
                          Excess: ₹{(sumAmount - totalAmount).toFixed(2)}
                        </Text>
                      </View>
                    )
                  ) : (
                    <View style={[m.statusPill, m.statusPillSuccess]}>
                      <Icon name="check-circle" size={14} color="#2E7D32" />
                      <Text style={[m.statusText, { color: '#2E7D32' }]}>
                        Balanced (Total: ₹{totalAmount})
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ── QR / Payment Image – shown for Online or Split ── */}
            {(paymentMethod === 'Online' || paymentMethod === 'Split') && (
              <View style={m.qrSection}>
                <View style={m.qrHeader}>
                  <Icon name="info" size={16} color={Colors.info} />
                  <Text style={m.qrHeaderText}>Show QR to customer</Text>
                </View>

                {/* Tap-to-fullscreen image */}
                <TouchableOpacity
                  style={m.qrImageWrap}
                  onPress={() => setFsVisible(true)}
                  activeOpacity={0.85}
                >
                  <Image source={paymentImageSource} style={m.qrImage} resizeMode="contain" />

                  {/* Expand hint overlay */}
                  <View style={m.expandHint}>
                    <View style={m.expandPill}>
                      <Icon name="fullscreen" size={16} color="#fff" />
                      <Text style={m.expandText}>Tap to expand</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <Text style={m.qrNote}>
                  {paymentMethod === 'Split' 
                    ? `Ask the customer to scan and pay the online portion of ₹${onlineAmount.toFixed(2)} before confirming.`
                    : `Ask the customer to scan and pay ₹${totalAmount} before confirming.`}
                </Text>
              </View>
            )}

            {/* Action buttons */}
            <View style={m.actions}>
              <TouchableOpacity style={m.cancelBtn} onPress={onClose}>
                <Text style={m.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[m.confirmBtn, isConfirmDisabled && m.confirmBtnDisabled]}
                onPress={() => onConfirm(cashAmount, onlineAmount)}
                disabled={isConfirmDisabled}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={paymentMethod ? Colors.gradientPrimary as [string, string] : ['#CBD5E1', '#CBD5E1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={m.confirmGrad}
                >
                  {isUpdating
                    ? <ActivityIndicator color="#fff" size="small" />
                    : (
                      <>
                        <Icon name="check-circle" size={18} color="#fff" />
                        <Text style={m.confirmText}>Confirm Delivery</Text>
                      </>
                    )
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Fullscreen viewer sits outside the bottom sheet modal */}
      <FullscreenImageViewer visible={fsVisible} imageSource={paymentImageSource} onClose={() => setFsVisible(false)} />
    </>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function OrderDetailsScreen() {
  const { orderData } = useLocalSearchParams();
  const order = useMemo(() => orderData ? JSON.parse(orderData as string) : null, [orderData]);
  const { showToast } = useToast();

  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Online' | 'Split' | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [paymentQrUrl, setPaymentQrUrl] = useState<string | null>(null);

  // Fetch admin-configured payment QR on mount
  useEffect(() => {
    orderApi.getAppSettings().then((res) => {
      if (res?.success && res?.data?.paymentQrUrl) {
        setPaymentQrUrl(res.data.paymentQrUrl);
      }
    }).catch(() => {});
  }, []);

  const paymentImageSource: { uri: string } | number =
    paymentQrUrl ? { uri: paymentQrUrl } : FALLBACK_IMAGE;

  const handleUpdateStatus = async (forcedStatus?: string, forcedMethod?: string, cashAmount?: number, onlineAmount?: number) => {
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
    const res = await orderApi.updateOrderStatus(order._id, nextStatus, forcedMethod, cashAmount, onlineAmount);
    setIsUpdating(false);

    if (res.success) {
      showToast(`Order status updated to ${nextStatus}`, 'success');
      setIsPaymentModalVisible(false);
      router.back();
    } else {
      showToast(res.message || 'Failed to update status', 'error');
    }
  };

  const confirmCODelivery = (cash?: number, online?: number) => {
    if (!paymentMethod) {
      showToast('Please select a payment method', 'error');
      return;
    }
    handleUpdateStatus('Delivered', paymentMethod, cash, online);
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
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

        {/* Customer */}
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
            <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${order.customer?.phone}`)}>
              <Icon name="phone" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Address */}
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

        {/* Items */}
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

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Footer CTA */}
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

      {/* Payment Modal */}
      <PaymentModal
        visible={isPaymentModalVisible}
        orderId={order._id}
        totalAmount={order.totalAmount}
        paymentMethod={paymentMethod}
        isUpdating={isUpdating}
        paymentImageSource={paymentImageSource}
        onSelectMethod={setPaymentMethod}
        onConfirm={confirmCODelivery}
        onClose={() => { setIsPaymentModalVisible(false); setPaymentMethod(null); }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  scrollContent: { padding: 20 },
  statusCard: {
    backgroundColor: 'white', borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24,
  },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  statusLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  statusValue: { fontSize: 22, fontWeight: '900', color: Colors.primary, marginTop: 4 },
  orderValBox: { alignItems: 'flex-end' },
  valText: { fontSize: 20, fontWeight: '900', color: Colors.textPrimary },
  payMode: { fontSize: 11, fontWeight: '800', marginTop: 4, textTransform: 'uppercase' },
  line: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { fontSize: 14, color: Colors.textSecondary, marginLeft: 12, fontWeight: '500' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12, marginLeft: 4 },
  customerCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0',
  },
  custAvatar: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.primary + '10', alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  avatarTxt: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  custName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  custPhone: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  callBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  addressCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  addressText: { fontSize: 15, color: Colors.textPrimary, fontWeight: '600', lineHeight: 22 },
  zipText: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  mapBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary + '10', paddingVertical: 14, borderRadius: 14, gap: 8,
  },
  mapBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '800' },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
    padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9',
  },
  itemDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginRight: 12 },
  itemName: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  itemQty: { fontSize: 14, color: Colors.textSecondary, marginHorizontal: 12 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'white', padding: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0',
  },
  deliverBtn: { borderRadius: 16, overflow: 'hidden' },
  btnGradient: { paddingVertical: 18, alignItems: 'center' },
  btnTxt: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
});

// Payment modal styles
const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    maxHeight: SH * 0.92,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.gray200, alignSelf: 'center', marginBottom: 20,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary },
  headerClose: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center',
  },
  summaryPill: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.primary + '08',
    borderWidth: 1, borderColor: Colors.primary + '20',
    borderRadius: 18, padding: 16, marginBottom: 24,
  },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase' },
  summaryAmount: { fontSize: 24, fontWeight: '900', color: Colors.primary, marginTop: 2 },
  amountBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary + '15', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10,
  },
  amountBadgeText: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginBottom: 14 },
  methodRow: { flexDirection: 'row', gap: 14, marginBottom: 20 },
  methodCard: {
    flex: 1, alignItems: 'center', padding: 18, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.gray50,
    position: 'relative',
  },
  methodCardActive: {
    borderColor: Colors.primary, backgroundColor: Colors.primary + '06',
  },
  methodIcon: {
    width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.gray100, marginBottom: 10,
  },
  methodIconActive: { backgroundColor: Colors.primary },
  methodLabel: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  methodLabelActive: { color: Colors.primary },
  checkBadge: {
    position: 'absolute', top: 10, right: 10,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },

  // QR section
  qrSection: {
    backgroundColor: Colors.info + '08',
    borderWidth: 1, borderColor: Colors.info + '25',
    borderRadius: 20, padding: 16, marginBottom: 20,
  },
  qrHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  qrHeaderText: { fontSize: 14, fontWeight: '700', color: Colors.info },
  qrImageWrap: {
    width: '100%', height: 220,
    borderRadius: 16, overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: Colors.gray200,
    position: 'relative',
  },
  qrImage: { width: '100%', height: '100%' },
  expandHint: {
    position: 'absolute', bottom: 10, right: 10,
  },
  expandPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  expandText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  qrNote: { fontSize: 12, color: Colors.textSecondary, marginTop: 12, lineHeight: 18, textAlign: 'center' },

  // Actions
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 16,
    alignItems: 'center', backgroundColor: Colors.gray100,
  },
  cancelText: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  confirmBtn: { flex: 2, borderRadius: 16, overflow: 'hidden' },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmGrad: {
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8,
  },
  confirmText: { fontSize: 15, fontWeight: '900', color: 'white' },
  splitSection: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  inputGroupRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    height: 48,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusIndicatorRow: {
    marginTop: 12,
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusPillWarning: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFE0B2',
  },
  statusPillDanger: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
  },
  statusPillSuccess: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

// Fullscreen viewer styles
const fs = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 56 : 20, right: 20, zIndex: 10 },
  closePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  closeLabel: { fontSize: 14, fontWeight: '700', color: '#fff' },
  badge: {
    position: 'absolute', top: Platform.OS === 'ios' ? 56 : 20, left: 20,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  badgeText: { fontSize: 13, fontWeight: '700', color: Colors.primaryLight },
  image: { width: SW, height: SH * 0.78 },
  hint: { position: 'absolute', bottom: Platform.OS === 'ios' ? 50 : 24 },
  hintText: { fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
});
