import { View, StyleSheet } from "react-native";
import { Slot } from "expo-router";
import Footer from "../../components/dash_com/footer";

export default function DashboardLayout() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Slot /> 
      </View>
      <Footer /> 
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", position: "relative" },
  content: { flex: 1, paddingBottom: 120 }, // space for footer
});
