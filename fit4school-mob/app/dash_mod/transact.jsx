import React, { useState, useEffect } from "react";
import { TouchableWithoutFeedback } from "react-native";
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
import { collection, getDocs, query, where } from "firebase/firestore";
import QRCode from "react-native-qrcode-svg";

export default function Transact() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("appointments");
  const [isChecked, setIsChecked] = useState(false);

  const [cartItems, setCartItems] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [currentQrValue, setCurrentQrValue] = useState("");

  

  // Load cart items from AsyncStorage
  useEffect(() => {
    const loadCart = async () => {
      try {
        const storedCart = await AsyncStorage.getItem("cart");
        if (storedCart) setCartItems(JSON.parse(storedCart));
      } catch (error) {
        console.error("Failed to load cart: ", error);
      }
    };
    loadCart();
  }, []);

  // Fetch transactions from Firestore
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!auth.currentUser) return;

      try {
        const q = query(
          collection(db, "cartItems"),
          where("requestedBy", "==", auth.currentUser.uid)
        );

        const querySnapshot = await getDocs(q);
        const fetchedAppointments = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedAppointments.push({
            id: doc.id, // Firestore document ID
            items: data.items,
            date: data.date || null,
            paymentMethod: data.paymentMethod || "cash",
            orderTotal: data.orderTotal || "Failed to fetch",
            status: data.status,
          });
        });

        setAppointments(fetchedAppointments);
      } catch (error) {
        console.error("Error fetching appointments: ", error);
      }
    };

    fetchAppointments();
  }, []);

  const removeItem = async (index) => {
    const updatedCart = [...cartItems];
    updatedCart.splice(index, 1);
    setCartItems(updatedCart);
    await AsyncStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const openQrModal = (docId) => {
    setCurrentQrValue(docId);
    setQrModalVisible(true);
  };

  const closeQrModal = () => {
    setQrModalVisible(false);
    setCurrentQrValue("");
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
                Appointments
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

        <View style={{ alignItems: "flex-end", paddingVertical: "5%" }}>
          <Checkbox
            value={isChecked}
            onValueChange={setIsChecked}
            color={isChecked ? "#49454F" : undefined}
          />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: "5%" }}>
          {activeTab === "appointments" ? (
            appointments.length === 0 ? (
              <Text style={{ textAlign: "center", marginTop: 50 }}>
                No appointments yet
              </Text>
            ) : (
              appointments.map((transaction, index) => (
                <View key={index} style={styles.notif}>
                  <View style={styles.notif_content}>
                    {transaction.items.map((item, idx) => (
                      <View key={idx} style={{ marginBottom: 10 }}>
                        <View style={styles.rowBetween}>
                          <View>
                            <Text style={styles.itemTitle}>{item.itemCode}</Text>
                            <Text style={styles.itemSubtitle}>{item.size}</Text>
                          </View>
                        </View>
                        <View style={[styles.rowBetween, { marginTop: 6 }]}>
                          <Text style={styles.itemQuantity}>Quantity x{item.quantity}</Text>
                          <Text style={styles.itemPrice}>₱{item.price}</Text>
                        </View>
                      </View>
                    ))}

                    <View style={[styles.rowBetween, { marginTop: 10 }]}>
                      <Text style={{ fontWeight: "600", fontSize: 16 }}>Order Total:</Text>
                      <Text style={{ fontWeight: "600", fontSize: 16 }}>₱{transaction?.orderTotal}</Text>
                    </View>

                    <View style={[styles.rowBetween, { marginTop: 6 }]}>
                      <Text style={{ fontWeight: "500", fontSize: 14 }}>Payment Method:</Text>
                      <Text style={{ fontSize: 14 }}>{transaction.paymentMethod}</Text>
                    </View>
                    <View style={[styles.rowBetween, { marginTop: 6 }]}>
                      <Text style={{ fontWeight: "500", fontSize: 14 }}>Status:</Text>
                      <Text style={{ fontSize: 14 }}>{transaction.status}</Text>
                    </View>

                    {/* QR Button */}
                    <TouchableOpacity
                      style={styles.qrBtn}
                      onPress={() => openQrModal(transaction.id)}
                    >
                      <Text style={{ color: "white", fontWeight: "600" }}>View QR</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )
          ) : (
            cartItems.length === 0 ? (
              <Text style={{ textAlign: "center", marginTop: 50 }}>
                Your cart is empty
              </Text>
            ) : (
              cartItems.map((item, index) => (
                <View key={index} style={styles.notif}>
                  <Image source={{ uri: item.imageUrl }} style={styles.notif_img} />
                  <View style={styles.notif_content}>
                    <View style={styles.rowBetween}>
                      <View>
                        <Text style={styles.itemTitle}>{item.itemCode}</Text>
                        <Text style={styles.itemSubtitle}>{item.size}</Text>
                      </View>
                    </View>
                    <View style={[styles.rowBetween, { marginTop: 6 }]}>
                      <Text style={styles.itemQuantity}>Quantity {item.quantity}</Text>
                      <Text style={styles.itemPrice}>₱{item.price}</Text>
                    </View>
                  </View>
                </View>
              ))
            )
          )}

          {/* Keep this button exactly as-is */}
          <TouchableOpacity
            onPress={() =>
              router.push(
                activeTab === "appointments"
                  ? "/transact_mod/history"
                  : "/transact_mod/checkout"
              )
            }
          >
            <View style={styles.hisbtn}>
              <Image
                source={
                  activeTab === "appointments"
                    ? require("../../assets/images/icons/gen_icons/history.png")
                    : require("../../assets/images/icons/gen_icons/checkout-bag.png")
                }
                style={styles.his_pic}
              />
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* QR Modal */}
      <Modal
  visible={qrModalVisible}
  transparent={true}
  animationType="slide"
  onRequestClose={closeQrModal} // Android back button
>
  <View style={styles.modalOverlay}>
    <View style={styles.qrModalContainer}>
      {/* Header with Back Button */}
      <View style={styles.qrModalHeader}>
        <TouchableOpacity onPress={closeQrModal}>
          <Ionicons name="arrow-back-outline" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.qrModalTitle}>Your Order QR</Text>
        <View style={{ width: 28 }} /> {/* Placeholder for alignment */}
      </View>

      {/* QR Code */}
      <View style={styles.qrModalContent}>
        {currentQrValue ? (
          <QRCode value={currentQrValue} size={250} />
        ) : (
          <Text style={{ fontSize: 16, color: "#333" }}>No QR data</Text>
        )}
      </View>
    </View>
  </View>
