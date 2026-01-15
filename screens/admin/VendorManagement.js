import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { collection, doc, deleteDoc, onSnapshot, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Ionicons } from '@expo/vector-icons';
import { addActivityLog } from './ActivityLogs';

export default function VendorManagement({ navigation }) {
  const [vendors, setVendors] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editVendor, setEditVendor] = useState(null);

  useEffect(() => {
    const vendorsRef = collection(db, 'vendors');
    const unsubscribe = onSnapshot(vendorsRef, (snapshot) => {
      const vendorList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVendors(vendorList);
    }, (error) => {
      console.log('Error fetching vendors:', error);
      Alert.alert('Error', 'Could not load vendors');
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (vendorId, vendorName) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete vendor "${vendorName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'vendors', vendorId));
              await addActivityLog('Admin', `Deleted Vendor ${vendorName}`);
            } catch (error) {
              console.log('Error deleting vendor:', error);
              Alert.alert('Error', 'Could not delete vendor');
            }
          },
        },
      ]
    );
  };

  const renderVendor = ({ item }) => (
    <View style={styles.vendorCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.vendorName}>{item.stallName}</Text>
        <Text style={styles.vendorInfo}>Location: {item.location}</Text>
        <Text style={styles.vendorInfo}>Username: {item.username}</Text>
        <Text style={styles.vendorInfo}>Password: {item.password}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setEditVendor(item)}>
          <Ionicons name="pencil-outline" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#e74c3c' }]} onPress={() => handleDelete(item.id, item.stallName)}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vendors</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)} accessibilityLabel="Add vendor">
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addText}>Add Vendor</Text>
        </TouchableOpacity>
      </View>

      <FlatList data={vendors} keyExtractor={(item) => item.id} renderItem={renderVendor} contentContainerStyle={{ padding: 16, paddingBottom: 28 }} />

      <AddVendorModal visible={showAdd} onClose={() => setShowAdd(false)} />
      <EditVendorModal vendor={editVendor} visible={!!editVendor} onClose={() => setEditVendor(null)} />
    </View>
  );
}

// --- Inline Add Vendor Modal ---
function AddVendorModal({ visible, onClose }) {
  const [stallName, setStallName] = useState('');
  const [location, setLocation] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleAddVendor = async () => {
    if (!stallName || !location || !username || !password) {
      return Alert.alert('Missing Fields', 'Please fill all fields');
    }

    try {
      await addDoc(collection(db, 'vendors'), {
        stallName,
        location,
        username,
        password,
      });

      await addActivityLog('Admin', `Added Vendor ${stallName}`);
      Alert.alert('Success', 'Vendor added successfully');
      setStallName('');
      setLocation('');
      setUsername('');
      setPassword('');
      onClose();
    } catch (error) {
      console.log('Error adding vendor:', error);
      Alert.alert('Error', 'Could not add vendor');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <KeyboardAvoidingView style={modalStyles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={modalStyles.title}>Add Vendor</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#103461" />
              </TouchableOpacity>
            </View>
            <TextInput style={modalStyles.input} placeholder="Stall Name" placeholderTextColor="#6b7a90" value={stallName} onChangeText={setStallName} />
            <TextInput style={modalStyles.input} placeholder="Location" placeholderTextColor="#6b7a90" value={location} onChangeText={setLocation} />
            <TextInput style={modalStyles.input} placeholder="Username" placeholderTextColor="#6b7a90" value={username} onChangeText={setUsername} />
            <TextInput style={modalStyles.input} placeholder="Password" placeholderTextColor="#6b7a90" secureTextEntry value={password} onChangeText={setPassword} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 8 }}>
              <TouchableOpacity style={[modalStyles.btn, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0' }]} onPress={onClose}>
                <Text style={{ color: '#103461', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[modalStyles.btn, { backgroundColor: '#103461' }]} onPress={handleAddVendor}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// --- Inline Edit Vendor Modal ---
function EditVendorModal({ vendor, visible, onClose }) {
  const [stallName, setStallName] = useState('');
  const [location, setLocation] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (vendor) {
      setStallName(vendor.stallName || '');
      setLocation(vendor.location || '');
      setUsername(vendor.username || '');
      setPassword(vendor.password || '');
    }
  }, [vendor]);

  const handleUpdateVendor = async () => {
    if (!stallName || !location || !username || !password) {
      return Alert.alert('Missing Fields', 'Please fill all fields');
    }

    try {
      await updateDoc(doc(db, 'vendors', vendor.id), {
        stallName,
        location,
        username,
        password,
      });

      await addActivityLog('Admin', `Updated Vendor ${stallName}`);
      Alert.alert('Success', 'Vendor updated successfully');
      onClose();
    } catch (error) {
      console.log('Error updating vendor:', error);
      Alert.alert('Error', 'Could not update vendor');
    }
  };

  if (!vendor) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <KeyboardAvoidingView style={modalStyles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={modalStyles.title}>Edit Vendor</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#103461" />
              </TouchableOpacity>
            </View>
            <TextInput style={modalStyles.input} placeholder="Stall Name" placeholderTextColor="#6b7a90" value={stallName} onChangeText={setStallName} />
            <TextInput style={modalStyles.input} placeholder="Location" placeholderTextColor="#6b7a90" value={location} onChangeText={setLocation} />
            <TextInput style={modalStyles.input} placeholder="Username" placeholderTextColor="#6b7a90" value={username} onChangeText={setUsername} />
            <TextInput style={modalStyles.input} placeholder="Password" placeholderTextColor="#6b7a90" secureTextEntry value={password} onChangeText={setPassword} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 8 }}>
              <TouchableOpacity style={[modalStyles.btn, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0' }]} onPress={onClose}>
                <Text style={{ color: '#103461', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[modalStyles.btn, { backgroundColor: '#103461' }]} onPress={handleUpdateVendor}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: { width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#103461' },
  input: { backgroundColor: '#eef2f6', color: '#103461', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16 },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#103461' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', elevation: 2, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  title: { color: '#103461', fontSize: 20, fontWeight: '700' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#103461', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  addText: { color: '#fff', fontWeight: '700', fontSize: 14, marginLeft: 8 },
  vendorCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, flexDirection: 'row', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  vendorName: { fontSize: 18, fontWeight: '700', color: '#103461' },
  vendorInfo: { fontSize: 14, color: '#555', marginTop: 6 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { backgroundColor: '#103461', padding: 10, borderRadius: 10, marginLeft: 8, alignItems: 'center', justifyContent: 'center' },
  actionBtnDelete: { backgroundColor: '#e74c3c' },
});