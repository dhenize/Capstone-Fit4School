import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const ForgotpassOTP2 = () => {
  const { email } = useLocalSearchParams();
  const [otp, setOtp] = useState(['', '', '', '', '', '']); 
  const [timeLeft, setTimeLeft] = useState(300); 
  const [isExpired, setIsExpired] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const inputRefs = useRef([]);
  const router = useRouter();

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const responsiveFontSize = (baseSize) => {
    const scale = screenWidth / 375;
    return Math.round(baseSize * Math.min(scale, 1.5));
  };

  const responsiveSize = (baseSize) => {
    const scale = screenWidth / 375;
    return Math.round(baseSize * Math.min(scale, 1.2));
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) { 
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleResend = async () => {
    if (isExpired) {
      try {
        // Here you would typically send OTP to the email
        // const response = await sendOTPToEmail(email);
        Alert.alert('Success', 'New OTP has been sent to your email!');
        
        setTimeLeft(300);
        setIsExpired(false);
        setOtp(['', '', '', '', '', '']); 
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to resend OTP. Please try again.');
      }
    }
  };

  const handleConfirm = () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length === 6 && !isExpired) { 
      // Here you would typically verify the OTP with your backend
      // const isValid = await verifyOTP(email, enteredOtp);
      // if (isValid) {
        console.log('OTP submitted for email:', email);
        Alert.alert('Success', 'OTP verified successfully!');
        router.push('/acc_mod/forgotpassword');
      // } else {
      //   Alert.alert('Error', 'Invalid OTP. Please try again.');
      // }
    } else if (isExpired) {
      Alert.alert('Error', 'OTP has expired. Please request a new one.');
    } else {
      Alert.alert('Error', 'Please enter the complete OTP.');
    }
  };

  return (
    <View style={styles.container}>
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
        styles.card, 
        { marginTop: responsiveSize(50) }
      ]}>
        <Text style={[styles.emailText, { fontSize: responsiveFontSize(14) }]}>
          OTP sent to: {email}
        </Text>
        
        <Text style={[styles.instruction, { fontSize: responsiveFontSize(16) }]}>
          Please enter your OTP
        </Text>
        
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              style={[
                styles.otpInput,
                isExpired && styles.disabledInput,
                { 
                  width: responsiveSize(40),
                  height: responsiveSize(55),
                  fontSize: responsiveFontSize(18)
                }
              ]}
              keyboardType="numeric"
              maxLength={1}
              value={digit}
              onChangeText={(value) => handleOtpChange(index, value)}
              onKeyPress={(e) => handleKeyDown(index, e)}
              editable={!isExpired}
              selectTextOnFocus={!isExpired}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.resendButton,
            isExpired && styles.resendEnabled
          ]}
          onPress={handleResend}
          disabled={!isExpired}
        >
          <Text style={[
            styles.resendText,
            isExpired && styles.resendEnabledText,
            { fontSize: responsiveFontSize(14) }
          ]}>
            Resend
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={[
            styles.confirmButton,
            { padding: responsiveSize(12) }
          ]}
          onPress={handleConfirm}
        >
          <Text style={[
            styles.confirmText, 
            { fontSize: responsiveFontSize(16) }
          ]}>
            CONFIRM
          </Text>
        </TouchableOpacity>

        <Text style={[
          styles.timerText, 
          { fontSize: responsiveFontSize(14) }
        ]}>
          will expire after {formatTime(timeLeft)}
        </Text>

        <Text style={[
          styles.infoText, 
          { fontSize: responsiveFontSize(14) }
        ]}>
          Kindly check your email/message.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBFB',
    paddingHorizontal: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    marginBottom: 20,
  },
  header: {
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 10,
    flexShrink: 1,
  },
  card: {
    backgroundColor: '#FFFBFB',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  emailText: {
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  instruction: {
    color: 'black',
    marginBottom: 25,
    alignSelf: 'flex-start',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 25,
  },
  otpInput: {
    borderWidth: 2,
    borderColor: 'black',
    borderRadius: 4,
    textAlign: 'center',
    fontWeight: 'bold',
    backgroundColor: 'white',
  },
  disabledInput: {
    backgroundColor: '#f8f9fa',
    color: '#6c757d',
  },
  resendButton: {
    marginBottom: 5,
    padding: 1,
    borderRadius: 3,
    width: '100%',
  },
  resendEnabled: {},
  resendText: {
    color: '#6c757d',
    textAlign: 'right',
    padding: 1,
  },
  resendEnabledText: {
    color: 'black',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    width: '100%',
    marginVertical: 0,
  },
  confirmButton: {
    backgroundColor: '#61C35C',
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  confirmText: {
    color: 'white',
    fontWeight: 'bold',
  },
  timerText: {
    color: '#dc3545',
    marginBottom: 50,
    fontWeight: 'bold',
  },
  infoText: {
    color: 'black',
  },
});

export default ForgotpassOTP2;