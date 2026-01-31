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
  useColorScheme,
  ScrollView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { registerUser, clearError, clearRegistrationSuccess } from '../redux/slices/authSlice';
import { colors } from '../theme/colors';
import { commonStyles } from '../theme/commonStyles';
import CustomStatusBar from '../components/CustomStatusBar';

export default function RegistrationScreen({ navigation, route }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const dispatch = useDispatch();
  const { loading, error, registrationSuccess, successMessage, newUserId } = useSelector((state) => state.auth);
  const scheme = useColorScheme();

  // Pick placeholder color based on scheme
  const placeholderColor =
    scheme === 'dark' ? colors.text.tertiary : colors.text.secondary;

  // Clear backend errors when inputs change
  useEffect(() => {
    if (error) {
      // Show error toast
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: error,
        visibilityTime: 4000,
        autoHide: true,
        topOffset: 60,
      });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Handle successful registration
  useEffect(() => {
    if (registrationSuccess) {
      // Navigate immediately to login screen with success data
      const navigateTimer = setTimeout(() => {
        dispatch(clearRegistrationSuccess());
        navigation.navigate('Login', { 
          fromRegistration: true,
          registrationSuccess: true,
          newUserId: newUserId,
          successMessage: successMessage
        });
      }, 500); // Small delay to ensure state is set

      return () => {
        clearTimeout(navigateTimer);
      };
    }
  }, [registrationSuccess, navigation, dispatch, newUserId, successMessage]);



  const validateName = (value) => {
    if (!value.trim()) {
      setNameError('Name is required');
      return false;
    }
    if (value.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }
    setNameError('');
    return true;
  };

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

  const validatePassword = (value) => {
    if (!value.trim()) {
      setPasswordError('Password is required');
      return false;
    }
    if (value.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (value) => {
    if (!value.trim()) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    if (value !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleNameChange = (value) => {
    setName(value);
    if (value.length > 0) {
      validateName(value);
    } else {
      setNameError('');
    }
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

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (value.length > 0) {
      validatePassword(value);
    } else {
      setPasswordError('');
    }
    // Re-validate confirm password if it has a value
    if (confirmPassword) {
      validateConfirmPassword(confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    if (value.length > 0) {
      validateConfirmPassword(value);
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleRegister = () => {
    // Check if all fields are filled
    if (!name.trim() || !phone.trim() || !password.trim() || !confirmPassword.trim()) {
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

    const isNameValid = validateName(name);
    const isPhoneValid = validatePhone(phone);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (isNameValid && isPhoneValid && isPasswordValid && isConfirmPasswordValid) {
      dispatch(registerUser({ 
        name: name.trim(), 
        phone: phone.trim(), 
        password: password.trim() 
      }));
    } else {
      // Show validation error toast
      let errorMessage = 'Please fix the following errors:';
      if (!isNameValid) errorMessage += '\n• Invalid name';
      if (!isPhoneValid) errorMessage += '\n• Invalid phone number';
      if (!isPasswordValid) errorMessage += '\n• Password too short';
      if (!isConfirmPasswordValid) errorMessage += '\n• Passwords do not match';

      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: errorMessage,
        visibilityTime: 4000,
        autoHide: true,
        topOffset: 60,
      });
    }
  };

  const isFormValid = () => {
    return name.trim() && 
           phone.trim() && 
           password.trim() && 
           confirmPassword.trim() &&
           !nameError && 
           !phoneError && 
           !passwordError && 
           !confirmPasswordError;
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <CustomStatusBar />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <Icon name="person-add" size={64} color={colors.primary} style={styles.logo} />
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join our delivery team</Text>
            </View>

            <View style={styles.form}>
              {/* Name Input */}
              <View style={[styles.inputContainer, nameError && styles.inputError]}>
                <Icon name="person" size={20} color={colors.text.light} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, registrationSuccess && styles.disabledInput]}
                placeholder="Full Name"
                placeholderTextColor={placeholderColor}
                value={name}
                onChangeText={handleNameChange}
                autoCapitalize="words"
                maxLength={50}
                editable={!registrationSuccess}
              />
              </View>
              {nameError ? (
                <Text style={styles.errorText}>{nameError}</Text>
              ) : null}

              {/* Phone Input */}
              <View style={[styles.inputContainer, phoneError && styles.inputError]}>
                <Icon name="phone" size={20} color={colors.text.light} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, registrationSuccess && styles.disabledInput]}
                placeholder="Phone Number"
                placeholderTextColor={placeholderColor}
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="numeric"
                maxLength={10}
                editable={!registrationSuccess}
              />
              </View>
              {phoneError ? (
                <Text style={styles.errorText}>{phoneError}</Text>
              ) : null}

              {/* Password Input */}
              <View style={[styles.inputContainer, passwordError && styles.inputError]}>
                <Icon name="lock" size={20} color={colors.text.light} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, registrationSuccess && styles.disabledInput]}
                placeholder="Password"
                placeholderTextColor={placeholderColor}
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
                editable={!registrationSuccess}
              />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={registrationSuccess}
                >
                  <Icon
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={colors.text.light}
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}

              {/* Confirm Password Input */}
              <View style={[styles.inputContainer, confirmPasswordError && styles.inputError]}>
                <Icon name="lock" size={20} color={colors.text.light} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, registrationSuccess && styles.disabledInput]}
                placeholder="Confirm Password"
                placeholderTextColor={placeholderColor}
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                secureTextEntry={!showConfirmPassword}
                editable={!registrationSuccess}
              />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={registrationSuccess}
                >
                  <Icon
                    name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={colors.text.light}
                  />
                </TouchableOpacity>
              </View>
              {confirmPasswordError ? (
                <Text style={styles.errorText}>{confirmPasswordError}</Text>
              ) : null}

               {/* Success Message - Now handled by Toast */}
               {registrationSuccess && (
                 <View style={styles.successContainer}>
                   <Icon name="check-circle" size={20} color={colors.success} style={styles.successIcon} />
                   <View style={styles.successContent}>
                     <Text style={styles.successTitle}>✅ Registration Complete!</Text>
                     <Text style={styles.successMessage}>
                       Redirecting to login screen...
                     </Text>
                   </View>
                 </View>
               )}

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Icon name="error" size={16} color={colors.error} style={styles.errorIcon} />
                  <Text style={styles.error}>{error}</Text>
                </View>
              )}

              {/* Register Button */}
              <TouchableOpacity
                style={[commonStyles.button, loading && styles.disabledButton]}
                onPress={handleRegister}
                disabled={loading || !isFormValid()}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <View style={styles.buttonContainer}>
                    <Icon name="person-add" size={20} color={colors.white} style={styles.buttonIcon} />
                    <Text style={commonStyles.buttonText}>Create Account</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

             {/* Login Link */}
             <View style={styles.loginContainer}>
               <Text style={styles.loginText}>Already have an account? </Text>
               <TouchableOpacity onPress={() => navigation.navigate('Login', { fromRegistration: false })}>
                 <Text style={styles.loginLink}>Sign In</Text>
               </TouchableOpacity>
             </View>

            {/* Hint */}
            <View style={styles.hintContainer}>
              <Icon name="info" size={16} color={colors.text.light} style={styles.hintIcon} />
              <Text style={styles.hint}>
                All fields are required for registration
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
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
  disabledInput: {
    opacity: 0.6,
    backgroundColor: colors.background,
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
  successContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    marginTop: 8,
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  successIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  successContent: {
    flex: 1,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: 4,
  },
  successMessage: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 4,
    fontWeight: '600',
  },
  successSubMessage: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  successRedirect: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginText: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  loginLink: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
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
});
