import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { initializeAuth } from '../redux/slices/authSlice';
import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import HomeScreen from '../screens/HomeScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DeliveredOrdersScreen from '../screens/DeliveredOrdersScreen';
import CustomHeader from '../components/CustomHeader';
import { colors } from '../theme/colors';
import SplashScreen from '../screens/SplashScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  header: ({ route, navigation }) => (
    <CustomHeader 
      title={route.name} 
      showBack={navigation.canGoBack()}
    />
  ),
  contentStyle: {
    backgroundColor: colors.background,
  },
};

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'DeliveredOrders') {
            iconName = focused ? 'package-variant' : 'package-variant-closed';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="DeliveredOrders" 
        component={DeliveredOrdersScreen}
        options={{ title: 'Delivered' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default function AppNavigator() {
  const dispatch = useDispatch();
  const { user, isInitialized, loading } = useSelector(state => state.auth);


  useEffect(() => {
    const delay = setTimeout(() => {
      dispatch(initializeAuth());
    }, 2000); // Delay before auth check
  
    return () => clearTimeout(delay);
  }, [dispatch]);
  

  // Show loading screen while checking stored credentials
  if (!isInitialized || loading) {
    return <SplashScreen />;
  } 

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        
        {user ? (
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="OrderDetails" 
              component={OrderDetailsScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Registration" 
              component={RegistrationScreen} 
              options={{ headerShown: false }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
