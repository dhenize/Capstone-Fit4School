// components/tran_com/ordr_rec_mes.jsx
import {
    View,
    StyleSheet,
    Modal,
    Image,
    TouchableOpacity
} from "react-native";
import { Text } from "../../components/globalText";

export default function OrderSuccessModal({ visible, onClose }) {
    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Image 
                        source={require('../../assets/images/icons/gen_icons/success.png')} 
                        style={styles.notif_pic}
                    />
                    <Text style={styles.notif_txt}>Order Confirmed</Text>
                    <Text style={styles.subText}>Redirecting to your ticket...</Text>
                    
                    <TouchableOpacity style={styles.okButton} onPress={onClose}>
                        <Text style={styles.okButtonText}>View Ticket Now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: 'white',
        padding: 30,
        borderRadius: 15,
        alignItems: 'center',
        width: '80%',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    notif_pic: {
        height: 80,
        width: 80,
        marginBottom: 15,
    },
    notif_txt: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 5,
        color: '#61C35C',
    },
    subText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    okButton: {
        backgroundColor: '#61C35C',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
    },
    okButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    }
});