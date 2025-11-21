import { StyleSheet, View, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../components/globalText";
import AsyncStorage from '@react-native-async-storage/async-storage';

import { auth, db } from "../../firebase"; 
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function SigninScreen() {  
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberPassword, setRememberPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const toggleRememberPassword = () => {
        setRememberPassword(!rememberPassword);
    };

    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setIsLoading(true);

        try {
            // Firebase Login
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const uid = user.uid;

            // Save the UID as your authtoken
            await AsyncStorage.setItem("auth", uid);

            // Fetch the user's data from Firestore
            const ref = doc(db, "accounts", uid);
            const snap = await getDoc(ref);

            if (!snap.exists()) {
                Alert.alert("Error", "Account not found in database");
                return;
            }

            const userData = snap.data();

            // Save user profile for fast login
            await AsyncStorage.setItem("lastUser", JSON.stringify(userData));

            if (rememberPassword) {
                await AsyncStorage.setItem(
                    "rememberedCredentials",
                    JSON.stringify({ email })
                );
            }

            Alert.alert("Success", `Welcome back, ${userData.fname}!`);
            router.push("/dash_mod/home");

        } catch (error) {
            console.log("Login error:", error);
            Alert.alert("Error", "Invalid email or password");
        }

        setIsLoading(false);
    };

    return (
        <View style={styles.container}>
            <View style={{flexDirection: 'row', alignItems: 'center', paddingVertical: '2%'}}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back-outline" size={28} color="black" />
                </TouchableOpacity>
                <Text style={styles.title} onPress={() => router.back()}> Sign In </Text>
            </View>
            
            <View style={{paddingVertical: '25%'}}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                
                <Text style={styles.label}>Password</Text>
                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    secureTextEntry
                />
                
                <View style={styles.passwordOptions}>
                    <TouchableOpacity 
                        style={styles.rememberContainer}
                        onPress={toggleRememberPassword}
                    >
                        <View style={[
                            styles.checkbox,
                            rememberPassword && styles.checkboxChecked
                        ]}>
                            {rememberPassword && (
                                <Ionicons name="checkmark" size={16} color="#fff" />
                            )}
                        </View>
                        <Text style={styles.rememberText}>Remember password</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => router.push('/acc_mod/forgotpassotp1')}>
                        <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                    style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
                    onPress={handleSignIn}
                    disabled={isLoading}
                >
                    <Text style={styles.signInButtonText}>
                        {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFBFB', padding: '10%' },
    title: { fontSize: 26, fontWeight: '600', color: '#000', marginLeft: 10 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 20 },
    passwordOptions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    rememberContainer: { flexDirection: 'row', alignItems: 'center' },
    checkbox: { width: 18, height: 18, borderWidth: 2, borderColor: '#ccc', borderRadius: 4, marginRight: 8 },
    checkboxChecked: { backgroundColor: '#61C35C', borderColor: '#61C35C' },
    rememberText: { fontSize: 14, color: '#666' },
    forgotText: { fontSize: 14, color: '#007AFF', fontWeight: '600' },
    signInButton: { backgroundColor: '#61C35C', paddingVertical: 15, borderRadius: 8, alignItems: 'center' },
    signInButtonDisabled: { backgroundColor: '#ccc' },
    signInButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
