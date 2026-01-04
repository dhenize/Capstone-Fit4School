import { View, StyleSheet, TouchableOpacity, Image, Modal, Dimensions } from "react-native";
import React, { useState } from "react";
import { Text } from "../../components/globalText";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Video, ResizeMode } from 'expo-av';

export default function Tutorials() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const videos = {
    uniformOrdering: require('../../assets/videos/Order Tutorial.mp4'), // Add your video file
    arCamera: require('../../assets/videos/AR cam tutorial.mp4'), // Add your video file
  };

  const openVideoModal = (videoType) => {
    setSelectedVideo(videoType);
    setModalVisible(true);
  };

  const closeVideoModal = () => {
    setModalVisible(false);
    setSelectedVideo(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFBFB" }}>
      <View style={styles.titlebox}>
        <TouchableOpacity onPress={() => router.push("/dash_mod/account")}>
          <Ionicons name="arrow-back-outline" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Tutorials</Text>
      </View>

      <View style={styles.container}>
        <View style={styles.menu_cont}>
          <TouchableOpacity 
            style={styles.menubtn} 
            onPress={() => openVideoModal('uniformOrdering')}
          >
            <Image 
              source={require('../../assets/images/icons/gen_icons/order-tutorial.png')}
              style={styles.icon}
            />
            <Text style={styles.menu_txt}>Uniform Ordering</Text>
            <Ionicons name="chevron-forward-outline" size={28} color="black" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menubtn} 
            onPress={() => openVideoModal('arCamera')}
          >
            <Image 
              source={require('../../assets/images/icons/gen_icons/ar-tutorial.png')}
              style={styles.icon}
            />
            <Text style={styles.menu_txt}>AR camera for uniform fitting</Text>
            <Ionicons name="chevron-forward-outline" size={28} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Video Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        supportedOrientations={['portrait', 'landscape']}
        onRequestClose={closeVideoModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeVideoModal}>
              <Ionicons name="close" size={32} color="white" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.videoContainer}>
            {selectedVideo && (
              <Video
                source={videos[selectedVideo]}
                style={styles.videoPlayer}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={true}
                isLooping={false}
              />
            )}
          </View>
        </View>
      </Modal>
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
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
  },

  modalHeader: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  videoPlayer: {
    width: '100%',
    height: '100%',
  },
});