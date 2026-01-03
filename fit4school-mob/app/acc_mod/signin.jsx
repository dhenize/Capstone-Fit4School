import { StyleSheet, View, TextInput, TouchableOpacity, Image, Alert, Dimensions, Platform, KeyboardAvoidingView, ScrollView, Modal } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../components/globalText";
import AsyncStorage from '@react-native-async-storage/async-storage';

import { auth, db } from "../../firebase"; 
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export default function SigninScreen() {  
    const router = useRouter();
    const [windowDimensions, setWindowDimensions] = useState(Dimensions.get('window'));

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [emailBorderColor, setEmailBorderColor] = useState('#ddd');
    const [passwordBorderColor, setPasswordBorderColor] = useState('#ddd');
    
    
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [modalType, setModalType] = useState(''); 
    const [userFullName, setUserFullName] = useState('');

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setWindowDimensions(window);
        });
        return () => subscription?.remove();
    }, []);

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            setEmailError('Email is required');
            setEmailBorderColor('#FF3B30');
            return false;
        }
        if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email address');
            setEmailBorderColor('#FF3B30');
            return false;
        }
        setEmailError('');
        setEmailBorderColor('#ddd');
        return true;
    };

    
    const validatePassword = (password) => {
        if (!password) {
            setPasswordError('Password is required');
            setPasswordBorderColor('#FF3B30');
            return false;
        }
        if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            setPasswordBorderColor('#FF3B30');
            return false;
        }
        setPasswordError('');
        setPasswordBorderColor('#ddd');
        return true;
    };

    const handleEmailChange = (text) => {
        setEmail(text);
        if (emailError) {
            validateEmail(text);
        }
    };

    const handlePasswordChange = (text) => {
        setPassword(text);
        if (passwordError) {
            validatePassword(text);
        }
    };

    
    const checkIfTemporaryPassword = (userData, currentPassword) => {
        
        
        if (userData.isTemporaryPassword === true) {
            return true;
        }
        
        
        if (userData.tempPassword && userData.tempPassword === currentPassword) {
            return true;
        }
        
        
        if (userData.passwordChanged === false) {
            return true;
        }
        
        
        const tempPasswordPatterns = [
            /^temp/i,
            /^welcome/i,
            /^123456/,
            /^password/i,
            /^changeme/i,
            /^default/i
        ];
        
        for (const pattern of tempPasswordPatterns) {
            if (pattern.test(currentPassword)) {
                return true;
            }
        }
        
        
        if (!userData.lastPasswordChange) {
            return true;
        }
        
        
        if (userData.createdAt) {
            const createdAt = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt);
            const now = new Date();
            const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
            
            if (hoursSinceCreation < 24 && !userData.passwordChanged) {
                return true;
            }
        }
        
        return false;
    };

    const showSuccessModal = (type, fullName) => {
        setUserFullName(fullName);
        setModalType(type);
        
        if (type === 'changePassword') {
            setModalTitle('Success Log in!');
            setModalMessage(`Welcome, ${fullName}! Kindly change your temporary password to secure your account by clicking this button.`);
        } else {
            setModalTitle('Success Log in!');
            setModalMessage(`Welcome back, ${fullName}!`);
        }
        
        setShowModal(true);
    };

    const handleChangePassword = () => {
        setShowModal(false);
        router.push('/acc_mod/changepass');
    };

    const handleModalClose = () => {
        setShowModal(false);
        router.replace("/dash_mod/home");
    };

    const handleSignIn = async () => {
       
        setEmailError('');
        setPasswordError('');
        setEmailBorderColor('#ddd');
        setPasswordBorderColor('#ddd');

        
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        setIsLoading(true);

        try {
            console.log("Attempting to sign in with:", email);
            
            
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const uid = user.uid;

            console.log("Firebase Auth successful, UID:", uid);
            
            
            await AsyncStorage.setItem("auth", uid);

            
            const accountRef = doc(db, "accounts", uid);
            const accountSnap = await getDoc(accountRef);

            console.log("Account exists:", accountSnap.exists());
            
            if (!accountSnap.exists()) {
               
                console.log("Trying to find user by email...");
                const accountsRef = collection(db, "accounts");
                const q = query(accountsRef, where("email", "==", email));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0];
                    const userData = userDoc.data();
                    console.log("Found user in accounts:", userData);
                    
                    
                    const hasTempPassword = checkIfTemporaryPassword(userData, password);
                    const fullName = userData.parent_fullname || userData.fname || 'User';
                    
                    
                    await AsyncStorage.setItem("userData", JSON.stringify(userData));
                    await AsyncStorage.setItem("userId", userDoc.id);

                   
                    if (hasTempPassword) {
                        showSuccessModal('changePassword', fullName);
                    } else {
                        showSuccessModal('welcomeBack', fullName);
                    }
                } else {
                    
                    setEmailError('Account not found. Please check your email or contact support.');
                    setEmailBorderColor('#FF3B30');
                    await signOut(auth);
                }
                return;
            }

            
            const userData = accountSnap.data();
            console.log("User data from accounts:", userData);
            
            
            const hasTempPassword = checkIfTemporaryPassword(userData, password);
            const fullName = userData.parent_fullname || userData.fname || 'User';
            
            
            await AsyncStorage.setItem("userData", JSON.stringify(userData));
            await AsyncStorage.setItem("userId", uid);

            
            if (hasTempPassword) {
                showSuccessModal('changePassword', fullName);
            } else {
                showSuccessModal('welcomeBack', fullName);
            }

        } catch (error) {
            console.log("Login error details:", error);
            
           
            if (error.code === 'auth/user-not-found') {
                setEmailError('No account found with this email');
                setEmailBorderColor('#FF3B30');
            } else if (error.code === 'auth/wrong-password') {
                setPasswordError('Incorrect password. Please try again');
                setPasswordBorderColor('#FF3B30');
            } else if (error.code === 'auth/too-many-requests') {
                setPasswordError('Too many failed attempts. Please try again later');
                setPasswordBorderColor('#FF9500'); 
            } else if (error.code === 'auth/invalid-email') {
                setEmailError('Invalid email format');
                setEmailBorderColor('#FF3B30');
            } else if (error.code === 'auth/network-request-failed') {
                setEmailError('Network error. Please check your connection');
                setEmailBorderColor('#FF9500');
            } else {
                
                setEmailError('Invalid email or password');
                setEmailBorderColor('#FF3B30');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = () => {
        router.push('/acc_mod/forgotpassword');
    };

    const scaleWidth = (value) => {
        const { width } = windowDimensions;
        const guidelineBaseWidth = 390;
        return (value / guidelineBaseWidth) * width;
    };

    const scaleFont = (size) => {
        const { width } = windowDimensions;
        const guidelineBaseWidth = 390;
        const scaleFactor = width / guidelineBaseWidth;
        
        const maxScale = 1.5;
        const minScale = 0.8;
        const scaledSize = size * Math.max(minScale, Math.min(scaleFactor, maxScale));
        
        return Math.round(scaledSize);
    };

    const scalePadding = () => {
        const { width } = windowDimensions;
        if (width < 375) return '5%'; 
        if (width < 768) return '8%'; 
        if (width < 1024) return '10%'; 
        if (width < 1440) return '15%'; 
        return '20%'; 
    };

    const getContainerPadding = scalePadding();

    return (
        <>
            <KeyboardAvoidingView 
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
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
                            {/* Email Input */}
                            <Text style={[styles.label, { fontSize: scaleFont(16) }]}>Email</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={[styles.input, { 
                                        fontSize: scaleFont(16),
                                        paddingHorizontal: scaleWidth(12),
                                        paddingVertical: scaleWidth(12),
                                        height: scaleWidth(50),
                                        borderColor: emailBorderColor,
                                    }]}
                                    value={email}
                                    onChangeText={handleEmailChange}
                                    placeholder="Enter your email"
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    placeholderTextColor="#999"
                                    editable={!isLoading}
                                    onBlur={() => validateEmail(email)}
                                />
                            </View>
                            {emailError ? (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="alert-circle-outline" size={scaleFont(14)} color="#FF3B30" />
                                    <Text style={[styles.errorText, { fontSize: scaleFont(14) }]}>{emailError}</Text>
                                </View>
                            ) : null}
                            
                            {/* Password Input */}
                            <Text style={[styles.label, { fontSize: scaleFont(16) }]}>Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[styles.input, styles.passwordInput, { 
                                        fontSize: scaleFont(16),
                                        paddingHorizontal: scaleWidth(12),
                                        paddingVertical: scaleWidth(12),
                                        height: scaleWidth(50),
                                        borderColor: passwordBorderColor,
                                    }]}
                                    value={password}
                                    onChangeText={handlePasswordChange}
                                    placeholder="Enter your password"
                                    secureTextEntry={!showPassword}
                                    placeholderTextColor="#999"
                                    editable={!isLoading}
                                    onBlur={() => validatePassword(password)}
                                />
                                <TouchableOpacity 
                                    style={styles.eyeIcon}
                                    onPress={toggleShowPassword}
                                    disabled={isLoading}
                                >
                                    <Ionicons 
                                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                        size={scaleFont(20)} 
                                        color="#666" 
                                    />
                                </TouchableOpacity>
                            </View>
                            {passwordError ? (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="alert-circle-outline" size={scaleFont(14)} color="#FF3B30" />
                                    <Text style={[styles.errorText, { fontSize: scaleFont(14) }]}>{passwordError}</Text>
                                </View>
                            ) : null}
                            
                            {/* Forgot Password Link */}
                            <View style={[styles.forgotPasswordContainer, { marginBottom: scaleWidth(20) }]}>
                                <TouchableOpacity 
                                    onPress={handleForgotPassword}
                                    disabled={isLoading}
                                >
                                    <Text style={[styles.forgotText, { fontSize: scaleFont(14) }]}>
                                        Forgot password?
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            
                            {/* Sign In Button */}
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
                                {isLoading ? (
                                    <View style={styles.loadingContainer}>
                                        <Ionicons name="reload-outline" size={scaleFont(18)} color="#fff" />
                                        <Text style={[styles.signInButtonText, { fontSize: scaleFont(16), marginLeft: 10 }]}>
                                            SIGNING IN...
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={[styles.signInButtonText, { fontSize: scaleFont(16) }]}>
                                        SIGN IN
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {/* Additional responsive spacing for larger screens */}
                            {windowDimensions.width >= 768 && (
                                <View style={{ height: scaleWidth(40) }} />
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Success Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showModal}
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Ionicons name="checkmark-circle" size={scaleFont(50)} color="#61C35C" />
                            <Text style={[styles.modalTitle, { fontSize: scaleFont(22) }]}>{modalTitle}</Text>
                        </View>
                        
                        <View style={styles.modalBody}>
                            <Text style={[styles.modalMessage, { fontSize: scaleFont(16) }]}>{modalMessage}</Text>
                        </View>
                        
                        <View style={styles.modalFooter}>
                            {modalType === 'changePassword' ? (
                                <TouchableOpacity 
                                    style={[styles.modalButton, styles.changePasswordButton]}
                                    onPress={handleChangePassword}
                                >
                                    <Text style={[styles.modalButtonText, { fontSize: scaleFont(16) }]}>Change Password</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity 
                                    style={[styles.modalButton, styles.okButton]}
                                    onPress={handleModalClose}
                                >
                                    <Text style={[styles.modalButtonText, { fontSize: scaleFont(16) }]}>OK</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#FFFBFB'
    },
    scrollContainer: {
        flexGrow: 1,
    },
    contentContainer: {
        flex: 1,
        paddingVertical: '5%',
    },
    headerContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: '10%',
        marginBottom: '10%'
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
        fontWeight: '600', 
        marginBottom: 8,
        color: '#333'
    },
    inputWrapper: {
        marginBottom: 4,
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
        marginBottom: 4,
    },
    passwordInput: {
        paddingRight: 50, 
    },
    eyeIcon: {
        position: 'absolute',
        right: 15,
        top: '50%',
        transform: [{ translateY: -10 }],
        padding: 5,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 4,
    },
    errorText: {
        color: '#FF3B30',
        marginLeft: 6,
        fontWeight: '500',
    },
    forgotPasswordContainer: { 
        flexDirection: 'row', 
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 8,
    },
    forgotText: { 
        color: '#007AFF', 
        fontWeight: '600',
        textAlign: 'right',
    },
    signInButton: { 
        backgroundColor: '#61C35C', 
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        marginTop: 8,
    },
    signInButtonDisabled: { 
        backgroundColor: '#ccc',
        opacity: 0.7 
    },
    signInButtonText: { 
        color: '#fff', 
        fontWeight: 'bold' 
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontWeight: '700',
        color: '#000',
        marginTop: 12,
        textAlign: 'center',
    },
    modalBody: {
        marginBottom: 24,
    },
    modalMessage: {
        color: '#333',
        textAlign: 'center',
        lineHeight: 22,
    },
    modalFooter: {
        width: '100%',
    },
    modalButton: {
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    changePasswordButton: {
        backgroundColor: '#007AFF',
    },
    okButton: {
        backgroundColor: '#61C35C',
    },
    modalButtonText: {
        color: 'white',
        fontWeight: '600',
    },
});