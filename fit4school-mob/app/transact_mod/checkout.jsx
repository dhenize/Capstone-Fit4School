import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Platform, Alert, ScrollView } from 'react-native';
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import { RadioButton } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db, auth } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function Checkout() {
    const router = useRouter();

    const [date, setDate] = useState(new Date());
    const [showDate, setShowDate] = useState(false);
    const [showTime, setShowTime] = useState(false);

    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [cartItems, setCartItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        const loadCartData = async () => {
            try {
                const routeParams = router.params || {};
                if (routeParams.selectedItems) {
                    const parsedSelectedItems = JSON.parse(routeParams.selectedItems);
                    setSelectedItems(parsedSelectedItems);
                }

                const storedCart = await AsyncStorage.getItem("cart");
                if (storedCart) setCartItems(JSON.parse(storedCart));
            } catch (error) {
                console.error("Failed to load cart data: ", error);
            }
        };
        
        loadCartData();
    }, [router.params]);

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

    // Compute order total from selected items
    const computeTotal = () => selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Place order
    const placeOrder = async () => {
        if (!auth.currentUser) {
            Alert.alert("Error", "You must be logged in to place an order.");
            return;
        }

        if (selectedItems.length === 0) {
            Alert.alert("Error", "No items selected for checkout.");
            return;
        }

        try {
            const orderData = {
                requestedBy: auth.currentUser.uid,
                items: selectedItems,
                orderTotal: computeTotal(),
                date: date.toISOString(),
                paymentMethod,
                status: "To Pay", // Changed from "for payment" to "To Pay"
                createdAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, "cartItems"), orderData);
            
            // Remove selected items from local cart
            const updatedCart = cartItems.filter(cartItem => 
                !selectedItems.some(selectedItem => selectedItem.cartId === cartItem.cartId)
            );
            
            await AsyncStorage.setItem("cart", JSON.stringify(updatedCart));
            setCartItems(updatedCart);

            // Redirect to ticket generation with order ID
            router.push({
                pathname: "/transact_mod/ticket_gen",
                params: { orderId: docRef.id }
            });
            
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
                {/* Scrollable Orders Section */}
                <View style={styles.scrollSection}>
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
                        {selectedItems.map((item, index) => (
                            <View key={item.cartId || index} style={styles.notif}>
                                <Image source={{ uri: item.imageUrl }} style={styles.notif_img} />
                                <View style={styles.notif_content}>
                                    <View style={styles.rowBetween}>
                                        <View>
                                            <Text style={styles.itemTitle}>{item.itemCode}</Text>
                                            <Text style={styles.itemSubtitle}>{item.size}</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.rowBetween, { marginTop: 6 }]}>
                                        <Text style={styles.itemQuantity}>Quantity x{item.quantity}</Text>
                                        <Text style={styles.itemPrice}>₱{item.price} each</Text>
                                    </View>
                                    <View style={[styles.rowBetween, { marginTop: 6 }]}>
                                        <Text style={styles.itemTotal}>Subtotal: ₱{item.price * item.quantity}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* Fixed Bottom Section - Payment Method and Total */}
                <View style={styles.fixedBottomSection}>
                    {/* Payment Method Section */}
                    <View style={styles.paymentSection}>
                        <Text style={styles.paymentTitle}>Payment Method</Text>
                        <View style={styles.radioGroup}>
                            <View style={styles.radioItem}>
                                <RadioButton
                                    value="cash"
                                    status={paymentMethod === "cash" ? "checked" : "unchecked"}
                                    onPress={() => setPaymentMethod("cash")}
                                    color="#61C35C"
                                    uncheckedColor='#B0B0B0'
                                />
                                <Text style={styles.radioLabel}>Cash</Text>
                            </View>
                            <View style={styles.radioItem}>
                                <RadioButton
                                    value="bank"
                                    status={paymentMethod === "bank" ? "checked" : "unchecked"}
                                    onPress={() => setPaymentMethod("bank")}
                                    color="#61C35C"
                                    uncheckedColor='#B0B0B0'
                                />
                                <Text style={styles.radioLabel}>Bank Method</Text>
                            </View>
                        </View>
                    </View>

                    {/* Total Section */}
                    <View style={styles.totalSection}>
                        <Text style={styles.totalText}>Total: ₱{computeTotal()}</Text>
                    </View>

                    {/* Place Order Button */}
                    <View style={styles.buttonSection}>
                        <TouchableOpacity style={styles.placeOrderBtn} onPress={placeOrder}>
                            <Text style={styles.placeOrderText}>PLACE ORDER</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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

    // OVERALL CONTAINER
    container: {
        flex: 1,
        padding: "7%",
        backgroundColor: "#FFFBFB",
    },

    // Scrollable Section for Orders
    scrollSection: {
        flex: 1,
        marginBottom: 20,
    },

    scrollContent: {
        paddingBottom: 10,
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
        marginBottom: 10,
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

    itemPrice: {
        color: "#1F72AD",
        fontSize: 15,
        fontWeight: "600",
    },

    itemTotal: {
        color: "#1F72AD",
        fontSize: 14,
        fontWeight: "600",
    },

    // Fixed Bottom Section
    fixedBottomSection: {
        backgroundColor: "#FFFBFB",
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#E0E0E0",
    },

    // Payment Method Section
    paymentSection: {
        backgroundColor: "#F4F4F4",
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        shadowOpacity: 0.4,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },

    paymentTitle: {
        color: "#61C35C",
        fontSize: 18, // Larger font size
        fontWeight: "600",
        marginBottom: 15,
    },

    radioGroup: {
        gap: 12,
    },

    radioItem: {
        flexDirection: "row",
        alignItems: "center",
    },

    radioLabel: {
        color: "black",
        fontSize: 16,
        fontWeight: "400",
        marginLeft: 8,
    },

    totalSection: {
        backgroundColor: "#F4F4F4",
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        alignItems: "center",
        shadowOpacity: 0.4,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },

    totalText: {
        fontWeight: "bold",
        fontSize: 20,
        color: "#61C35C",
        textAlign: "center",
    },

    // Button Section
    buttonSection: {
        alignItems: "center",
        marginBottom: 35,
    },

    placeOrderBtn: {
        backgroundColor: "#61C35C",
        paddingVertical: 15,
        paddingHorizontal: 30,
        width: "100%",
        borderRadius: 5,
        shadowColor: "black",
        elevation: 5,
        shadowOpacity: 0.3,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 4 },
        alignItems: "center",
        justifyContent: "center",
    },

    placeOrderText: {
        fontSize: 20,
        fontWeight: "600",
        color: 'white'
    },

});