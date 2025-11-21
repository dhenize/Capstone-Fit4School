// app/ar_mod/ar_height.jsx

import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text } from "../../components/globalText";

// For AR Fitting
import * as tf from "@tensorflow/tfjs";
import { Camera } from "expo-camera";
import { Picker } from "@react-native-picker/picker";
import HelpModal from "../../components/ar_com/help_modal";

export default function ArHeight() {
  const [helpVisible, setHelpVisible] = useState(false);
  const [height, setHeight] = useState("");
  const [unit, setUnit] = useState("ft");
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    async function prepare() {
      await tf.ready();
      console.log("✅ TensorFlow.js is ready!");

      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    }
    prepare();
  }, []);

  if (hasPermission === null)
    return (
      <View style={styles.centered}>
        <Text>Requesting for camera permission...</Text>
      </View>
    );

  if (!hasPermission)
    return (
      <View style={styles.centered}>
        <Text>No access to camera</Text>
      </View>
    );

  //Height Values
  const ftValues = [
    "3.0 ft",
    "3.5 ft",
    "4.0 ft",
    "4.2 ft",
    "4.3 ft",
    "4.5 ft",
    "4.8 ft",
    "5.0 ft",
    "5.2 ft",
    "5.3 ft",
    "5.5 ft",
    "5.8 ft",
    "5.10 ft",
    "6.0 ft",
  ];

  const cmValues = [
    "91 cm",
    "107 cm",
    "122 cm",
    "128 cm",
    "131 cm",
    "137 cm",
    "146 cm",
    "152 cm",
    "159 cm",
    "162 cm",
    "168 cm",
    "177 cm",
    "178 cm",
    "183 cm",
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: "8.5%", justifyContent: "space-between" }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setHelpVisible(true)}>
            <Ionicons name="alert-circle-outline" size={28} color="black" />
          </TouchableOpacity>

          <HelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />

          <TouchableOpacity onPress={() => router.push("/dash_mod/home")}>
            <Ionicons name="close-outline" size={28} color="black" />
          </TouchableOpacity>
        </View>

        {/* Height Box */}
        <View style={styles.boxcont}>
          <View style={styles.box}>
            <Text style={{ fontSize: 18, fontWeight: 500 }}>Please Enter your Height</Text>
            <Text style={styles.infos}>
              Height is optional but highly encouraged.
            </Text>

            {/* Height Picker */}
            <View>
              <View style={styles.row}>
                <Text style={{ fontSize: 22, fontWeight: 500 }}>Height</Text>

                <View
                  style={{
                    alignItems: "center",
                    height: "79%",
                    width: '45%',
                    bottom: 5,
                    marginLeft: "10%",
                  }}
                >
                  <Picker
                    selectedValue={height}
                    style={{ width: "100%" }}
                    itemStyle={{ textAlign: "center" }}
                    onValueChange={(val) => setHeight(val)}
                  >
                    {(unit === "ft" ? ftValues : cmValues).map((val) => (
                      <Picker.Item key={val} label={val} value={val} style = {{ fontSize: 22, fontWeight: "700" }}/>
                    ))}
                  </Picker>
                </View>

                {/* FT / CM toggle */}
                <View style={{ flexDirection: "row", marginLeft: 10 }}>
                  <TouchableOpacity onPress={() => setUnit("ft")}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: unit === "ft" ? "700" : "200",
                        marginRight: 6,
                      }}
                    >
                      ft
                    </Text>
                  </TouchableOpacity>

                  <Text style={{ fontSize: 18 }}>|</Text> 
                  
                  <TouchableOpacity onPress={() => setUnit("cm")}>
                    <Text
                      style={{
                        fontSize: 18, 
                        fontWeight: unit === "cm" ? "700" : "200",
                        marginLeft: 6,
                      }}
                    >
                      cm
                    </Text>
                  </TouchableOpacity>
                </View>
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
                pathname: "/ar_mod/ar_gender",
                params: { height, unit },
              })
            }
          >
            <Text style={{ fontSize: 20, fontWeight: "600", color: "white" }}>
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },

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
    marginVertical: "7%" 
  },

  row: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginVertical: '5%'
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
