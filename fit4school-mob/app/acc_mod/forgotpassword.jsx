import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function ChangePasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [reenterPassword, setReenterPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showReenterPassword, setShowReenterPassword] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const router = useRouter();

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    
    return () => subscription?.remove();
  }, []);

  const responsiveFontSize = (baseSize) => {
    const scale = screenWidth / 375;
    return Math.round(baseSize * Math.min(scale, 1.5));
  };

  const responsiveSize = (baseSize) => {
    const scale = screenWidth / 375;
    return Math.round(baseSize * Math.min(scale, 1.3));
  };

  const handleConfirm = () => {
    if (!newPassword || !reenterPassword) {
      alert('Please fill in all fields.');
    } else if (newPassword !== reenterPassword) {
      alert('New password and re-entered password do not match.');
    } else if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long.');
    } else {
      alert('Password changed successfully!');
      router.push('/acc_mod/landing');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons 
            name="arrow-back-outline" 
            size={responsiveFontSize(28)} 
            color="black" 
          />
        </TouchableOpacity>
        <Text style={[styles.header, { fontSize: responsiveFontSize(28) }]}>
          Forgot Password
        </Text>
      </View>

      <Text style={[styles.label, { fontSize: responsiveFontSize(16) }]}>
        New Password
      </Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={[
            styles.input,
            styles.passwordInput,
            { 
              fontSize: responsiveFontSize(16),
              padding: responsiveSize(12)
            }
          ]}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Enter your new password"
          secureTextEntry={!showNewPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowNewPassword(!showNewPassword)}
        >
          <Ionicons 
            name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
            size={responsiveFontSize(24)} 
            color="#666" 
          />
        </TouchableOpacity>
      </View>

      <Text style={[styles.label, { fontSize: responsiveFontSize(16) }]}>
        Re-enter Password
      </Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={[
            styles.input,
            styles.passwordInput,
            { 
              fontSize: responsiveFontSize(16),
              padding: responsiveSize(12)
            }
          ]}
          value={reenterPassword}
          onChangeText={setReenterPassword}
          placeholder="Re-enter your new password"
          secureTextEntry={!showReenterPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowReenterPassword(!showReenterPassword)}
        >
          <Ionicons 
            name={showReenterPassword ? "eye-off-outline" : "eye-outline"} 
            size={responsiveFontSize(24)} 
            color="#666" 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <TouchableOpacity 
        style={[
          styles.confirmButton,
          { paddingVertical: responsiveSize(15) }
        ]} 
        onPress={handleConfirm}
      >
        <Text style={[
          styles.confirmButtonText, 
          { fontSize: responsiveFontSize(16) }
        ]}>
          CONFIRM
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBFB',
    paddingHorizontal: 30,
    paddingTop: 50,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 85,
  },
  header: {
    fontWeight: 'bold',
    color: 'black',
    marginLeft: 10,
    flexShrink: 1,
  },
  label: {
    fontWeight: '600',
    marginBottom: 15,
    color: '#000',
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 20,
  },
  confirmButton: {
    backgroundColor: '#61C35C',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});