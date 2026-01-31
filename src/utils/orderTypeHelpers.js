import { colors } from '../theme/colors';

/**
 * Get the color for order type badge
 * @param {string} orderType - The order type ('subscription' or 'normal')
 * @returns {string} Color value for the badge
 */
export const getOrderTypeColor = (orderType) => {
  switch (orderType?.toLowerCase()) {
    case 'subscription':
      return colors.warning;
    case 'normal':
      return colors.info;
    default:
      return colors.text.secondary;
  }
};

/**
 * Get the icon name for order type badge
 * @param {string} orderType - The order type ('subscription' or 'normal')
 * @returns {string} Icon name for the badge
 */
export const getOrderTypeIcon = (orderType) => {
  switch (orderType?.toLowerCase()) {
    case 'subscription':
      return 'repeat';
    case 'normal':
      return 'shopping-cart';
    default:
      return 'help-outline';
  }
};

/**
 * Get the display text for order type badge
 * @param {string} orderType - The order type ('subscription' or 'normal')
 * @returns {string} Display text for the badge
 */
export const getOrderTypeText = (orderType) => {
  switch (orderType?.toLowerCase()) {
    case 'subscription':
      return 'Subscription';
    case 'normal':
      return 'One-time';
    default:
      return 'Unknown';
  }
};

/**
 * Get all order type styling properties
 * @param {string} orderType - The order type ('subscription' or 'normal')
 * @returns {object} Object containing color, icon, and text
 */
export const getOrderTypeProps = (orderType) => {
  return {
    color: getOrderTypeColor(orderType),
    icon: getOrderTypeIcon(orderType),
    text: getOrderTypeText(orderType),
  };
};
