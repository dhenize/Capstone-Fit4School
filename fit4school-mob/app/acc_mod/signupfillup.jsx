// app/acc_mod/signupfillup.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AuthService } from "../../services/authService";

// Screen size breakpoints
const breakpoints = {
  mobileSmall: 320,
  mobileMedium: 375,
  mobileLarge: 425,
  tablet: 768,
  laptop: 1024,
  laptopLarge: 1440,
  fourK: 2560,
};

export default function SignupForm() {
  const params = useLocalSearchParams();
  const userEmail = params.email;
  const userId = params.user_id;
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    contactNumber: '',
    role: 'parent',
  });
  const [loading, setLoading] = useState(false);
  
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const router = useRouter();

  // Responsive scaling functions
  const scaleFontSize = (baseSize) => {
    if (windowWidth <= breakpoints.mobileSmall) return baseSize * 0.85;
    if (windowWidth <= breakpoints.mobileMedium) return baseSize * 0.9;
    if (windowWidth <= breakpoints.mobileLarge) return baseSize * 0.95;
    if (windowWidth <= breakpoints.tablet) return baseSize;
    if (windowWidth <= breakpoints.laptop) return baseSize * 1.1;
    if (windowWidth <= breakpoints.laptopLarge) return baseSize * 1.2;
    return baseSize * 1.3; // 4K and above
  };

  const scaleSpacing = (baseSpacing) => {
    if (windowWidth <= breakpoints.mobileSmall) return baseSpacing * 0.8;
    if (windowWidth <= breakpoints.mobileMedium) return baseSpacing * 0.9;
    if (windowWidth <= breakpoints.mobileLarge) return baseSpacing;
    if (windowWidth <= breakpoints.tablet) return baseSpacing * 1.1;
    if (windowWidth <= breakpoints.laptop) return baseSpacing * 1.2;
    if (windowWidth <= breakpoints.laptopLarge) return baseSpacing * 1.3;
    return baseSpacing * 1.5; // 4K and above
  };

  const scaleHeight = (baseHeight) => {
    if (windowWidth <= breakpoints.mobileSmall) return baseHeight * 0.9;
    if (windowWidth <= breakpoints.mobileMedium) return baseHeight * 0.95;
    if (windowWidth <= breakpoints.mobileLarge) return baseHeight;
    if (windowWidth <= breakpoints.tablet) return baseHeight * 1.05;
    if (windowWidth <= breakpoints.laptop) return baseHeight * 1.1;
    if (windowWidth <= breakpoints.laptopLarge) return baseHeight * 1.15;
    return baseHeight * 1.2; // 4K and above
  };

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.contactNumber.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const result = await AuthService.completeProfile(userId, formData);
      
      if (result.success) {
        Alert.alert('Success', 'Profile completed successfully!');
        router.push({
          pathname: '/acc_mod/signupstudid',
          params: { user_id: userId }
        });
      } else {
        Alert.alert('Error', result.error || 'Profile completion failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic styles based on screen size
  const styles = StyleSheet.create({
    container: {
      flexGrow: 1,
      flex: 1,
      padding: scaleSpacing(20),
      backgroundColor: '#FFFBFB',
      Height: windowHeight,
      marginTop: 20,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: scaleSpacing(20),
      marginTop: windowWidth <= breakpoints.tablet ? scaleSpacing(10) : scaleSpacing(20),
    },
    header: {
      fontSize: scaleFontSize(28),
      fontWeight: 'bold',
      color: '#000',
      marginLeft: scaleSpacing(10),
      flex: 1,
    },
    backButton: {
      padding: scaleSpacing(5),
    },
    sectionTitle: {
      fontSize: scaleFontSize(20),
      fontWeight: 'bold',
      color: '#000',
      marginBottom: scaleSpacing(30),
      textAlign: 'center',
    },
    form: {
      gap: scaleSpacing(20),
      marginTop: scaleSpacing(20),
      maxWidth: windowWidth > breakpoints.tablet ? '80%' : '100%',
      alignSelf: windowWidth > breakpoints.tablet ? 'center' : 'stretch',
      width: windowWidth > breakpoints.tablet ? '60%' : '100%',
    },
    inputGroup: {
      marginBottom: scaleSpacing(15),
    },
    label: {
      marginBottom: scaleSpacing(8),
      fontWeight: '600',
      color: '#333',
      fontSize: scaleFontSize(16),
    },
    input: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: scaleSpacing(8),
      paddingHorizontal: scaleSpacing(12),
      paddingVertical: scaleSpacing(12),
      fontSize: scaleFontSize(16),
      backgroundColor: '#fff',
      minHeight: scaleHeight(50),
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: scaleSpacing(8),
      backgroundColor: '#fff',
      overflow: 'hidden',
      minHeight: scaleHeight(50),
      justifyContent: 'center',
    },
    picker: {
      height: scaleHeight(50),
      width: '100%',
      fontSize: scaleFontSize(16),
    },
    pickerItem: {
      fontSize: scaleFontSize(16),
    },
    button: {
      marginTop: scaleSpacing(20),
      backgroundColor: '#61C35C',
      borderRadius: scaleSpacing(10),
      paddingVertical: scaleSpacing(16),
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
      minHeight: scaleHeight(55),
    },
    buttonText: {
      color: '#fff',
      fontSize: scaleFontSize(18),
      fontWeight: 'bold',
    },
    disabledButton: {
      backgroundColor: '#cccccc',
    },
  });

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={windowWidth <= breakpoints.tablet}
    >
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()} 
          disabled={loading}
        >
          <Ionicons 
            name="arrow-back-outline" 
            size={scaleFontSize(28)} 
            color="black" 
          />
        </TouchableOpacity>
        <Text style={styles.header}>Sign up</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Complete Your Profile</Text>

        {/* First Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your first name"
            placeholderTextColor="#999"
            value={formData.firstName}
            onChangeText={text => handleChange('firstName', text)}
            editable={!loading}
          />
        </View>

        {/* Last Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your last name"
            placeholderTextColor="#999"
            value={formData.lastName}
            onChangeText={text => handleChange('lastName', text)}
            editable={!loading}
          />
        </View>

        {/* Contact Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contact Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your contact number"
            placeholderTextColor="#999"
            value={formData.contactNumber}
            onChangeText={text => handleChange('contactNumber', text)}
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>

        {/* Role */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Role</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.role}
              onValueChange={value => handleChange('role', value)}
              style={styles.picker}
              enabled={!loading}
            >
              <Picker.Item 
                label="Parent" 
                value="parent" 
                style={styles.pickerItem}
              />
              <Picker.Item 
                label="Legal Guardian" 
                value="legal guardian" 
                style={styles.pickerItem}
              />
              <Picker.Item 
                label="Student" 
                value="student" 
                style={styles.pickerItem}
              />
            </Picker>
          </View>
        </View>

        {/* Button */}
        <TouchableOpacity 
          style={[styles.button, loading && styles.disabledButton]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'SAVING...' : 'CONFIRM'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

