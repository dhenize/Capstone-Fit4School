//../../dash_mod/account
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, View, Image, TouchableOpacity, Alert } from 'react-native';
import { Text } from "../../components/globalText";
import { useRouter } from "expo-router";

export default function Account() {
  const [userData, setUserData] = useState(null);
  const router = useRouter();

  useEffect(() => { 
    const getUserData = async () => {
      try {
        // Get the stored user data
        const storedUser = await AsyncStorage.getItem("lastUser");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setUserData(user);
        }
      } catch (error) {
        console.error("Error getting user data:", error);
      }
    };
    
    getUserData();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Logout", 
          onPress: () => router.push("/acc_mod/login"),
          style: "destructive"
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      
      <View style={styles.prof_cont}>
        <View style={styles.dp_cont}>
          <Image source={require("../../assets/images/dp_ex.jpg")} style={styles.dp_pic} />
        </View>

        <View style={styles.dp_txt}>
          <Text style={{fontWeight: '500', color: '#0FAFFF', fontSize: 20}}>
            {userData ? `${userData.fname} ${userData.lname}` : "Loading..."}
          </Text>
          <Text style={{fontWeight: '400', color: 'black', fontSize: 14}}>
            {userData ? userData.email : "Loading..."}
          </Text>
          <Text style={{fontWeight: '400', color: '#FF6767', fontSize: 14}}>
            User ID:          
          </Text>
          <Text style={{fontWeight: '400', color: '#FF6767', fontSize: 14}}>
            {userData ? `${userData.userId}` : "Loading..."}
          </Text>
          <Text style={{fontWeight: '400', color: '#61C35C', fontSize: 14}}>
            {userData ? (userData.status === "pending-verification" ? "Pending Verification" : "Verified") : "Loading..."}
          </Text>
        </View>
      </View>

      <View style={styles.stng_cont}>
        <TouchableOpacity style={styles.btns} onPress={() => router.push("/stngs_mod/settings")}>
          <Text style={styles.stng_txt}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btns} onPress={() => router.push("/stngs_mod/acc_rec")}>
          <Text style={styles.stng_txt}>Account Recovery</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btns} onPress={() => router.push("/stngs_mod/help_cen")}>
          <Text style={styles.stng_txt}>Help Center</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btns} onPress={() => router.push("/stngs_mod/priv_not")}>
          <Text style={styles.stng_txt}>Privacy Notice</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btns} onPress={() => router.push("/stngs_mod/term_con")}>
          <Text style={styles.stng_txt}>Terms and Conditions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btns} onPress={() => router.push("/stngs_mod/contact")}>
          <Text style={styles.stng_txt}>Contact Us</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{paddingVertical: '20%'}} onPress={handleLogout}>
          <Text style={styles.stng_txt}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: '8.5%',
    flex: 1,
    backgroundColor: '#FFFBFB',
  },
  prof_cont: {
    justifyContent: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: '10%',
    paddingBottom: '5%',
    gap: '5%',
  },
  dp_pic: {
    borderRadius: 100,
    height: 100,
    width: 100,
  },
  stng_cont: {
    padding: '4%'
  },
  btns: {
    paddingVertical: '3%'
  },
  stng_txt: {
    fontWeight: '400',
    fontSize: 15,
  },
});