import React, { useState } from 'react';
import { Button, FlatList, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { signOut, auth } from '@/config/firebase';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState('');

  const addTask = () => {
    if (text.trim().length === 0) return;
    setTasks([...tasks, { id: Date.now().toString(), text, done: false }]);
    setText('');
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleLogout = async () => {
    console.log('Logout button pressed!');
    try {
      console.log('Attempting to sign out...');
      await signOut(auth);
      console.log('Sign out successful');
      // Auth guard will automatically redirect to login
    } catch (error) {
      console.log('Sign out error:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#f7f3ed' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
          🐾 ScottyTasks
        </Text>
        <TouchableOpacity 
          onPress={handleLogout}
          style={{ 
            backgroundColor: '#ff4444', 
            paddingHorizontal: 16, 
            paddingVertical: 10, 
            borderRadius: 6,
            marginTop: 20,
            minHeight: 44,
            minWidth: 80,
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Add a new task..."
        value={text}
        onChangeText={setText}
        style={{
          backgroundColor: 'white',
          padding: 10,
          borderRadius: 10,
          marginBottom: 10
        }}
      />
      <Button title="Add Task" onPress={addTask} />

      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => toggleTask(item.id)}>
            <Text style={{
              fontSize: 18,
              marginTop: 10,
              textDecorationLine: item.done ? 'line-through' : 'none'
            }}>
              {item.text}
            </Text>
          </TouchableOpacity>
        )}
      />

      <View style={{ marginTop: 40, alignItems: 'center' }}>
        <Text style={{ fontSize: 20 }}>
          {tasks.filter(t => t.done).length >= 3
            ? '🐶 Scotty learned a new trick!'
            : '🐕 Complete tasks to train Scotty!'}
        </Text>
      </View>
    </View>
  );
}


/*import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert('Share pressed')}
            />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert('Delete pressed')}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});*/
