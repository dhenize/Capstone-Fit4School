import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity,
  Dimensions,
  Modal,
  ActivityIndicator 
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function ChangePasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [reenterPassword, setReenterPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showReenterPassword, setShowReenterPassword] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState(''); // 'success', 'error', or 'info'
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    
    return () => subscription?.remove();
  }, []);

  const responsiveFontSize = (baseSize) => {
    const scale = screenWidth / 375;
    return Math.round(baseSize * Math.min(scale, 1.5));
  };

  const responsiveSize = (baseSize) => {
    const scale = screenWidth / 375;
    return Math.round(baseSize * Math.min(scale, 1.3));
  };

  const showAlertModal = (message, type = 'info') => {
    setModalMessage(message);
    setModalType(type);
    setShowModal(true);
  };

  const handleConfirm = async () => {
    // Validation
    if (!newPassword || !reenterPassword) {
      showAlertModal('Please fill in all fields.', 'error');
      return;
    } else if (newPassword !== reenterPassword) {
      showAlertModal('New password and re-entered password do not match.', 'error');
      return;
    } else if (newPassword.length < 6) {
      showAlertModal('Password must be at least 6 characters long.', 'error');
      return;
    }

    // Here you should implement your actual password change API call
    // For demonstration, I'll simulate an API call
    setIsLoading(true);
    
    try {
      // Simulate API call to change password
      // Replace this with your actual API endpoint
      const response = await fakePasswordChangeAPI(newPassword);
      
      if (response.success) {
        showAlertModal('Password changed successfully!', 'success');
        // Navigate after successful password change
        setTimeout(() => {
          router.push('/acc_mod/landing');
        }, 1500);
      } else {
        showAlertModal(response.message || 'Failed to change password. Please try again.', 'error');
      }
    } catch (error) {
      showAlertModal('An error occurred. Please check your connection and try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Simulated API function - Replace with your actual API call
  const fakePasswordChangeAPI = async (password) => {
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, you would make a request to your backend
    // Example: const response = await fetch('your-api-endpoint/change-password', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ newPassword: password })
    // });
    
    // For now, we'll simulate a successful response
    return { success: true, message: 'Password updated successfully' };
  };

  const getModalBackgroundColor = () => {
    switch (modalType) {
      case 'success':
        return '#4CAF50'; // Green
      case 'error':
        return '#F44336'; // Red
      default:
        return '#2196F3'; // Blue
    }
  };

  return (
    <View style={styles.container}>
      {/* Modal Popup */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalHeader, { backgroundColor: getModalBackgroundColor() }]}>
              <Ionicons 
                name={
                  modalType === 'success' ? 'checkmark-circle' : 
                  modalType === 'error' ? 'alert-circle' : 'information-circle'
                } 
                size={responsiveFontSize(40)} 
                color="#fff" 
              />
            </View>
            <View style={styles.modalContent}>
              <Text style={[styles.modalText, { fontSize: responsiveFontSize(16) }]}>
                {modalMessage}
              </Text>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: getModalBackgroundColor() }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={[styles.modalButtonText, { fontSize: responsiveFontSize(14) }]}>
                  OK
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons 
            name="arrow-back-outline" 
            size={responsiveFontSize(28)} 
            color="black" 
          />
        </TouchableOpacity>
        <Text style={[styles.header, { fontSize: responsiveFontSize(28) }]}>
          Change Password
        </Text>
      </View>

      <Text style={[styles.label, { fontSize: responsiveFontSize(16) }]}>
        New Password
      </Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={[
            styles.input,
            styles.passwordInput,
            { 
              fontSize: responsiveFontSize(16),
              padding: responsiveSize(12)
            }
          ]}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Enter your new password"
          secureTextEntry={!showNewPassword}
          autoCapitalize="none"
          editable={!isLoading}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowNewPassword(!showNewPassword)}
          disabled={isLoading}
        >
          <Ionicons 
            name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
            size={responsiveFontSize(24)} 
            color="#666" 
          />
        </TouchableOpacity>
      </View>

      <Text style={[styles.label, { fontSize: responsiveFontSize(16) }]}>
        Re-enter Password
      </Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={[
            styles.input,
            styles.passwordInput,
            { 
              fontSize: responsiveFontSize(16),
              padding: responsiveSize(12)
            }
          ]}
          value={reenterPassword}
          onChangeText={setReenterPassword}
          placeholder="Re-enter your new password"
          secureTextEntry={!showReenterPassword}
          autoCapitalize="none"
          editable={!isLoading}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowReenterPassword(!showReenterPassword)}
          disabled={isLoading}
        >
          <Ionicons 
            name={showReenterPassword ? "eye-off-outline" : "eye-outline"} 
            size={responsiveFontSize(24)} 
            color="#666" 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <TouchableOpacity 
        style={[
          styles.confirmButton,
          { paddingVertical: responsiveSize(15) },
          isLoading && styles.disabledButton
        ]} 
        onPress={handleConfirm}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={[
            styles.confirmButtonText, 
            { fontSize: responsiveFontSize(16) }
          ]}>
            CONFIRM
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBFB',
    paddingHorizontal: 30,
    paddingTop: 50,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 85,
  },
  header: {
    fontWeight: 'bold',
    color: 'black',
    marginLeft: 10,
    flexShrink: 1,
  },
  label: {
    fontWeight: '600',
    marginBottom: 15,
    color: '#000',
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 20,
  },
  confirmButton: {
    backgroundColor: '#61C35C',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#A5D6A7',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: 25,
  },
  modalContent: {
    padding: 25,
    alignItems: 'center',
  },
  modalText: {
    textAlign: 'center',
    marginBottom: 25,
    color: '#333',
    lineHeight: 22,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
    backgroundColor: '#61C35C',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});