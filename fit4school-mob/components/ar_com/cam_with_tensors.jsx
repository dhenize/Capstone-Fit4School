import React, { useRef, useEffect, useState } from "react";
import { StyleSheet, View, Text, Platform } from "react-native";

export default function CameraWithTensors({
  onCameraReady,
  style,
  facing = "back",
  getCameraRef,
}) {
  const cameraRef = useRef(null);
  const [CameraModule, setCameraModule] = useState(null);
  const [hasPermission, setHasPermission] = React.useState(null);
  const [isReady, setIsReady] = React.useState(false);

  // Request camera permission
  useEffect(() => {
    // Dynamically import expo-camera only on native platforms
    (async () => {
      if (Platform.OS === 'web') {
        setHasPermission(false);
        return;
      }

      try {
        const CameraMod = await import('expo-camera');
        setCameraModule(CameraMod);
        const { status } = await CameraMod.Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch (err) {
        console.error('Camera permission request failed:', err);
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
  // On web show a simple placeholder
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.permissionText}>Camera not supported on web in this view.</Text>
      </View>
    );
  }

  const CameraViewComp = CameraModule?.CameraView || CameraModule?.CameraView || null;

  return (
    <View style={[styles.container, style]}>
      {CameraViewComp ? (
        <CameraViewComp
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          onCameraReady={handleCameraReady}
        />
      ) : (
        <Text style={styles.permissionText}>Initializing camera...</Text>
      )}

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