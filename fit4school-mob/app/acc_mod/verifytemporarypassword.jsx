import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AuthService } from "../../services/authService";

const SignupOTP = () => {
  const [loading, setLoading] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();
  const userEmail = params.email;
  const userId = params.user_id;

  const handleVerifyTemporaryPassword = async () => {
    if (!temporaryPassword.trim()) {
      Alert.alert('Error', 'Please enter your temporary password');
      return;
    }

    setLoading(true);
    try {
      // Here you would verify the temporary password with your backend
      // For now, we'll simulate a successful verification
      console.log('Verifying temporary password for user:', userId);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Assuming verification is successful
      Alert.alert(
        'Success!',
        'Temporary password verified successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Redirect to dashboard
              router.push('/dash_mod/home');
            }
          }
        ]
      );
      
    } catch (error) {
      console.log('Error verifying temporary password:', error);
      Alert.alert('Error', 'Invalid temporary password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendTemporaryPassword = async () => {
    setLoading(true);
    try {
      // Call your API to resend temporary password
      console.log('Resending temporary password to:', userEmail);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      Alert.alert(
        'Temporary Password Sent',
        'A new temporary password has been sent to your email. Please check your inbox.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.log('Error resending temporary password:', error);
      Alert.alert('Error', 'Failed to resend temporary password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} disabled={loading}>
          <Ionicons name="arrow-back-outline" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.header}>Verify Password</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.successText}>✓ Your Temporary Password has been sent to your email!</Text>
        
        <Text style={styles.label}>Enter Temporary Password:</Text>
        
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={temporaryPassword}
            onChangeText={setTemporaryPassword}
            placeholder="Enter temporary password"
            secureTextEntry={!showPassword}
            placeholderTextColor="#999"
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons 
              name={showPassword ? "eye-off-outline" : "eye-outline"} 
              size={24} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.infoText}>
          Kindly check your email to get your temporary password.
        </Text>

        <TouchableOpacity
          style={[styles.verifyButton, (!temporaryPassword.trim() || loading) && styles.disabledButton]}
          onPress={handleVerifyTemporaryPassword}
          disabled={!temporaryPassword.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.verifyButtonText}>VERIFY</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendTemporaryPassword}
          disabled={loading}
        >
          <Text style={styles.resendText}>
            Didn't receive the password? Resend Temporary Password
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBFB',
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    marginBottom: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 10,
  },
  card: {
    backgroundColor: '#FFFBFB',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 30,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#61C35C',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 24,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    alignSelf: 'flex-start',
    fontWeight: '500',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    marginBottom: 25,
    width: '100%',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  verifyButton: {
    backgroundColor: '#61C35C',
    padding: 18,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#C8E6C9',
    opacity: 0.7,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  resendButton: {
    padding: 10,
    marginBottom: 10,
  },
  resendText: {
    color: '#61C35C',
    fontSize: 14,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});

export default SignupOTP;