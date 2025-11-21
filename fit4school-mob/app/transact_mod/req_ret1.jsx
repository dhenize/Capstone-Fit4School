import { View, StyleSheet, TouchableOpacity, Image, TextInput, Platform } from 'react-native'
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from 'react';


export default function req_ret() {

    const router = useRouter();

    const [descCount, setDescCount] = useState("");

    const [date, setDate] = useState(new Date());
    const [showDate, setShowDate] = useState(false);
    const [showTime, setShowTime] = useState(false);


    const onChangeDate = (event, selectedDate) => {
        setShowDate(false);
        if (selectedDate) setDate(selectedDate);
    };

    const onChangeTime = (event, selectedTime) => {
        setShowTime(false);
        if (selectedTime) setDate(selectedTime);
    };

    const formatDate = date.toLocaleDateString();
    const formatTime = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });



    const [returnRefund, setReturnRefund] = useState("ret_ex");





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
                <TouchableOpacity onPress={() => router.push("/transact_mod/his_pt2")}>
                    <Ionicons
                        name="arrow-back-outline"
                        size={26}
                        color="white"
                        style={{ marginHorizontal: "2%" }}
                    />
                </TouchableOpacity>
                <Text style={styles.title}>Request Return</Text>
            </View>

            <View style={styles.main_cont}>

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


                <View style={styles.rsn_cont}>
                    <Text style={{ color: "#61C35C", fontSize: 15, fontWeight: "600", }}>
                        Reason
                    </Text>

                    <Text style={{ color: "black", fontSize: 13, fontWeight: "400", }}>
                        Size is not accurate (too big/small)
                    </Text>
                </View>

                <View style = {styles.txtfield_cont}>
                    <TextInput
                        value = {descCount}
                        placeholder = "Description"
                        onChangeText = {setDescCount}
                        editable
                        multiline
                        numberOfLine = {15}
                        maxLength = {1000}
                        style={styles.txtfield}
                    />

                    <Text style = {styles.count_txt}>
                        {descCount.split(/\s+/).filter(Boolean).length} / 100 words
                    </Text>
                </View>
                


                <View style={styles.dnt_cont}>
                    <Text style={{ color: "#61C35C", fontSize: 15, fontWeight: "600", }}>
                        Set Date & Time
                    </Text>

                    <TouchableOpacity onPress={() => setShowDate(true)}>
                        <Text style={{ color: "black", fontSize: 14, fontWeight: "400", }}>
                            {formatDate}
                        </Text>
                    </TouchableOpacity>


                    <TouchableOpacity onPress={() => setShowTime(true)}>
                        <Text style={{ color: "black", fontSize: 14, fontWeight: "400", }}>
                            {formatTime}
                        </Text>
                    </TouchableOpacity>


                    {showDate && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display={Platform.OS === "ios" ? "spinner" : "default"}
                            onChange={onChangeDate}
                        />
                    )}

                    {showTime && (
                        <DateTimePicker
                            value={date}
                            mode="time"
                            display={Platform.OS === "ios" ? "spinner" : "default"}
                            onChange={onChangeTime}
                        />
                    )}

                </View>


                <View style={styles.rr_cont}>
                    <TouchableOpacity onPress={() => setReturnRefund("ret_ex")}>
                        <View
                            style={[
                                styles.rebtn,
                                returnRefund === "ret_ex" && styles.activeBtn,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.retxt,
                                    returnRefund === "ret_ex" && styles.activeBtnText,
                                ]}
                            >
                                Return/Exchange
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setReturnRefund("refund")}>
                        <View
                            style={[
                                styles.refbtn,
                                returnRefund === "refund" && styles.activeBtn,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.reftxt,
                                    returnRefund === "refund" && styles.activeBtnText,
                                ]}
                            >
                                Refund
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                
                <View style = {styles.sbm_cont}>
                    <View style={{ alignItems: "center", justifyContent: "center" }}>
                        <TouchableOpacity style = {styles.sbm_btn} onPress={() => router.push("/transact_mod/history")}>
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
    main_cont: {
        padding: "7%",
        flex: 1,
        backgroundColor: "#FFFBFB",
        rowGap: '2%'
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

    rsn_cont: {
        padding: 10,
        height: '7%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderRadius: 10,
        backgroundColor: "#F4F4F4",
        shadowOpacity: 0.4,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
        alignItems: "center",
    },

    txtfield: {
        backgroundColor: '#CEE3C3',
        padding: '5%',
        borderRadius: 10,
        height: 200,
        textAlignVertical: 'top',
        fontWeight: 400,
        fontSize: 15,
    },

    txtfield_cont: {
        position: 'relative',
    },

    count_txt: {
        color: '#808080',
        fontWeight: 400,
        position: 'absolute',
        right: 10,
        bottom: 5
    },

    dnt_cont: {
        flexDirection: "row",
        height: '7%',
        padding: 10,
        borderRadius: 10,
        backgroundColor: "#F4F4F4",
        shadowOpacity: 0.4,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
        justifyContent: "space-between",
        alignItems: 'center',
        marginVertical: '3%'
    },

    rr_cont: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: '3%'
    },

    rebtn: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#D9D9D9",
        height: 38,
        width: 155,
        borderRadius: 5,
        shadowOpacity: 0.4,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },

    refbtn: {
        alignItems: "center",
        justifyContent: "center",
        alignContent: "center",
        backgroundColor: "#D9D9D9",
        height: 38,
        width: 155,
        borderRadius: 5,
        shadowOpacity: 0.4,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },

    retxt: {
        fontWeight: "600",
        fontSize: 15
    },

    reftxt: {
        fontWeight: "600",
        fontSize: 15
    },

    activeBtn: {
        backgroundColor: "#0FAFFF"
    },

    activeBtnText: {
        color: "white"
    },

    sbm_cont: {
        position: 'absolute', 
        bottom: 0,
        left: 0,
        right: 0,
        marginVertical: '8%'
    },

    sbm_btn:{
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
