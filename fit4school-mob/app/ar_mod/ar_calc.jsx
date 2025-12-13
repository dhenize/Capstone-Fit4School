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
// MediaPipe import
import { usePoseDetection } from 'react-native-mediapipe-posedetection';
import CameraWithTensors from "../../components/ar_com/cam_with_tensors";
import SilhouetteOverlay from "../../components/ar_com/silhouette_overlay";
import { db } from "../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

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
  const [loadingMsg, setLoadingMsg] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // MediaPipe Pose Detection Hook
  const { poseDetector, isLoaded, error: poseError } = usePoseDetection({
    model: 'pose_landmarker_full.task',
    runningMode: 'IMAGE',
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
  });

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

  // Fallback measurements function
  const getFallbackMeasurements = () => {
    console.log("Using fallback measurements based on grade and gender");
    
    let chestCm, hipCm;
    
    switch(grade) {
      case "Kindergarten":
        chestCm = gender === "female" ? 58 : 60;
        hipCm = gender === "female" ? 62 : 64;
        break;
      case "Elementary":
        chestCm = gender === "female" ? 65 : 68;
        hipCm = gender === "female" ? 70 : 72;
        break;
      case "Junior High":
        chestCm = gender === "female" ? 75 : 80;
        hipCm = gender === "female" ? 85 : 82;
        break;
      default:
        chestCm = 70;
        hipCm = 75;
    }
    
    return {
      shoulderCm: chestCm * 0.9,
      chestCm: chestCm,
      hipCm: hipCm,
      torsoLengthCm: userHeightCmInput ? userHeightCmInput * 0.5 : 40,
      detected: false,
      isFallback: true
    };
  };

  useEffect(() => {
    let mounted = true;

    const initializeDetector = async () => {
      try {
        setLoadingMsg("Loading AR model...");

        // Check for MediaPipe loading status
        if (!isLoaded) {
          setLoadingMsg("Waiting for pose model to load...");
          // Wait a bit for initialization
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Check for pose detector errors
        if (poseError) {
          console.error("Pose detector error:", poseError);
          if (mounted) {
            Alert.alert(
              "Model Error",
              "Failed to load AR model. Please restart the app.",
              [{ text: "OK", onPress: () => router.back() }]
            );
          }
          return;
        }

        if (mounted) {
          setLoadingMsg("");
          setStatus("waiting");
          setShowReadyPopup(true);
          setTimeout(() => setShowReadyPopup(false), 2500);
        }
      } catch (error) {
        console.error("Failed to initialize detector:", error);
        if (mounted) {
          Alert.alert(
            "Error",
            "Failed to initialize AR. Please check your connection.",
            [{ text: "OK", onPress: () => router.back() }]
          );
        }
      }
    };

    initializeDetector();

    return () => {
      mounted = false;
    };
  }, [isLoaded, poseError]);

  useEffect(() => {
    // Monitor MediaPipe loading state
    if (isLoaded && status === "prepare") {
      setStatus("waiting");
    }
  }, [isLoaded]);

  const handleCameraReady = () => {
    setCameraReady(true);
    setStatus("waiting");
  };

  const getCameraRef = (api) => {
    cameraAPIRef.current = api;
  };

  // Validate MediaPipe landmarks
  const validatePose = (landmarks) => {
    try {
      if (!landmarks || landmarks.length < 33) {
        console.log("Invalid landmarks: insufficient points");
        return false;
      }

      // Check visibility of key landmarks
      const keyLandmarkIndices = [0, 11, 12, 23, 24, 27, 28]; // Nose, shoulders, hips, ankles
      const visibleKeyLandmarks = keyLandmarkIndices.filter(idx =>
        landmarks[idx] && landmarks[idx].visibility > 0.3
      ).length;

      if (visibleKeyLandmarks < 4) {
        console.log(`Only ${visibleKeyLandmarks} key landmarks visible`);
        return false;
      }

      // Check overall visibility
      const validLandmarks = landmarks.filter(l => l && l.visibility > 0.2).length;

      if (validLandmarks < 15) {
        console.log(`Only ${validLandmarks} total landmarks detected`);
        return false;
      }

      console.log(`✅ Pose validated with ${validLandmarks} landmarks`);
      return true;

    } catch (error) {
      console.error("Validation error:", error);
      return false;
    }
  };

  // Capture using MediaPipe - FIXED FOR EXPO-CAMERA
  const captureAndEstimate = async () => {
    if (!cameraAPIRef.current || !poseDetector) {
      throw new Error("Camera or detector not ready");
    }

    setStatus("capturing");
    setLoadingMsg("Capturing...");

    try {
      // Capture frame from camera
      const frame = await cameraAPIRef.current.captureFrameForPose();

      if (!frame || !frame.base64) {
        console.log("No frame or base64 data returned");
        return null;
      }

      setLoadingMsg("Analyzing pose...");

      console.log("Frame data for MediaPipe:", {
        hasBase64: !!frame.base64,
        base64Length: frame.base64?.length || 0,
        width: frame.width,
        height: frame.height
      });

      // FIXED: MediaPipe expects base64 string directly
      const detectionResult = await poseDetector.detect(frame.base64);
      
      console.log("MediaPipe detection result:", {
        hasLandmarks: !!detectionResult?.landmarks,
        landmarkCount: detectionResult?.landmarks?.length || 0
      });

      const landmarks = detectionResult?.landmarks?.[0] || null;

      if (!landmarks) {
        console.log("No pose detected in image");
        return null;
      }

      const isValid = validatePose(landmarks);

      if (!isValid) {
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);

        if (newRetryCount >= 3) {
          Alert.alert(
            "Having trouble?",
            "Try these tips:\n1. Stand 2-3 meters away\n2. Ensure good lighting\n3. Face the camera directly\n4. Arms slightly away from body",
            [{ text: "Try Again", onPress: () => { } }]
          );
        } else {
          Alert.alert(
            "Detection issue",
            "Please ensure your full body is visible in the frame.",
            [{ text: "OK", onPress: () => { } }]
          );
        }

        return null;
      }

      setRetryCount(0);
      return landmarks;
    } catch (error) {
      console.error("Capture error:", error);
      console.log("Error details:", error.message);
      
      // Provide more specific error messages
      if (error.message.includes("permission")) {
        Alert.alert(
          "Camera Permission Required",
          "Please grant camera permission to continue.",
          [{ text: "OK" }]
        );
      } else if (error.message.includes("model")) {
        Alert.alert(
          "AR Model Error",
          "The pose detection model failed to load.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Detection Failed",
          "Could not analyze pose. Using estimated measurements instead.",
          [{ text: "OK" }]
        );
      }
      return null;
    }
  };

  // Process MediaPipe landmarks
  const landmarksToMeasurements = (landmarks) => {
    if (!landmarks || landmarks.length < 33) {
      console.log("Insufficient landmarks for measurements");
      return null;
    }

    // MediaPipe Landmark Indices
    const LEFT_SHOULDER = 11;
    const RIGHT_SHOULDER = 12;
    const LEFT_HIP = 23;
    const RIGHT_HIP = 24;
    const LEFT_ANKLE = 27;
    const RIGHT_ANKLE = 28;
    const NOSE = 0;

    const getLandmark = (index) => {
      const landmark = landmarks[index];
      return landmark && landmark.visibility > 0.2
        ? {
          x: landmark.x || 0,
          y: landmark.y || 0
        }
        : null;
    };

    const dist = (a, b) => {
      if (!a || !b) return null;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const leftShoulder = getLandmark(LEFT_SHOULDER);
    const rightShoulder = getLandmark(RIGHT_SHOULDER);
    const leftHip = getLandmark(LEFT_HIP);
    const rightHip = getLandmark(RIGHT_HIP);
    const leftAnkle = getLandmark(LEFT_ANKLE);
    const rightAnkle = getLandmark(RIGHT_ANKLE);
    const nose = getLandmark(NOSE);

    console.log("Landmark visibility:", {
      leftShoulder: !!leftShoulder,
      rightShoulder: !!rightShoulder,
      leftHip: !!leftHip,
      rightHip: !!rightHip,
      leftAnkle: !!leftAnkle,
      rightAnkle: !!rightAnkle,
      nose: !!nose
    });

    let pixelHeight = null;
    const midAnkle = leftAnkle && rightAnkle ? {
      x: (leftAnkle.x + rightAnkle.x) / 2,
      y: (leftAnkle.y + rightAnkle.y) / 2
    } : leftAnkle || rightAnkle;

    if (nose && midAnkle) {
      pixelHeight = dist(nose, midAnkle);
      console.log("Pixel height from nose to ankles:", pixelHeight);
    }

    if (!pixelHeight && leftShoulder && leftAnkle) {
      pixelHeight = dist(leftShoulder, leftAnkle) * 1.3;
      console.log("Pixel height estimated from shoulder to ankle:", pixelHeight);
    }

    const pxToCm = (px) => {
      if (!userHeightCmInput || !pixelHeight || pixelHeight <= 0) {
        console.log("Cannot convert pixels to cm:", { userHeightCmInput, pixelHeight });
        return null;
      }
      const raw = (px / pixelHeight) * userHeightCmInput;
      console.log(`Converting ${px}px to cm: ${raw}cm`);
      return raw;
    };

    const shoulderWidthPx = dist(leftShoulder, rightShoulder);
    const hipWidthPx = dist(leftHip, rightHip);
    const chestWidthPx = shoulderWidthPx ? shoulderWidthPx * 1.3 : null;

    const midShoulder = leftShoulder && rightShoulder ? {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    } : null;

    const midHip = leftHip && rightHip ? {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    } : null;

    const torsoLengthPx = midShoulder && midHip ? dist(midShoulder, midHip) : null;

    const shoulderCm = shoulderWidthPx ? pxToCm(shoulderWidthPx) : null;
    const hipCm = hipWidthPx ? pxToCm(hipWidthPx) : null;
    const chestCm = chestWidthPx ? pxToCm(chestWidthPx) : null;
    const torsoLengthCm = torsoLengthPx ? pxToCm(torsoLengthPx) : null;

    console.log("Calculated measurements (cm):", {
      shoulderCm,
      hipCm,
      chestCm,
      torsoLengthCm,
      pixelHeight
    });

    let adjustedChestCm = chestCm;
    if (chestCm && shoulderCm) {
      if (chestCm < shoulderCm * 0.8) {
        adjustedChestCm = shoulderCm * 1.2;
        console.log("Adjusted chest from", chestCm, "to", adjustedChestCm);
      } else if (chestCm > shoulderCm * 2) {
        adjustedChestCm = shoulderCm * 1.5;
        console.log("Adjusted chest from", chestCm, "to", adjustedChestCm);
      }
    }

    const getDefaultChest = () => {
      switch (grade) {
        case "Pre-School": return 60;
        case "Elementary": return 65;
        case "Junior High": return gender === "female" ? 70 : 75;
        default: return 65;
      }
    };

    const getDefaultHip = () => {
      switch (grade) {
        case "Pre-School": return 65;
        case "Elementary": return 70;
        case "Junior High": return gender === "female" ? 85 : 80;
        default: return 75;
      }
    };

    const result = {
      shoulderCm: shoulderCm ? Number(shoulderCm.toFixed(1)) : null,
      chestCm: adjustedChestCm ? Number(adjustedChestCm.toFixed(1)) : getDefaultChest(),
      hipCm: hipCm ? Number(hipCm.toFixed(1)) : getDefaultHip(),
      torsoLengthCm: torsoLengthCm ? Number(torsoLengthCm.toFixed(1)) : null,
      pixelHeight,
      detected: !!shoulderWidthPx,
      isFallback: false
    };

    console.log("Final measurements:", result);
    return result;
  };

  // Firestore functions - unchanged from your original
  const fetchUniformsFromFirebase = async (gender, grade, category = null) => {
    try {
      setLoadingMsg("Fetching uniform data...");

      const uniformsRef = collection(db, "uniforms");
      let q;

      if (category) {
        q = query(
          uniformsRef,
          where("grdLevel", "==", grade),
          where("gender", "in", [gender, "Unisex"]),
          where("category", "==", category)
        );
      } else {
        q = query(
          uniformsRef,
          where("grdLevel", "==", grade),
          where("gender", "in", [gender, "Unisex"])
        );
      }

      const querySnapshot = await getDocs(q);
      const uniforms = [];

      querySnapshot.forEach((doc) => {
        uniforms.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`Fetched ${uniforms.length} uniforms for ${grade} ${gender} ${category || ''}`);
      return uniforms;
    } catch (error) {
      console.error("Error fetching uniforms:", error);
      return [];
    }
  };

  const fetchRecommendedSizes = async (measurements) => {
    try {
      const { chestCm, hipCm } = measurements;

      const topCategories = ["Polo", "Blouse", "PE_Shirt", "Full_Uniform", "Full_PE"];
      const topUniforms = [];

      for (const category of topCategories) {
        const uniforms = await fetchUniformsFromFirebase(gender, grade, category);
        topUniforms.push(...uniforms);
      }

      const bottomCategories = ["Pants", "Skirt", "Short", "PE_Pants"];
      const bottomUniforms = [];

      for (const category of bottomCategories) {
        const uniforms = await fetchUniformsFromFirebase(gender, grade, category);
        bottomUniforms.push(...uniforms);
      }

      let bestTopSize = "Medium";
      let bestTopUniform = null;
      let minTopDiff = Infinity;

      for (const uniform of topUniforms) {
        if (uniform.sizes) {
          for (const [sizeName, sizeData] of Object.entries(uniform.sizes)) {
            if (sizeData.chest && chestCm) {
              const diff = Math.abs(sizeData.chest - chestCm);
              if (diff < minTopDiff) {
                minTopDiff = diff;
                bestTopSize = sizeName;
                bestTopUniform = uniform;
              }
            }
          }
        }
      }

      let bestBottomSize = "Size 8";
      let bestBottomUniform = null;
      let minBottomDiff = Infinity;

      for (const uniform of bottomUniforms) {
        if (uniform.sizes) {
          for (const [sizeName, sizeData] of Object.entries(uniform.sizes)) {
            if (sizeData.hips && hipCm) {
              const diff = Math.abs(sizeData.hips - hipCm);
              if (diff < minBottomDiff) {
                minBottomDiff = diff;
                bestBottomSize = sizeName;
                bestBottomUniform = uniform;
              }
            }
          }
        }
      }

      return {
        topSize: bestTopSize,
        bottomSize: bestBottomSize,
        topUniform: bestTopUniform,
        bottomUniform: bestBottomUniform,
        confidence: {
          top: Math.max(80, 100 - Math.min(100, minTopDiff * 2)),
          bottom: Math.max(80, 100 - Math.min(100, minBottomDiff * 2))
        }
      };

    } catch (error) {
      console.error("Error fetching recommended sizes:", error);

      let fallbackTop = "Medium";
      let fallbackBottom = "Size 8";

      if (grade === "Pre-School") {
        fallbackTop = "Small";
        fallbackBottom = "Size 6";
      } else if (grade === "Junior High") {
        fallbackTop = gender === "female" ? "Medium" : "Large";
        fallbackBottom = gender === "female" ? "Size 10" : "Size 11";
      }

      return {
        topSize: fallbackTop,
        bottomSize: fallbackBottom,
        topUniform: null,
        bottomUniform: null,
        confidence: { top: 75, bottom: 75 }
      };
    }
  };

  const handleCapturePhase = async () => {
    try {
      if (!cameraAPIRef.current) {
        Alert.alert("Camera not ready", "Please wait for the camera to initialize.");
        return;
      }

      if (!poseDetector) {
        Alert.alert("AR Model Not Ready", "Please wait for the AR model to load.");
        return;
      }

      setStatus("capturing");
      const landmarks = await captureAndEstimate();

      let measures = null;
      if (landmarks) {
        measures = landmarksToMeasurements(landmarks);
      } else {
        // Use fallback measurements if MediaPipe fails
        console.log("Using fallback measurements");
        measures = getFallbackMeasurements();
      }

      if (scanPhase === "front") {
        cameraAPIRef.current._frontMeasures = measures;
        setScanPhase("side");
        setStatus("waiting");

        Alert.alert(
          "Front Scan Complete",
          "Great! Now turn sideways for the side view.",
          [{ text: "OK", onPress: () => console.log("Proceeding to side view") }]
        );

      } else {
        cameraAPIRef.current._sideMeasures = measures;
        setStatus("analyzing");
        setLoadingMsg("Calculating your perfect fit...");

        const front = cameraAPIRef.current._frontMeasures;
        const side = cameraAPIRef.current._sideMeasures;

        const combinedMeasures = front || {};

        const recommendedSizes = await fetchRecommendedSizes(combinedMeasures);

        const topImageUrl = recommendedSizes.topUniform?.imageUrl ||
          (gender === "male"
            ? require("../../assets/images/b_unif_ex.png")
            : require("../../assets/images/g_unif_ex.png"));

        const bottomImageUrl = recommendedSizes.bottomUniform?.imageUrl ||
          (gender === "male"
            ? require("../../assets/images/b_unif_ex.png")
            : require("../../assets/images/g_unif_ex.png"));

        router.push({
          pathname: "/ar_mod/ar_result",
          params: {
            topSize: recommendedSizes.topSize,
            bottomSize: recommendedSizes.bottomSize,
            shoulderCm: front?.shoulderCm ?? "N/A",
            chestCm: front?.chestCm ?? "N/A",
            hipCm: front?.hipCm ?? "N/A",
            torsoLengthCm: front?.torsoLengthCm ?? "N/A",
            topConfidence: recommendedSizes.confidence.top,
            bottomConfidence: recommendedSizes.confidence.bottom,
            userHeight: hParam || "N/A",
            userUnit: unitParam || "cm",
            gender: gender || "N/A",
            grade: grade || "N/A",
            topUniformId: recommendedSizes.topUniform?.id,
            bottomUniformId: recommendedSizes.bottomUniform?.id,
            topImageUrl: typeof topImageUrl === 'string' ? topImageUrl : '',
            bottomImageUrl: typeof bottomImageUrl === 'string' ? bottomImageUrl : '',
            measurementsData: JSON.stringify(combinedMeasures)
          },
        });
      }
    } catch (err) {
      console.error("Capture error", err);

      // Use fallback measurements
      const measures = getFallbackMeasurements();
      
      Alert.alert(
        "Proceeding with estimated sizes",
        "Using grade-level estimates for your fit.",
        [{
          text: "OK",
          onPress: () => {
            const fallbackTop = grade === "Pre-School" ? "Small" :
              grade === "Elementary" ? "Medium" :
                gender === "female" ? "Medium" : "Large";
            const fallbackBottom = grade === "Pre-School" ? "Size 6" :
              grade === "Elementary" ? "Size 8" :
                gender === "female" ? "Size 10" : "Size 11";

            const fallbackImage = gender === "male"
              ? require("../../assets/images/b_unif_ex.png")
              : require("../../assets/images/g_unif_ex.png");

            router.push({
              pathname: "/ar_mod/ar_result",
              params: {
                topSize: fallbackTop,
                bottomSize: fallbackBottom,
                shoulderCm: "N/A",
                chestCm: "N/A",
                hipCm: "N/A",
                torsoLengthCm: "N/A",
                topConfidence: 75,
                bottomConfidence: 75,
                userHeight: hParam || "N/A",
                userUnit: unitParam || "cm",
                gender: gender || "N/A",
                grade: grade || "N/A",
                topImageUrl: '',
                bottomImageUrl: '',
              },
            });
          }
        }]
      );
      setStatus("waiting");
    } finally {
      setLoadingMsg("");
    }
  };

  // Render section - unchanged from your original
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
            <Text style={styles.popupTitle}>AR Ready!</Text>
            <Text style={styles.popupText}>
              For best results:
              {"\n"}• Stand 2-3 steps away
              {"\n"}• Face the camera
              {"\n"}• Arms slightly out
            </Text>
            <TouchableOpacity
              style={styles.popupButton}
              onPress={() => setShowReadyPopup(false)}
            >
              <Text style={styles.popupButtonText}>START</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.overlay}>
        <Text style={styles.title}>
          {status === "waiting"
            ? scanPhase === "front"
              ? "Stand in the FRONT silhouette"
              : "Now turn SIDEWAYS"
            : status === "capturing"
              ? `Capturing ${scanPhase} view...`
              : status === "analyzing"
                ? "Finding your perfect fit..."
                : "Setting up AR..."}
        </Text>

        <View style={styles.scanBox}>
          <Text style={{ color: "#fff", fontSize: 16, textAlign: 'center' }}>
            {loadingMsg || (status === "waiting" ? "Ready for capture" : "Please wait...")}
          </Text>

          {!isLoaded && (
            <Text style={{ color: "#FFA500", fontSize: 12, marginTop: 8 }}>
              Loading AR model...
            </Text>
          )}

          {retryCount > 0 && (
            <Text style={{ color: "#FFA500", fontSize: 12, marginTop: 8 }}>
              Tip: Try standing further back ({retryCount} attempts)
            </Text>
          )}

          {(status === "capturing" || status === "analyzing") && (
            <ActivityIndicator size="large" color="#61C35C" style={{ marginTop: 12 }} />
          )}
        </View>

        <View style={{ alignItems: "center", marginTop: 10 }}>
          <TouchableOpacity
            style={[
              styles.captureBtn,
              (!cameraReady || status === "capturing" || !!loadingMsg || !isLoaded) && styles.captureBtnDisabled
            ]}
            onPress={handleCapturePhase}
            disabled={!cameraReady || status === "capturing" || !!loadingMsg || !isLoaded}
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
    marginBottom: 10,
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