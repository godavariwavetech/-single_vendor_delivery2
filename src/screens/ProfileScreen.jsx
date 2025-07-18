import React, { useState } from 'react';
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
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../theme/colors';
import { commonStyles } from '../theme/commonStyles';
import CustomHeader from '../components/CustomHeader';
import CustomStatusBar from '../components/CustomStatusBar';
import { logout } from '../redux/slices/authSlice';
import { togglePushNotifications, updatePersonalInfo } from '../redux/slices/profileSlice';

const SettingItem = ({ icon, title, subtitle, onPress, value, type = 'arrow' }) => (
  <TouchableOpacity 
    style={styles.settingItem} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.settingIconContainer}>
      <Icon name={icon} size={24} color={colors.primary} />
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {type === 'arrow' && (
      <Icon name="chevron-right" size={24} color={colors.text.secondary} />
    )}
    {type === 'switch' && (
      <Switch
        value={value}
        onValueChange={onPress}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : value ? colors.primary : '#f4f3f4'}
      />
    )}
  </TouchableOpacity>
);

const SectionHeader = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const profileSettings = useSelector(state => state.profile.settings);
  
  console.log('ProfileScreen - Current user data:', user);
  console.log('ProfileScreen - Profile settings:', profileSettings);

  const [isPersonalInfoModalVisible, setPersonalInfoModalVisible] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleUpdatePersonalInfo = async () => {
    try {
      await dispatch(updatePersonalInfo(personalInfo)).unwrap();
      Alert.alert('Success', 'Personal information updated successfully');
      setPersonalInfoModalVisible(false);
    } catch (error) {
      Alert.alert('Error', error || 'Failed to update personal information');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout',
          onPress: () => dispatch(logout()),
          style: 'destructive'
        },
      ]
    );
  };

  const PersonalInfoModal = () => (
    <Modal
      visible={isPersonalInfoModalVisible}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Update Personal Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={personalInfo.name}
            onChangeText={(text) => setPersonalInfo({ ...personalInfo, name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={personalInfo.email}
            onChangeText={(text) => setPersonalInfo({ ...personalInfo, email: text })}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Phone"
            value={personalInfo.phone}
            onChangeText={(text) => setPersonalInfo({ ...personalInfo, phone: text })}
            keyboardType="phone-pad"
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setPersonalInfoModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleUpdatePersonalInfo}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.mainContainer}>
      <CustomStatusBar />
      <SafeAreaView style={commonStyles.safeArea}>
        <CustomHeader 
          title="Profile"
          showBack={true}
          onBackPress={() => navigation.goBack()}
        />
        <ScrollView style={styles.container}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Icon name="account-circle" size={80} color={colors.primary} />
            </View>
            <Text style={styles.userName}>{user?.delivery_boy_name}</Text>
            <Text style={styles.userEmail}>{user?.delivery_boy_address}</Text>
            <Text style={styles.userPhone}>{user?.delivery_boy_mobile_number}</Text>
          </View>

          <View style={styles.settingsGroup}>
            <SettingItem
              icon="person"
              title="Personal Information"
              subtitle="Update your profile details"
              onPress={() => setPersonalInfoModalVisible(true)}
            />
            <SettingItem
              icon="notifications"
              title="Order Notifications"
              subtitle="Get real-time order updates"
              type="switch"
              value={profileSettings.pushNotifications}
              onPress={() => dispatch(togglePushNotifications())}
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
      <PersonalInfoModal />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: colors.white,
    marginBottom: 16,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
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
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.border,
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  cancelButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen; 