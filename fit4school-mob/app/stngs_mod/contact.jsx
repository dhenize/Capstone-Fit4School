import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Platform,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Alert
} from "react-native";
import React, {useState} from "react";
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import * as MailComposer from 'expo-mail-composer';

const { width, height } = Dimensions.get('window');

// Responsive size function
const responsiveSize = (size) => {
  const scale = width / 375; 
  const newSize = size * scale;
  return Math.round(newSize);
};

export default function Contact() {
  const router = useRouter();
  const [descCount, setDescCount] = useState("");
  const [subject, setSubject] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  // Calculate word count
  const wordCount = descCount.split(/\s+/).filter(Boolean).length;
  
  // Handle form submission
  const handleSubmit = async () => {
    // Validation
    if (!subject.trim()) {
      Alert.alert("Missing Subject", "Please enter a subject for your message.");
      return;
    }

    if (!descCount.trim()) {
      Alert.alert("Missing Message", "Please enter your message.");
      return;
    }

    if (wordCount > 100) {
      Alert.alert("Message Too Long", "Message exceeds 100 words limit. Current count: " + wordCount);
      return;
    }

    setIsSending(true);

    try {
      // Check if mail composer is available
      const isAvailable = await MailComposer.isAvailableAsync();
      
      if (isAvailable) {
        // Compose email
        const result = await MailComposer.composeAsync({
          recipients: ['fit4school.official@gmail.com'],
          subject: `[Fit4School Contact]: ${subject}`,
          body: `Message from Fit4School App:\n\n${descCount}\n\n---\nSent via Fit4School Mobile App`,
        });
        
        // If email was sent (result.status === 'sent')
        if (result.status === 'sent') {
          // Clear form
          setSubject("");
          setDescCount("");
          
          // Navigate to success screen
          router.push("/stngs_mod/con_success");
        } else {
          // User cancelled or other status
          Alert.alert("Cancelled", "Message was not sent.");
        }
      } else {
        Alert.alert(
          "Email Not Available",
          "Email service is not available on this device. Please setup an email account or use another device.",
          [
            { text: "OK", style: "default" }
          ]
        );
      }
    } catch (error) {
      console.error("Error sending email:", error);
      Alert.alert(
        "Error",
        "Failed to send message. Please try again.",
        [
          { text: "OK", style: "default" }
        ]
      );
    } finally {
      setIsSending(false);
    }
  };

  // Handle back navigation
  const handleBackPress = () => {
    if (subject.trim() || descCount.trim()) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to go back?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Discard", 
            style: "destructive",
            onPress: () => router.push("/dash_mod/account")
          }
        ]
      );
    } else {
      router.push("/dash_mod/account");
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: "#FFFBFB" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <Stack.Screen
        options={{
          animation: "slide_from_right",
          headerShown: false,
        }}
      />

      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header/Title Box */}
        <View style={[
          styles.titlebox,
          {
            paddingHorizontal: responsiveSize(16),
            paddingVertical: responsiveSize(20),
            marginTop: Platform.OS === 'web' ? responsiveSize(10) : responsiveSize(40),
          }
        ]}>
          <TouchableOpacity 
            onPress={handleBackPress}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back-outline"
              size={responsiveSize(26)}
              color="black"
            />
          </TouchableOpacity>
          <Text style={[
            styles.title,
            { fontSize: responsiveSize(24) }
          ]}>
            Contact Us
          </Text>
        </View>

        {/* Form Container */}
        <View style={[
          styles.container,
          {
            paddingHorizontal: responsiveSize(20),
            paddingTop: responsiveSize(10),
            paddingBottom: responsiveSize(100),
          }
        ]}>
          <View style={styles.infoContainer}>
            <Text style={[styles.infoTitle, { fontSize: responsiveSize(18) }]}>
              We're Here to Help!
            </Text>
            <Text style={[styles.infoText, { fontSize: responsiveSize(14) }]}>
              Have questions, feedback, or need assistance? Send us a message and we'll get back to you as soon as possible.
            </Text>
          </View>

          <View style={styles.formContainer}>
            {/* Subject Field */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { fontSize: responsiveSize(16) }]}>
                Subject *
              </Text>
              <TextInput
                placeholder="What is this regarding?"
                value={subject}
                onChangeText={setSubject}
                editable={!isSending}
                numberOfLines={1}
                maxLength={100}
                style={[
                  styles.txtfield,
                  {
                    height: responsiveSize(55),
                    fontSize: responsiveSize(16),
                    paddingHorizontal: responsiveSize(15),
                  }
                ]}
                placeholderTextColor="#666"
              />
              <Text style={[styles.charCount, { fontSize: responsiveSize(12) }]}>
                {subject.length}/100 characters
              </Text>
            </View>

            {/* Message Field */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { fontSize: responsiveSize(16) }]}>
                Your Message *
              </Text>
              <View style={styles.messageContainer}>
                <TextInput
                  value={descCount}
                  placeholder="Please describe your concern or feedback in detail..."
                  onChangeText={setDescCount}
                  editable={!isSending}
                  multiline
                  numberOfLines={8}
                  maxLength={1000}
                  style={[
                    styles.txtfield2,
                    {
                      fontSize: responsiveSize(16),
                      paddingHorizontal: responsiveSize(15),
                      paddingTop: responsiveSize(15),
                      minHeight: responsiveSize(200),
                    }
                  ]}
                  placeholderTextColor="#666"
                  textAlignVertical="top"
                />
                <View style={styles.wordCountContainer}>
                  <Text style={[styles.wordCount, { fontSize: responsiveSize(14) }]}>
                    {wordCount} / 100 words
                  </Text>
                  {wordCount > 100 && (
                    <Text style={[styles.wordCountError, { fontSize: responsiveSize(12) }]}>
                      (Exceeds limit)
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Additional Info */}
            <View style={styles.noteContainer}>
              <Ionicons name="information-circle-outline" size={responsiveSize(18)} color="#666" />
              <Text style={[styles.noteText, { fontSize: responsiveSize(12) }]}>
                Your message will be sent to fit4school.official@gmail.com
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button (Fixed at Bottom) */}
      <View style={[
        styles.buttonContainer,
        {
          paddingBottom: Platform.OS === 'ios' ? responsiveSize(30) : responsiveSize(20),
          paddingHorizontal: responsiveSize(20),
        }
      ]}>
        <TouchableOpacity 
          style={[
            styles.up_btn,
            (isSending || !subject.trim() || !descCount.trim() || wordCount > 100) && styles.disabledBtn,
            {
              paddingVertical: responsiveSize(16),
              paddingHorizontal: responsiveSize(20),
            }
          ]} 
          onPress={handleSubmit}
          disabled={isSending || !subject.trim() || !descCount.trim() || wordCount > 100}
        >
          {isSending ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="send-outline" size={responsiveSize(20)} color="white" />
              <Text style={[styles.btnText, { fontSize: responsiveSize(16), marginLeft: 10 }]}>
                SENDING...
              </Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <Ionicons name="paper-plane-outline" size={responsiveSize(20)} color="white" />
              <Text style={[styles.btnText, { fontSize: responsiveSize(16), marginLeft: 10 }]}>
                SEND MESSAGE
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Header Styles
  titlebox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBFB",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  
  backButton: {
    padding: 5,
    marginRight: 10,
  },

  title: {
    fontWeight: "500",
    color: "#000",
  },

  // Container Styles
  container: {
    flex: 1,
    backgroundColor: "#FFFBFB",
  },

  infoContainer: {
    marginBottom: 30,
    paddingHorizontal: 5,
  },

  infoTitle: {
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },

  infoText: {
    color: "#666",
    fontWeight: "300",
    lineHeight: 20,
  },

  // Form Styles
  formContainer: {
    marginTop: 10,
  },

  fieldContainer: {
    marginBottom: 25,
  },

  label: {
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },

  txtfield: {
    backgroundColor: '#D1E2E2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B0CACA',
    textAlignVertical: 'center',
    fontWeight: '400',
    color: '#000',
  },

  txtfield2: {
    backgroundColor: '#CEE3C3',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B8D4A8',
    fontWeight: '400',
    color: '#000',
  },

  charCount: {
    color: '#888',
    fontWeight: '300',
    textAlign: 'right',
    marginTop: 5,
  },

  messageContainer: {
    position: 'relative',
  },

  wordCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    bottom: 10,
    right: 15,
    left: 15,
  },

  wordCount: {
    color: '#666',
    fontWeight: '400',
  },

  wordCountError: {
    color: '#FF3B30',
    fontWeight: '500',
  },

  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#61C35C',
  },

  noteText: {
    color: '#666',
    marginLeft: 8,
    fontWeight: '300',
    flex: 1,
  },

  // Button Styles
  buttonContainer: {
    backgroundColor: "#FFFBFB",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 20,
    alignItems: 'center',
  },

  up_btn: {
    backgroundColor: "#61C35C",
    width: "100%",
    maxWidth: 400,
    borderRadius: 8,
    shadowColor: "#000",
    elevation: 5,
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    alignItems: "center",
    justifyContent: "center",
  },

  disabledBtn: {
    backgroundColor: "#A5D6A5",
    opacity: 0.7,
  },

  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  btnText: {
    fontWeight: "600",
    color: 'white',
  },
});