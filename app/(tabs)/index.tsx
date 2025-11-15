import React from 'react';
import { View, Text, Image, Button } from 'react-native';
import { StyleSheet } from 'react-native';

export default function ScottyScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/scottydog.jpg')} // make sure your image exists
        style={styles.image}
      />
      <Text style={styles.title}>🐶 Scotty the Dog</Text>
      <Text style={styles.subtitle}>
        Scotty is proud of you for completing your tasks!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f7f3ed',
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});