</Modal>
    </View>
  );
}



const styles = StyleSheet.create({
  //TITLE CONTAINER
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

  //OVERALL CONTAINER
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
  },
  tabs_cont: {
    padding: "7%",
    flex: 1,
    backgroundColor: "#FFFBFB",
  },

  srbtn_cont: {
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "space-between",
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

  notif: {
    flexDirection: "row",
    marginVertical: "2.5%",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#F4F4F4",
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignItems: "center",
  },

  notif_img: {
    height: 70,
    width: 70,
    resizeMode: "contain",
    marginRight: 10,
    alignSelf: 'flex-start',
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
  toClaim: {
    color: "#1F72AD",
    fontSize: 11,
    fontWeight: "400",
  },
  itemPrice: {
    color: "#1F72AD",
    fontSize: 14,
    fontWeight: "600",
  },

  ticketBtn: {
    alignSelf: "flex-end",
    backgroundColor: "#D9D9D9",
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 5,
  },

  chng_btn: {
    backgroundColor: "#D9D9D9",
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginTop: 5,
  },

  del_btn: {
    backgroundColor: "#FFD5D5",
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginTop: 5,
    marginLeft: '2%',
  },

  ticketBtnText: {
    color: "black",
    fontSize: 13,
    fontWeight: "600",
  },

  chngbtn_txt: {
    color: "black",
    fontSize: 13,
    fontWeight: "600",
  },

  delbtn_txt: {
    color: "#FF6767",
    fontSize: 13,
    fontWeight: "600",
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
    bottom: "20%",
  },

  his_pic: {
    height: 40,
    width: 40,
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
  }
});
