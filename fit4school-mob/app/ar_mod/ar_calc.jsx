// AR CALC - COMPLETE UPDATED VERSION
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
// MediaPipe imports
//import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
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

  // MediaPipe Pose Detector
  const poseDetectorRef = useRef(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [modelError, setModelError] = useState(null);

  // Feature flag: disable heavy MediaPipe WASM model by default
  // Set to true only if you installed @mediapipe/tasks-vision and tested on supported platforms
  const USE_MEDIAPIPE = false;

  // Parse height to cm
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

  // Initialize MediaPipe only when explicitly enabled
  const initializePoseDetector = async () => {
    if (!USE_MEDIAPIPE) return;
    try {
      setLoadingMsg("Loading AR model...");
      const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      poseDetectorRef.current = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
        },
        runningMode: "IMAGE",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      setIsModelLoaded(true);
      setModelError(null);
      console.log("✅ MediaPipe Pose Detector loaded");
      setLoadingMsg("");
      setStatus("waiting");
      setShowReadyPopup(true);
      setTimeout(() => setShowReadyPopup(false), 2500);
    } catch (error) {
      console.error("Failed to load MediaPipe model:", error);
      setModelError(error.message);
      setIsModelLoaded(false);
      Alert.alert(
        "AR Model Load Failed",
        "Using fallback measurements. Still able to proceed.",
        [
          {
            text: "OK",
            onPress: () => {
              setStatus("waiting");
              setShowReadyPopup(true);
              setTimeout(() => setShowReadyPopup(false), 2000);
            },
          },
        ]
      );
    }
  };

  useEffect(() => {
    if (USE_MEDIAPIPE) initializePoseDetector();
  }, []);

  // Auto-capture when pose is consistently valid for a few frames
  const consecutiveValidRef = useRef(0);
  const autoCaptureIntervalRef = useRef(null);

  useEffect(() => {
    const startAutoCapture = () => {
      if (!USE_MEDIAPIPE || !cameraAPIRef.current || !isModelLoaded) return;
      if (autoCaptureIntervalRef.current) return;

      autoCaptureIntervalRef.current = setInterval(async () => {
        if (status !== "waiting") return;
        try {
          if (!cameraAPIRef.current.captureFrameForPose) return;
          const frame = await cameraAPIRef.current.captureFrameForPose();
          if (!frame || !frame.base64) {
            consecutiveValidRef.current = 0;
            return;
          }

          const image = {
            width: frame.width || 640,
            height: frame.height || 480,
            data: base64ToUint8Array(frame.base64),
          };

          const detectionResult = poseDetectorRef.current?.detect(image);
          const landmarks = detectionResult?.landmarks?.[0] || null;
          const valid = validatePose(landmarks);

          if (valid) consecutiveValidRef.current += 1;
          else consecutiveValidRef.current = 0;

          if (consecutiveValidRef.current >= 3) {
            clearInterval(autoCaptureIntervalRef.current);
            autoCaptureIntervalRef.current = null;
            consecutiveValidRef.current = 0;
            handleCapturePhase();
          }
        } catch (err) {
          console.warn("Auto-capture error:", err);
          consecutiveValidRef.current = 0;
        }
      }, 900);
    };

    const stopAutoCapture = () => {
      if (autoCaptureIntervalRef.current) {
        clearInterval(autoCaptureIntervalRef.current);
        autoCaptureIntervalRef.current = null;
      }
      consecutiveValidRef.current = 0;
    };

    if (cameraReady && isModelLoaded && USE_MEDIAPIPE) startAutoCapture();
    else stopAutoCapture();

    return () => stopAutoCapture();
  }, [cameraReady, isModelLoaded, status]);

  const handleCameraReady = () => {
    setCameraReady(true);
    // If MediaPipe is not used, mark waiting and show ready popup immediately
    if (!USE_MEDIAPIPE) {
      setStatus("waiting");
      setShowReadyPopup(true);
      setTimeout(() => setShowReadyPopup(false), 2000);
      return;
    }

    if (isModelLoaded || !modelError) {
      setStatus("waiting");
    }
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
      const keyLandmarkIndices = [0, 11, 12, 23, 24, 27, 28];
      const visibleKeyLandmarks = keyLandmarkIndices.filter(idx =>
        landmarks[idx] && landmarks[idx].visibility > 0.3
      ).length;

      if (visibleKeyLandmarks < 4) {
        console.log(`Only ${visibleKeyLandmarks} key landmarks visible`);
        return false;
      }

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

  // Helper function to convert base64 to Uint8Array
  const base64ToUint8Array = (base64) => {
    const padding = '='.repeat((4 - base64.length % 4) % 4);
    const base64WithPadding = base64 + padding;
    const rawData = atob(base64WithPadding);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Capture using MediaPipe
  const captureAndEstimate = async () => {
    if (!cameraAPIRef.current) {
      throw new Error("Camera not ready");
    }

    setStatus("capturing");
    setLoadingMsg("Capturing...");

    try {
        // Prefer a lighter frame capture if available (camera component helper)
        let photo = null;
        if (cameraAPIRef.current.captureFrameForPose) {
          try {
            photo = await cameraAPIRef.current.captureFrameForPose();
          } catch (err) {
            console.warn("captureFrameForPose failed, falling back to takePictureAsync", err);
          }
        }

        if (!photo) {
          photo = await cameraAPIRef.current.takePictureAsync({
            quality: 0.7,
            base64: true,
            skipProcessing: true,
            exif: false,
          });
        }

        if (!photo?.base64) {
          console.log("No base64 data in photo");
          return null;
        }

        setLoadingMsg("Analyzing pose...");

        // If model failed to load, use fallback
        if (!poseDetectorRef.current) {
          console.log("Pose detector not loaded, using fallback");
          return null;
        }

        // Build image object expected by MediaPipe
        const image = {
          width: photo.width || 640,
          height: photo.height || 480,
          data: base64ToUint8Array(photo.base64)
        };

      // Try to detect pose
      const detectionResult = poseDetectorRef.current.detect(image);
      
      console.log("Detection result:", {
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
            [{ text: "Try Again" }]
          );
        } else {
          Alert.alert(
            "Detection issue",
            "Please ensure your full body is visible in the frame.",
            [{ text: "OK" }]
          );
        }

        return null;
      }

      setRetryCount(0);
      return landmarks;
    } catch (error) {
      console.error("Capture error:", error);
      console.log("Error details:", error.message);
      
      if (error.message.includes("detect")) {
        console.log("MediaPipe detection failed, using fallback");
      }
      
      Alert.alert(
        "Detection Failed",
        "Could not analyze pose. Using estimated measurements.",
        [{ text: "OK" }]
      );
      return null;
    }
  };

  // Process MediaPipe landmarks
  const landmarksToMeasurements = (landmarks) => {
    if (!landmarks || landmarks.length < 33) {
      console.log("Insufficient landmarks for measurements");
      return null;
    }

    // MediaPipe returns normalized coordinates (0-1)
    // We'll use a standard reference size since we have user's actual height
    const imageWidth = 640;
    const imageHeight = 480;

    const convertToPixels = (landmark) => ({
      x: landmark.x * imageWidth,
      y: landmark.y * imageHeight
    });

    // Landmark indices
    const LEFT_SHOULDER = 11;
    const RIGHT_SHOULDER = 12;
    const LEFT_HIP = 23;
    const RIGHT_HIP = 24;
    const LEFT_ANKLE = 27;
    const RIGHT_ANKLE = 28;
    const NOSE = 0;

    const leftShoulder = convertToPixels(landmarks[LEFT_SHOULDER]);
    const rightShoulder = convertToPixels(landmarks[RIGHT_SHOULDER]);
    const leftHip = convertToPixels(landmarks[LEFT_HIP]);
    const rightHip = convertToPixels(landmarks[RIGHT_HIP]);
    const leftAnkle = convertToPixels(landmarks[LEFT_ANKLE]);
    const rightAnkle = convertToPixels(landmarks[RIGHT_ANKLE]);
    const nose = convertToPixels(landmarks[NOSE]);

    console.log("Landmark positions:", {
      leftShoulder,
      rightShoulder,
      leftHip,
      rightHip,
      leftAnkle,
      rightAnkle,
      nose
    });

    const dist = (a, b) => {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.sqrt(dx * dx + dy * dy);
    };

    // Calculate pixel height (nose to ankles)
    const midAnkle = {
      x: (leftAnkle.x + rightAnkle.x) / 2,
      y: (leftAnkle.y + rightAnkle.y) / 2
    };

    const pixelHeight = dist(nose, midAnkle);
    console.log("Pixel height:", pixelHeight);

    // Calculate pixel to cm ratio using user's actual height
    const pxToCm = (px) => {
      if (!userHeightCmInput || !pixelHeight || pixelHeight <= 0) {
        console.log("Cannot convert pixels to cm:", { userHeightCmInput, pixelHeight });
        return null;
      }
      const raw = (px / pixelHeight) * userHeightCmInput;
      console.log(`Converting ${px}px to cm: ${raw}cm`);
      return raw;
    };

    // Calculate measurements in pixels
    const shoulderWidthPx = dist(leftShoulder, rightShoulder);
    const hipWidthPx = dist(leftHip, rightHip);
    const chestWidthPx = shoulderWidthPx * 1.3; // Estimate chest from shoulders

    // Calculate torso length
    const midShoulder = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };

    const midHip = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    };

    const torsoLengthPx = dist(midShoulder, midHip);

    // Convert to cm
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

    // Get fallback values if needed
    const getDefaultChest = () => {
      switch (grade) {
        case "Kindergarten": return 60;
        case "Elementary": return 65;
        case "Junior High": return gender === "female" ? 70 : 75;
        default: return 65;
      }
    };

    const getDefaultHip = () => {
      switch (grade) {
        case "Kindergarten": return 65;
        case "Elementary": return 70;
        case "Junior High": return gender === "female" ? 85 : 80;
        default: return 75;
      }
    };

    const result = {
      shoulderCm: shoulderCm ? Number(shoulderCm.toFixed(1)) : (getDefaultChest() * 0.9),
      chestCm: chestCm ? Number(chestCm.toFixed(1)) : getDefaultChest(),
      hipCm: hipCm ? Number(hipCm.toFixed(1)) : getDefaultHip(),
      torsoLengthCm: torsoLengthCm ? Number(torsoLengthCm.toFixed(1)) : (userHeightCmInput ? userHeightCmInput * 0.5 : 40),
      pixelHeight,
      detected: !!shoulderWidthPx,
      isFallback: false
    };

    console.log("Final measurements:", result);
    return result;
  };

  // Firestore functions - unchanged
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

      if (grade === "Kindergarten") {
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
            const fallbackTop = grade === "Kindergarten" ? "Small" :
              grade === "Elementary" ? "Medium" :
                gender === "female" ? "Medium" : "Large";
            const fallbackBottom = grade === "Kindergarten" ? "Size 6" :
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

  // Check if capture button should be disabled
  const isCaptureDisabled = !cameraReady || status === "capturing" || !!loadingMsg;

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
              {modelError && "\n\n⚠️ Using fallback measurements"}
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

          {!isModelLoaded && !modelError && (
            <Text style={{ color: "#FFA500", fontSize: 12, marginTop: 8 }}>
              Loading AR model...
            </Text>
          )}

          {modelError && (
            <Text style={{ color: "#FFA500", fontSize: 12, marginTop: 8 }}>
              ⚠️ Using fallback measurements
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
              isCaptureDisabled && styles.captureBtnDisabled
            ]}
            onPress={handleCapturePhase}
            disabled={isCaptureDisabled}
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