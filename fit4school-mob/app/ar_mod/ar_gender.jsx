import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "../../components/globalText";


export default function ArGender() {

  const router = useRouter();
  const { height, unit } = useLocalSearchParams();
  const [gender, setGender] = useState(null);


  return (
    <View style={{ flex: 1, padding: "8.5%", justifyContent: "space-between" }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={28} color="black" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/dash_mod/home")}>
          <Ionicons name="close-outline" size={28} color="black" />
        </TouchableOpacity>
      </View>

      {/* Gender Box */}
      <View style={styles.boxcont}>
        <View style={styles.box}>
          <Text style={{ fontSize: 18, fontWeight: 500 }}>Please Enter Your Gender</Text>
          <Text style={styles.infos}>
            This is required.
          </Text>

          {/* Gender Selection */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              marginVertical: "22%",
            }}
          >
            <TouchableOpacity
              style={styles.radioBtn}
              onPress={() => setGender("male")}
            >
              <Ionicons
                name={gender === "male" ? "radio-button-on" : "radio-button-off"}
                size={30}
                color={gender === "male" ? "#61C35C" : "black"}
              />
              <Text style={{ fontSize: 22, fontWeight: 500, marginLeft: 6 }}>
                Male
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioBtn}
              onPress={() => setGender("female")}
            >
              <Ionicons
                name={gender === "female" ? "radio-button-on" : "radio-button-off"}
                size={30}
                color={gender === "female" ? "#61C35C" : "black"}
              />
              <Text style={{ fontSize: 22, fontWeight: 500, marginLeft: 6 }}>
                Female
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Enter Button */}
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <TouchableOpacity
          style={styles.enterBtn}
          onPress={() =>
            router.push({
              pathname: "/ar_mod/ar_grdlevel",
              params: { height, unit, gender },
            })
          }
        >
          <Text style={{ fontSize: 20, fontWeight: "600", color: "white" }}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    top: "2%",
  },

  boxcont: { 
    alignItems: "center", 
    justifyContent: 'center'
  },

  box: {
    padding: "6%",
    justifyContent: "center",
  },

  infos: { 
    fontSize: 15, 
    textAlign: "justify", 
    marginTop: "3%" 
  },

  radioBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: 'center',
    marginHorizontal: "10%",
  },

  enterBtn: {
    alignItems: "center",
    backgroundColor: "#61C35C",
    padding: "3%",
    width: "65%",
    borderRadius: 5,
    shadowColor: "black",
    elevation: 5,
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 4 },
    bottom: 65,
  },
});