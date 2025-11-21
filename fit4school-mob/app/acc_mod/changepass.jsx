import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';

export default function ChangePasswordScreen() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [reenterPassword, setReenterPassword] = useState('');

    const handleConfirm = () => {
        if (!currentPassword || !newPassword || !reenterPassword) {
            alert('Please fill in all fields.');
        } else if (newPassword !== reenterPassword) {
            alert('New password and re-entered password do not match.');
        } else {
            alert('Password changed successfully!');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>← Change Password</Text>
            
            <Text style={styles.label}>Current Password</Text>
            <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter your current password"
                secureTextEntry
            />

            <Text style={styles.label}>New Password</Text>
            <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter your new password"
                secureTextEntry
            />

            <Text style={styles.label}>Re-enter Password</Text>
            <TextInput
                style={styles.input}
                value={reenterPassword}
                onChangeText={setReenterPassword}
                placeholder="Re-enter your new password"
                secureTextEntry
            />

            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.confirmButtonText}>CONFIRM</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFBFB',
        padding: 40,
        paddingTop: 50,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 85,
        color: '#000',
        fontFamily: 'System',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 15,
        color: '#000',
        fontFamily: 'System',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        fontSize: 16,
        fontFamily: 'System',
        backgroundColor: '#f9f9f9',
        
    },
    divider: {
        height: 1,
        backgroundColor: '#ccc',
        marginVertical: 20,
    },
    confirmButton: {
        backgroundColor: '#61C35C',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'System',
    },
});
