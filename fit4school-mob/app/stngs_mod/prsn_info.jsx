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

export default function PrsnInfo() {
  const router = useRouter();
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('parent');
  const [studentNo, setStudentNo] = useState('');
  const [profileImage, setProfileImage] = useState(require("../../assets/images/dp_ex.jpg"));
  const [userData, setUserData] = useState(null);

  useEffect(() => {
   
    loadUserData();
    
    
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
      setScreenHeight(window.height);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const data = JSON.parse(userDataString);
        setUserData(data);
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setRole(data.role || 'parent');
        setStudentNo(data.studentNo || '');
        
       
        if (data.profileImageUri) {
          setProfileImage({ uri: data.profileImageUri });
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
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
        
        
        try {
          const currentData = await AsyncStorage.getItem('userData');
          const userData = currentData ? JSON.parse(currentData) : {};
          userData.profileImageUri = imageUri;
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
        } catch (error) {
          console.error('Error saving profile image:', error);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleUpdate = async () => {
    try {
      
      if (!firstName.trim() || !lastName.trim()) {
        Alert.alert("Validation Error", "First Name and Last Name are required");
        return;
      }

      
      const userData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
        studentNo: studentNo.trim(),
        profileImageUri: profileImage.uri || null,
        updatedAt: new Date().toISOString()
      };

      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      Alert.alert(
        "Success",
        "Profile updated successfully!",
        [
          {
            text: "OK",
            onPress: () => router.push("/stngs_mod/settings")
          }
        ]
      );
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    }
  };

  
  const getResponsiveValue = (baseValue) => {
    const scaleFactor = screenWidth / 375; 
    return baseValue * scaleFactor;
  };

  const isLargeScreen = screenWidth >= 768;
  const isExtraLargeScreen = screenWidth >= 1024;
  const isMobile = screenWidth < 768;

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
            onPress={() => router.push("/stngs_mod/settings")}
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
            {/* First Name */}
            <View>
              <Text style={[
                styles.txtlabel,
                { 
                  fontSize: getResponsiveValue(16),
                  marginBottom: getResponsiveValue(5)
                }
              ]}>
                First Name
              </Text>
              <TextInput
                style={[
                  styles.txtfld,
                  { 
                    height: getResponsiveValue(isLargeScreen ? 65 : 58),
                    fontSize: getResponsiveValue(16),
                    paddingHorizontal: getResponsiveValue(15)
                  }
                ]}
                placeholder='Enter First Name...'
                placeholderTextColor="#999"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>

            {/* Last Name */}
            <View>
              <Text style={[
                styles.txtlabel,
                { 
                  fontSize: getResponsiveValue(16),
                  marginBottom: getResponsiveValue(5)
                }
              ]}>
                Last Name
              </Text>
              <TextInput
                style={[
                  styles.txtfld,
                  { 
                    height: getResponsiveValue(isLargeScreen ? 65 : 58),
                    fontSize: getResponsiveValue(16),
                    paddingHorizontal: getResponsiveValue(15)
                  }
                ]}
                placeholder='Enter Last Name...'
                placeholderTextColor="#999"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>

            {/* Role Dropdown */}
            <View>
              <Text style={[
                styles.txtlabel,
                { 
                  fontSize: getResponsiveValue(16),
                  marginBottom: getResponsiveValue(5)
                }
              ]}>
                Role
              </Text>
              <View style={[
                styles.drop_cont,
                { 
                  height: getResponsiveValue(isLargeScreen ? 65 : 58)
                }
              ]}>
                <Picker
                  selectedValue={role}
                  onValueChange={(itemValue) => setRole(itemValue)}
                  style={[
                    styles.dropdown,
                    { fontSize: getResponsiveValue(16) }
                  ]}
                >
                  <Picker.Item label="Parent" value="parent" />
                  <Picker.Item label="Guardian" value="guardian" />
                  <Picker.Item label="Legal Guardian" value="legalGuardian" />
                </Picker>
              </View>
            </View>

            {/* Student Number */}
            <View>
              <Text style={[
                styles.txtlabel,
                { 
                  fontSize: getResponsiveValue(16),
                  marginBottom: getResponsiveValue(5)
                }
              ]}>
                Student No.
              </Text>
              <TextInput
                style={[
                  styles.txtfld,
                  { 
                    height: getResponsiveValue(isLargeScreen ? 65 : 58),
                    fontSize: getResponsiveValue(16),
                    paddingHorizontal: getResponsiveValue(15)
                  }
                ]}
                placeholder='12345678'
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={studentNo}
                onChangeText={setStudentNo}
              />
            </View>

            {/* Display Fields (Read-only) */}
            <View style={{ marginTop: getResponsiveValue(10) }}>
              <Text style={[
                styles.displayText,
                { 
                  fontSize: getResponsiveValue(16),
                  marginBottom: getResponsiveValue(5)
                }
              ]}>
                Mary Dela Cruz
              </Text>
              
              <Text style={[
                styles.displayText,
                { fontSize: getResponsiveValue(16) }
              ]}>
                Pre-school
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Update Button Container */}
      <View style={[
        styles.up_cont,
        { 
          paddingHorizontal: isExtraLargeScreen ? '15%' : isLargeScreen ? '10%' : getResponsiveValue(20),
          paddingBottom: Platform.OS === 'ios' ? getResponsiveValue(40) : getResponsiveValue(20)
        }
      ]}>
        <View style={{ alignItems: "center" }}>
          <TouchableOpacity 
            style={[
              styles.up_btn,
              { 
                paddingVertical: getResponsiveValue(isLargeScreen ? 18 : 15),
                width: isExtraLargeScreen ? '70%' : isLargeScreen ? '85%' : '100%'
              }
            ]}
            onPress={handleUpdate}
          >
            <Text style={[
              styles.btnText,
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

  txtlabel: {
    fontWeight: '500',
    color: '#333',
  },

  txtfld: {
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D9D9D9',
    backgroundColor: '#FFF',
    color: '#333',
  },

  drop_cont: {
    borderColor: '#D9D9D9',
    borderWidth: 1.5,
    borderRadius: 8,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  dropdown: {
    width: '100%',
    color: '#333',
  },

  displayText: {
    fontWeight: '400',
    color: '#666',
  },

  up_btn: {
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

  btnText: {
    fontWeight: "600",
    color: 'white',
  },

  up_cont: {
    backgroundColor: "#FFFBFB",
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 20,
  },
});