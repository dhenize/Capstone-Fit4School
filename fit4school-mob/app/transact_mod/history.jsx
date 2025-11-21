//../../items_mod/

import { View, StyleSheet, Touchable, TouchableOpacity, Image, ScrollView } from "react-native";
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useRouter } from "expo-router";

export default function history() {

    const router = useRouter();

    const [activeTab, setActiveTab] = useState("completed");

    return (
     <View style={{ flex: 1, backgroundColor: "#FFFBFB" }}>
      {/* Title Box */}
      <View style={styles.titlebox}>
        <TouchableOpacity onPress={() => router.push("/dash_mod/transact")}>
          <Ionicons
            name="arrow-back-outline"
            size={26}
            color="white"
            style={{ marginHorizontal: "2%" }}
          />
        </TouchableOpacity>
        <Text style={styles.title}>History</Text>
      </View>

      {/* Tab Buttons */}
      <View style={styles.tabs_cont}>
        <View style={styles.ccr_btn}>
          <TouchableOpacity onPress={() => setActiveTab("completed")}>
            <View
              style={[
                styles.combtn,
                activeTab === "completed" && styles.activeBtn,
              ]}
            >
              <Text
                style={[
                  styles.combtn_txt,
                  activeTab === "completed" && styles.activeBtnText,
                ]}
              >
                Completed
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveTab("cancelled")}>
            <View
              style={[
                styles.canbtn,
                activeTab === "cancelled" && styles.activeBtn,
              ]}
            >
              <Text
                style={[
                  styles.canbtn_txt,
                  activeTab === "cancelled" && styles.activeBtnText,
                ]}
              >
                Cancelled
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveTab("returned")}>
            <View
              style={[
                styles.retbtn,
                activeTab === "returned" && styles.activeBtn,
              ]}
            >
              <Text
                style={[
                  styles.retbtn_txt,
                  activeTab === "returned" && styles.activeBtnText,
                ]}
              >
                Returned
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Components */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: "5%", paddingTop: "5%" }}
        >
          {/* Completed Tab */}
          {activeTab === "completed" && (
            <View style={styles.notif_cont}>
              {[1, 2].map((item) => (
                <View key={item} style={styles.notif}>
                  <Image
                    source={require("../../assets/images/b_unif_ex.png")}
                    style={styles.notif_img}
                  />

                  <View style={styles.notif_content}>
                    <View style={styles.rowBetween}>
                      <View>
                        <Text style={styles.itemTitle}>
                          Boy’s Uniform (Pre-school)
                        </Text>
                        <Text style={styles.itemSubtitle}>size 8</Text>
                      </View>
                    </View>

                    <View style={[styles.rowBetween, { marginTop: 6 }]}>
                      <Text style={styles.itemQuantity}>Quantity 2</Text>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.remarktxt}>Completed</Text>
                        <Text style={styles.itemPrice}>₱800.00</Text>
                      </View>
                    </View>

                    <View style = {{flexDirection: 'row', justifyContent: "flex-end"}}>
                      <TouchableOpacity style={styles.rebtn} onPress={() => router.push("/transact_mod/his_pt2")}>
                        <Text style={styles.rebtnText}>Return</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.ratebtn}>
                        <Text style={styles.ratebtnText}>Rate</Text>
                      </TouchableOpacity>
                    </View>
                    
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Cancelled Tab */}
          {activeTab === "cancelled" && (
            <View style={styles.notif_cont}>
              <View style={styles.notif}>
                <Image
                  source={require("../../assets/images/b_unif_ex.png")}
                  style={styles.notif_img}
                />

                <View style={styles.notif_content}>
                  <View style={styles.rowBetween}>
                    <View>
                      <Text style={styles.itemTitle}>
                        Boy’s Uniform (Pre-school)
                      </Text>
                      <Text style={styles.itemSubtitle}>size 8</Text>
                    </View>
                  </View>

                  <View style={[styles.rowBetween, { marginTop: 6 }]}>
                    <Text style={styles.itemQuantity}>Quantity 2</Text>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.remarktxt}>Cancelled</Text>
                    </View>
                  </View>
                </View>
              </View>

            </View>
          )}

          {/* Returned Tab */}
          {activeTab === "returned" && (
            <View style={styles.notif_cont}>
              <View style={styles.notif}>
                <Image
                  source={require("../../assets/images/g2_unif_ex.png")}
                  style={styles.notif_img}
                />

                <View style={styles.notif_content}>
                  <View style={styles.rowBetween}>
                    <View>
                      <Text style={styles.itemTitle}>
                        Girl’s Uniform (Elementary)
                      </Text>
                      <Text style={styles.itemSubtitle}>size 14</Text>
                    </View>
                  </View>

                  <View style={[styles.rowBetween, { marginTop: 6 }]}>
                    <Text style={styles.itemQuantity}>Quantity 1</Text>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.remarktxt}>Returned</Text>
                      <Text style={styles.itemPrice}>₱500.00</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.rebtn}>
                    <Text style={styles.rebtnText}>View Ticket</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
    );
}

const styles = StyleSheet.create({
    //TITLE CONTAINER
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

    //OVERALL CONTAINER
    tabs_cont: {
        padding: "7%",
        flex: 1,
        backgroundColor: "#FFFBFB",
    },

    ccr_btn: {
        flexDirection: "row",
        alignContent: "center",
        justifyContent: "space-between",
        paddingVertical: "2%",
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
    remarktxt: {
        color: "#1F72AD",
        fontSize: 11,
        fontWeight: "400",
    },
    itemPrice: {
        color: "#1F72AD",
        fontSize: 14,
        fontWeight: "600",
    },

    rebtn: {
        alignSelf: "flex-end",
        backgroundColor: "#D9D9D9",
        borderRadius: 5,
        paddingVertical: 8,
        paddingHorizontal: 20,
        marginTop: 5,
    },

    ratebtn: {
        alignSelf: "flex-end",
        backgroundColor: "#D9D9D9",
        borderRadius: 5,
        paddingVertical: 8,
        paddingHorizontal: 20,
        marginTop: 5,
        marginLeft: '2%',
    },

    rebtnText: {
        color: "black",
        fontSize: 13,
        fontWeight: "600",
    },

    ratebtnText: {
        color: "black",
        fontSize: 13,
        fontWeight: "600",
    },

});
