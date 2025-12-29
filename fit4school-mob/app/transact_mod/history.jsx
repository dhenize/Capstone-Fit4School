import { View, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from "react-native";
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function History() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("completed");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    if (!auth.currentUser) {
      console.log("No authenticated user");
      return;
    }

    try {
      setLoading(true);
      let statusFilter = [];

      switch (activeTab) {
        case "completed":
          statusFilter = ["Completed", "completed", "Delivered", "delivered"];
          break;
        case "cancelled":
          statusFilter = ["Cancelled", "cancelled", "void", "Void", "Failed", "failed"];
          break;
      }

      console.log(`Fetching ${activeTab} orders for user:`, auth.currentUser.uid);
      console.log("Status filter:", statusFilter);

      
      const q = query(
        collection(db, "cartItems"),
        where("requestedBy", "==", auth.currentUser.uid),
        where("status", "in", statusFilter)
      );

      const querySnapshot = await getDocs(q);
      console.log(`Query returned ${querySnapshot.size} documents from cartItems`);

      const fetchedOrders = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        
        let items = [];
        if (Array.isArray(data.items)) {
          items = data.items;
        } else if (data.itemCode) {
          
          items = [{
            id: doc.id,
            itemCode: data.itemCode || "N/A",
            category: data.category || "N/A",
            gender: data.gender || "N/A",
            grdLevel: data.grdLevel || "N/A",
            imageUrl: data.imageUrl || "",
            price: data.price || 0,
            quantity: data.quantity || 1,
            size: data.size || "N/A"
          }];
        }

        if (items.length > 0) {
          fetchedOrders.push({
            id: doc.id,
            items: items,
            orderId: data.orderId || doc.id,
            date: data.date || data.createdAt,
            paymentMethod: data.paymentMethod || "cash",
            orderTotal: data.orderTotal || data.price || 0,
            status: data.status,
            createdAt: data.createdAt,
            cancelledAt: data.cancelledAt,
            cancellationReason: data.cancellationReason
          });
        }
      });

      
      fetchedOrders.sort((a, b) => {
        try {
          const dateA = a.createdAt?.toDate?.() || new Date(a.date || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.date || 0);
          return dateB - dateA; 
        } catch (error) {
          console.error("Error sorting dates:", error);
          return 0;
        }
      });

      console.log(`Successfully fetched ${fetchedOrders.length} ${activeTab} orders`);
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Error fetching history orders: ", error);
      console.error("Error details:", error.message);
      if (error.code === 'failed-precondition') {
        console.log("Firestore index required. Please create the composite index in Firebase Console.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'completed': 
      case 'delivered': return '#61C35C';
      case 'cancelled': 
      case 'void': 
      case 'failed': return '#FF6767';
      default: return '#666';
    }
  };

  const getStatusText = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'completed': 
      case 'delivered': return 'Completed';
      case 'cancelled': 
      case 'void': 
      case 'failed': return 'Cancelled';
      default: return status || 'Unknown';
    }
  };

  
  const canDownloadTicket = (status) => {
    const statusLower = status?.toLowerCase();
    return !['completed', 'cancelled', 'void', 'failed', 'delivered'].includes(statusLower);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFBFB" }}>
      {/* Header */}
      <View style={styles.titlebox}>
        <TouchableOpacity onPress={() => router.push("/dash_mod/account")}>
          <Ionicons name="arrow-back-outline" size={26} color="white" style={{ marginHorizontal: "2%" }} />
        </TouchableOpacity>
        <Text style={styles.title}>Order History</Text>
      </View>

      {/* Main Container */}
      <View style={styles.tabs_cont}>
        {/* Tabs */}
        <View style={styles.srbtn_cont}>
          <TouchableOpacity onPress={() => setActiveTab("completed")}>
            <View
              style={[
                styles.sysbtn,
                activeTab === "completed" && styles.activeBtn,
              ]}
            >
              <Text
                style={[
                  styles.sysbtn_txt,
                  activeTab === "completed" && styles.activeBtnText,
                ]}
              >
                Completed
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveTab("cancelled")}>
            <View
              style={[
                styles.rembtn,
                activeTab === "cancelled" && styles.activeBtn,
              ]}
            >
              <Text
                style={[
                  styles.rembtn_txt,
                  activeTab === "cancelled" && styles.activeBtnText,
                ]}
              >
                Cancelled
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#61C35C" />
              <Text style={styles.emptyStateText}>Loading orders...</Text>
            </View>
          ) : orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No {activeTab} orders</Text>
              <Text style={styles.emptyStateSubtext}>
                Your {activeTab} orders will appear here
              </Text>
            </View>
          ) : (
            orders.map((order) => (
              <View key={order.id} style={styles.transactionCard}>
                {/* Order Header - Status above Date */}
                <View style={styles.orderHeader}>
                  <View style={styles.orderHeaderLeft}>
                    {/* Status Badge - Now at the top */}
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                    </View>
                    {/* Date and Order ID below status */}
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderDate}>
                        {formatDate(order.createdAt)}
                      </Text>
                      <Text style={styles.orderId}>Order ID: {order.orderId || order.id.substring(0, 8)}...</Text>
                    </View>
                  </View>
                </View>

                {/* Cancellation Reason (if applicable) */}
                {(order.status?.toLowerCase() === 'cancelled' || order.status?.toLowerCase() === 'void' || order.status?.toLowerCase() === 'failed') && order.cancellationReason && (
                  <View style={styles.cancellationBox}>
                    <Text style={styles.cancellationLabel}>Cancellation Reason:</Text>
                    <Text style={styles.cancellationReason}>{order.cancellationReason}</Text>
                    {order.cancelledAt && (
                      <Text style={styles.cancellationDate}>
                        Cancelled on: {formatDate(order.cancelledAt)}
                      </Text>
                    )}
                  </View>
                )}

                {/* Order Items */}
                <View style={styles.itemsSection}>
                  <Text style={styles.sectionTitle}>Items</Text>
                  {order.items && order.items.map((item, idx) => (
                    <View key={idx} style={styles.orderItem}>
                      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemName}>{item.itemCode}</Text>
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
                    <Text style={styles.orderTotal}>₱{order.orderTotal}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Payment Method:</Text>
                    <Text style={styles.paymentMethod}>{order.paymentMethod}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.viewTicketBtn,
                      !canDownloadTicket(order.status) && styles.disabledBtn
                    ]}
                    onPress={() => {
                      if (canDownloadTicket(order.status)) {
                        router.push({
                          pathname: "/transact_mod/ticket_gen",
                          params: { orderId: order.id }
                        });
                      }
                    }}
                    disabled={!canDownloadTicket(order.status)}
                  >
                    <Text style={styles.viewTicketText}>
                      {canDownloadTicket(order.status) ? "View Ticket" : "Ticket Unavailable"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
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
    marginLeft: 10,
  },

  
  tabs_cont: {
    padding: "7%",
    flex: 1,
    backgroundColor: "#FFFBFB",
  },

  scrollContent: {
    paddingBottom: 20,
  },

  
  srbtn_cont: {
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  sysbtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D9D9D9",
    height: 35,
    width: 155,
    borderRadius: 5,
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  rembtn: {
    alignItems: "center",
    justifyContent: "center",
    alignContent: "center",
    backgroundColor: "#D9D9D9",
    height: 35,
    width: 155,
    borderRadius: 5,
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  sysbtn_txt: {
    fontWeight: "600",
  },

  rembtn_txt: {
    fontWeight: "600",
  },

  activeBtn: {
    backgroundColor: "#0FAFFF"
  },

  activeBtnText: {
    color: "white"
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

  
  cancellationBox: {
    backgroundColor: "#FFF0F0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#FF6767",
  },

  cancellationLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF6767",
    marginBottom: 4,
  },

  cancellationReason: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },

  cancellationDate: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
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

  
  disabledBtn: {
    backgroundColor: "#ccc",
    opacity: 0.6,
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
});