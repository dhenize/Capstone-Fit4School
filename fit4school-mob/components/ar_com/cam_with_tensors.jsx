// components/ar_com/cam_with_tensors.jsx
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import { decodeJpeg } from "@tensorflow/tfjs-react-native";

export default function CameraWithTensors({
  onCameraReady,
  style,
  facing = "back",
  getCameraRef,
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      await tf.ready();
      console.log("✅ TensorFlow ready in camera");
    })();
  }, []);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleCameraReady = () => {
    setIsReady(true);
    if (onCameraReady) onCameraReady();
    if (getCameraRef) {
      getCameraRef({
        takePictureAsync: async (opts = {}) => {
          if (!cameraRef.current) throw new Error("Camera not mounted");

          const photo = await cameraRef.current.takePictureAsync({
            base64: true,
            quality: 0.7, // Reduced quality for faster processing
            skipProcessing: true,
            exif: false, // Disable EXIF for faster capture
            ...opts,
          });
          return photo;
        },
        photoToTensor: async (base64, targetSize = 256) => {
          try {
            let b64 = base64;
            if (b64.startsWith("data:")) {
              b64 = b64.split(",")[1];
            }
            const raw = tf.util.encodeString(b64, "base64").buffer;
            const u8 = new Uint8Array(raw);
            
            // Decode and resize for faster processing
            let imageTensor = decodeJpeg(u8);
            
            // Resize to smaller dimensions for faster processing
            if (targetSize) {
              imageTensor = tf.image.resizeBilinear(imageTensor, [targetSize, targetSize]);
            }
            
            return imageTensor;
          } catch (error) {
            console.error("Error converting photo to tensor:", error);
            throw error;
          }
        },
        // Add method to check camera status
        isReady: () => isReady,
        // Add method to get camera reference
        getNativeCamera: () => cameraRef.current,
      });
    }
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
    <View style={[styles.container, style]}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        onCameraReady={handleCameraReady}
        // Optimize camera settings for faster performance
        ratio="16:9"
      />
      {isReady && (
        <View style={styles.debugBadge}>
          <Text style={{ fontSize: 10, color: 'green', fontWeight: 'bold' }}>
            ✓ CAMERA READY
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  debugBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 6,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});