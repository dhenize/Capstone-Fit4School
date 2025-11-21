// app/ar_mod/ar_grdlevel.jsx
import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "../../components/globalText";
import { Picker } from "@react-native-picker/picker";

export default function ArGrdLevel() {
  const router = useRouter();
  const [grlevel, setGrLevel] = useState("");
  const { height, unit, gender } = useLocalSearchParams();

  // Grade Levels
  const grValues = ["Pre-School", "Elementary", "Junior High"];

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

      {/* Grade Level Box */}
      <View style={styles.boxcont}>
        <View style={styles.box}>
          <Text style={{ fontSize: 18, fontWeight: "500" }}>
            Please select your Grade Level
          </Text>
          <Text style={styles.infos}>
            This helps us tailor your experience accordingly.
          </Text>

          <View style={styles.row}>
            <Text style={{ fontSize: 22, fontWeight: "500" }}>Grade Level</Text>

            <View
              style={{
                alignItems: "center",
                height: "79%",
                width: '55%',
                bottom: 5,
                marginLeft: "10%",
              }}
            >
              <Picker
                selectedValue={grlevel}
                style={{ width: "100%" }}
                itemStyle={{ textAlign: "center" }}
                onValueChange={(val) => setGrLevel(val)}
              >
                <Picker.Item label="Select here..." value="" />
                {grValues.map((val) => (
                  <Picker.Item
                    key={val}
                    label={val}
                    value={val}
                    style={{ fontSize: 18 }}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </View>

      {/* Continue Button */}
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <TouchableOpacity
          style={styles.enterBtn}
          onPress={() =>
            router.push({
              pathname: "/ar_mod/ar_calc",
              params: { 
                height, 
                unit, 
                gender, 
                grade: grlevel
              },
            })
          }
        >
          <Text style={{ fontSize: 20, fontWeight: "600", color: "white" }}>
            Enter
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
    justifyContent: "center",
  },
  box: {
    padding: "6%",
    justifyContent: "center",
  },
  infos: {
    fontSize: 15,
    textAlign: "justify",
    marginVertical: "7%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: "5%",
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