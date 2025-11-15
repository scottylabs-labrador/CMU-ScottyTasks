import React, { useState } from 'react';
import { Button, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function App() {
  type Task = {
  id: string;
  text: string;
  done: boolean;
};

  const [tasks, setTasks] = useState<Task[]>([]);
  const [text, setText] = useState('');

  const addTask = () => {
    if (text.trim().length === 0) return;
    setTasks([...tasks, { id: Date.now().toString(), text, done: false }]);
    setText('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#f7f3ed' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>
        🐾 ScottyTasks
      </Text>

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
