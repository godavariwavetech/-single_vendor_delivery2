import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  PermissionsAndroid,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { colors } from '../theme/colors';
import { commonStyles, spacing, typography, radius } from '../theme/commonStyles';
import CustomHeader from '../components/CustomHeader';
import CustomStatusBar from '../components/CustomStatusBar';
import instance, { API_ENDPOINTS } from '../services/api';
import { getOrderTypeColor, getOrderTypeIcon, getOrderTypeText } from '../utils/orderTypeHelpers';


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

const DetailRow = ({ icon, label, value, isPhone, isAddress }) => (
  <View style={styles.detailRow}>
    <View style={styles.labelWrapper}>
      <Icon name={icon} size={18} color={colors.text.secondary} style={styles.detailIcon} />
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        {isPhone ? (
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${value}`)}>
            <Text style={styles.phoneValue}>{value || 'N/A'}</Text>
          </TouchableOpacity>
        ) : isAddress ? (
          <TouchableOpacity onPress={() => openInMaps(value)} activeOpacity={0.7} style={styles.addressContainer}>
            <Text style={styles.addressValue} numberOfLines={10}>{value || 'N/A'}</Text>
            <View style={styles.addressActionContainer}>
              <Icon name="directions" size={14} color={colors.primary} />
              <Text style={styles.addressActionText}>Tap to open in maps</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <Text style={styles.detailValue} numberOfLines={2}>{value || 'N/A'}</Text>
        )}
      </View>
    </View>
  </View>
);

const OrderItem = ({ item }) => (
  <View style={styles.itemRow}>
    <View style={styles.itemInfo}>
      <Text style={styles.itemName}>{item?.name || 'Unknown Item'}</Text>
      <Text style={styles.itemQuantity}>Quantity Type: {item?.quantityType || 'Unknown'}</Text>
      <Text style={styles.itemQuantity}>Quantity: {item?.quantity || 0}</Text>
    </View>
    <Text style={styles.itemPrice}>₹{(item?.price || 0).toFixed(2)}</Text>
  </View>
);

export default function OrderDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const orderId = route.params?.order?.order_id;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deliveryImage, setDeliveryImage] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);

  console.log("orderdetails", route.params?.order)
  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await instance.get(API_ENDPOINTS.GET_ORDER_DETAILS(orderId));
      const orderData = response.data.data;
      console.log("h===H", orderData)
  

      const transformedOrder = {
        orderNumber: orderData.order_id,
        masterOrderId: orderData.id,
        subscribeId : orderData.subscribe_id,
        customerId : orderData.customer_id,
        customerName: orderData.customer_name,
        customerMobile: orderData.customer_mobile_number,
        status: orderData.order_status,
        orderDateTime: orderData.order_date_time,
        deliveryAddress: orderData.delivery_address,
        paymentType: orderData.payment_type,
        deliveryBoyId: orderData.delivery_boy_id,
        imageCaptureAtCustomer: orderData.image_capture_at_customer,
        deliveryCharges: Number(orderData.delivery_charges),
        totalAmount: Number(orderData.total_amount),
        grandTotal: Number(orderData.grand_total),
        orderInstructions: orderData.order_instructions,
        deliveryInstructions: orderData.delivery_instruction,
        deliveryDateTime: orderData.delivery_date_time, // Added deliveryDateTime
        orderType: orderData.order_type,
        items: orderData.items.map(item => ({
          item_id: item.item_id,
          name: item.item_name,
          image: item.item_image,
          price: Number(item.item_price),
          quantityType: item.quantity_type,
          quantity: item.sub_item_count,
          total: Number(item.item_total_amount)
        })),

        // Calculated fallback total (if needed):
        calculatedTotalAmount: orderData.items.reduce(
          (total, item) => total + Number(item.item_total_amount),
          0
        )
      };

      setOrder(transformedOrder);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch order details');
      console.error('Error fetching order details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.mainContainer}>
        <CustomStatusBar />
        <SafeAreaView style={commonStyles.safeArea}>
          <CustomHeader
            title="Order Details"
            showBack={true}
            onBackPress={() => navigation.goBack()}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading order details...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.mainContainer}>
        <CustomStatusBar />
        <SafeAreaView style={commonStyles.safeArea}>
          <CustomHeader
            title="Order Details"
            showBack={true}
            onBackPress={() => navigation.goBack()}
          />
          <View style={styles.errorContainer}>
            <Icon name="error-outline" size={48} color={colors.error} />
            <Text style={styles.errorText}>{error || 'Order details not found'}</Text>
            <TouchableOpacity
              style={[commonStyles.button, styles.retryButton]}
              onPress={fetchOrderDetails}
            >
              <Text style={commonStyles.buttonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const getStatusColor = (status) => {
    // if (!status) return colors.text.secondary;
    return colors.status[status === 0 ? 'assigned' : status === 1 ? 'picked' : status === 3 ? 'delivered' : status === 2 ? 'cancelled' : 'info'] || colors.text.secondary;
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0:
        return 'Pending';
      case 1:
        return 'Picked';
      case 3:
        return 'Delivered';
      case 2:
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
      case 3:
        return 'check-circle';
      case 2:
        return 'cancel';
      default:
        return 'info';
    }
  };


  const handleCall = () => {
    if (order?.phone) {
      Linking.openURL(`tel:${order.phone}`);
    }
  };

  const showImagePicker = () => {
    setShowImagePickerModal(true);
  };

  const handleImageSourceSelect = (source) => {
    setShowImagePickerModal(false);
    if (source === 'camera') {
      captureImageFromCamera();
    } else if (source === 'gallery') {
      selectImageFromGallery();
    }
  };

  const captureImageFromCamera = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera permission to take delivery confirmation photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Camera permission is required to capture delivery images.');
          return;
        }
      }

      const options = {
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
        includeBase64: true,
      };

      const result = await launchCamera(options);

      if (result.didCancel) {
        // User cancelled
      } else if (result.errorCode) {
        Alert.alert('Error', 'Failed to capture image. Please try again.');
      } else if (result.assets && result.assets[0]) {
        setDeliveryImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Camera Error:', error);
      Alert.alert('Error', 'Failed to access camera. Please check permissions.');
    }
  };

  const selectImageFromGallery = async () => {
    try {
      // react-native-image-picker handles permissions automatically
      // No need to manually request permissions for gallery access
      const options = {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: true,
        maxWidth: 2000,
        maxHeight: 2000,
      };

      const result = await launchImageLibrary(options);

      if (result.didCancel) {
        // User cancelled
      } else if (result.errorCode) {
        Alert.alert('Error', 'Failed to select image. Please try again.');
      } else if (result.assets && result.assets[0]) {
        setDeliveryImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Gallery Error:', error);
      Alert.alert('Error', 'Failed to access gallery. Please try again.');
    }
  };

  const handleDeliveryComplete = async () => {
    if (!deliveryImage) {
      Alert.alert(
        'Image Required',
        'Please capture a delivery confirmation image before marking the order as delivered.',
        [{ text: 'OK', onPress: showImagePicker }]
      );
      return;
    }
  
    try {
      setIsSubmitting(true);
      
      const formData = new FormData();
      formData.append('delivery_image', {
        uri: deliveryImage.uri,
        type: 'image/jpeg',
        name: 'delivery_confirmation.jpg',
      });
      formData.append('subscribe_id', order.subscribeId); // ✅ your internal order_id
      formData.append('status', 2);
      formData.append('order_type', order.orderType); // ✅ send "normal" / "subscription" customerId
      formData.append('customer_id', order.customerId);
      formData.append("amount", order.grandTotal); 
      formData.append("order_number", order.orderNumber);
      console.log("form data", formData)
      const response = await instance.post(
        `/order/${route.params?.order?.id}/complete`, // orderId is the DB `id` field (primary key)
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 10000,
        }
      );
      console.log("submit response", response)
      if (response?.data?.success) {
        Alert.alert(
          'Success',
          'Order has been marked as delivered successfully.',
          [
            {
              text: 'OK',
              onPress: () =>
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'MainTabs',
                      params: {
                        screen: 'HomeTab',
                        params: { refreshOrders: true },
                      },
                    },
                  ],
                }),
            },
          ]
        );
      } else {
        throw new Error(response?.data?.message || 'Unexpected response from server');
      }
    } catch (error) {
      console.error('❌ Delivery completion error:', error);
  
      let message = 'Something went wrong. Please try again.';
  
      if (error.response) {
        message =
          error.response.data?.message ||
          `Server Error (${error.response.status})`;
      } else if (error.request) {
        message =
          'Unable to connect to the server. Please check your internet connection.';
      } else if (error.message.includes('timeout')) {
        message = 'Request timed out. Please try again.';
      }
  
      Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };
  


  // Image preview modal
  const ImagePreviewModal = () => (
    <Modal
      visible={showImagePreview}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowImagePreview(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowImagePreview(false)}
          >
            <Icon name="close" size={24} color={colors.white} />
          </TouchableOpacity>
          {deliveryImage && (
            <Image
              source={{ uri: deliveryImage.uri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}
        </View>
      </View>
    </Modal>
  );

  // Custom Image Picker Action Sheet Modal
  const ImagePickerModal = () => (
    <Modal
      visible={showImagePickerModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowImagePickerModal(false)}
    >
      <View style={styles.actionSheetOverlay}>
        <TouchableOpacity
          style={styles.actionSheetBackdrop}
          activeOpacity={1}
          onPress={() => setShowImagePickerModal(false)}
        />
        <View style={styles.actionSheetContainer}>
          <View style={styles.actionSheetHandle} />
          <Text style={styles.actionSheetTitle}>Select Image Source</Text>
          {/* <Text style={styles.actionSheetSubtitle}>Choose how you want to add an image</Text> */}
          
          <View style={styles.actionSheetButtons}>
            <TouchableOpacity
              style={styles.actionSheetButton}
              onPress={() => handleImageSourceSelect('camera')}
            >
              <View style={styles.actionSheetButtonContent}>
                <View style={[styles.actionSheetIconContainer, { backgroundColor: colors.primary + '20' }]}>
                  <Icon name="camera-alt" size={24} color={colors.primary} />
                </View>
                <View style={styles.actionSheetButtonText}>
                  <Text style={styles.actionSheetButtonTitle}>Camera</Text>
                  <Text style={styles.actionSheetButtonSubtitle}>Take a new photo</Text>
                </View>
                <Icon name="chevron-right" size={20} color={colors.text.secondary} />
              </View>
            </TouchableOpacity>

            {/* <TouchableOpacity
              style={styles.actionSheetButton}
              onPress={() => handleImageSourceSelect('gallery')}
            >
              <View style={styles.actionSheetButtonContent}>
                <View style={[styles.actionSheetIconContainer, { backgroundColor: colors.success + '20' }]}>
                  <Icon name="photo-library" size={24} color={colors.success} />
                </View>
                <View style={styles.actionSheetButtonText}>
                  <Text style={styles.actionSheetButtonTitle}>Gallery</Text>
                  <Text style={styles.actionSheetButtonSubtitle}>Choose from photos</Text>
                </View>
                <Icon name="chevron-right" size={20} color={colors.text.secondary} />
              </View>
            </TouchableOpacity> */}
          </View>

          <TouchableOpacity
            style={styles.actionSheetCancelButton}
            onPress={() => setShowImagePickerModal(false)}
          >
            <Text style={styles.actionSheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
    <View style={styles.mainContainer}>
      <CustomStatusBar />
      <SafeAreaView style={[commonStyles.safeArea, styles.safeAreaContainer]}>
        <CustomHeader
          title="Order Details"
          showBack={true}
          onBackPress={() => navigation.goBack()}
        />
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={commonStyles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.orderId}>{order.orderNumber || 'No Order Number'}</Text>
              <View style={[styles.badge, { backgroundColor: getStatusColor(order.status) }]}>
                <Icon name={getStatusIcon(order.status)} size={14} color={colors.white} style={styles.badgeIcon} />
                <Text style={styles.badgeText}>{getStatusText(order.status) || 'Unknown'}</Text>
              </View>
            </View>
            
            <View style={styles.orderTypeRow}>
              <View style={[styles.badge, { backgroundColor: getOrderTypeColor(order.orderType) }]}>
                <Icon name={getOrderTypeIcon(order.orderType)} size={14} color={colors.white} style={styles.badgeIcon} />
                <Text style={styles.badgeText}>{getOrderTypeText(order.orderType)}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="person" size={20} color={colors.text.primary} />
                <Text style={styles.sectionTitle}>Customer Details</Text>
              </View>
              <View style={styles.detailsContainer}>
                <DetailRow
                  icon="account-circle"
                  label="Name"
                  value={order.customerName}
                />
                <DetailRow
                  icon="location-on"
                  label="Address"
                  value={order.deliveryAddress}
                  isAddress={true}
                />
                <DetailRow
                  icon="phone"
                  label="Phone"
                  value={order.customerMobile}
                  isPhone={true}
                />
                <DetailRow
                  icon="access-time"
                  label="Order Time"
                  value={order.orderDateTime}
                />
              </View>
            </View>

            {/* {order.items?.[0]?.restaurant && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon name="restaurant" size={20} color={colors.text.primary} />
                  <Text style={styles.sectionTitle}>Restaurant</Text>
                </View>
                <Text style={styles.restaurantName}>{order.items[0].restaurant}</Text>
              </View>
            )} */}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="shopping-cart" size={20} color={colors.text.primary} />
                <Text style={styles.sectionTitle}>Order Items</Text>
              </View>
              {(order.items || []).map((item, index) => (
                <OrderItem key={index} item={item} />
              ))}

              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalAmount}>₹{(order.calculatedTotalAmount || 0).toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.section}>
              {/* <View style={styles.sectionHeader}>
                <Icon name="payment" size={20} color={colors.text.primary} />
                <Text style={styles.sectionTitle}>Payment Details</Text>
              </View> */}
              <DetailRow
                icon={(order.paymentMethod || '').toLowerCase().includes('cod') ? 'payments' : 'account-balance-wallet'}
                label="Payment Method"
                value={order.paymentType}
              />
            </View>

            {order.deliveryInstructions && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon name="info" size={20} color={colors.text.primary} />
                  <Text style={styles.sectionTitle}>Delivery Instructions</Text>
                </View>
                <Text style={styles.instructions}>{order.deliveryInstructions}</Text>
                {order.deliveryDateTime && (
                  <View style={styles.deliveryTimeContainer}>
                    <Icon name="schedule" size={16} color={colors.text.secondary} style={styles.timeIcon} />
                    <Text style={styles.deliveryTime}>Delivery Time: {order.deliveryDateTime}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Show delivered image for completed deliveries */}
            {order.status === 3 && order.imageCaptureAtCustomer && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon name="photo-camera" size={20} color={colors.text.primary} />
                  <Text style={styles.sectionTitle}>Delivery Confirmation</Text>
                </View>
                <View style={styles.deliveredImageContainer}>
                  <TouchableOpacity
                    onPress={() => {
                      setDeliveryImage({ uri: order.imageCaptureAtCustomer });
                      setShowImagePreview(true);
                    }}
                    style={styles.deliveredImageWrapper}
                  >
                    <Image
                      source={{ uri: order.imageCaptureAtCustomer }}
                      style={styles.deliveredImage}
                      resizeMode="cover"
                    />
                    <View style={styles.imageOverlay}>
                      <Icon name="zoom-in" size={24} color={colors.white} />
                      <Text style={styles.viewImageText}>View Image</Text>
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.deliveryConfirmationText}>
                    Delivery confirmed with photo
                  </Text>
                </View>
              </View>
            )}
          </View>

          {(order.status === 1 || order.status === 0) && (
            <View style={styles.actions}>
              {(order.status === 0 || order.status === 1) && (
                <>
                  {deliveryImage ? (
                    <View style={styles.imagePreviewContainer}>
                      <TouchableOpacity
                        onPress={() => setShowImagePreview(true)}
                        style={styles.imagePreview}
                      >
                        <Image
                          source={{ uri: deliveryImage.uri }}
                          style={styles.thumbnailImage}
                        />
                        <Text style={styles.previewText}>View Image</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.retakeButton}
                        onPress={showImagePicker}
                      >
                        <Icon name="camera-alt" size={20} color={colors.primary} />
                        <Text style={styles.retakeText}>Change</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.captureButton, commonStyles.button]}
                      onPress={showImagePicker}
                    >
                      <Icon name="camera-alt" size={20} color={colors.white} style={styles.buttonIcon} />
                      <Text style={commonStyles.buttonText}>Add Delivery Image</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[
                      commonStyles.button,
                      {
                        backgroundColor: colors.success,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: spacing.sm
                      }
                    ]}
                    onPress={handleDeliveryComplete}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <>
                        <Icon name="check-circle" size={20} color={colors.white} style={styles.buttonIcon} />
                        <Text style={commonStyles.buttonText}>Mark as Delivered</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {/* {(order.status === 0 || order.status === 1) && (
                <TouchableOpacity
                  style={[
                    commonStyles.button,
                    {
                      backgroundColor: colors.error,
                      marginTop: spacing.sm,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  ]}
                  onPress={() => {
                    // Handle delivery cancellation
                    console.log('Delivery cancelled');
                  }}
                >
                  <Icon name="cancel" size={20} color={colors.white} style={styles.buttonIcon} />
                  <Text style={commonStyles.buttonText}>Cancel Delivery</Text>
                </TouchableOpacity>
              )} */}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      <ImagePreviewModal />
      <ImagePickerModal />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.background,

  },
  safeAreaContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: spacing.sm,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80, // Add padding to prevent overlap with bottom tab
  },
  orderId: {
    ...typography.h3,
    color: colors.text.primary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderTypeRow: {
    marginBottom: spacing.sm,
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
    color: colors.white,
    fontWeight: '600',
  },
  section: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  detailsContainer: {
    borderRadius: radius.sm,
  },
  detailRow: {
    paddingVertical: spacing.xs,
  },
  labelWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '400',
  },
  phoneValue: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '400',
  },
  restaurantName: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '500',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.body1,
    color: colors.text.primary,
  },
  itemQuantity: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  itemPrice: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  totalLabel: {
    ...typography.h3,
    color: colors.text.primary,
  },
  totalAmount: {
    ...typography.h3,
    color: colors.primary,
  },
  instructions: {
    ...typography.body1,
    color: colors.text.secondary,
  },
  deliveryTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  timeIcon: {
    marginRight: spacing.xs,
  },
  deliveryTime: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  actions: {
    padding: spacing.md,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    marginTop: spacing.md,
    color: colors.error,
    textAlign: 'center',
    ...typography.body1,
  },
  retryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
    ...typography.body2,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  imagePreview: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  thumbnailImage: {
    width: 60,
    height: 60,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
  },
  previewText: {
    ...typography.body2,
    color: colors.text.primary,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
    padding: spacing.sm,
  },
  retakeText: {
    ...typography.body2,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  captureButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: spacing.xs,
    borderRadius: radius.round,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  deliveredImageContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  deliveredImageWrapper: {
    width: '100%',
    height: 200,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  deliveredImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewImageText: {
    ...typography.body2,
    color: colors.white,
    marginTop: spacing.xs,
  },
  deliveryConfirmationText: {
    ...typography.body1,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  detailIcon: {
    marginRight: spacing.sm,
  },
  addressContainer: {
    marginTop: spacing.xs,
  },
  addressValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '400',
    lineHeight: 20,
  },
  addressActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  addressActionText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  // Action Sheet Modal Styles
  actionSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionSheetBackdrop: {
    flex: 1,
  },
  actionSheetContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 34 : "15%", // Account for iOS home indicator
    paddingHorizontal: spacing.lg,
    maxHeight: '90%',
  },
  actionSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border.light,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  actionSheetTitle: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  actionSheetSubtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  actionSheetButtons: {
    marginBottom: spacing.lg,
  },
  actionSheetButton: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionSheetButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  actionSheetIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  actionSheetButtonText: {
    flex: 1,
  },
  actionSheetButtonTitle: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionSheetButtonSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  actionSheetCancelButton: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionSheetCancelText: {
    ...typography.body1,
    color: colors.error,
    fontWeight: '600',
  },
});
