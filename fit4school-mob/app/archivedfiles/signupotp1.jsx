import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const SignUpScreen = () => {
  const [selectedOption, setSelectedOption] = useState('mobile');
  const router = useRouter();

  const handleConfirm = () => {
    console.log(`OTP will be sent to ${selectedOption}`);
    
    if (selectedOption === 'mobile') {
      router.push('/acc_mod/signupotp1.2');
    } else if (selectedOption === 'email') {
      router.push('/acc_mod/signupotp1.1');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.content}>
          {/* Header with back button */}
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back-outline" size={28} color="black" />
            </TouchableOpacity>
            <Text style={styles.header}>Sign up</Text>
          </View>
          
          {/* Send OTP Text */}
          <Text style={styles.sendOtpText}>Send OTP to</Text>

          {/* Option Selection */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={[
                styles.optionButton,
                selectedOption === 'mobile' && styles.optionButtonSelected
              ]}
              onPress={() => setSelectedOption('mobile')}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionText,
                  selectedOption === 'mobile' && styles.optionTextSelected
                ]}>
                  Mobile Number
                </Text>
                {selectedOption === 'mobile' && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.optionButton,
                selectedOption === 'email' && styles.optionButtonSelected
              ]}
              onPress={() => setSelectedOption('email')}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionText,
                  selectedOption === 'email' && styles.optionTextSelected
                ]}>
                  Email
                </Text>
                {selectedOption === 'email' && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>CONFIRM</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 150,
    marginTop: 10,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 10,
  },
  sendOtpText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
    left: -110,
  },
  optionsContainer: {
    marginBottom: 260,
  },
  optionButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  optionButtonSelected: {
    backgroundColor: '#e8f5e8',
    borderColor: '#61C35C',
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#61C35C',
    fontWeight: '600',
  },
  checkmark: {
    color: '#61C35C',
    fontSize: 18,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#61C35C',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SignUpScreen;