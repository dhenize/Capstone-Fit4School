// components/ar_com/cam_view.jsx

import { StyleSheet } from "react-native";
import React from "react";
import { CameraView } from "expo-camera";

export default function CamView({ hidden }) {
  if (hidden) return null;

  return (
    <CameraView
      style={StyleSheet.absoluteFill}
    />
  );
}


