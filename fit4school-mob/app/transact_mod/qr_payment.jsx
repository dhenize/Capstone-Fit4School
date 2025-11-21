import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text } from "../../components/globalText";

import QrHelp from "../../components/tran_com/qr_help";

export default function qr_payment() {

    const router = useRouter();
    const [helpVisible, setHelpVisible] = useState(false);

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.push("/transact_mod/checkout")}>
                        <Ionicons name="arrow-back-outline" size={28} color="black" />
                    </TouchableOpacity>
                    
                    <QrHelp visible={helpVisible} onClose={() => setHelpVisible(false)} />

                    <TouchableOpacity onPress={() => setHelpVisible(true)}>
                        <Ionicons name="alert-circle-outline" size={28} color="black" />
                    </TouchableOpacity>
                </View>

                <View style = {styles.qr_cont}>
                    <Image 
                        source={require("../../assets/images/QRph.png")}
                        style={styles.qr_img}
                    />
                </View>


                <View style = {styles.btn_cont}>
                    <TouchableOpacity style = {styles.dlbtn}>
                        <Image 
                            source={require("../../assets/images/icons/gen_icons/download.png")}
                            style={styles.icon_img}
                        />
                        <Text style = {styles.btn_txt}>Download</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style = {styles.upbtn}>
                        <Image 
                            source={require("../../assets/images/icons/gen_icons/upload.png")}
                            style={styles.icon_img}
                        />
                        <Text style = {styles.btn_txt}>Upload E-receipt</Text>
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

    qr_cont: {
        alignItems: 'center',
        padding: '10%'
    },

    qr_img: {
        height: 480,
        width: 300,
        borderRadius: 10,
    },

    btn_cont: {
        alignItems: 'center',
        rowGap: '15%'
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

    upbtn: {
        backgroundColor: '#0FAFFF',
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