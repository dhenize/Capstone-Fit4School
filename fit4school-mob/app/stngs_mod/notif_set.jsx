import { View, StyleSheet, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Switch } from "react-native-paper";


export default function notif_set() {

    const router = useRouter();

    const [pushNotif, setPushNotif] = useState(true);
    const [emailNotif, setEmailNotif] = useState(true);

    return (
        <View style={{ flex: 1, backgroundColor: "#FFFBFB" }}>
            <View style={styles.titlebox}>
                <TouchableOpacity onPress={() => router.push("/stngs_mod/settings")}>
                    <Ionicons name="arrow-back-outline" size={28} color="white" />
                </TouchableOpacity>

                <Text style={styles.title}>Notification Settings</Text>
            </View>


            <View style={styles.container}>

                <View style = {styles.tog_cont}>
                    <View style = {styles.toggle}>
                        <Text style = {styles.menu_txt}>Push Notifications</Text>
                        <Switch 
                            value={pushNotif}
                            onValueChange={setPushNotif}
                            trackColor={{ false: "#ccc", true: "#61C35C" }}
                            thumbColor="white"
                            style={{ transform: [{ scale: 1.3 }] }}
                        />
                    </View>

                    <View style = {styles.toggle}>
                        <Text style = {styles.menu_txt}>Email Notifications</Text>
                        <Switch 
                            value={emailNotif}
                            onValueChange={setEmailNotif}
                            trackColor={{ false: "#ccc", true: "#61C35C" }}
                            thumbColor="white"
                            style={{ transform: [{ scale: 1.3 }] }}
                        />
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

    tog_cont:{
        paddingHorizontal: '8%',
    },

    toggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: '3%'
    },

    menu_txt: {
        fontWeight: '400',
        fontSize: 15,
    },

})