import React, { useState, useEffect } from 'react';
import { Button, FlatList, Text, TouchableOpacity, View, Alert, Modal, Platform, TextInput } from 'react-native';
//  Import the Date/Time Picker
import DateTimePicker from '@react-native-community/datetimepicker'; 
import { signOut, auth, database, ref, push, set, remove, onValue, off, query, orderByChild, equalTo } from '@/config/firebase';
import {Image} from 'expo-image';
import {SafeAreaView} from 'react-native-safe-area-context';

// Helper function to format date/time for display and storage
const formatDate = (date) => date.toISOString().split('T')[0]; // YYYY-MM-DD
const formatTime = (date) => date.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState('');
  const [user, setUser] = useState(null);
  
  // New state for the modal and task details
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [taskText, setTaskText] = useState('');
  
  // UPDATED: Use Date objects for picker state
  const [dateValue, setDateValue] = useState(new Date()); 
  const [timeValue, setTimeValue] = useState(new Date());
  
  // State to control picker visibility (needed for Android)
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Listen for auth changes and load tasks (Keep existing logic)
  useEffect(() => {
    // ... existing useEffect logic ...
    let tasksUnsubscribe = null;
    
    const authUnsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      
      if (tasksUnsubscribe) {
        tasksUnsubscribe();
        tasksUnsubscribe = null;
      }
      
      if (currentUser) {
        const tasksRef = ref(database, 'tasks');
        const userTasksQuery = query(tasksRef, orderByChild('userId'), equalTo(currentUser.uid));
        
        tasksUnsubscribe = onValue(userTasksQuery, (snapshot) => {
          try {
            const data = snapshot.val();
            if (data) {
              const userTasks = Object.entries(data)
                .map(([id, task]) => ({ id, ...task }));
              setTasks(userTasks);
            } else {
              setTasks([]);
            }
          } catch (error) {
            console.log('Error processing tasks:', error);
            setTasks([]);
          }
        }, (error) => {
          console.log('Database error:', error);
          Alert.alert('Database Error', 'Failed to load tasks');
        });
      } else {
        setTasks([]);
      }
    });

    return () => {
      authUnsubscribe();
      if (tasksUnsubscribe) {
        tasksUnsubscribe();
      }
    };
  }, []);

  const handleAddTask = async () => {
    if (taskText.trim().length === 0 || !user) {
      Alert.alert('Error', 'Task description cannot be empty.');
      return;
    }
    
    // Store the formatted strings in Firebase
    const taskDueDate = formatDate(dateValue);
    const taskDueTime = formatTime(timeValue);
    
    try {
      const tasksRef = ref(database, 'tasks');
      const taskData = {
        text: taskText.trim(),
        done: false,
        userId: user.uid,
        createdAt: Date.now(),
        // Store the formatted date/time strings
        dueDate: taskDueDate,
        dueTime: taskDueTime
      };
      
      await push(tasksRef, taskData);
      console.log('Task added');
      
      // Reset state and close modal
      setTaskText('');
      // Reset date/time pickers to current time for next use
      setDateValue(new Date()); 
      setTimeValue(new Date()); 
      setIsModalVisible(false);

    } catch (error) {
      console.log('Add task error:', error.message);
      Alert.alert('Error', 'Failed to add task');
    }
  };

  const openAddTaskModal = () => {
      setTaskText(text); 
      // Reset picker dates to current date/time when opening modal
      setDateValue(new Date()); 
      setTimeValue(new Date());
      setIsModalVisible(true);
      setText('');
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || dateValue;
    // For Android, we need to hide the picker manually
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    setDateValue(currentDate);
  };

  const onChangeTime = (event, selectedTime) => {
    const currentTime = selectedTime || timeValue;
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    setTimeValue(currentTime);
  };


  // --- Logout and Toggle Task functions remain the same ---

  const toggleTask = async (taskId) => {
    // ... existing toggleTask logic ...
    if (!user) return;
    
    try {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const taskRef = ref(database, `tasks/${taskId}`);
        await set(taskRef, {
          ...task,
          done: !task.done
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleLogout = async () => {
    // ... existing handleLogout logic ...
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };
  
  // --- END of unchanged functions ---


  return (
    <SafeAreaView style={{ flex: 1, padding: 10, backgroundColor: '#f7f3ed' }}>
      
      {/* --- HEADER --- */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Image
          source={require('@/assets/images/Scotty.png')}
          style={{ width: 50, height: 50 }}
        />
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
          ScottyTasks
        </Text>
        <TouchableOpacity 
          onPress={handleLogout}
          style={{ 
            backgroundColor: '#ff4444', 
            paddingHorizontal: 16, 
            paddingVertical: 10, 
            borderRadius: 6,
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
        placeholder="Enter task text and press 'Add Task' for details..."
        value={text}
        onChangeText={setText}
        style={{
          backgroundColor: 'white',
          padding: 10,
          borderRadius: 10,
          marginBottom: 10
        }}
      />
      <Button title="Add Task" onPress={openAddTaskModal} />

      {/* --- TASK LIST --- */}
      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => toggleTask(item.id)}>
            <View style={{ marginTop: 10, padding: 10, backgroundColor: 'white', borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <Text style={{
                    fontSize: 18,
                    flex: 1,
                    textDecorationLine: item.done ? 'line-through' : 'none'
                }}>
                    {item.text}
                </Text>
                {(item.dueDate || item.dueTime) && (
                    <Text style={{ fontSize: 12, color: '#666', marginLeft: 10 }}>
                        {item.dueDate} {item.dueTime}
                    </Text>
                )}
            </View>
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
      
      {/* --- ADD TASK MODAL (Updated for Pickers) --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={{
          position: 'absolute', // Fixed styling from previous step
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          justifyContent: 'center', 
          alignItems: 'center', 
          backgroundColor: 'rgba(0,0,0,0.5)' 
        }}>
          <View style={{ 
            width: '90%', 
            backgroundColor: 'white', 
            padding: 20, 
            borderRadius: 10, 
            elevation: 10 
          }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>
              Add Task Details
            </Text>

            <TextInput
              placeholder="Task Description"
              value={taskText}
              onChangeText={setTaskText}
              style={{
                backgroundColor: '#eee',
                padding: 10,
                borderRadius: 5,
                marginBottom: 20
              }}
            />
            
            {/* DATE PICKER SECTION */}
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ marginBottom: 10, padding: 10, backgroundColor: '#eee', borderRadius: 5 }}>
                <Text style={{ color: '#333' }}>
                    Due Date: **{formatDate(dateValue)}**
                </Text>
            </TouchableOpacity>

            {/* Render picker for iOS or when explicitly requested on Android */}
            {(showDatePicker || Platform.OS === 'ios') && (
              <DateTimePicker
                testID="datePicker"
                value={dateValue}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onChangeDate}
              />
            )}
            
            {/* 👇 TIME PICKER SECTION */}
            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={{ marginBottom: 20, padding: 10, backgroundColor: '#eee', borderRadius: 5 }}>
                <Text style={{ color: '#333' }}>
                    Due Time: **{formatTime(timeValue)}**
                </Text>
            </TouchableOpacity>

            {(showTimePicker || Platform.OS === 'ios') && (
              <DateTimePicker
                testID="timePicker"
                value={timeValue}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onChangeTime}
              />
            )}

            <Button title="Save Task" onPress={handleAddTask} />
            
            <TouchableOpacity 
              onPress={() => setIsModalVisible(false)}
              style={{ marginTop: 10 }}
            >
              <Text style={{ color: '#ff4444', textAlign: 'center', padding: 5 }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}