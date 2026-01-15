import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const logList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(logList);

      if (logList.length > 15) {
        const excess = logList.length - 15;
        const oldestLogs = logList.slice(-excess); 
        oldestLogs.forEach(async (log) => {
          await deleteDoc(doc(db, 'activityLogs', log.id));
        });
      }
    }, (error) => {
      console.log('Error fetching logs:', error);
      Alert.alert('Error', 'Could not load activity logs');
    });

    return () => unsubscribe();
  }, []);

  const renderLog = ({ item }) => (
    <View style={styles.logCard}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.action}>{item.action}</Text>
          {item.actionBy ? <Text style={styles.details}>By: {item.actionBy}</Text> : null}
        </View>
      </View>
      {item.timestamp && (
        <Text style={styles.timestamp}>{item.timestamp.toDate ? item.timestamp.toDate().toLocaleString() : new Date(item.timestamp.seconds * 1000).toLocaleString()}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Activity Logs</Text>

      {logs.length === 0 ? (
        <Text style={styles.noLogs}>No activity yet.</Text>
      ) : (
        <FlatList
          data={logs.slice(0, 15)}
          keyExtractor={(item) => item.id}
          renderItem={renderLog}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}

export const addActivityLog = async (actionBy, action) => {
  try {
    await addDoc(collection(db, 'activityLogs'), {
      actionBy,
      action,
      timestamp: new Date(),
    });

    const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.size > 15) {
      const logsArray = snapshot.docs.reverse();
      const excess = logsArray.length - 15;
      for (let i = 0; i < excess; i++) {
        await deleteDoc(doc(db, 'activityLogs', logsArray[i].id));
      }
    }
  } catch (error) {
    console.log('Error adding activity log:', error);
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#103461' },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 16, color: '#f8f9fa' },
  noLogs: { textAlign: 'center', color: '#999', marginTop: 32, fontSize: 18 },
  logCard: {
    backgroundColor: '#fff',
    padding: 14,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  timestamp: { fontSize: 12, color: '#999', marginTop: 8, fontWeight: '500' },
  action: { fontSize: 18, fontWeight: '700', color: '#103461', marginBottom: 6 },
  details: { fontSize: 14, color: '#555', lineHeight: 20 },
});
