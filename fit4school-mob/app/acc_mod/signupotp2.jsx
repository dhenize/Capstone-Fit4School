import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AuthService } from "../../services/authService";

const SignupOTP = () => {
  const [loading, setLoading] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [autoRedirecting, setAutoRedirecting] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();
  const userEmail = params.email;
  const userId = params.user_id;

  
  const redirectToProfile = () => {
    if (autoRedirecting) return; 
    
    setAutoRedirecting(true);
    console.log('✅ Email verified, redirecting to profile...');
    
    
    setTimeout(() => {
      router.push({
        pathname: '/acc_mod/signupfillup',
        params: { 
          email: userEmail, 
          user_id: userId 
        }
      });
    }, 1500); 
  };

  
  const checkVerificationStatus = async () => {
    setCheckingVerification(true);
    try {
      const result = await AuthService.checkEmailVerification(userId);
      if (result.success && result.verified) {
        setEmailVerified(true);
        redirectToProfile();
      }
    } catch (error) {
      console.log('Error checking verification:', error);
    } finally {
      setCheckingVerification(false);
    }
  };

  useEffect(() => {
    
    checkVerificationStatus();
    
    
    const intervalId = setInterval(() => {
      if (!emailVerified && !autoRedirecting) {
        checkVerificationStatus();
      }
    }, 3000); 

    
    const unsubscribe = AuthService.onAuthStateChange((user) => {
      if (user && user.emailVerified && !emailVerified && !autoRedirecting) {
        console.log('🎯 Auth state change detected: Email verified!');
        setEmailVerified(true);
        Alert.alert('Success!', 'Email verified successfully. Redirecting...');
        redirectToProfile();
      }
    });

    
    return () => {
      clearInterval(intervalId);
      unsubscribe();
    };
  }, [emailVerified, autoRedirecting]);

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      
      Alert.alert(
        'Verification Email Sent', 
        'Please check your email and click the verification link. The page will automatically redirect once verified.'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheck = async () => {
    setCheckingVerification(true);
    try {
      const result = await AuthService.checkEmailVerification(userId);
      if (result.success && result.verified) {
        setEmailVerified(true);
        Alert.alert('Success!', 'Email verified successfully. Redirecting...');
        redirectToProfile();
      } else {
        Alert.alert(
          'Not Verified Yet', 
          'Your email has not been verified yet. Please check your inbox and click the verification link. The page will automatically update once verified.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check verification status');
    } finally {
      setCheckingVerification(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} disabled={loading}>
          <Ionicons name="arrow-back-outline" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.header}>Email Verification</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.instruction}>Verify Your Email Address</Text>
        
        <Text style={styles.subInstruction}>
          We've sent a verification link to:
        </Text>
        <Text style={styles.emailText}>{userEmail}</Text>

        <View style={styles.statusContainer}>
          {checkingVerification ? (
            <View style={styles.checkingContainer}>
              <ActivityIndicator size="large" color="#61C35C" />
              <Text style={styles.checkingText}>Checking verification status...</Text>
            </View>
          ) : emailVerified ? (
            <View style={styles.verifiedContainer}>
              <Ionicons name="checkmark-circle" size={50} color="#61C35C" />
              <Text style={styles.verifiedText}>Email Verified!</Text>
              {autoRedirecting && (
                <Text style={styles.redirectingText}>Redirecting to profile...</Text>
              )}
            </View>
          ) : (
            <View style={styles.pendingContainer}>
              <Ionicons name="time-outline" size={50} color="#FFA500" />
              <Text style={styles.pendingText}>Waiting for Verification</Text>
              <Text style={styles.autoCheckText}>Auto-checking every 3 seconds...</Text>
            </View>
          )}
        </View>

        <Text style={styles.infoText}>
          Please check your email and click the verification link to confirm your email address. 
          This page will automatically redirect once your email is verified.
        </Text>

        <TouchableOpacity
          style={styles.checkButton}
          onPress={handleManualCheck}
          disabled={checkingVerification || emailVerified}
        >
          <Text style={styles.checkButtonText}>
            {checkingVerification ? 'CHECKING...' : 'CHECK VERIFICATION STATUS'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendVerification}
          disabled={loading || emailVerified}
        >
          <Text style={styles.resendText}>
            Didn't receive the email? Resend Verification
          </Text>
        </TouchableOpacity>

        {emailVerified && autoRedirecting && (
          <View style={styles.redirectContainer}>
            <ActivityIndicator size="small" color="#61C35C" />
            <Text style={styles.redirectText}>Redirecting you to profile setup...</Text>
          </View>
        )}
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
  instruction: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 15,
    textAlign: 'center',
  },
  subInstruction: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#61C35C',
    marginBottom: 30,
    textAlign: 'center',
  },
  statusContainer: {
    marginVertical: 30,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  checkingContainer: {
    alignItems: 'center',
  },
  checkingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  verifiedContainer: {
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#61C35C',
    marginTop: 10,
  },
  redirectingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  pendingContainer: {
    alignItems: 'center',
  },
  pendingText: {
    fontSize: 18,
    color: '#FFA500',
    marginTop: 10,
    fontWeight: '600',
  },
  autoCheckText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  checkButton: {
    backgroundColor: '#61C35C',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  redirectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  redirectText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    fontStyle: 'italic',
  },
});

export default SignupOTP;