import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const EmailVerificationScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    
    return () => subscription?.remove();
  }, []);

  // Responsive scaling functions
  const scaleFont = (size) => {
    const scale = screenWidth / 375;
    const newSize = size * scale;
    return Math.max(size * 0.8, Math.min(newSize, size * 1.2));
  };

  const scaleSize = (size) => {
    const scale = screenWidth / 375;
    return size * scale;
  };

  const sendVerificationToNewEmail = async (newEmail) => {
    try {
      // Generate verification token
      const verificationToken = Math.random().toString(36).substring(2) + 
                               Math.random().toString(36).substring(2);
      
      // Create verification link
      const verificationLink = `https://yourapp.com/verify-email?token=${verificationToken}&email=${encodeURIComponent(newEmail)}`;
      
      // Simulate sending email
      console.log("Sending verification email to NEW address:", newEmail);
      console.log("Verification link:", verificationLink);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw error;
    }
  };

  const handleUpdateEmail = async () => {
    // Reset error state
    setError('');
    
    // Validation
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const emailSent = await sendVerificationToNewEmail(email);
      
      if (emailSent) {
        setIsSuccess(true);
        setIsLoading(false);
        
        // No Alert - directly show success screen
        // The success screen will be displayed automatically
      }
    } catch (error) {
      setError('Failed to send verification email. Please try again.');
      setIsLoading(false);
    }
  };

  const handleBackPress = () => {
    router.push("/stngs_mod/accountsetting");
  };

  const handleTryAnotherEmail = () => {
    setIsSuccess(false);
    setEmail('');
    setError('');
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFBFB" }}>
      <Stack.Screen
        options={{
          animation: "slide_from_right",
          headerShown: false,
        }}
      />

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header/Title Box */}
        <View style={[
          styles.titlebox,
          {
            paddingHorizontal: scaleSize(20),
            paddingVertical: scaleSize(25),
            top: Platform.OS === 'web' ? 0 : 20,
          }
        ]}>
          {!isSuccess && (
            <TouchableOpacity 
              onPress={handleBackPress}
              style={{ marginRight: scaleSize(10) }}
            >
              <Ionicons
                name="arrow-back-outline"
                size={scaleSize(26)}
                color="black"
              />
            </TouchableOpacity>
          )}
          <Text style={[
            styles.title,
            { fontSize: scaleFont(24) }
          ]}>
            {isSuccess ? 'Verification Sent!' : 'Update Email'}
          </Text>
        </View>

        <View style={[
          styles.formContainer,
          {
            paddingHorizontal: screenWidth > 768 ? '20%' : '10%',
            paddingTop: scaleSize(40),
          }
        ]}>
          {isSuccess ? (
            // Success View
            <View style={[
              styles.successContainer,
              { paddingVertical: Dimensions.get('window').height * 0.05 }
            ]}>
              <View style={styles.successIconContainer}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={scaleSize(64)} 
                  color="#61C35C" 
                />
              </View>
              
              <Text style={[styles.successTitle, { fontSize: scaleFont(20) }]}>
                Verification Email Sent!
              </Text>
              
              <Text style={[styles.successText, { fontSize: scaleFont(14) }]}>
                A verification link has been sent to:
              </Text>
              
              <Text style={[styles.emailText, { fontSize: scaleFont(16) }]}>
                <Text style={styles.boldText}>{email}</Text>
              </Text>
              
              <Text style={[styles.instructionText, { fontSize: scaleFont(13) }]}>
                Please check your email and click the verification link to complete the update.
                The link will expire in 24 hours.
              </Text>
            </View>
          ) : (
            // Form View
            <View style={{ paddingVertical: Dimensions.get('window').height * 0.05 }}>
              <Text style={[
                styles.txtlabel,
                { fontSize: scaleFont(16), marginBottom: scaleSize(8), color: 'black' }
              ]}>
                New Email Address
              </Text>
              
              <Text style={[
                styles.infoText,
                { fontSize: scaleFont(14), marginBottom: scaleSize(15), color: 'black' }
              ]}>
                Enter your new email address. A verification link will be sent to this email.
              </Text>
              
              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={scaleSize(16)} color="#FF3B30" />
                  <Text style={[styles.errorMessage, { fontSize: scaleFont(14) }]}>
                    {error}
                  </Text>
                </View>
              ) : null}
              
              <TextInput
                style={[
                  styles.txtfld,
                  error && styles.inputError,
                  {
                    height: scaleSize(58),
                    fontSize: scaleFont(16),
                    paddingHorizontal: scaleSize(15),
                    marginBottom: scaleSize(20),
                  }
                ]}
                placeholder="Enter new email address"
                placeholderTextColor="#888"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (error) setError('');
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Button Container at Bottom - Now Centered */}
      <View style={[
        styles.buttonContainer,
        {
          paddingBottom: Platform.OS === 'ios' ? 30 : 20,
          backgroundColor: '#FFFBFB',
        }
      ]}>
        {isSuccess ? (
          // Success Buttons - Centered
          <View style={styles.successButtonsContainer}>
            <TouchableOpacity 
              style={[
                styles.up_btn,
                {
                  width: screenWidth > 768 ? '70%' : '85%',
                  paddingVertical: scaleSize(15),
                  paddingHorizontal: scaleSize(20),
                  marginBottom: scaleSize(10),
                }
              ]} 
              onPress={() => router.push("/stngs_mod/accountsetting")}
            >
              <Text style={{ 
                fontSize: scaleFont(18), 
                fontWeight: "600", 
                color: 'white' 
              }}>
                RETURN TO SETTINGS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.secondaryButton,
                {
                  width: screenWidth > 768 ? '70%' : '85%',
                  paddingVertical: scaleSize(15),
                  paddingHorizontal: scaleSize(20),
                }
              ]} 
              onPress={handleTryAnotherEmail}
            >
              <Text style={[styles.secondaryButtonText, { fontSize: scaleFont(16) }]}>
                TRY ANOTHER EMAIL
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Form Button - Centered
          <View style={styles.formButtonContainer}>
            <TouchableOpacity 
              style={[
                styles.up_btn,
                {
                  width: screenWidth > 768 ? '70%' : '85%',
                  paddingVertical: scaleSize(15),
                  paddingHorizontal: scaleSize(20),
                }
              ]} 
              onPress={handleUpdateEmail}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={{ 
                  fontSize: scaleFont(18), 
                  fontWeight: "600", 
                  color: 'white' 
                }}>
                  SEND VERIFICATION
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFBFB",
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 100, // Space for fixed buttons
  },
  titlebox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBFB",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  title: {
    fontWeight: "500",
    justifyContent: "center",
  },
  formContainer: {
    flex: 1,
    backgroundColor: "#FFFBFB",
  },
  txtlabel: {
    fontWeight: "400",
    color: "#333",
  },
  infoText: {
    color: "#666",
    fontWeight: "300",
  },
  txtfld: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D9D9D9',
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
  up_btn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#61C35C",
    borderRadius: 8,
    shadowColor: "black",
    elevation: 5,
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 4 },
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  formButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successButtonsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
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
    paddingHorizontal: 20,
  },
  secondaryButton: {
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

export default EmailVerificationScreen;