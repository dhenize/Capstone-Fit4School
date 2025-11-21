// app/acc_mod/signup.jsx
import { StyleSheet, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../components/globalText";
import { AuthService } from "../../services/authService";

export default function SignupScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

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
            console.log(' Signup error:', error);
            Alert.alert('Error', 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: '2%' }}>
                <TouchableOpacity onPress={() => router.back()} disabled={loading}>
                    <Ionicons name="arrow-back-outline" size={28} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Sign up</Text>
            </View>

            <View style={{ paddingVertical: '25%' }}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                />

                <Text style={styles.label}>Create Password</Text>
                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    secureTextEntry
                    editable={!loading}
                />

                <TouchableOpacity 
                    style={[styles.signInButton, loading && styles.disabledButton]} 
                    onPress={handleSignup}
                    disabled={loading}
                >
                    <Text style={styles.signInButtonText}>
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
        padding: '9%',
    },
    title: {
        fontSize: 26,
        fontWeight: '600',
        color: '#000',
        marginLeft: 10,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#000',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    signInButton: {
        backgroundColor: '#61C35C',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: '5%'
    },
    disabledButton: {
        backgroundColor: '#cccccc',
    },
    signInButtonText: {
        color: 'white',
        fontSize: 19,
        fontWeight: '600',
    },
});