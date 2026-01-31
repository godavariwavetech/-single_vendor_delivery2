import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useColorScheme
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { loginUser, clearError } from '../redux/slices/authSlice';
import { colors } from '../theme/colors';
import { commonStyles } from '../theme/commonStyles';
import CustomStatusBar from '../components/CustomStatusBar';

export default function LoginScreen({ navigation, route }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const dispatch = useDispatch();
  const { loading, error, user } = useSelector((state) => state.auth);
  const scheme = useColorScheme(); // 'light' | 'dark'

  // pick placeholder color based on scheme
  const placeholderColor =
    scheme === 'dark' ? colors.text.tertiary : colors.text.secondary;

  // Clear backend errors when inputs change
  useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error,
        visibilityTime: 4000,
        autoHide: true,
        topOffset: 60,
        onHide: () => {
          // Clear error only after toast disappears
          dispatch(clearError());
        }
      });
    }
  }, [error, dispatch]);

  // Show success toast when user logs in
  useEffect(() => {
    if (user && !loading) {
      Toast.show({
        type: 'success',
        text1: 'Welcome Back!',
        text2: `Hello ${user.delivery_boy_name || 'Delivery Boy'}!`,
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 60,
      });
    }
  }, [user, loading]);

  // Show welcome message when coming from registration
  useEffect(() => {
    if (route?.params?.fromRegistration) {
      if (route?.params?.registrationSuccess) {
        // Show detailed success message for successful registration
        Toast.show({
          type: 'success',
          text1: '🎉 Welcome to the Team!',
          text2: `Delivery boy account created successfully! ID: ${route?.params?.newUserId}`,
          visibilityTime: 5000,
          autoHide: true,
          topOffset: 60,
        });
      } else {
        // Show simple message for manual navigation
        Toast.show({
          type: 'info',
          text1: 'Registration Complete!',
          text2: 'Please login with your credentials',
          visibilityTime: 4000,
          autoHide: true,
          topOffset: 60,
        });
      }
    }
  }, [route?.params?.fromRegistration, route?.params?.registrationSuccess, route?.params?.newUserId]);

  const validatePhone = (value) => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!value.trim()) {
      setPhoneError('Phone number is required');
      return false;
    }
    if (!phoneRegex.test(value.trim())) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handlePhoneChange = (value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setPhone(numericValue);
    if (numericValue.length > 0) {
      validatePhone(numericValue);
    } else {
      setPhoneError('');
    }
  };

  

  const handleLogin = () => {
    if (!phone.trim() || !password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please fill in all fields',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 60,
      });
      return;
    }

    if (validatePhone(phone)) {
      dispatch(loginUser({ phone: phone.trim(), password: password.trim() }));
    } else {
      Toast.show({
        type: 'error',
        text1: 'Invalid Phone Number',
        text2: 'Please enter a valid 10-digit phone number',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 60,
      });
    }
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <CustomStatusBar />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Icon name="local-shipping" size={64} color={colors.primary} style={styles.logo} />
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          <View style={styles.form}>
            <View style={[styles.inputContainer, phoneError && styles.inputError]}>
              <Icon name="phone" size={20} color={colors.text.light} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor={placeholderColor}
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
            {phoneError ? (
              <Text style={styles.errorText}>{phoneError}</Text>
            ) : null}

            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color={colors.text.light} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={placeholderColor}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Icon
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={20}
                  color={colors.text.light}
                />
              </TouchableOpacity>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Icon name="error" size={16} color={colors.error} style={styles.errorIcon} />
                <Text style={styles.error}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[commonStyles.button, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading || !phone.trim() || !password.trim()}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <View style={styles.buttonContainer}>
                  <Icon name="login" size={20} color={colors.white} style={styles.buttonIcon} />
                  <Text style={commonStyles.buttonText}>Login</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Registration', { fromLogin: true })}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View> */}

          <View style={styles.hintContainer}>
            <Icon name="info" size={16} color={colors.text.light} style={styles.hintIcon} />
            <Text style={styles.hint}>
              Enter your registered phone number
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  logo: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 12,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 4,
  },
  passwordToggle: {
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  errorIcon: {
    marginRight: 8,
  },
  error: {
    color: colors.error,
    flex: 1,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 8,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintIcon: {
    marginRight: 4,
  },
  hint: {
    textAlign: 'center',
    color: colors.text.light,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  registerText: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  registerLink: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
