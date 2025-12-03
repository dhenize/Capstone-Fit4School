//../../transact_mod/checkout.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Platform, Alert, ScrollView, Modal } from 'react-native';
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { RadioButton } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db, auth } from "../../firebase";
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDoc } from "firebase/firestore";
import OrderSuccessModal from '../../components/tran_com/ordr_rec_mes'; // Your success modal

// Function to generate custom order ID
const generateOrderId = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Month (01-12)
  const day = String(now.getDate()).padStart(2, '0'); // Day (01-31)
  
  // Generate random 4-digit number
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 1000-9999
  
  return `ORDR${year}${month}${day}${randomNum}`;
};

export default function Checkout() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [cartItems, setCartItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [generatedOrderId, setGeneratedOrderId] = useState(null);
    const [showPolicyModal, setShowPolicyModal] = useState(false);

    // FIX: Extract the specific values we care about from params
    const selectedItemsParam = params.selectedItems;
    const fromBuyNow = params.fromBuyNow;

    useEffect(() => {
        const loadCartData = async () => {
            try {
                console.log("Route params selectedItems:", selectedItemsParam);

                if (selectedItemsParam) {
                    const parsedSelectedItems = JSON.parse(selectedItemsParam);
                    console.log("Selected items from params:", parsedSelectedItems);

                    const validatedItems = parsedSelectedItems.map(item => ({
                        ...item,
                        price: Number(item.price) || 0,
                        quantity: Number(item.quantity) || 1
                    }));

                    setSelectedItems(validatedItems);
                }

                // Only load cart if not from Buy Now
                if (!fromBuyNow) {
                    const storedCart = await AsyncStorage.getItem("cart");
                    if (storedCart) {
                        const parsedCart = JSON.parse(storedCart);
                        console.log("Full cart from storage:", parsedCart);
                        setCartItems(parsedCart);
                    }
                }
            } catch (error) {
                console.error("Failed to load cart data: ", error);
            }
        };

        loadCartData();
    }, [selectedItemsParam, fromBuyNow]);

    // FIX: Use useMemo to prevent unnecessary re-renders
    const orderTotal = useMemo(() => {
        const total = selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        console.log("Computed total:", total);
        return total;
    }, [selectedItems]);

    // Function to show policy modal before placing order
    const handlePlaceOrderPress = () => {
        if (selectedItems.length === 0) {
            Alert.alert("Error", "No items selected for checkout.");
            return;
        }
        setShowPolicyModal(true);
    };

    // Place order function after accepting policy
    const placeOrder = async () => {
        setShowPolicyModal(false); // Close policy modal
        
        if (!auth.currentUser) {
            Alert.alert("Error", "You must be logged in to place an order.");
            return;
        }

        if (selectedItems.length === 0) {
            Alert.alert("Error", "No items selected for checkout.");
            return;
        }

        try {
            console.log("=== CHECKING OUT ===");
            console.log("Selected items for checkout:", selectedItems);

            const total = orderTotal;
            const currentDate = new Date();
            
            // Generate custom order ID
            const customOrderId = generateOrderId();
            console.log("Generated Order ID:", customOrderId);

            // For Buy Now items (no Firestore ID), create new order
            // For Cart items (have Firestore ID), update status
            const buyNowItems = selectedItems.filter(item => !item.firestoreId);
            const cartItemsToUpdate = selectedItems.filter(item => item.firestoreId);

            let orderDocRef;
            let orderIdToUse = customOrderId; // Use custom order ID

            if (buyNowItems.length > 0) {
                // Create new order for Buy Now items
                const orderData = {
                    orderId: customOrderId, // Add custom order ID
                    requestedBy: auth.currentUser.uid,
                    items: buyNowItems.map(item => ({
                        id: item.id,
                        itemCode: item.itemCode,
                        category: item.category,
                        gender: item.gender,
                        grdLevel: item.grdLevel,
                        imageUrl: item.imageUrl,
                        size: item.size,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                    orderTotal: total,
                    paymentMethod: paymentMethod,
                    status: "To Pay",
                    date: currentDate.toISOString(), // Use proper ISO string
                    createdAt: serverTimestamp(),
                    notes: "Please note that uniforms are pre-ordered items. Delivery/claiming typically takes 2-4 months from order placement."
                };

                orderDocRef = await addDoc(collection(db, "cartItems"), orderData);
                console.log("✅ New order created for Buy Now items:", orderDocRef.id);
            }

            // Update cart items status from "pending" to "To Pay"
            if (cartItemsToUpdate.length > 0) {
                // Group by firestoreId since multiple items might share the same cart document
                const cartDocsToUpdate = [...new Set(cartItemsToUpdate.map(item => item.firestoreId))];

                for (const firestoreId of cartDocsToUpdate) {
                    const cartDocRef = doc(db, "cartItems", firestoreId);
                    const cartDoc = await getDoc(cartDocRef);

                    if (cartDoc.exists()) {
                        const cartData = cartDoc.data();

                        // Update all items in this cart document to "To Pay"
                        const updatedItems = cartData.items.map(item => ({
                            ...item,
                            status: "To Pay"
                        }));

                        await updateDoc(cartDocRef, {
                            orderId: customOrderId, // Add custom order ID
                            items: updatedItems,
                            status: "To Pay",
                            orderTotal: total,
                            paymentMethod: paymentMethod,
                            date: currentDate.toISOString(), // Add date here too
                            updatedAt: serverTimestamp(),
                            notes: "Please note that uniforms are pre-ordered items. Delivery/claiming typically takes 2-4 months from order placement."
                        });
                    }
                }
                console.log("✅ Updated cart items to 'To Pay' status");

                // Use the first cart item's Firestore ID as order reference
                orderDocRef = { id: cartItemsToUpdate[0].firestoreId };
            }

            // Clean up local cart only if not from Buy Now
            if (!fromBuyNow) {
                const cartItemIds = selectedItems.map(item => item.cartId);
                const updatedCart = cartItems.filter(item => !cartItemIds.includes(item.cartId));
                await AsyncStorage.setItem("cart", JSON.stringify(updatedCart));
                setCartItems(updatedCart);
                console.log("Cart updated after checkout");
            }

            // Success
            const orderId = orderDocRef?.id || (cartItemsToUpdate.length > 0 ? cartItemsToUpdate[0].firestoreId : null);

            if (!orderId) {
                throw new Error("No order ID generated");
            }

            // Store both the Firestore document ID and custom order ID
            setGeneratedOrderId({
                firestoreId: orderId,
                customOrderId: customOrderId
            });
            setShowSuccessModal(true);

        } catch (error) {
            console.error("❌ Checkout failed:", error);
            Alert.alert("Error", `Failed to place order: ${error.message}`);
        }
    };

    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        // Navigate to ticket generation
        router.replace({
            pathname: "/transact_mod/ticket_gen",
            params: { 
                orderId: generatedOrderId.firestoreId,
                customOrderId: generatedOrderId.customOrderId 
            }
        });
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
                        {selectedItems.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>No items selected</Text>
                                <Text style={styles.emptyStateSubtext}>Please go back and select items for checkout</Text>
                            </View>
                        ) : (
                            selectedItems.map((item, index) => (
                                <View key={item.cartId || `item-${index}`} style={styles.notif}>
                                    <Image
                                        source={{ uri: item.imageUrl }}
                                        style={styles.notif_img}
                                    />
                                    <View style={styles.notif_content}>
                                        <View style={styles.rowBetween}>
                                            <View>
                                                <Text style={styles.itemTitle}>{item.itemCode}</Text>
                                                <Text style={styles.itemSubtitle}>Size: {item.size}</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.rowBetween, { marginTop: 6 }]}>
                                            <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                                            <Text style={styles.itemPrice}>₱{item.price} each</Text>
                                        </View>
                                        <View style={[styles.rowBetween, { marginTop: 6 }]}>
                                            <Text style={styles.itemTotal}>Subtotal: ₱{item.price * item.quantity}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
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
                                <Text style={styles.radioLabel}>Bank Transfer</Text>
                            </View>
                        </View>
                    </View>

                    {/* Total Section */}
                    <View style={styles.totalSection}>
                        <Text style={styles.totalText}>Total: ₱{orderTotal}</Text>
                    </View>

                    {/* Place Order Button */}
                    <View style={styles.buttonSection}>
                        <TouchableOpacity
                            style={[
                                styles.placeOrderBtn,
                                selectedItems.length === 0 && styles.disabledBtn
                            ]}
                            onPress={handlePlaceOrderPress}
                            disabled={selectedItems.length === 0}
                        >
                            <Text style={styles.placeOrderText}>
                                {selectedItems.length === 0 ? 'NO ITEMS SELECTED' : 'PLACE ORDER'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Order & Payment Policy Modal */}
            <Modal
                visible={showPolicyModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowPolicyModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>ORDER & PAYMENT POLICY</Text>
                        
                        <ScrollView style={styles.policyScroll} showsVerticalScrollIndicator={true}>
                            <View style={styles.policySection}>
                                <Text style={styles.policyHeading}>Payment Deadline:</Text>
                                <Text style={styles.policyText}>
                                    Complete your payment within 36 hours of placing your order. Unpaid orders will be automatically voided after this period.
                                </Text>
                            </View>
                            
                            <View style={styles.policySection}>
                                <Text style={styles.policyHeading}>Order Verification:</Text>
                                <Text style={styles.policyText}>
                                    Please double-check your order details and selected payment method before finalizing.
                                </Text>
                            </View>
                            
                            <View style={styles.policySection}>
                                <Text style={styles.policyHeading}>Disclaimer:</Text>
                                <Text style={styles.policyText}>
                                    The school shall not be held liable for any errors, inaccuracies, or incorrect details provided in your order.
                                </Text>
                            </View>
                            
                            <View style={styles.policySection}>
                                <Text style={styles.policyHeading}>Important Note:</Text>
                                <Text style={styles.policyText}>
                                    Uniforms are pre-ordered items. Delivery/claiming typically takes 2-4 months from order placement.
                                </Text>
                            </View>
                            
                            <View style={styles.agreementSection}>
                                <Text style={styles.agreementText}>
                                    By placing this order, you acknowledge and agree to the terms above.
                                </Text>
                            </View>
                        </ScrollView>
                        
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowPolicyModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>CANCEL</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={placeOrder}
                            >
                                <Text style={styles.confirmButtonText}>ACCEPT & PLACE ORDER</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Success Modal */}
            <OrderSuccessModal
                visible={showSuccessModal}
                onClose={handleSuccessModalClose}
            />
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
        flexGrow: 1,
    },

    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },

    emptyStateText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#666",
        marginBottom: 8,
    },

    emptyStateSubtext: {
        fontSize: 14,
        color: "#999",
        textAlign: "center",
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
        fontSize: 18,
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

    disabledBtn: {
        backgroundColor: "#ccc",
    },

    placeOrderText: {
        fontSize: 20,
        fontWeight: "600",
        color: 'white'
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },

    modalContent: {
        backgroundColor: 'white',
        borderRadius: 15,
        width: '100%',
        maxHeight: '80%',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },

    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F72AD',
        textAlign: 'center',
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#61C35C',
        paddingBottom: 10,
    },

    policyScroll: {
        maxHeight: 300,
        marginBottom: 20,
    },

    policySection: {
        marginBottom: 15,
    },

    policyHeading: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F72AD',
        marginBottom: 5,
    },

    policyText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
        textAlign: 'justify',
    },

    agreementSection: {
        backgroundColor: '#F8F9FA',
        padding: 15,
        borderRadius: 8,
        marginTop: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#61C35C',
    },

    agreementText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F72AD',
        fontStyle: 'italic',
        textAlign: 'center',
    },

    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },

    modalButton: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },

    cancelButton: {
        backgroundColor: '#E0E0E0',
    },

    confirmButton: {
        backgroundColor: '#61C35C',
    },

    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },

    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});