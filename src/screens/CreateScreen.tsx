import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const CreateScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>创建内容</Text>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>点击创建</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    color: '#333',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#1890ff',
    padding: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default CreateScreen; 