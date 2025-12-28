import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native'
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ticket_gen() {

    const router = useRouter();

    return (
        <View style={{ flex: 1, backgroundColor: "#D9D9D9" }}>

            <View style={styles.container}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity>
                        <Ionicons name="create-outline" size={28} color="black" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push("/dash_mod/transact")}>
                        <Ionicons name="close" size={28} color="black" />
                    </TouchableOpacity>
                </View>


                <View style={styles.tix_cont}>
                    <Image
                        source={require("../../assets/images/rettix.png")}
                        style = {styles.tix_img}
                    />
                </View>

                <View style = {styles.btn_cont}>
                    <TouchableOpacity style={styles.dlbtn}>
                        <Image
                            source={require("../../assets/images/icons/gen_icons/download.png")}
                            style={styles.icon_img}
                        />
                        <Text style={styles.btn_txt}>Download</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: "8.5%",
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginVertical: "5%",
    },

    tix_cont: {
        paddingVertical: '10%',
        alignItems: 'center',
        justifyContent: 'center'
    },

    tix_img: {
        height: 500,
        width: 350,
    },

    btn_cont: {
        alignItems: 'center',
    },

    dlbtn: {
        backgroundColor: '#61C35C',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        width: 190,
        height: 45,
        gap: 10
    },

    icon_img: {
        height: 20,
        width: 20
    },

    btn_txt: {
        fontWeight: '500',
        fontSize: 16,
        color: 'white'
    }
})