import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView
} from 'react-native';
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const SignupForm = () => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();

  const inputRef = useRef(null);

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

    console.log('Email for OTP:', inputValue);

    setIsSubmitted(true);
    Alert.alert('Success', 'OTP has been sent to your email!');

    router.push('/acc_mod/signupotp2');
  };



  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header with back button */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.header}>Sign up</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.formGroup}>
            <Text style={styles.labels}>Email</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="Enter Email"
                placeholderTextColor="#999"
                value={inputValue}
                onChangeText={handleInputChange}
                keyboardType="email-address"
                autoCapitalize="none"
                ref={inputRef}
              />
            </View>
            {error ? <Text style={styles.errorMessage}>{error}</Text> : null}
          </View>

          <Text style={styles.label}>Send OTP to my email</Text>

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText} onPress={() => router.push('/acc_mod/signupotp2')}>CONFIRM</Text>

          </TouchableOpacity>

          {isSubmitted && (
            <Text style={styles.successMessage}>OTP sent successfully!</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 10,
  },
  formContainer: {
    padding: 35,
    backgroundColor: 'white',
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  labels: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 8,
    color: '#000',
  },
  label: {
    marginBottom: 10,
    fontWeight: '500',
    color: 'blue',
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    fontSize: 16,
    backgroundColor: 'white',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorMessage: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 5,
  },
  button: {
    width: '100%',
    padding: 14,
    backgroundColor: '#61C35C',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  successMessage: {
    color: '#2ecc71',
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '500',
  },
});

export default SignupForm;