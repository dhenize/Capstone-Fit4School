// AccountRecovery.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const AccountRecovery = () => {
  const router = useRouter();

  const handleProceed = () => {
    // Handle proceed logic here
    console.log('Proceed button pressed');
    router.push('/acc_mod/recoveryques');
  };

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.header}>Account Recovery</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <View style={styles.imageContainer}>
            <Image 
              source={require("../../assets/images/icons/gen_icons/shield.png")} 
              style={styles.image}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.subtitle}>Security Questions</Text>
        </View>
        
        <TouchableOpacity style={styles.button} onPress={handleProceed}>
          <Text style={styles.buttonText}>PROCEED</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBFB',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 18,
    color: 'black',
    fontFamily: 'System',
    textAlign: 'center',
    marginLeft: 10,
    marginBottom: 500,
    textAlign: 'center',
    alignSelf: 'center',
    left: -50, // Space between image and text
  },
  imageContainer: {
    marginBottom: 500,
    textAlign: 'center',
    alignSelf: 'center',
    left: -50,
  },
  image: {
    width: 30, // Smaller width
    height: 30, // Smaller height
  },
  button: {
    backgroundColor: '#61C35C',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    minWidth: 300,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
});


export default AccountRecovery;