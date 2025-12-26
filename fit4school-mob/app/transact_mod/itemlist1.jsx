import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    TouchableOpacity,
    View,
    Image,
    Modal,
    Dimensions,
    TouchableWithoutFeedback,
    ScrollView,
    Alert
} from "react-native";
import { Text } from "../../components/globalText";
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";

import { db, auth } from "../../firebase";



export default function itemlist1() {

    const router = useRouter();
    const [selectedTab, setSelectedTab] = useState("All");

    const tabs = ["All", "Kindergarten", "Elementary", "Junior Highschool"];

    return (
        <View style={{ flex: 1, backgroundColor: "#FFFBFB", paddingBottom: '15%'}}>
            <View style={styles.titlebox}>
                <TouchableOpacity onPress={() => router.push("/dash_mod/home")}>
                    <Ionicons name="arrow-back-outline" size={26} color="white" style={{ marginHorizontal: "2%" }} />
                </TouchableOpacity>
                <Text style={styles.title}>Boy's Uniform</Text>
            </View>

            <ScrollView 
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabsScrollView}
            >
                <View style={styles.scrolltabs}>
                    {tabs.map((tab) => (
                        <TouchableOpacity 
                            key={tab}
                            style={[
                                styles.selectionbtn,
                                selectedTab === tab ? styles.selectedBtn : styles.unselectedBtn
                            ]}
                            onPress={() => setSelectedTab(tab)}
                        >
                            <Text style={[
                                styles.selectiontxt,
                                selectedTab === tab ? styles.selectedTxt : styles.unselectedTxt
                            ]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* UNIFORMS */}
            <ScrollView
                style={{marginVertical: 10, marginHorizontal: '7%'}}
                showsVerticalScrollIndicator={true}
            >
                <View style={styles.unif_cont}>

                    <View style={styles.unif_item}>
                        <TouchableOpacity style={styles.unif_touchable}>
                            <View style={styles.image_container}>
                                <Image
                                    source={require("../../assets/images/uniforms/Boys-Elem-Top.jpg")}
                                    style={styles.unif_pic}
                                    resizeMode="cover"
                                />
                            </View>
                            <View style={styles.unif_text_container}>
                                <Text style={styles.unif_txt}>
                                    Boy's Uniform
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.unif_item}>
                        <TouchableOpacity style={styles.unif_touchable}>
                            <View style={styles.image_container}>
                                <Image
                                    source={require("../../assets/images/uniforms/Girls-JHS-Top.jpg")}
                                    style={styles.unif_pic}
                                    resizeMode="cover"
                                />
                            </View>
                            <View style={styles.unif_text_container}>
                                <Text style={styles.unif_txt}>
                                    Girl's Uniform
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.unif_item}>
                        <TouchableOpacity style={styles.unif_touchable}>
                            <View style={styles.image_container}>
                                <Image
                                    source={require("../../assets/images/uniforms/PE-shirt.jpg")}
                                    style={styles.unif_pic}
                                    resizeMode="cover"
                                />
                            </View>
                            <View style={styles.unif_text_container}>
                                <Text style={styles.unif_txt}>
                                    PE Uniform
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>


                </View>
            </ScrollView>

        </View>
    )
}



const styles = StyleSheet.create({
    titlebox: {
        justifyContent: "flex-start",
        flexDirection: "row",
        alignContent: "center",
        alignItems: "center",
        backgroundColor: "#0FAFFF",
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

    tabsScrollView: {
        flexGrow: 0,
    },

    scrolltabs: {
        flexDirection: 'row',
        paddingVertical: '4%',
        paddingHorizontal: '3%',
    },

    selectionbtn: {
        borderRadius: 5,
        borderWidth: 2,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginHorizontal: 6,
        minHeight: 40,
        justifyContent: 'center',
    },

    selectedBtn: {
        borderColor: '#61C35C',
    },

    unselectedBtn: {
        borderColor: '#D9D9D9',
    },

    selectiontxt: {
        fontWeight: '500',
        fontSize: 15,
        textAlign: 'center',
    },

    selectedTxt: {
        color: '#61C35C',
    },

    unselectedTxt: {
        color: '#D9D9D9',
    },

    unif_cont: {
        flexDirection: "column",
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },

    unif_item: {
        borderRadius: 10,
        backgroundColor: 'white',
        marginVertical: 15,
        width: '95%',
        maxWidth: 350,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
    },

    unif_touchable: {
        width: '100%',
    },

    image_container: {
        width: '100%',
        height: 140,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        overflow: 'hidden',
    },

    unif_pic: {
        width: '100%',
        height: 200,
    },

    unif_text_container: {
        backgroundColor: '#61C35C',
        paddingVertical: 12,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },

    unif_txt: {
        fontWeight: '400',
        fontSize: 20,
        color: 'white',
        textAlign: 'center'
    }
})