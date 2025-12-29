import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions
} from 'react-native';
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const ForgotpassForm = () => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
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

  const validateInput = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!value) return 'Email is required';
    if (!emailRegex.test(value))
      return 'Enter a valid email address';
    return '';
  };

  const handleInputChange = (value) => {
    setInputValue(value);
    if (error) setError('');
  };

  const handleSubmit = () => {
    const validationError = validateInput(inputValue);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitted(true);
    Alert.alert('Success', 'OTP has been sent to your email!');
    router.push({
      pathname: '/acc_mod/forgotpassotp2',
      params: { email: inputValue }
    });
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons 
            name="arrow-back-outline" 
            size={responsiveFontSize(28)} 
            color="black" 
          />
        </TouchableOpacity>
        <Text style={[styles.header, { fontSize: responsiveFontSize(28) }]}>
          Forgot Password
        </Text>
      </View>

      <View style={[
        styles.formContainer, 
        { padding: responsivePadding(35) }
      ]}>
        <View style={styles.formGroup}>
          <Text style={[styles.labels, { fontSize: responsiveFontSize(16) }]}>
            Email
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input, 
                error && styles.inputError,
                { 
                  fontSize: responsiveFontSize(16),
                  padding: responsivePadding(12)
                }
              ]}
              placeholder="Enter Email"
              placeholderTextColor="#999"
              value={inputValue}
              onChangeText={handleInputChange}
              keyboardType="email-address"
              autoCapitalize="none"
              ref={inputRef}
            />
          </View>
          {error ? (
            <Text style={[styles.errorMessage, { fontSize: responsiveFontSize(12) }]}>
              {error}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity 
          style={[
            styles.button, 
            { 
              padding: responsivePadding(14),
              marginTop: responsivePadding(25)
            }
          ]} 
          onPress={handleSubmit}
        >
          <Text style={[styles.buttonText, { fontSize: responsiveFontSize(16) }]}>
            CONFIRM
          </Text>
        </TouchableOpacity>

        {isSubmitted && (
          <Text style={[
            styles.successMessage, 
            { fontSize: responsiveFontSize(14) }
          ]}>
            OTP sent successfully!
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBFB',
  },
  contentContainer: {
    flexGrow: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    minHeight: 100,
  },
  header: {
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 10,
    flexShrink: 1,
  },
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
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
    borderRadius: 5,
    backgroundColor: 'white',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorMessage: {
    color: '#e74c3c',
    marginTop: 5,
  },
  button: {
    width: '100%',
    backgroundColor: '#61C35C',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  successMessage: {
    color: '#2ecc71',
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '500',
  },
});

export default ForgotpassForm;