import {
    View,
    StyleSheet,
    Modal,
    Image
} from "react-native";
import { Text } from "../../components/globalText";

export default function dl_mes({ visible, onClose }) {
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
                    <Text style = {styles.notif_txt}>Download Success!</Text>
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
        height: '30%',
        width: '40%',
        justifyContent: 'center',
        alignItems: 'center'
    },

    notif_pic: {
        height: 60,
        width: 60,
    },

    notif_txt: {
        fontSize: 16,
        fontWeight: 600
    }
})