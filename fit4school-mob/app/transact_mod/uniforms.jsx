//../../transact_mod/uniforms.jsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    TouchableOpacity,
    View,
    Image,
    Modal,
    Dimensions,
    TouchableWithoutFeedback,
    ScrollView,
    Alert
} from "react-native";
import { Text } from "../../components/globalText";
import { useRouter } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import Carousel from "react-native-reanimated-carousel";
import ImageZoom from "react-native-image-pan-zoom";

import { auth, db } from "../../firebase";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function Uniform() {
    const router = useRouter();

    // Carousel & Zoom
    const [activeIndex, setActiveIndex] = useState(0);
    const [zoomModal, setZoomModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    // Add-to-Cart & Buy Now
    const [atcModal, setAtcModal] = useState(false);
    const [bnModal, setBnModal] = useState(false);
    const [selectSize, setSelectSize] = useState(null);
    const [qty, setQty] = useState(1);

    // Uniform Data
    const [uniform, setUniform] = useState(null);

    // Fetch uniform data from Firestore
    useEffect(() => {
        const fetchUniform = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "uniforms"));
                if (!querySnapshot.empty) {
                    const data = querySnapshot.docs[0].data(); // Example: fetch first boys' uniform
                    setUniform({ id: querySnapshot.docs[0].id, ...data });
                }
            } catch (error) {
                console.error("Error fetching uniform: ", error);
            }
        };
        fetchUniform();
    }, []);

    // Open Zoom Modal
    const openZoom = (img) => {
        setSelectedImage(img);
        setZoomModal(true);
    };

    // Add to Cart
    const addToCart = async () => {
        if (!selectSize) return alert("Please select a size first!");

        try {
            // Get existing cart from local storage
            const existingCart = await AsyncStorage.getItem('cart');
            const cart = existingCart ? JSON.parse(existingCart) : [];

            // Calculate price based on selected size
            const price = uniform.sizes[selectSize];

            // Create cart item with proper structure
            const cartItem = {
                ...uniform,
                size: selectSize,
                quantity: qty,
                price: price, // Store the actual price
                totalPrice: price * qty,
                addedAt: new Date().toISOString(),
                cartId: Date.now().toString() // Unique ID for cart item
            };

            // Add new item
            cart.push(cartItem);

            // Save back to AsyncStorage
            await AsyncStorage.setItem('cart', JSON.stringify(cart));

            setAtcModal(false);
            setSelectSize(null);
            setQty(1);
            alert(`✅ Added to Cart\nSize: ${selectSize}, Qty: ${qty}`);
        } catch (error) {
            console.error("Error adding to cart: ", error);
            alert("❌ Failed to add item to cart");
        }
    };

    // Buy Now - Direct to Checkout
    const handleBuyNow = () => {
        if (!selectSize) {
            Alert.alert("Select Size", "Please select a size first!");
            return;
        }

        // Calculate price based on selected size
        const price = uniform.sizes[selectSize];

        // Create the selected item for checkout
        const selectedItem = {
            ...uniform,
            size: selectSize,
            quantity: qty,
            price: price,
            totalPrice: price * qty,
            cartId: `buynow-${Date.now()}` // Unique ID for buy now item
        };

        // Close the modal
        setBnModal(false);
        setSelectSize(null);
        setQty(1);

        // Redirect directly to checkout with the selected item
        router.push({
            pathname: "/transact_mod/checkout",
            params: { 
                selectedItems: JSON.stringify([selectedItem]),
                fromBuyNow: "true" // Flag to indicate this came from Buy Now
            }
        });
    };

    if (!uniform) return <Text>Loading...</Text>;

    const carouselItems = uniform.images || [{ id: 1, imageUrl: uniform.imageUrl }];
    const sizes = uniform.sizes ? Object.keys(uniform.sizes) : ["Small", "Medium", "Large"];

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.slide} activeOpacity={0.9} onPress={() => openZoom({ uri: item.imageUrl || item.image })}>
            <Image source={{ uri: item.imageUrl || item.image }} style={styles.carouselImage} resizeMode="contain" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => router.push("/dash_mod/home")}>
                <Ionicons name="arrow-back-outline" size={23} style={{ marginTop: "8%" }} />
            </TouchableOpacity>

            <View style={styles.carouselContainer}>
                <Carousel
                    loop
                    width={screenWidth - 40}
                    height={300}
                    data={carouselItems}
                    scrollAnimationDuration={1000}
                    onSnapToItem={(index) => setActiveIndex(index)}
                    renderItem={renderItem}
                    autoPlay={false}
                    mode="parallax"
                    modeConfig={{ parallaxScrollingScale: 0.9, parallaxScrollingOffset: 50 }}
                />
                <View style={styles.paginationNumber}>
                    <Text style={{ color: "#fff", fontSize: 14 }}>{activeIndex + 1}/{carouselItems.length}</Text>
                </View>
            </View>

            <View style={styles.prc_cont}>
                <View>
                    <Text style={styles.prc}>{uniform.category} {uniform.gender}</Text>
                    <Text style={styles.item_desc}>({uniform.grdLevel})</Text>
                </View>

                <View>
                    <TouchableOpacity style={styles.ar_btn} onPress={() => router.push("/ar_mod/ar_height")}>
                        <Image source={require("../../assets/images/icons/ar_menu.png")} style={styles.ar_pic} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Size Chart & Buy/Add buttons */}
            <ScrollView style={{ flex: 1 }}>
                {uniform.sizeChart && (
                    <View style={styles.szchrt_cont}>
                        <TouchableOpacity onPress={() => openZoom({ uri: uniform.sizeChart })}>
                            <Image source={{ uri: uniform.sizeChart }} style={styles.szchrt_pic} resizeMode="contain" />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.buy_cont}>
                    <TouchableOpacity style={styles.atc_btn} onPress={() => setAtcModal(true)}>
                        <Image source={require("../../assets/images/icons/gen_icons/white-cart.png")} style={styles.cart_pic} />
                        <Text style={{ fontSize: 10, color: "white", fontWeight: "400" }}>Add to cart</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.bn_btn} onPress={() => setBnModal(true)}>
                        <Text style={{ fontSize: 20, color: "white", fontWeight: "400" }}>Buy Now</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Zoom Modal */}
            <Modal visible={zoomModal} transparent animationType="fade" onRequestClose={() => setZoomModal(false)}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.modalCloseButton} onPress={() => setZoomModal(false)}>
                        <Ionicons name="close" size={30} color="#fff" />
                    </TouchableOpacity>
                    {selectedImage && (
                        <ImageZoom
                            cropWidth={screenWidth}
                            cropHeight={screenHeight}
                            imageWidth={screenWidth}
                            imageHeight={screenHeight}
                            enableSwipeDown
                            onSwipeDown={() => setZoomModal(false)}
                        >
                            <Image source={selectedImage} style={styles.zoomedImage} resizeMode="contain" />
                        </ImageZoom>
                    )}
                </View>
            </Modal>

            {/* Add to Cart Modal */}
            <Modal visible={atcModal} transparent animationType="slide" onRequestClose={() => setAtcModal(false)}>
                <TouchableWithoutFeedback onPress={() => setAtcModal(false)}>
                    <View style={styles.modal_overlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modal_cont}>
                                <View style={styles.matc_cont}>
                                    <Image source={{ uri: uniform.imageUrl }} style={styles.matc_pic} />
                                    <View style={styles.matc_desc}>
                                        <Text style={styles.matc_prc}>
                                            ₱{selectSize && uniform.sizes ? uniform.sizes[selectSize] : 'Select size'}
                                        </Text>
                                        <Text style={styles.matc_item_desc}>{uniform.category} {uniform.gender} </Text> 
                                        <Text style={styles.matc_item_desc}>({uniform.grdLevel})</Text>
                                    </View>
                                </View>

                                <Text style={{ fontSize: 16, fontWeight: '600', marginTop: '8%' }}>Size</Text>
                                <ScrollView style={{ maxHeight: 160 }}>
                                    <View style={styles.matc_sizes_cont}>
                                        {sizes.map((size) => (
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
                                                    ₱{uniform.sizes ? uniform.sizes[size] : '0'}
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
                                    onPress={addToCart}
                                    disabled={!selectSize}
                                >
                                    <Text style={{ fontSize: 20, color: "white", fontWeight: "600" }}>
                                        {selectSize ? `Add to cart - ₱${uniform.sizes[selectSize] * qty}` : 'Select size first'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Buy Now Modal */}
            <Modal visible={bnModal} transparent animationType="slide" onRequestClose={() => setBnModal(false)}>
                <TouchableWithoutFeedback onPress={() => setBnModal(false)}>
                    <View style={styles.modal_overlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modal_cont}>
                                <View style={styles.matc_cont}>
                                    <Image source={{ uri: uniform.imageUrl }} style={styles.matc_pic} />
                                    <View style={styles.matc_desc}>
                                        <Text style={styles.matc_prc}>
                                            ₱{selectSize && uniform.sizes ? uniform.sizes[selectSize] : 'Select size'}
                                        </Text>
                                        <Text style={styles.matc_item_desc}>{uniform.category} {uniform.gender} </Text> 
                                        <Text style={styles.matc_item_desc}>({uniform.grdLevel})</Text>
                                    </View>
                                </View>

                                <Text style={{ fontSize: 16, fontWeight: '600', marginTop: '8%' }}>Size</Text>
                                <ScrollView style={{ maxHeight: 160 }}>
                                    <View style={styles.matc_sizes_cont}>
                                        {sizes.map((size) => (
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
                                                    ₱{uniform.sizes ? uniform.sizes[size] : '0'}
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

                                <View>
                                    <TouchableOpacity
                                        style={[styles.matc_btn, !selectSize && styles.disabledBtn]}
                                        onPress={handleBuyNow}
                                        disabled={!selectSize}
                                    >
                                        <Text style={{ fontSize: 20, color: "white", fontWeight: "600" }}>
                                            {selectSize ? `Proceed to Checkout - ₱${uniform.sizes[selectSize] * qty}` : 'Select size first'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
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
        alignContent: "center",
        padding: "8.5%",
        backgroundColor: "#FFFBFB",
    },

    carouselContainer: {
        marginVertical: "3%",
        alignItems: "center",
    },

    slide: {
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: "#f8f8f8",
    },

    carouselImage: {
        height: 300,
        width: "100%",
    },

    paginationNumber: {
        position: "absolute",
        bottom: 10,
        right: 15,
        backgroundColor: "rgba(0,0,0,0.6)",
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },

    prc: {
        color: "#61C35C",
        fontWeight: "600",
        fontSize: 28,
    },

    item_desc: {
        fontWeight: "400",
        fontSize: 18,
    },

    prc_cont: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginVertical: '5%',
    },

    ar_btn: {
        height: 46,
        width: 52,
        backgroundColor: "#61C35C",
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },

    ar_pic: {
        height: 32,
        width: 32,
    },

    szchrt_cont: {
        justifyContent: "center",
        alignItems: "center",
        marginVertical: "6%",
    },

    szchrt_pic: {
        height: 260,
        width: 320,
    },

    buy_cont: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignContent: "center",
    },

    atc_btn: {
        backgroundColor: "#0FAFFF",
        alignItems: "center",
        justifyContent: "center",
        height: 55,
        width: 110,
        borderRadius: 5,
        shadowOpacity: 0.4,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },

    cart_pic: {
        height: 22,
        width: 22,
    },

    bn_btn: {
        backgroundColor: "#61C35C",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 5,
        height: 55,
        width: 190,
        shadowOpacity: 0.4,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },

    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        justifyContent: "center",
        alignItems: "center",
    },

    modalCloseButton: {
        position: "absolute",
        top: 40,
        right: 20,
        zIndex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        borderRadius: 20,
        padding: 5,
    },

    zoomedImage: {
        width: screenWidth,
        height: screenHeight,
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
    }
});