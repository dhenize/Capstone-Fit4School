import { StyleSheet, View, TouchableOpacity, Image, Dimensions, Modal, TextInput, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Text } from "../../components/globalText"; 
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window"); 

export default function LoginScreen() {
    const router = useRouter();
    const [lastUser, setLastUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        loadLastUser();
    }, []);

    const loadLastUser = async () => {
        try {
            const userData = await AsyncStorage.getItem('lastUser');
            if (userData) {
                const user = JSON.parse(userData);
                setLastUser(user);
            }
        } catch (error) {
            console.log('Error loading last user:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleContinueWithUser = () => {
        if (lastUser) {
            setShowPasswordModal(true);
        } else {
            router.push('/acc_mod/signin');
        }
    };

    const verifyPassword = async () => {
        if (!password) {
            Alert.alert('Error', 'Please enter your password');
            return;
        }

        setIsVerifying(true);

        try {
            const BASE_URL = 'http://192.168.1.50:3000';
            
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: lastUser.email,
                    password: password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Success', `Welcome back, ${lastUser.fname}!`);
                setShowPasswordModal(false);
                setPassword('');
                router.push('/dash_mod/home');
            } else {
                Alert.alert('Error', data.message || 'Invalid password');
            }
        } catch (error) {
            console.log('❌ Password verification error:', error);
            Alert.alert('Error', 'Network error. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSignIn = () => {
        router.push('/acc_mod/signin');
    };

    const handleSignUp = () => {
        router.push('/acc_mod/signup');
    };

    const closePasswordModal = () => {
        setShowPasswordModal(false);
        setPassword('');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.welcomeText}>WELCOME TO</Text>
            <Text style={styles.titleText}>FIT4SCHOOL</Text>

            <View style={styles.login_pic}>
                <Image 
                    source={require("../../assets/images/login.png")} 
                    style={styles.image}
                    resizeMode="contain"
                />
            </View>

            {lastUser && (
                <TouchableOpacity 
                    style={styles.continueButton}
                    onPress={handleContinueWithUser}
                >
                    <Text style={styles.continueButtonText}>
                        Continue with {lastUser.fname}
                    </Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity 
                style={styles.signUpButton}
                onPress={handleSignUp}
            >
                <Text style={styles.buttonText}>SIGN UP</Text>
            </TouchableOpacity>
            
            <View style={styles.footer}>
                <Text style={styles.stonText}>Already have an account?</Text>
                <TouchableOpacity onPress={handleSignIn}>
                    <Text style={styles.upText}>Sign in</Text>
                </TouchableOpacity>
            </View>

            <Modal
                visible={showPasswordModal}
                transparent={true}
                animationType="slide"
                onRequestClose={closePasswordModal}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Enter Password</Text>
                            <TouchableOpacity onPress={closePasswordModal}>
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                        
                        <Text style={styles.modalSubtitle}>
                            Please enter your password to continue as {lastUser?.fname}
                        </Text>
                        
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Enter your password"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            autoFocus
                        />
                        
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={styles.cancelButton}
                                onPress={closePasswordModal}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.verifyButton, isVerifying && styles.verifyButtonDisabled]}
                                onPress={verifyPassword}
                                disabled={isVerifying}
                            >
                                <Text style={styles.verifyButtonText}>
                                    {isVerifying ? 'VERIFYING...' : 'CONTINUE'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFBFB',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    welcomeText: {
        color: 'black',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: -9,
        top: 30,
    },
    titleText: {
        color: 'black',
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 20,
        top: 30,
    },
    login_pic: {
        alignItems: 'center',   
        justifyContent: 'center', 
        marginVertical: 60,
    },
    image: {
        width: width * 0.9,  
        height: width * 0.7, 
    },
    continueButton: {
        backgroundColor: '#0FAFFF',
        paddingVertical: 14,
        borderRadius: 10,
        width: width * 0.85, 
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    signUpButton: {
        backgroundColor: '#61C35C',
        paddingVertical: 14,
        borderRadius: 10,
        width: width * 0.85,
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        marginTop: 10,
        alignItems: 'center',
    },
    stonText: {
        color: 'black',
        marginRight: 5,
        fontSize: 14,
    },
    upText: {
        color: '#007AFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        width: '90%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
        lineHeight: 22,
    },
    passwordInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    cancelButtonText: {
        color: '#6c757d',
        fontSize: 16,
        fontWeight: '600',
    },
    verifyButton: {
        flex: 1,
        backgroundColor: '#61C35C',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    verifyButtonDisabled: {
        backgroundColor: '#cccccc',
    },
    verifyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});