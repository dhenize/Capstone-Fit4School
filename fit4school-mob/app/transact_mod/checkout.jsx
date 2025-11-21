import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Platform, Alert } from 'react-native';
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { RadioButton } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db, auth } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import QRCode from 'react-native-qrcode-svg';

export default function Checkout() {
    const router = useRouter();

    const [date, setDate] = useState(new Date());
    const [showDate, setShowDate] = useState(false);
    const [showTime, setShowTime] = useState(false);

    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [cartItems, setCartItems] = useState([]);
    const [orderDocId, setOrderDocId] = useState(null);

    // Load cart from AsyncStorage
    useEffect(() => {
        const loadCart = async () => {
            try {
                const storedCart = await AsyncStorage.getItem("cart");
                if (storedCart) setCartItems(JSON.parse(storedCart));
            } catch (error) {
                console.error("Failed to load cart: ", error);
            }
        };
        loadCart();
    }, []);

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

    // Compute order total
    const computeTotal = () => cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Place order
    const placeOrder = async () => {
        if (!auth.currentUser) {
            Alert.alert("Error", "You must be logged in to place an order.");
            return;
        }

        if (cartItems.length === 0) {
            Alert.alert("Error", "Your cart is empty.");
            return;
        }

        try {
            const orderData = {
                requestedBy: auth.currentUser.uid,
                items: cartItems,
                orderTotal: computeTotal(),
                date: date.toISOString(),
                paymentMethod,
                status: "for payment",
                createdAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, "cartItems"), orderData);
            setOrderDocId(docRef.id);

            // Clear local cart
            await AsyncStorage.removeItem("cart");
            setCartItems([]);

            Alert.alert("Success", "Your order has been placed!");
        } catch (error) {
            console.error("Failed to place order: ", error);
            Alert.alert("Error", "Failed to place order. Try again.");
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#FFFBFB" }}>
            <Stack.Screen options={{ animation: "slide_from_right", headerShown: false }} />

            {/* Title Box */}
            <View style={styles.titlebox}>
                <TouchableOpacity onPress={() => router.push("/dash_mod/transact")}>
                    <Ionicons name="arrow-back-outline" size={26} color="black" style={{ marginHorizontal: "2%" }} />
                </TouchableOpacity>
                <Text style={styles.title}>Order Summary</Text>
            </View>

            {/* MAIN CONTAINER */}
            <View style={styles.container}>
                {cartItems.map((item, index) => (
                    <View key={index} style={styles.notif}>
                        <Image source={{ uri: item.imageUrl }} style={styles.notif_img} />
                        <View style={styles.notif_content}>
                            <View style={styles.rowBetween}>
                                <View>
                                    <Text style={styles.itemTitle}>{item.itemCode}</Text>
                                    <Text style={styles.itemSubtitle}>{item.size}</Text>
                                </View>
                            </View>
                            <View style={[styles.rowBetween, { marginTop: 6 }]}>
                                <Text style={styles.itemQuantity}>Quantity {item.quantity}</Text>
                                <Text style={styles.itemPrice}>₱{item.price}</Text>
                            </View>
                        </View>
                    </View>
                ))}

                <View style={{ marginVertical: 10 }}>
                    <Text style={{ fontWeight: "600", fontSize: 16 }}>
                        Total: ₱{computeTotal()}
                    </Text>
                </View>

                <View style={styles.paymet_cont}>
                    <Text style={{ color: "#61C35C", fontSize: 14, fontWeight: "600" }}>Payment Method</Text>

                    <View>
                        <View style={styles.radio_cont}>
                            <Text style={{ color: "black", fontSize: 14, fontWeight: "400" }}>Cash</Text>
                            <RadioButton
                                value="cash"
                                status={paymentMethod === "cash" ? "checked" : "unchecked"}
                                onPress={() => setPaymentMethod("cash")}
                                color="#61C35C"
                                uncheckedColor='#B0B0B0'
                            />
                        </View>

                        <View style={styles.radio_cont}>
                            <Text style={{ color: "black", fontSize: 14, fontWeight: "400" }}>Bank Method</Text>
                            <RadioButton
                                value="bank"
                                status={paymentMethod === "bank" ? "checked" : "unchecked"}
                                onPress={() => setPaymentMethod("bank")}
                                color="#61C35C"
                                uncheckedColor='#B0B0B0'
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.dnt_cont}>
                    <Text style={{ color: "#61C35C", fontSize: 14, fontWeight: "600" }}>Set Date & Time</Text>

                    <TouchableOpacity onPress={() => setShowDate(true)}>
                        <Text style={{ color: "black", fontSize: 14, fontWeight: "400" }}>{formatDate}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setShowTime(true)}>
                        <Text style={{ color: "black", fontSize: 14, fontWeight: "400" }}>{formatTime}</Text>
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

                <View style={styles.pobtncont}>
                    <View style={{ alignItems: "center", justifyContent: "center" }}>
                        <TouchableOpacity style={styles.plcordr_btn} onPress={placeOrder}>
                            <Text style={{ fontSize: 20, fontWeight: "600", color: 'white' }}>PLACE ORDER</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* QR Code */}
                {orderDocId && (
                    <View style={{ alignItems: "center", marginTop: 20 }}>
                        <Text style={{ marginBottom: 10 }}>Scan this QR on accountant for payment:</Text>
                        <QRCode value={orderDocId} size={200} />
                    </View>
                )}
            </View>
        </View>
    );
}






const styles = StyleSheet.create({
  
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

    paymet_cont: {
        flexDirection: "row",
        padding: 10,
        height: '20%',
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

    remind_cont: {
        padding: 20,
        borderRadius: 10,
        backgroundColor: "#F4F4F4",
        shadowOpacity: 0.4,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
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
        alignItems: 'center'
    },

    pobtncont: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        marginVertical: '9%',
    },

    radiobtn: {
        alignItems: 'flex-end'
    },

    plcordr_btn: {
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

    hlink_txt: {
        color: "#61C35C",
        textDecorationLine: "underline",
    },

    ss_cont: {
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
        alignItems: 'center'
    },

    vw_txt: {
        color: "#61C35C", 
        fontSize: 14, 
        fontWeight: "600",
    },


    ss_txt: {
        textDecorationLine: "underline"
    }


});
