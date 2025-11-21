import {
    View,
    StyleSheet,
    Modal,
    Image
} from "react-native";
import { Text } from "../../components/globalText";

export default function tix_gen({ visible, onClose }) {
    return (

        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >

            <View style={styles.container}>
                <View>
                    <Image source={require('../../assets/images/icons/gen_icons/sucess.png')} 
                        style = {styles.notif_pic}
                    />
                </View>

                <View>
                    <Text style = {styles.notif_txt}>
                        Order received! We’ll confirm once your payment is validated.
                    </Text>
                </View>
            </View>
        </Modal>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: '10%',
        backgroundColor: 'white',
        height: '35%',
        width: '50%',
        justifyContent: 'center',
        alignItems: 'center'
    },

    notif_pic: {
        height: 60,
        width: 60,
    },

    notif_txt: {
        fontSize: 16,
        fontWeight: 400
    }
})