import React, { useState, useEffect } from 'react';
import { 
  Button, 
  FlatList, 
  Text, 
  TouchableOpacity, 
  View, 
  Alert, 
  Modal, 
  Platform, 
  TextInput, 
  StyleSheet 
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'; 
import { StatusBar } from 'expo-status-bar';
import type { User } from 'firebase/auth';
import { auth, database, signOut } from '@/config/firebase';
import { Image as ExpoImage } from 'expo-image';
import { 
  ref, 
  push, 
  remove, 
  onValue, 
  query, 
  orderByChild, 
  equalTo, 
  update 
} from 'firebase/database';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserShopProfile } from '@/hooks/useUserShopProfile';

type Task = {
  id: string;
  text: string;
  userId: string;
  dueDate: string;
  dueTime: string;
  done: boolean;
  rewardClaimed?: boolean; // Tracks if they already earned a coin for this
  createdAt?: number;
  updatedAt?: number;
};

const formatDate = (date: Date) => date.toISOString().split('T')[0];
const formatTime = (date: Date) => date.toTimeString().split(' ')[0].substring(0, 5);

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [text, setText] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const { addCoins } = useUserShopProfile(); // Hook up our new function
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskText, setTaskText] = useState('');
  const [dateValue, setDateValue] = useState(new Date()); 
  const [timeValue, setTimeValue] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    let tasksUnsubscribe: null | (() => void) = null;
    const authUnsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (tasksUnsubscribe) tasksUnsubscribe();
      
      if (currentUser) {
        const tasksRef = ref(database, 'tasks');
        const userTasksQuery = query(tasksRef, orderByChild('userId'), equalTo(currentUser.uid));
        tasksUnsubscribe = onValue(userTasksQuery, (snapshot) => {
          const data = snapshot.val() as Record<string, Omit<Task, 'id'>> | null;
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

  const openAddTaskModal = () => {
    setSelectedTaskId(null);
    setTaskText(text); 
    setDateValue(new Date()); 
    setTimeValue(new Date());
    setIsModalVisible(true);
    setText('');
  };

  const openEditTaskModal = (task: Task) => {
    setSelectedTaskId(task.id);
    setTaskText(task.text);
    setDateValue(new Date(task.dueDate || new Date()));
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
        const taskRef = ref(database, `tasks/${selectedTaskId}`);
        await update(taskRef, taskData);
      } else {
        const tasksRef = ref(database, 'tasks');
        // Give brand new tasks a default rewardClaimed value of false
        await push(tasksRef, { ...taskData, done: false, rewardClaimed: false, createdAt: Date.now() });
      }
      closeModal();
    } catch {
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
          } catch {
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

  const toggleDone = async (task: Task) => {
    const taskRef = ref(database, `tasks/${task.id}`);
    const updates: Partial<Task> = { done: !task.done };

    // If the task is being checked off (was false) AND the reward hasn't been claimed yet
    if (!task.done && !task.rewardClaimed) {
      updates.rewardClaimed = true; // Mark reward as claimed in database
      await addCoins(1); // Give the user 1 coin
    }

    await update(taskRef, updates);
  };

  const onChangeDate = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDateValue(selectedDate);
  };

  const onChangeTime = (_event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (selectedTime) setTimeValue(selectedTime);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f3ed' }} edges={["top"]}>
      <StatusBar hidden />
      <View style={{ flex: 1, padding: 10 }}>
        <View style={styles.headerRow}>
          <ExpoImage source={require('@/assets/images/Scotty.png')} style={{ width: 50, height: 50 }} />
          <Text style={{ fontSize: 24, fontWeight: 'bold' }}>ScottyTasks</Text>
          <TouchableOpacity onPress={() => signOut(auth)} style={styles.logoutBtn}>
            <Text style={{ color: 'white' }}>Logout</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          placeholder="Quick add or tap 'Add'..."
          value={text}
          onChangeText={setText}
          style={styles.quickInput}
        />
        <Button title="Add Task" onPress={openAddTaskModal} color="#C41230" />

        <FlatList
          data={tasks}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.taskCard}>
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
          contentContainerStyle={{ paddingBottom: 100 }}
        />

        <Modal animationType="fade" transparent={true} visible={isModalVisible}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                  {selectedTaskId ? 'Edit Task' : 'New Task'}
              </Text>

              <TextInput
                placeholder="What needs to be done?"
                value={taskText}
                onChangeText={setTaskText}
                style={styles.modalInput}
              />
              
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.pickerBtn}>
                  <Text>📅 {formatDate(dateValue)}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.pickerBtn}>
                  <Text>⏰ {formatTime(timeValue)}</Text>
              </TouchableOpacity>

              {(showDatePicker || Platform.OS === 'ios') && (
                <DateTimePicker value={dateValue} mode="date" display="calendar" onChange={onChangeDate} />
              )}
              {(showTimePicker || Platform.OS === 'ios') && (
                <DateTimePicker value={timeValue} mode="time" is24Hour={true} onChange={onChangeTime} />
              )}

              <Button title={selectedTaskId ? "Update Task" : "Save Task"} onPress={handleSaveTask} color="#C41230" />
              
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  logoutBtn: { backgroundColor: '#ff4444', padding: 10, borderRadius: 6 },
  quickInput: { backgroundColor: 'white', padding: 10, borderRadius: 10, marginBottom: 10 },
  taskCard: {
    marginTop: 10,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
  },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { width: '85%', backgroundColor: 'white', padding: 25, borderRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  modalInput: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, marginBottom: 20 },
  pickerBtn: { marginBottom: 10, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 8 },
});