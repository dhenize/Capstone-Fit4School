import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase"; // Adjust path based on your structure

const ForgotpassForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const router = useRouter();

  const inputRef = useRef(null);

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

  const responsivePadding = (basePadding) => {
    const scale = screenWidth / 375;
    return Math.round(basePadding * Math.min(scale, 1.3));
  };

  const handleInputChange = (value) => {
    setEmail(value);
    if (error) setError('');
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      // Check if email exists in Firestore accounts collection
      const accountsRef = collection(db, "accounts");
      const emailQuery = query(
        accountsRef, 
        where("email", "==", email.trim().toLowerCase())
      );
      
      const querySnapshot = await getDocs(emailQuery);
      
      if (querySnapshot.empty) {
        setError('No account found with this email address.');
        setLoading(false);
        return;
      }

      // Get user data to check status
      const userData = querySnapshot.docs[0].data();
      
      // Check if account is active
      if (userData.status && userData.status !== 'active') {
        setError('Your account is not active. Please contact administrator.');
        setLoading(false);
        return;
      }

      // Send password reset email using Firebase Authentication
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      
      // Store email for the next step
      // You can use AsyncStorage or pass via params
      setSuccess(true);
      
    } catch (error) {
      console.error("Error sending reset email:", error);
      
      // Handle specific Firebase errors
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Invalid email address format.');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email address.');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts. Please try again later.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your connection.');
          break;
        default:
          setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    router.push('/acc_mod/signin'); // Adjust path based on your structure
  };

  const handleTryAnotherEmail = () => {
    setSuccess(false);
    setEmail('');
    setError('');
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.headerContainer}>
        {!success && (
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons 
              name="arrow-back-outline" 
              size={responsiveFontSize(28)} 
              color="black" 
            />
          </TouchableOpacity>
        )}
        <Text style={[styles.header, { fontSize: responsiveFontSize(28) }]}>
          {success ? 'Reset Email Sent!' : 'Forgot Password'}
        </Text>
      </View>

      {success ? (
        <View style={[
          styles.formContainer, 
          { padding: responsivePadding(35) }
        ]}>
          <View style={styles.successContainer}>
            <View style={styles.successIconContainer}>
              <Ionicons 
                name="checkmark-circle" 
                size={responsiveFontSize(64)} 
                color="#61C35C" 
              />
            </View>
            
            <Text style={[styles.successTitle, { fontSize: responsiveFontSize(20) }]}>
              Reset Email Sent!
            </Text>
            
            <Text style={[styles.successText, { fontSize: responsiveFontSize(14) }]}>
              We've sent a password reset link to:
            </Text>
            
            <Text style={[styles.emailText, { fontSize: responsiveFontSize(16) }]}>
              <Text style={styles.boldText}>{email}</Text>
            </Text>
            
            <Text style={[styles.instructionText, { fontSize: responsiveFontSize(13) }]}>
              Please check your email and click the link to reset your password. 
              The link will expire in 1 hour.
            </Text>
          </View>

          <TouchableOpacity 
            style={[
              styles.primaryButton, 
              { 
                padding: responsivePadding(14),
                marginTop: responsivePadding(20)
              }
            ]} 
            onPress={handleBackToSignIn}
          >
            <Text style={[styles.buttonText, { fontSize: responsiveFontSize(16) }]}>
              Return to Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.secondaryButton, 
              { 
                padding: responsivePadding(14),
                marginTop: responsivePadding(10)
              }
            ]} 
            onPress={handleTryAnotherEmail}
          >
            <Text style={[styles.secondaryButtonText, { fontSize: responsiveFontSize(16) }]}>
              Try Another Email
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[
          styles.formContainer, 
          { padding: responsivePadding(35) }
        ]}>
          <View style={styles.formGroup}>
            <Text style={[styles.labels, { fontSize: responsiveFontSize(16) }]}>
              Please enter a valid email address
            </Text>
            
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={responsiveFontSize(16)} color="#FF3B30" />
                <Text style={[styles.errorMessage, { fontSize: responsiveFontSize(14) }]}>
                  {error}
                </Text>
              </View>
            ) : null}
            
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input, 
                  error && styles.inputError,
                  { 
                    fontSize: responsiveFontSize(16),
                    padding: responsivePadding(12),
                    paddingVertical: responsivePadding(15)
                  }
                ]}
                placeholder="Enter Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={handleInputChange}
                keyboardType="email-address"
                autoCapitalize="none"
                ref={inputRef}
                editable={!loading}
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[
              styles.primaryButton, 
              loading && styles.buttonDisabled,
              { 
                padding: responsivePadding(14),
                marginTop: responsivePadding(25)
              }
            ]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={[styles.buttonText, { 
                  fontSize: responsiveFontSize(16),
                  marginLeft: 10
                }]}>
                  SENDING...
                </Text>
              </View>
            ) : (
              <Text style={[styles.buttonText, { fontSize: responsiveFontSize(16) }]}>
                CONFIRM
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.backToSignInButton,
              { marginTop: responsivePadding(40) }
            ]} 
            onPress={handleBackToSignIn}
          >
            
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBFB',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    minHeight: 100,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  header: {
    fontWeight: 'bold',
    color: '#000',
    flexShrink: 1,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFBFB',
    justifyContent: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  labels: {
    fontWeight: '400',
    marginBottom: 8,
    color: '#000',
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorMessage: {
    color: '#FF3B30',
    marginLeft: 8,
    fontWeight: '500',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#61C35C',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToSignInButton: {
    width: '100%',
    alignItems: 'center',
  },
  backToSignInText: {
    color: '#007AFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // Success Screen Styles
  successContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#E8F5E9',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  successText: {
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  emailText: {
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  boldText: {
    fontWeight: 'bold',
  },
  instructionText: {
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#61C35C',
  },
  secondaryButtonText: {
    color: '#61C35C',
    fontWeight: '600',
  },
});

export default ForgotpassForm;