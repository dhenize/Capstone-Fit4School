// app/ar_mod/ar_calc.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  Text as RNText,
} from "react-native";
import { Text } from "../../components/globalText";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import * as posedetection from "@tensorflow-models/pose-detection";
import CameraWithTensors from "../../components/ar_com/cam_with_tensors";
import SilhouetteOverlay from "../../components/ar_com/silhouette_overlay";

const { width: screenWidth } = Dimensions.get("window");

export default function ArCalc() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { height: hParam, unit: unitParam, gender, grade } = params;
  const [status, setStatus] = useState("prepare");
  const [scanPhase, setScanPhase] = useState("front");
  const [cameraReady, setCameraReady] = useState(false);
  const [showReadyPopup, setShowReadyPopup] = useState(false);
  const cameraAPIRef = useRef(null);
  const detectorRef = useRef(null);
  const [loadingMsg, setLoadingMsg] = useState("");
  const autoCaptureTimeoutRef = useRef(null);

  function parseHeightToCm(h, unit) {
    if (!h) return null;
    if (unit === "cm" || String(h).toLowerCase().includes("cm")) {
      const n = parseFloat(String(h).replace(/[^\d.]/g, ""));
      return isNaN(n) ? null : n;
    }

    const s = String(h).replace(/[^\d.]/g, "");
    const n = parseFloat(s);
    if (isNaN(n)) return null;
    return n * 30.48;
  }

  const userHeightCmInput = parseHeightToCm(hParam, unitParam);

  useEffect(() => {
    let mounted = true;

    const initializeDetector = async () => {
      try {
        setLoadingMsg("Loading pose detection model...");

        // Use MoveNet for faster performance
        detectorRef.current = await posedetection.createDetector(
          posedetection.SupportedModels.MoveNet,
          {
            modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING
          }
        );

        if (mounted) {
          setLoadingMsg("");
          setStatus("waiting");
          setShowReadyPopup(true);
          // Auto-hide popup after 2.5 seconds
          setTimeout(() => setShowReadyPopup(false), 2500);
        }
      } catch (error) {
        console.error("Failed to initialize detector:", error);
        if (mounted) {
          Alert.alert("Error", "Failed to initialize AR. Please check your connection.");
        }
      }
    };

    initializeDetector();

    return () => {
      mounted = false;
      // Cleanup timeouts
      if (autoCaptureTimeoutRef.current) {
        clearTimeout(autoCaptureTimeoutRef.current);
      }
      // Cleanup detector
      if (detectorRef.current) {
        detectorRef.current.dispose();
      }
    };
  }, []);

  const handleCameraReady = () => {
    setCameraReady(true);
    setStatus("waiting");
  };

  const getCameraRef = (api) => {
    cameraAPIRef.current = api;
  };

  const captureAndEstimate = async () => {
    if (!cameraAPIRef.current) throw new Error("Camera not ready");

    setStatus("capturing");
    setLoadingMsg("Capturing...");

    try {
      const photo = await cameraAPIRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
        skipProcessing: true,
        exif: false
      });

      if (!photo?.base64) {
        throw new Error("Capture failed");
      }

      setLoadingMsg("Analyzing pose...");

      // Use smaller image size for faster processing
      const imgTensor = await cameraAPIRef.current.photoToTensor(photo.base64, 192);

      const poses = await detectorRef.current.estimatePoses(imgTensor, {
        maxPoses: 1,
        flipHorizontal: false,
      });

      // Clean up tensor immediately to free memory
      if (imgTensor && !imgTensor.isDisposedInternal) {
        imgTensor.dispose();
      }

      return poses?.[0] || null;
    } catch (error) {
      console.error("Capture error:", error);
      throw error;
    }
  };

  const landmarksToMeasurements = (pose) => {
    if (!pose?.keypoints) return null;

    const kp = (name) => pose.keypoints.find((p) => p.name === name && p.score > 0.3);
    const dist = (a, b) => {
      if (!a || !b) return null;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const leftShoulder = kp("left_shoulder");
    const rightShoulder = kp("right_shoulder");
    const leftHip = kp("left_hip");
    const rightHip = kp("right_hip");
    const leftAnkle = kp("left_ankle");
    const rightAnkle = kp("right_ankle");
    const nose = kp("nose");

    // Calculate pixel height
    const midAnkle = leftAnkle && rightAnkle ? {
      x: (leftAnkle.x + rightAnkle.x) / 2,
      y: (leftAnkle.y + rightAnkle.y) / 2
    } : leftAnkle || rightAnkle;

    const pixelHeight = nose && midAnkle ? dist(nose, midAnkle) : null;

    const pxToCm = (px) => {
      if (!userHeightCmInput || !pixelHeight || pixelHeight <= 0) return null;
      return (px / pixelHeight) * userHeightCmInput;
    };

    // Key measurements only (simplified for speed)
    const shoulderPx = dist(leftShoulder, rightShoulder);
    const hipPx = dist(leftHip, rightHip);

    const shoulderCm = pxToCm(shoulderPx);
    const hipCm = pxToCm(hipPx);

    return {
      shoulderCm: shoulderCm ? Number(shoulderCm.toFixed(1)) : null,
      hipCm: hipCm ? Number(hipCm.toFixed(1)) : null,
      pixelHeight,
    };
  };

  const calculateTopBottomSizes = (frontMeasurements, sideMeasurements) => {
    const shoulder = frontMeasurements?.shoulderCm;
    const hip = frontMeasurements?.hipCm;

    // Improved top size calculation
    let topSize = "Unknown";
    if (shoulder) {
      if (shoulder < 36) topSize = "Small";
      else if (shoulder < 41) topSize = "Medium";
      else topSize = "Large";
    }

    // FIXED: Improved bottom size calculation based on grade level
    let bottomSize = "Unknown";
    if (hip) {
      switch (grade) {
        case "Pre-School":
          if (hip < 60) bottomSize = "Size 4";
          else if (hip < 65) bottomSize = "Size 5";
          else if (hip < 70) bottomSize = "Size 6";
          else if (hip < 75) bottomSize = "Size 7";
          else bottomSize = "Size 8";
          break;
        case "Elementary":
          if (hip < 70) bottomSize = "Size 6";
          else if (hip < 75) bottomSize = "Size 7";
          else if (hip < 80) bottomSize = "Size 8";
          else if (hip < 85) bottomSize = "Size 9";
          else if (hip < 90) bottomSize = "Size 10";
          else bottomSize = "Size 11";
          break;
        case "Junior High":
        default:
          if (hip < 80) bottomSize = "Size 8";
          else if (hip < 85) bottomSize = "Size 9";
          else if (hip < 90) bottomSize = "Size 10";
          else if (hip < 95) bottomSize = "Size 11";
          else if (hip < 100) bottomSize = "Size 12";
          else if (hip < 105) bottomSize = "Size 13";
          else bottomSize = "Size 14";
          break;
      }
    }

    return {
      topSize,
      bottomSize,
      measurements: { shoulder, hip },
    };
  };


  const handleCapturePhase = async () => {
    try {
      if (!cameraAPIRef.current) {
        Alert.alert("Camera not ready", "Please wait for the camera to initialize.");
        return;
      }

      setStatus("capturing");
      const pose = await captureAndEstimate();

      if (!pose) {
        Alert.alert("No pose detected", "Please ensure full body is visible and try again.");
        setStatus("waiting");
        return;
      }

      const measures = landmarksToMeasurements(pose);

      if (scanPhase === "front") {
        cameraAPIRef.current._frontMeasures = measures;
        setScanPhase("side");
        setStatus("waiting");


        Alert.alert("Front Scan Complete", "Now please turn sideways and tap CAPTURE SIDE when ready.", [
          { text: "OK" }
        ]);

      } else {
        if (autoCaptureTimeoutRef.current) {
          clearTimeout(autoCaptureTimeoutRef.current);
        }

        cameraAPIRef.current._sideMeasures = measures;
        setStatus("analyzing");
        setLoadingMsg("Finalizing your sizes...");

        const front = cameraAPIRef.current._frontMeasures;
        const side = cameraAPIRef.current._sideMeasures;
        const results = calculateTopBottomSizes(front, side);

        router.push({
          pathname: "/ar_mod/ar_result",
          params: {
            topSize: results.topSize,
            bottomSize: results.bottomSize,
            shoulderCm: results.measurements.shoulder ?? "N/A",
            hipCm: results.measurements.hip ?? "N/A",
            userHeight: hParam || "N/A",
            userUnit: unitParam || "cm",
            gender: gender || "N/A",
            grade: grade || "N/A",
          },
        });
      }
    } catch (err) {
      console.error("Capture error", err);
      Alert.alert("Capture failed", "Please try again in better lighting.");
      setStatus("waiting");
    } finally {
      setLoadingMsg("");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <View style={StyleSheet.absoluteFill}>
        <CameraWithTensors
          onCameraReady={handleCameraReady}
          facing="back"
          getCameraRef={getCameraRef}
        />
        <SilhouetteOverlay
          type={scanPhase}
          isActive={status === "waiting" || status === "capturing"}
        />
      </View>

      {/* AR Ready Popup */}
      <Modal
        visible={showReadyPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReadyPopup(false)}
      >
        <View style={styles.popupContainer}>
          <View style={styles.popup}>
            <Text style={styles.popupTitle}>🎯 AR Ready!</Text>
            <Text style={styles.popupText}>
              Position yourself within the silhouette for accurate measurement
            </Text>
            <TouchableOpacity
              style={styles.popupButton}
              onPress={() => setShowReadyPopup(false)}
            >
              <Text style={styles.popupButtonText}>GOT IT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.overlay}>
        <Text style={styles.title}>
          {status === "waiting"
            ? scanPhase === "front"
              ? "Align with FRONT silhouette"
              : "Now turn SIDEWAYS"
            : status === "capturing"
              ? `Capturing ${scanPhase}...`
              : status === "analyzing"
                ? "Analyzing..."
                : "Preparing..."}
        </Text>

        <View style={styles.scanBox}>
          <Text style={{ color: "#fff", fontSize: 16, textAlign: 'center' }}>
            {loadingMsg || (status === "waiting" ? "Ready for capture" : "Processing...")}
          </Text>

          {(status === "capturing" || status === "analyzing") && (
            <ActivityIndicator size="large" color="#61C35C" style={{ marginTop: 12 }} />
          )}
        </View>

        <View style={{ alignItems: "center", marginTop: 10 }}>
          <TouchableOpacity
            style={[
              styles.captureBtn,
              (!cameraReady || status === "capturing" || !!loadingMsg) && styles.captureBtnDisabled
            ]}
            onPress={handleCapturePhase}
            disabled={!cameraReady || status === "capturing" || !!loadingMsg}
          >
            <RNText style={{ fontSize: 18, fontWeight: "600", color: 'white' }}>
              {scanPhase === "front" ? "CAPTURE FRONT" : "CAPTURE SIDE"}
            </RNText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 24,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  scanBox: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 80,
    borderWidth: 1,
    borderColor: 'rgba(97, 195, 92, 0.3)',
  },
  captureBtn: {
    backgroundColor: "#61C35C",
    alignItems: 'center',
    padding: 16,
    width: "65%",
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  captureBtnDisabled: {
    backgroundColor: "#cccccc",
  },
  popupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
  },
  popup: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    width: '90%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  popupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#61C35C',
    textAlign: 'center',
  },
  popupText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    marginBottom: 20,
    lineHeight: 22,
  },
  popupButton: {
    backgroundColor: '#61C35C',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  popupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});