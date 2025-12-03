import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Keyboard,
  useWindowDimensions
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
  const { width, height } = useWindowDimensions();

  
  const getResponsiveValue = (mobileValue, tabletValue, desktopValue) => {
    if (width <= 425) return mobileValue; 
    if (width <= 768) return tabletValue; 
    if (width <= 1440) return desktopValue; 
    return desktopValue * 1.5; 
  };

  const getFontSize = (baseSize) => {
    if (width <= 320) return baseSize * 0.85; 
    if (width <= 375) return baseSize * 0.9; 
    if (width <= 425) return baseSize; 
    if (width <= 768) return baseSize * 1.1; 
    if (width <= 1024) return baseSize * 1.2; 
    if (width <= 1440) return baseSize * 1.3; 
    return baseSize * 1.5; 
  };

  const getSpacing = (baseSpacing) => {
    if (width <= 320) return baseSpacing * 0.8; 
    if (width <= 375) return baseSpacing * 0.9; 
    if (width <= 425) return baseSpacing; 
    if (width <= 768) return baseSpacing * 1.1; 
    if (width <= 1024) return baseSpacing * 1.2; 
    if (width <= 1440) return baseSpacing * 1.3; 
    return baseSpacing * 1.5; 
  };

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
    const inputSize = getResponsiveValue(35, 42, 50);
    const inputHeight = getResponsiveValue(50, 55, 60);
    const gap = getResponsiveValue(6, 8, 10);
    const fontSize = getFontSize(18);

    return studentId.map((digit, index) => (
      <TextInput
        key={index}
        ref={ref => inputRefs.current[index] = ref}
        style={[
          styles.input,
          digit !== '' && styles.filledInput,
          {
            width: inputSize,
            height: inputHeight,
            fontSize: fontSize,
            marginHorizontal: gap / 2,
          },
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
        
        if (result.student && result.student.is_enrolled) {
          Alert.alert(
            'Student Verification',
            `Student ID ${fullStudentId} is enrolled in this school.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  
                  console.log('✅ Student verified, redirecting to signin...');
                  router.push('/signin');
                }
              }
            ]
          );
        } else {
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
        }
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

  const responsiveStyles = {
    containerPadding: getSpacing(20),
    cardPadding: getSpacing(10),
    headerMarginBottom: getSpacing(150),
    headerMarginTop: getSpacing(-100),
    headerFontSize: getFontSize(28),
    headerMarginLeft: getSpacing(10),
    sectionMarginBottom: getSpacing(10),
    sectionTitleFontSize: getFontSize(20),
    formMarginVertical: getSpacing(30),
    labelFontSize: getFontSize(16),
    labelMarginBottom: getSpacing(15),
    inputMarginBottom: getSpacing(40),
    buttonPaddingVertical: getSpacing(16),
    buttonPaddingHorizontal: getSpacing(40),
    buttonFontSize: getFontSize(18),
    instructionFontSize: getFontSize(14),
    instructionLineHeight: getFontSize(20),
    instructionMarginTop: getSpacing(25),
    cardBorderRadius: getSpacing(20),
    buttonBorderRadius: getSpacing(12),
    inputBorderRadius: getSpacing(8),
    inputBorderWidth: getSpacing(2),
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          padding: responsiveStyles.containerPadding,
          minHeight: height,
        },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[
        styles.card,
        {
          padding: responsiveStyles.cardPadding,
          borderRadius: responsiveStyles.cardBorderRadius,
          maxWidth: width > 1024 ? 800 : '100%',
          alignSelf: width > 768 ? 'center' : 'stretch',
          width: width > 768 ? '80%' : '100%',
        },
      ]}>
        <View style={[
          styles.headerContainer,
          {
            marginBottom: responsiveStyles.headerMarginBottom,
            marginTop: responsiveStyles.headerMarginTop,
          }
        ]}>
          <TouchableOpacity onPress={() => router.back()} disabled={loading}>
            <Ionicons 
              name="arrow-back-outline" 
              size={responsiveStyles.headerFontSize} 
              color="black" 
            />
          </TouchableOpacity>
          <Text style={[
            styles.header,
            {
              fontSize: responsiveStyles.headerFontSize,
              marginLeft: responsiveStyles.headerMarginLeft,
            },
          ]}>
            Sign up
          </Text>
        </View>

        <View style={[
          styles.sectionContainer,
          {
            marginBottom: responsiveStyles.sectionMarginBottom,
          }
        ]}>
          <Text style={[
            styles.sectionTitle,
            {
              fontSize: responsiveStyles.sectionTitleFontSize,
            },
          ]}>
            Student ID Verification
          </Text>
        </View>

        <View style={[
          styles.formContainer,
          {
            marginVertical: responsiveStyles.formMarginVertical,
          }
        ]}>
          <Text style={[
            styles.label,
            {
              fontSize: responsiveStyles.labelFontSize,
              marginBottom: responsiveStyles.labelMarginBottom,
            },
          ]}>
            Enter Student ID
          </Text>
          <View style={[
            styles.inputContainer,
            {
              marginBottom: responsiveStyles.inputMarginBottom,
            },
          ]}>
            {renderInputs()}
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.disabledButton,
              {
                paddingVertical: responsiveStyles.buttonPaddingVertical,
                paddingHorizontal: responsiveStyles.buttonPaddingHorizontal,
                borderRadius: responsiveStyles.buttonBorderRadius,
                maxWidth: 400,
                width: width > 768 ? '70%' : '100%',
                alignSelf: 'center',
              },
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={[
              styles.submitButtonText,
              {
                fontSize: responsiveStyles.buttonFontSize,
              },
            ]}>
              {loading ? 'VERIFYING...' : 'SUBMIT'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[
          styles.instructionText,
          {
            fontSize: responsiveStyles.instructionFontSize,
            lineHeight: responsiveStyles.instructionLineHeight,
            marginTop: responsiveStyles.instructionMarginTop,
            paddingHorizontal: width <= 375 ? getSpacing(5) : 0,
          },
        ]}>
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
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'white',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    fontWeight: 'bold',
    color: '#000',
  },
  sectionContainer: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  sectionTitle: {
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'left',
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: -1,
    marginBottom: 40,
    
  },
  input: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
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
    fontWeight: 'bold',
    textAlign: 'center',
  },
  instructionText: {
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
});

export default SignupStudentId;