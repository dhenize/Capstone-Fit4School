import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Platform, Alert, ScrollView, Modal } from 'react-native';
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { RadioButton } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db, auth } from "../../firebase";
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDoc } from "firebase/firestore";
import OrderSuccessModal from '../../components/tran_com/ordr_rec_mes'; 


const generateOrderId = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); 
  const month = String(now.getMonth() + 1).padStart(2, '0'); 
  const day = String(now.getDate()).padStart(2, '0'); 
  
  const randomNum = Math.floor(1000 + Math.random() * 9000); 
  
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

    
    const selectedItemsParam = params.selectedItems;
    const fromBuyNow = params.fromBuyNow;

    // Helper function to format item display name
    const formatItemDisplayName = (item) => {
      // Check if item has uniformData with category, gender, grdLevel
      if (item.uniformData) {
        return `${item.uniformData.category || ''} ${item.uniformData.gender || ''} ${item.uniformData.grdLevel || ''}`;
      }
      // Fallback: try to parse from itemCode if available
      if (item.itemCode) {
        const parts = item.itemCode.split('-');
        if (parts.length >= 4) {
          return `${parts[1] || ''} ${parts[2] || ''} ${parts[3] || ''}`;
        }
      }
      return item.itemCode || 'Unknown Item';
    };

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

    
    const orderTotal = useMemo(() => {
        const total = selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        console.log("Computed total:", total);
        return total;
    }, [selectedItems]);

   
    const handlePlaceOrderPress = () => {
        if (selectedItems.length === 0) {
            Alert.alert("Error", "No items selected for checkout.");
            return;
        }
        setShowPolicyModal(true);
    };

    
    const placeOrder = async () => {
        setShowPolicyModal(false); 
        
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
            
            
            const customOrderId = generateOrderId();
            console.log("Generated Order ID:", customOrderId);

            
            const buyNowItems = selectedItems.filter(item => !item.firestoreId);
            const cartItemsToUpdate = selectedItems.filter(item => item.firestoreId);

            let orderDocRef;
            let orderIdToUse = customOrderId; 

            if (buyNowItems.length > 0) {
                // NORMALIZED items for Firestore WITH imageUrl
                const normalizedItems = buyNowItems.map(item => ({
                    addedAt: item.addedAt || new Date().toISOString(),
                    itemCode: item.itemCode,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.size,
                    imageUrl: item.imageUrl // ADDED imageUrl
                }));

                
                const orderData = {
                    orderId: customOrderId, 
                    requestedBy: auth.currentUser.uid,
                    items: normalizedItems, // Store normalized items with imageUrl
                    orderTotal: total,
                    paymentMethod: paymentMethod,
                    status: "To Pay",
                    date: serverTimestamp(), // Use server timestamp
                    createdAt: serverTimestamp(),
                    notes: "Please note that uniforms are pre-ordered items. Delivery/claiming typically takes 2-4 months from order placement."
                };

                orderDocRef = await addDoc(collection(db, "cartItems"), orderData);
                console.log("✅ New order created for Buy Now items:", orderDocRef.id);
            }

            
            if (cartItemsToUpdate.length > 0) {
                
                const cartDocsToUpdate = [...new Set(cartItemsToUpdate.map(item => item.firestoreId))];

                for (const firestoreId of cartDocsToUpdate) {
                    const cartDocRef = doc(db, "cartItems", firestoreId);
                    const cartDoc = await getDoc(cartDocRef);

                    if (cartDoc.exists()) {
                        const cartData = cartDoc.data();

                        // NORMALIZE existing items if needed
                        const normalizedItems = cartData.items.map(item => {
                            // If item has extra fields, normalize it
                            if (item.category || item.gender || item.grdLevel) {
                                return {
                                    addedAt: item.addedAt || new Date().toISOString(),
                                    itemCode: item.itemCode,
                                    price: item.price,
                                    quantity: item.quantity,
                                    size: item.size,
                                    imageUrl: item.imageUrl // KEEP imageUrl if it exists
                                };
                            }
                            return item; // Already normalized
                        });

                        await updateDoc(cartDocRef, {
                            orderId: customOrderId, 
                            items: normalizedItems,
                            status: "To Pay",
                            orderTotal: total,
                            paymentMethod: paymentMethod,
                            date: serverTimestamp(), // Use server timestamp
                            updatedAt: serverTimestamp(),
                            notes: "Please note that uniforms are pre-ordered items. Delivery/claiming typically takes 2-4 months from order placement."
                        });
                    }
                }
                console.log("✅ Updated cart items to 'To Pay' status");

               
                orderDocRef = { id: cartItemsToUpdate[0].firestoreId };
            }

          
            if (!fromBuyNow) {
                const cartItemIds = selectedItems.map(item => item.cartId);
                const updatedCart = cartItems.filter(item => !cartItemIds.includes(item.cartId));
                await AsyncStorage.setItem("cart", JSON.stringify(updatedCart));
                setCartItems(updatedCart);
                console.log("Cart updated after checkout");
            }

            
            const orderId = orderDocRef?.id || (cartItemsToUpdate.length > 0 ? cartItemsToUpdate[0].firestoreId : null);

            if (!orderId) {
                throw new Error("No order ID generated");
            }

           
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
                                                {/* UPDATED: Display formatted name instead of itemCode */}
                                                <Text style={styles.itemTitle}>{formatItemDisplayName(item)}</Text>
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

    
    container: {
        flex: 1,
        padding: "7%",
        backgroundColor: "#FFFBFB",
    },

    
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

    
    fixedBottomSection: {
        backgroundColor: "#FFFBFB",
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#E0E0E0",
    },

    
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