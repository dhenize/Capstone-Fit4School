//../../dash_mod/uniforms.jsx
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
import Checkbox from "expo-checkbox";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db, auth } from "../../firebase";
import { collection, getDocs, query, where, deleteDoc, getDoc, updateDoc, serverTimestamp, doc } from "firebase/firestore";
import QRCode from "react-native-qrcode-svg";

export default function Transact() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("appointments");
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const [cartItems, setCartItems] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [currentQrValue, setCurrentQrValue] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Load cart items from AsyncStorage
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      if (!auth.currentUser) return;

      // 1. Load from Firestore (main source of truth)
      const q = query(
        collection(db, "cartItems"),
        where("requestedBy", "==", auth.currentUser.uid),
        where("status", "==", "pending")
      );

      const querySnapshot = await getDocs(q);
      const firestoreCartItems = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Extract individual items from the items array
        if (data.items && Array.isArray(data.items)) {
          data.items.forEach(item => {
            firestoreCartItems.push({
              ...item,
              firestoreId: doc.id, // Same Firestore document ID for all items in this cart
              cartId: item.cartId
            });
          });
        }
      });

      console.log("Cart items from Firestore:", firestoreCartItems);

      // 2. Also load from AsyncStorage for fallback
      const storedCart = await AsyncStorage.getItem("cart");
      const localCart = storedCart ? JSON.parse(storedCart) : [];

      // 3. Merge both sources (prioritize Firestore)
      const mergedCart = [...firestoreCartItems];

      // Add any local items that aren't in Firestore
      localCart.forEach(localItem => {
        const existsInFirestore = firestoreCartItems.some(
          firestoreItem => firestoreItem.cartId === localItem.cartId
        );
        if (!existsInFirestore) {
          mergedCart.push(localItem);
        }
      });

      setCartItems(mergedCart);
      setSelectedItems([]);

    } catch (error) {
      console.error("Failed to load cart from Firestore: ", error);
      // Fallback to just AsyncStorage if Firestore fails
      try {
        const storedCart = await AsyncStorage.getItem("cart");
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);
          setCartItems(parsedCart);
          setSelectedItems([]);
        }
      } catch (localError) {
        console.error("Failed to load local cart: ", localError);
      }
    }
  };


  // Fetch transactions from Firestore
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!auth.currentUser) return;

      try {
        const q = query(
          collection(db, "cartItems"),
          where("requestedBy", "==", auth.currentUser.uid),
          where("status", "in", ["To Pay", "To Receive"]) // ONLY ACTIVE ORDERS
        );

        const querySnapshot = await getDocs(q);
        const fetchedAppointments = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const items = data.items || [data.item];

          fetchedAppointments.push({
            id: doc.id,
            items: items,
            date: data.date || null,
            paymentMethod: data.paymentMethod || "cash",
            orderTotal: data.orderTotal || "0",
            status: data.status,
            createdAt: data.createdAt,
          });
        });

        // Sort by creation date - most recent first
        fetchedAppointments.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.date);
          const dateB = b.createdAt?.toDate?.() || new Date(b.date);
          return dateB - dateA; // Descending order
        });

        setAppointments(fetchedAppointments);
      } catch (error) {
        console.error("Error fetching appointments: ", error);
      }
    };

    fetchAppointments();
  }, []);

  // Handle item selection
  const toggleItemSelection = (cartId) => {
    setSelectedItems(prev => {
      if (prev.includes(cartId)) {
        return prev.filter(id => id !== cartId);
      } else {
        return [...prev, cartId];
      }
    });
  };

  // Handle select all
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      const allIds = cartItems.map(item => item.cartId);
      setSelectedItems(allIds);
    }
    setSelectAll(!selectAll);
  };



  // In transact.jsx - Update the deleteItem function:

  const deleteItem = async (index) => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to remove this item from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const itemToDelete = cartItems[index];

            try {
              // 1. Delete from Firestore if it exists there
              if (itemToDelete.firestoreId) {
                const cartDocRef = doc(db, "cartItems", itemToDelete.firestoreId);
                const cartDoc = await getDoc(cartDocRef);

                if (cartDoc.exists()) {
                  const cartData = cartDoc.data();

                  // Remove the item from the array
                  const updatedItems = cartData.items.filter(item =>
                    item.cartId !== itemToDelete.cartId
                  );

                  if (updatedItems.length === 0) {
                    // If no items left, delete the entire cart document
                    await deleteDoc(cartDocRef);
                    console.log("Cart document deleted (no items left)");
                  } else {
                    // Update the cart document with remaining items
                    const updatedTotal = updatedItems.reduce((total, item) => total + (item.price * item.quantity), 0);

                    await updateDoc(cartDocRef, {
                      items: updatedItems,
                      orderTotal: updatedTotal,
                      updatedAt: serverTimestamp()
                    });

                    console.log("Item removed from Firestore cart");
                  }
                }
              }

              // 2. Delete from local storage
              const updatedCart = [...cartItems];
              updatedCart.splice(index, 1);
              setCartItems(updatedCart);
              await AsyncStorage.setItem("cart", JSON.stringify(updatedCart));

              // 3. Update selected items
              setSelectedItems(prev => prev.filter(id => id !== itemToDelete.cartId));

              console.log("Item deleted successfully from all sources");

            } catch (error) {
              console.error("Error deleting item:", error);
              Alert.alert("Error", "Failed to delete item from cart");
            }
          }
        }
      ]
    );
  };

  // Edit item in cart
  const openEditModal = (item, index) => {
    setEditingItem({ ...item, index });
    setEditModalVisible(true);
  };


  const saveEditedItem = async (updatedItem) => {
    try {
      // 1. Update Firestore if the item exists there
      if (updatedItem.firestoreId) {
        const cartDocRef = doc(db, "cartItems", updatedItem.firestoreId);
        const cartDoc = await getDoc(cartDocRef);

        if (cartDoc.exists()) {
          const cartData = cartDoc.data();

          // Find and update the specific item in the items array
          const updatedItems = cartData.items.map(item =>
            item.cartId === updatedItem.cartId ? updatedItem : item
          );

          // Recalculate total
          const updatedTotal = updatedItems.reduce((total, item) => total + (item.price * item.quantity), 0);

          // Update Firestore
          await updateDoc(cartDocRef, {
            items: updatedItems,
            orderTotal: updatedTotal,
            updatedAt: serverTimestamp()
          });

          console.log("✅ Cart updated in Firestore");
        }
      }

      // 2. Update local storage
      const updatedCart = [...cartItems];
      updatedCart[editingItem.index] = updatedItem;
      setCartItems(updatedCart);
      await AsyncStorage.setItem("cart", JSON.stringify(updatedCart));

      setEditModalVisible(false);
      setEditingItem(null);

      console.log("Item updated successfully in all sources");

    } catch (error) {
      console.error("Error updating item:", error);
      Alert.alert("Error", "Failed to update item");
    }
  };

  const canCheckout = selectedItems.length > 0;

  const openQrModal = (docId) => {
    setCurrentQrValue(docId);
    setQrModalVisible(true);
  };

  const closeQrModal = () => {
    setQrModalVisible(false);
    setCurrentQrValue("");
  };

  // Format date for display
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

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFBFB" }}>
      <View style={styles.titlebox}>
        <Text style={styles.title}>Transaction</Text>
      </View>

      <View style={styles.tabs_cont}>
        {/* Tabs */}
        <View style={styles.srbtn_cont}>
          <TouchableOpacity onPress={() => setActiveTab("appointments")}>
            <View
              style={[
                styles.sysbtn,
                activeTab === "appointments" && styles.activeBtn,
              ]}
            >
              <Text
                style={[
                  styles.sysbtn_txt,
                  activeTab === "appointments" && styles.activeBtnText,
                ]}
              >
                Transactions
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveTab("mycart")}>
            <View
              style={[
                styles.rembtn,
                activeTab === "mycart" && styles.activeBtn,
              ]}
            >
              <Text
                style={[
                  styles.rembtn_txt,
                  activeTab === "mycart" && styles.activeBtnText,
                ]}
              >
                My Cart
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Select All Checkbox - Only show in My Cart tab */}
        {activeTab === "mycart" && cartItems.length > 0 && (
          <View style={styles.selectAllContainer}>
            <Checkbox
              value={selectAll}
              onValueChange={toggleSelectAll}
              color={selectAll ? "#49454F" : undefined}
            />
            <Text style={styles.selectAllText}>Select All</Text>
          </View>
        )}

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
          {activeTab === "appointments" ? (
            appointments.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No transactions yet</Text>
                <Text style={styles.emptyStateSubtext}>Your completed orders will appear here</Text>
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
                        <Text style={styles.orderId}>Order ID: {transaction.id}</Text>
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
                      <Text style={styles.orderTotal}>₱{transaction.orderTotal}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Payment Method:</Text>
                      <Text style={styles.paymentMethod}>{transaction.paymentMethod}</Text>
                    </View>
                  </View>

                  {/* Action Button */}
                  <TouchableOpacity
                    style={styles.viewTicketBtn}
                    onPress={() => router.push({
                      pathname: "/transact_mod/ticket_gen",
                      params: { orderId: transaction.id }
                    })}
                  >
                    <Text style={styles.viewTicketText}>View Ticket</Text>
                  </TouchableOpacity>
                </View>
              ))
            )
          ) : (
            // MY CART TAB
            cartItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Your cart is empty</Text>
                <Text style={styles.emptyStateSubtext}>Add items to get started</Text>
              </View>
            ) : (
              cartItems.map((item, index) => (
                <View key={item.cartId || index} style={styles.cartItem}>
                  {/* Checkbox for selection */}
                  <Checkbox
                    value={selectedItems.includes(item.cartId)}
                    onValueChange={() => toggleItemSelection(item.cartId)}
                    color={selectedItems.includes(item.cartId) ? "#49454F" : undefined}
                    style={styles.cartCheckbox}
                  />

                  <Image source={{ uri: item.imageUrl }} style={styles.cartItemImage} />

                  <View style={styles.cartItemContent}>
                    <View style={styles.cartItemHeader}>
                      <View>
                        <Text style={styles.cartItemName}>{item.itemCode}</Text>
                        <Text style={styles.cartItemSize}>{item.size}</Text>
                        <Text style={styles.cartItemPrice}>₱{item.price}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.cartItemDetails}>
                      <Text style={styles.cartItemQuantity}>Quantity: {item.quantity}</Text>
                      <Text style={styles.cartItemTotal}>Total: ₱{item.price * item.quantity}</Text>
                    </View>

                    {/* Edit and Delete Buttons */}
                    <View style={styles.cartActionButtons}>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => openEditModal(item, index)}
                      >
                        <Text style={styles.editBtnText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => deleteItem(index)}
                      >
                        <Text style={styles.deleteBtnText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )
          )}
        </ScrollView>
      </View>

      {/* Checkout Button - Only show when items are selected in My Cart */}
      {activeTab === "mycart" && canCheckout && (
        <TouchableOpacity
          onPress={() => {
            const selectedCartItems = cartItems.filter(item =>
              selectedItems.includes(item.cartId)
            );
            router.push({
              pathname: "/transact_mod/checkout",
              params: { selectedItems: JSON.stringify(selectedCartItems) }
            });
          }}
        >
          <View style={styles.checkoutBtn}>
            <Image
              source={require("../../assets/images/icons/gen_icons/checkout-bag.png")}
              style={styles.checkoutIcon}
            />
            <Text style={styles.checkoutText}>
              Checkout ({selectedItems.length})
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* History Button - Only show in Transactions tab */}
      {activeTab === "appointments" && (
        <TouchableOpacity
          onPress={() => router.push("/transact_mod/history")}
        >
          <View style={styles.hisbtn}>
            <Image
              source={require("../../assets/images/icons/gen_icons/history.png")}
              style={styles.his_pic}
            />
          </View>
        </TouchableOpacity>
      )}

      {/* QR Modal */}
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

      {/* Edit Item Modal */}
      <EditCartModal
        visible={editModalVisible}
        item={editingItem}
        onSave={saveEditedItem}
        onClose={() => {
          setEditModalVisible(false);
          setEditingItem(null);
        }}
      />
    </View>
  );
}


