import { View, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, Dimensions, Platform } from "react-native";
import React, { useState, useEffect } from "react";
import { Picker } from "@react-native-picker/picker";
import { Text } from "../../components/globalText";
import { useRouter } from "expo-router";
import { db, auth } from "../../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');


const getResponsiveFontSize = (baseSize) => {
  if (windowWidth <= 320) return baseSize * 0.8; 
  if (windowWidth <= 375) return baseSize * 0.9; 
  if (windowWidth <= 425) return baseSize * 0.95; 
  if (windowWidth <= 768) return baseSize;
  if (windowWidth <= 1024) return baseSize * 1.1; 
  if (windowWidth <= 1440) return baseSize * 1.2; 
  return baseSize * 1.4; 
};

const getResponsiveHeight = (baseHeight) => {
  if (windowHeight <= 568) return baseHeight * 0.7; 
  if (windowHeight <= 667) return baseHeight * 0.8; 
  if (windowHeight <= 736) return baseHeight * 0.9; 
  if (windowHeight <= 812) return baseHeight; 
  if (windowHeight <= 896) return baseHeight * 1.1; 
  if (windowHeight <= 1024) return baseHeight * 1.2; 
  return baseHeight * 1.3; 
};

const getResponsivePadding = (basePadding) => {
  const scale = windowWidth / 375; 
  return basePadding * Math.min(scale, 1.5);
};

const getResponsiveMargin = (baseMargin) => {
  const scale = windowWidth / 375;
  return baseMargin * Math.min(scale, 1.5);
};


const FAQ_CONTENT = `Frequently Asked Questions (FAQs)

Q1. What is Fit4School?

Fit4School is a digital platform that allows students and parents to order school uniforms online, verify payments and use AR camera for school uniform fitting— all in one place, making the process faster and more organized.


Q2. How do I create an account?

This is the step-by-step guide on how to create your Fit4School account:

First, download the Fit4School mobile app from this link.
Install the application.
Now, tap the "Sign Up" button.
Fill out the "Email" and "Create Password" input fields.
After that, an email verification will be sent to your email, which may appear in your spam folder.
Click the verification link provided by the system.
You will then be redirected to another page to fill out your name, contact number, and role (e.g., Parent, Student, Legal Guardian).
Once confirmed, enter your child's student number to verify that you are a parent of an enrolled student.
If the details are correct, tap "OK." Otherwise, enter the correct student number.
Once registered, you can log in and start ordering uniforms.


Q3. How do I order a school uniform?

Follow this steps on how to order your desired school uniform(s):

Sign in to your Fit4School account.
Choose your desired uniform.
You may choose to add it to your cart or buy it immediately.
Select your desired uniform size and quantity, then tap the button to add the item to your cart or you may proceed to checkout if you want to.
From Add to Cart:
To view your cart, tap the Transact menu.
Tap "My Cart."
Tap the checkbox to select the items you want to checkout then tap the "Checkout" button with the bag icon at the lower right corner of your screen.
Choose your payment method and tap "Place Order."
A message will pop-up about the terms and conditions, after it shows up simply tap "OK."
Another message will pop-up, saying that the order is successful and the ticket has been generated. After that, tap the "View Ticket."
You can now finally view your ticket and you can download its PDF file.
From Buy Now:
Choose your payment method and tap "Place Order"
A message will pop-up about the terms and conditions. Simply tap "OK."
Another message will pop-up, saying that the order is successful and the ticket has been generated. Once generated, tap the "View Ticket."
You can finally view your ticket and you can download its PDF file.
Proceed to payment (on-site) and wait for confirmation.
Wait for your order to arrive at the school for pickup.
You can view the current status of your orders in the transaction tab under the  Transact menu.


Q4. How do I pay for my order?

The school provides on-campus cashier payment through cash or bank transfer, and after payment, your order will be verified by the school's accountant.


Q5. How do I use the AR camera for uniform fitting?

Tap the green circle AR camera button from the homepage.
Next, enter your child's height.
Then select their gender and grade level, after that tap the "Enter" button. 
A message will pop-up indicating that the camera is ready. Align your child's face and body to fit them inside the green silhouette on the screen, and then tap "Capture Front."
Now, align your child's side view and fit them inside the green silhouette on the screen, and then tap "Capture Side."
Wait for a few seconds and the estimated measurement of your child's top and bottom will be displayed.


Q6. Can I change or cancel my order?

Once an order is confirmed, changes or cancellations are subject to the school's approval. Please contact your school's uniform department or admin for assistance.


Q7. What should I do if I forget my password?

In order to gain access to your account, simply tap the "Forgot Password" below the password input box on the sign in page. Then after that, enter your registered email to receive a verification link, which may be found in your spam folder. Tap the link to verify your request. Once verified, you can set your new password, and confirm it when you are done.

Q8. Who should I contact for problems or concerns?

For any issues, you may contact us at:
📧 fit4school.official@gmail.com`;

