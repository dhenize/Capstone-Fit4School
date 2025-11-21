import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import React, { useState } from "react";
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";


export default function con_success() {

    const router = useRouter();

    return (
        <View style={{ flex: 1, backgroundColor: "#FFFBFB" }}>

            <Stack.Screen
                options={{
                    animation: "slide_from_right",
                    headerShown: false,
                }}
            />

            {/* Title Box */}
            <View style={styles.titlebox}>
                <TouchableOpacity onPress={() => router.push("/dash_mod/account")}>
                    <Ionicons
                        name="arrow-back-outline"
                        size={26}
                        color="black"
                        style={{ marginHorizontal: "2%" }}
                    />
                </TouchableOpacity>
            </View>


            <View style={styles.container}>

                <View style={styles.remark_cont}>
                    <Image
                        source={require("../../assets/images/icons/gen_icons/success.png")}
                        style={styles.notif_img}
                    />

                    <Text style={styles.rem_txt}>
                        Thank you for reaching out! Your message has been successfully sent. 
                    </Text>
                </View>


                <View style={styles.up_cont}>
                    <View style={{ alignItems: "center", justifyContent: "center" }}>
                        <TouchableOpacity style={styles.up_btn} onPress={() => router.push("/dash_mod/home")}>
                            <Text style={{ fontSize: 20, fontWeight: "600", color: 'white' }}>BACK TO HOME</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    )
}


const styles = StyleSheet.create({
    //TITLE CONTAINER
    titlebox: {
        justifyContent: "flex-start",
        flexDirection: "row",
        alignContent: "center",
        alignItems: "center",
        padding: "6%",
        top: 20,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
    },

    //OVERALL CONTAINER
    container: {
        padding: "7%",
        flex: 1,
        backgroundColor: "#FFFBFB",
    },

    remark_cont: {
        paddingVertical: '50%',
        justifyContent: 'center',
        alignItems: 'center'
    },

    notif_img: {
        height: 118,
        width: 118,
    },

    rem_txt: {
        fontWeight: 500,
        fontSize: 20,
        marginVertical: '5%',
        textAlign: 'center'
    },

    up_cont: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        marginVertical: '9%',
    },

    up_btn: {
        alignItems: "center",
        backgroundColor: "#61C35C",
        padding: "4%",
        width: "85%",
        borderRadius: 5,
        shadowColor: "black",
        elevation: 5,
        shadowOpacity: 0.3,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 4 },
        alignItems: "center",
        justifyContent: "center",
    },
})