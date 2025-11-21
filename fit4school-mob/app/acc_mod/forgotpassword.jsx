import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function ChangePasswordScreen() {
    const [newPassword, setNewPassword] = useState('');
    const [reenterPassword, setReenterPassword] = useState('');
    const router = useRouter();

    const handleConfirm = () => {
        if (!newPassword || !reenterPassword) {
            alert('Please fill in all fields.');
        } else if (newPassword !== reenterPassword) {
            alert('New password and re-entered password do not match.');
        } else {
            alert('Password changed successfully!');
            router.push('/acc_mod/landing');
        }
    };

    return (
        <View style={styles.container}>
            {/* Header with back button */}
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back-outline" size={28} color="black" />
                </TouchableOpacity>
                <Text style={styles.header}>Forgot Password</Text>
            </View>

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
        padding: 30,
        paddingTop: 50,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 85,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'black',
        fontFamily: 'System',
        marginLeft: 10,
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