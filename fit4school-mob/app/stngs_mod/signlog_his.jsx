import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import React, { useState } from "react";
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";


export default function signlog_his() {

    const router = useRouter();

    return (
        <View style={{ flex: 1, backgroundColor: "#FFFBFB" }}>

            <View style={styles.titlebox}>
                <TouchableOpacity onPress={() => router.push("/stngs/settings")}>
                    <Ionicons name="arrow-back-outline" size={28} color="white" />
                </TouchableOpacity>

                <Text style={styles.title}>Sign in/Login History</Text>
            </View>


            <View style={styles.container}>

                <View style = {styles.mainlog}>
                    <View style={styles.log_cont}>
                        <View>
                            <Image
                                source={require("../../assets/images/icons/gen_icons/log.png")}
                                style={styles.log_img}
                            />
                        </View>
                        <View>
                            <Text style={styles.logtxt}>
                                You successfully login!
                            </Text>
                            <Text style={styles.timelogtxt}>
                                today 9:00 am
                            </Text>
                        </View>
                    </View>


                    <View style={styles.log_cont}>
                        <View>
                            <Image
                                source={require("../../assets/images/icons/gen_icons/log.png")}
                                style={styles.log_img}
                            />
                        </View>
                        <View>
                            <Text style={styles.logtxt}>
                                You successfully login!
                            </Text>
                            <Text style={styles.timelogtxt}>
                                yesterday 11:00 pm
                            </Text>
                        </View>
                    </View>


                    <View style={styles.log_cont}>
                        <View>
                            <Image
                                source={require("../../assets/images/icons/gen_icons/log.png")}
                                style={styles.log_img}
                            />
                        </View>
                        <View>
                            <Text style={styles.logtxt}>
                                You successfully login!
                            </Text>
                            <Text style={styles.timelogtxt}>
                                aug 10, 2025 6:00 pm
                            </Text>
                        </View>
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
        alignItems: "center",
        flexDirection: "row",
        gap: 10,
        backgroundColor: "#0FAFFF",
        padding: "10%",
        height: "14%",
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
    },

    title: {
        fontWeight: "500",
        fontSize: 24,
        color: "white",
        justifyContent: "center",
    },

    //OVERALL CONTAINER
    container: {
        flex: 1,
        padding: "7%",
        backgroundColor: "#FFFBFB",
    },

    mainlog: {
        padding: '5%',
        rowGap: '11%'
    },

    log_cont: {
        flexDirection: 'row',
        gap: 15
    },

    log_img: {
        height: 40,
        width: 40,
    },

    logtxt: {
        fontWeight: 500,
        fontSize: 18
    },

    timelogtxt: {
        color: '#3657FF',
        fontSize: 14,
        fontWeight: 600
    }
})