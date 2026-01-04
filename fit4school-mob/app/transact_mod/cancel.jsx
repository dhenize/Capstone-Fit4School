import { View, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { RadioButton } from "react-native-paper";
import React, {useState, useEffect} from 'react'
import { db } from "../../firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export default function Cancel() {

    const router = useRouter();
    const params = useLocalSearchParams();
    const [reason, setReason] = useState("duplicated order");
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(true);

    
    const orderId = params.orderId;

    // Helper function to format item display name
    const formatItemDisplayName = (item) => {
      // Check if item has category, gender, grdLevel properties
      if (item.category && item.gender && item.grdLevel) {
        return `${item.category} ${item.gender} ${item.grdLevel}`;
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
        if (orderId) {
            console.log("Fetching order with ID:", orderId);
            fetchOrderDetails();
        } else {
            console.log("No orderId found in params");
            Alert.alert("Error", "Order ID is missing");
            router.back();
        }
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            console.log("Attempting to fetch document:", orderId);
            const orderDoc = await getDoc(doc(db, 'cartItems', orderId));
            
            if (orderDoc.exists()) {
                const data = orderDoc.data();
                console.log("Order data found:", data);
                setOrderData({
                    id: orderDoc.id,
                    ...data
                });
            } else {
                console.log("Order document does not exist");
                Alert.alert("Error", "Order not found");
                router.back();
            }
        } catch (error) {
            console.error("Error fetching order:", error);
            Alert.alert("Error", "Failed to load order details");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!orderId) {
            Alert.alert("Error", "Order ID is missing");
            return;
        }

        Alert.alert(
            "Confirm Cancellation",
            "Are you sure you want to cancel this order?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            
                            await updateDoc(doc(db, 'cartItems', orderId), {
                                status: 'Cancelled',
                                cancellationReason: reason.toLowerCase(),
                                cancelledAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                            });

                            
                            router.push("/transact_mod/cncl_success");
                        } catch (error) {
                            console.error("Error cancelling order:", error);
                            Alert.alert("Error", "Failed to cancel order. Please try again.");
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: "#FFFBFB", justifyContent: 'center', alignItems: 'center' }}>
                <Text>Loading order details...</Text>
            </View>
        );
    }

    if (!orderData) {
        return (
            <View style={{ flex: 1, backgroundColor: "#FFFBFB", justifyContent: 'center', alignItems: 'center' }}>
                <Text>Order not found</Text>
            </View>
        );
    }

    
    const totalQuantity = orderData.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const totalPrice = orderData.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
    const firstItem = orderData.items && orderData.items.length > 0 ? orderData.items[0] : null;

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
                    {firstItem && firstItem.imageUrl ? (
                        <Image
                            source={{ uri: firstItem.imageUrl }}
                            style={styles.notif_img}
                        />
                    ) : (
                        <View style={[styles.notif_img, { backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' }]}>
                            <Text style={{ fontSize: 12 }}>No Image</Text>
                        </View>
                    )}

                    <View style={styles.notif_content}>

                        <View style={styles.rowBetween}>
                            <View>
                                <Text style={styles.itemTitle}>
                                    {/* UPDATED: Display formatted name instead of just "Order #" */}
                                    {firstItem ? formatItemDisplayName(firstItem) : `Order #${orderData.orderId || orderData.id}`}
                                </Text>
                                <Text style={styles.itemSubtitle}>
                                    {totalQuantity} item{totalQuantity !== 1 ? 's' : ''}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.rowBetween, { marginTop: 6 }]}>
                            <Text style={styles.itemQuantity}>Total Amount</Text>
                            <View style={{ alignItems: "flex-end" }}>
                                <Text style={styles.itemPrice}>₱{totalPrice.toFixed(2)}</Text>
                            </View>
                        </View>

                    </View>
                </View>


                <View style = {styles.rsn_cont}>

                    <Text style = {{alignSelf: 'flex-start', color: "#61C35C", fontSize: 15, fontWeight: "600",}}>
                        Reasons
                    </Text>

                    <View style={styles.reasonsList}>
                        <View style = {styles.radio_cont}>
                            <Text style = {{color: "black", fontSize: 14, fontWeight: "400",}}>Duplicated Order</Text>
                            <RadioButton 
                                value = "duplicated order"
                                status = {reason === "duplicated order" ? "checked" : "unchecked"}
                                onPress={() => setReason("duplicated order")}
                                style = {styles.radiobtn}
                                color= "#61C35C"
                                uncheckedColor='#B0B0B0'
                            />
                        </View>
                        
                        <View style = {styles.radio_cont}>
                            <Text style = {{color: "black", fontSize: 14, fontWeight: "400",}}>Don't need anymore</Text>
                            <RadioButton 
                                value = "don't need anymore"
                                status = {reason === "don't need anymore" ? "checked" : "unchecked"}
                                onPress={() => setReason("don't need anymore")}
                                style = {styles.radiobtn}
                                color= "#61C35C"
                                uncheckedColor='#B0B0B0'
                            />
                        </View>

                        <View style = {styles.radio_cont}>
                            <Text style = {{color: "black", fontSize: 14, fontWeight: "400",}}>Wrong item</Text>
                            <RadioButton 
                                value = "wrong item"
                                status = {reason === "wrong item" ? "checked" : "unchecked"}
                                onPress={() => setReason("wrong item")}
                                style = {styles.radiobtn}
                                color= "#61C35C"
                                uncheckedColor='#B0B0B0'
                            />
                        </View>

                        <View style = {styles.radio_cont}>
                            <Text style = {{color: "black", fontSize: 14, fontWeight: "400",}}>Can't pay on time</Text>
                            <RadioButton 
                                value = "can't pay on time"
                                status = {reason === "can't pay on time" ? "checked" : "unchecked"}
                                onPress={() => setReason("can't pay on time")}
                                style = {styles.radiobtn}
                                color= "#61C35C"
                                uncheckedColor='#B0B0B0'
                            />
                        </View>
                    </View>

                </View>


                <View style = {styles.subbtn_cont}>
                    <View style={{ alignItems: "center", justifyContent: "center" }}>
                        <TouchableOpacity style = {styles.sub_btn} onPress={handleSubmit}>
                            <Text style={{ fontSize: 20, fontWeight: "600", color: 'white' }}>SUBMIT</Text>
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
        height: '35%',
        borderRadius: 10,
        backgroundColor: "#F4F4F4",
        shadowOpacity: 0.4,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
        justifyContent: "space-evenly",
        alignItems: 'flex-start',
        flexWrap: 'wrap'
    },

    reasonsList: {
        flex: 1,
        marginLeft: 10,
    },

    radio_cont: {
        flexDirection: "row",
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        marginVertical: 8,
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