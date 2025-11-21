import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Keyboard
} from 'react-native';
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StudentService } from "../../services/studentService";

const SignupStudentId = () => {
  const [studentId, setStudentId] = useState(['', '', '', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef(Array(8).fill().map(() => React.createRef()));
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = params.user_id;

  const handleInputChange = (index, value) => {
    const numericValue = value.replace(/[^0-9]/g, '');

    if (numericValue === '' && value !== '') return;

    const newStudentId = [...studentId];

    if (numericValue.length > 1) {
      const digits = numericValue.split('').slice(0, 8);
      digits.forEach((digit, digitIndex) => {
        if (index + digitIndex < 8) {
          newStudentId[index + digitIndex] = digit;
        }
      });
      setStudentId(newStudentId);

      const nextEmptyIndex = newStudentId.findIndex((val, i) => val === '' && i >= index);
      if (nextEmptyIndex !== -1 && nextEmptyIndex < 8) {
        inputRefs.current[nextEmptyIndex]?.focus();
      } else {
        inputRefs.current[7]?.focus();
      }
      return;
    }

    newStudentId[index] = numericValue;
    setStudentId(newStudentId);

    if (numericValue !== '' && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index, e) => {
    if (e.nativeEvent.key === 'Backspace' && studentId[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const renderInputs = () => {
    return studentId.map((digit, index) => (
      <TextInput
        key={index}
        ref={ref => inputRefs.current[index] = ref}
        style={[
          styles.input,
          digit !== '' && styles.filledInput,
        ]}
        value={digit}
        onChangeText={(value) => handleInputChange(index, value)}
        onKeyPress={(e) => handleKeyPress(index, e)}
        maxLength={index === 0 ? 8 : 1}
        keyboardType="number-pad"
        selectTextOnFocus
        textAlign="center"
        placeholderTextColor="#999"
        editable={!loading}
      />
    ));
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    const fullStudentId = studentId.join('');

    if (fullStudentId.length !== 8) {
      Alert.alert('Incomplete ID', 'Please enter complete 8-digit Student ID');
      return;
    }

    setLoading(true);

    try {
      console.log('🔍 Starting student verification for ID:', fullStudentId);
      console.log('👤 User ID:', userId);

      const result = await StudentService.verifyStudentForParent(
        userId,
        fullStudentId,
        'parent'
      );

      console.log('📨 Verification result:', result);

      if (result.success) {
        Alert.alert(
          'Confirm Student',
          `Is this your child?\n\nName: ${result.student.full_name}\nStudent ID: ${result.student.student_id}\nGrade Level: ${result.student.sch_level}\nGender: ${result.student.gender}`,
          [
            {
              text: 'No, Cancel',
              style: 'cancel'
            },
            {
              text: 'Yes, Confirm',
              onPress: () => {
                Alert.alert('Success', result.message);
                console.log('✅ Student confirmed, redirecting to dashboard...');
                router.push('/dash_mod/home');
              }
            }
          ]
        );
      } else {
        console.log('❌ Verification failed:', result.message);
        Alert.alert('Verification Failed', result.message || 'Student ID not found');
      }
    } catch (error) {
      console.log('❌ Verification error:', error);
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => router.back()} disabled={loading}>
            <Ionicons name="arrow-back-outline" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.header}>Sign up</Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Student ID Verification</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Enter Student ID</Text>
          <View style={styles.inputContainer}>
            {renderInputs()}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'VERIFYING...' : 'SUBMIT'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.instructionText}>
          Kindly enter your child's student ID no. in the designated number field above.
          This will be used to verify user's identity and to avoid fake or fraudulent
          activities in the future.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: 'white',
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 10,
  },
  sectionContainer: {
    marginTop: 10,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  sectionTitle: {
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  formContainer: {
    marginVertical: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 40,
  },
  input: {
    width: 40,
    height: 50,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: 'white',
    color: '#000',
  },
  filledInput: {
    borderColor: '#61C35C',
    backgroundColor: '#f8fff8',
  },
  submitButton: {
    backgroundColor: '#61C35C',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginHorizontal: 'auto',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  instructionText: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 25,
    fontStyle: 'italic',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
});

export default SignupStudentId;