import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, TextInput, Platform, } from 'react-native';
import { Picker } from "@react-native-picker/picker";
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";

export default function prsn_info() {

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
                <Text style={styles.title}>Personal Information</Text>
            </View>


            {/* MAIN CONTAINER */}
            <View style={styles.container}>

                <View style={styles.pf_cont}>
                    <Image
                        source={require("../../assets/images/dp_ex.jpg")}
                        style={styles.pf_img}
                    />

                    <TouchableOpacity>
                        <Text style={styles.edit_txt}>Edit</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inp_cont}>
                    
                    <Text style={styles.txtlabel}>First Name</Text>
                    <TextInput
                        style={styles.txtfld}
                        placeholder='Enter First Name...'
                    />


                    <Text style={styles.txtlabel}>Last Name</Text>
                    <TextInput
                        style={styles.txtfld}
                        placeholder='Enter Last Name...'
                    />


                    <Text style = {{fontSize: 16, fontWeight: 500}}>
                        Role
                    </Text>
                    <View style={styles.drop_cont}>
                        <Picker style={styles.dropdown} onValueChange={(itemValue) => setSort(itemValue)}>
                            <Picker.Item label="Parent" value="parent" style={styles.drop_txt} />
                            <Picker.Item label="Guardian" value="guardian" style={styles.drop_txt} />
                        </Picker>
                    </View>


                    <Text style={styles.txtlabel}>Student No.</Text>
                    <TextInput
                        style={styles.txtfld}
                        placeholder='12345678'
                    />


                    <Text style={{ fontWeight: 600, fontSize: 16, color: '#D9D9D9' }}>
                        Mary Dela Cruz
                    </Text>

                    <Text style={{ fontWeight: 400, fontSize: 16, color: '#D9D9D9' }}>
                        Pre-school
                    </Text>

                </View>


                <View style={styles.up_cont}>
                    <View style={{ alignItems: "center", justifyContent: "center" }}>
                        <TouchableOpacity style={styles.up_btn}  onPress={() => router.push("/stngs_mod/settings")}>
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

    pf_cont: {
        alignItems: 'center',
    },

    pf_img: {
        borderRadius: 100,
        height: 90,
        width: 90,
    },

    edit_txt: {
        color: '#0FAFFF',
        marginVertical: '1.5%',
        fontWeight: '400',
        fontSize: 14
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

    drop_cont: {
        borderColor: 'black',
        borderWidth: 1,
        borderRadius: 6,
        height: 55,
        marginBottom: '5%'
    },

    drop_txt: {
        fontWeight: 'bold'
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