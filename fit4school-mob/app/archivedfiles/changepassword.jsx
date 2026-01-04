import { StyleSheet, Text, View, TextInput, TouchableOpacity, Dimensions, ScrollView, Modal, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../../firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

export default function ChangePasswordScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    
    const [newPassword, setNewPassword] = useState('');
    const [reenterPassword, setReenterPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showReenterPassword, setShowReenterPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    
    
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [modalType, setModalType] = useState(''); 
    
    
    const [userData, setUserData] = useState(null);
    const [userId, setUserId] = useState('');

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const storedUserData = await AsyncStorage.getItem('userData');
            const storedUserId = await AsyncStorage.getItem('userId');
            
            if (storedUserData) {
                setUserData(JSON.parse(storedUserData));
            }
            if (storedUserId) {
                setUserId(storedUserId);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const handleBack = () => {
        navigation.goBack();
    };

    const validateForm = () => {
        const newErrors = {};

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

    const showModalPopup = (title, message, type) => {
        setModalTitle(title);
        setModalMessage(message);
        setModalType(type);
        setShowModal(true);
    };

    const handleConfirm = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const user = auth.currentUser;
            
            if (!user) {
                showModalPopup('Error', 'User not authenticated. Please sign in again.', 'error');
                setIsLoading(false);
                return;
            }

            
            await updatePassword(user, newPassword);
            
            
            if (userId) {
                const userRef = doc(db, 'accounts', userId);
                
                const updateData = {
                    isTemporaryPassword: false,
                    tempPassword: null,
                    passwordChanged: true,
                    lastPasswordChange: new Date().toISOString()
                };
                
                await updateDoc(userRef, updateData);
                
                
                const updatedUserData = {
                    ...userData,
                    ...updateData
                };
                
                await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
            }

            
            showModalPopup('Success', 'The password has been successfully changed.', 'success');

        } catch (error) {
            console.error('Error changing password:', error);
            
            let errorMessage = 'Failed to change password. Please try again.';
            
            if (error.code === 'auth/requires-recent-login') {
                errorMessage = 'Please sign in again to change your password.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Please choose a stronger password.';
            }
            
            showModalPopup('Error', errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
        if (modalType === 'success') {
            
            navigation.navigate('/dash_mod/home'); 
        }
    };

    const getBorderColor = (fieldName) => {
        if (errors[fieldName]) {
            return '#FF3B30'; 
        }
        if (fieldName === 'reenterPassword' && reenterPassword && newPassword === reenterPassword) {
            return '#61C35C'; 
        }
        if (fieldName === 'newPassword' && newPassword.length >= 6) {
            return '#61C35C'; 
        }
        return '#ddd'; 
    };

    const getValidationMessage = () => {
        if (newPassword && reenterPassword) {
            if (newPassword === reenterPassword) {
                return 'Passwords match';
            } else {
                return 'Passwords do not match';
            }
        }
        return '';
    };

    const getValidationColor = () => {
        if (newPassword && reenterPassword && newPassword === reenterPassword) {
            return '#61C35C'; 
        }
        if (newPassword && reenterPassword && newPassword !== reenterPassword) {
            return '#FF3B30'; 
        }
        return '#333'; 
    };

    return (
        <>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.container}>
                    {/* Header with back button */}
                    <View style={styles.headerContainer}>
                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                            <Ionicons name="arrow-back-outline" size={24} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Change Password</Text>
                    </View>
                    
                    {/* Instructions */}
                    <View style={styles.instructionContainer}>
                        <Text style={styles.instructionText}>
                            Create a new password to secure your account
                        </Text>
                    </View>

                    {/* New Password Input */}
                    <Text style={styles.label}>New Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={[styles.input, { borderColor: getBorderColor('newPassword') }]}
                            value={newPassword}
                            onChangeText={(text) => {
                                setNewPassword(text);
                                if (errors.newPassword) {
                                    setErrors(prev => ({...prev, newPassword: ''}));
                                }
                            }}
                            placeholder="Enter your new password"
                            secureTextEntry={!showNewPassword}
                            placeholderTextColor="#999"
                            editable={!isLoading}
                        />
                        <TouchableOpacity 
                            style={styles.eyeIcon}
                            onPress={() => setShowNewPassword(!showNewPassword)}
                            disabled={isLoading}
                        >
                            <Ionicons 
                                name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                                size={20} 
                                color="#666" 
                            />
                        </TouchableOpacity>
                    </View>
                    {errors.newPassword ? (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle-outline" size={14} color="#FF3B30" />
                            <Text style={styles.errorText}>{errors.newPassword}</Text>
                        </View>
                    ) : (
                        newPassword.length > 0 && newPassword.length < 6 && (
                            <View style={styles.warningContainer}>
                                <Ionicons name="information-circle-outline" size={14} color="#FF9500" />
                                <Text style={styles.warningText}>Password must be at least 6 characters</Text>
                            </View>
                        )
                    )}
                    
                    {newPassword.length >= 6 && (
                        <View style={styles.successContainer}>
                            <Ionicons name="checkmark-circle-outline" size={14} color="#61C35C" />
                            <Text style={styles.successText}>Password meets minimum length</Text>
                        </View>
                    )}

                    {/* Re-enter New Password Input */}
                    <Text style={styles.label}>Re-enter New Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={[styles.input, { borderColor: getBorderColor('reenterPassword') }]}
                            value={reenterPassword}
                            onChangeText={(text) => {
                                setReenterPassword(text);
                                if (errors.reenterPassword) {
                                    setErrors(prev => ({...prev, reenterPassword: ''}));
                                }
                            }}
                            placeholder="Re-enter your new password"
                            secureTextEntry={!showReenterPassword}
                            placeholderTextColor="#999"
                            editable={!isLoading}
                        />
                        <TouchableOpacity 
                            style={styles.eyeIcon}
                            onPress={() => setShowReenterPassword(!showReenterPassword)}
                            disabled={isLoading}
                        >
                            <Ionicons 
                                name={showReenterPassword ? "eye-off-outline" : "eye-outline"} 
                                size={20} 
                                color="#666" 
                            />
                        </TouchableOpacity>
                    </View>
                    {errors.reenterPassword ? (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle-outline" size={14} color="#FF3B30" />
                            <Text style={styles.errorText}>{errors.reenterPassword}</Text>
                        </View>
                    ) : null}
                    
                    {/* Password Match Validation */}
                    {getValidationMessage() && (
                        <View style={styles.validationContainer}>
                            <Ionicons 
                                name={newPassword === reenterPassword ? "checkmark-circle-outline" : "close-circle-outline"} 
                                size={14} 
                                color={getValidationColor()} 
                            />
                            <Text style={[styles.validationText, { color: getValidationColor() }]}>
                                {getValidationMessage()}
                            </Text>
                        </View>
                    )}

                    {/* Password Requirements */}
                    <View style={styles.requirementsContainer}>
                        <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                        <View style={styles.requirementItem}>
                            <Ionicons 
                                name={newPassword.length >= 6 ? "checkmark-circle" : "ellipse-outline"} 
                                size={14} 
                                color={newPassword.length >= 6 ? '#61C35C' : '#999'} 
                            />
                            <Text style={[styles.requirementText, { color: newPassword.length >= 6 ? '#61C35C' : '#999' }]}>
                                At least 6 characters
                            </Text>
                        </View>
                        <View style={styles.requirementItem}>
                            <Ionicons 
                                name={newPassword && reenterPassword && newPassword === reenterPassword ? "checkmark-circle" : "ellipse-outline"} 
                                size={14} 
                                color={newPassword && reenterPassword && newPassword === reenterPassword ? '#61C35C' : '#999'} 
                            />
                            <Text style={[styles.requirementText, { 
                                color: newPassword && reenterPassword && newPassword === reenterPassword ? '#61C35C' : '#999' 
                            }]}>
                                Passwords match
                            </Text>
                        </View>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    {/* Confirm Button */}
                    <TouchableOpacity 
                        style={[
                            styles.confirmButton, 
                            isLoading && styles.confirmButtonDisabled
                        ]} 
                        onPress={handleConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <Ionicons name="reload-outline" size={18} color="#fff" />
                                <Text style={styles.confirmButtonText}>UPDATING...</Text>
                            </View>
                        ) : (
                            <Text style={styles.confirmButtonText}>CONFIRM</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Success/Error Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showModal}
                onRequestClose={handleModalClose}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Ionicons 
                                name={modalType === 'success' ? "checkmark-circle" : "alert-circle"} 
                                size={50} 
                                color={modalType === 'success' ? '#61C35C' : '#FF3B30'} 
                            />
                            <Text style={styles.modalTitle}>{modalTitle}</Text>
                        </View>
                        
                        <View style={styles.modalBody}>
                            <Text style={styles.modalMessage}>{modalMessage}</Text>
                        </View>
                        
                        <View style={styles.modalFooter}>
                            <TouchableOpacity 
                                style={[styles.modalButton, { 
                                    backgroundColor: modalType === 'success' ? '#61C35C' : '#007AFF' 
                                }]}
                                onPress={handleModalClose}
                            >
                                <Text style={styles.modalButtonText}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const { width, height } = Dimensions.get('window');

const getResponsiveValue = (baseValue) => {
    const scaleFactor = width / 375; 
    return Math.round(baseValue * scaleFactor);
};

const getFontSize = (baseSize) => {
    const scaleFactor = width / 375;
    const scaledSize = baseSize * scaleFactor;
    
    const maxScale = 1.5;
    const minScale = 0.8;
    const finalSize = baseSize * Math.max(minScale, Math.min(scaleFactor, maxScale));
    
    return Math.round(finalSize);
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

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        backgroundColor: '#FFFBFB',
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFBFB',
        padding: getPadding(),
        paddingTop: getPadding() + 20,
        minHeight: height,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: getResponsiveValue(30),
    },
    backButton: {
        padding: 8,
        marginRight: 10,
    },
    title: {
        fontSize: getFontSize(28),
        fontWeight: 'bold',
        color: '#000',
    },
    instructionContainer: {
        backgroundColor: '#f0f9ff',
        padding: getResponsiveValue(15),
        borderRadius: getResponsiveValue(8),
        marginBottom: getResponsiveValue(25),
        borderLeftWidth: 4,
        borderLeftColor: '#61C35C',
    },
    instructionText: {
        fontSize: getFontSize(14),
        color: '#333',
        lineHeight: getFontSize(20),
    },
    label: {
        fontSize: getFontSize(16),
        fontWeight: '600',
        marginBottom: getResponsiveValue(10),
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: getResponsiveValue(8),
        padding: getResponsiveValue(12),
        paddingRight: getResponsiveValue(40),
        fontSize: getFontSize(16),
        backgroundColor: '#fff',
        flex: 1,
        height: getResponsiveValue(50),
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
        transform: [{ translateY: -10 }],
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: getResponsiveValue(15),
        marginTop: getResponsiveValue(5),
    },
    errorText: {
        color: '#FF3B30',
        fontSize: getFontSize(14),
        marginLeft: 6,
        fontWeight: '500',
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: getResponsiveValue(15),
        marginTop: getResponsiveValue(5),
    },
    warningText: {
        color: '#FF9500',
        fontSize: getFontSize(14),
        marginLeft: 6,
        fontWeight: '500',
    },
    successContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: getResponsiveValue(15),
        marginTop: getResponsiveValue(5),
    },
    successText: {
        color: '#61C35C',
        fontSize: getFontSize(14),
        marginLeft: 6,
        fontWeight: '500',
    },
    validationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: getResponsiveValue(15),
        marginTop: getResponsiveValue(5),
    },
    validationText: {
        fontSize: getFontSize(14),
        marginLeft: 6,
        fontWeight: '500',
    },
    requirementsContainer: {
        backgroundColor: '#f9f9f9',
        padding: getResponsiveValue(15),
        borderRadius: getResponsiveValue(8),
        marginTop: getResponsiveValue(10),
        marginBottom: getResponsiveValue(25),
    },
    requirementsTitle: {
        fontSize: getFontSize(14),
        fontWeight: '600',
        color: '#333',
        marginBottom: getResponsiveValue(10),
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: getResponsiveValue(8),
    },
    requirementText: {
        fontSize: getFontSize(13),
        marginLeft: getResponsiveValue(8),
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: getResponsiveValue(20),
    },
    confirmButton: {
        backgroundColor: '#61C35C',
        paddingVertical: getResponsiveValue(15),
        borderRadius: getResponsiveValue(8),
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
    confirmButtonDisabled: {
        backgroundColor: '#ccc',
        opacity: 0.7,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: getFontSize(16),
        fontWeight: 'bold',
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
        fontSize: getFontSize(22),
        fontWeight: '700',
        color: '#000',
        marginTop: 12,
        textAlign: 'center',
    },
    modalBody: {
        marginBottom: 24,
    },
    modalMessage: {
        fontSize: getFontSize(16),
        color: '#333',
        textAlign: 'center',
        lineHeight: getFontSize(22),
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
    modalButtonText: {
        color: 'white',
        fontSize: getFontSize(16),
        fontWeight: '600',
    },
});