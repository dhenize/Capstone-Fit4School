import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  Platform, 
  useWindowDimensions,
  SafeAreaView 
} from 'react-native';
import React from 'react';
import { Text } from "../../components/globalText";
import { useRouter } from "expo-router";

// Get initial dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Responsive scaling function
const scaleSize = (size) => {
  const scale = SCREEN_WIDTH / 375; // 375 is standard mobile width
  return Math.round(size * Math.min(scale, 2)); // Cap scaling at 2x
};

// Responsive font scaling
const scaleFont = (size) => {
  const scale = Math.min(SCREEN_WIDTH / 375, 2);
  const newSize = size * scale;
  
  if (Platform.OS === 'ios') {
    return Math.round(newSize);
  } else {
    return Math.round(newSize);
  }
};

// Responsive padding/margin
const scaleVertical = (size) => {
  const scale = SCREEN_HEIGHT / 667; // 667 is standard mobile height
  return Math.round(size * Math.min(scale, 1.8));
};

// Breakpoints for different screen sizes
const breakpoints = {
  smallMobile: 320,
  mediumMobile: 375,
  largeMobile: 425,
  tablet: 768,
  laptop: 1024,
  laptopLarge: 1440,
  fourK: 2560
};

// Responsive utility function
const getResponsiveValue = (currentWidth, values) => {
  if (currentWidth <= breakpoints.smallMobile) return values.smallMobile || values.mediumMobile || values.default;
  if (currentWidth <= breakpoints.mediumMobile) return values.mediumMobile || values.default;
  if (currentWidth <= breakpoints.largeMobile) return values.largeMobile || values.default;
  if (currentWidth <= breakpoints.tablet) return values.tablet || values.default;
  if (currentWidth <= breakpoints.laptop) return values.laptop || values.default;
  if (currentWidth <= breakpoints.laptopLarge) return values.laptopLarge || values.default;
  return values.fourK || values.laptopLarge || values.default;
};

