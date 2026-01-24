import React, { useState, useEffect } from 'react';
import { Button, FlatList, Text, TouchableOpacity, View, Alert, Modal, Platform, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker'; 
import { auth, database, signOut } from '@/config/firebase';
import { Image as ExpoImage } from 'expo-image';
import { 
  ref, 
  push, 
  set, 
  remove, 
  onValue, 
  query, 
  orderByChild, 
  equalTo, 
  update 
} from 'firebase/database'; // Import functions directly from the libraryimport { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

const formatDate = (date) => date.toISOString().split('T')[0];
const formatTime = (date) => date.toTimeString().split(' ')[0].substring(0, 5);

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState('');
  const [user, setUser] = useState(null);
  
  // Modal & Edit State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null); // null = adding, id = editing
  const [taskText, setTaskText] = useState('');
  const [dateValue, setDateValue] = useState(new Date()); 
  const [timeValue, setTimeValue] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    let tasksUnsubscribe = null;
    const authUnsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (tasksUnsubscribe) tasksUnsubscribe();
      
      if (currentUser) {
        const tasksRef = ref(database, 'tasks');
        const userTasksQuery = query(tasksRef, orderByChild('userId'), equalTo(currentUser.uid));
        tasksUnsubscribe = onValue(userTasksQuery, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const userTasks = Object.entries(data).map(([id, task]) => ({ id, ...task }));
            setTasks(userTasks);
          } else {
            setTasks([]);
          }
        });
      }
    });
    return () => {
      authUnsubscribe();
      if (tasksUnsubscribe) tasksUnsubscribe();
    };
  }, []);

  // OPEN MODAL FOR ADDING
  const openAddTaskModal = () => {
    setSelectedTaskId(null);
    setTaskText(text); 
    setDateValue(new Date()); 
    setTimeValue(new Date());
    setIsModalVisible(true);
    setText('');
  };

  // OPEN MODAL FOR EDITING
  const openEditTaskModal = (task) => {
    setSelectedTaskId(task.id);
    setTaskText(task.text);
    // Convert stored strings back to Date objects for the picker
    setDateValue(new Date(task.dueDate || new Date()));
    // For time, we just use a current date base with the stored HH:mm
    const [hours, minutes] = (task.dueTime || "00:00").split(':');
    const t = new Date();
    t.setHours(parseInt(hours), parseInt(minutes));
    setTimeValue(t);
    setIsModalVisible(true);
  };

  const handleSaveTask = async () => {
    if (taskText.trim().length === 0 || !user) {
      Alert.alert('Error', 'Task description cannot be empty.');
      return;
    }

    const taskData = {
      text: taskText.trim(),
      userId: user.uid,
      dueDate: formatDate(dateValue),
      dueTime: formatTime(timeValue),
      updatedAt: Date.now()
    };

    try {
      if (selectedTaskId) {
        // UPDATE EXISTING
        const taskRef = ref(database, `tasks/${selectedTaskId}`);
        await update(taskRef, taskData);
      } else {
        // CREATE NEW
        const tasksRef = ref(database, 'tasks');
        await push(tasksRef, { ...taskData, done: false, createdAt: Date.now() });
      }
      closeModal();
    } catch (error) {
      Alert.alert('Error', 'Failed to save task');
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTaskId) return;
    Alert.alert("Delete Task", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await remove(ref(database, `tasks/${selectedTaskId}`));
            closeModal();
          } catch (error) {
            Alert.alert("Error", "Could not delete");
          }
      }}
    ]);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedTaskId(null);
    setTaskText('');
  };

  const toggleDone = async (task) => {
    const taskRef = ref(database, `tasks/${task.id}`);
    await update(taskRef, { done: !task.done });
  };

  // ... Date/Time Change handlers remain the same ...
  const onChangeDate = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDateValue(selectedDate);
  };

  const onChangeTime = (event, selectedTime) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (selectedTime) setTimeValue(selectedTime);
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 10, backgroundColor: '#f7f3ed' }}>
      {/* HEADER SECTION (Same as yours) */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <ExpoImage source={require('@/assets/images/Scotty.png')} style={{ width: 50, height: 50 }} />
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>ScottyTasks</Text>
        <TouchableOpacity onPress={() => signOut(auth)} style={{ backgroundColor: '#ff4444', padding: 10, borderRadius: 6 }}>
          <Text style={{ color: 'white' }}>Logout</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Quick add or tap 'Add'..."
        value={text}
        onChangeText={setText}
        style={{ backgroundColor: 'white', padding: 10, borderRadius: 10, marginBottom: 10 }}
      />
      <Button title="Add Task" onPress={openAddTaskModal} />

      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ 
            marginTop: 10, 
            padding: 15, 
            backgroundColor: 'white', 
            borderRadius: 12, 
            flexDirection: 'row', 
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            elevation: 3
          }}>
            <TouchableOpacity onPress={() => toggleDone(item)} style={{ marginRight: 15 }}>
               <Text style={{ fontSize: 20 }}>{item.done ? '✅' : '⬜'}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={{ flex: 1 }} 
                onPress={() => openEditTaskModal(item)}
            >
                <Text style={{ fontSize: 16, fontWeight: '500', textDecorationLine: item.done ? 'line-through' : 'none' }}>
                    {item.text}
                </Text>
                <Text style={{ fontSize: 12, color: '#888' }}>{item.dueDate} @ {item.dueTime}</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* --- MODAL (Dual Purpose: Add/Edit) --- */}
      <Modal animationType="fade" transparent={true} visible={isModalVisible}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View style={{ width: '85%', backgroundColor: 'white', padding: 25, borderRadius: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}>
                {selectedTaskId ? 'Edit Task' : 'New Task'}
            </Text>

            <TextInput
              placeholder="What needs to be done?"
              value={taskText}
              onChangeText={setTaskText}
              style={{ backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, marginBottom: 20 }}
            />
            
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ marginBottom: 10, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
                <Text>📅 {formatDate(dateValue)}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={{ marginBottom: 20, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
                <Text>⏰ {formatTime(timeValue)}</Text>
            </TouchableOpacity>

            {/* Pickers (Hidden until clicked on Android, Always visible on iOS) */}
            {(showDatePicker || Platform.OS === 'ios') && (
              <DateTimePicker value={dateValue} mode="date" display="calendar" onChange={onChangeDate} />
            )}
            {(showTimePicker || Platform.OS === 'ios') && (
              <DateTimePicker value={timeValue} mode="time" is24Hour={true} onChange={onChangeTime} />
            )}

            <Button title={selectedTaskId ? "Update Task" : "Save Task"} onPress={handleSaveTask} />
            
            {selectedTaskId && (
               <TouchableOpacity onPress={handleDeleteTask} style={{ marginTop: 15 }}>
                 <Text style={{ color: 'red', textAlign: 'center', fontWeight: 'bold' }}>Delete Task</Text>
               </TouchableOpacity>
            )}

            <TouchableOpacity onPress={closeModal} style={{ marginTop: 20 }}>
              <Text style={{ color: '#666', textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}