const EditCartModal = ({ visible, item, onSave, onClose }) => {
  const [selectSize, setSelectSize] = useState(item?.size || null);
  const [qty, setQty] = useState(item?.quantity || 1);

  if (!item) return null;

  // FIX: Get sizes from the item data properly
  // The sizes should come from the uniform data stored in the item
  const sizes = item.sizes ? Object.keys(item.sizes) : ["Small", "Medium", "Large"];

  // FIX: Get price for selected size - handle both cases
  const getPriceForSize = (size) => {
    if (item.sizes && item.sizes[size]) {
      return item.sizes[size].price; // NEW: Access price property
    } else {
      // Fallback: use the original price if sizes data is missing
      return item.price || 0;
    }
  };

  const price = selectSize ? getPriceForSize(selectSize) : (item.price || 0);

  const handleSave = () => {
    const updatedItem = {
      ...item,
      size: selectSize,
      quantity: qty,
      price: price, // Use the calculated price
      totalPrice: price * qty
    };
    onSave(updatedItem);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modal_overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modal_cont}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Item</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="black" />
                </TouchableOpacity>
              </View>

              <View style={styles.matc_cont}>
                <Image source={{ uri: item.imageUrl }} style={styles.matc_pic} />
                <View style={styles.matc_desc}>
                  <Text style={styles.matc_prc}>₱{price}</Text>
                  <Text style={styles.matc_item_desc}>{item.itemCode} ({item.grdLevel})</Text>
                </View>
              </View>

              <Text style={{ fontSize: 16, fontWeight: '600', marginTop: '8%' }}>Size</Text>
              <ScrollView style={{ maxHeight: 160 }}>
                <View style={styles.matc_sizes_cont}>
                  {sizes.map((size) => {
                    const sizePrice = getPriceForSize(size);
                    return (
                      <TouchableOpacity
                        key={size}
                        onPress={() => setSelectSize(size)}
                        style={[styles.matc_sizes_btn, selectSize === size && styles.setSelectSize]}
                      >
                        <Text style={{ fontWeight: '500', fontSize: 14, color: selectSize === size ? 'white' : 'black' }}>
                          {size}
                        </Text>
                        <Text style={{ fontSize: 10, color: selectSize === size ? 'white' : '#666' }}>
                          ₱{sizePrice}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <View style={styles.matc_qty_cont}>
                <Text style={{ fontWeight: '600', fontSize: 16 }}>Quantity</Text>
                <View style={styles.matc_btn_cont}>
                  <TouchableOpacity onPress={() => setQty(Math.max(1, qty - 1))} style={styles.matc_qty_btn}>
                    <Text style={styles.matc_qty_desc}>-</Text>
                  </TouchableOpacity>
                  <View style={styles.matc_qty_btn}>
                    <Text style={styles.matc_qty_desc}>{qty}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setQty(qty + 1)} style={styles.matc_qty_btn}>
                    <Text style={styles.matc_qty_desc}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.matc_btn, !selectSize && styles.disabledBtn]}
                onPress={handleSave}
                disabled={!selectSize}
              >
                <Text style={{ fontSize: 20, color: "white", fontWeight: "600" }}>
                  Save Changes - ₱{price * qty}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // TITLE CONTAINER
  titlebox: {
    justifyContent: "flex-start",
    alignContent: "center",
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

  // TRANSACTIONS TAB STYLES
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

  // UPDATED ORDER HEADER STYLES - Status above Date
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
    marginTop: 8, // Add space between status and date
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8, // Space between status and date
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

  viewTicketBtn: {
    backgroundColor: "#61C35C",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },

  viewTicketText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },

  // MY CART TAB STYLES
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 8,
  },

  selectAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: "#333",
  },

  cartItem: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },

  cartCheckbox: {
    marginRight: 12,
  },

  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },

  cartItemContent: {
    flex: 1,
  },

  cartItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },

  cartItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F72AD",
    marginBottom: 4,
  },

  cartItemSize: {
    fontSize: 14,
    color: "#666",
  },

  cartItemPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#61C35C",
  },

  cartItemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  cartItemQuantity: {
    fontSize: 14,
    color: "#666",
  },

  cartItemTotal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },

  cartActionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },

  editBtn: {
    backgroundColor: "#0FAFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },

  editBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },

  deleteBtn: {
    backgroundColor: "#FFD5D5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },

  deleteBtnText: {
    color: "#FF6767",
    fontSize: 12,
    fontWeight: "600",
  },

  // BUTTONS
  checkoutBtn: {
    position: "absolute",
    height: 65,
    width: 65,
    backgroundColor: "#61C35C",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
    bottom: 20,
    right: 20
  },

  checkoutIcon: {
    height: 30,
    width: 30,
  },

  checkoutText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
    textAlign: 'center',
    marginTop: 2,
  },

  hisbtn: {
    position: "absolute",
    height: 65,
    width: 65,
    backgroundColor: "#61C35C",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
    bottom: 20,
    right: 20
  },

  his_pic: {
    height: 40,
    width: 40,
  },

  // MODAL STYLES (keep existing modal styles)
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

  // Keep all existing modal styles from your original code...
  modal_overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  modal_cont: {
    alignContent: 'center',
    backgroundColor: '#FFFBFB',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingVertical: '7%',
    paddingHorizontal: '10%',
    height: '65%',
  },

  matc_cont: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },

  matc_pic: {
    height: 90,
    width: 90,
    borderRadius: 10,
  },

  matc_prc: {
    color: "#61C35C",
    fontWeight: "600",
    fontSize: 26,
  },

  matc_item_desc: {
    fontWeight: "400",
    fontSize: 16,
  },

  matc_sizes_cont: {
    justifyContent: 'space-between',
    flexWrap: "wrap",
    flexDirection: 'row',
    paddingVertical: '3%',
  },

  matc_sizes_btn: {
    marginVertical: '1%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 5,
    width: 90,
    height: 32,
    borderColor: "#ccc"
  },

  setSelectSize: {
    backgroundColor: "#61C35C",
    borderColor: "#61C35C"
  },

  matc_qty_cont: {
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingVertical: '8%',
  },

  matc_btn_cont: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: '3%',
  },

  matc_qty_btn: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 35,
    width: 35,
    borderWidth: 1,
  },

  matc_qty_desc: {
    fontSize: 20,
    fontWeight: '400',
  },

  matc_btn: {
    backgroundColor: "#61C35C",
    alignItems: "center",
    justifyContent: "center",
    height: 55,
    width: 'auto',
    borderRadius: 5,
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },

  disabledBtn: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
});