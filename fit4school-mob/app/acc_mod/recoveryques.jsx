import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";

export default function ForgotPasswordScreen() {
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const router = useRouter();

  const questions = [
    { id: 1, label: 'What is your favorite food?' },
    { id: 2, label: 'What is your birth place?' },
    { id: 3, label: 'What is your first dog?' },
  ];

  const handleConfirm = () => {
    if (!selectedQuestion) {
      Alert.alert('Error', 'Please choose one (1) Security Question.');
    } else if (answer.trim() === '') {
      Alert.alert('Error', 'Please provide your answer.');
    } else {
      Alert.alert('Success', 'Your answer has been submitted.');
      router.push('/acc_mod/successreco');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Recovery Question</Text>
      </View>

      {/* Security Questions */}
      {questions.map((q) => {
        const isSelected = selectedQuestion === q.id;

        return (
          <View key={q.id}>
            <TouchableOpacity
              style={[
                styles.questionRow,
                isSelected && styles.selectedRow,
              ]}
              onPress={() => setSelectedQuestion(q.id)}
            >
              <Text
                style={[
                  styles.questionText,
                  isSelected && styles.selectedText,
                ]}
              >
                {q.label}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isSelected ? '#388E3C' : 'black'}
              />
            </TouchableOpacity>

            {/* Show input only for selected question */}
            {isSelected && (
              <TextInput
                style={styles.input}
                placeholder="Type your answer here"
                value={answer}
                onChangeText={setAnswer}
              />
            )}
          </View>
        );
      })}

      {/* Confirm Button */}
      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmText}>SUBMIT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBFB',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 60,
    top: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginLeft: 10,
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  selectedRow: {
    backgroundColor: '#F1FDF3',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  questionText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
    flexWrap: 'wrap',
  },
  selectedText: {
    fontWeight: '600',
    color: '#388E3C',
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    marginTop: 10,
    marginBottom: 15,
  },
  confirmButton: {
    backgroundColor: '#61C35C',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 360,
  },
  confirmText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});