export default function Logout() {
  const router = useRouter();
  const { width: currentWidth, height: currentHeight } = useWindowDimensions();
  
  // Platform-specific styles
  const platformStyles = Platform.select({
    ios: {
      buttonShadow: {
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 4 },
      },
      containerPadding: {
        paddingTop: 20,
        paddingBottom: 20,
      }
    },
    android: {
      buttonShadow: {
        elevation: 4,
      },
      containerPadding: {
        paddingTop: 10,
        paddingBottom: 10,
      }
    },
    default: {
      buttonShadow: {
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      },
      containerPadding: {
        paddingTop: 20,
        paddingBottom: 20,
      }
    }
  });

  // Responsive values
  const responsiveValues = {
    welcomeTextSize: getResponsiveValue(currentWidth, {
      smallMobile: scaleFont(18),
      mediumMobile: scaleFont(20),
      largeMobile: scaleFont(22),
      tablet: scaleFont(24),
      laptop: scaleFont(26),
      laptopLarge: scaleFont(28),
      fourK: scaleFont(32),
      default: scaleFont(22)
    }),
    titleTextSize: getResponsiveValue(currentWidth, {
      smallMobile: scaleFont(28),
      mediumMobile: scaleFont(32),
      largeMobile: scaleFont(36),
      tablet: scaleFont(40),
      laptop: scaleFont(44),
      laptopLarge: scaleFont(48),
      fourK: scaleFont(56),
      default: scaleFont(36)
    }),
    imageWidth: getResponsiveValue(currentWidth, {
      smallMobile: currentWidth * 0.85,
      default: currentWidth * 0.9
    }),
    imageHeight: getResponsiveValue(currentWidth, {
      smallMobile: currentWidth * 0.6,
      mediumMobile: currentWidth * 0.65,
      largeMobile: currentWidth * 0.7,
      tablet: currentWidth * 0.5,
      laptop: currentWidth * 0.45,
      default: currentWidth * 0.7
    }),
    buttonWidth: getResponsiveValue(currentWidth, {
      smallMobile: currentWidth * 0.8,
      default: currentWidth * 0.85
    }),
    buttonTextSize: getResponsiveValue(currentWidth, {
      smallMobile: scaleFont(16),
      mediumMobile: scaleFont(18),
      largeMobile: scaleFont(20),
      tablet: scaleFont(22),
      laptop: scaleFont(24),
      default: scaleFont(20)
    }),
    footerTextSize: getResponsiveValue(currentWidth, {
      smallMobile: scaleFont(13),
      mediumMobile: scaleFont(14),
      largeMobile: scaleFont(15),
      tablet: scaleFont(16),
      laptop: scaleFont(17),
      default: scaleFont(15)
    }),
    signInTextSize: getResponsiveValue(currentWidth, {
      smallMobile: scaleFont(14),
      mediumMobile: scaleFont(15),
      largeMobile: scaleFont(16),
      tablet: scaleFont(17),
      laptop: scaleFont(18),
      default: scaleFont(16)
    })
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, platformStyles.containerPadding]}>
        <Text style={[
          styles.welcomeText,
          {
            fontSize: responsiveValues.welcomeTextSize,
            marginBottom: getResponsiveValue(currentWidth, {
              smallMobile: -8,
              default: -9
            }),
            marginTop: getResponsiveValue(currentWidth, {
              smallMobile: scaleVertical(15),
              tablet: scaleVertical(20),
              laptop: scaleVertical(25),
              default: scaleVertical(30)
            })
          }
        ]}>WELCOME TO</Text>
        
        <Text style={[
          styles.titleText,
          {
            fontSize: responsiveValues.titleTextSize,
            marginBottom: getResponsiveValue(currentWidth, {
              smallMobile: scaleVertical(15),
              tablet: scaleVertical(25),
              laptop: scaleVertical(30),
              default: scaleVertical(20)
            })
          }
        ]}>FIT4SCHOOL</Text>

        <View style={[
          styles.login_pic,
          {
            marginVertical: getResponsiveValue(currentWidth, {
              smallMobile: scaleVertical(60),
              mediumMobile: scaleVertical(80),
              largeMobile: scaleVertical(90),
              tablet: scaleVertical(120),
              laptop: scaleVertical(150),
              default: scaleVertical(100)
            })
          }
        ]}>
          <Image 
            source={require("../../assets/images/login.png")} 
            style={[
              styles.image,
              {
                width: responsiveValues.imageWidth,
                height: responsiveValues.imageHeight
              }
            ]}
            resizeMode="contain"
          />
        </View>

        <TouchableOpacity 
          style={[
            styles.button,
            platformStyles.buttonShadow,
            {
              width: responsiveValues.buttonWidth,
              paddingVertical: getResponsiveValue(currentWidth, {
                smallMobile: scaleVertical(12),
                tablet: scaleVertical(16),
                laptop: scaleVertical(18),
                default: scaleVertical(14)
              }),
              marginTop: getResponsiveValue(currentWidth, {
                smallMobile: scaleVertical(30),
                tablet: scaleVertical(60),
                laptop: scaleVertical(80),
                default: scaleVertical(50)
              }),
              marginBottom: getResponsiveValue(currentWidth, {
                smallMobile: scaleVertical(10),
                default: scaleVertical(15)
              })
            }
          ]}
          onPress={() => router.push('/acc_mod/signup')}
        >
          <Text style={[
            styles.buttonText,
            {
              fontSize: responsiveValues.buttonTextSize
            }
          ]}>SIGN UP</Text>
        </TouchableOpacity>
        
        <View style={[
          styles.footer,
          {
            marginTop: getResponsiveValue(currentWidth, {
              smallMobile: scaleVertical(5),
              default: scaleVertical(7)
            })
          }
        ]}>
          <Text style={[
            styles.stonText,
            {
              fontSize: responsiveValues.footerTextSize
            }
          ]}>Already have an account ?</Text>
        </View>

        <TouchableOpacity 
          style={{
            marginTop: getResponsiveValue(currentWidth, {
              smallMobile: scaleVertical(3),
              default: scaleVertical(5)
            })
          }}
          onPress={() => router.push('/acc_mod/signin')}
        >
          <Text style={[
            styles.upText,
            {
              fontSize: responsiveValues.signInTextSize
            }
          ]}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFBFB',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFBFB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  welcomeText: {
    color: 'black',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  titleText: {
    color: 'black',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  login_pic: {
    alignItems: 'center',   
    justifyContent: 'center', 
  },
  
  button: {
    backgroundColor: '#61C35C',
    borderRadius: scaleSize(10),
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,   
  },
  stonText: {
    color: 'black',
    fontSize: 14,
  },
  upText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
});