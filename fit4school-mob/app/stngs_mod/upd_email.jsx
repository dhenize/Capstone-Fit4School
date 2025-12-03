import { View, StyleSheet, TouchableOpacity, TextInput, Dimensions, Alert, ActivityIndicator, Platform } from "react-native";
import React, { useState } from "react";
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";

export default function upd_email() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    
    const { width, height } = Dimensions.get("window");
    
   
    const scaleFont = (size) => {
        const scale = width / 375; 
        const newSize = size * scale;
        return Math.max(size * 0.8, Math.min(newSize, size * 1.2));
    };

    const scaleSize = (size) => {
        const scale = width / 375;
        return size * scale;
    };

    
    const sendVerificationToNewEmail = async (newEmail) => {
        try {
            
            const verificationToken = Math.random().toString(36).substring(2) + 
                                     Math.random().toString(36).substring(2);
            
            
            const verificationLink = `https://yourapp.com/verify-email?token=${verificationToken}&email=${encodeURIComponent(newEmail)}`;
            
            
            console.log("Sending verification email to NEW address:", newEmail);
            console.log("Verification link:", verificationLink);
           
            
            return true;
        } catch (error) {
            console.error("Error sending verification email:", error);
            throw error;
        }
    };

    const handleUpdateEmail = async () => {
        
        if (!email) {
            Alert.alert("Error", "Please enter your email address");
            return;
        }

       
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert("Error", "Please enter a valid email address");
            return;
        }

        setIsLoading(true);

        try {
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            
            const emailSent = await sendVerificationToNewEmail(email);
            
            if (emailSent) {
                
                Alert.alert(
                    "Verification Required",
                    `A verification email has been sent to: ${email}\n\nPlease check your inbox at this NEW email address and click the verification link to complete the update.`,
                    [
                        {
                            text: "OK",
                            onPress: () => {
                                setIsSuccess(true);
                                setIsLoading(false);
                                
                                setTimeout(() => {
                                    router.push("/stngs_mod/settings");
                                }, 2000);
                            }
                        }
                    ]
                );
            }
        } catch (error) {
            Alert.alert("Error", "Failed to send verification email. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#FFFBFB" }}>
            <Stack.Screen
                options={{
                    animation: "slide_from_right",
                    headerShown: false,
                }}
            />

            {/* Title Box */}
            <View style={[
                styles.titlebox,
                {
                    paddingHorizontal: scaleSize(20),
                    paddingVertical: scaleSize(25),
                    top: Platform.OS === 'web' ? 0 : 20,
                }
            ]}>
                <TouchableOpacity 
                    onPress={() => router.push("/stngs_mod/settings")}
                    style={{ marginRight: scaleSize(10) }}
                >
                    <Ionicons
                        name="arrow-back-outline"
                        size={scaleSize(26)}
                        color="black"
                    />
                </TouchableOpacity>
                <Text style={[
                    styles.title,
                    { fontSize: scaleFont(24) }
                ]}>
                    Update Email
                </Text>
            </View>

            <View style={[
                styles.container,
                {
                    paddingHorizontal: width > 768 ? '20%' : '10%',
                    paddingTop: scaleSize(40),
                }
            ]}>
                <View style={{ paddingVertical: height * 0.05 }}>
                    <Text style={[
                        styles.txtlabel,
                        { fontSize: scaleFont(16), marginBottom: scaleSize(8) }
                    ]}>
                        New Email Address
                    </Text>
                    
                    <Text style={[
                        styles.infoText,
                        { fontSize: scaleFont(14), marginBottom: scaleSize(15) }
                    ]}>
                        Enter your new email address. A verification link will be sent to this email.
                    </Text>
                    
                    <TextInput
                        style={[
                            styles.txtfld,
                            {
                                height: scaleSize(58),
                                fontSize: scaleFont(16),
                                paddingHorizontal: scaleSize(15),
                                marginBottom: scaleSize(20),
                            }
                        ]}
                        placeholder="Enter new email address"
                        placeholderTextColor="#888"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        editable={!isLoading}
                    />
                    
                    {isSuccess && (
                        <View style={styles.successMessage}>
                            <Ionicons name="checkmark-circle" size={scaleSize(20)} color="#61C35C" />
                            <Text style={[styles.successText, { fontSize: scaleFont(14) }]}>
                                Verification sent to {email}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={[
                    styles.up_cont,
                    {
                        marginBottom: height * 0.05,
                        paddingHorizontal: width > 768 ? '20%' : '10%',
                    }
                ]}>
                    <View style={{ alignItems: "center" }}>
                        <TouchableOpacity 
                            style={[
                                styles.up_btn,
                                {
                                    width: width > 768 ? '70%' : '85%',
                                    paddingVertical: scaleSize(15),
                                    paddingHorizontal: scaleSize(20),
                                }
                            ]} 
                            onPress={handleUpdateEmail}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text style={{ 
                                    fontSize: scaleFont(18), 
                                    fontWeight: "600", 
                                    color: 'white' 
                                }}>
                                    SEND VERIFICATION
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    
    titlebox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFBFB",
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },

    title: {
        fontWeight: "500",
        justifyContent: "center",
    },

    
    container: {
        flex: 1,
        backgroundColor: "#FFFBFB",
    },

    txtlabel: {
        fontWeight: "400",
        color: "#333",
    },

    infoText: {
        color: "#666",
        fontWeight: "300",
    },

    txtfld: {
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#D9D9D9',
        backgroundColor: 'white',
    },

    up_btn: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#61C35C",
        borderRadius: 8,
        shadowColor: "black",
        elevation: 5,
        shadowOpacity: 0.3,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 4 },
    },

    up_cont: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    },

    successMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FFF0',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#61C35C',
        marginTop: 10,
    },

    successText: {
        color: '#61C35C',
        marginLeft: 8,
        fontWeight: '500',
    },
});