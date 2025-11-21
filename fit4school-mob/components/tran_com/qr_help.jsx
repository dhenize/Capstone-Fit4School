// components/tran_com/qr_help.jsx

import React from "react";
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../components/globalText";

export default function qr_help({ visible, onClose }) {
    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <TouchableOpacity onPress={onClose} style={styles.close}>
                        <Ionicons name="close-outline" size={30} color="rgb(44,44,44)" />
                    </TouchableOpacity>

                    <ScrollView style={styles.scrollarea}>
                        <Text style={styles.desc}>
                            1. Tap 
                            <Text style = {{fontWeight: '600', fontSize: 14}}> "Download" </Text>
                            to save the QR Code to your phone.
                            {'\n'}
                            2. Open your QR Scanner App.
                            {'\n'}
                            3. Tap the Gallery icon to open your Gallery App.
                            {'\n'}
                            4. Select the image containing the QR Code.
                            {'\n'}
                            5. Now, confirm by tapping "Ok" or ✔(check icon). This depends on your app's version.
                            {'\n'}
                            6. You will be redirected to your payment app (e.g. GCash, Maya, Online Bank App, etc.)
                            {'\n'}
                            7. Follow your banking or online payment app's instruction and enter the exact amount to complete your payment.
                            {'\n'}
                            8. Screenshot or download the e-receipt, then upload it here for payment validation.
                        </Text>
                    </ScrollView>
                </View>
            </View>

        </Modal>
    );
}

const styles = StyleSheet.create({

    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        alignItems: "center",
    },

    container: {
        marginTop: '15%',
        backgroundColor: 'white',
        padding: '8%',
        height: 450,
        width: 350,
        borderRadius: 10
    },

    title: {
        fontWeight: '700',
        fontSize: 20,
        marginBottom: '8%',
    },

    desc: {
        fontSize: 14,
        marginBottom: "12%",
        fontWeight: '400',
        textAlign: "justify",
        rowGap: 5
    },

    close: {
        alignSelf: 'flex-end',
        marginBottom: '5%'
    }
});
