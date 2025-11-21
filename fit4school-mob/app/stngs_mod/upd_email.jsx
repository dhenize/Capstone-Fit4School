import { View, StyleSheet, TouchableOpacity, TextInput, } from "react-native";
import React from "react";
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";

export default function upd_email() {

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
                <TouchableOpacity onPress={() => router.push("/stngs_mod/settings")}>
                    <Ionicons
                        name="arrow-back-outline"
                        size={26}
                        color="black"
                        style={{ marginHorizontal: "2%" }}
                    />
                </TouchableOpacity>
                <Text style={styles.title}>Update Email</Text>
            </View>


            <View style={styles.container}>

                <View style = {{paddingVertical: '15%'}}>
                    <Text style={styles.txtlabel}>Email</Text>
                    <TextInput
                        style={styles.txtfld}
                        placeholder='juan@gmail.com'
                    />
                </View>


                <View style={styles.up_cont}>
                    <View style={{ alignItems: "center", justifyContent: "center" }}>
                        <TouchableOpacity style={styles.up_btn} onPress={() => router.push("/stngs_mod/settings")}>
                            <Text style={{ fontSize: 20, fontWeight: "600", color: 'white' }}>UPDATE</Text>
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

    title: {
        fontWeight: "500",
        fontSize: 24,
        justifyContent: "center",
    },

    //OVERALL CONTAINER
    container: {
        padding: "10%",
        flex: 1,
        backgroundColor: "#FFFBFB",
        rowGap: '2%'
    },

    txtlabel: {
        fontSize: 16,
        fontWeight: 400
    },

    txtfld: {
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#D9D9D9',
        height: 58,
        fontSize: 16,
        marginBottom: '5%'
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

    up_cont: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        marginVertical: '9%',
    },
})