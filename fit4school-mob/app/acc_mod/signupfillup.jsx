// app/acc_mod/signupfillup.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AuthService } from "../../services/authService";

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

  const router = useRouter();

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} disabled={loading}>
          <Ionicons name="arrow-back-outline" size={28} color="black" />
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
              <Picker.Item label="Parent" value="parent" />
              <Picker.Item label="Legal Guardian" value="legal guardian" />
              <Picker.Item label="Student" value="student" />
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


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#FFFBFB',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 30,
    textAlign: 'center',
  },
  form: {
    gap: 20,
    marginTop: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
    color: '#333',
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#61C35C',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
});