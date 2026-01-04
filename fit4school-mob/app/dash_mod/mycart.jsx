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

export default function MyCart() {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uniformSizes, setUniformSizes] = useState({});
  const [selectSize, setSelectSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Helper function to format item display name
  const formatItemDisplayName = (item) => {
    if (!item) return 'Unknown Item';
    
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

  // Load cart items
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      if (!auth.currentUser) return;

      // Fetch cart items from Firestore
      const q = query(
        collection(db, "cartItems"),
        where("requestedBy", "==", auth.currentUser.uid),
        where("status", "==", "pending")
      );

      const querySnapshot = await getDocs(q);
      const firestoreCartItems = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        if (data.items && Array.isArray(data.items)) {
          data.items.forEach((item, index) => {
            // Track index for proper deletion
            firestoreCartItems.push({
              ...item,
              firestoreId: doc.id,
              firestoreItemIndex: index,
              cartId: item.cartId || `firestore-${doc.id}-${Date.now()}`
            });
          });
        }
      });

      console.log("Cart items from Firestore (with imageUrl):", firestoreCartItems);

      // Load cart items from AsyncStorage
      const storedCart = await AsyncStorage.getItem("cart");
      const localCart = storedCart ? JSON.parse(storedCart) : [];

      // Create a Map to track unique items based on itemCode + size + quantity
      const uniqueItems = new Map();
      
      // Add Firestore items first
      firestoreCartItems.forEach(item => {
        const key = `${item.itemCode}-${item.size}-${item.quantity}`;
        uniqueItems.set(key, item);
      });

      // Add local items only if they don't exist
      localCart.forEach(localItem => {
        const key = `${localItem.itemCode}-${localItem.size}-${localItem.quantity}`;
        if (!uniqueItems.has(key)) {
          uniqueItems.set(key, localItem);
        }
      });

      // Convert back to array
      const mergedCart = Array.from(uniqueItems.values());

      setCartItems(mergedCart);
      setSelectedItems([]);

    } catch (error) {
      console.error("Failed to load cart from Firestore: ", error);
      
      // Fallback: Load from AsyncStorage only
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

  // Toggle item selection
  const toggleItemSelection = (cartId) => {
    setSelectedItems(prev => {
      if (prev.includes(cartId)) {
        return prev.filter(id => id !== cartId);
      } else {
        return [...prev, cartId];
      }
    });
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      const allIds = cartItems.map(item => item.cartId);
      setSelectedItems(allIds);
    }
    setSelectAll(!selectAll);
  };

  // Delete item from cart
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
              // Delete from Firestore if it exists there
              if (itemToDelete.firestoreId) {
                const cartDocRef = doc(db, "cartItems", itemToDelete.firestoreId);
                const cartDoc = await getDoc(cartDocRef);

                if (cartDoc.exists()) {
                  const cartData = cartDoc.data();

                  // Remove item by index if we have it, otherwise filter by properties
                  let updatedItems;
                  if (itemToDelete.firestoreItemIndex !== undefined) {
                    updatedItems = cartData.items.filter((_, idx) => 
                      idx !== itemToDelete.firestoreItemIndex
                    );
                  } else {
                    // Fallback: filter by properties
                    updatedItems = cartData.items.filter(item =>
                      !(item.itemCode === itemToDelete.itemCode && 
                        item.size === itemToDelete.size && 
                        item.quantity === itemToDelete.quantity)
                    );
                  }

                  if (updatedItems.length === 0) {
                    // Delete the entire cart document if no items left
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

              // Delete from local state and AsyncStorage
              const updatedCart = [...cartItems];
              updatedCart.splice(index, 1);
              setCartItems(updatedCart);
              await AsyncStorage.setItem("cart", JSON.stringify(updatedCart));

              // Remove from selected items
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

  // Open edit modal
  const openEditModal = async (item, index) => {
    try {
      // Fetch the uniform details using itemCode
      const uniformsQuery = query(
        collection(db, "uniforms"),
        where("itemCode", "==", item.itemCode)
      );
      
      const querySnapshot = await getDocs(uniformsQuery);
      
      if (!querySnapshot.empty) {
        const uniformDoc = querySnapshot.docs[0];
        const uniformData = uniformDoc.data();
        const uniformId = uniformDoc.id;
        
        setUniformSizes(uniformData.sizes || {});
        
        // Set the editing item with all necessary data
        setEditingItem({ 
          ...item, 
          index,
          uniformId: uniformId,
          uniformData: {
            category: uniformData.category,
            gender: uniformData.gender,
            grdLevel: uniformData.grdLevel,
            imageUrl: uniformData.imageUrl
          }
        });
        
        // Set current size and quantity
        setSelectSize(item.size);
        setQty(item.quantity);
        setEditModalVisible(true);
      } else {
        Alert.alert("Error", "Uniform details not found");
      }
    } catch (error) {
      console.error("Error fetching uniform details:", error);
      Alert.alert("Error", "Failed to load uniform details");
    }
  };

  // Save edited item
  const saveEditedItem = async () => {
    if (!selectSize) {
      Alert.alert("Select Size", "Please select a size first!");
      return;
    }

    try {
      const price = uniformSizes[selectSize]?.price || editingItem.price;
      const updatedItem = {
        ...editingItem,
        size: selectSize,
        quantity: qty,
        price: price,
        // Update the total price calculation
        totalPrice: price * qty
      };

      // Update in Firestore if it exists there
      if (updatedItem.firestoreId) {
        const cartDocRef = doc(db, "cartItems", updatedItem.firestoreId);
        const cartDoc = await getDoc(cartDocRef);

        if (cartDoc.exists()) {
          const cartData = cartDoc.data();

          // Create normalized item for Firestore WITH imageUrl
          const normalizedItem = {
            addedAt: updatedItem.addedAt || new Date().toISOString(),
            itemCode: updatedItem.itemCode,
            price: price,
            quantity: qty,
            size: selectSize,
            imageUrl: editingItem.uniformData?.imageUrl || updatedItem.imageUrl
          };

          // Update the specific item in the cart using the index
          const updatedItems = [...cartData.items];
          if (updatedItem.firestoreItemIndex !== undefined) {
            updatedItems[updatedItem.firestoreItemIndex] = normalizedItem;
          } else {
            // Fallback: find item by properties
            const itemIndex = updatedItems.findIndex(item => 
              item.itemCode === updatedItem.itemCode && 
              item.size === updatedItem.size
            );
            if (itemIndex !== -1) {
              updatedItems[itemIndex] = normalizedItem;
            }
          }

          // Recalculate total
          const updatedTotal = updatedItems.reduce((total, item) => total + (item.price * item.quantity), 0);

          // Update Firestore document
          await updateDoc(cartDocRef, {
            items: updatedItems,
            orderTotal: updatedTotal,
            updatedAt: serverTimestamp()
          });

          console.log("✅ Cart updated in Firestore");
        }
      }

      // Update local state and AsyncStorage
      const updatedCart = [...cartItems];
      updatedCart[editingItem.index] = updatedItem;
      setCartItems(updatedCart);
      await AsyncStorage.setItem("cart", JSON.stringify(updatedCart));

      setEditModalVisible(false);
      setEditingItem(null);
      setSelectSize(null);
      setQty(1);
      setUniformSizes({});

      console.log("Item updated successfully in all sources");
      Alert.alert("Success", "Item updated successfully!");

    } catch (error) {
      console.error("Error updating item:", error);
      Alert.alert("Error", "Failed to update item");
    }
  };

  const canCheckout = selectedItems.length > 0;

  const handleCheckout = () => {
    if (!canCheckout || isCheckingOut) return;
    
    setIsCheckingOut(true);
    
    try {
      const selectedCartItems = cartItems.filter(item =>
        selectedItems.includes(item.cartId)
      );
      
      console.log("Proceeding to checkout with items:", selectedCartItems.length);
      
      router.push({
        pathname: "/transact_mod/checkout",
        params: { selectedItems: JSON.stringify(selectedCartItems) }
      });
    } catch (error) {
      console.error("Checkout error:", error);
      Alert.alert("Error", "Failed to proceed to checkout");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFBFB" }}>
      <View style={styles.titlebox}>
        <Text style={styles.title}>My Cart</Text>
      </View>

      <View style={styles.tabs_cont}>
        {/* Select All Checkbox */}
        {cartItems.length > 0 && (
          <View style={styles.selectAllContainer}>
            <Checkbox
              value={selectAll}
              onValueChange={toggleSelectAll}
              color={selectAll ? "#49454F" : undefined}
            />
            <Text style={styles.selectAllText}>Select All</Text>
          </View>
        )}

        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {cartItems.length === 0 ? (
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

                <Image 
                  source={{ uri: item.imageUrl }} 
                  style={styles.cartItemImage} 
                />

                <View style={styles.cartItemContent}>
                  <View style={styles.cartItemHeader}>
                    <View>
                      {/* UPDATED: Display formatted name instead of itemCode */}
                      <Text style={styles.cartItemName}>{formatItemDisplayName(item)}</Text>
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
          )}
        </ScrollView>
      </View>

      {/* Checkout Button - Only show when items are selected */}
      {canCheckout && (
        <TouchableOpacity
          style={styles.checkoutBtnContainer}
          activeOpacity={0.6}
          onPress={handleCheckout}
          disabled={isCheckingOut}
        >
          <View style={styles.checkoutBtn}>
            <Image
              source={require("../../assets/images/icons/gen_icons/checkout-bag.png")}
              style={styles.checkoutIcon}
            />
            <Text style={styles.checkoutText}>
              {isCheckingOut ? "Processing..." : `Checkout (${selectedItems.length})`}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Edit Item Modal - EXACTLY like uniforms.jsx */}
      <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setEditModalVisible(false)}>
          <View style={styles.modal_overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modal_cont}>
                <View style={styles.matc_cont}>
                  <Image 
                    source={{ uri: editingItem?.uniformData?.imageUrl || editingItem?.imageUrl }} 
                    style={styles.matc_pic} 
                  />
                  <View style={styles.matc_desc}>
                    <Text style={styles.matc_prc}>
                      ₱{selectSize && uniformSizes[selectSize] ? uniformSizes[selectSize].price : editingItem?.price || 'Select size'}
                    </Text>
                    {/* UPDATED: Display formatted name in modal */}
                    <Text style={styles.matc_item_desc}>
                      {formatItemDisplayName(editingItem)}
                    </Text>
                  </View>
                </View>

                <Text style={{ fontSize: 16, fontWeight: '600', marginTop: '8%' }}>Size</Text>
                <ScrollView style={{ maxHeight: 160 }}>
                  <View style={styles.matc_sizes_cont}>
                    {Object.keys(uniformSizes).map((size) => (
                      <TouchableOpacity
                        key={size}
                        onPress={() => {
                          setSelectSize(size);
                        }}
                        style={[styles.matc_sizes_btn, selectSize === size && styles.setSelectSize]}
                      >
                        <Text style={{ fontWeight: '500', fontSize: 14, color: selectSize === size ? 'white' : 'black' }}>
                          {size}
                        </Text>
                        <Text style={{ fontSize: 10, color: selectSize === size ? 'white' : '#666' }}>
                          ₱{uniformSizes[size] ? uniformSizes[size].price : '0'}
                        </Text>
                      </TouchableOpacity>
                    ))}
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
                  onPress={saveEditedItem}
                  disabled={!selectSize}
                >
                  <Text style={{ fontSize: 20, color: "white", fontWeight: "600" }}>
                    {selectSize ? `Save Changes - ₱${(uniformSizes[selectSize]?.price || editingItem?.price || 0) * qty}` : 'Select size first'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

// Styles remain exactly the same...
const styles = StyleSheet.create({
  titlebox: {
    justifyContent: "flex-start",
    alignContent: "center",
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
    paddingBottom: 100, // Add more padding at bottom for the checkout button
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

  checkoutBtnContainer: {
    position: "absolute",
    alignSelf: "flex-end",
    bottom: 20,
    right: 20,
    zIndex: 100, // Ensure it's on top
    elevation: 10, // For Android
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },

  checkoutBtn: {
    height: 70, // Slightly larger
    width: 70, // Slightly larger
    backgroundColor: "#61C35C",
    borderRadius: 12, // Slightly more rounded
    justifyContent: "center",
    alignItems: "center",
    padding: 5,
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
    gap: 20,
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

  disabledBtn: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
});