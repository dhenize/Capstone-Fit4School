import { StyleSheet, View, TextInput, TouchableOpacity, Image, Alert, Dimensions, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../components/globalText";
import AsyncStorage from '@react-native-async-storage/async-storage';

import { auth, db } from "../../firebase"; 
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function SigninScreen() {  
    const router = useRouter();
    const [windowDimensions, setWindowDimensions] = useState(Dimensions.get('window'));

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberPassword, setRememberPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setWindowDimensions(window);
        });
        return () => subscription?.remove();
    }, []);

    const toggleRememberPassword = () => {
        setRememberPassword(!rememberPassword);
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
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

    // Responsive scaling functions
    const scaleWidth = (value) => {
        const { width } = windowDimensions;
        // Reference width for scaling (iPhone 12 Pro - 390px)
        const guidelineBaseWidth = 390;
        return (value / guidelineBaseWidth) * width;
    };

    const scaleFont = (size) => {
        const { width } = windowDimensions;
        const guidelineBaseWidth = 390;
        const scaleFactor = width / guidelineBaseWidth;
        
        // Limit font scaling for very large screens
        const maxScale = 1.5;
        const minScale = 0.8;
        const scaledSize = size * Math.max(minScale, Math.min(scaleFactor, maxScale));
        
        return Math.round(scaledSize);
    };

    const scalePadding = () => {
        const { width } = windowDimensions;
        if (width < 375) return '5%'; // Mobile Small
        if (width < 768) return '8%'; // Mobile Medium/Large
        if (width < 1024) return '10%'; // Tablet
        if (width < 1440) return '15%'; // Laptop
        return '20%'; // Laptop Large & 4K
    };

    const getContainerPadding = scalePadding();

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={[styles.contentContainer, { paddingHorizontal: getContainerPadding }]}>
                    <View style={styles.headerContainer}>
                        <TouchableOpacity 
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back-outline" size={scaleFont(28)} color="black" />
                        </TouchableOpacity>
                        <Text style={[styles.title, { fontSize: scaleFont(26) }]}>Sign In</Text>
                    </View>
                    
                    <View style={styles.formContainer}>
                        <Text style={[styles.label, { fontSize: scaleFont(16) }]}>Email</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[styles.input, { 
                                    fontSize: scaleFont(16),
                                    paddingHorizontal: scaleWidth(12),
                                    paddingVertical: scaleWidth(12),
                                    height: scaleWidth(50)
                                }]}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Enter your email"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                placeholderTextColor="#999"
                            />
                        </View>
                        
                        <Text style={[styles.label, { fontSize: scaleFont(16) }]}>Password</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={[styles.input, styles.passwordInput, { 
                                    fontSize: scaleFont(16),
                                    paddingHorizontal: scaleWidth(12),
                                    paddingVertical: scaleWidth(12),
                                    height: scaleWidth(50)
                                }]}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Enter your password"
                                secureTextEntry={!showPassword}
                                placeholderTextColor="#999"
                            />
                            <TouchableOpacity 
                                style={styles.eyeIcon}
                                onPress={toggleShowPassword}
                            >
                                <Ionicons 
                                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                    size={scaleFont(20)} 
                                    color="#666" 
                                />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={[styles.passwordOptions, { marginBottom: scaleWidth(20) }]}>
                            <TouchableOpacity 
                                style={styles.rememberContainer}
                                onPress={toggleRememberPassword}
                            >
                                <View style={[
                                    styles.checkbox,
                                    rememberPassword && styles.checkboxChecked,
                                    { width: scaleWidth(18), height: scaleWidth(18) }
                                ]}>
                                    {rememberPassword && (
                                        <Ionicons name="checkmark" size={scaleFont(14)} color="#fff" />
                                    )}
                                </View>
                                <Text style={[styles.rememberText, { fontSize: scaleFont(14) }]}>
                                    Remember password
                                </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity onPress={() => router.push('/acc_mod/forgotpassotp1')}>
                                <Text style={[styles.forgotText, { fontSize: scaleFont(14) }]}>
                                    Forgot password?
                                </Text>
                            </TouchableOpacity>
                        </View>
                        
                        <TouchableOpacity 
                            style={[
                                styles.signInButton, 
                                isLoading && styles.signInButtonDisabled,
                                { 
                                    paddingVertical: scaleWidth(15),
                                    borderRadius: scaleWidth(8),
                                    marginBottom: scaleWidth(20)
                                }
                            ]}
                            onPress={handleSignIn}
                            disabled={isLoading}
                        >
                            <Text style={[styles.signInButtonText, { fontSize: scaleFont(16) }]}>
                                {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
                            </Text>
                        </TouchableOpacity>

                        {/* Additional responsive spacing for larger screens */}
                        {windowDimensions.width >= 768 && (
                            <View style={{ height: scaleWidth(40) }} />
                        )}
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#FFFBFB'
    },
    contentContainer: {
        flex: 1,
        paddingVertical: '5%',
    },
    headerContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: '10%',
        marginBottom: '20%'
    },
    backButton: {
        padding: 8,
        marginRight: 10,
    },
    title: { 
        fontWeight: '700', 
        color: '#000' 
    },
    formContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    label: { 
        fontWeight: '690', 
        marginBottom: 8,
        color: '#333'
    },
    inputWrapper: {
        marginBottom: 20,
    },
    input: { 
        borderWidth: 1, 
        borderColor: '#ddd', 
        borderRadius: 8, 
        backgroundColor: '#fff',
        color: '#333',
    },
    passwordContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    passwordInput: {
        paddingRight: 50, // Space for eye icon
    },
    eyeIcon: {
        position: 'absolute',
        right: 15,
        top: '40%',
        transform: [{ translateY: -10 }],
        padding: 5,
    },
    passwordOptions: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    rememberContainer: { 
        flexDirection: 'row', 
        alignItems: 'center',
        marginBottom: 5,
    },
    checkbox: { 
        borderWidth: 2, 
        borderColor: '#ccc', 
        borderRadius: 4, 
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: { 
        backgroundColor: '#61C35C', 
        borderColor: '#61C35C' 
    },
    rememberText: { 
        color: '#666' 
    },
    forgotText: { 
        color: '#007AFF', 
        fontWeight: '690',
        textAlign: 'right',
    },
    signInButton: { 
        backgroundColor: '#61C35C', 
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    signInButtonDisabled: { 
        backgroundColor: '#ccc' 
    },
    signInButtonText: { 
        color: '#fff', 
        fontWeight: 'bold' 
    }
});