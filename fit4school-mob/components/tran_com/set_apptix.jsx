import {
  View,
  StyleSheet,
  Modal,
} from "react-native";
import { Text } from "../../components/globalText";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function set_apptix({ visible, onClose }) {

  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);


  const onChangeDate = (event, selectedDate) => {
    setShowDate(false);
    if (selectedDate) setDate(selectedDate);
  };

  const onChangeTime = (event, selectedTime) => {
    setShowTime(false);
    if (selectedTime) setDate(selectedTime);
  };

  const formatDate = date.toLocaleDateString();
  const formatTime = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });



  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >

      <View style={styles.container}>
        <View style={styles.dnt_cont}>
          <Text style={{ color: "#61C35C", fontSize: 14, fontWeight: "600", }}>
            Set Date & Time
          </Text>

          <TouchableOpacity onPress={() => setShowDate(true)}>
            <Text style={{ color: "black", fontSize: 14, fontWeight: "400", }}>
              {formatDate}
            </Text>
          </TouchableOpacity>


          <TouchableOpacity onPress={() => setShowTime(true)}>
            <Text style={{ color: "black", fontSize: 14, fontWeight: "400", }}>
              {formatTime}
            </Text>
          </TouchableOpacity>


          {showDate && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onChangeDate}
            />
          )}

          {showTime && (
            <DateTimePicker
              value={date}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onChangeTime}
            />
          )}

        </View>


        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <TouchableOpacity style={styles.plcordr_btn}>
            <Text style={{ fontSize: 20, fontWeight: "600", color: 'white' }}>Set</Text>
          </TouchableOpacity>
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
    height: '40%',
    width: '70%',
  },

  dnt_cont: {
    flexDirection: "row",
    height: '7%',
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#F4F4F4",
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    justifyContent: "space-between",
    alignItems: 'center'
  },

  plcordr_btn: {
    alignItems: "center",
    backgroundColor: "#61C35C",
    padding: "5%",
    width: "10%",
    borderRadius: 5,
    shadowColor: "black",
    elevation: 5,
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 4 },
    alignItems: "center",
    justifyContent: "center",
  },

})