import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, 
  TextInput, Modal, ScrollView, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  doc, getDoc, setDoc, collection, onSnapshot, deleteDoc, getDocs 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { addActivityLog } from '../admin/ActivityLogs';

export default function AdminFishManager() {
  const [disabledFish, setDisabledFish] = useState([]);
  const [fishCatalog, setFishCatalog] = useState([]);
  const [fishStatus, setFishStatus] = useState({});
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newFishName, setNewFishName] = useState('');
  const [editFishName, setEditFishName] = useState('');
  const [editFishId, setEditFishId] = useState('');

  // Fetch fish catalog
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'fishCatalog'), (snapshot) => {
      const fishArray = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFishCatalog(fishArray);
    });
    return () => unsubscribe();
  }, []);

  // Fetch disabled fish list
  useEffect(() => {
    const docRef = doc(db, 'settings', 'fishStatus');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setDisabledFish(docSnap.data().disabledFish || []);
      } else {
        setDisabledFish([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Update fish status (Available if any online vendor has quantity > 1)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const vendorsSnapshot = await getDocs(collection(db, 'vendors'));
        const now = new Date();
        const statusMap = {};

        // Initialize all fish as 'No Stock'
        fishCatalog.forEach(fish => {
          statusMap[fish.name] = 'No Stock';
        });

        vendorsSnapshot.forEach(vendorDoc => {
          const vendorData = vendorDoc.data();
          const lastSeen = vendorData.lastSeen?.toDate?.();
          // Consider vendor online if lastSeen is within the last 60 seconds
          const offline = !lastSeen || (now - lastSeen) / 1000 > 5; 

          if (!offline && vendorData.fishList?.length) {
            vendorData.fishList.forEach(f => {
              // Treat any positive quantity as Available (was >1 previously)
              if (f.quantity > 0) {
                statusMap[f.name] = 'Available';
              }
            });
          }
        });

        setFishStatus(statusMap);
      } catch (err) {
        console.error('Error fetching vendors for status:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [fishCatalog]);

  // Add new fish
  const handleAddFish = async () => {
    const fishId = newFishName.trim();
    if (!fishId) return;

    if (fishCatalog.some(f => f.name.toLowerCase() === fishId.toLowerCase())) {
      alert(`"${fishId}" already exists.`);
      return;
    }

    try {
      await setDoc(doc(db, 'fishCatalog', fishId), { name: fishId, image: '' });
      await addActivityLog("Admin", `Added fish "${fishId}"`);
      setNewFishName('');
      setAddModalVisible(false);
      alert(`"${fishId}" has been added.`);
    } catch (error) {
      console.error("Error adding fish:", error);
      alert("Failed to add fish. Please try again.");
    }
  };

  // Delete fish
  const handleDeleteFish = async (fishId) => {
    Alert.alert(
      "Delete Fish",
      `Are you sure you want to delete "${fishId}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'fishCatalog', fishId));
              await addActivityLog("Admin", `Deleted fish "${fishId}"`);
              alert(`"${fishId}" has been deleted.`);
            } catch (error) {
              console.error("Error deleting fish:", error);
              alert("Failed to delete fish. Please try again.");
            }
          }
        }
      ]
    );
  };

  // Edit fish name
  const handleEditFish = async () => {
    if (!editFishName.trim()) return;
    const oldDocRef = doc(db, 'fishCatalog', editFishId);
    const newDocRef = doc(db, 'fishCatalog', editFishName.trim());

    try {
      const oldSnap = await getDoc(oldDocRef);
      if (oldSnap.exists()) { 
        const oldData = oldSnap.data();
        await setDoc(newDocRef, { ...oldData, name: editFishName.trim() });
        await deleteDoc(oldDocRef);
        await addActivityLog("Admin", `Renamed fish "${editFishId}" to "${editFishName.trim()}"`);
      }
      setEditFishName('');
      setEditFishId('');
      setEditModalVisible(false);
      alert('Fish name updated successfully.');
    } catch (error) {
      console.error("Error editing fish:", error);
      alert("Failed to edit fish. Please try again.");
    }
  };

  // Disable fish
  const handleDisableFish = async (fishName) => {
    const docRef = doc(db, 'settings', 'fishStatus');
    const newList = [...disabledFish, fishName];
    await setDoc(docRef, { disabledFish: newList }, { merge: true });
    await addActivityLog("Admin", `Disabled fish "${fishName}"`);
  };

  // Enable fish
  const handleEnableFish = async (fishName) => {
    const docRef = doc(db, 'settings', 'fishStatus');
    const newList = disabledFish.filter(f => f !== fishName);
    await setDoc(docRef, { disabledFish: newList }, { merge: true });
    await addActivityLog("Admin", `Enabled fish "${fishName}"`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fish Catalog</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Fish</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={fishCatalog}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.fishCard}>
            <View style={styles.fishCardContent}>
              <Text style={styles.fishCardName}>{item.name}</Text>
              <View style={styles.fishCardRow}>
                <View style={[styles.statusBadge, { backgroundColor: fishStatus[item.name] === 'Available' ? '#e8f5e9' : '#ffebee' }]}>
                  <Text style={[styles.statusText, { color: fishStatus[item.name] === 'Available' ? '#28a745' : '#e74c3c' }]}>
                    {fishStatus[item.name] || 'No Stock'}
                  </Text>
                </View>
                {disabledFish.includes(item.name) && (
                  <View style={styles.disabledBadge}>
                    <Text style={styles.disabledText}>Disabled</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.fishCardActions}>
              {disabledFish.includes(item.name) ? (
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => handleEnableFish(item.name)}
                >
                  <Ionicons name="eye" size={20} color="#28a745" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => handleDisableFish(item.name)}
                >
                  <Ionicons name="eye-off" size={20} color="#999" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => {
                  setEditFishId(item.id);
                  setEditFishName(item.name);
                  setEditModalVisible(true);
                }}
              >
                <Ionicons name="pencil" size={20} color="#103461" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => handleDeleteFish(item.id)}
              >
                <Ionicons name="trash" size={20} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={addModalVisible} transparent animationType="none">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Fish</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={24} color="#103461" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                placeholder="Fish name"
                placeholderTextColor="#999"
                value={newFishName}
                onChangeText={setNewFishName}
                style={styles.input}
              />
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddFish}>
                <Ionicons name="add-circle" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={editModalVisible} transparent animationType="none">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Fish Name</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#103461" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                placeholder="Fish name"
                placeholderTextColor="#999"
                value={editFishName}
                onChangeText={setEditFishName}
                style={styles.input}
              />
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleEditFish}>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#103461',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#103461',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#103461',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    marginLeft: 6,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 12,
    paddingBottom: 20,
  },
  fishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  fishCardContent: {
    flex: 1,
  },
  fishCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#103461',
    marginBottom: 8,
  },
  fishCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  disabledBadge: {
    backgroundColor: '#ffe6e6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  disabledText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e74c3c',
  },
  fishCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    maxHeight: '80%',
    marginBottom: 275,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#103461',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#103461',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

