// components/ar_com/camera_container.jsx
import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

export default function CameraContainer({ 
  onCameraReady, 
  facing = 'back',
  children 
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleCameraReady = () => {
    setIsReady(true);
    if (onCameraReady) onCameraReady();
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        onCameraReady={handleCameraReady}
      />
      
      {isReady && children}
      
      {isReady && (
        <View style={styles.debugBadge}>
          <Text>Camera Ready</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  debugBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(255,255,255,0.75)",
    padding: 4,
    borderRadius: 4,
  },
});