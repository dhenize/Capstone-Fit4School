import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity,
  Dimensions,
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
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    newPassword: '',
    reenterPassword: '',
    general: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
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

  const validateForm = () => {
    const newErrors = {
      newPassword: '',
      reenterPassword: '',
      general: ''
    };

    if (!newPassword) {
      newErrors.newPassword = 'Please enter new password';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!reenterPassword) {
      newErrors.reenterPassword = 'Please re-enter password';
    } else if (newPassword && reenterPassword !== newPassword) {
      newErrors.reenterPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    
    
    return !newErrors.newPassword && !newErrors.reenterPassword;
  };

  const getBorderColor = (field) => {
    if (errors[field]) return '#F44336'; 
    if (field === 'reenterPassword' && reenterPassword && newPassword === reenterPassword) return '#4CAF50'; // Green for match
    return '#ccc'; 
  };

  const handleConfirm = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSuccessMessage('');
    setErrors({...errors, general: ''});

    try {
      
      const response = await fakePasswordChangeAPI(newPassword);
      
      if (response.success) {
        setSuccessMessage('Password changed successfully!');
        setTimeout(() => {
          router.push('/acc_mod/landing');
        }, 1500);
      } else {
        setErrors({...errors, general: response.message || 'Failed to change password. Please try again.'});
      }
    } catch (error) {
      setErrors({...errors, general: 'An error occurred. Please check your connection and try again.'});
    } finally {
      setIsLoading(false);
    }
  };

  
  const fakePasswordChangeAPI = async (password) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Password updated successfully' };
  };

  return (
    <View style={styles.container}>
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
              padding: responsiveSize(12),
              borderColor: getBorderColor('newPassword')
            }
          ]}
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text);
            
            if (errors.newPassword) {
              setErrors({...errors, newPassword: ''});
            }
          }}
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
      {errors.newPassword ? (
        <Text style={[styles.errorText, { fontSize: responsiveFontSize(14) }]}>
          {errors.newPassword}
        </Text>
      ) : null}

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
              padding: responsiveSize(12),
              borderColor: getBorderColor('reenterPassword')
            }
          ]}
          value={reenterPassword}
          onChangeText={(text) => {
            setReenterPassword(text);
            // Clear error when user starts typing
            if (errors.reenterPassword) {
              setErrors({...errors, reenterPassword: ''});
            }
          }}
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
      {errors.reenterPassword ? (
        <Text style={[styles.errorText, { fontSize: responsiveFontSize(14) }]}>
          {errors.reenterPassword}
        </Text>
      ) : null}

      <View style={styles.divider} />

      {/* General Error Message */}
      {errors.general ? (
        <View style={styles.generalErrorContainer}>
          <Ionicons name="alert-circle" size={responsiveFontSize(20)} color="#F44336" />
          <Text style={[styles.generalErrorText, { fontSize: responsiveFontSize(14) }]}>
            {errors.general}
          </Text>
        </View>
      ) : null}

      {/* Success Message */}
      {successMessage ? (
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={responsiveFontSize(20)} color="#4CAF50" />
          <Text style={[styles.successText, { fontSize: responsiveFontSize(14) }]}>
            {successMessage}
          </Text>
        </View>
      ) : null}

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
    marginBottom: 5,
  },
  input: {
    borderWidth: 1.5,
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
  
  errorText: {
    color: '#F44336',
    marginBottom: 15,
    marginLeft: 5,
  },
  generalErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  generalErrorText: {
    color: '#F44336',
    marginLeft: 10,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  successText: {
    color: '#4CAF50',
    marginLeft: 10,
    flex: 1,
  },
});