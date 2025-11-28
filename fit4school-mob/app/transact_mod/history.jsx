import { View, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

export default function History() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("completed");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    if (!auth.currentUser) return;

    try {
      let statusFilter = [];

      switch (activeTab) {
        case "completed":
          statusFilter = ["completed"];
          break;
        case "cancelled":
          statusFilter = ["cancelled", "void"];
          break;
        case "returned":
          statusFilter = ["returned"];
          break;
      }

      // Remove the orderBy temporarily to see if that's causing the issue
      const q = query(
        collection(db, "cartItems"),
        where("requestedBy", "==", auth.currentUser.uid),
        where("status", "in", statusFilter)
        // Remove orderBy for now: orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const fetchedOrders = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const items = data.items || [data.item];

        fetchedOrders.push({
          id: doc.id,
          items: items,
          date: data.date || null,
          paymentMethod: data.paymentMethod || "cash",
          orderTotal: data.orderTotal || "0",
          status: data.status,
          createdAt: data.createdAt,
        });
      });

      // Sort manually on the client side
      fetchedOrders.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.date);
        const dateB = b.createdAt?.toDate?.() || new Date(b.date);
        return dateB - dateA;
      });

      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Error fetching history orders: ", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '#61C35C';
      case 'cancelled': return '#FF6767';
      case 'void': return '#FF6767';
      case 'returned': return '#FFA500';
      default: return '#666';
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFBFB" }}>
      {/* Header */}
      <View style={styles.titlebox}>
        <TouchableOpacity onPress={() => router.push("/dash_mod/transact")}>
          <Ionicons name="arrow-back-outline" size={26} color="white" style={{ marginHorizontal: "2%" }} />
        </TouchableOpacity>
        <Text style={styles.title}>Order History</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs_cont}>
        <View style={styles.ccr_btn}>
          <TouchableOpacity onPress={() => setActiveTab("completed")}>
            <View style={[styles.combtn, activeTab === "completed" && styles.activeBtn]}>
              <Text style={[styles.combtn_txt, activeTab === "completed" && styles.activeBtnText]}>
                Completed
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveTab("cancelled")}>
            <View style={[styles.canbtn, activeTab === "cancelled" && styles.activeBtn]}>
              <Text style={[styles.canbtn_txt, activeTab === "cancelled" && styles.activeBtnText]}>
                Cancelled
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveTab("returned")}>
            <View style={[styles.retbtn, activeTab === "returned" && styles.activeBtn]}>
              <Text style={[styles.retbtn_txt, activeTab === "returned" && styles.activeBtnText]}>
                Returned
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Orders List */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
          {loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Loading...</Text>
            </View>
          ) : orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No {activeTab} orders</Text>
              <Text style={styles.emptyStateSubtext}>Your {activeTab} orders will appear here</Text>
            </View>
          ) : (
            orders.map((order) => (
              <View key={order.id} style={styles.notif}>
                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  <Text style={styles.statusText}>{order.status}</Text>
                </View>

                {/* Order Info */}
                <View style={styles.orderHeader}>
                  <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                  <Text style={styles.orderId}>Order ID: {order.id.substring(0, 8)}...</Text>
                </View>

                {/* Order Items */}
                {order.items.map((item, index) => (
                  <View key={index} style={styles.orderItem}>
                    <Image source={{ uri: item.imageUrl }} style={styles.notif_img} />
                    <View style={styles.notif_content}>
                      <View style={styles.rowBetween}>
                        <View>
                          <Text style={styles.itemTitle}>{item.itemCode}</Text>
                          <Text style={styles.itemSubtitle}>Size: {item.size}</Text>
                        </View>
                        <Text style={styles.itemPrice}>₱{item.price}</Text>
                      </View>
                      <View style={[styles.rowBetween, { marginTop: 6 }]}>
                        <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
                        <Text style={styles.itemTotal}>Subtotal: ₱{item.price * item.quantity}</Text>
                      </View>
                    </View>
                  </View>
                ))}

                {/* Order Total */}
                <View style={styles.orderTotal}>
                  <Text style={styles.totalText}>Order Total: ₱{order.orderTotal}</Text>
                  <Text style={styles.paymentMethod}>Payment: {order.paymentMethod}</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.viewTicketBtn}
                    onPress={() => router.push({
                      pathname: "/transact_mod/ticket_gen",
                      params: { orderId: order.id }
                    })}
                  >
                    <Text style={styles.viewTicketText}>View Ticket</Text>
                  </TouchableOpacity>

                  {activeTab === "completed" && (
                    <>
                      <TouchableOpacity style={styles.rebtn} onPress={() => router.push("/transact_mod/his_pt2")}>
                        <Text style={styles.rebtnText}>Return</Text>
                      </TouchableOpacity>
                    </>
                  )}
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
  // TITLE CONTAINER
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

  // OVERALL CONTAINER
  tabs_cont: {
    padding: "7%",
    flex: 1,
    backgroundColor: "#FFFBFB",
  },

  scrollContent: {
    paddingBottom: 20,
  },

  ccr_btn: {
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "space-between",
    paddingVertical: "2%",
    marginBottom: 20,
  },

  combtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D9D9D9",
    height: 35,
    width: 100,
    borderRadius: 5,
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  canbtn: {
    alignItems: "center",
    justifyContent: "center",
    alignContent: "center",
    backgroundColor: "#D9D9D9",
    height: 35,
    width: 100,
    borderRadius: 5,
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  retbtn: {
    alignItems: "center",
    justifyContent: "center",
    alignContent: "center",
    backgroundColor: "#D9D9D9",
    height: 35,
    width: 100,
    borderRadius: 5,
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  combtn_txt: {
    fontWeight: "600",
  },

  canbtn_txt: {
    fontWeight: "600",
  },

  retbtn_txt: {
    fontWeight: "600",
  },

  activeBtn: {
    backgroundColor: "#0FAFFF"
  },

  activeBtnText: {
    color: "white"
  },

  // ORDER CARD STYLES
  notif: {
    marginVertical: "2.5%",
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#F4F4F4",
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },

  orderHeader: {
    marginBottom: 10,
  },

  orderDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },

  orderId: {
    fontSize: 12,
    color: "#666",
  },

  orderItem: {
    flexDirection: "row",
    marginBottom: 10,
    padding: 10,
    backgroundColor: "white",
    borderRadius: 8,
  },

  notif_img: {
    height: 70,
    width: 70,
    resizeMode: "contain",
    marginRight: 10,
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
    fontSize: 14,
    fontWeight: "600",
  },

  itemPrice: {
    color: "#61C35C",
    fontSize: 14,
    fontWeight: "600",
  },

  itemTotal: {
    color: "#1F72AD",
    fontSize: 14,
    fontWeight: "600",
  },

  orderTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },

  totalText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#61C35C",
  },

  paymentMethod: {
    fontSize: 12,
    color: "#666",
  },

  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 10,
  },

  viewTicketBtn: {
    backgroundColor: "#61C35C",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },

  viewTicketText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },

  rebtn: {
    backgroundColor: "#D9D9D9",
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },

  rebtnText: {
    color: "black",
    fontSize: 13,
    fontWeight: "600",
  },

  // EMPTY STATE
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