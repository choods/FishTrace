import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

export default function ActivityLogTab({ vendorId }) {
  const [activityLog, setActivityLog] = useState([]);

  // Fetch activity log for the vendor in real-time
  useEffect(() => {
    if (!vendorId) return;
    const activityRef = collection(db, 'vendors', vendorId, 'activityLog');

    const q = query(activityRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, snapshot => {
      const logs = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          action: data.action,
          details: data.details,
          timestamp: data.timestamp?.toDate() || new Date(),
        };
      });
      setActivityLog(logs);
    });

    return () => unsubscribe();
  }, [vendorId]);

  {/* Render activity log */}
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Activity Log</Text>

      {activityLog.length === 0 ? (
        <Text style={styles.noLogs}>No activity yet.</Text>
      ) : (
        <FlatList
          data={activityLog.slice(0, 15)}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.logCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.action}>{item.action}</Text>
                  <Text style={styles.details}>{item.details}</Text>
                </View>
              </View>
              <Text style={styles.timestamp}>{item.timestamp.toLocaleString()}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 16, color: '#103461' },
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
  timestamp: { fontSize: 16, color: '#999', marginTop: 8, fontWeight: '500' },
  action: { fontSize: 22, fontWeight: '700', color: '#103461', marginBottom: 6 },
  details: { fontSize: 18, color: '#555', lineHeight: 20 },
});