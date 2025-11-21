import { View, StyleSheet, TouchableOpacity, TextInput, } from "react-native";
import React, {useState} from "react";
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";


export default function contact() {

    const router = useRouter();

    const [descCount, setDescCount] = useState("");

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
                <Text style={styles.title}>Need Help?</Text>
            </View>


            <View style={styles.container}>


                <View style = {styles.txtfield_cont}>

                    <TextInput
                        placeholder = "Subject"
                        editable
                        numberOfLine = {1}
                        maxLength = {1000}
                        style={styles.txtfield}
                    />

                    <TextInput
                        value = {descCount}
                        placeholder = "Your Message"
                        onChangeText = {setDescCount}
                        editable
                        multiline
                        numberOfLine = {15}
                        maxLength = {1000}
                        style={styles.txtfield2}
                    />

                    <Text style = {styles.count_txt}>
                        {descCount.split(/\s+/).filter(Boolean).length} / 100 words
                    </Text>
                </View>


                <View style={styles.up_cont}>
                    <View style={{ alignItems: "center", justifyContent: "center" }}>
                        <TouchableOpacity style={styles.up_btn} onPress={() => router.push("/stngs_mod/con_success")}>
                            <Text style={{ fontSize: 20, fontWeight: "600", color: 'white' }}>SUBMIT</Text>
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

    txtfield: {
        backgroundColor: '#D1E2E2',
        padding: '5%',
        borderRadius: 10,
        height: 55,
        textAlignVertical: 'top',
        fontWeight: 400,
        fontSize: 15,
    },

    txtfield2: {
        backgroundColor: '#CEE3C3',
        padding: '5%',
        borderRadius: 10,
        height: 250,
        textAlignVertical: 'top',
        fontWeight: 400,
        fontSize: 15,
    },

    txtfield_cont: {
        marginVertical: '7%',
        position: 'relative',
        rowGap: 20,
    },

    count_txt: {
        color: '#808080',
        fontWeight: 400,
        position: 'absolute',
        right: 10,
        bottom: 5
    },

    up_cont: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        marginVertical: '9%',
    },
})