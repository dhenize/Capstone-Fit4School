import { View, StyleSheet, TouchableOpacity } from "react-native";
import React, {useState} from "react";
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function settings() {

  const router = useRouter();

  const [menu, setMenu] = useState("");

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFBFB" }}>

      <View style={styles.titlebox}>
        <TouchableOpacity onPress={() => router.push("/dash_mod/account")}>
          <Ionicons name="arrow-back-outline" size={28} color="white" />
        </TouchableOpacity>

        <Text style={styles.title}>Settings</Text>
      </View>


      <View style = {styles.container}>
        <View style = {styles.menu_cont}>

          <TouchableOpacity style= {styles.menubtn}
            value="acc_set"
            onPress={() => setMenu("acc_set")}
          >
            <Text style = {styles.menu_txt}>
              Account Settings
            </Text>
            <Ionicons name="chevron-forward-outline" size={28} color="black" />
          </TouchableOpacity>

          {menu === "acc_set" && (
            <>
            <View style={styles.submen_cont}>
                <TouchableOpacity onPress={() => router.push("/stngs_mod/prsn_info")}>
                  <Text style={styles.menu_txt}>Personal Information</Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => router.push("/stngs_mod/upd_email")}>
                  <Text style={styles.menu_txt}>Email</Text>
                </TouchableOpacity>
            </View>
            </>
          )}


          <TouchableOpacity style= {styles.menubtn} onPress={() => router.push("/stngs_mod/notif_set")}>
            <Text style = {styles.menu_txt}>
              Notification Settings
            </Text>
            <Ionicons name="chevron-forward-outline" size={28} color="black" />
          </TouchableOpacity>


          <TouchableOpacity style= {styles.menubtn}
            value="sec_pri"
            onPress={() => setMenu("sec_pri")}
          >
            <Text style = {styles.menu_txt}>
              Security and Privacy
            </Text>
            <Ionicons name="chevron-forward-outline" size={28} color="black" />
          </TouchableOpacity>

          {menu === "sec_pri" && (
            <>
            <View style={styles.submen_cont}>
                <TouchableOpacity onPress={() => router.push("/acc_mod/changepass")}>
                  <Text style={styles.menu_txt}>Change Password</Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => router.push("/stngs_mod/signlog_his")}>
                  <Text style={styles.menu_txt}>Sign In/Login History</Text>
                </TouchableOpacity>
            </View>
            </>
          )}
        </View>
      </View>

      
    </View>
  );
}

const styles = StyleSheet.create({
  //TITLE CONTAINER
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

  //OVERALL CONTAINER
    container: {
      flex: 1,
      padding: "7%",
      backgroundColor: "#FFFBFB",
      rowGap: '2%'
    },

  menu_cont: {
    paddingHorizontal: '8%',
  },

  menu_txt: {
    fontWeight: '400',
    fontSize: 15,
  },

  menubtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: '5%'
  },

  submen_cont: {
    paddingHorizontal: '7%',
    rowGap: '3%'
  }

});
