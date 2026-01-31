import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_DATA: '@user_data',
};

export const saveUserData = async (userData) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    return false;
  }
};

export const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const clearUserData = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    return true;
  } catch (error) {
    console.error('Error clearing user data:', error);
    return false;
  }
}; 