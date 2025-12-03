import { StyleSheet, Text, View, TextInput, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function ChangePasswordScreen() {
    const navigation = useNavigation();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [reenterPassword, setReenterPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showReenterPassword, setShowReenterPassword] = useState(false);
    const [errors, setErrors] = useState({});

    const handleBack = () => {
        navigation.goBack();
    };

    const validateForm = () => {
        const newErrors = {};

        if (!currentPassword.trim()) {
            newErrors.currentPassword = 'Current password is required';
        }

        if (!newPassword.trim()) {
            newErrors.newPassword = 'New password is required';
        } else if (newPassword.length < 6) {
            newErrors.newPassword = 'Password must be at least 6 characters';
        }

        if (!reenterPassword.trim()) {
            newErrors.reenterPassword = 'Please re-enter your new password';
        } else if (newPassword !== reenterPassword) {
            newErrors.reenterPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleConfirm = () => {
        if (validateForm()) {
            alert('Password changed successfully!');
            
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color="#000" />
                    <Text style={styles.title}>Change Password</Text>
                </TouchableOpacity>
                
                <Text style={styles.label}>Current Password</Text>
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={[styles.input, errors.currentPassword && styles.inputError]}
                        value={currentPassword}
                        onChangeText={(text) => {
                            setCurrentPassword(text);
                            if (errors.currentPassword) {
                                setErrors(prev => ({...prev, currentPassword: ''}));
                            }
                        }}
                        placeholder="Enter your current password"
                        secureTextEntry={!showCurrentPassword}
                    />
                    <TouchableOpacity 
                        style={styles.eyeIcon}
                        onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                        <Icon 
                            name={showCurrentPassword ? "eye-slash" : "eye"} 
                            size={20} 
                            color="#666" 
                        />
                    </TouchableOpacity>
                </View>
                {errors.currentPassword && <Text style={styles.errorText}>{errors.currentPassword}</Text>}

                <Text style={styles.label}>New Password</Text>
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={[styles.input, errors.newPassword && styles.inputError]}
                        value={newPassword}
                        onChangeText={(text) => {
                            setNewPassword(text);
                            if (errors.newPassword) {
                                setErrors(prev => ({...prev, newPassword: ''}));
                            }
                            if (errors.reenterPassword && text === reenterPassword) {
                                setErrors(prev => ({...prev, reenterPassword: ''}));
                            }
                        }}
                        placeholder="Enter your new password"
                        secureTextEntry={!showNewPassword}
                    />
                    <TouchableOpacity 
                        style={styles.eyeIcon}
                        onPress={() => setShowNewPassword(!showNewPassword)}
                    >
                        <Icon 
                            name={showNewPassword ? "eye-slash" : "eye"} 
                            size={20} 
                            color="#666" 
                        />
                    </TouchableOpacity>
                </View>
                {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}

                <Text style={styles.label}>Re-enter New Password</Text>
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={[styles.input, errors.reenterPassword && styles.inputError]}
                        value={reenterPassword}
                        onChangeText={(text) => {
                            setReenterPassword(text);
                            if (errors.reenterPassword) {
                                setErrors(prev => ({...prev, reenterPassword: ''}));
                            }
                        }}
                        placeholder="Re-enter your new password"
                        secureTextEntry={!showReenterPassword}
                    />
                    <TouchableOpacity 
                        style={styles.eyeIcon}
                        onPress={() => setShowReenterPassword(!showReenterPassword)}
                    >
                        <Icon 
                            name={showReenterPassword ? "eye-slash" : "eye"} 
                            size={20} 
                            color="#666" 
                        />
                    </TouchableOpacity>
                </View>
                {errors.reenterPassword && <Text style={styles.errorText}>{errors.reenterPassword}</Text>}

                <View style={styles.divider} />
                
                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                    <Text style={styles.confirmButtonText}>CONFIRM</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}


const { width, height } = Dimensions.get('window');

const getResponsiveValue = (baseValue) => {
    const scaleFactor = width / 375; 
    return baseValue * scaleFactor;
};

const getFontSize = (baseSize) => {
    if (width >= 2560) return baseSize * 2; 
    if (width >= 1440) return baseSize * 1.5; 
    if (width >= 1024) return baseSize * 1.3; 
    if (width >= 768) return baseSize * 1.2; 
    if (width >= 425) return baseSize * 1.1; 
    if (width >= 375) return baseSize; 
    return baseSize * 0.9; 
};

const getPadding = () => {
    if (width >= 2560) return 60;
    if (width >= 1440) return 50;
    if (width >= 1024) return 40;
    if (width >= 768) return 35;
    if (width >= 425) return 30;
    if (width >= 375) return 25;
    return 20;
};

const getMarginBottom = () => {
    if (width >= 2560) return 100;
    if (width >= 1440) return 85;
    if (width >= 1024) return 70;
    if (width >= 768) return 60;
    if (width >= 425) return 50;
    if (width >= 375) return 40;
    return 30;
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFBFB',
        padding: getPadding(),
        paddingTop: Math.max(getPadding() + 20, 50),
        minHeight: height,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: getMarginBottom(),
    },
    title: {
        fontSize: getFontSize(28),
        fontWeight: 'bold',
        marginLeft: getResponsiveValue(15),
        color: '#000',
        fontFamily: 'System',
    },
    label: {
        fontSize: getFontSize(16),
        fontWeight: '600',
        marginBottom: getResponsiveValue(15),
        color: '#000',
        fontFamily: 'System',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: getResponsiveValue(8),
        padding: getResponsiveValue(12),
        paddingRight: getResponsiveValue(40),
        fontSize: getFontSize(16),
        fontFamily: 'System',
        backgroundColor: '#f9f9f9',
        flex: 1,
    },
    inputError: {
        borderColor: '#FF6B6B',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: getResponsiveValue(5),
    },
    eyeIcon: {
        position: 'absolute',
        right: getResponsiveValue(12),
        padding: getResponsiveValue(8),
    },
    errorText: {
        color: '#FF6B6B',
        fontSize: getFontSize(12),
        marginBottom: getResponsiveValue(15),
        fontFamily: 'System',
    },
    divider: {
        height: 1,
        backgroundColor: '#ccc',
        marginVertical: getResponsiveValue(20),
    },
    confirmButton: {
        backgroundColor: '#61C35C',
        paddingVertical: getResponsiveValue(15),
        borderRadius: getResponsiveValue(8),
        alignItems: 'center',
        marginBottom: getResponsiveValue(20),
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: getFontSize(16),
        fontWeight: 'bold',
        fontFamily: 'System',
    },
});