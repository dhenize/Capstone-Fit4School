import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Platform,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView
} from "react-native";
import React, {useState} from "react";
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import * as MailComposer from 'expo-mail-composer';

const { width, height } = Dimensions.get('window');

// Responsive sizing function
const responsiveSize = (size) => {
  const scale = width / 375; // Base width (Mobile Medium)
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
  
  // Handle email sending
  const handleSubmit = async () => {
    if (!subject.trim() || !descCount.trim()) {
      alert("Please fill in both subject and message fields.");
      return;
    }

    if (wordCount > 100) {
      alert("Message exceeds 100 words limit.");
      return;
    }

    setIsSending(true);

    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      
      if (isAvailable) {
        await MailComposer.composeAsync({
          recipients: ['fit4school.official@gmail.com'],
          subject: `[Contact Form]: ${subject}`,
          body: descCount,
        });
        
        // Navigate to success page after sending
        router.push("/stngs_mod/con_success");
      } else {
        alert("Email service is not available on this device.");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: "#FFFBFB" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
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
      >
        {/* Title Box */}
        <View style={styles.titlebox}>
          <TouchableOpacity 
            onPress={() => router.push("/dash_mod/account")}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back-outline"
              size={responsiveSize(26)}
              color="black"
            />
          </TouchableOpacity>
          <Text style={styles.title}>Need Help?</Text>
        </View>

        <View style={styles.container}>
          <View style={styles.txtfield_cont}>
            <TextInput
              placeholder="Subject"
              value={subject}
              onChangeText={setSubject}
              editable
              numberOfLines={1}
              maxLength={100}
              style={styles.txtfield}
              placeholderTextColor="#666"
            />

            <TextInput
              value={descCount}
              placeholder="Your Message"
              onChangeText={setDescCount}
              editable
              multiline
              numberOfLines={10}
              maxLength={1000}
              style={styles.txtfield2}
              placeholderTextColor="#666"
            />

            <Text style={styles.count_txt}>
              {wordCount} / 100 words
            </Text>
          </View>

          <View style={styles.up_cont}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[
                  styles.up_btn, 
                  (isSending || !subject.trim() || !descCount.trim()) && styles.disabledBtn
                ]} 
                onPress={handleSubmit}
                disabled={isSending || !subject.trim() || !descCount.trim()}
              >
                <Text style={styles.btnText}>
                  {isSending ? "SENDING..." : "SUBMIT"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // TITLE CONTAINER
  titlebox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: responsiveSize(20),
    paddingHorizontal: responsiveSize(16),
    marginTop: Platform.OS === 'web' ? responsiveSize(10) : responsiveSize(40),
    backgroundColor: "#FFFBFB",
  },
  
  backButton: {
    marginRight: responsiveSize(12),
    padding: responsiveSize(5),
  },

  title: {
    fontWeight: "500",
    fontSize: responsiveSize(24),
    color: "#000",
  },

  // OVERALL CONTAINER
  container: {
    paddingHorizontal: responsiveSize(20),
    paddingTop: responsiveSize(10),
    paddingBottom: responsiveSize(100),
    flex: 1,
    backgroundColor: "#FFFBFB",
  },

  txtfield_cont: {
    marginVertical: responsiveSize(20),
    position: 'relative',
    rowGap: responsiveSize(20),
  },

  txtfield: {
    backgroundColor: '#D1E2E2',
    paddingHorizontal: responsiveSize(15),
    paddingVertical: Platform.OS === 'ios' ? responsiveSize(15) : responsiveSize(12),
    borderRadius: responsiveSize(10),
    height: responsiveSize(55),
    textAlignVertical: 'center',
    fontWeight: '400',
    fontSize: responsiveSize(16),
    color: '#000',
  },

  txtfield2: {
    backgroundColor: '#CEE3C3',
    paddingHorizontal: responsiveSize(15),
    paddingVertical: responsiveSize(15),
    borderRadius: responsiveSize(10),
    height: responsiveSize(250),
    textAlignVertical: 'top',
    fontWeight: '400',
    fontSize: responsiveSize(16),
    color: '#000',
    minHeight: responsiveSize(200),
  },

  count_txt: {
    color: '#808080',
    fontWeight: '400',
    fontSize: responsiveSize(14),
    position: 'absolute',
    right: responsiveSize(10),
    bottom: responsiveSize(10),
  },

  up_cont: {
    marginTop: responsiveSize(30),
    marginBottom: responsiveSize(20),
  },

  buttonContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  up_btn: {
    backgroundColor: "#61C35C",
    paddingVertical: responsiveSize(16),
    paddingHorizontal: responsiveSize(40),
    width: "100%",
    maxWidth: responsiveSize(300),
    borderRadius: responsiveSize(5),
    shadowColor: "black",
    elevation: 5,
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 4 },
    alignItems: "center",
    justifyContent: "center",
  },

  disabledBtn: {
    backgroundColor: "#A5D6A5",
    opacity: 0.7,
  },

  btnText: {
    fontSize: responsiveSize(18),
    fontWeight: "600",
    color: 'white',
  },
}); 



