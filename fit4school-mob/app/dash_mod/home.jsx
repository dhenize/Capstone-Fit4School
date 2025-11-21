//../../dash_mod/home

import { View, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";
import React, { useState, useEffect } from "react";
import { Picker } from "@react-native-picker/picker";
import { Text } from "../../components/globalText";
import { useRouter } from "expo-router";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Home() {
  const router = useRouter();
  const [sort, setSort] = useState("all");
  const [uniforms, setUniforms] = useState([]);

  useEffect(() => {
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

    fetchUniforms();
  }, []);

  const filteredUniforms = uniforms.filter(u => sort === "all" || u.level === sort);

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.greet}>
          <Text style={{ fontSize: 20, fontWeight: '400' }}>Hello</Text>
          <Text style={{ color: '#0FAFFF', fontSize: 20, fontWeight: '500' }}>Juan Dela Cruz {"!"}</Text>
        </View>
        <View style={styles.helpbtn}>
          <TouchableOpacity style={styles.button} onPress={() => alert("Help button pressed")}>
            <Text style={{ fontSize: 13, fontWeight: '400' }}>HELP</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CURRENT PROCESSING ORDER */}
      <View style={styles.cpo_cont}>
        <View style={styles.cpo_pic}>
          <Image 
            source={require("../../assets/images/g2_unif_ex.png")}
            style={{height: 70, width: 70, borderRadius: 10}}
          />
        </View>

        <View style={styles.cpo_desc}>
          <Text style={{ color: '#0FAFFF', fontSize: 14, fontWeight: '600', textAlign: "left" }}>
            Your Order is being processed!
          </Text>
          <Text style={{ color: '#0FAFFF', fontSize: 12, fontWeight: '400', textAlign: "left" }}>
            #04 Boy’s Uniform (Pre-school)
          </Text>
          <Text style={{ color: '#0FAFFF', fontSize: 11, fontWeight: '400', textAlign: "left" }}>
            size 8
          </Text>
          <Text style={{ color: '#61C35C', fontSize: 13, fontWeight: '500', textAlign: "left" }}>
            Quantity: 2
          </Text>
        </View>
      </View>

      <Text style={{ marginTop: '5%', marginBottom: '3%', fontSize: 16, fontWeight: '500', textAlign: "left" }}>
        Order Again?
      </Text>

      <ScrollView style={{ flex: 1, marginTop: "7%" }} contentContainerStyle={{ paddingBottom: '5%' }}>
        <View style={styles.unif_cont}>
          {filteredUniforms.map((item) => (
            <TouchableOpacity key={item.id} onPress={() => router.push("/transact_mod/uniforms")}>
              <View style={styles.unif_grid}>
                <Image source={{ uri: item.imageUrl }} style={styles.unif_pics}/>
                <Text style={styles.unif_desc}>{item.itemCode}</Text>
                <Text style={styles.unif_lvl}>({item.grdLevel})</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* SORT AND DROPDOWN */}
      <View style={styles.sort_cont}>
        <View>
          <Text style={{ fontSize: 13, fontWeight: '500', textAlign: "left" }}>
            {uniforms.length} Items
          </Text>
        </View>
        <View style={styles.drop_cont}>
          <Picker selectedValue={sort} style={styles.dropdown} onValueChange={(itemValue) => setSort(itemValue)}>
            <Picker.Item label="All Items" value="all" style={styles.drop_txt}/>
            <Picker.Item label="Kinder" value="Kindergarten" style={styles.drop_txt}/>
            <Picker.Item label="Elementary" value="Elementary" style={styles.drop_txt}/>
            <Picker.Item label="Junior High" value="Junior High" style={styles.drop_txt}/>
            <Picker.Item label="Full-Set" value="Full-Set" style={styles.drop_txt}/>
            <Picker.Item label="PE" value="PE" style={styles.drop_txt}/>
            <Picker.Item label="Girls" value="Girls" style={styles.drop_txt}/>
            <Picker.Item label="Boys" value="Boys" style={styles.drop_txt}/>
          </Picker>
        </View>
      </View>

    </View>
  );
}




//STYLES
const styles = StyleSheet.create({
  //OVERALL CONTAINER
  container:{
    padding: '8.5%',
    flex: 1,
    backgroundColor: '#FFFBFB',
  },
  
  //HEADER 
  header: { 
    flexDirection: "row",
    justifyContent: "space-between", 
    alignItems: 'center',
    marginTop: '5%',
  },

  button: {
    backgroundColor: "#FFFF20",
    width: 60,
    height: 25,
    justifyContent: "center", 
    alignItems: "center",
    borderRadius: 5,
    shadowColor: 'black',
    elevation: 10,
    shadowOpacity: 0.90,
    shadowRadius: 2,
    shadowOffset: {width: 0, height: 4},
  },


  // CURRENT PROCESSING ORDER CONTATINER
  cpo_cont:{
    marginTop: '6%',
    padding: '3%',
    backgroundColor: '#F4F4F4',
    borderRadius: 10,
    height: 90,
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: {width: 0, height: 4},
    elevation: 4,
    flexDirection: "row",
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '5%',
  },

  cpo_desc:{
    alignContent: 'center',
  },

  // ORDER AGAIN CONTATINER
  oa_cont:{
    flexDirection: "row",
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '8%',
    marginBottom: '7%',
  },

  // SORT AND DROPDOWN CONTATINER
  sort_cont:{
    flexDirection: "row",
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  drop_cont:{
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 6,
    height: 40,
    width: 145,
  },

  dropdown:{
    height: 51,
    width: 145,
    marginTop: -6,
  },

  drop_txt:{
    fontSize: 13,
    fontWeight: '600',
  },

  // UNIFORMS CONTAINER
  unif_pics:{
    height: 140,
    width: 140,
    marginBottom: '5%',
    borderRadius: 10,
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: {width: 0, height: 4},
    elevation: 3,
  },

  unif_cont:{
    flexDirection: "row",
    alignContent: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    
  },
  
  unif_grid:{
    alignItems: 'center',
    marginVertical: '12%',
  },

  unif_desc:{
    fontSize: 15,
    fontWeight: '400',
  },

  unif_lvl:{
    color: '#61C35C',
    fontWeight: '600',
  },

}); //END OF STYLES

