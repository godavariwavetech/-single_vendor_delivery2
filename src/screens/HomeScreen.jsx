import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Platform,
  Alert,
  Linking, // <-- Add this import
} from 'react-native';

import { useNavigation, useFocusEffect,useRoute } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { fetchOrders } from '../redux/slices/orderSlice';
import { colors } from '../theme/colors';
import { commonStyles } from '../theme/commonStyles';
import CustomStatusBar from '../components/CustomStatusBar';
import { getOrderTypeColor, getOrderTypeIcon, getOrderTypeText } from '../utils/orderTypeHelpers';

const OrderCard = ({ order, onPress }) => {
  if (!order) return null; // Add null check for order

  const getStatusColor = (status) => {
    // if (!status) return colors.text.secondary;
    return colors.status[status===0 ? 'assigned' : status===1 ? 'picked' : status===2 ? 'delivered' : status===3 ? 'cancelled' : 'info'] || colors.text.secondary;
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0:
        return 'Pending';
      case 1:
        return 'Picked';
      case 2:
        return 'Delivered';
      case 3:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 0:
        return 'assignment';
      case 1:
        return 'delivery-dining';
      case 2:
        return 'check-circle';
      case 3:
        return 'cancel';
      default:
        return 'info';
    }
  };


  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return `₹${amount}`;
    return `₹${amount.toFixed(2)}`;
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'No date available';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Helper to open address in Google Maps
  const openInMaps = (address) => {
    if (!address) return;
    const url = Platform.select({
      ios: `http://maps.apple.com/?q=${encodeURIComponent(address)}`,
      android: `geo:0,0?q=${encodeURIComponent(address)}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    });
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open maps.');
    });
  };

  return (
    <TouchableOpacity 
      style={[commonStyles.card, styles.orderCard]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.orderInfo}>
        <View style={styles.orderMetaInfo}>
          <View style={styles.iconTextRow}>
            <Icon name="receipt" size={16} color={colors.text.secondary} style={styles.infoIcon} />
            <Text style={styles.orderNumber} numberOfLines={1}>{order.order_id || 'No Order Number'}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: getStatusColor(order.order_status) }]}>
            <Icon name={getStatusIcon(order.order_status)} size={14} color={colors.white} style={styles.badgeIcon} />
            <Text style={styles.badgeText}>{getStatusText(order.order_status) || 'Unknown'}</Text>
          </View>
        </View>
        <View style={styles.orderTypeRow}>
          <View style={[styles.orderTypeBadge, { backgroundColor: getOrderTypeColor(order.order_type) }]}>
            <Icon name={getOrderTypeIcon(order.order_type)} size={12} color={colors.white} style={styles.badgeIcon} />
            <Text style={styles.orderTypeBadgeText}>{getOrderTypeText(order.order_type)}</Text>
          </View>
        </View>
        <View style={styles.iconTextRow}>
          <Icon name="access-time" size={14} color={colors.text.light} style={styles.infoIcon} />
          <Text style={styles.dateTime}>{order.order_datetime}</Text>
        </View>
        <View style={styles.iconTextRow}>
          <Icon name="person" size={16} color={colors.text.primary} style={styles.infoIcon} />
          <Text style={styles.customerName}>{order.customer_name || 'No Customer Name'}</Text>
        </View>
      </View>
      
      <View style={styles.addressContainer}>
        <Icon name="location-on" size={16} color={colors.text.secondary} style={styles.addressIcon} />
        <TouchableOpacity onPress={() => openInMaps(order.delivery_address)} activeOpacity={0.7} style={{flex: 1}}>
          <Text style={styles.address} numberOfLines={2}>{order.delivery_address || 'No address provided'}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.paymentMethod}>
          <Icon 
            name={order.paymentMethod?.toLowerCase().includes('cod') ? 'payments' : 'account-balance-wallet'} 
            size={16} 
            color={colors.text.secondary} 
          />
          <Text style={styles.paymentText}>{order.payment_type || 'Payment  not specified'}</Text>
        </View>
        <Text style={styles.amount}>{formatCurrency(order.grand_total)}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const route = useRoute(); // get route params
  
  const user = useSelector((state) => state.auth.user);
  const { orders, loading, error } = useSelector((state) => state.orders);
  console.log("hie", orders)
  // Check if user is logged in and has delivery_boy_id
  const isUserValid = user && user.id;
  
  // Filter active orders (assigned or picked)
  const activeOrders = orders.filter(order => 
    order.order_status === 0 || 
    order.order_status === 1
  );

  const handleFetchOrders = async () => {
    if (!isUserValid) {
      Alert.alert(
        'Error',
        'Please log in again to view orders.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await dispatch(fetchOrders()).unwrap();
    } catch (error) {
      Alert.alert(
        'Error',
        error || 'Failed to fetch orders. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await handleFetchOrders();
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      if (isUserValid) {
        handleFetchOrders();
        // Remove refreshOrders param if it exists
        if (route.params?.refreshOrders) {
          navigation.setParams({ refreshOrders: false });
        }
      }
    }, [isUserValid, route.params])
  );

  if (!isUserValid) {
    return (
      <SafeAreaView style={commonStyles.safeArea}>
        <View style={styles.container}>
          <View style={styles.emptyContainer}>
            <Icon name="error-outline" size={48} color={colors.error} />
            <Text style={[styles.emptyText, { color: colors.error }]}>
              Please log in to view orders
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <CustomStatusBar />
      <SafeAreaView style={commonStyles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.welcomeContainer}>
              <Icon name="person" size={24} color={colors.white} style={styles.userIcon} />
              <Text style={styles.welcomeText}>Welcome, {user?.delivery_boy_name}</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Icon name="assignment" size={16} color={colors.white} style={styles.statIcon} />
                <Text style={styles.statText}>
                  {activeOrders.filter(o => o.order_status === 0).length}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Icon name="delivery-dining" size={16} color={colors.white} style={styles.statIcon} />
                <Text style={styles.statText}>
                    {activeOrders.filter(o => o.order_status === 1).length}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Active Orders</Text>

          <FlatList
            data={activeOrders}
            keyExtractor={(item) => item.id?.toString()}
            renderItem={({ item }) => (
              <OrderCard
                order={item}
                onPress={() => navigation.navigate('OrderDetails', { order: item })}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing || loading} 
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon 
                  name={error ? "error-outline" : "inbox"} 
                  size={48} 
                  color={error ? colors.error : colors.text.light} 
                />
                <Text style={[styles.emptyText, error && { color: colors.error }]}>
                  {error ? error : 'No active orders'}
                </Text>
                {error && (
                  <TouchableOpacity 
                    style={styles.retryButton} 
                    onPress={handleFetchOrders}
                  >
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIcon: {
    marginRight: 8,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  profileButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    marginRight: 2,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginHorizontal: 16,
    marginTop: 10
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  orderCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  orderInfo: {
    flex: 1,
    paddingRight: 4,
    paddingBottom: 4,
  },
  orderMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    flexWrap: 'nowrap',
  },
  orderTypeRow: {
    marginTop: 4,
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  orderTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  orderTypeBadgeText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: '600',
    marginLeft: 4,
  },
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0, // Ensures text can be truncated
  },
  infoIcon: {
    marginRight: 4,
    width: 16,
  },
  orderNumber: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
    marginRight: 8,
    minWidth: 0, // Ensures text can be truncated
  },
  dateTime: {
    fontSize: 12,
    color: colors.text.light,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  badge: {
    ...commonStyles.badge,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 60,
    maxWidth: 80,
    justifyContent: 'center',
    flexShrink: 0, // Prevents badge from shrinking
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    ...commonStyles.badgeText,
    fontSize: 10,
    flexShrink: 1, // Allows text to shrink if needed
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    backgroundColor: colors.background,
    padding: 8,
    borderRadius: 8,
  },
  addressIcon: {
    marginRight: 4,
    marginTop: 2,
  },
  address: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
  },
  restaurantContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  restaurantIcon: {
    marginRight: 4,
  },
  restaurant: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.light,
    marginTop: 16,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
