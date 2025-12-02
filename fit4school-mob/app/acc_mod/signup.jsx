// app/acc_mod/signup.jsx
import { StyleSheet, View, TextInput, TouchableOpacity, Alert, Dimensions, Platform } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../components/globalText";
import { AuthService } from "../../services/authService";

export default function SignupScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const { width } = Dimensions.get('window');

    const getResponsiveValue = (baseValue) => {
        const scaleFactor = width / 375; // Base on iPhone 6/7/8 (375px)
        return baseValue * Math.min(scaleFactor, 1.5); // Limit scaling
    };

    const getFontSize = (baseSize) => {
        if (width <= 320) return baseSize * 0.85; // Mobile Small
        if (width <= 375) return baseSize * 0.95; // Mobile Medium
        if (width <= 425) return baseSize; // Mobile Large
        if (width <= 768) return baseSize * 1.1; // Tablet
        if (width <= 1024) return baseSize * 1.2; // Laptop
        if (width <= 1440) return baseSize * 1.3; // Laptop Large
        if (width <= 2560) return baseSize * 1.5; // 4K
        return baseSize * 1.3; // Default for larger screens
    };

    const getSpacing = (baseSpacing) => {
        if (width <= 320) return baseSpacing * 0.8;
        if (width <= 425) return baseSpacing;
        if (width <= 768) return baseSpacing * 1.2;
        if (width <= 1024) return baseSpacing * 1.5;
        if (width <= 1440) return baseSpacing * 1.8;
        if (width <= 2560) return baseSpacing * 2.5;
        return baseSpacing * 2;
    };

    const getPadding = (basePadding) => {
        if (width <= 320) return basePadding * 0.7;
        if (width <= 425) return basePadding;
        if (width <= 768) return basePadding * 1.3;
        return basePadding * (width <= 1024 ? 1.5 : width <= 1440 ? 1.8 : 2.2);
    };

    const handleSignup = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            console.log('📧 Signing up with email:', email);
            
            const signupResult = await AuthService.signUp(email, password);
            
            if (!signupResult.success) {
                Alert.alert('Signup Error', signupResult.error);
                return;
            }

            console.log('✅ Account created in "accounts" collection');
            
            Alert.alert(
                'Verification Email Sent', 
                'We have sent a verification link to your email. Please verify your email to continue.',
                [{ text: 'OK' }]
            );

            router.push({
                pathname: '/acc_mod/signupotp2',
                params: { 
                    email: email, 
                    user_id: signupResult.user.uid 
                }
            });

        } catch (error) {
            console.log('❌ Signup error:', error);
            Alert.alert('Error', 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[
            styles.container,
            { paddingHorizontal: getPadding(Platform.OS === 'web' ? '5%' : 9) }
        ]}>
            <View style={[
                styles.headerContainer,
                { 
                    paddingVertical: getSpacing(Platform.OS === 'web' ? 16 : 8),
                    marginBottom: getSpacing(Platform.OS === 'web' ? 40 : 25)
                }
            ]}>
                <TouchableOpacity 
                    onPress={() => router.back()} 
                    disabled={loading}
                    style={styles.backButton}
                >
                    <Ionicons 
                        name="arrow-back-outline" 
                        size={getResponsiveValue(28)} 
                        color="black" 
                    />
                </TouchableOpacity>
                <Text style={[
                    styles.title,
                    { fontSize: getFontSize(26) }
                ]}>
                    Sign up
                </Text>
            </View>

            <View style={[
                styles.formContainer,
                { 
                    paddingVertical: getSpacing(Platform.OS === 'web' ? width <= 768 ? '15%' : '20%' : '25%'),
                    gap: getSpacing(20)
                }
            ]}>
                <View>
                    <Text style={[
                        styles.label,
                        { 
                            fontSize: getFontSize(16),
                            marginBottom: getSpacing(8)
                        }
                    ]}>
                        Email
                    </Text>
                    <TextInput
                        style={[
                            styles.input,
                            { 
                                fontSize: getFontSize(16),
                                padding: getSpacing(12),
                                marginBottom: getSpacing(Platform.OS === 'web' ? 16 : 20),
                                borderRadius: getResponsiveValue(8)
                            }
                        ]}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!loading}
                        placeholderTextColor="#888"
                    />
                </View>

                <View>
                    <Text style={[
                        styles.label,
                        { 
                            fontSize: getFontSize(16),
                            marginBottom: getSpacing(8)
                        }
                    ]}>
                        Create Password
                    </Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={[
                                styles.passwordInput,
                                { 
                                    fontSize: getFontSize(16),
                                    padding: getSpacing(12),
                                    paddingRight: getSpacing(50),
                                    borderRadius: getResponsiveValue(8)
                                }
                            ]}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter your password"
                            secureTextEntry={!showPassword}
                            editable={!loading}
                            placeholderTextColor="#888"
                        />
                        <TouchableOpacity
                            style={[
                                styles.eyeButton,
                                { 
                                    right: getSpacing(12),
                                    padding: getSpacing(4)
                                }
                            ]}
                            onPress={() => setShowPassword(!showPassword)}
                            disabled={loading}
                        >
                            <Ionicons 
                                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                size={getResponsiveValue(24)} 
                                color="#666" 
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity 
                    style={[
                        styles.signInButton, 
                        loading && styles.disabledButton,
                        { 
                            paddingVertical: getSpacing(Platform.OS === 'web' ? 14 : 10),
                            borderRadius: getResponsiveValue(8),
                            marginVertical: getSpacing(Platform.OS === 'web' ? '3%' : '5%')
                        }
                    ]} 
                    onPress={handleSignup}
                    disabled={loading}
                >
                    <Text style={[
                        styles.signInButtonText,
                        { fontSize: getFontSize(19) }
                    ]}>
                        {loading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFBFB',
        paddingTop: Platform.OS === 'web' ? '3%' : '9%',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontWeight: 'bold',
        color: 'black',
        marginLeft: 10,
    },
    formContainer: {
        flex: 1,
    },
    label: {
        fontWeight: '60',
        color: '#000',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: '#f9f9f9',
    },
    passwordContainer: {
        position: 'relative',
    },
    passwordInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: '#f9f9f9',
    },
    eyeButton: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        justifyContent: 'center',
    },
    signInButton: {
        backgroundColor: '#61C35C',
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#cccccc',
    },
    signInButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});