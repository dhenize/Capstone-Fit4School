// components/ar_com/help_modal.jsx

import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../components/globalText";

export default function HelpModal({ visible, onClose }) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity onPress={onClose} style = {styles.close}>
          <Ionicons name="close-outline" size={30} color="rgb(44,44,44)" />
        </TouchableOpacity>

        <View style={styles.t_cont}>
          <Text style={styles.title}>How to use Virtual Size Assistant</Text>
        </View>
        
        <ScrollView style={styles.scrollarea}>
          <Text style = {styles.desc_step}>
            Step 1 – Prepare Your Space
          </Text>
          <Text style = {styles.desc}>
            • Stand in a well-lit area with minimal shadows. 
            {"\n"} {"\n"}
            • Make sure your full body is visible on camera (from head to feet).
            {"\n"} {"\n"}
            • Place your phone at least 2 meters (about 6 feet) away, ideally on a stable surface or tripod.

          </Text>

          <Text style = {styles.desc_step}>
            Step 2 – Enter your child’s height and gender
          </Text>
          <Text style = {styles.desc}>
            • Before scanning, type in your actual height (in centimeters or feet) and gender.
            {"\n"} {"\n"}
            • This helps the camera scale body proportions more accurately for size calculation.

          </Text>

          <Text style = {styles.desc_step}>
            Step 3 – Align the body
          </Text>
          <Text style = {styles.desc}>
            • Stand upright with arms slightly away from your body.
            {"\n"} {"\n"}
            • Face forward toward the camera.
            {"\n"} {"\n"}
            • Keep your feet shoulder-width apart.            

          </Text>

          <Text style = {styles.desc_step}>
            Step 4 – Start Scanning
          </Text>
          <Text style = {styles.desc}>
            • Tap “Enter”.
            {"\n"} {"\n"}
            • Slowly rotate 360° when prompted, or follow the on-screen guide (e.g., “Turn left,” “Turn right”).
            {"\n"} {"\n"}
            • The app will capture key body points (shoulders, chest, waist, hips, legs).

          </Text>

          <Text style = {styles.desc_step}>
            Step 5 – Wait
          </Text>
          <Text style = {styles.desc}>
            • Once scanning is complete, the app will analyze your body dimensions.

          </Text>

          <Text style = {styles.desc_step}>
            Step 6 – View Recommended Size
          </Text>
          <Text style = {styles.desc}>
            • The app will display your recommended clotshing size (e.g., Small, Medium, Large, or numeric size).

          </Text>                    
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:{
    flex: 1,
    backgroundColor: 'gray',
    padding: '10%',
  },

  title:{
    fontWeight: 600,
    fontSize: 20,
    marginBottom: '8%',
  },

  desc_step:{
    fontWeight: 600,
    fontSize: 18,
    marginVertical: '3%',
    justifyContent: 'space-evenly',
  },

  desc:{
    fontSize: 14,
    marginBottom: "12%",
    fontWeight: 600,
    textAlign: "justify",
  },

  close:{
    alignSelf: 'flex-end',
  }
});
