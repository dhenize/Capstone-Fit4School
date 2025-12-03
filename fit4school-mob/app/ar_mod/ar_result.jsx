import React, { useState, useEffect } from "react";
import { Text } from "../../components/globalText";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import Carousel from "react-native-reanimated-carousel";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get("window");

export default function ArResult() {
  const {
    topSize,
    bottomSize,
    shoulderCm,
    chestCm,
    hipCm,
    userHeight,
    userUnit,
    gender,
    grade,
    torsoLengthCm,
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

 
  const calculatedHips = hipCm ? (parseFloat(hipCm) * 2).toFixed(1) : null;
 
  const lengthDisplay = torsoLengthCm ? `${torsoLengthCm} cm` : `${userHeight || "N/A"} ${userUnit}`;

  useEffect(() => {
    const fetchUniforms = async () => {
      try {
        setLoading(true);
        
        
        const genderInDb = gender === "male" ? "Boys" : "Girls";
        
        console.log("Fetching uniforms for:", {
          grade, 
          gender: genderInDb,
          originalGender: gender
        });
        
       
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
        
        console.log(`Fetched ${fetchedUniforms.length} uniforms (${genderInDb} + Unisex) for ${grade}`);
        setUniforms(fetchedUniforms);
        
      } catch (error) {
        console.error("Error fetching uniforms:", error);
        alert("Error loading uniforms: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    if (grade && gender) {
      fetchUniforms();
    }
  }, [grade, gender]);

  const getAvailableSizes = (uniform) => {
    if (!uniform.sizes) return [];
    const sizes = Object.keys(uniform.sizes);
    
    
    const topCategories = ["Polo", "Blouse", "PE_Shirt", "Full_Uniform", "Full_PE"];
    if (topCategories.includes(uniform.category)) {
      return sizes.filter(size => 
        ['small', 'medium', 'large'].includes(size.toLowerCase())
      );
    }
    
    
    return sizes;
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

  const addToCart = async (uniform, size, quantity) => {
    try {
      if (!auth.currentUser) {
        alert("Please log in to add items to cart");
        return;
      }

      const price = getPriceForSize(uniform, size);
      if (!price) {
        alert("Price not available for selected size");
        return;
      }

      const cartItem = {
        id: uniform.id,
        itemCode: uniform.itemCode,
        category: uniform.category,
        gender: uniform.gender,
        grdLevel: uniform.grdLevel,
        imageUrl: uniform.imageUrl,
        size: size,
        quantity: quantity,
        price: price,
        totalPrice: price * quantity,
        addedAt: new Date().toISOString(),
        cartId: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      console.log("Adding to cart:", cartItem);

     
      const existingCart = await AsyncStorage.getItem('cart');
      const cart = existingCart ? JSON.parse(existingCart) : [];

      const localCartItem = {
        ...cartItem,
        firestoreId: null
      };

      cart.push(localCartItem);
      await AsyncStorage.setItem('cart', JSON.stringify(cart));

    
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
          orderTotal: price * quantity,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
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
          updatedAt: serverTimestamp()
        });

        cartDocRef = { id: existingDoc.id };
        console.log("Cart updated with new item");
      }

     
      const updatedLocalCart = cart.map(item =>
        item.cartId === cartItem.cartId
          ? { ...item, firestoreId: cartDocRef.id }
          : item
      );

      await AsyncStorage.setItem('cart', JSON.stringify(updatedLocalCart));

      alert(`✅ Added to Cart!\nItem: ${cartItem.itemCode}\nSize: ${size}, Qty: ${quantity}`);
      setAtcModal(false);
      setSelectSize(null);
      setQty(1);
      setSelectUniform(null);

    } catch (error) {
      console.error("Error adding to cart: ", error);
      alert("Failed to add item to cart!");
    }
  };

  const handleBuyNow = (uniform, size, quantity) => {
    const price = getPriceForSize(uniform, size);
    if (!price) {
      alert("Price not available for selected size");
      return;
    }

    const selectedItem = {
      id: uniform.id,
      itemCode: uniform.itemCode,
      category: uniform.category,
      gender: uniform.gender,
      grdLevel: uniform.grdLevel,
      imageUrl: uniform.imageUrl,
      size: size,
      quantity: quantity,
      price: price,
      totalPrice: price * quantity,
      cartId: `buynow-${Date.now()}`
    };

    setBnModal(false);
    setSelectSize(null);
    setQty(1);
    setSelectUniform(null);

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
        <Text style={styles.category}>{item.category} ({item.gender})</Text>
        <Text style={styles.grade}>{item.grdLevel}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#61C35C" />
        <Text style={{ marginTop: 20 }}>Loading recommended uniforms...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top navigation buttons */}
      <View style={styles.btn_cont}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back-outline"
            size={23}
            style={{ marginTop: "8%" }}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/dash_mod/home")}>
          <Ionicons name="close" size={23} style={{ marginTop: "8%" }} />
        </TouchableOpacity>
      </View>

      {/* User Information */}
      <View style={styles.userInfoContainer}>
        <Text style={styles.sizeLabel}>Your Recommended Sizes</Text>
        <Text style={styles.userInfo}>
          {gender === "male" ? "Boy" : "Girl"} | {grade} | Height: {userHeight} {userUnit}
        </Text>
        <Text style={styles.recommendedSize}>
          Top: <Text style={styles.sizeValue}>{topSize}</Text> | 
          Bottom: <Text style={styles.sizeValue}>{bottomSize}</Text>
        </Text>
      </View>

      {/* Uniforms Carousel */}
      <View style={styles.carouselContainer}>
        <Text style={styles.carouselTitle}>Available Uniforms</Text>
        {uniforms.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No uniforms found</Text>
          </View>
        ) : (
          <>
            <Carousel
              loop={false}
              width={screenWidth * 0.9}
              height={330}
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

      {/* Measurement Details - CLOSER to carousel and showing only chest, length, hips */}
      <View style={styles.measurementDetails}>
        <Text style={styles.detailsTitle}>Body Measurements</Text>
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Chest</Text>
            <Text style={styles.detailValue}>{chestCm || "N/A"} cm</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Length</Text>
            <Text style={styles.detailValue}>{lengthDisplay}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Hips</Text>
            <Text style={styles.detailValue}>
              {calculatedHips ? `${calculatedHips} cm` : "N/A"}
            </Text>
          </View>
        </View>
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
          <Text style={{ fontSize: 20, color: "white", fontWeight: "400" }}>
            Buy Now
          </Text>
        </TouchableOpacity>
      </View>

      {/* --- Add to Cart Modal --- */}
      <Modal
        visible={atcModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setAtcModal(false);
          setSelectUniform(null);
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          setAtcModal(false);
          setSelectUniform(null);
        }}>
          <View style={styles.modal_overlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
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

                    {/* Item Codes Container - FIXED HEIGHT */}
                    <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 15 }}>Items</Text>
                    <ScrollView 
                      horizontal 
                      style={{ maxHeight: uniforms.length > 4 ? 120 : 80 }} 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.itemsScrollContainer}
                    >
                      <View style={styles.itemCodesContainer}>
                        {uniforms.map((uniform) => (
                          <TouchableOpacity
                            key={uniform.id}
                            onPress={() => {
                              setSelectUniform(uniform);
                              const availableSizes = getAvailableSizes(uniform);
                              if (availableSizes.length > 0) {
                                setSelectSize(availableSizes[0]);
                              }
                              setQty(1);
                            }}
                            style={[
                              styles.itemCodeBtn,
                              selectUniform?.id === uniform.id && styles.selectedItemCodeBtn,
                            ]}
                          >
                            <Text style={[
                              styles.itemCodeText,
                              selectUniform?.id === uniform.id && styles.selectedItemCodeText
                            ]}>
                              {uniform.itemCode}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    {/* Size Container */}
                    <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 15 }}>Size</Text>
                    <ScrollView style={{ maxHeight: 120 }}>
                      <View style={styles.matc_sizes_cont}>
                        {getAvailableSizes(selectUniform).map((size) => (
                          <TouchableOpacity
                            key={size}
                            onPress={() => setSelectSize(size)}
                            style={[
                              styles.matc_sizes_btn,
                              selectSize === size && styles.setSelectSize,
                            ]}
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

                    {/* Quantity */}
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
                      onPress={() => addToCart(selectUniform, selectSize, qty)}
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

      {/* --- Buy Now Modal --- */}
      <Modal
        visible={bnModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setBnModal(false);
          setSelectUniform(null);
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          setBnModal(false);
          setSelectUniform(null);
        }}>
          <View style={styles.modal_overlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
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

                    {/* Item Codes Container - FIXED HEIGHT */}
                    <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 15 }}>Items</Text>
                    <ScrollView 
                      horizontal 
                      style={{ maxHeight: uniforms.length > 4 ? 120 : 80 }} 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.itemsScrollContainer}
                    >
                      <View style={styles.itemCodesContainer}>
                        {uniforms.map((uniform) => (
                          <TouchableOpacity
                            key={uniform.id}
                            onPress={() => {
                              setSelectUniform(uniform);
                              const availableSizes = getAvailableSizes(uniform);
                              if (availableSizes.length > 0) {
                                setSelectSize(availableSizes[0]);
                              }
                              setQty(1);
                            }}
                            style={[
                              styles.itemCodeBtn,
                              selectUniform?.id === uniform.id && styles.selectedItemCodeBtn,
                            ]}
                          >
                            <Text style={[
                              styles.itemCodeText,
                              selectUniform?.id === uniform.id && styles.selectedItemCodeText
                            ]}>
                              {uniform.itemCode}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    {/* Size Container */}
                    <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 15 }}>Size</Text>
                    <ScrollView style={{ maxHeight: 120 }}>
                      <View style={styles.matc_sizes_cont}>
                        {getAvailableSizes(selectUniform).map((size) => (
                          <TouchableOpacity
                            key={size}
                            onPress={() => setSelectSize(size)}
                            style={[
                              styles.matc_sizes_btn,
                              selectSize === size && styles.setSelectSize,
                            ]}
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

                    {/* Quantity */}
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
                      onPress={() => handleBuyNow(selectUniform, selectSize, qty)}
                      disabled={!selectSize}
                    >
                      <Text style={{ fontSize: 20, color: "white", fontWeight: "600" }}>
                        {selectSize ? `Proceed to Checkout - ₱${getPriceForSize(selectUniform, selectSize) * qty}` : 'Select size first'}
                      </Text>
                    </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFBFB",
    alignContent: "center",
    padding: 20,
  },
  btn_cont: {
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  userInfoContainer: {
    alignItems: "center",
    marginVertical: 15,
    padding: 15,
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
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
    marginBottom: 5,
  },
  recommendedSize: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  sizeValue: {
    color: "#61C35C",
  },
  carouselContainer: {
    marginBottom: 10,
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
    marginBottom: 10,
    textAlign: 'center',
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
  measurementDetails: {
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  detailsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  detailItem: {
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  buy_cont: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
  },
  atc_btn: {
    backgroundColor: "#0FAFFF",
    alignItems: "center",
    justifyContent: "center",
    height: 55,
    width: 110,
    borderRadius: 5,
    shadowColor: "black",
    elevation: 5,
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 4 },
  },
  bn_btn: {
    backgroundColor: "#61C35C",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    height: 55,
    width: 190,
    shadowColor: "black",
    elevation: 5,
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 4 },
  },
  cart_pic: {
    height: 22,
    width: 22,
  },
  modal_overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modal_cont: {
    alignContent: "center",
    backgroundColor: "#FFFBFB",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 20,
    height: "70%", 
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
  itemsScrollContainer: {
    paddingVertical: 10,
    flexDirection: 'row',
  },
  itemCodesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  itemCodeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 5,
    width: 100,
    height: 50,
    borderColor: "#ccc",
    padding: 8,
    margin: 5,
    marginBottom: 10,
  },
  selectedItemCodeBtn: {
    backgroundColor: "#61C35C",
    borderColor: "#61C35C",
  },
  itemCodeText: {
    fontWeight: '500',
    fontSize: 12,
    color: 'black',
    textAlign: 'center',
  },
  selectedItemCodeText: {
    color: 'white',
    fontWeight: '600',
  },
  itemCodePrice: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  selectedItemCodePrice: {
    color: 'white',
  },
  matc_sizes_cont: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  matc_sizes_btn: {
    marginVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 5,
    width: 100,
    height: 50,
    borderColor: "#ccc",
    padding: 8,
    marginHorizontal: 5,
  },
  setSelectSize: {
    backgroundColor: "#61C35C",
    borderColor: "#61C35C",
  },
  matc_qty_cont: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingVertical: 20,
  },
  matc_btn_cont: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 15,
  },
  matc_qty_btn: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    width: 40,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: "#ccc",
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
    width: '100%',
    borderRadius: 5,
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginTop: 10,
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