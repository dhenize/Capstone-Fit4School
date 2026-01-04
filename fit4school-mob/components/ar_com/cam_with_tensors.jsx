import React, { useRef, useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import { CameraView, Camera } from "expo-camera";

export default function CameraWithTensors({
  onCameraReady,
  style,
  facing = "back",
  getCameraRef,
}) {
  const cameraRef = useRef(null);
  const [hasPermission, setHasPermission] = React.useState(null);
  const [isReady, setIsReady] = React.useState(false);

  // Request camera permission
  useEffect(() => {
    (async () => {
      try {
        const res = await Camera.requestCameraPermissionsAsync();
        const status = res?.status || (res?.granted ? 'granted' : 'denied');
        setHasPermission(status === 'granted');
      } catch (err) {
        console.warn('Camera permission request failed:', err);
        setHasPermission(false);
      }
    })();
  }, []);

  // Expose camera API to parent
  useEffect(() => {
    if (cameraRef.current && getCameraRef) {
      getCameraRef({
        takePictureAsync: async (options = {}) => {
          try {
            if (!cameraRef.current) {
              throw new Error("Camera not ready");
            }
            
            const photo = await cameraRef.current.takePictureAsync({
              quality: 0.8,
              base64: true,
              skipProcessing: true,
              exif: false,
              ...options,
            });
            //ss
            return photo;
          } catch (error) {
            console.error("Camera capture error:", error);
            throw error;
          }
        },
        
        // Method specifically for pose detection
        captureFrameForPose: async () => {
          try {
            if (!cameraRef.current) {
              throw new Error("Camera not ready");
            }
            
            const photo = await cameraRef.current.takePictureAsync({
              quality: 0.7, // Lower quality for faster processing
              base64: true,
              skipProcessing: true,
              exif: false,
            });
            
            console.log("Captured photo for pose detection:", {
              hasBase64: !!photo.base64,
              width: photo.width,
              height: photo.height,
              base64Length: photo.base64?.length || 0
            });
            
            return {
              uri: photo.uri,
              width: photo.width,
              height: photo.height,
              base64: photo.base64,
            };
          } catch (error) {
            console.error("Capture frame error:", error);
            throw error;
          }
        },
        
        isReady: () => isReady && hasPermission,
        getNativeCamera: () => cameraRef.current,
      });
    }
  }, [isReady, hasPermission, getCameraRef]);

  // Ensure parent is notified when camera is ready and permission granted
  useEffect(() => {
    if (isReady && hasPermission && onCameraReady) {
      try {
        onCameraReady();
      } catch (err) {
        console.warn('onCameraReady callback failed:', err);
      }
    }
  }, [isReady, hasPermission, onCameraReady]);

  const handleCameraReady = () => {
    setIsReady(true);
    if (onCameraReady) {
      onCameraReady();
    }
  };

  // Handle permission states
  if (hasPermission === null) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.permissionText}>No access to camera</Text>
        <Text style={styles.permissionSubtext}>Please enable camera permissions in settings</Text>
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
        <View style={styles.debugOverlay}>
          <View style={styles.debugBadge}>
            <Text style={styles.debugText}>✓ CAMERA READY</Text>
          </View>
          <View style={styles.instructionBadge}>
            <Text style={styles.instructionText}>
              {facing === "back" ? "Back Camera" : "Front Camera"}
            </Text>
          </View>
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
  permissionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: '50%',
  },
  permissionSubtext: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  debugOverlay: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  debugBadge: {
    backgroundColor: "rgba(76, 217, 100, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 1000,
  },
  instructionBadge: {
    backgroundColor: "rgba(0, 122, 255, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 1000,
  },
  debugText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
});