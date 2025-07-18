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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { loginUser, clearError } from '../redux/slices/authSlice';
import { colors } from '../theme/colors';
import { commonStyles } from '../theme/commonStyles';
import CustomStatusBar from '../components/CustomStatusBar';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  // Clear backend errors when inputs change
  useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
  }, [phone, password]);

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
    if (validatePhone(phone)) {
      dispatch(loginUser({ phone: phone.trim(), password: password.trim() }));
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
                placeholderTextColor={colors.text.light}
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
                placeholderTextColor={colors.text.light}
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
  }
});
