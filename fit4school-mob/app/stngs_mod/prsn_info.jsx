import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  Platform,
  ScrollView,
  Dimensions,
  Alert,
  KeyboardAvoidingView
} from 'react-native';
import { Picker } from "@react-native-picker/picker";
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import Firestore
import { db, auth } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function PrsnInfo() {
  const router = useRouter();
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  
  const [userId, setUserId] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Guardian');
  const [email, setEmail] = useState('');
  const [childName, setChildName] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [status, setStatus] = useState('Active');
  const [profileImage, setProfileImage] = useState(require("../../assets/images/dp_ex.jpg"));
  const [isLoading, setIsLoading] = useState(true);
  const [userDocId, setUserDocId] = useState(''); // Firestore document ID

  useEffect(() => {
    loadCurrentUserData();
    
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
      setScreenHeight(window.height);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  // Function para kunin ang data ng nakalogin na user mula sa Firestore
  const loadCurrentUserData = async () => {
    try {
      setIsLoading(true);
      
      // Kunin ang user ID mula sa AsyncStorage (galing sa sign-in)
      const storedUserId = await AsyncStorage.getItem("userId");
      const storedUserData = await AsyncStorage.getItem("userData");
      
      console.log("Stored User ID:", storedUserId);
      console.log("Stored User Data:", storedUserData);
      
      if (!storedUserId && !storedUserData) {
        Alert.alert("Not Logged In", "Please sign in first", [
          { text: "OK", onPress: () => router.push("/login") }
        ]);
        return;
      }
      
      let userData = null;
      
      // Try to get from stored userData first
      if (storedUserData) {
        userData = JSON.parse(storedUserData);
        setUserDocId(storedUserId || userData.id);
        console.log("Using stored user data:", userData);
      }
      
      // If we have userId, try to fetch from Firestore
      if (storedUserId && !userData) {
        try {
          const accountRef = doc(db, "accounts", storedUserId);
          const accountSnap = await getDoc(accountRef);
          
          if (accountSnap.exists()) {
            userData = accountSnap.data();
            setUserDocId(storedUserId);
            console.log("Fetched from Firestore by ID:", userData);
          }
        } catch (error) {
          console.error("Error fetching from Firestore:", error);
        }
      }
      
      // If still no data, try to find by email
      if (!userData) {
        const userEmail = await AsyncStorage.getItem('userEmail');
        if (userEmail) {
          // Note: You might need to implement query like in sign-in
          // For now, we'll use stored data
        }
      }
      
      if (userData) {
        // Set all fields based on user data structure from sign-in
        setUserId(userData.userId || storedUserId || `USR${new Date().getFullYear()}@${Math.floor(Math.random() * 1000)}`);
        setFullName(userData.parent_fullname || userData.fname || userData.fullName || '');
        setRole(userData.role || userData.userType || 'Guardian');
        setEmail(userData.email || '');
        setChildName(userData.childName || userData.student_name || '');
        setTempPassword(userData.tempPassword || userData.password || '');
        setStatus(userData.status || 'Active');
        
        if (userData.profileImageUri) {
          setProfileImage({ uri: userData.profileImageUri });
        }
        
        // Save to AsyncStorage for quick access
        await AsyncStorage.setItem('currentUserData', JSON.stringify(userData));
      } else {
        // If no user data found, show alert
        Alert.alert("Error", "Unable to load user data. Please sign in again.", [
          { 
            text: "OK", 
            onPress: () => {
              AsyncStorage.clear();
              router.push("/login");
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert("Error", "Failed to load user data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission required", "Permission to access camera roll is required!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        const imageUri = result.assets[0].uri;
        setProfileImage({ uri: imageUri });
        
        // Save profile image to AsyncStorage
        await saveProfileImageLocally(imageUri);
        
        // Try to save to Firestore if we have userDocId
        if (userDocId) {
          await saveProfileImageToFirestore(imageUri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const saveProfileImageLocally = async (imageUri) => {
    try {
      // Save to AsyncStorage
      const currentDataString = await AsyncStorage.getItem('currentUserData');
      if (currentDataString) {
        const currentData = JSON.parse(currentDataString);
        currentData.profileImageUri = imageUri;
        await AsyncStorage.setItem('currentUserData', JSON.stringify(currentData));
      }
      
      // Also update stored userData
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        userData.profileImageUri = imageUri;
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error saving profile image locally:', error);
    }
  };

  const saveProfileImageToFirestore = async (imageUri) => {
    try {
      if (!userDocId) {
        console.log("No userDocId available for Firestore update");
        return;
      }
      
      const accountRef = doc(db, "accounts", userDocId);
      await updateDoc(accountRef, {
        profileImageUri: imageUri,
        updatedAt: new Date().toISOString()
      });
      
      console.log("Profile image updated in Firestore");
    } catch (error) {
      console.error("Error updating profile image in Firestore:", error);
    }
  };

  const handleUpdate = async () => {
    try {
      // Validation
      if (!fullName.trim()) {
        Alert.alert("Validation Error", "Full Name is required");
        return;
      }

      if (!email.trim()) {
        Alert.alert("Validation Error", "Email is required");
        return;
      }

      const updatedData = {
        parent_fullname: fullName.trim(),
        fname: fullName.trim(),
        fullName: fullName.trim(),
        role: role,
        userType: role,
        email: email.trim(),
        childName: childName.trim(),
        student_name: childName.trim(),
        status: status || 'Active',
        profileImageUri: profileImage.uri || null,
        updatedAt: new Date().toISOString()
      };

      // Update locally in AsyncStorage
      const currentDataString = await AsyncStorage.getItem('currentUserData');
      if (currentDataString) {
        const currentData = JSON.parse(currentDataString);
        const mergedData = { ...currentData, ...updatedData };
        await AsyncStorage.setItem('currentUserData', JSON.stringify(mergedData));
      }
      
      // Update stored userData
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        const mergedUserData = { ...userData, ...updatedData };
        await AsyncStorage.setItem('userData', JSON.stringify(mergedUserData));
      }

      // Update in Firestore if we have userDocId
      if (userDocId) {
        try {
          const accountRef = doc(db, "accounts", userDocId);
          await updateDoc(accountRef, updatedData);
          console.log("User data updated in Firestore");
        } catch (firestoreError) {
          console.error("Error updating Firestore:", firestoreError);
          // Don't show error to user, just log it
        }
      }

      Alert.alert(
        "Success",
        "Profile updated successfully!",
        [
          {
            text: "OK",
            onPress: () => router.push("/stngs_mod/accountsetting")
          }
        ]
      );
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    }
  };

  // Responsive design helper
  const getResponsiveValue = (baseValue) => {
    const scaleFactor = screenWidth / 375; 
    return baseValue * scaleFactor;
  };

  const isLargeScreen = screenWidth >= 768;
  const isExtraLargeScreen = screenWidth >= 1024;

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFBFB' }}>
        <Ionicons name="reload-outline" size={40} color="#61C35C" />
        <Text style={{ marginTop: 10, fontSize: 16, color: '#333' }}>Loading user data...</Text>
      </View>
    );
  }

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
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Box */}
        <View style={[
          styles.titlebox,
          { 
            paddingHorizontal: getResponsiveValue(20),
            paddingVertical: getResponsiveValue(25),
            top: Platform.OS === 'web' ? 0 : getResponsiveValue(20)
          }
        ]}>
          <TouchableOpacity 
            onPress={() => router.push("/stngs_mod/accountsetting")}
            style={{ marginRight: getResponsiveValue(10) }}
          >
            <Ionicons
              name="arrow-back-outline"
              size={getResponsiveValue(26)}
              color="black"
            />
          </TouchableOpacity>
          <Text style={[
            styles.title,
            { 
              fontSize: getResponsiveValue(isLargeScreen ? 28 : 24),
              marginLeft: getResponsiveValue(5)
            }
          ]}>
            Personal Information
          </Text>
        </View>

        {/* MAIN CONTAINER */}
        <View style={[
          styles.container,
          { 
            paddingHorizontal: isExtraLargeScreen ? '15%' : isLargeScreen ? '10%' : getResponsiveValue(20),
            paddingTop: getResponsiveValue(20),
            paddingBottom: getResponsiveValue(100)
          }
        ]}>
          {/* Profile Picture Container */}
          <View style={[
            styles.pf_cont,
            { marginBottom: getResponsiveValue(30) }
          ]}>
            <TouchableOpacity onPress={handleImagePick}>
              <Image
                source={profileImage}
                style={[
                  styles.pf_img,
                  { 
                    height: getResponsiveValue(isLargeScreen ? 120 : 90),
                    width: getResponsiveValue(isLargeScreen ? 120 : 90)
                  }
                ]}
              />
              <View style={[
                styles.editOverlay,
                {
                  height: getResponsiveValue(isLargeScreen ? 120 : 90),
                  width: getResponsiveValue(isLargeScreen ? 120 : 90),
                  borderRadius: getResponsiveValue(isLargeScreen ? 60 : 45)
                }
              ]}>
                <Ionicons 
                  name="camera-outline" 
                  size={getResponsiveValue(24)} 
                  color="white" 
                />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleImagePick}>
              <Text style={[
                styles.edit_txt,
                { 
                  fontSize: getResponsiveValue(14),
                  marginTop: getResponsiveValue(10)
                }
              ]}>
                Edit Profile Picture
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Container */}
          <View style={[
            styles.inp_cont,
            { gap: getResponsiveValue(15) }
          ]}>
            {/* USER ID (Read-only) */}
            <View>
              <Text style={[
                styles.labelText,
                { 
                  fontSize: getResponsiveValue(14),
                  marginBottom: getResponsiveValue(5)
                }
              ]}>
                USER ID
              </Text>
              <View style={[
                styles.displayBox,
                { 
                  height: getResponsiveValue(isLargeScreen ? 50 : 45),
                  justifyContent: 'center',
                  paddingHorizontal: getResponsiveValue(15)
                }
              ]}>
                <Text style={[
                  styles.displayValue,
                  { fontSize: getResponsiveValue(16) }
                ]}>
                  {userId || 'Not Available'}
                </Text>
              </View>
            </View>

            {/* FULL NAME */}
            <View>
              <Text style={[
                styles.labelText,
                { 
                  fontSize: getResponsiveValue(14),
                  marginBottom: getResponsiveValue(5)
                }
              ]}>
                FULL NAME
              </Text>
              <TextInput
                style={[
                  styles.inputField,
                  { 
                    height: getResponsiveValue(isLargeScreen ? 50 : 45),
                    fontSize: getResponsiveValue(16),
                    paddingHorizontal: getResponsiveValue(15)
                  }
                ]}
                placeholder='Enter Full Name...'
                placeholderTextColor="#999"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            {/* ROLE */}
            <View>
              <Text style={[
                styles.labelText,
                { 
                  fontSize: getResponsiveValue(14),
                  marginBottom: getResponsiveValue(5)
                }
              ]}>
                ROLE
              </Text>
              <View style={[
                styles.pickerContainer,
                { 
                  height: getResponsiveValue(isLargeScreen ? 50 : 45)
                }
              ]}>
                <Picker
                  selectedValue={role}
                  onValueChange={(itemValue) => setRole(itemValue)}
                  style={[
                    styles.picker,
                    { fontSize: getResponsiveValue(16) }
                  ]}
                >
                  <Picker.Item label="Guardian" value="Guardian" />
                  <Picker.Item label="Parent" value="Parent" />
                  <Picker.Item label="Legal Guardian" value="Legal Guardian" />
                  <Picker.Item label="Teacher" value="Teacher" />
                  <Picker.Item label="Student" value="Student" />
                </Picker>
              </View>
            </View>

            {/* EMAIL */}
            <View>
              <Text style={[
                styles.labelText,
                { 
                  fontSize: getResponsiveValue(14),
                  marginBottom: getResponsiveValue(5)
                }
              ]}>
                EMAIL
              </Text>
              <TextInput
                style={[
                  styles.inputField,
                  { 
                    height: getResponsiveValue(isLargeScreen ? 50 : 45),
                    fontSize: getResponsiveValue(16),
                    paddingHorizontal: getResponsiveValue(15)
                  }
                ]}
                placeholder='Enter Email...'
                placeholderTextColor="#999"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* CHILD(REN) */}
            <View>
              <Text style={[
                styles.labelText,
                { 
                  fontSize: getResponsiveValue(14),
                  marginBottom: getResponsiveValue(5)
                }
              ]}>
                CHILD(REN)
              </Text>
              <TextInput
                style={[
                  styles.inputField,
                  { 
                    height: getResponsiveValue(isLargeScreen ? 50 : 45),
                    fontSize: getResponsiveValue(16),
                    paddingHorizontal: getResponsiveValue(15)
                  }
                ]}
                placeholder='Enter Child Name...'
                placeholderTextColor="#999"
                value={childName}
                onChangeText={setChildName}
              />
            </View>

            {/* TEMPORARY PASSWORD */}
            <View>
              <Text style={[
                styles.labelText,
                { 
                  fontSize: getResponsiveValue(14),
                  marginBottom: getResponsiveValue(5)
                }
              ]}>
                TEMPORARY PASSWORD
              </Text>
              <View style={[
                styles.displayBox,
                { 
                  height: getResponsiveValue(isLargeScreen ? 50 : 45),
                  justifyContent: 'center',
                  paddingHorizontal: getResponsiveValue(15)
                }
              ]}>
                <Text style={[
                  styles.displayValue,
                  { fontSize: getResponsiveValue(16) }
                ]}>
                  {tempPassword || 'Not Available'}
                </Text>
              </View>
            </View>

            {/* STATUS */}
            <View>
              <Text style={[
                styles.labelText,
                { 
                  fontSize: getResponsiveValue(14),
                  marginBottom: getResponsiveValue(5)
                }
              ]}>
                STATUS
              </Text>
              <View style={[
                styles.displayBox,
                { 
                  height: getResponsiveValue(isLargeScreen ? 50 : 45),
                  justifyContent: 'center',
                  paddingHorizontal: getResponsiveValue(15)
                }
              ]}>
                <View style={styles.statusContainer}>
                  <View style={[
                    styles.statusIndicator,
                    { backgroundColor: status === 'Active' ? '#4CAF50' : '#FF9800' }
                  ]} />
                  <Text style={[
                    styles.statusText,
                    { fontSize: getResponsiveValue(16) }
                  ]}>
                    {status || 'Not Available'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Update Button Container */}
      <View style={[
        styles.buttonContainer,
        { 
          paddingHorizontal: isExtraLargeScreen ? '15%' : isLargeScreen ? '10%' : getResponsiveValue(20),
          paddingBottom: Platform.OS === 'ios' ? getResponsiveValue(40) : getResponsiveValue(20)
        }
      ]}>
        <View style={{ alignItems: "center" }}>
          <TouchableOpacity 
            style={[
              styles.updateButton,
              { 
                paddingVertical: getResponsiveValue(isLargeScreen ? 18 : 15),
                width: isExtraLargeScreen ? '70%' : isLargeScreen ? '85%' : '100%'
              }
            ]}
            onPress={handleUpdate}
          >
            <Text style={[
              styles.buttonText,
              { fontSize: getResponsiveValue(isLargeScreen ? 22 : 20) }
            ]}>
              UPDATE
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  titlebox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBFB",
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontWeight: "500",
    color: '#333',
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFBFB",
  },
  pf_cont: {
    alignItems: 'center',
  },
  pf_img: {
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#E0E0E0',
  },
  editOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  edit_txt: {
    color: '#0FAFFF',
    fontWeight: '500',
  },
  inp_cont: {
    width: '100%',
  },
  labelText: {
    fontWeight: '600',
    color: '#333',
    letterSpacing: 0.5,
  },
  inputField: {
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D9D9D9',
    backgroundColor: '#FFF',
    color: '#333',
  },
  displayBox: {
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D9D9D9',
    backgroundColor: '#F8F8F8',
  },
  displayValue: {
    fontWeight: '400',
    color: '#666',
  },
  pickerContainer: {
    borderColor: '#D9D9D9',
    borderWidth: 1.5,
    borderRadius: 8,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statusText: {
    fontWeight: '400',
    color: '#666',
  },
  buttonContainer: {
    backgroundColor: "#FFFBFB",
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 20,
  },
  updateButton: {
    backgroundColor: "#61C35C",
    borderRadius: 10,
    shadowColor: "black",
    elevation: 8,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontWeight: "600",
    color: 'white',
  },
});