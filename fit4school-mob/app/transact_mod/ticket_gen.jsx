import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { db, auth } from "../../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import QRCode from "react-native-qrcode-svg";
import { generateAndSharePDF } from '../../utils/pdfGenerator'; 

export default function TicketGen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const orderId = params.orderId;
    const customOrderId = params.customOrderId; 

    const [orderData, setOrderData] = useState(null);
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [displayOrderId, setDisplayOrderId] = useState('');
    const [uniformsData, setUniformsData] = useState({}); // Store uniform data by itemCode

    // Fetch uniform data for order items
    useEffect(() => {
        if (orderData && orderData.items) {
            fetchUniformsData();
        }
    }, [orderData]);

    // Fetch uniform data from Firestore
    const fetchUniformsData = async () => {
        try {
            const uniqueItemCodes = [...new Set(orderData.items.map(item => item.itemCode))];
            const uniformsMap = {};
            
            for (const itemCode of uniqueItemCodes) {
                const uniformsQuery = query(
                    collection(db, "uniforms"),
                    where("itemCode", "==", itemCode)
                );
                
                const querySnapshot = await getDocs(uniformsQuery);
                if (!querySnapshot.empty) {
                    const uniformDoc = querySnapshot.docs[0];
                    const uniformData = uniformDoc.data();
                    uniformsMap[itemCode] = {
                        category: uniformData.category,
                        gender: uniformData.gender,
                        grdLevel: uniformData.grdLevel
                    };
                }
            }
            
            setUniformsData(uniformsMap);
        } catch (error) {
            console.error("Error fetching uniform data:", error);
        }
    };

    // Helper function to format item display name
    const formatItemDisplayName = (item) => {
        if (!item) return 'Unknown Item';

        // Prefer explicit item name if available
        if (item.itemName || item.name) {
            return item.itemName || item.name;
        }

        // Check if we have uniform data for this item
        if (uniformsData[item.itemCode]) {
            const uniform = uniformsData[item.itemCode];
            return `${uniform.category || ''} ${uniform.gender || ''} ${uniform.grdLevel || ''}`.trim();
        }

        // Fallback: try to parse from itemCode if available
        if (item.itemCode) {
            const parts = item.itemCode.split('-');
            if (parts.length >= 4) {
                return `${parts[1] || ''} ${parts[2] || ''} ${parts[3] || ''}`.trim();
            }
        }
        return item.itemCode || 'Unknown Item';
    };

    useEffect(() => {
        
        setDisplayOrderId(customOrderId || orderId);
        
        if (orderId) {
            fetchOrderData();
        } else {
            setError("No order ID provided");
            setLoading(false);
        }
    }, [orderId, customOrderId]);

    const fetchUserData = async (userId) => {
        try {
            const userQuery = query(collection(db, "accounts"), where("firebase_uid", "==", userId));
            const querySnapshot = await getDocs(userQuery);

            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                // Use parent_fullname instead of fname + lname
                return userData.parent_fullname || "Customer";
            }
            return "Customer";
        } catch (error) {
            console.error("Error fetching user data:", error);
            return "Customer";
        }
    };

    const fetchOrderData = async () => {
        try {
            console.log("Fetching order data for ID:", orderId);

            const orderDoc = await getDoc(doc(db, "cartItems", orderId));
            console.log("Order document exists:", orderDoc.exists());

            if (orderDoc.exists()) {
                const data = orderDoc.data();
                console.log("Order data:", data);

                
                if (data.orderId) {
                    setDisplayOrderId(data.orderId);
                }

                
                let orderDate;
                if (data.createdAt) {
                    orderDate = data.createdAt.toDate();
                } else if (data.date) {
                    orderDate = new Date(data.date);
                } else {
                    orderDate = new Date();
                }

                
                data.formattedDate = orderDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                data.formattedTime = orderDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });

                setOrderData(data);

                
                if (auth.currentUser) {
                    const fullName = await fetchUserData(auth.currentUser.uid);
                    setUserName(fullName);
                } else {
                    setUserName("Customer");
                }
            } else {
                setError("Order not found");
            }
        } catch (error) {
            console.error("Error fetching order data: ", error);
            setError("Failed to load order data: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const generatePDFHtml = () => {
        if (!orderData) return '';

        const total = orderData.orderTotal || orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Order Ticket - ${displayOrderId}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 0; 
                    padding: 20px; 
                    background: white;
                }
                .ticket { 
                    border: 2px solid #333; 
                    padding: 20px; 
                    max-width: 400px; 
                    margin: 0 auto;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 20px; 
                    border-bottom: 1px solid #333; 
                    padding-bottom: 10px;
                }
                .qr-container { 
                    text-align: center; 
                    margin: 20px 0; 
                    padding: 20px;
                    border: 1px solid #333;
                }
                .order-info { 
                    text-align: center; 
                    margin: 10px 0; 
                }
                .customer-info { 
                    margin: 15px 0; 
                    padding: 10px; 
                    background: #f5f5f5; 
                }
                .items-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 15px 0; 
                }
                .items-table th, .items-table td { 
                    border: 1px solid #333; 
                    padding: 8px; 
                    text-align: left; 
                }
                .items-table th { 
                    background: #f0f0f0; 
                }
                .total { 
                    text-align: right; 
                    font-weight: bold; 
                    font-size: 16px; 
                    margin-top: 15px;
                }
                .footer { 
                    text-align: center; 
                    margin-top: 20px; 
                    font-size: 12px; 
                    color: #666;
                }
                .qr-text {
                    font-family: monospace;
                    background: #f5f5f5;
                    padding: 10px;
                    word-break: break-all;
                    font-size: 10px;
                }
            </style>
        </head>
        <body>
            <div class="ticket">
                <div class="header">
                    <h1>ORDER TICKET</h1>
                </div>
                
                <div class="qr-container">
                    <h3>QR CODE DATA</h3>
                    <div class="qr-text">${displayOrderId}</div>
                    <p>Scan this order ID at pickup</p>
                </div>
                
                <div class="order-info">
                    <p><strong>ORDER ID:</strong> ${displayOrderId}</p>
                    <p><strong>DATE:</strong> ${orderData.formattedDate || 'N/A'}</p>
                    <p><strong>TIME:</strong> ${orderData.formattedTime || 'N/A'}</p>
                </div>
                
                <div class="customer-info">
                    <p><strong>Customer Name:</strong> ${userName}</p>
                    <p><strong>Payment Method:</strong> ${orderData.paymentMethod || 'Cash'}</p>
                    <p><strong>Status:</strong> ${orderData.status || 'To Pay'}</p>
                </div>
                
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Size</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orderData.items.map(item => `
                            <tr>
                                <td>${formatItemDisplayName(item)}</td>
                                <td>${item.size}</td>
                                <td>${item.quantity}</td>
                                <td>₱${item.price}</td>
                                <td>₱${item.price * item.quantity}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="total">
                    TOTAL: ₱${total}
                </div>
                
                <div class="footer">
                    <p>Thank you for your order!</p>
                    <p>Present this ticket at the uniform counter</p>
                </div>
            </div>
        </body>
        </html>
    `;
    };

    const downloadPDF = async () => {
        try {
            const htmlContent = generatePDFHtml();
            const fileName = `order_ticket_${displayOrderId}`;

            await generateAndSharePDF(htmlContent, fileName);

        } catch (error) {
            console.error('Error generating PDF:', error);
            Alert.alert('Error', 'Failed to generate PDF ticket');
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: 'black' }}>Loading ticket...</Text>
                <Text style={{ marginTop: 10, fontSize: 12, color: '#666' }}>Order ID: {displayOrderId}</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: 'red', marginBottom: 10 }}>Error</Text>
                <Text style={{ color: 'black' }}>{error}</Text>
                <TouchableOpacity
                    style={[styles.dlbtn, { marginTop: 20 }]}
                    onPress={() => router.push("/dash_mod/transact")}
                >
                    <Text style={styles.btn_txt}>Back to Transactions</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!orderData) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: 'black' }}>No order data found</Text>
                <TouchableOpacity
                    style={[styles.dlbtn, { marginTop: 20 }]}
                    onPress={() => router.push("/dash_mod/transact")}
                >
                    <Text style={styles.btn_txt}>Back to Transactions</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#FFFBFB" }}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.push("/dash_mod/transact")}>
                        <Ionicons name="close" size={28} color="black" />
                    </TouchableOpacity>
                </View>

                {/* Ticket Preview */}
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.ticketPreview}>
                        <View style={styles.ticket}>
                            <View style={styles.ticketHeader}>
                                <Text style={styles.headerTitle}>ORDER TICKET</Text>
                            </View>

                            {/* QR Code */}
                            <View style={styles.qrContainer}>
                                {displayOrderId && (
                                    <QRCode
                                        value={displayOrderId}
                                        size={200}
                                    />
                                )}
                                <Text style={styles.qrText}>Scan at pickup</Text>
                            </View>

                            {/* Order Info */}
                            <View style={styles.orderInfo}>
                                <Text style={[styles.infoText, { color: 'black' }]}><Text style={styles.label}>ORDER ID:</Text> {displayOrderId}</Text>
                                <Text style={[styles.infoText, { color: 'black' }]}><Text style={styles.label}>DATE:</Text> {orderData.formattedDate}</Text>
                                <Text style={[styles.infoText, { color: 'black' }]}><Text style={styles.label}>TIME:</Text> {orderData.formattedTime}</Text>
                            </View>

                            {/* Customer Info */}
                            <View style={styles.customerInfo}>
                                <Text style={[styles.infoText, { color: 'black' }]}><Text style={styles.label}>Customer Name:</Text> {userName}</Text>
                                <Text style={[styles.infoText, { color: 'black' }]}><Text style={styles.label}>Payment Method:</Text> {orderData.paymentMethod || 'Cash'}</Text>
                                <Text style={[styles.infoText, { color: 'black' }]}><Text style={styles.label}>Status:</Text> {orderData.status || 'To Pay'}</Text>
                            </View>

                            {/* Items */}
                            <View style={styles.itemsContainer}>
                                <Text style={styles.sectionTitle}>Order Items</Text>
                                {orderData.items.map((item, index) => (
                                    <View key={index} style={styles.itemRow}>
                                        <View style={styles.itemLeft}>
                                            {/* UPDATED: Display formatted name instead of itemCode */}
                                            <Text style={styles.itemName}>{formatItemDisplayName(item)}</Text>
                                            <Text style={styles.itemDetails}>Size: {item.size} | Qty: {item.quantity}</Text>
                                        </View>
                                        <Text style={styles.itemPrice}>₱{item.price * item.quantity}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Total */}
                            <View style={styles.totalContainer}>
                                <Text style={styles.totalText}>
                                    TOTAL: ₱{orderData.orderTotal || orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
                                </Text>
                            </View>

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Thank you for your order!</Text>
                                <Text style={styles.footerSubtext}>Present this ticket at the uniform counter</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* Download Button */}
                <View style={styles.btn_cont}>
                    <TouchableOpacity style={styles.dlbtn} onPress={downloadPDF}>
                        <Image
                            source={require("../../assets/images/icons/gen_icons/download.png")}
                            style={styles.icon_img}
                        />
                        <Text style={styles.btn_txt}>Download Ticket</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        marginVertical: 20,
    },
    ticketPreview: {
        alignItems: 'center',
        marginBottom: 20,
    },
    ticket: {
        borderWidth: 2,
        borderColor: '#333',
        padding: 20,
        backgroundColor: 'white',
        width: '100%',
        maxWidth: 400,
        borderRadius: 10,
    },
    ticketHeader: {
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    qrContainer: {
        alignItems: 'center',
        marginVertical: 20,
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
    },
    qrText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
    },
    orderInfo: {
        alignItems: 'center',
        marginVertical: 10,
    },
    customerInfo: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        marginVertical: 10,
        borderRadius: 8,
    },
    infoText: {
        fontSize: 14,
        marginVertical: 3,
    },
    label: {
        fontWeight: '600',
        color: '#333',
    },
    itemsContainer: {
        marginVertical: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        color: '#333',
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    itemLeft: {
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    itemDetails: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: '#61C35C',
    },
    totalContainer: {
        alignItems: 'flex-end',
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 2,
        borderTopColor: '#333',
    },
    totalText: {
        fontWeight: 'bold',
        fontSize: 18,
        color: '#61C35C',
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    footerText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    footerSubtext: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
        textAlign: 'center',
    },
    btn_cont: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 35,
    },
    dlbtn: {
        backgroundColor: '#61C35C',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        width: 200,
        height: 50,
        gap: 10
    },
    icon_img: {
        height: 20,
        width: 20
    },
    btn_txt: {
        fontWeight: '500',
        fontSize: 16,
        color: 'white'
    }
});