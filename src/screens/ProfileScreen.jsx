import React, { useState, memo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Alert,
  Modal,
  TextInput,
  Linking,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import Icon from "react-native-vector-icons/MaterialIcons";
import { colors } from "../theme/colors";
import { commonStyles, shadows } from "../theme/commonStyles";
import CustomHeader from "../components/CustomHeader";
import CustomStatusBar from "../components/CustomStatusBar";
import { logout, resetPassword } from "../redux/slices/authSlice";
import {
  togglePushNotifications,
  updatePersonalInfo,
} from "../redux/slices/profileSlice";

/* -------------------- Setting Item -------------------- */
const SettingItem = memo(({ icon, title, subtitle, onPress, value, type = "arrow" }) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.settingIconContainer}>
      <Icon name={icon} size={24} color={colors.primary} />
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>

    {type === "arrow" && (
      <Icon name="chevron-right" size={24} color={colors.text.secondary} />
    )}
    {type === "switch" && (
      <Switch
        value={value}
        onValueChange={onPress}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={
          Platform.OS === "ios" ? "#FFFFFF" : value ? colors.primary : "#f4f3f4"
        }
      />
    )}
  </TouchableOpacity>
));

/* -------------------- Unified Profile Update Modal -------------------- */
const ProfileUpdateModal = ({ visible, onClose, profileData, setProfileData, onSave }) => {
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordInputRef = useRef(null);

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!profileData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (profileData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Address validation
    if (!profileData.address.trim()) {
      newErrors.address = "Address is required";
    } else if (profileData.address.trim().length < 5) {
      newErrors.address = "Address must be at least 5 characters";
    }

    // Password validation (only if password is provided)
    if (profileData.newPassword) {
      // Simple validation - just check minimum length
      if (profileData.newPassword.length < 6) {
        newErrors.password = "Password must be at least 6 characters long";
      }

      // Confirm password validation
      if (profileData.newPassword !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSave();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    // Clear any focus from password input
    if (passwordInputRef.current) {
      passwordInputRef.current.blur();
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Profile</Text>

          </View>

          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.name && styles.inputError
                ]}
                placeholder="Enter your full name"
                placeholderTextColor={colors.text.tertiary}
                value={profileData.name}
                onChangeText={(text) => {
                  setProfileData({ ...profileData, name: text });
                  if (errors.name) {
                    setErrors({ ...errors, name: null });
                  }
                }}
                autoCapitalize="words"
                accessibilityLabel="Full name input"
                accessibilityHint="Enter your full name"
                autoComplete="name"
              />
              {errors.name && (
                <View style={styles.errorContainer}>
                  <Icon name="error" size={16} color={colors.error} />
                  <Text style={styles.errorText}>{errors.name}</Text>
                </View>
              )}
            </View>

            {/* Address Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address *</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.address && styles.inputError
                ]}
                placeholder="Enter your address"
                placeholderTextColor={colors.text.tertiary}
                value={profileData.address}
                onChangeText={(text) => {
                  setProfileData({ ...profileData, address: text });
                  if (errors.address) {
                    setErrors({ ...errors, address: null });
                  }
                }}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                accessibilityLabel="Address input"
                accessibilityHint="Enter your full address"
                autoComplete="street-address"
              />
              {errors.address && (
                <View style={styles.errorContainer}>
                  <Icon name="error" size={16} color={colors.error} />
                  <Text style={styles.errorText}>{errors.address}</Text>
                </View>
              )}
            </View>

            {/* Read-only Phone Display */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={[styles.input, styles.readOnlyInput]}>
                <Text style={styles.readOnlyText}>{profileData.phone || "Not provided"}</Text>
                <Icon name="lock" size={16} color={colors.text.tertiary} />
              </View>
              <Text style={styles.readOnlyHint}>Phone number cannot be changed</Text>
            </View>

            {/* Password Section */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password (Optional)</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  ref={passwordInputRef}
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.text.tertiary}
                  value={profileData.newPassword}
                  onChangeText={(text) => {
                    setProfileData({ ...profileData, newPassword: text });
                    if (errors.password) {
                      setErrors({ ...errors, password: null });
                    }
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  accessibilityLabel="New password input"
                  accessibilityHint="Enter a password with at least 6 characters"
                  autoComplete="new-password"
                  keyboardType="default"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onFocus={() => {
                    // Ensure the input is properly focused and keyboard shows
                    setTimeout(() => {
                      if (passwordInputRef.current) {
                        passwordInputRef.current.focus();
                      }
                    }, 100);
                  }}
                  onPressIn={() => {
                    // Handle touch events to ensure keyboard opens
                    if (passwordInputRef.current) {
                      passwordInputRef.current.focus();
                    }
                  }}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  accessibilityRole="button"
                >
                  <Icon
                    name={showPassword ? "visibility" : "visibility-off"}
                    size={22}
                    color={colors.text.secondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Password Strength Indicator */}
              {profileData.newPassword && <PasswordStrengthIndicator password={profileData.newPassword} />}

              {/* Password Requirements */}
              {profileData.newPassword && profileData.newPassword.length > 0 && (
                <PasswordRequirements password={profileData.newPassword} />
              )}

              {errors.password && (
                <View style={styles.errorContainer}>
                  <Icon name="error" size={16} color={colors.error} />
                  <Text style={styles.errorText}>{errors.password}</Text>
                </View>
              )}
            </View>

            {/* Confirm Password Input */}
            {profileData.newPassword && profileData.newPassword.length > 0 && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Confirm new password"
                    placeholderTextColor={colors.text.tertiary}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (errors.confirmPassword) {
                        setErrors({ ...errors, confirmPassword: null });
                      }
                    }}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    accessibilityLabel="Confirm password input"
                    accessibilityHint="Re-enter the password to confirm it matches"
                    autoComplete="new-password"
                    keyboardType="default"
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    accessibilityLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    accessibilityRole="button"
                  >
                    <Icon
                      name={showConfirmPassword ? "visibility" : "visibility-off"}
                      size={22}
                      color={colors.text.secondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Password Match Indicator */}
                {confirmPassword.length > 0 && (
                  <View style={styles.matchIndicator}>
                    <Icon
                      name={profileData.newPassword === confirmPassword ? "check-circle" : "error"}
                      size={16}
                      color={profileData.newPassword === confirmPassword ? colors.success : colors.error}
                    />
                    <Text style={[
                      styles.matchText,
                      { color: profileData.newPassword === confirmPassword ? colors.success : colors.error }
                    ]}>
                      {profileData.newPassword === confirmPassword ? "Passwords match" : "Passwords do not match"}
                    </Text>
                  </View>
                )}

                {errors.confirmPassword && (
                  <View style={styles.errorContainer}>
                    <Icon name="error" size={16} color={colors.error} />
                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Info Note */}
            <View style={styles.infoContainer}>
              <Icon name="info" size={16} color={colors.info} />
              <Text style={styles.infoText}>
                Update your name and address. Password is optional - leave blank to keep your current password.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={handleClose}
              disabled={isLoading}
              accessibilityLabel="Cancel profile update"
              accessibilityRole="button"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.saveButton,
                isLoading && styles.buttonDisabled
              ]}
              onPress={handleSave}
              disabled={isLoading}
              accessibilityLabel={isLoading ? "Saving profile" : "Save profile"}
              accessibilityRole="button"
              accessibilityHint="Tap to save your updated profile information"
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Icon name="refresh" size={16} color={colors.white} />
                  <Text style={styles.saveButtonText}>Saving...</Text>
                </View>
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/* -------------------- Password Strength Indicator -------------------- */
const PasswordStrengthIndicator = ({ password }) => {
  const getPasswordStrength = (password) => {
    let score = 0;

    // Simple scoring based on length only
    if (password.length >= 6) score = 1;
    if (password.length >= 8) score = 2;
    if (password.length >= 10) score = 3;
    if (password.length >= 12) score = 4;

    return { score };
  };

  const { score } = getPasswordStrength(password);
  const strengthLevels = ['Too Short', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = [colors.error, colors.warning, colors.info, colors.info, colors.success];

  const strengthLevel = strengthLevels[Math.min(score, 4)];
  const strengthColor = strengthColors[Math.min(score, 4)];

  if (!password) return null;

  return (
    <View
      style={styles.passwordStrengthContainer}
      accessibilityLabel={`Password strength: ${strengthLevel}`}
      accessibilityRole="text"
    >
      <View style={styles.strengthBarContainer}>
        {[1, 2, 3, 4, 5].map((level) => (
          <View
            key={level}
            style={[
              styles.strengthBar,
              {
                backgroundColor: level <= score ? strengthColor : colors.border.light,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.strengthText, { color: strengthColor }]}>
        {strengthLevel}
      </Text>
    </View>
  );
};

/* -------------------- Password Requirements -------------------- */
const PasswordRequirements = ({ password }) => {
  const requirements = [
    { text: 'At least 6 characters', met: password.length >= 6 },
  ];

  return (
    <View
      style={styles.requirementsContainer}
      accessibilityLabel="Password requirements"
      accessibilityRole="text"
    >
      {requirements.map((req, index) => (
        <View
          key={index}
          style={styles.requirementItem}
          accessibilityLabel={`${req.text}: ${req.met ? 'met' : 'not met'}`}
          accessibilityRole="text"
        >
          <Icon
            name={req.met ? 'check-circle' : 'radio-button-unchecked'}
            size={16}
            color={req.met ? colors.success : colors.text.tertiary}
          />
          <Text style={[
            styles.requirementText,
            { color: req.met ? colors.success : colors.text.tertiary }
          ]}>
            {req.text}
          </Text>
        </View>
      ))}
    </View>
  );
};


/* -------------------- Main Screen -------------------- */
const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const profileSettings = useSelector((state) => state.profile.settings);
  console.log("user,", user)

  // WhatsApp Support Configuration
  const SUPPORT_PHONE_NUMBER = "+919381152640"; // Replace with actual support number

  // Generate dynamic support message with user details
  const generateSupportMessage = () => {
    const userName = user?.delivery_boy_name || "Unknown";
    const userPhone = user?.delivery_boy_mobile_number || "Unknown";
    const userId = user?.id || "Unknown";
    const userAddress = user?.delivery_boy_address || "Not provided";

    return `Hi, I'm a delivery boy and I need support with:

*My Details:*
• Name: ${userName}
• Phone: ${userPhone}
• ID: ${userId}
• Address: ${userAddress}

*Issue:* `;
  };
  // Unified profile update state
  const [isProfileModalVisible, setProfileModalVisible] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.delivery_boy_name || "",
    address: user?.delivery_boy_address || "",
    phone: user?.delivery_boy_mobile_number || "",
    newPassword: "",
    id: user?.id || ""
  });

  /* -------- Handlers -------- */

  // WhatsApp Support Handler
  const handleWhatsAppSupport = () => {
    const supportMessage = generateSupportMessage();
    const message = encodeURIComponent(supportMessage);
    const phoneNumber = SUPPORT_PHONE_NUMBER.replace(/[^0-9]/g, ''); // Remove any non-numeric characters

    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${message}`;
    const webUrl = `https://wa.me/${phoneNumber}?text=${message}`;

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          // Fallback to web version if WhatsApp app is not installed
          return Linking.openURL(webUrl);
        }
      })
      .catch((error) => {
        console.error('Error opening WhatsApp:', error);
        Alert.alert(
          'Error',
          'Unable to open WhatsApp. Please make sure WhatsApp is installed on your device.',
          [{ text: 'OK' }]
        );
      });
  };

  const handleUpdateProfile = async () => {
    try {
      // Prepare data for the unified API call
      const updateData = {
        name: profileData.name,
        address: profileData.address,
        phone: profileData.phone,
        newPassword: profileData.newPassword || null, // Only include if provided
        id: profileData.id
      };

      // Use the resetPassword action since it's the unified endpoint
      await dispatch(resetPassword(updateData)).unwrap();

      Alert.alert("Success", "Profile updated successfully", [
        {
          text: "OK",
          onPress: () => {
            setProfileModalVisible(false);
            // Reset password field but keep other data
            setProfileData({
              ...profileData,
              newPassword: ""
            });
          }
        }
      ]);
    } catch (error) {
      Alert.alert("Error", error || "Failed to update profile");
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: () => dispatch(logout()),
        style: "destructive",
      },
    ]);
  };

  /* -------- Render -------- */
  return (
    <View style={styles.mainContainer}>
      <CustomStatusBar />
      <SafeAreaView style={commonStyles.safeArea}>
        <CustomHeader
          title="Profile"
          showBack
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView style={styles.container}>
          {/* Profile Info */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Icon name="account-circle" size={80} color={colors.primary} />
            </View>
            <Text style={styles.userName}>{user?.delivery_boy_name}</Text>
            <Text style={styles.userEmail}>{user?.delivery_boy_address}</Text>
            <Text style={styles.userPhone}>{user?.delivery_boy_mobile_number}</Text>
          </View>

          {/* Settings */}
          <View style={styles.settingsGroup}>
            <SettingItem
              icon="person"
              title="Update Profile"
              subtitle="Update your name, address, and password"
              onPress={() => setProfileModalVisible(true)}
            />

            <SettingItem
              icon="logout"
              title="Logout"
              subtitle="Sign out of your account"
              onPress={handleLogout}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* WhatsApp Support Floating Button */}
      <TouchableOpacity
        style={styles.whatsappFloatingButton}
        onPress={handleWhatsAppSupport}
        activeOpacity={0.8}
        accessibilityLabel="Contact support via WhatsApp"
        accessibilityRole="button"
      >
        <Icon name="chat" size={24} color={colors.white} />
      </TouchableOpacity>

      {/* Modals */}
      <ProfileUpdateModal
        visible={isProfileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        profileData={profileData}
        setProfileData={setProfileData}
        onSave={handleUpdateProfile}
      />
    </View>
  );
};

/* -------------------- Styles -------------------- */
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: colors.white,
    marginBottom: 16,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  settingsGroup: {
    backgroundColor: colors.white,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + "10",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    maxHeight: "90%",
    ...shadows.lg,
  },
  modalHeader: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 4,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  modalScrollView: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: colors.surfaceLight,
    color: colors.text.primary,
  },
  phoneInput: {
    marginBottom: 0,
  },
  passwordInput: {
    marginBottom: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    paddingRight: 50,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    paddingRight: 12,
  },
  eyeIcon: {
    padding: 8,
    position: "absolute",
    right: 8,
  },
  passwordStrengthContainer: {
    marginTop: 12,
  },
  strengthBarContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginRight: 4,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  requirementsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  requirementText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  matchIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  matchText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "500",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.error + "10",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    fontWeight: "500",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  cancelButton: {
    backgroundColor: colors.border.light,
    marginRight: 12,
  },
  saveButton: {
    backgroundColor: colors.primary,
    marginLeft: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  readOnlyInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background,
    borderColor: colors.border.light,
  },
  readOnlyText: {
    fontSize: 16,
    color: colors.text.secondary,
    flex: 1,
  },
  readOnlyHint: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 4,
    fontStyle: "italic",
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.info + "10",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  infoText: {
    color: colors.info,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  // WhatsApp Floating Button Styles
  whatsappFloatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#25D366', // WhatsApp green color
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default ProfileScreen;
