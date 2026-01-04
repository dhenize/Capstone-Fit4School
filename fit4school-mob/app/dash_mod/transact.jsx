import React, { useState, useEffect } from "react";
import { TouchableWithoutFeedback, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Text } from "../../components/globalText";
import { db, auth } from "../../firebase";
import { collection, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import QRCode from "react-native-qrcode-svg";

export default function Transact() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [currentQrValue, setCurrentQrValue] = useState("");

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

  // Fetch appointments/transactions
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!auth.currentUser) return;

      try {
        const q = query(
          collection(db, "cartItems"),
          where("requestedBy", "==", auth.currentUser.uid),
          where("status", "in", ["To Pay", "To Receive"]) 
        );

        const querySnapshot = await getDocs(q);
        const fetchedAppointments = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const items = data.items || [data.item];
          
          // Use custom order ID if available, otherwise use Firestore document ID
          const orderId = data.orderId || doc.id;

          fetchedAppointments.push({
            id: doc.id,
            orderId: orderId, 
            items: items,
            date: data.date || null,
            paymentMethod: data.paymentMethod || "cash",
            orderTotal: data.orderTotal || "0",
            status: data.status,
            createdAt: data.createdAt,
          });
        });

        // Sort appointments by date (newest first)
        fetchedAppointments.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.date);
          const dateB = b.createdAt?.toDate?.() || new Date(b.date);
          return dateB - dateA; 
        });

        setAppointments(fetchedAppointments);
      } catch (error) {
        console.error("Error fetching appointments: ", error);
      }
    };

    fetchAppointments();
  }, []);

  const openQrModal = (orderId) => {
    setCurrentQrValue(orderId);
    setQrModalVisible(true);
  };

  const closeQrModal = () => {
    setQrModalVisible(false);
    setCurrentQrValue("");
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '#61C35C';
      case 'to receive': return '#FFA500';
      case 'to pay': return '#0FAFFF';
      default: return '#666';
    }
  };

  // Handle cancel order
  const handleCancelOrder = (orderId) => {
    router.push({
      pathname: "/transact_mod/cancel",
      params: { orderId: orderId }
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFBFB" }}>
      <View style={styles.titlebox}>
        <TouchableOpacity onPress={() => router.push("/dash_mod/home")}>
          <Ionicons name="arrow-back-outline" size={26} color="white" style={{ marginHorizontal: "2%" }} />
        </TouchableOpacity>
        <Text style={styles.title}>Orders</Text>
      </View>

      <View style={styles.tabs_cont}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
          {appointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No orders yet</Text>
              <Text style={styles.emptyStateSubtext}>Your orders will appear here</Text>
            </View>
          ) : (
            appointments.map((transaction, index) => (
              <View key={index} style={styles.transactionCard}>
                {/* Order Header - Status above Date */}
                <View style={styles.orderHeader}>
                  <View style={styles.orderHeaderLeft}>
                    {/* Status Badge - Now at the top */}
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) }]}>
                      <Text style={styles.statusText}>{transaction.status}</Text>
                    </View>
                    {/* Date and Order ID below status */}
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderDate}>
                        {formatDate(transaction.createdAt)}
                      </Text>
                      {/* Display custom order ID instead of Firestore ID */}
                      <Text style={styles.orderId}>Order ID: {transaction.orderId}</Text>
                    </View>
                  </View>
                </View>

                {/* Order Items */}
                <View style={styles.itemsSection}>
                  <Text style={styles.sectionTitle}>Items</Text>
                  {transaction.items.map((item, idx) => (
                    <View key={idx} style={styles.orderItem}>
                      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                      <View style={styles.itemDetails}>
                        {/* UPDATED: Display formatted name instead of itemCode */}
                        <Text style={styles.itemName}>{formatItemDisplayName(item)}</Text>
                        <Text style={styles.itemSize}>Size: {item.size}</Text>
                        <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                      </View>
                      <Text style={styles.itemPrice}>₱{item.price}</Text>
                    </View>
                  ))}
                </View>

                {/* Order Summary */}
                <View style={styles.orderSummary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Order Total:</Text>
                    <Text style={styles.orderTotal}>₱{transaction.orderTotal}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Payment Method:</Text>
                    <Text style={styles.paymentMethod}>{transaction.paymentMethod}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.viewTicketBtn}
                    onPress={() => router.push({
                      pathname: "/transact_mod/ticket_gen",
                      params: { 
                        orderId: transaction.id, 
                        customOrderId: transaction.orderId 
                      }
                    })}
                  >
                    <Text style={styles.viewTicketText}>View Ticket</Text>
                  </TouchableOpacity>
                  
                  {/* Cancel Button - Only show for "To Pay" status */}
                  {transaction.status === "To Pay" && (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleCancelOrder(transaction.id)}
                    >
                      <Text style={styles.cancelText}>Cancel Order</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* QR Modal - Updated to show custom order ID */}
      <Modal
        visible={qrModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeQrModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalContainer}>
            <View style={styles.qrModalHeader}>
              <TouchableOpacity onPress={closeQrModal}>
                <Ionicons name="arrow-back-outline" size={28} color="black" />
              </TouchableOpacity>
              <Text style={styles.qrModalTitle}>Order Ticket</Text>
              <View style={{ width: 28 }} />
            </View>

            <View style={styles.qrModalContent}>
              {currentQrValue ? (
                <QRCode value={currentQrValue} size={250} />
              ) : (
                <Text style={{ fontSize: 16, color: "#333" }}>No QR data</Text>
              )}
              <Text style={styles.qrOrderId}>Order ID: {currentQrValue}</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
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

  tabs_cont: {
    padding: "7%",
    flex: 1,
    backgroundColor: "#FFFBFB",
  },

  scrollContent: {
    paddingBottom: 20,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
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

  transactionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },

  orderHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  orderHeaderLeft: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },

  orderInfo: {
    marginTop: 8,
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },

  orderDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },

  orderId: {
    fontSize: 12,
    color: "#666",
  },

  itemsSection: {
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },

  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    padding: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },

  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
  },

  itemDetails: {
    flex: 1,
  },

  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F72AD",
    marginBottom: 2,
  },

  itemSize: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },

  itemQuantity: {
    fontSize: 12,
    color: "#666",
  },

  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#61C35C",
  },

  orderSummary: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  summaryLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },

  orderTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#61C35C",
  },

  paymentMethod: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },

  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },

  viewTicketBtn: {
    flex: 1,
    backgroundColor: "#61C35C",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  viewTicketText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },

  cancelBtn: {
    flex: 1,
    backgroundColor: "#FF6B6B",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  cancelText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },

  qrModalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },

  qrModalHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  qrModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
  },

  qrModalContent: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },

  qrOrderId: {
    marginTop: 20,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});