import axios from 'axios';

const BASE_URL = "http://192.168.0.130:5000";

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 5000, // Increased timeout for real API calls
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add response interceptor to handle errors globally
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network Error:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const API_ENDPOINTS = {
  LOGIN: '/api/delivery/login',
  GET_ORDERS: (deliveryBoyId) => `/api/delivery/${deliveryBoyId}`, // Updated to use delivery boy ID
  GET_ORDER_DETAILS: (orderId) => `/api/delivery/order/${orderId}`,
  GET_DELIVERED_ORDERS: (deliveryBoyId) => `/api/delivery/${deliveryBoyId}/delivered`, // New endpoint for delivered orders
};

export default instance;
