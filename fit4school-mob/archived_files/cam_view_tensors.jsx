// components/ar_com/cam_view_tensors.jsx
import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { cameraWithTensors } from "@tensorflow/tfjs-react-native";

const TensorCamera = cameraWithTensors(CameraView);

export default function CamViewTensors({
  hidden = false,
  resizeWidth = 152,
  resizeHeight = 200,
  resizeDepth = 3,
  onTensorReady,
  autorender = true,
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

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

  // If hidden, render a minimal invisible camera
  if (hidden) {
    return (
      <View style={styles.hiddenContainer}>
        <TensorCamera
          style={styles.hiddenCamera}
          facing="back" // Use back camera
          autorender={autorender}
          resizeWidth={resizeWidth}
          resizeHeight={resizeHeight}
          resizeDepth={resizeDepth}
          onReady={onTensorReady}
        />
      </View>
    );
  }

  // Main camera view - Use the same approach as your working CamView
  return (
    <View style={styles.container}>
      {/* Regular Camera View for display (like in CamView) */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back" // Use back camera
        onCameraReady={() => setCameraReady(true)}
      />
      
      {/* Tensor Camera for processing (hidden) */}
      <TensorCamera
        style={styles.tensorCamera}
        facing="back"
        autorender={autorender}
        resizeWidth={resizeWidth}
        resizeHeight={resizeHeight}
        resizeDepth={resizeDepth}
        onReady={onTensorReady}
      />
      
      {cameraReady && (
        <View style={styles.debugBadge}>
          <Text>Camera Running</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  tensorCamera: {
    width: 1,
    height: 1,
    opacity: 0,
    position: 'absolute'
  },
  hiddenContainer: { 
    width: 1, 
    height: 1, 
    opacity: 0, 
    position: "absolute" 
  },
  hiddenCamera: { 
    width: 1, 
    height: 1, 
    opacity: 0 
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