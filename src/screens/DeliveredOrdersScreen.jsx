import React, { useEffect, useCallback, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  SafeAreaView, 
  ActivityIndicator, 
  Platform, 
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  TextInput
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../theme/colors';
import { commonStyles, spacing, typography, radius, shadows } from '../theme/commonStyles';
import CustomHeader from '../components/CustomHeader';
import CustomStatusBar from '../components/CustomStatusBar';
import { fetchDeliveredOrders, resetDeliveredOrdersPagination } from '../redux/slices/orderSlice';
import { getOrderTypeColor, getOrderTypeIcon, getOrderTypeText } from '../utils/orderTypeHelpers';

const DeliveredOrdersScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { deliveredOrders = [], deliveredOrdersMeta = {}, loading, error } = useSelector(state => state.orders || {});
  const [refreshing, setRefreshing] = React.useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    paymentType: '',
    orderType: '',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: '',
    customerName: ''
  });
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allOrders, setAllOrders] = useState([]); // Store all loaded orders
  const ITEMS_PER_PAGE = 20; // Load 20 orders at a time
  
  // Debounce timer for filters (using useRef to avoid dependency issues)
  const filterDebounceTimer = useRef(null);
  
  console.log("deliverd orders", deliveredOrders)
  console.log("filtered orders", filteredOrders)
  console.log("filters", filters)
  console.log("hasActiveFilters", hasActiveFilters)
  // Function to fetch orders with pagination
  const fetchOrders = useCallback((page = 1, reset = false) => {
    if (reset) {
      setCurrentPage(1);
      setAllOrders([]);
      setHasMoreData(true);
      dispatch(resetDeliveredOrdersPagination());
    }
    
    // Call the API with pagination parameters
    dispatch(fetchDeliveredOrders({ 
      page, 
      limit: ITEMS_PER_PAGE, 
      reset 
    }));
  }, [dispatch, ITEMS_PER_PAGE]);

  // Handle pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders(1, true); // Reset to first page
    setRefreshing(false);
  }, [fetchOrders]);

  // Load more data for pagination
  const loadMoreData = useCallback(async () => {
    if (!deliveredOrdersMeta.hasMore || deliveredOrdersMeta.loading) return;
    
    const nextPage = deliveredOrdersMeta.currentPage + 1;
    
    try {
      // Fetch the next page from API
      await dispatch(fetchDeliveredOrders({ 
        page: nextPage, 
        limit: ITEMS_PER_PAGE,
        reset: false 
      }));
    } catch (error) {
      console.error('Error loading more data:', error);
    }
  }, [deliveredOrdersMeta.hasMore, deliveredOrdersMeta.loading, deliveredOrdersMeta.currentPage, dispatch, ITEMS_PER_PAGE]);

  // Fetch orders when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  // Apply filters to orders with debouncing
  const applyFilters = useCallback(() => {
    // Clear existing timer
    if (filterDebounceTimer.current) {
      clearTimeout(filterDebounceTimer.current);
    }

    // Set new timer for debouncing
    filterDebounceTimer.current = setTimeout(() => {
      let filtered = [...allOrders.length > 0 ? allOrders : deliveredOrders];

      if (filters.paymentType) {
        filtered = filtered.filter(order => 
          order.payment_type?.toLowerCase().includes(filters.paymentType.toLowerCase())
        );
      }

      if (filters.orderType) {
        filtered = filtered.filter(order => 
          order.order_type?.toLowerCase().includes(filters.orderType.toLowerCase())
        );
      }

      if (filters.customerName) {
        filtered = filtered.filter(order => 
          order.customer_name?.toLowerCase().includes(filters.customerName.toLowerCase())
        );
      }

      if (filters.minAmount) {
        const minAmount = parseFloat(filters.minAmount);
        filtered = filtered.filter(order => 
          parseFloat(order.grand_total) >= minAmount
        );
      }

      if (filters.maxAmount) {
        const maxAmount = parseFloat(filters.maxAmount);
        filtered = filtered.filter(order => 
          parseFloat(order.grand_total) <= maxAmount
        );
      }

      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.order_date_time);
          return orderDate >= startDate;
        });
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999); // Include the entire end date
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.order_date_time);
          return orderDate <= endDate;
        });
      }

      setFilteredOrders(filtered);
    }, 300); // 300ms debounce delay
  }, [allOrders, deliveredOrders, filters]);

  // Update allOrders when deliveredOrders change (for pagination)
  useEffect(() => {
    if (deliveredOrders.length > 0) {
      setAllOrders(prevOrders => {
        // If it's a fresh load (page 1), replace all orders
        if (deliveredOrdersMeta.currentPage === 1) {
          return deliveredOrders;
        }
        // Otherwise, append new orders (for pagination)
        return [...prevOrders, ...deliveredOrders];
      });
    }
  }, [deliveredOrders, deliveredOrdersMeta.currentPage]);

  // Update filtered orders when orders or filters change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (filterDebounceTimer.current) {
        clearTimeout(filterDebounceTimer.current);
      }
    };
  }, []);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      paymentType: '',
      orderType: '',
      minAmount: '',
      maxAmount: '',
      startDate: '',
      endDate: '',
      customerName: ''
    });
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  // Date handling functions
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'Select Date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Select Date';
    }
  };

  const formatDateForFilter = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setFilters(prev => ({ ...prev, startDate: formatDateForFilter(selectedDate) }));
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setFilters(prev => ({ ...prev, endDate: formatDateForFilter(selectedDate) }));
    }
  };

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
              Delivered on {item.order_deliverd_date_time}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.status.delivered }]}>
            <Icon name="check-circle" size={14} color={colors.text.inverse} style={styles.badgeIcon} />
            <Text style={styles.badgeText}>Delivered</Text>
          </View>
        </View>
        
        <View style={styles.orderTypeRow}>
          <View style={[styles.badge, { backgroundColor: getOrderTypeColor(item.order_type) }]}>
            <Icon name={getOrderTypeIcon(item.order_type)} size={12} color={colors.white} style={styles.badgeIcon} />
            <Text style={styles.badgeText}>{getOrderTypeText(item.order_type)}</Text>
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
          title={`Delivered Orders (${filteredOrders.length})`}
          showBack={true}
          onBackPress={() => navigation.goBack()}
          rightComponent={
            <TouchableOpacity 
              style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
              onPress={() => {
                console.log("Filter button pressed");
                setShowFilterModal(true);
              }}
            >
              <Icon 
                name="filter-list" 
                size={20} 
                color={colors.white} 
              />
              {hasActiveFilters && <View style={styles.filterBadge} />}
            </TouchableOpacity>
          }
        />
        <View style={styles.container}>
          {hasActiveFilters && (
            <View style={styles.filterInfo}>
              <Text style={styles.filterInfoText}>
                Showing {filteredOrders.length} of {deliveredOrders.length} orders
                {deliveredOrdersMeta.total > 0 && ` (${deliveredOrdersMeta.total} total)`}
              </Text>
              <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
                <Text style={styles.clearFiltersText}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {filteredOrders.length > 0 ? (
            <FlatList
              data={filteredOrders}
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
              onEndReached={loadMoreData}
              onEndReachedThreshold={0.1}
              ListFooterComponent={() => (
                deliveredOrdersMeta.loading ? (
                  <View style={styles.loadingMoreContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.loadingMoreText}>Loading more orders...</Text>
                  </View>
                ) : !deliveredOrdersMeta.hasMore && deliveredOrders.length > 0 ? (
                  <View style={styles.endOfListContainer}>
                    <Text style={styles.endOfListText}>No more orders to load</Text>
                  </View>
                ) : null
              )}
            />
          ) : allOrders.length > 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="filter-list-off" size={48} color={colors.text.tertiary} />
              <Text style={styles.emptyText}>No orders match your filters</Text>
              <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
                <Text style={styles.clearFiltersText}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="inbox" size={48} color={colors.text.tertiary} />
              <Text style={styles.emptyText}>No delivered orders yet</Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Orders</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Icon name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Customer Name Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Customer Name</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Search by customer name"
                value={filters.customerName}
                onChangeText={(text) => setFilters(prev => ({ ...prev, customerName: text }))}
              />
            </View>

            {/* Payment Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Payment Type</Text>
              <View style={styles.filterOptions}>
                {['COD', 'PayOnline', 'UPI', 'Card'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterOption,
                      filters.paymentType === type && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters(prev => ({ 
                      ...prev, 
                      paymentType: prev.paymentType === type ? '' : type 
                    }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.paymentType === type && styles.filterOptionTextActive
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Order Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Order Type</Text>
              <View style={styles.filterOptions}>
                {['normal', 'subscription'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterOption,
                      filters.orderType === type && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters(prev => ({ 
                      ...prev, 
                      orderType: prev.orderType === type ? '' : type 
                    }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.orderType === type && styles.filterOptionTextActive
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Amount Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Amount Range</Text>
              <View style={styles.amountRangeContainer}>
                <TextInput
                  style={[styles.filterInput, styles.amountInput]}
                  placeholder="Min Amount"
                  value={filters.minAmount}
                  onChangeText={(text) => setFilters(prev => ({ ...prev, minAmount: text }))}
                  keyboardType="numeric"
                />
                <Text style={styles.amountRangeText}>to</Text>
                <TextInput
                  style={[styles.filterInput, styles.amountInput]}
                  placeholder="Max Amount"
                  value={filters.maxAmount}
                  onChangeText={(text) => setFilters(prev => ({ ...prev, maxAmount: text }))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Date Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Date Range</Text>
              <View style={styles.dateRangeContainer}>
                <TouchableOpacity
                  style={[styles.datePickerButton, filters.startDate && styles.datePickerButtonActive]}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Icon name="calendar-today" size={16} color={filters.startDate ? colors.primary : colors.text.secondary} />
                  <Text style={[styles.datePickerText, filters.startDate && styles.datePickerTextActive]}>
                    {formatDateForDisplay(filters.startDate)}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.dateRangeText}>to</Text>
                <TouchableOpacity
                  style={[styles.datePickerButton, filters.endDate && styles.datePickerButtonActive]}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Icon name="calendar-today" size={16} color={filters.endDate ? colors.primary : colors.text.secondary} />
                  <Text style={[styles.datePickerText, filters.endDate && styles.datePickerTextActive]}>
                    {formatDateForDisplay(filters.endDate)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={clearFilters}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={filters.startDate ? new Date(filters.startDate) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDateChange}
          maximumDate={new Date()}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={filters.endDate ? new Date(filters.endDate) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndDateChange}
          maximumDate={new Date()}
        />
      )}
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
  orderTypeRow: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
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
  // Filter Button Styles
  filterButton: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  // Filter Info Styles
  filterInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  filterInfoText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  clearFiltersButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  clearFiltersText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background,
  },
  // Filter Section Styles
  filterSection: {
    marginVertical: spacing.md,
  },
  filterLabel: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body2,
    color: colors.text.primary,
    backgroundColor: colors.background,
  },
  // Filter Options Styles
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterOptionText: {
    ...typography.body2,
    color: colors.text.primary,
  },
  filterOptionTextActive: {
    color: colors.text.inverse,
  },
  // Amount Range Styles
  amountRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
    marginRight: spacing.sm,
  },
  amountRangeText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginHorizontal: spacing.sm,
  },
  // Date Range Styles
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
  },
  datePickerButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  datePickerText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
    flex: 1,
  },
  datePickerTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  dateRangeText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginHorizontal: spacing.sm,
  },
  // Modal Footer Button Styles
  clearButton: {
    flex: 1,
    paddingVertical: spacing.md,
    marginRight: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  clearButtonText: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: spacing.md,
    marginLeft: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    ...typography.body1,
    color: colors.text.inverse,
    fontWeight: '600',
  },
  // Pagination Styles
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  loadingMoreText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  endOfListContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  endOfListText: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
});

export default DeliveredOrdersScreen; 