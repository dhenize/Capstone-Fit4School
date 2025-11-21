import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import { RadioButton } from "react-native-paper";
import React, {useState} from 'react'

export default function cancel() {

    const router = useRouter();
    
    const [reason, setReason] = useState("duplicate");

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
            <TouchableOpacity onPress={() => router.push("/dash_mod/transact")}>
                <Ionicons
                    name="arrow-back-outline"
                    size={26}
                    color="white"
                    style={{ marginHorizontal: "2%" }}
                />
            </TouchableOpacity>
            <Text style={styles.title}>Cancellation</Text>
        </View>

        
        {/* MAIN CONTAINER */}
        <View style={styles.container}>

            <View style={styles.notif}>

                <Image
                    source={require("../../assets/images/b_unif_ex.png")}
                    style={styles.notif_img}
                />

                <View style={styles.notif_content}>

                    <View style={styles.rowBetween}>
                        <View>
                            <Text style={styles.itemTitle}>
                                Boy’s Uniform (Pre-school)
                            </Text>
                            <Text style={styles.itemSubtitle}>size 8</Text>
                        </View>
                    </View>

                    <View style={[styles.rowBetween, { marginTop: 6 }]}>
                        <Text style={styles.itemQuantity}>Quantity 2</Text>
                        <View style={{ alignItems: "flex-end" }}>
                            <Text style={styles.itemPrice}>₱800.00</Text>
                        </View>
                    </View>

                </View>
            </View>


            <View style = {styles.rsn_cont}>

                <Text style = {{alignSelf: 'flex-start', color: "#61C35C", fontSize: 15, fontWeight: "600",}}>
                    Reasons
                </Text>

                <View>
                    <View style = {styles.radio_cont}>
                        <Text style = {{color: "black", fontSize: 14, fontWeight: "400",}}>Duplicated Order</Text>
                        <RadioButton 
                            value = "duplicate"
                            status = {reason === "duplicate" ? "checked" : "unchecked"}
                            onPress={() => setReason("duplicate")}
                            style = {styles.radiobtn}
                            color= "#61C35C"
                            uncheckedColor='#B0B0B0'
                        />
                    </View>
                    
                    <View style = {styles.radio_cont}>
                        <Text style = {{color: "black", fontSize: 14, fontWeight: "400",}}>Don't need anymore</Text>
                        <RadioButton 
                            value = "dontneed"
                            status = {reason === "dontneed" ? "checked" : "unchecked"}
                            onPress={() => setReason("dontneed")}
                            style = {styles.radiobtn}
                            color= "#61C35C"
                            uncheckedColor='#B0B0B0'
                        />
                    </View>

                    <View style = {styles.radio_cont}>
                        <Text style = {{color: "black", fontSize: 14, fontWeight: "400",}}>Wrong item</Text>
                        <RadioButton 
                            value = "wrong"
                            status = {reason === "wrong" ? "checked" : "unchecked"}
                            onPress={() => setReason("wrong")}
                            style = {styles.radiobtn}
                            color= "#61C35C"
                            uncheckedColor='#B0B0B0'
                        />
                    </View>

                    <View style = {styles.radio_cont}>
                        <Text style = {{color: "black", fontSize: 14, fontWeight: "400",}}>Can't pay on time</Text>
                        <RadioButton 
                            value = "cantpay"
                            status = {reason === "cantpay" ? "checked" : "unchecked"}
                            onPress={() => setReason("cantpay")}
                            style = {styles.radiobtn}
                            color= "#61C35C"
                            uncheckedColor='#B0B0B0'
                        />
                    </View>

                </View>

            </View>


            <View style = {styles.subbtn_cont}>
                <View style={{ alignItems: "center", justifyContent: "center" }}>
                    <TouchableOpacity style = {styles.sub_btn} onPress={() => router.push("/transact_mod/cncl_success")}>
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
        backgroundColor: "#61C35C",
        padding: "10%",
        height: "16%",
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
        padding: "7%",
        flex: 1,
        backgroundColor: "#FFFBFB",
        rowGap: '4%'
    },

    notif: {
        flexDirection: "row",
        padding: 10,
        borderRadius: 10,
        backgroundColor: "#F4F4F4",
        shadowOpacity: 0.4,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
        alignItems: "center",
    },

    notif_img: {
        height: 80,
        width: 70,
        resizeMode: "contain",
        marginRight: 10,
        alignSelf: 'flex-start',
        borderRadius: 5,
    },

    notif_content: {
        flex: 1,
        justifyContent: "space-between",
    },

    rowBetween: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    itemTitle: {
        color: "#1F72AD",
        fontSize: 14,
        fontWeight: "600",
    },

    itemSubtitle: {
        color: "#1F72AD",
        fontSize: 12,
        fontWeight: "400",
    },

    itemQuantity: {
        color: "#1F72AD",
        fontSize: 15,
        fontWeight: "600",
    },

    remarktxt: {
        color: "#1F72AD",
        fontSize: 11,
        fontWeight: "400",
    },

    itemPrice: {
        color: "#1F72AD",
        fontSize: 15,
        fontWeight: "600",
    },

    rsn_cont:{
        flexDirection: "row",
        padding: 10,
        height: '22.5%',
        borderRadius: 10,
        backgroundColor: "#F4F4F4",
        shadowOpacity: 0.4,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
        justifyContent: "space-evenly",
        alignItems: 'center'
    },

    radio_cont: {
        flexDirection: "row",
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10
    },

    radiobtn: {
        alignItems: 'flex-end'
    },

    subbtn_cont: {
        position: 'absolute', 
        bottom: 0,
        left: 0,
        right: 0,
        marginVertical: '9%',
    },

    sub_btn: {
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
    }
})