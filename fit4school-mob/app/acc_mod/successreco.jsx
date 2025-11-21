// AccountRecoverySuccess.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const AccountRecoverySuccess = () => {
  const router = useRouter();

  const handleBackToHome = () => {
    // Handle back to home logic here
    console.log('Back to Home pressed');
    router.push('/dash_mod/home');
  };

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={28} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Success Image */}
        <Image 
          source={require("../../assets/images/icons/gen_icons/success.png")} // Adjust path as needed
          style={styles.successImage}
          resizeMode="contain"
        />
        
        <Text style={styles.successText}>
          You Account Recovery has been updated successfully!
        </Text>
        
        <TouchableOpacity style={styles.button} onPress={handleBackToHome}>
          <Text style={styles.buttonText}>BACK TO HOME</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBFB',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successImage: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  successText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    fontFamily: 'System',
    marginBottom: 250,
    textAlign: 'center',
    lineHeight: 28,
  },
  button: {
    backgroundColor: '#61C35C',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
});

export default AccountRecoverySuccess;