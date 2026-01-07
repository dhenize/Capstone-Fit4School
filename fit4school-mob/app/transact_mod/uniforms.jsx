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
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import ImageZoom from "react-native-image-pan-zoom";

import { auth, db } from "../../firebase";
import { collection, getDocs, addDoc, serverTimestamp, query, where, updateDoc, doc, getDoc } from "firebase/firestore";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function Uniform() {
    const router = useRouter();
    const { uniformId } = useLocalSearchParams(); 

    
    const [zoomModal, setZoomModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    
    const [atcModal, setAtcModal] = useState(false);
    const [bnModal, setBnModal] = useState(false);
    const [selectSize, setSelectSize] = useState(null);
    const [qty, setQty] = useState(1);

    
    const [uniform, setUniform] = useState(null);
    const [loading, setLoading] = useState(true);

    
    useEffect(() => {
        const fetchUniform = async () => {
            try {
                setLoading(true);
                if (uniformId) {
                    
                    const docRef = doc(db, "uniforms", uniformId);
                    const docSnap = await getDoc(docRef);
                    
                    if (docSnap.exists()) {
                        setUniform({ id: docSnap.id, ...docSnap.data() });
                    } else {
                        
                        console.log("No uniform found with ID:", uniformId);
                        const querySnapshot = await getDocs(collection(db, "uniforms"));
                        if (!querySnapshot.empty) {
                            const data = querySnapshot.docs[0].data();
                            setUniform({ id: querySnapshot.docs[0].id, ...data });
                        }
                    }
                } else {
                    
                    const querySnapshot = await getDocs(collection(db, "uniforms"));
                    if (!querySnapshot.empty) {
                        const data = querySnapshot.docs[0].data();
                        setUniform({ id: querySnapshot.docs[0].id, ...data });
                    }
                }
            } catch (error) {
                console.error("Error fetching uniform: ", error);
                Alert.alert("Error", "Failed to load uniform data");
            } finally {
                setLoading(false);
            }
        };
        
        fetchUniform();
    }, [uniformId]);

    
    const openZoom = (img) => {
        setSelectedImage(img);
        setZoomModal(true);
    };

    
    const addToCart = async () => {
        if (!selectSize) return alert("Please select a size first!");

        try {
            const price = uniform.sizes[selectSize].price;

            // NORMALIZED cart item structure WITH imageUrl
            const cartItem = {
                addedAt: new Date().toISOString(),
                itemCode: uniform.itemCode,
                price: price,
                quantity: qty,
                size: selectSize,
                imageUrl: uniform.imageUrl // ADDED imageUrl
            };

            console.log("Adding to cart (normalized with imageUrl):", cartItem);

            
            const existingCart = await AsyncStorage.getItem('cart');
            const cart = existingCart ? JSON.parse(existingCart) : [];

            const localCartItem = {
                ...cartItem,
                // Keep reference to uniform for local display
                uniformId: uniform.id,
                category: uniform.category,
                gender: uniform.gender,
                grdLevel: uniform.grdLevel,
                firestoreId: null,
                cartId: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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
                    items: [cartItem], // Normalized item with imageUrl
                    status: "pending",
                    orderTotal: price * qty,
                    date: serverTimestamp(),
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
                    date: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });

                cartDocRef = { id: existingDoc.id };
                console.log("Cart updated with new item. Total items:", updatedItems.length);
            }

            
            const updatedLocalCart = cart.map(item =>
                item.cartId === localCartItem.cartId
                    ? { ...item, firestoreId: cartDocRef.id }
                    : item
            );

            await AsyncStorage.setItem('cart', JSON.stringify(updatedLocalCart));

            setAtcModal(false);
            setSelectSize(null);
            setQty(1);
            alert(`Added to Cart! \nSize: ${selectSize}, Qty: ${qty}`);

        } catch (error) {
            console.error("Error adding to cart: ", error);
            alert("Failed to add item to cart!");
        }
    };

    const handleBuyNow = () => {
        if (!selectSize) {
            Alert.alert("Select Size", "Please select a size first!");
            return;
        }

        const price = uniform.sizes[selectSize].price;

        // NORMALIZED item structure WITH imageUrl
        const selectedItem = {
            addedAt: new Date().toISOString(),
            itemCode: uniform.itemCode,
            price: price,
            quantity: qty,
            size: selectSize,
            imageUrl: uniform.imageUrl, // ADDED imageUrl
            // Keep reference for local use only
            uniformId: uniform.id,
            category: uniform.category,
            gender: uniform.gender,
            grdLevel: uniform.grdLevel,
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

    if (loading) return <View style={styles.loadingContainer}><Text style={{ color: 'black' }}>Loading...</Text></View>;
    if (!uniform) return <View style={styles.loadingContainer}><Text style={{ color: 'black' }}>Uniform not found</Text></View>;

    const sizes = uniform.sizes ? Object.keys(uniform.sizes) : [];
    const measurementKeys = uniform.sizes && sizes.length > 0 ? 
        Object.keys(uniform.sizes[sizes[0]]).filter(key => key !== 'price') : [];

    return (
        <View style={styles.container}>
            {/* Back Button */}
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back-outline" size={23} />
            </TouchableOpacity>

            {/* Scrollable Content */}
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Main Product Image */}
                <View style={styles.imageContainer}>
                    <TouchableOpacity 
                        style={styles.imageWrapper}
                        activeOpacity={0.9} 
                        onPress={() => openZoom({ uri: uniform.imageUrl })}
                    >
                        <Image 
                            source={{ uri: uniform.imageUrl }} 
                            style={styles.mainImage} 
                            resizeMode="contain" 
                        />
                        <View style={styles.zoomIndicator}>
                            <Ionicons name="search" size={20} color="#fff" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Product Info */}
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

                {/* Measurements Table */}
                {uniform.sizes && sizes.length > 0 && (
                    <View style={styles.measurementsContainer}>
                        <Text style={styles.sectionTitle}>Size Measurements (cm)</Text>
                        
                        <View style={styles.tableContainer}>
                            {/* Table Header */}
                            <View style={styles.tableHeader}>
                                <View style={styles.headerCell}>
                                    <Text style={styles.headerText}>Size</Text>
                                </View>
                                {measurementKeys.map((measurement) => (
                                    <View key={measurement} style={styles.headerCell}>
                                        <Text style={styles.headerText}>
                                            {measurement.charAt(0).toUpperCase() + measurement.slice(1)}
                                        </Text>
                                    </View>
                                ))}
                                <View style={styles.headerCell}>
                                    <Text style={styles.headerText}>Price</Text>
                                </View>
                            </View>

                            {/* Table Rows */}
                            {sizes.map((size, index) => (
                                <TouchableOpacity
                                    key={size} 
                                    style={[
                                        styles.tableRow,
                                        index % 2 === 0 ? styles.evenRow : styles.oddRow,
                                        selectSize === size && styles.selectedRow
                                    ]}
                                    onPress={() => setSelectSize(size)}
                                >
                                    <View style={styles.cell}>
                                        <Text style={[
                                            styles.cellText,
                                            selectSize === size && styles.selectedCellText
                                        ]}>
                                            {size}
                                        </Text>
                                    </View>
                                    {measurementKeys.map((measurement) => (
                                        <View key={`${size}-${measurement}`} style={styles.cell}>
                                            <Text style={[
                                                styles.cellText,
                                                selectSize === size && styles.selectedCellText
                                            ]}>
                                                {uniform.sizes[size][measurement] || 0}
                                            </Text>
                                        </View>
                                    ))}
                                    <View style={styles.cell}>
                                        <Text style={[
                                            styles.priceText,
                                            selectSize === size && styles.selectedCellText
                                        ]}>
                                            ₱{uniform.sizes[size].price}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                        
                    </View>
                )}

                {/* Size Chart */}
                {uniform.sizeChart && (
                    <View style={styles.szchrt_cont}>
                        <Text style={styles.sectionTitle}>Size Chart</Text>
                        <TouchableOpacity onPress={() => openZoom({ uri: uniform.sizeChart })}>
                            <Image source={{ uri: uniform.sizeChart }} style={styles.szchrt_pic} resizeMode="contain" />
                            <View style={styles.chartOverlay}>
                                <Text style={styles.chartOverlayText}>Tap to enlarge</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Fixed Bottom Buttons */}
            <View style={styles.bottomButtons}>
                <TouchableOpacity style={styles.atc_btn} onPress={() => setAtcModal(true)}>
                    <Image source={require("../../assets/images/icons/gen_icons/white-cart.png")} style={styles.cart_pic} />
                    <Text style={{ fontSize: 10, color: "white", fontWeight: "400" }}>Add to cart</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.bn_btn} onPress={() => setBnModal(true)}>
                    <Text style={{ fontSize: 20, color: "white", fontWeight: "400" }}>Buy Now</Text>
                </TouchableOpacity>
            </View>

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
                                            ₱{selectSize && uniform.sizes ? uniform.sizes[selectSize].price : 'Select size'}
                                        </Text>
                                        <Text style={styles.matc_item_desc}>{uniform.category} {uniform.gender} </Text>
                                        <Text style={styles.matc_item_desc}>({uniform.grdLevel})</Text>
                                    </View>
                                </View>

                                <Text style={{ fontSize: 16, fontWeight: '600', marginTop: '8%', color: 'black' }}>Size</Text>
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
                                                    ₱{uniform.sizes ? uniform.sizes[size].price : '0'}
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
                                        {selectSize ? `Add to cart - ₱${uniform.sizes[selectSize].price * qty}` : 'Select size first'}
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
                                            ₱{selectSize && uniform.sizes ? uniform.sizes[selectSize].price : 'Select size'}
                                        </Text>
                                        <Text style={styles.matc_item_desc}>{uniform.category} {uniform.gender} </Text>
                                        <Text style={styles.matc_item_desc}>({uniform.grdLevel})</Text>
                                    </View>
                                </View>

                                <Text style={{ fontSize: 16, fontWeight: '600', marginTop: '8%', color: 'black' }}>Size</Text>
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
                                                    ₱{uniform.sizes ? uniform.sizes[size].price : '0'}
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
                                            {selectSize ? `Proceed to Checkout - ₱${uniform.sizes[selectSize].price * qty}` : 'Select size first'}
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

// Styles remain exactly the same...
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFBFB",
    },
    
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "#FFFBFB",
    },

    backButton: {
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 10,
    },

    scrollView: {
        flex: 1,
    },

    scrollContent: {
        paddingBottom: 100, 
    },

    
    imageContainer: {
        marginVertical: "3%",
        alignItems: "center",
        paddingHorizontal: 20,
    },

    imageWrapper: {
        width: screenWidth - 40,
        height: 300,
        backgroundColor: "#f8f8f8",
        borderRadius: 10,
        overflow: "hidden",
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },

    mainImage: {
        width: '100%',
        height: '100%',
    },

    zoomIndicator: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },

    prc_cont: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingHorizontal: 20,
        marginVertical: '5%',
    },

    prc: {
        color: "#61C35C",
        fontWeight: "600",
        fontSize: 24,
        marginBottom: 4,
    },

    item_desc: {
        fontWeight: "400",
        fontSize: 16,
        color: '#666',
        marginBottom: 4,
    },

    ar_btn: {
        height: 46,
        width: 52,
        backgroundColor: "#61C35C",
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },

    ar_pic: {
        height: 32,
        width: 32,
    },

    
    measurementsContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
        marginTop: 10,
    },

    tableContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },

    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#61C35C',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#4CAF50',
    },

    headerCell: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 4,
    },

    headerText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
        textAlign: 'center',
    },

    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },

    evenRow: {
        backgroundColor: '#f9f9f9',
    },

    oddRow: {
        backgroundColor: '#fff',
    },

    selectedRow: {
        backgroundColor: '#E8F5E9',
    },

    cell: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 4,
    },

    cellText: {
        fontSize: 12,
        color: '#333',
        textAlign: 'center',
    },

    selectedCellText: {
        color: '#61C35C',
        fontWeight: '600',
    },

    priceText: {
        fontSize: 12,
        color: '#333',
        fontWeight: '500',
        textAlign: 'center',
    },

    sizeNote: {
        fontSize: 11,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 8,
        textAlign: 'center',
    },

    
    szchrt_cont: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },

    szchrt_pic: {
        height: 200,
        width: '100%',
        borderRadius: 8,
        backgroundColor: '#f8f8f8',
    },

    chartOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingVertical: 6,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
    },

    chartOverlayText: {
        color: '#fff',
        fontSize: 12,
        textAlign: 'center',
    },

    
    bottomButtons: {
        position: 'absolute',
        bottom: 1,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "space-between",
        alignContent: "center",
        backgroundColor: '#FFFBFB',
        paddingHorizontal: 20,
        paddingVertical: 15,
        paddingBottom: 50, 
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
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