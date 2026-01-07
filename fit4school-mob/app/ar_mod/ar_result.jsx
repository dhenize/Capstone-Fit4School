// AR RESULT - UPDATED WITH UNIFORMS.JSX STYLE MODALS
import React, { useState, useEffect } from "react";
import { Text } from "../../components/globalText";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Alert
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import Carousel from "react-native-reanimated-carousel";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function ArResult() {
  const {
    topSize,
    bottomSize,
    userHeight,
    userUnit,
    gender,
    grade,
  } = useLocalSearchParams();
  
  const router = useRouter();

  const [atcModal, setAtcModal] = useState(false);
  const [bnModal, setBnModal] = useState(false);
  const [selectSize, setSelectSize] = useState(null);
  const [selectUniform, setSelectUniform] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uniforms, setUniforms] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchUniforms = async () => {
      try {
        setLoading(true);
        
        // Map gender to database format
        const genderInDb = gender === "male" ? "Boys" : "Girls";
        
        console.log("Fetching uniforms for:", { grade, gender: genderInDb });
        
        const uniformsRef = collection(db, "uniforms");
        const genderQuery = query(
          uniformsRef,
          where("grdLevel", "==", grade),
          where("gender", "==", genderInDb)
        );

        const unisexQuery = query(
          uniformsRef,
          where("grdLevel", "==", grade),
          where("gender", "==", "Unisex")
        );

        const [genderSnapshot, unisexSnapshot] = await Promise.all([
          getDocs(genderQuery),
          getDocs(unisexQuery)
        ]);

        const fetchedUniforms = [];

        genderSnapshot.forEach((doc) => {
          fetchedUniforms.push({
            id: doc.id,
            ...doc.data()
          });
        });

        unisexSnapshot.forEach((doc) => {
          fetchedUniforms.push({
            id: doc.id,
            ...doc.data()
          });
        });

        console.log(`Fetched ${fetchedUniforms.length} uniforms`);
        setUniforms(fetchedUniforms);

      } catch (error) {
        console.error("Error fetching uniforms:", error);
        Alert.alert("Error", "Failed to load uniforms");
      } finally {
        setLoading(false);
      }
    };

    if (grade && gender) {
      fetchUniforms();
    }
  }, [grade, gender]);

  // Get available sizes for a uniform - EXACTLY LIKE UNIFORMS.JSX
  const getAvailableSizes = (uniform) => {
    if (!uniform.sizes) return [];
    return Object.keys(uniform.sizes);
  };

  const getPriceForSize = (uniform, size) => {
    if (!uniform.sizes || !uniform.sizes[size]) return 0;
    return uniform.sizes[size].price || 0;
  };

  const openAddToCartModal = (uniform) => {
    setSelectUniform(uniform);
    const availableSizes = getAvailableSizes(uniform);
    if (availableSizes.length > 0) {
      setSelectSize(availableSizes[0]);
    }
    setQty(1);
    setAtcModal(true);
  };

  const openBuyNowModal = (uniform) => {
    setSelectUniform(uniform);
    const availableSizes = getAvailableSizes(uniform);
    if (availableSizes.length > 0) {
      setSelectSize(availableSizes[0]);
    }
    setQty(1);
    setBnModal(true);
  };

  // EXACT SAME CART LOGIC AS UNIFORMS.JSX
  const addToCart = async () => {
    if (!selectSize) {
      Alert.alert("Select Size", "Please select a size first!");
      return;
    }

    try {
      if (!auth.currentUser) {
        alert("Please log in to add items to cart");
        return;
      }

      const price = getPriceForSize(selectUniform, selectSize);
      if (!price) {
        alert("Price not available for selected size");
        return;
      }

      // NORMALIZED cart item structure WITH imageUrl - EXACTLY LIKE UNIFORMS.JSX
      const cartItem = {
        addedAt: new Date().toISOString(),
        itemCode: selectUniform.itemCode,
        price: price,
        quantity: qty,
        size: selectSize,
        imageUrl: selectUniform.imageUrl
      };

      console.log("Adding to cart (normalized with imageUrl):", cartItem);

      // Save to local storage
      const existingCart = await AsyncStorage.getItem('cart');
      const cart = existingCart ? JSON.parse(existingCart) : [];

      const localCartItem = {
        ...cartItem,
        uniformId: selectUniform.id,
        category: selectUniform.category,
        gender: selectUniform.gender,
        grdLevel: selectUniform.grdLevel,
        firestoreId: null,
        cartId: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      cart.push(localCartItem);
      await AsyncStorage.setItem('cart', JSON.stringify(cart));

      // Save to Firestore
      const userCartQuery = query(
        collection(db, "cartItems"),
        where("requestedBy", "==", auth.currentUser.uid),
        where("status", "==", "pending")
      );

      const querySnapshot = await getDocs(userCartQuery);
      let cartDocRef;

      if (querySnapshot.empty) {
        const cartData = {
          requestedBy: auth.currentUser.uid,
          items: [cartItem],
          status: "pending",
          orderTotal: price * qty,
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        cartDocRef = await addDoc(collection(db, "cartItems"), cartData);
        console.log("New cart created with ID:", cartDocRef.id);
      } else {
        const existingDoc = querySnapshot.docs[0];
        const existingCartData = existingDoc.data();

        const updatedItems = [...existingCartData.items, cartItem];
        const updatedTotal = updatedItems.reduce((total, item) => total + (item.price * item.quantity), 0);

        await updateDoc(doc(db, "cartItems", existingDoc.id), {
          items: updatedItems,
          orderTotal: updatedTotal,
          date: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        cartDocRef = { id: existingDoc.id };
        console.log("Cart updated with new item. Total items:", updatedItems.length);
      }

      // Update local cart with firestore ID
      const updatedLocalCart = cart.map(item =>
        item.cartId === localCartItem.cartId
          ? { ...item, firestoreId: cartDocRef.id }
          : item
      );

      await AsyncStorage.setItem('cart', JSON.stringify(updatedLocalCart));

      setAtcModal(false);
      setSelectSize(null);
      setQty(1);
      Alert.alert("Success", `Added to Cart! \nSize: ${selectSize}, Qty: ${qty}`);

    } catch (error) {
      console.error("Error adding to cart: ", error);
      Alert.alert("Error", "Failed to add item to cart!");
    }
  };

  // EXACT SAME BUY NOW LOGIC AS UNIFORMS.JSX
  const handleBuyNow = () => {
    if (!selectSize) {
      Alert.alert("Select Size", "Please select a size first!");
      return;
    }

    const price = getPriceForSize(selectUniform, selectSize);

    // NORMALIZED item structure WITH imageUrl
    const selectedItem = {
      addedAt: new Date().toISOString(),
      itemCode: selectUniform.itemCode,
      price: price,
      quantity: qty,
      size: selectSize,
      imageUrl: selectUniform.imageUrl,
      uniformId: selectUniform.id,
      category: selectUniform.category,
      gender: selectUniform.gender,
      grdLevel: selectUniform.grdLevel,
      cartId: `buynow-${Date.now()}`
    };

    setBnModal(false);
    setSelectSize(null);
    setQty(1);

    router.push({
      pathname: "/transact_mod/checkout",
      params: {
        selectedItems: JSON.stringify([selectedItem]),
        fromBuyNow: "true"
      }
    });
  };

  const renderUniformItem = ({ item, index }) => (
    <TouchableOpacity 
      style={styles.uniformItem}
      onPress={() => openAddToCartModal(item)}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: item.imageUrl }} 
        style={styles.uniformImage}
        resizeMode="contain"
      />
      <View style={styles.uniformInfo}>
        <Text style={styles.itemCode}>{item.itemCode}</Text>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.grade}>{item.grdLevel} - {item.gender}</Text>
        <Text style={styles.price}>
          ₱{getPriceForSize(item, getAvailableSizes(item)[0] || 'Medium')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#61C35C" />
        <Text style={{ marginTop: 20, color: 'black' }}>Loading recommended uniforms...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top navigation - SIMPLIFIED */}
      <View style={styles.btn_cont}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={23} color="black" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/dash_mod/home")}>
          <Ionicons name="close" size={23} color="black" />
        </TouchableOpacity>
      </View>

      {/* Recommended Sizes */}
      <View style={styles.userInfoContainer}>
        <Text style={styles.sizeLabel}>Your Recommended Sizes</Text>
        <Text style={styles.userInfo}>
          {gender === "male" ? "Boy" : "Girl"} | {grade} | Height: {userHeight} {userUnit}
        </Text>
        
        <View style={styles.sizeContainer}>
          <View style={styles.sizeBox}>
            <Text style={styles.sizeType}>Top</Text>
            <Text style={[styles.sizeValue, styles[`${topSize?.toLowerCase()}Size`]]}>
              {topSize || "N/A"}
            </Text>
          </View>
          
          <View style={styles.sizeBox}>
            <Text style={styles.sizeType}>Bottom</Text>
            <Text style={[styles.sizeValue, styles[`${bottomSize?.toLowerCase()}Size`]]}>
              {bottomSize || "N/A"}
            </Text>
          </View>
        </View>
      </View>

      {/* Uniforms Carousel */}
      <View style={styles.carouselContainer}>
        <Text style={styles.carouselTitle}>Available Uniforms</Text>
        {uniforms.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No uniforms found for your criteria</Text>
          </View>
        ) : (
          <>
            <Carousel
              loop={false}
              width={screenWidth * 0.85}
              height={350}
              data={uniforms}
              renderItem={renderUniformItem}
              onSnapToItem={setActiveIndex}
            />
            
            {/* Dots Indicator */}
            {uniforms.length > 1 && (
              <View style={styles.dotsContainer}>
                {uniforms.map((_, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.dot,
                      activeIndex === index && styles.activeDot
                    ]}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </View>

      {/* Bottom action buttons */}
      <View style={styles.buy_cont}>
        
        <TouchableOpacity
          style={styles.atc_btn}
          onPress={() => {
            if (uniforms.length > 0 && activeIndex < uniforms.length) {
              openAddToCartModal(uniforms[activeIndex]);
            }
          }}
          disabled={uniforms.length === 0}
        >
          <Image
            source={require("../../assets/images/icons/gen_icons/white-cart.png")}
            style={styles.cart_pic}
          />
          <Text style={{ fontSize: 10, color: "white", fontWeight: "400" }}>
            Add to cart
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bn_btn}
          onPress={() => {
            if (uniforms.length > 0 && activeIndex < uniforms.length) {
              openBuyNowModal(uniforms[activeIndex]);
            }
          }}
          disabled={uniforms.length === 0}
        >
          <Text style={{ fontSize: 16, color: "white", fontWeight: "600" }}>
            Buy Now
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add to Cart Modal - EXACT SAME AS UNIFORMS.JSX */}
      <Modal
        visible={atcModal}
        transparent
        animationType="slide"
        onRequestClose={() => setAtcModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setAtcModal(false)}>
          <View style={styles.modal_overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modal_cont}>
                {selectUniform && (
                  <>
                    <View style={styles.matc_cont}>
                      <Image
                        source={{ uri: selectUniform.imageUrl }}
                        style={styles.matc_pic}
                      />
                      <View style={styles.matc_desc}>
                        <Text style={styles.matc_prc}>
                          ₱{selectSize ? getPriceForSize(selectUniform, selectSize) : 'Select size'}
                        </Text>
                        <Text style={styles.matc_item_desc}>
                          {selectUniform.category} {selectUniform.gender}
                        </Text>
                        <Text style={styles.matc_item_desc}>
                          ({selectUniform.grdLevel})
                        </Text>
                      </View>
                    </View>

                    <Text style={{ fontSize: 16, fontWeight: '600', marginTop: '8%', color: 'black' }}>Size</Text>
                    <ScrollView style={{ maxHeight: 160 }}>
                      <View style={styles.matc_sizes_cont}>
                        {getAvailableSizes(selectUniform).map((size) => (
                          <TouchableOpacity
                            key={size}
                            onPress={() => {
                              setSelectSize(size);
                              setQty(1);
                            }}
                            style={[styles.matc_sizes_btn, selectSize === size && styles.setSelectSize]}
                          >
                            <Text style={{ fontWeight: '500', fontSize: 14, color: selectSize === size ? 'white' : 'black' }}>
                              {size}
                            </Text>
                            <Text style={{ fontSize: 10, color: selectSize === size ? 'white' : '#666' }}>
                              ₱{getPriceForSize(selectUniform, size)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    <View style={styles.matc_qty_cont}>
                      <Text style={{ fontWeight: '600', fontSize: 16, color: 'black' }}>Quantity</Text>
                      <View style={styles.matc_btn_cont}>
                        <TouchableOpacity onPress={() => setQty(Math.max(1, qty - 1))} style={styles.matc_qty_btn}>
                          <Text style={[styles.matc_qty_desc, { color: 'black' }]}>-</Text>
                        </TouchableOpacity>
                        <View style={styles.matc_qty_btn}>
                          <Text style={[styles.matc_qty_desc, { color: 'black' }]}>{qty}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setQty(qty + 1)} style={styles.matc_qty_btn}>
                          <Text style={[styles.matc_qty_desc, { color: 'black' }]}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.matc_btn, !selectSize && styles.disabledBtn]}
                      onPress={addToCart}
                      disabled={!selectSize}
                    >
                      <Text style={{ fontSize: 20, color: "white", fontWeight: "600" }}>
                        {selectSize ? `Add to cart - ₱${getPriceForSize(selectUniform, selectSize) * qty}` : 'Select size first'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Buy Now Modal - EXACT SAME AS UNIFORMS.JSX */}
      <Modal
        visible={bnModal}
        transparent
        animationType="slide"
        onRequestClose={() => setBnModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setBnModal(false)}>
          <View style={styles.modal_overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modal_cont}>
                {selectUniform && (
                  <>
                    <View style={styles.matc_cont}>
                      <Image
                        source={{ uri: selectUniform.imageUrl }}
                        style={styles.matc_pic}
                      />
                      <View style={styles.matc_desc}>
                        <Text style={styles.matc_prc}>
                          ₱{selectSize ? getPriceForSize(selectUniform, selectSize) : 'Select size'}
                        </Text>
                        <Text style={styles.matc_item_desc}>
                          {selectUniform.category} {selectUniform.gender}
                        </Text>
                        <Text style={styles.matc_item_desc}>
                          ({selectUniform.grdLevel})
                        </Text>
                      </View>
                    </View>

                    <Text style={{ fontSize: 16, fontWeight: '600', marginTop: '8%', color: 'black' }}>Size</Text>
                    <ScrollView style={{ maxHeight: 160 }}>
                      <View style={styles.matc_sizes_cont}>
                        {getAvailableSizes(selectUniform).map((size) => (
                          <TouchableOpacity
                            key={size}
                            onPress={() => {
                              setSelectSize(size);
                              setQty(1);
                            }}
                            style={[styles.matc_sizes_btn, selectSize === size && styles.setSelectSize]}
                          >
                            <Text style={{ fontWeight: '500', fontSize: 14, color: selectSize === size ? 'white' : 'black' }}>
                              {size}
                            </Text>
                            <Text style={{ fontSize: 10, color: selectSize === size ? 'white' : '#666' }}>
                              ₱{getPriceForSize(selectUniform, size)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    <View style={styles.matc_qty_cont}>
                      <Text style={{ fontWeight: '600', fontSize: 16, color: 'black' }}>Quantity</Text>
                      <View style={styles.matc_btn_cont}>
                        <TouchableOpacity onPress={() => setQty(Math.max(1, qty - 1))} style={styles.matc_qty_btn}>
                          <Text style={[styles.matc_qty_desc, { color: 'black' }]}>-</Text>
                        </TouchableOpacity>
                        <View style={styles.matc_qty_btn}>
                          <Text style={[styles.matc_qty_desc, { color: 'black' }]}>{qty}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setQty(qty + 1)} style={styles.matc_qty_btn}>
                          <Text style={[styles.matc_qty_desc, { color: 'black' }]}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View>
                      <TouchableOpacity
                        style={[styles.matc_btn, !selectSize && styles.disabledBtn]}
                        onPress={handleBuyNow}
                        disabled={!selectSize}
                      >
                        <Text style={{ fontSize: 20, color: "white", fontWeight: "600" }}>
                          {selectSize ? `Proceed to Checkout - ₱${getPriceForSize(selectUniform, selectSize) * qty}` : 'Select size first'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

// Styles - Updated with uniforms.jsx styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFBFB",
    padding: 20,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#FFFBFB",
  },

  btn_cont: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },

  userInfoContainer: {
    alignItems: "center",
    marginBottom: 20,
    padding: 20,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  sizeLabel: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
    color: "#333",
  },

  userInfo: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 20,
  },

  sizeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 10,
  },

  sizeBox: {
    alignItems: "center",
    padding: 15,
    backgroundColor: "white",
    borderRadius: 10,
    width: "45%",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  sizeType: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: "500",
  },

  sizeValue: {
    fontSize: 28,
    fontWeight: "700",
  },

  smallSize: {
    color: "#4CAF50",
  },

  mediumSize: {
    color: "#2196F3",
  },

  largeSize: {
    color: "#FF9800",
  },

  carouselContainer: {
    flex: 1,
    marginBottom: 20,
  },

  carouselTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    marginLeft: 5,
  },

  uniformItem: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  uniformImage: {
    width: 160,
    height: 160,
    marginBottom: 10,
  },

  uniformInfo: {
    alignItems: 'center',
  },

  itemCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F72AD',
    marginBottom: 5,
    textAlign: 'center',
  },

  category: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },

  grade: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },

  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#61C35C',
    marginTop: 5,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },

  emptyText: {
    fontSize: 18,
    color: '#666',
  },

  buy_cont: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    bottom: 45
  },

  atc_btn: {
    backgroundColor: "#0FAFFF",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    width: 110,
    borderRadius: 8,
    shadowColor: "black",
    elevation: 3,
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
  },

  bn_btn: {
    backgroundColor: "#61C35C",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    height: 50,
    width: 140,
    shadowColor: "black",
    elevation: 3,
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
  },

  cart_pic: {
    height: 20,
    width: 20,
    marginBottom: 4,
  },

  // Modal Styles - EXACT SAME AS UNIFORMS.JSX
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

  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },

  activeDot: {
    backgroundColor: '#61C35C',
    width: 10,
    height: 10,
  },
});