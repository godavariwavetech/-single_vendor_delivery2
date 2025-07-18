import React, { useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  SafeAreaView, 
  ActivityIndicator, 
  Platform, 
  TouchableOpacity,
  RefreshControl 
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../theme/colors';
import { commonStyles, spacing, typography, radius, shadows } from '../theme/commonStyles';
import CustomHeader from '../components/CustomHeader';
import CustomStatusBar from '../components/CustomStatusBar';
import { fetchDeliveredOrders } from '../redux/slices/orderSlice';

const DeliveredOrdersScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { deliveredOrders = [], loading, error } = useSelector(state => state.orders || {});
  const [refreshing, setRefreshing] = React.useState(false);

  // Function to fetch orders
  const fetchOrders = useCallback(() => {
    dispatch(fetchDeliveredOrders());
  }, [dispatch]);

  // Handle pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchDeliveredOrders());
    setRefreshing(false);
  }, [dispatch]);

  // Fetch orders when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '₹0.00';
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const renderItem = ({ item }) => {
    if (!item) return null;

    return (
      <TouchableOpacity 
        style={[commonStyles.card, styles.orderCard]}
        onPress={() => navigation.navigate('OrderDetails',  { order: item })}
        activeOpacity={0.7}
      >
        <View style={[commonStyles.row, commonStyles.spaceBetween]}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>Order #{item.order_id || 'No Order Number'}</Text>
            <Text style={styles.customerName}>{item.customer_name || 'No Customer Name'}</Text>
            <Text style={styles.deliveryDate}>
              Delivered on {formatDate(item.order_date_time)}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.status.delivered }]}>
            <Icon name="check-circle" size={14} color={colors.text.inverse} style={styles.badgeIcon} />
            <Text style={styles.badgeText}>Delivered</Text>
          </View>
        </View>
        
        <View style={styles.addressContainer}>
          <Icon name="location-on" size={16} color={colors.text.secondary} style={styles.addressIcon} />
          <Text style={styles.address} numberOfLines={2}>{item.delivery_address || 'No address provided'}</Text>
        </View>

        {item.items && item.items.length > 0 && (
          <View style={styles.itemsContainer}>
            <Icon name="shopping-bag" size={16} color={colors.text.secondary} style={styles.itemsIcon} />
            <Text style={styles.itemsText}>{item.items.length} items</Text>
          </View>
        )}
        
        <View style={styles.footer}>
          <View style={styles.paymentMethod}>
            <Icon 
              name={item.payment_type?.toLowerCase().includes('cod') ? 'payments' : 'account-balance-wallet'} 
              size={16} 
              color={colors.text.secondary} 
            />
            <Text style={styles.paymentText}>{item.payment_type || 'Payment method not specified'}</Text>
          </View>
          <Text style={styles.amount}>{formatCurrency(Number(item.grand_total))}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.mainContainer}>
        <CustomStatusBar />
        <SafeAreaView style={commonStyles.safeArea}>
          <CustomHeader 
            title="Delivered Orders"
            showBack={true}
            onBackPress={() => navigation.goBack()}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.mainContainer}>
        <CustomStatusBar />
        <SafeAreaView style={commonStyles.safeArea}>
          <CustomHeader 
            title="Delivered Orders"
            showBack={true}
            onBackPress={() => navigation.goBack()}
          />
          <View style={styles.errorContainer}>
            <Icon name="error-outline" size={48} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={[commonStyles.button, styles.retryButton]}
              onPress={fetchOrders}
            >
              <Text style={commonStyles.buttonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <CustomStatusBar />
      <SafeAreaView style={commonStyles.safeArea}>
        <CustomHeader 
          title={`Delivered Orders (${deliveredOrders.length})`}
          showBack={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.container}>
          {deliveredOrders.length > 0 ? (
            <FlatList
              data={deliveredOrders}
              renderItem={renderItem}
              keyExtractor={(item) => item?.order_id?.toString() || Math.random().toString()}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="inbox" size={48} color={colors.text.tertiary} />
              <Text style={styles.emptyText}>No delivered orders yet</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContainer: {
    padding: spacing.md,
  },
  orderCard: {
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    ...shadows.md,
  },
  orderInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  orderNumber: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  customerName: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  deliveryDate: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.round,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIcon: {
    marginRight: spacing.xs,
  },
  badgeText: {
    ...typography.caption,
    color: colors.text.inverse,
    fontWeight: '600',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
  },
  addressIcon: {
    marginRight: spacing.xs,
    marginTop: 2,
  },
  address: {
    ...typography.body2,
    color: colors.text.secondary,
    flex: 1,
  },
  restaurantContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  restaurantIcon: {
    marginRight: spacing.xs,
  },
  restaurant: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  amount: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.body1,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  errorText: {
    marginTop: spacing.md,
    ...typography.body1,
    color: colors.text.error,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  emptyText: {
    ...typography.body1,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  itemsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  itemsIcon: {
    marginRight: spacing.xs,
  },
  itemsText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  retryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
  },
});

export default DeliveredOrdersScreen; 