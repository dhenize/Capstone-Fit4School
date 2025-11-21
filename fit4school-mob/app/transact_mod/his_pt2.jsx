import { View, StyleSheet,TouchableOpacity } from 'react-native'
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from 'react'


export default function his_pt2() {

    const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFBFB" }}>
        {/* Title Box */}
        <View style={styles.titlebox}>
            <TouchableOpacity onPress={() => router.push("/transact_mod/history")}>
            <Ionicons
                name="arrow-back-outline"
                size={26}
                color="white"
                style={{ marginHorizontal: "2%" }}
            />
            </TouchableOpacity>
            <Text style={styles.title}>Why return item?</Text>
        </View>

        <View style = {styles.main_cont}>
            <View style = {styles.qbtn_cont}>
                    <TouchableOpacity onPress={() => router.push("/transact_mod/req_ret2")}>
                        <Text style = {styles.qbtn_txt}>
                            I received a damaged item
                        </Text>
                    </TouchableOpacity>
            </View>
            
            <View style = {styles.qbtn_cont}>
                <TouchableOpacity onPress={() => router.push("/transact_mod/req_ret1")}>
                    <Text style = {styles.qbtn_txt}>
                        Size is not accurate (too big/small)
                    </Text>
                </TouchableOpacity>
            </View>
            
        </View>
    </View>
  )
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
    main_cont: {
        padding: "7%",
        flex: 1,
        backgroundColor: "#FFFBFB",
    },

    qbtn_cont: {
        padding: '5%',
    },

    qbtn_txt: {
        fontSize: 16,
        fontWeight: "400"
    }
})