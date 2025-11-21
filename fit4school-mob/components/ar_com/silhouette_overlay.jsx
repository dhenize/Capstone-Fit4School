// components/ar_com/silhouette_overlay.jsx
import React from 'react';
import { View, Image, StyleSheet, Dimensions, Text } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SilhouetteOverlay = ({ type = 'front', isActive = false }) => {
  if (!isActive) return null;

  const silhouetteSource = type === 'front' 
    ? require('../../assets/images/silhouette/front_sil.png')
    : require('../../assets/images/silhouette/side_sil.png');

  return (
    <View style={styles.container}>
      <Image 
        source={silhouetteSource} 
        style={styles.silhouette}
        resizeMode="contain"
      />
      <View style={styles.instructionContainer}>
        <View style={styles.instructionBox}>
          <Text style={styles.instructionText}>
            {type === 'front' ? 'Align with FRONT silhouette' : 'Turn SIDEWAYS and align'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  silhouette: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.9,
    opacity: 0.8,
  },
  instructionContainer: {
    position: 'absolute',
    top: 60,
    width: '100%',
    alignItems: 'center',
  },
  instructionBox: {
    backgroundColor: 'rgba(97, 195, 92, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SilhouetteOverlay;