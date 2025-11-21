import { Text as RNText } from "react-native";

const fontMap = {
  "100": "Lexend_100Thin",
  "200": "Lexend_200ExtraLight",
  "300": "Lexend_300Light",
  "400": "Lexend_400Regular",
  "500": "Lexend_500Medium",
  "600": "Lexend_600SemiBold",
  "700": "Lexend_700Bold",
  "800": "Lexend_800ExtraBold",
  "900": "Lexend_900Black",
};

export function Text(props) {
  const weight = props.style?.fontWeight || "400";

  return (
    <RNText
      {...props}
      style={[
        {
          fontFamily: fontMap[weight] || fontMap["400"],
        },
        props.style,
      ]}
    />
  );
}
