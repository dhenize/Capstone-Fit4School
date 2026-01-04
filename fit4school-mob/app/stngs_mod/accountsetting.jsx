import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import React from "react";
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function settings() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFBFB" }}>
      <View style={styles.titlebox}>
        <TouchableOpacity onPress={() => router.push("/dash_mod/account")}>
          <Ionicons name="arrow-back-outline" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Account Setting</Text>
      </View>

      <View style={styles.container}>
        <View style={styles.menu_cont}>
          <TouchableOpacity 
            style={styles.menubtn} 
            onPress={() => router.push("/stngs_mod/prsn_info")}
          >
            <Image 
              source={require('../../assets/images/icons/gen_icons/personal-info.png')}
              style={styles.icon}
            />
            <Text style={styles.menu_txt}>Personal Information</Text>
            <Ionicons name="chevron-forward-outline" size={28} color="black" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menubtn} 
            onPress={() => router.push("/stngs_mod/upd_email")}
          >
            <Image 
              source={require('../../assets/images/icons/gen_icons/email.png')}
              style={styles.icon}
            />
            <Text style={styles.menu_txt}>Email</Text>
            <Ionicons name="chevron-forward-outline" size={28} color="black" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titlebox: {
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#0FAFFF",
    padding: "10%",
    height: "14%",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },

  title: {
    fontWeight: "500",
    fontSize: 24,
    color: "white",
    justifyContent: "center",
  },

  container: {
    flex: 1,
    padding: "7%",
    backgroundColor: "#FFFBFB",
  },

  menu_cont: {
    paddingHorizontal: '8%',
  },

  menu_txt: {
    fontWeight: '400',
    fontSize: 15,
    flex: 1,
    color: '#000'
  },

  menubtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: '5%',
    gap: 15,
  },

  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain'
  }
});