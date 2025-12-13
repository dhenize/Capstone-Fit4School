import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, Text, Platform } from "react-native";
import { CameraView } from "expo-camera";
import { usePoseDetection } from 'react-native-mediapipe-posedetection';

export default function CameraWithTensors({
  onCameraReady,
  style,
  facing = "back",
  getCameraRef,
  onPoseDetected,
}) {
  const cameraRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  
  // MediaPipe Pose Detection hook
  const { poseDetector, isLoaded } = usePoseDetection({
    model: 'pose_landmarker_full.task',
    runningMode: 'IMAGE',
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
  });

  useEffect(() => {
    (async () => {
      // Request camera permission (expo-camera style)
      const { status } = await CameraView.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status === 'granted') {
        setIsReady(true);
        if (onCameraReady) onCameraReady();
      }
    })();
  }, []);

  const handleCameraReady = () => {
    setIsReady(true);
    if (onCameraReady) onCameraReady();
    
    // Expose camera methods to parent
    if (getCameraRef) {
      getCameraRef({
        captureFrameForPose: async () => {
          if (!cameraRef.current) throw new Error("Camera not mounted");
          
          try {
            // Take photo with expo-camera - IMPORTANT: include base64 for MediaPipe
            const photo = await cameraRef.current.takePictureAsync({
              quality: 0.8,
              base64: true, // <-- THIS IS CRITICAL FOR MEDIAPIPE
              skipProcessing: true,
              exif: false,
            });
            
            console.log("Photo captured with base64:", !!photo.base64);
            
            return {
              uri: photo.uri,
              width: photo.width,
              height: photo.height,
              base64: photo.base64, // <-- MEDIAPIPE NEEDS THIS
            };
          } catch (error) {
            console.error("Capture error:", error);
            throw error;
          }
        },
        
        takePictureAsync: async (opts = {}) => {
          if (!cameraRef.current) throw new Error("Camera not mounted");
          
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.8,
            base64: Platform.OS === 'android',
            skipProcessing: true,
            ...opts,
          });
          
          return {
            uri: photo.uri,
            base64: Platform.OS === 'android' ? photo.base64 : null,
          };
        },
        
        isReady: () => isReady && hasPermission,
        getNativeCamera: () => cameraRef.current,
      });
    }
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, style]}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={[styles.container, style]}>
        <Text>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        onCameraReady={handleCameraReady}
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
  container: { 
    flex: 1,
    backgroundColor: 'black',
  },
  debugBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 6,
    borderRadius: 6,
    zIndex: 1000,
  },
});