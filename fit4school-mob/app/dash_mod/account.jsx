//../../dash_mod/account
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, View, Image, TouchableOpacity, Alert, Dimensions, useWindowDimensions } from 'react-native';
import { Text } from "../../components/globalText";
import { useRouter } from "expo-router";
import * as ImagePicker from 'expo-image-picker';

export default function Account() {
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
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

  return (
    <View style={styles.container}>
      
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
          {/*<Text style={{
            fontWeight: '400', 
            color: '#FF6767', 
            fontSize: getResponsiveSize(14),
            marginBottom: getResponsiveSize(4)
          }}>
            User ID:          
          </Text>*/}
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
          style={[styles.btns, { paddingVertical: getResponsiveSize(12) }]} 
          onPress={() => router.push("/stngs_mod/help_cen")}
        >
          <Text style={[styles.stng_txt, { fontSize: getResponsiveSize(17) }]}>Help Center</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btns, { paddingVertical: getResponsiveSize(17) }]} 
          onPress={() => router.push("/stngs_mod/priv_not")}
        >
          <Text style={[styles.stng_txt, { fontSize: getResponsiveSize(17) }]}>Privacy Notice</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btns, { paddingVertical: getResponsiveSize(12) }]} 
          onPress={() => router.push("/stngs_mod/term_con")}
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