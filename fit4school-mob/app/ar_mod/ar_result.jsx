// app/ar_mod/ar_result.jsx
import React, { useState } from "react";
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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import Carousel from "react-native-reanimated-carousel";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function ArResult() {
  const {
    topSize,
    bottomSize,
    shoulderCm,
    hipCm,
    userHeight,
    userUnit,
    gender,
    grade,
  } = useLocalSearchParams();

  const router = useRouter();

  // Add to Cart Modal
  const [atcModal, setAtcModal] = useState(false);
  const [selectSize, setSelectSize] = useState(null);
  const [qty, setQty] = useState(1);

  // Buy Now Modal
  const [bnModal, setBnModal] = useState(false);

  // Uniform Sizes - Using your original format
  const sizes = [
    "small",
    "medium",
    "large",
    "size 6",
    "size 7",
    "size 8",
    "size 9",
    "size 10",
    "size 11",
    "size 12",
    "size 13",
    "size 14",
  ];

  const resultSlides = [
    {
      title: "Top Size",
      size: topSize || "Unknown",
      subtitle: `Shoulder: ${shoulderCm || "N/A"} cm`,
    },
    {
      title: "Bottom Size",
      size: bottomSize || "Unknown",
      subtitle: `Hip: ${hipCm || "N/A"} cm`,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Top navigation buttons */}
      <View style={styles.btn_cont}>
        <TouchableOpacity onPress={() => router.push("/ar_mod/ar_height")}>
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

      {/* Main content */}
      <View style={{ flex: 1 }}>
        <View style={{ alignItems: "center", marginVertical: "5%" }}>
          <Image
            source={require("../../assets/images/g2_unif_ex.png")}
            style={{ width: 300, height: 300 }}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.sizeLabel}>Your Recommended Sizes</Text>

        {/* User Information Display */}
        <View style={styles.userInfo}>
          <Text style={styles.userInfoText}>
            {gender} | {grade} | Height: {userHeight} {userUnit}
          </Text>
        </View>

        {/* Carousel for Top & Bottom results */}
        <Carousel
          loop={false}
          width={screenWidth * 0.8}
          height={200}
          autoPlay={false}
          data={resultSlides}
          renderItem={({ item }) => (
            <View style={styles.resultCard}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.size}>{item.size}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
          )}
        />
      </View>

      {/* Bottom pinned buttons */}
      <View style={[styles.buy_cont, { marginTop: "auto" }]}>
        <TouchableOpacity
          style={styles.atc_btn}
          onPress={() => setAtcModal(true)}
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
          onPress={() => setBnModal(true)}
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
        onRequestClose={() => setAtcModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setAtcModal(false)}>
          <View style={styles.modal_overlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modal_cont}>
                <View style={styles.matc_cont}>
                  <View style={styles.matc_pic_cont}>
                    <Image
                      source={require("../../assets/images/b_unif_ex.png")}
                      style={styles.matc_pic}
                    />
                  </View>

                  <View style={styles.matc_desc}>
                    <Text style={styles.matc_prc}>₱400.00</Text>
                    <Text style={styles.matc_item_desc}>
                      {gender === 'male' ? "Boy's" : "Girl's"} Uniform ({grade})
                    </Text>
                  </View>
                </View>

                <Text
                  style={{ fontSize: 16, fontWeight: "600", marginTop: "8%" }}
                >
                  Size
                </Text>

                <ScrollView style={{ maxHeight: 160 }}>
                  <View style={styles.matc_sizes_cont}>
                    {sizes.map((size) => (
                      <TouchableOpacity
                        key={size}
                        onPress={() => setSelectSize(size)}
                        style={[
                          styles.matc_sizes_btn,
                          selectSize === size && styles.setSelectSize,
                        ]}
                      >
                        <Text
                          style={[
                            { fontWeight: "500", fontSize: 14, color: "black" },
                            selectSize === size && { color: "white" },
                          ]}
                        >
                          {size}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <View style={styles.matc_qty_cont}>
                  <View>
                    <Text style={{ fontWeight: "600", fontSize: 16 }}>
                      Quantity
                    </Text>
                  </View>

                  <View style={styles.matc_btn_cont}>
                    <TouchableOpacity
                      onPress={() => setQty(Math.max(1, qty - 1))}
                      style={styles.matc_qty_btn}
                    >
                      <Text style={styles.matc_qty_desc}>-</Text>
                    </TouchableOpacity>

                    <View style={styles.matc_qty_btn}>
                      <Text style={styles.matc_qty_desc}>{qty}</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => setQty(qty + 1)}
                      style={styles.matc_qty_btn}
                    >
                      <Text style={styles.matc_qty_desc}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View>
                  <TouchableOpacity
                    style={styles.matc_btn}
                    onPress={() => {
                      if (!selectSize) {
                        alert("Please select a size first!");
                        return;
                      }
                      setAtcModal(false);
                      alert(
                        `✅ Added to Cart\nSize: ${selectSize}, Qty: ${qty}`
                      );
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 20,
                        color: "white",
                        fontWeight: "600",
                      }}
                    >
                      Add to cart
                    </Text>
                  </TouchableOpacity>
                </View>
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
        onRequestClose={() => setBnModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setBnModal(false)}>
          <View style={styles.modal_overlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modal_cont}>
                <View style={styles.matc_cont}>
                  <View style={styles.matc_pic_cont}>
                    <Image
                      source={require("../../assets/images/b_unif_ex.png")}
                      style={styles.matc_pic}
                    />
                  </View>

                  <View style={styles.matc_desc}>
                    <Text style={styles.matc_prc}>₱400.00</Text>
                    <Text style={styles.matc_item_desc}>
                      {gender === 'male' ? "Boy's" : "Girl's"} Uniform ({grade})
                    </Text>
                  </View>
                </View>

                <Text
                  style={{ fontSize: 16, fontWeight: "600", marginTop: "8%" }}
                >
                  Size
                </Text>

                <ScrollView style={{ maxHeight: 160 }}>
                  <View style={styles.matc_sizes_cont}>
                    {sizes.map((size) => (
                      <TouchableOpacity
                        key={size}
                        onPress={() => setSelectSize(size)}
                        style={[
                          styles.matc_sizes_btn,
                          selectSize === size && styles.setSelectSize,
                        ]}
                      >
                        <Text
                          style={[
                            { fontWeight: "500", fontSize: 14, color: "black" },
                            selectSize === size && { color: "white" },
                          ]}
                        >
                          {size}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <View style={styles.matc_qty_cont}>
                  <View>
                    <Text style={{ fontWeight: "600", fontSize: 16 }}>
                      Quantity
                    </Text>
                  </View>

                  <View style={styles.matc_btn_cont}>
                    <TouchableOpacity
                      onPress={() => setQty(Math.max(1, qty - 1))}
                      style={styles.matc_qty_btn}
                    >
                      <Text style={styles.matc_qty_desc}>-</Text>
                    </TouchableOpacity>

                    <View style={styles.matc_qty_btn}>
                      <Text style={styles.matc_qty_desc}>{qty}</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => setQty(qty + 1)}
                      style={styles.matc_qty_btn}
                    >
                      <Text style={styles.matc_qty_desc}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View>
                  <TouchableOpacity
                    style={styles.matc_btn}
                    onPress={() => {
                      if (!selectSize) {
                        alert("Please select a size first!");
                        return;
                      }
                      setBnModal(false);
                      alert(
                        `✅ Buy Now\nSize: ${selectSize}, Qty: ${qty}`
                      );
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 20,
                        color: "white",
                        fontWeight: "600",
                      }}
                    >
                      Buy Now
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
    backgroundColor: "#FFFBFB",
    alignContent: "center",
    padding: "8.5%",
  },
  btn_cont: {
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    marginTop: "5%",
  },
  sizeLabel: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  userInfo: {
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  userInfoText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
    textAlign: "center",
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  size: {
    fontSize: 44,
    color: "#61C35C",
    fontWeight: "400",
    marginBottom: 8,
  },
  cardSubtitle: {
    color: "#757575",
    fontSize: 14,
    textAlign: "center",
  },
  buy_cont: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    bottom: "3%",
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
    paddingVertical: "7%",
    paddingHorizontal: "10%",
    height: "65%",
  },
  matc_cont: {
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
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
    justifyContent: "space-between",
    flexWrap: "wrap",
    flexDirection: "row",
    paddingVertical: "3%",
  },
  matc_sizes_btn: {
    marginVertical: "1%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 5,
    width: 90,
    height: 32,
    borderColor: "#ccc",
  },
  setSelectSize: {
    backgroundColor: "#61C35C",
    borderColor: "#61C35C",
  },
  matc_qty_cont: {
    alignContent: "center",
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    paddingVertical: "8%",
  },
  matc_btn_cont: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: "3%",
  },
  matc_qty_btn: {
    justifyContent: "center",
    alignItems: "center",
    height: 35,
    width: 35,
    borderWidth: 1,
  },
  matc_qty_desc: {
    fontSize: 20,
    fontWeight: "400",
  },
  matc_btn: {
    backgroundColor: "#61C35C",
    alignItems: "center",
    justifyContent: "center",
    height: 55,
    width: "auto",
    borderRadius: 5,
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});