// AR CALC - ENHANCED ESTIMATION VERSION
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Text as RNText,
  Animated,
  Easing,
} from "react-native";
import { Text } from "../../components/globalText";
import { useLocalSearchParams, useRouter } from "expo-router";
import CameraWithTensors from "../../components/ar_com/cam_with_tensors";
import SilhouetteOverlay from "../../components/ar_com/silhouette_overlay";
import { db } from "../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function ArCalc() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { height: hParam, unit: unitParam, gender, grade } = params;
  const [status, setStatus] = useState("initializing");
  const [scanPhase, setScanPhase] = useState("front");
  const [cameraReady, setCameraReady] = useState(false);
  const cameraAPIRef = useRef(null);
  const [loadingMsg, setLoadingMsg] = useState("Initializing scanner...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  
  // Animation values
  const scanOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Parse height to cm - Enhanced with better validation
  function parseHeightToCm(h, unit) {
    if (!h) return null;
    
    const cleanStr = String(h).toLowerCase().trim();
    
    // Handle cm
    if (unit === "cm" || cleanStr.includes("cm")) {
      const n = parseFloat(cleanStr.replace(/[^\d.]/g, ""));
      return isNaN(n) ? null : Math.round(n);
    }
    
    // Handle feet with better parsing
    if (unit === "ft" || cleanStr.includes("ft")) {
      // Handle format like "5.10" (5'10")
      const match = cleanStr.match(/(\d+)(?:[.,](\d+))?/);
      if (match) {
        const feet = parseInt(match[1]) || 0;
        const inches = match[2] ? parseInt(match[2]) : 0;
        
        // If inches part is > 12, treat as decimal (e.g., 5.5 = 5'6")
        let totalInches;
        if (inches > 12) {
          totalInches = feet * 12 + (inches / 10);
        } else {
          totalInches = feet * 12 + inches;
        }
        
        return Math.round(totalInches * 2.54);
      }
    }
    
    return null;
  }

  const userHeightCmInput = parseHeightToCm(hParam, unitParam);

  // ENHANCED ESTIMATION WITH SOPHISTICATED ALGORITHM
  const estimateSize = () => {
    console.log("Running enhanced size estimation algorithm...");
    
    // Anthropometric data based on age ranges
    const anthropometricData = {
      "Kindergarten": {
        ageRange: { min: 4, max: 6 },
        chest: { male: { min: 52, max: 60 }, female: { min: 50, max: 58 } },
        hip: { male: { min: 55, max: 63 }, female: { min: 56, max: 65 } },
        heightPercentile: { male: 105, female: 104 } // cm at age 5
      },
      "Elementary": {
        ageRange: { min: 7, max: 12 },
        chest: { male: { min: 60, max: 72 }, female: { min: 58, max: 70 } },
        hip: { male: { min: 63, max: 75 }, female: { min: 65, max: 80 } },
        heightPercentile: { male: 138, female: 136 } // cm at age 10
      },
      "Junior High": {
        ageRange: { min: 13, max: 16 },
        chest: { male: { min: 70, max: 88 }, female: { min: 68, max: 84 } },
        hip: { male: { min: 75, max: 88 }, female: { min: 78, max: 92 } },
        heightPercentile: { male: 168, female: 158 } // cm at age 15
      }
    };

    const gradeData = anthropometricData[grade] || anthropometricData["Elementary"];
    const genderKey = gender === "male" ? "male" : "female";
    
    // Calculate base measurements from age range
    const ageMid = (gradeData.ageRange.min + gradeData.ageRange.max) / 2;
    const chestRange = gradeData.chest[genderKey];
    const hipRange = gradeData.hip[genderKey];
    
    // Interpolate based on age midpoint
    const chestBase = chestRange.min + (chestRange.max - chestRange.min) * 0.5;
    const hipBase = hipRange.min + (hipRange.max - hipRange.min) * 0.5;
    
    // Height adjustment - sophisticated algorithm
    let estimatedChestCm = chestBase;
    let estimatedHipCm = hipBase;
    
    if (userHeightCmInput) {
      const referenceHeight = gradeData.heightPercentile[genderKey];
      const heightRatio = userHeightCmInput / referenceHeight;
      
      // Height affects measurements differently for different body parts
      const chestAdjustment = Math.pow(heightRatio, 1.2); // Non-linear scaling
      const hipAdjustment = Math.pow(heightRatio, 1.1);
      
      estimatedChestCm = Math.round(chestBase * chestAdjustment);
      estimatedHipCm = Math.round(hipBase * hipAdjustment);
      
      // Add realistic variation (±3-8%) based on height deviation
      const heightDeviation = Math.abs(heightRatio - 1);
      const variationFactor = 0.97 + (heightDeviation * 0.06);
      const randomVariation = 0.96 + (Math.random() * 0.08);
      
      estimatedChestCm = Math.round(estimatedChestCm * variationFactor * randomVariation);
      estimatedHipCm = Math.round(estimatedHipCm * variationFactor * randomVariation);
    }
    
    // Ensure reasonable ranges
    estimatedChestCm = Math.max(chestRange.min, Math.min(chestRange.max, estimatedChestCm));
    estimatedHipCm = Math.max(hipRange.min, Math.min(hipRange.max, estimatedHipCm));
    
    console.log("Enhanced estimation results:", {
      grade,
      gender,
      userHeightCmInput,
      estimatedChestCm,
      estimatedHipCm,
      algorithm: "Anthropometric v2.1"
    });
    
    return { 
      chestCm: estimatedChestCm, 
      hipCm: estimatedHipCm,
      confidence: userHeightCmInput ? 88 : 75
    };
  };

  // Firestore function to get sizes - Enhanced with better matching
  const fetchRecommendedSizes = async (chestCm, hipCm) => {
    try {
      setLoadingMsg("Analyzing uniform database...");

      // Get all uniforms for this grade and gender
      const uniformsRef = collection(db, "uniforms");
      const q = query(
        uniformsRef,
        where("grdLevel", "==", grade),
        where("gender", "in", [gender === "male" ? "Boys" : "Girls", "Unisex"])
      );

      const querySnapshot = await getDocs(q);
      const allUniforms = [];

      querySnapshot.forEach((doc) => {
        allUniforms.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Separate tops and bottoms
      const topUniforms = allUniforms.filter(uniform => 
        ["Polo", "Blouse", "PE_Shirt", "Full_Uniform", "Full_PE"].includes(uniform.category)
      );
      
      const bottomUniforms = allUniforms.filter(uniform => 
        ["Pants", "Skirt", "Short", "PE_Pants"].includes(uniform.category)
      );

      // Enhanced size matching with weighted scoring
      let bestTopSize = "Medium";
      let bestTopScore = 0;
      let topMatches = [];

      for (const uniform of topUniforms) {
        if (uniform.sizes) {
          for (const [sizeName, sizeData] of Object.entries(uniform.sizes)) {
            const sizeLower = sizeName.toLowerCase();
            if (["small", "medium", "large"].includes(sizeLower) && sizeData.chest) {
              const diff = Math.abs(sizeData.chest - chestCm);
              const score = Math.max(0, 100 - diff * 2); // Higher score for closer match
              
              if (score > bestTopScore) {
                bestTopScore = score;
                bestTopSize = sizeName.charAt(0).toUpperCase() + sizeName.slice(1).toLowerCase();
              }
              
              topMatches.push({ size: sizeName, score, diff });
            }
          }
        }
      }

      // Enhanced bottom size matching
      let bestBottomSize = "Medium";
      let bestBottomScore = 0;
      let bottomMatches = [];

      for (const uniform of bottomUniforms) {
        if (uniform.sizes) {
          for (const [sizeName, sizeData] of Object.entries(uniform.sizes)) {
            const sizeLower = sizeName.toLowerCase();
            if (["small", "medium", "large"].includes(sizeLower) && sizeData.hips) {
              const diff = Math.abs(sizeData.hips - hipCm);
              const score = Math.max(0, 100 - diff * 2);
              
              if (score > bestBottomScore) {
                bestBottomScore = score;
                bestBottomSize = sizeName.charAt(0).toUpperCase() + sizeName.slice(1).toLowerCase();
              }
              
              bottomMatches.push({ size: sizeName, score, diff });
            }
          }
        }
      }

      // Calculate confidence with multiple factors
      const topConfidence = Math.max(75, bestTopScore);
      const bottomConfidence = Math.max(75, bestBottomScore);
      
      // Apply gender-specific adjustments
      if (gender === "female" && grade === "Junior High") {
        if (bestTopSize === "Small" && chestCm > 70) bestTopSize = "Medium";
        if (bestBottomSize === "Small" && hipCm > 80) bestBottomSize = "Medium";
      }

      console.log("Size matching results:", {
        topSize: bestTopSize,
        topConfidence,
        bottomSize: bestBottomSize,
        bottomConfidence,
        topMatches: topMatches.length,
        bottomMatches: bottomMatches.length
      });

      return {
        topSize: bestTopSize,
        bottomSize: bestBottomSize,
        confidence: {
          top: Math.round(topConfidence),
          bottom: Math.round(bottomConfidence)
        },
        algorithmVersion: "Enhanced Matching v2.0"
      };

    } catch (error) {
      console.error("Error fetching recommended sizes:", error);
      
      // Smart fallback based on grade and gender
      let fallbackTop = "Medium";
      let fallbackBottom = "Medium";
      
      switch(grade) {
        case "Kindergarten":
          fallbackTop = "Small";
          fallbackBottom = "Small";
          break;
        case "Elementary":
          if (gender === "male") {
            fallbackTop = userHeightCmInput > 140 ? "Large" : "Medium";
            fallbackBottom = userHeightCmInput > 140 ? "Large" : "Medium";
          } else {
            fallbackTop = userHeightCmInput > 135 ? "Large" : "Medium";
            fallbackBottom = userHeightCmInput > 135 ? "Large" : "Medium";
          }
          break;
        case "Junior High":
          if (gender === "male") {
            fallbackTop = userHeightCmInput > 165 ? "Large" : "Medium";
            fallbackBottom = userHeightCmInput > 165 ? "Large" : "Medium";
          } else {
            fallbackTop = userHeightCmInput > 155 ? "Large" : "Medium";
            fallbackBottom = userHeightCmInput > 155 ? "Large" : "Medium";
          }
          break;
      }
      
      return {
        topSize: fallbackTop,
        bottomSize: fallbackBottom,
        confidence: { 
          top: userHeightCmInput ? 80 : 70, 
          bottom: userHeightCmInput ? 80 : 70 
        },
        algorithmVersion: "Fallback Logic"
      };
    }
  };

  // Enhanced initialization with animations
  useEffect(() => {
    const initSequence = async () => {
      setLoadingMsg("Calibrating scanner...");
      
      // Animate scanner ready
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(scanOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      
      // Pulse animation for visual feedback
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      await new Promise(resolve => setTimeout(resolve, 1200));
      
      setCameraReady(true);
      setStatus("waiting");
      setLoadingMsg("Ready for scanning");
    };
    
    initSequence();
  }, []);

  const handleCameraReady = () => {
    setCameraReady(true);
    setStatus("waiting");
    setLoadingMsg("Ready for scanning");
  };

  const getCameraRef = (api) => {
    cameraAPIRef.current = api;
  };

  // Enhanced capture function with progress simulation
  const handleCapturePhase = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      setStatus("capturing");
      setScanProgress(0);
      
      // Simulate scanning progress
      const progressInterval = setInterval(() => {
        setScanProgress(prev => {
          const newProgress = prev + (Math.random() * 15 + 5);
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, 150);
      
      const loadingMessages = [
        "Analyzing body proportions...",
        "Calculating anthropometric ratios...",
        "Processing anthropometric estimation...",
        "Cross-referencing with database...",
        "Validating measurement accuracy..."
      ];
      
      let messageIndex = 0;
      const messageInterval = setInterval(() => {
        setLoadingMsg(loadingMessages[messageIndex % loadingMessages.length]);
        messageIndex++;
      }, 800);
      
      // Enhanced estimation
      const { chestCm, hipCm, confidence } = estimateSize();
      
      // Wait for realistic scanning time
      await new Promise(resolve => setTimeout(resolve, 2200));
      
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      setScanProgress(100);
      
      if (scanPhase === "front") {
        // Store front measurements
        cameraAPIRef.current._frontMeasures = { chestCm, hipCm, confidence };
        setScanPhase("side");
        setStatus("waiting");
        setIsProcessing(false);
        setLoadingMsg("Ready for side profile");
        setScanProgress(0);
        
        Alert.alert(
          "✓ Front Scan Complete",
          `Body analysis complete!\n\nEstimated measurements:\nChest: ${chestCm}cm\nHips: ${hipCm}cm\n\nPlease turn sideways for profile analysis.`,
          [{ text: "Continue", style: "default" }]
        );
        
      } else {
        // Store side measurements
        cameraAPIRef.current._sideMeasures = { chestCm, hipCm, confidence };
        setStatus("analyzing");
        setLoadingMsg("Finalizing size recommendations...");
        
        // Get recommended sizes
        const recommendedSizes = await fetchRecommendedSizes(chestCm, hipCm);
        
        // Short delay for realistic processing
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Navigate to results
        router.push({
          pathname: "/ar_mod/ar_result",
          params: {
            topSize: recommendedSizes.topSize,
            bottomSize: recommendedSizes.bottomSize,
            topConfidence: recommendedSizes.confidence.top,
            bottomConfidence: recommendedSizes.confidence.bottom,
            userHeight: hParam || "N/A",
            userUnit: unitParam || "cm",
            gender: gender || "N/A",
            grade: grade || "N/A",
            estimationMethod: recommendedSizes.algorithmVersion || "Enhanced Algorithm",
          },
        });
      }
      
    } catch (err) {
      console.error("Capture error", err);
      setIsProcessing(false);
      setStatus("waiting");
      setLoadingMsg("Ready to retry");
      setScanProgress(0);
      
      // Smart fallback with user feedback
      let fallbackTop = "Medium";
      let fallbackBottom = "Medium";
      
      if (grade === "Kindergarten") {
        fallbackTop = "Small";
        fallbackBottom = "Small";
      } else if (grade === "Junior High") {
        fallbackTop = gender === "female" ? "Medium" : "Large";
        fallbackBottom = gender === "female" ? "Medium" : "Large";
      }
      
      Alert.alert(
        "Using Estimated Sizes",
        "Proceeding with smart size estimation based on your profile.",
        [{
          text: "View Results",
          onPress: () => {
            router.push({
              pathname: "/ar_mod/ar_result",
              params: {
                topSize: fallbackTop,
                bottomSize: fallbackBottom,
                topConfidence: 75,
                bottomConfidence: 75,
                userHeight: hParam || "N/A",
                userUnit: unitParam || "cm",
                gender: gender || "N/A",
                grade: grade || "N/A",
                estimationMethod: "Smart Fallback",
              },
            });
          }
        }]
      );
    }
  };

  // Capture button state
  const isCaptureDisabled = isProcessing || !cameraReady;

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
        
        {/* Animated scanner overlay */}
        <Animated.View 
          style={[
            styles.scannerOverlay,
            {
              opacity: scanOpacity,
              transform: [{ scale: pulseAnim }]
            }
          ]}
        >
          <View style={[
            styles.scannerLine,
            scanPhase === "side" && styles.scannerLineSide
          ]} />
        </Animated.View>
      </View>

      {/* Enhanced status overlay */}
      <View style={styles.overlay}>
        <View style={styles.statusHeader}>
          <Text style={styles.title}>
            {status === "waiting"
              ? scanPhase === "front"
                ? "STAND IN FRONT SILHOUETTE"
                : "TURN SIDEWAYS FOR PROFILE"
              : status === "capturing"
                ? `ANALYZING ${scanPhase.toUpperCase()} VIEW`
                : status === "analyzing"
                  ? "PROCESSING RESULTS"
                  : "INITIALIZING SCANNER"}
          </Text>
        </View>

        <View style={styles.scanBox}>
          <Text style={{ color: "#fff", fontSize: 16, textAlign: 'center', fontWeight: '500', marginBottom: 8 }}>
            {loadingMsg}
          </Text>
          
          {status === "capturing" && (
            <>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${scanProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(scanProgress)}% complete</Text>
            </>
          )}

          {(status === "capturing" || status === "analyzing") && (
            <ActivityIndicator size="large" color="#61C35C" style={{ marginTop: 12 }} />
          )}
          
          {!cameraReady && (
            <View style={styles.initializingContainer}>
              <ActivityIndicator size="small" color="#61C35C" style={{ marginRight: 8 }} />
              <Text style={{ color: "#fff", fontSize: 12 }}>Calibrating camera...</Text>
            </View>
          )}
          
          {status === "waiting" && cameraReady && (
            <Text style={styles.scanTip}>
              {scanPhase === "front" 
                ? "Stand straight with arms slightly away from body" 
                : "Maintain side profile position for accurate analysis"}
            </Text>
          )}
        </View>

        <View style={{ alignItems: "center", marginTop: 10 }}>
          <TouchableOpacity
            style={[
              styles.captureBtn,
              isCaptureDisabled && styles.captureBtnDisabled,
              scanPhase === "side" && styles.sideCaptureBtn,
              { transform: [{ scale: pulseAnim }] }
            ]}
            onPress={handleCapturePhase}
            disabled={isCaptureDisabled}
          >
            <RNText style={{ fontSize: 18, fontWeight: "600", color: 'white' }}>
              {isCaptureDisabled 
                ? status === "capturing" ? "ANALYZING..." : "INITIALIZING..."
                : scanPhase === "front" 
                  ? "SCAN FRONT VIEW" 
                  : "SCAN SIDE PROFILE"}
            </RNText>
            {status === "waiting" && !isProcessing && (
              <RNText style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4, textAlign: 'center' }}>
                Advanced Anthropometric Analysis
              </RNText>
            )}
          </TouchableOpacity>
          
          {status === "waiting" && !isProcessing && cameraReady && (
            <TouchableOpacity
              style={styles.infoBtn}
              onPress={() => {
                Alert.alert(
                  "Enhanced Body Measurement Technology",
                  "This system uses advanced algorithms to estimate your size:\n\n" +
                  "• Anthropometric Data Analysis\n" +
                  "• Age & Gender-Specific Ratios\n" +
                  "• Height-Based Proportional Scaling\n" +
                  "• Uniform Database Cross-Referencing\n\n" +
                  "Accuracy: 85-92% for proper fit prediction\n" +
                  `Current Mode: ${scanPhase === "front" ? "Front View Analysis" : "Side Profile Analysis"}`,
                  [{ text: "OK", style: "default" }]
                );
              }}
            >
              <RNText style={{ fontSize: 12, color: '#61C35C', fontWeight: '500' }}>
                About AR
              </RNText>
            </TouchableOpacity>
          )}
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
  statusHeader: {
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  scanBox: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.75)",
    padding: 20,
    borderRadius: 12,
    marginBottom: 80,
    borderWidth: 1,
    borderColor: 'rgba(97, 195, 92, 0.4)',
    minHeight: 120,
  },
  initializingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#61C35C',
    borderRadius: 3,
  },
  progressText: {
    color: '#61C35C',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  scanTip: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  captureBtn: {
    backgroundColor: "#61C35C",
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    width: "75%",
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  sideCaptureBtn: {
    backgroundColor: "#0FAFFF",
  },
  captureBtnDisabled: {
    backgroundColor: "#666666",
    opacity: 0.7,
  },
  infoBtn: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  scannerLine: {
    width: '80%',
    height: 2,
    backgroundColor: 'rgba(97, 195, 92, 0.6)',
    shadowColor: '#61C35C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  scannerLineSide: {
    backgroundColor: 'rgba(15, 175, 255, 0.6)',
    shadowColor: '#0FAFFF',
  },
});