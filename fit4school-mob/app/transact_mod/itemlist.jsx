import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    TouchableOpacity,
    View,
    Image,
    Modal,
    Dimensions,
    TouchableWithoutFeedback,
    ScrollView,
    Alert
} from "react-native";
import { Text } from "../../components/globalText";
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import { db } from "../../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function itemlist() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [selectedTab, setSelectedTab] = useState("All");
    const [uniforms, setUniforms] = useState([]);
    const [filteredUniforms, setFilteredUniforms] = useState([]);
    
    const uniformType = params.type || "boys";
    const tabs = ["All", "Kindergarten", "Elementary", "Junior High"];

    const titleMap = {
        "boys": "Boy's Uniform",
        "girls": "Girl's Uniform", 
        "pe": "PE Uniform"
    };

    const genderMap = {
        "boys": "Boys",
        "girls": "Girls",
        "pe": "Unisex"
    };

    useEffect(() => {
        fetchUniforms();
    }, [uniformType]);

    useEffect(() => {
        filterUniforms();
    }, [selectedTab, uniforms]);

    const fetchUniforms = async () => {
        try {
            let q;
            const gender = genderMap[uniformType];
            
            if (uniformType === "pe") {
                q = query(collection(db, "uniforms"), where("gender", "==", "Unisex"));
            } else {
                q = query(collection(db, "uniforms"), where("gender", "==", gender));
            }
            
            const querySnapshot = await getDocs(q);
            const items = [];
            querySnapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
            });
            setUniforms(items);
        } catch (error) {
            console.error("Error fetching uniforms: ", error);
        }
    };

    const filterUniforms = () => {
        if (selectedTab === "All") {
            setFilteredUniforms(uniforms);
        } else {
            const filtered = uniforms.filter(uniform => 
                uniform.grdLevel === selectedTab
            );
            setFilteredUniforms(filtered);
        }
    };

    const getTitle = () => {
        return titleMap[uniformType] || "Boy's Uniform";
    };

    const formatCategory = (category) => {
        const categoryMap = {
            "Polo": "Polo",
            "Pants": "Pants", 
            "Blouse": "Blouse",
            "Skirt": "Skirt",
            "Short": "Short",
            "Full_Uniform": "Full Uniform",
            "Full_PE": "Full PE",
            "PE_Shirt": "PE Shirt",
            "PE_Pants": "PE Pants"
        };
        return categoryMap[category] || category;
    };

    const handleItemPress = (uniform) => {
        router.push({
            pathname: "/transact_mod/uniforms",
            params: { uniformId: uniform.id }
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#FFFBFB", paddingBottom: '15%'}}>
            <View style={styles.titlebox}>
                <TouchableOpacity onPress={() => router.push("/dash_mod/home")}>
                    <Ionicons name="arrow-back-outline" size={26} color="white" style={{ marginHorizontal: "2%" }} />
                </TouchableOpacity>
                <Text style={styles.title}>{getTitle()}</Text>
            </View>

            <ScrollView 
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabsScrollView}
            >
                {tabs.map((tab) => (
                    <TouchableOpacity 
                        key={tab}
                        style={[
                            styles.selectionbtn,
                            selectedTab === tab ? styles.selectedBtn : styles.unselectedBtn
                        ]}
                        onPress={() => setSelectedTab(tab)}
                    >
                        <Text style={[
                            styles.selectiontxt,
                            selectedTab === tab ? styles.selectedTxt : styles.unselectedTxt
                        ]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView
                style={{marginVertical: 10, marginHorizontal: '7%'}}
                showsVerticalScrollIndicator={true}
            >
                <View style={styles.unif_cont}>
                    {filteredUniforms.map((uniform) => (
                        <View key={uniform.id} style={styles.unif_item}>
                            <TouchableOpacity 
                                style={styles.unif_touchable}
                                onPress={() => handleItemPress(uniform)}
                            >
                                <View style={styles.image_container}>
                                    {uniform.imageUrl ? (
                                        <Image
                                            source={{ uri: uniform.imageUrl }}
                                            style={styles.unif_pic}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <Image
                                            source={require("../../assets/images/uniforms/Boys-Elem-Top.jpg")}
                                            style={styles.unif_pic}
                                            resizeMode="cover"
                                        />
                                    )}
                                </View>
                                <View style={styles.unif_text_container}>
                                    <Text style={styles.unif_txt}>
                                        {`${formatCategory(uniform.category)} ${uniform.grdLevel} ${uniform.gender}`}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    titlebox: {
        justifyContent: "flex-start",
        flexDirection: "row",
        alignContent: "center",
        alignItems: "center",
        backgroundColor: "#0FAFFF",
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
    tabsScrollView: {
        flexGrow: 0,
        paddingVertical: '4%',
        marginHorizontal: '3%',
    },

    scrolltabs: {
        flexDirection: 'row',
    },
    selectionbtn: {
        borderRadius: 5,
        borderWidth: 2,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginHorizontal: 6,
        minHeight: 40,
        justifyContent: 'center',
    },
    selectedBtn: {
        borderColor: '#61C35C',
    },
    unselectedBtn: {
        borderColor: '#D9D9D9',
    },
    selectiontxt: {
        fontWeight: '500',
        fontSize: 15,
        textAlign: 'center',
    },
    selectedTxt: {
        color: '#61C35C',
    },
    unselectedTxt: {
        color: '#D9D9D9',
    },
    unif_cont: {
        flexDirection: "column",
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    unif_item: {
        borderRadius: 10,
        backgroundColor: 'white',
        marginVertical: 15,
        width: '95%',
        maxWidth: 350,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
    },
    unif_touchable: {
        width: '100%',
    },
    image_container: {
        width: '100%',
        height: 140,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        overflow: 'hidden',
    },
    unif_pic: {
        width: '100%',
        height: 200,
    },
    unif_text_container: {
        backgroundColor: '#61C35C',
        paddingVertical: 12,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
    unif_txt: {
        fontWeight: '400',
        fontSize: 20,
        color: 'white',
        textAlign: 'center'
    }
})