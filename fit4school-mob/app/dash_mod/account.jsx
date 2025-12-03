//../../dash_mod/account
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  StyleSheet, 
  View, 
  Image, 
  TouchableOpacity, 
  Alert, 
  Dimensions, 
  useWindowDimensions,
  Modal,
  ScrollView 
} from 'react-native';
import { Text } from "../../components/globalText";
import { useRouter } from "expo-router";
import * as ImagePicker from 'expo-image-picker';

export default function Account() {
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();

  // Responsive size calculator
  const getResponsiveSize = (size) => {
    const baseWidth = 375; // Mobile Medium reference
    const scaleFactor = screenWidth / baseWidth;
    return size * Math.min(scaleFactor, 1.5); // Limit scaling for very large screens
  };

  useEffect(() => { 
    const getUserData = async () => {
      try {
        // Get the stored user data
        const storedUser = await AsyncStorage.getItem("lastUser");
        const storedProfileImage = await AsyncStorage.getItem("profileImage");
        
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setUserData(user);
        }
        
        if (storedProfileImage) {
          setProfileImage(storedProfileImage);
        }
      } catch (error) {
        console.error("Error getting user data:", error);
      }
    };
    
    getUserData();
  }, []);

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to change profile picture.');
        return;
      }

      // Launch image picker
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        const newImageUri = result.assets[0].uri;
        setProfileImage(newImageUri);
        
        // Save to AsyncStorage
        await AsyncStorage.setItem("profileImage", newImageUri);
        Alert.alert("Success", "Profile picture updated successfully!");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to update profile picture. Please try again.");
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Logout", 
          onPress: () => router.push("/acc_mod/login"),
          style: "destructive"
        }
      ]
    );
  };

  // Privacy Notice Content
  const PrivacyNoticeContent = () => (
    <ScrollView style={styles.modalContent}>
      <Text style={styles.modalTitle}>Privacy Notice</Text>
      <Text style={styles.modalSubtitle}>Last Updated: December 2, 2025</Text>
      
      <Text style={styles.modalParagraph}>
        Fit4School values privacy and is committed to protecting all users personal information. We ensure that we comply with the Data Privacy Act of 2012 (RA 10173) and other data privacy related laws. This Privacy Notice explains how we collect, use, store, and protect users data when using our services.
      </Text>

      <Text style={styles.modalSectionTitle}>Information We Collect</Text>
      <Text style={styles.modalParagraph}>
        We may collect the following types of personal information when registering or using Fit4School:
      </Text>
      <Text style={styles.modalListItem}>
        • Personal Information – Full name, email address, mobile number, and student ID
      </Text>
      <Text style={styles.modalListItem}>
        • Account Information – Username, password, and other login credentials.
      </Text>
      <Text style={styles.modalListItem}>
        • Transaction Details – Transaction history, payment references, appointment schedules, and related records.
      </Text>

      <Text style={styles.modalSectionTitle}>How We Use Information</Text>
      <Text style={styles.modalParagraph}>
        We use the information we collect to manage user accounts, process appointments and payments for school uniforms, and improve system features for a better user experience. Fit4School also complies with legal and regulatory requirements, especially with the Data Privacy Act of 2012 (RA 10173).
      </Text>

      <Text style={styles.modalSectionTitle}>Data Sharing and Disclosure</Text>
      <Text style={styles.modalParagraph}>
        We do not sell or rent personal information. However, we may share data with authorized school administrators of [school name] to process and verify orders.
      </Text>

      <Text style={styles.modalSectionTitle}>Rights as a Data Subject</Text>
      <Text style={styles.modalParagraph}>
        Under the Data Privacy Act of 2012, users have the right to:
      </Text>
      <Text style={styles.modalListItem}>1. Access personal information;</Text>
      <Text style={styles.modalListItem}>2. Receive information how was their personal information is being or has been processed; and</Text>
      <Text style={styles.modalListItem}>3. Object or withhold consent with regard to the collection of personal information.</Text>

      <Text style={styles.modalSectionTitle}>Retention and Disposal of Data</Text>
      <Text style={styles.modalParagraph}>
        Your personal data will be retained only for as long as it is needed to fulfill the purposes stated above or as required by law. Once data is no longer needed, it will be securely deleted or anonymized.
      </Text>

      <Text style={styles.modalSectionTitle}>Update in Privacy Notice</Text>
      <Text style={styles.modalParagraph}>
        We may update this Privacy Notice from time to time to reflect changes in the system or legal requirements. All changes will be posted in the app with the updated date.
      </Text>

      <Text style={styles.modalSectionTitle}>Contact Us</Text>
      <Text style={styles.modalParagraph}>
        If you have any questions, concerns, or feedback about this Privacy Notice or our data practices, you may contact our Data Protection Officer (DPO) at:
      </Text>
      <Text style={styles.modalListItem}>Fit4School Team</Text>
      <Text style={styles.modalListItem}>📧 fit4school.official@gmail.com</Text>
    </ScrollView>
  );

  // Terms and Conditions Content
  const TermsAndConditionsContent = () => (
    <ScrollView style={styles.modalContent}>
      <Text style={styles.modalTitle}>Terms and Conditions</Text>
      <Text style={styles.modalSubtitle}>Last Updated: December 2, 2025</Text>
      
      <Text style={styles.modalParagraph}>
        Please read these Terms and Conditions carefully before using our services.
      </Text>

      <Text style={styles.modalSectionTitle}>General</Text>
      <Text style={styles.modalParagraph}>
        The Terms and Conditions stated in the Fit4School mobile application govern the use of this app, including all pages where the user may be redirected. By using Fit4School, users agree that their personal data will be collected and processed in accordance with our Privacy Notice. Any personal information will be used solely for legitimate school-related transactions and system improvements. All collected data will be processed and safeguarded under RA 10173, or the Data Privacy Act of 2012, along with all other applicable laws.
      </Text>

      <Text style={styles.modalSectionTitle}>Definition of Terms</Text>
      <Text style={styles.modalListItem}>
        • Application – refers to the Fit4School mobile application.
      </Text>
      <Text style={styles.modalListItem}>
        • System – refers to the complete Fit4School application and all interconnected components.
      </Text>
      <Text style={styles.modalListItem}>
        • User – refers to students, parents, and legal guardians accessing the mobile application.
      </Text>
      <Text style={styles.modalListItem}>
        • Role – refers to the type of user interacting with the application (e.g., Parent, Student, Legal Guardian).
      </Text>
      <Text style={styles.modalListItem}>
        • Transaction – refers to the process of ordering school uniforms.
      </Text>
      <Text style={styles.modalListItem}>
        • Ticket – refers to a generated digital ticket after placing an order. This ticket may also be downloaded in PDF format.
      </Text>
      <Text style={styles.modalListItem}>
        • AR camera – refers to the feature that measures body proportions to recommend accurate uniform sizes.
      </Text>
      <Text style={styles.modalListItem}>
        • Service – refers to the mobile application and its functionalities.
      </Text>
      <Text style={styles.modalListItem}>
        • Administrator – refers to personnel managing transactions and orders.
      </Text>
      <Text style={styles.modalListItem}>
        • Developers – refers to the individuals who created and maintained the mobile application.
      </Text>
      <Text style={styles.modalListItem}>
        • School – refers to Children's School of Tomorrow.
      </Text>

      <Text style={styles.modalSectionTitle}>Basic Terms</Text>
      <Text style={styles.modalParagraph}>
        Only users aged 12 years old and above may directly access all features of the Fit4School mobile application.
      </Text>
      <Text style={styles.modalParagraph}>
        If the user is below 12 years old, a parent or legal guardian must use the application on their behalf. The parent or legal guardian is fully responsible for the account, including reading and understanding these Terms and Conditions. Developers and administrators hold no responsibility or liability for user errors such as multiple orders or accidental misuse of the system. The school is responsible only for the production and distribution of uniforms.
      </Text>
      <Text style={styles.modalParagraph}>
        Another reminder is to use the application strictly for legitimate and authorized purposes only.
      </Text>

      <Text style={styles.modalSectionTitle}>Use of the Application</Text>
      <Text style={styles.modalParagraph}>
        Once registered and granted access to the Fit4School mobile application, users may access the following features:
      </Text>
      <Text style={styles.modalListItem}>• View available school uniforms.</Text>
      <Text style={styles.modalListItem}>• Use the AR camera for virtual uniform fitting.</Text>
      <Text style={styles.modalListItem}>• Make transactions by ordering selected school uniforms.</Text>
      <Text style={styles.modalListItem}>• Set a preferred payment method (e.g., Cash, Bank Transfer) before placing order.</Text>
      <Text style={styles.modalListItem}>• View or download the digital ticket containing the QR code and appointment schedule.</Text>

      <Text style={styles.modalSectionTitle}>User Guidelines and Transaction Policies</Text>
      <Text style={styles.modalSubsectionTitle}>1. Account Registration</Text>
      <Text style={styles.modalParagraph}>
        Users must provide complete and accurate information, including full name, role, email, mobile number, and student ID number. The student ID number is required to verify whether the user—or the child of the parent or guardian—is a legitimate student of Children's School of Tomorrow. 
      </Text>
      <Text style={styles.modalParagraph}>
        Users are responsible for all activities performed under their accounts. Accounts with false, incomplete, or suspicious information may be suspended or permanently removed.
      </Text>

      <Text style={styles.modalSubsectionTitle}>2. Transaction Process, Payment, and Claiming Orders</Text>
      <Text style={styles.modalParagraph}>
        The transaction process in Fit4School follows a pre-order system, meaning the school does not maintain a large inventory of uniforms. Production begins only after a transaction has been made.
      </Text>
      <Text style={styles.modalParagraph}>
        Users must review all order details before submitting, as these will automatically appear on the generated ticket. The ticket includes the QR code, student name, item ordered, recommended size (e.g., Small, Medium, Large), quantity, total amount, payment method, appointment date and time, and order status (e.g., To Pay, To Receive, Completed). Tickets can be viewed on the mobile app or downloaded as a PDF.
      </Text>
      <Text style={styles.modalParagraph}>
        Please note that tickets are not receipts. The system generates only digital tickets, while official receipts are issued exclusively by the school accountant.
      </Text>
      <Text style={styles.modalParagraph}>
        Payment must be completed within 36 hours of placing the order. Failure to pay within the given time will result in an automatically voided transaction.
      </Text>
      <Text style={styles.modalParagraph}>
        Users are encouraged to regularly check their ticket because the appointment date and time for claiming uniforms may change depending on the school's schedule. Only administrators can update appointment schedules. Users must present a valid QR ticket and official receipt when claiming their uniforms.
      </Text>

      <Text style={styles.modalSectionTitle}>System Availability and Updates</Text>
      <Text style={styles.modalParagraph}>
        Fit4School may undergo updates, maintenance, or improvements at any time. While we aim to minimize downtime, uninterrupted access cannot be guaranteed. Features may be added, modified, or removed without prior notice to enhance user experience.
      </Text>

      <Text style={styles.modalSectionTitle}>Limitation of Liability</Text>
      <Text style={styles.modalParagraph}>
        Fit4School is not liable for indirect, incidental, or consequential damages resulting from the use—or inability to use—the system. The school and its authorized personnel remain solely responsible for the production and distribution of uniforms. The application serves only as a digital platform to support the process. Users are responsible for ensuring the accuracy of all submitted information.
      </Text>

      <Text style={styles.modalSectionTitle}>Update in Terms</Text>
      <Text style={styles.modalParagraph}>
        Developers may change or revise these Terms and Conditions at any time. Users are expected to review updates whenever they are posted. Continued use of the application indicates acceptance of the revised terms.
      </Text>

      <Text style={styles.modalSectionTitle}>Contact Us</Text>
      <Text style={styles.modalParagraph}>
        For questions, feedback, or concerns regarding these Terms and Conditions, you may contact:
      </Text>
      <Text style={styles.modalListItem}>Fit4School Team</Text>
      <Text style={styles.modalListItem}>📧 fit4school.official@gmail.com</Text>
    </ScrollView>
  );

  // Modal Component
  const PopupModal = ({ visible, onClose, title, children }) => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { 
          width: getResponsiveSize(350),
          maxHeight: getResponsiveSize(600),
          borderRadius: getResponsiveSize(15)
        }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalHeaderText, { fontSize: getResponsiveSize(18) }]}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { fontSize: getResponsiveSize(20) }]}>×</Text>
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Privacy Notice Modal */}
      <PopupModal 
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy Notice"
      >
        <PrivacyNoticeContent />
      </PopupModal>

      {/* Terms and Conditions Modal */}
      <PopupModal 
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms and Conditions"
      >
        <TermsAndConditionsContent />
      </PopupModal>
      
      <View style={[styles.prof_cont, { marginTop: getResponsiveSize(20) }]}>
        <TouchableOpacity onPress={pickImage} style={styles.dp_cont}>
          <Image 
            source={profileImage ? { uri: profileImage } : require("../../assets/images/dp_ex.jpg")} 
            style={[
              styles.dp_pic, 
              { 
                width: getResponsiveSize(100), 
                height: getResponsiveSize(100),
                borderRadius: getResponsiveSize(50)
              }
            ]} 
          />
          <View style={[styles.camera_icon, { bottom: getResponsiveSize(5), right: getResponsiveSize(5) }]}>
            <Text style={{ color: 'white', fontSize: getResponsiveSize(16) }}>✎</Text>
          </View>
        </TouchableOpacity>

        <View style={[styles.dp_txt, { marginLeft: getResponsiveSize(20) }]}>
          <Text style={{
            fontWeight: '500', 
            color: '#0FAFFF', 
            fontSize: getResponsiveSize(20),
            marginBottom: getResponsiveSize(4),
            marginTop: getResponsiveSize(15)
          }}>
            {userData ? `${userData.fname} ${userData.lname}` : "Loading..."}
          </Text>
          <Text style={{
            fontWeight: '400', 
            color: 'black', 
            fontSize: getResponsiveSize(14),
            marginBottom: getResponsiveSize(8)
          }}>
            {userData ? userData.email : "Loading..."}
          </Text>
          <Text style={{
            fontWeight: '400', 
            color: '#FF6767', 
            fontSize: getResponsiveSize(14),
            marginBottom: getResponsiveSize(8)
          }}>
            {userData ? `${userData.userId}` : "Loading..."}
          </Text>
          <Text style={{
            fontWeight: '400', 
            color: '#61C35C', 
            fontSize: getResponsiveSize(14)
          }}>
            {userData ? (userData.status === "pending-verification" ? "Pending Verification" : "Verified") : "Loading..."}
          </Text>
        </View>
      </View>

      <View style={[styles.stng_cont, { marginTop: getResponsiveSize(20), paddingHorizontal: getResponsiveSize(16) }]}>
        <TouchableOpacity 
          style={[styles.btns, { paddingVertical: getResponsiveSize(12) }]} 
          onPress={() => router.push("/stngs_mod/settings")}
        >
          <Text style={[styles.stng_txt, { fontSize: getResponsiveSize(17) }]}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btns, { paddingVertical: getResponsiveSize(17) }]} 
          onPress={() => setShowPrivacyModal(true)}
        >
          <Text style={[styles.stng_txt, { fontSize: getResponsiveSize(17) }]}>Privacy Notice</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btns, { paddingVertical: getResponsiveSize(12) }]} 
          onPress={() => setShowTermsModal(true)}
        >
          <Text style={[styles.stng_txt, { fontSize: getResponsiveSize(17) }]}>Terms and Conditions</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btns, { paddingVertical: getResponsiveSize(12) }]} 
          onPress={() => router.push("/stngs_mod/contact")}
        >
          <Text style={[styles.stng_txt, { fontSize: getResponsiveSize(17) }]}>Contact Us</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={{ paddingVertical: getResponsiveSize(40) }} 
          onPress={handleLogout}
        >
          <Text style={[styles.stng_txt, { fontSize: getResponsiveSize(17), color: 'black' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBFB',
  },
  prof_cont: {
    justifyContent: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '5%',
  },
  dp_cont: {
    position: 'relative',
  },
  dp_pic: {
    borderWidth: 2,
    borderColor: '#0FAFFF',
  },
  dp_txt: {
    flex: 1,
  },
  stng_cont: {
    flex: 1,
  },
  btns: {
    borderBottomColor: '#F0F0F0',
  },
  stng_txt: {
    fontWeight: '400',
  },
  camera_icon: {
    position: 'absolute',
    backgroundColor: '#0FAFFF',
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0FAFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalHeaderText: {
    fontWeight: '600',
    color: 'white',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0FAFFF',
    marginTop: 20,
    marginBottom: 10,
  },
  modalSubsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
  },
  modalParagraph: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  modalListItem: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginBottom: 6,
    marginLeft: 10,
  },
});

// Responsive hook for conditional rendering if needed
const useResponsive = () => {
  const { width } = useWindowDimensions();
  
  const isMobileSmall = width <= 320;
  const isMobileMedium = width > 320 && width <= 375;
  const isMobileLarge = width > 375 && width <= 425;
  const isTablet = width > 425 && width <= 768;
  const isLaptop = width > 768 && width <= 1024;
  const isLaptopLarge = width > 1024 && width <= 1440;
  const is4K = width > 1440;
  
  return {
    isMobileSmall,
    isMobileMedium,
    isMobileLarge,
    isTablet,
    isLaptop,
    isLaptopLarge,
    is4K,
    screenWidth: width
  };
};