export default function Home() {
  const router = useRouter();
  const [sort, setSort] = useState("all");
  const [uniforms, setUniforms] = useState([]);
  const [userData, setUserData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  
  useEffect(() => {
    
    const getUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("userData");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setUserData(user);
        } else {
          
          const oldUser = await AsyncStorage.getItem("lastUser");
          if (oldUser) {
            const user = JSON.parse(oldUser);
            setUserData(user);
            
            await AsyncStorage.setItem("userData", oldUser);
          }
        }
      } catch (error) {
        console.error("Error getting user data:", error);
      }
    };

    
    const fetchUniforms = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "uniforms"));
        const items = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        setUniforms(items);
      } catch (error) {
        console.error("Error fetching uniforms: ", error);
      }
    };

   
    const fetchCurrentOrder = async () => {
      try {
        if (!auth.currentUser) {
          console.log("No authenticated user");
          setLoadingOrder(false);
          return;
        }

        
        const q = query(
          collection(db, "cartItems"),
          where("requestedBy", "==", auth.currentUser.uid)
        );

        const querySnapshot = await getDocs(q);
        const activeOrders = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const status = data.status?.toLowerCase();
          
          
          if (status === 'to pay' || status === 'to receive') {
            
            const items = Array.isArray(data.items) ? data.items : [];
            
            if (items.length > 0) {
              activeOrders.push({
                id: doc.id,
                orderId: data.orderId || doc.id,
                status: data.status,
                orderTotal: data.orderTotal || "0",
                createdAt: data.createdAt,
                items: items,
                itemsCount: items.length
              });
            }
          }
        });

       
        activeOrders.sort((a, b) => {
          try {
            const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
            return dateB - dateA; 
          } catch (error) {
            console.error("Error sorting dates:", error);
            return 0;
          }
        });

        
        if (activeOrders.length > 0) {
          const mostRecentOrder = activeOrders[0];
          const firstItem = mostRecentOrder.items[0];
          
          setCurrentOrder({
            ...mostRecentOrder,
            item: firstItem
          });
        } else {
          
          setCurrentOrder(null);
        }
      } catch (error) {
        console.error("Error fetching current order: ", error);
        setCurrentOrder(null);
      } finally {
        setLoadingOrder(false);
      }
    };

    
    getUserData();
    fetchUniforms();
    fetchCurrentOrder();
  }, []);

  const filteredUniforms = uniforms.filter(u => sort === "all" || u.grdLevel === sort);

  const handleFAQsPress = () => {
    setModalVisible(true);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'to receive': return '#FFA500';
      case 'to pay': return '#0FAFFF';
      default: return '#666';
    }
  };

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={[styles.header, { 
        marginTop: getResponsiveMargin(20),
        marginBottom: getResponsiveMargin(10)
      }]}>
        <View style={styles.greet}>
          <Text style={{ 
            fontSize: getResponsiveFontSize(20), 
            fontWeight: '400',
            marginBottom: windowHeight > 800 ? 5 : 3
          }}>Hello</Text>
          <Text style={{ 
            color: '#0FAFFF', 
            fontSize: getResponsiveFontSize(20), 
            fontWeight: '500' 
          }}>
            {userData ? `${userData.fname} ${userData.lname}!` : "Loading..."}
          </Text>        
        </View>
        <View style={styles.helpbtn}>
          <TouchableOpacity 
            style={[styles.button, { 
              width: windowWidth > 768 ? 70 : 60,
              height: windowWidth > 768 ? 30 : 25
            }]} 
            onPress={handleFAQsPress}
          >
            <Text style={{ 
              fontSize: getResponsiveFontSize(13), 
              fontWeight: '400' 
            }}>FAQs</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CURRENT PROCESSING ORDER */}
      <View style={{ marginBottom: getResponsiveMargin(10) }}>
        <Text style={{ 
          fontSize: getResponsiveFontSize(15), 
          fontWeight: '500', 
          textAlign: "left", 
          marginBottom: '2%', 
          marginTop: windowHeight > 800 ? '5%' : '3%',
        }}>
          Current Processing Order
        </Text>
      </View>

      {loadingOrder ? (
        <View style={[styles.cpo_cont, { 
          minHeight: getResponsiveHeight(90),
          padding: getResponsivePadding(12),
          marginBottom: getResponsiveMargin(15),
          alignItems: 'center',
          justifyContent: 'center'
        }]}>
          <Text style={{ 
            fontSize: getResponsiveFontSize(14), 
            color: '#666'
          }}>Loading order...</Text>
        </View>
      ) : currentOrder ? (
        <TouchableOpacity onPress={() => router.push("/dash_mod/transact")}>
          <View style={[styles.cpo_cont, { 
            minHeight: getResponsiveHeight(90),
            padding: getResponsivePadding(12),
            marginBottom: getResponsiveMargin(15)
          }]}>
            <View style={styles.cpo_pic}>
              <Image
                source={{ uri: currentOrder.item.imageUrl }}
                style={{ 
                  height: getResponsiveHeight(70), 
                  width: getResponsiveHeight(70), 
                  borderRadius: 10 
                }}
              />
            </View>

            <View style={[styles.cpo_desc, { flex: 1 }]}>
              <View style={styles.orderHeader}>
                <Text style={{ 
                  color: '#0FAFFF', 
                  fontSize: getResponsiveFontSize(14), 
                  fontWeight: '600', 
                  textAlign: "left",
                  flex: 1,
                  flexWrap: 'wrap' 
                }}>
                  Your Order is being processed!
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentOrder.status) }]}>
                  <Text style={styles.statusText}>{currentOrder.status}</Text>
                </View>
              </View>
              
              <Text style={{ 
                color: '#000000', 
                fontSize: getResponsiveFontSize(12), 
                fontWeight: '400', 
                textAlign: "left",
                marginTop: 4,
                flexWrap: 'wrap' 
              }}>
                {currentOrder.item.itemCode}
              </Text>
              
              <View style={styles.orderDetails}>
                <Text style={{ 
                  color: '#61C35C', 
                  fontSize: getResponsiveFontSize(11), 
                  fontWeight: '400', 
                  textAlign: "left",
                  marginRight: 15
                }}>
                  Size: {currentOrder.item.size}
                </Text>
                <Text style={{ 
                  color: '#61C35C', 
                  fontSize: getResponsiveFontSize(12), 
                  fontWeight: '500',
                  marginRight: 15
                }}>
                  Qty: {currentOrder.item.quantity}
                </Text>
                <Text style={{ 
                  color: '#61C35C', 
                  fontSize: getResponsiveFontSize(13), 
                  fontWeight: '600'
                }}>
                  ₱{currentOrder.item.price}
                </Text>
              </View>
              
              <Text style={{ 
                color: '#666', 
                fontSize: getResponsiveFontSize(10), 
                fontWeight: '400', 
                textAlign: "left",
                marginTop: 5,
                flexWrap: 'wrap' 
              }}>
                Order ID: {currentOrder.orderId}
              </Text>
              
              <View style={styles.clickInstruction}>
                <Text style={styles.clickInstructionText}>Tap to view details →</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => router.push("/dash_mod/transact")}>
          <View style={[styles.cpo_cont, { 
            minHeight: getResponsiveHeight(90),
            padding: getResponsivePadding(12),
            marginBottom: getResponsiveMargin(15),
            alignItems: 'center',
            justifyContent: 'center'
          }]}>
            <Text style={[styles.emptyOrderText, { 
              fontSize: getResponsiveFontSize(14), 
              fontWeight: '500',
              color: '#666',
              marginBottom: 8
            }]}>No active orders</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* SORT AND DROPDOWN */}
      <View style={[styles.sort_cont, { 
        paddingVertical: getResponsivePadding(10),
        marginBottom: getResponsiveMargin(5)
      }]}>
        <View>
          <Text style={{ 
            fontSize: getResponsiveFontSize(13), 
            fontWeight: '500', 
            textAlign: "left" 
          }}>
            {uniforms.length} Items
          </Text>
        </View>
        <View style={[styles.drop_cont, { 
          width: windowWidth > 768 ? 160 : 145,
          height: windowWidth > 768 ? 45 : 40
        }]}>
          <Picker 
            selectedValue={sort} 
            style={[styles.dropdown, { 
              height: windowWidth > 768 ? 52 : 51,
              width: windowWidth > 768 ? 160 : 145
            }]} 
            onValueChange={(itemValue) => setSort(itemValue)}
          >
            <Picker.Item label="All Items" value="all" style={styles.drop_txt} />
            <Picker.Item label="Kindergarten" value="Kindergarten" style={styles.drop_txt} />
            <Picker.Item label="Elementary" value="Elementary" style={styles.drop_txt} />
            <Picker.Item label="Junior High" value="Junior High" style={styles.drop_txt} />
          </Picker>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ 
          paddingBottom: getResponsivePadding(50),
          paddingTop: getResponsivePadding(5)
        }}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.unif_cont}>
          {filteredUniforms.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              onPress={() => router.push({
                pathname: "/transact_mod/uniforms",
                params: { uniformId: item.id }
              })}
              style={styles.unif_touchable}
            >
              <View style={[styles.unif_grid, { 
                marginVertical: windowHeight > 800 ? '6%' : '4%'
              }]}>
                <Image 
                  source={{ uri: item.imageUrl }} 
                  style={[styles.unif_pics, { 
                    height: getResponsiveHeight(140),
                    width: getResponsiveHeight(140)
                  }]} 
                />
                <Text style={[styles.unif_desc, { 
                  fontSize: getResponsiveFontSize(15)
                }]}>{item.category} {item.gender}</Text>
                <Text style={[styles.unif_lvl, { 
                  fontSize: getResponsiveFontSize(12)
                }]}>({item.grdLevel})</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* FAQs Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, {
            width: windowWidth > 768 ? windowWidth * 0.7 : windowWidth * 0.9,
            maxHeight: windowHeight * 0.8,
            padding: getResponsivePadding(20)
          }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {
                fontSize: getResponsiveFontSize(20)
              }]}>
                Frequently Asked Questions
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.faqContent}>
              <Text style={[styles.faqText, {
                fontSize: getResponsiveFontSize(14),
                lineHeight: getResponsiveFontSize(20)
              }]}>
                {FAQ_CONTENT}
              </Text>
            </ScrollView>
            
            <TouchableOpacity
              style={[styles.modalButton, {
                padding: getResponsivePadding(12),
                marginTop: getResponsiveMargin(15)
              }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, {
                fontSize: getResponsiveFontSize(16)
              }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}


const styles = StyleSheet.create({
  
  container: {
    paddingHorizontal: Platform.select({
      web: Dimensions.get('window').width > 768 ? '5%' : '8.5%',
      default: '8.5%'
    }),
    paddingTop: Platform.select({
      web: Dimensions.get('window').width > 768 ? '3%' : '8.5%',
      default: '8.5%'
    }),
    paddingBottom: '2%',
    flex: 1,
    backgroundColor: '#FFFBFB',
  },

  
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
  },

  button: {
    backgroundColor: "#FFFF20",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    shadowColor: 'black',
    elevation: 10,
    shadowOpacity: 0.90,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 4 },
  },

  
  cpo_cont: {
    backgroundColor: '#F4F4F4',
    borderRadius: 10,
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    flexDirection: "row",
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '5%',
  },

  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', 
    marginBottom: 4,
    flexWrap: 'wrap', 
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8, 
    flexShrink: 0, 
  },

  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "white",
  },

  orderDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
  },

  cpo_desc: {
    flex: 1,
    flexShrink: 1, 
  },

  
  clickInstruction: {
    alignItems: 'flex-end',
    marginTop: 5,
  },

  clickInstructionText: {
    fontSize: 10,
    color: "#0FAFFF",
    fontWeight: "500",
  },

  
  emptyOrderText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },

  emptyOrderSubtext: {
    fontSize: 12,
    color: "#999",
    textAlign: 'center',
    paddingHorizontal: 10, 
  },

 
  sort_cont: {
    flexDirection: "row",
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  drop_cont: {
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 6,
  },

  dropdown: {
    marginTop: -6,
  },

  drop_txt: {
    fontSize: 13,
    fontWeight: '600',
  },

  
  unif_pics: {
    marginBottom: '5%',
    borderRadius: 10,
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  unif_cont: {
    flexDirection: "row",
    flexWrap: 'wrap',
    justifyContent: Platform.select({
      web: Dimensions.get('window').width > 768 ? 'flex-start' : 'space-between',
      default: 'space-between'
    }),
    gap: Platform.select({
      web: Dimensions.get('window').width > 768 ? 20 : 0,
      default: 0
    }),
  },

  unif_touchable: {
    width: Platform.select({
      web: Dimensions.get('window').width > 768 ? 
           (Dimensions.get('window').width > 1024 ? '23%' : '30%') : 
           '48%',
      default: '48%'
    }),
  },

  unif_grid: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  unif_desc: {
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 2,
  },

  unif_lvl: {
    color: '#61C35C',
    fontWeight: '600',
  },

  
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },

  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 10,
  },

  modalTitle: {
    fontWeight: '600',
    color: '#0FAFFF',
    flex: 1,
  },

  closeButton: {
    padding: 5,
  },

  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },

  faqContent: {
    maxHeight: Dimensions.get('window').height * 0.5,
  },

  faqText: {
    color: '#333',
    textAlign: 'justify',
  },

  modalButton: {
    backgroundColor: '#0FAFFF',
    borderRadius: 8,
    alignItems: 'center',
  },

  modalButtonText: {
    color: 'white',
    fontWeight: '600',
  },

}); 