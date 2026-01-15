import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot, updateDoc, collection, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { addVendorActivityLog } from '../../helpers/vendorActivityLog';

function EditFishModal({ visible, onClose, fish, vendorId }) {
  const [price, setPrice] = useState(fish?.price?.toString() || '');

  useEffect(() => {
    setPrice(fish?.price?.toString() || '');
  }, [fish, visible]);

  const handleSave = async () => {
    if (!vendorId || !fish) return;

    try {
      const vendorRef = doc(db, 'vendors', vendorId);
      const vendorSnap = await getDoc(vendorRef);

      if (vendorSnap.exists()) {
        const vendorData = vendorSnap.data();
        const fishList = vendorData.fishList || [];

        const updatedFishList = fishList.map((f) =>
          f.name === fish.name ? { ...f, price: parseFloat(price) } : f
        );

        await updateDoc(vendorRef, { fishList: updatedFishList });
        await addVendorActivityLog(
          vendorId,
          'Edit Fish Price',
          `Updated ${fish.name} price to ₱${price}`
        );
      }

      onClose();
    } catch (err) {
      console.error('Error updating fish price:', err);
      Alert.alert('Error', 'Failed to update price.');
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Price for {fish?.name}</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="Enter new price"
            keyboardType="numeric"
          />
          <View style={styles.buttonsRow}>
            <TouchableOpacity onPress={onClose} style={[styles.modalButton, { backgroundColor: '#888' }]}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={[styles.modalButton, { backgroundColor: '#103461' }]}>
              <Text style={styles.modalButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function StallTab({ vendorId }) {
  const [fishList, setFishList] = useState([]);
  const [selectedFish, setSelectedFish] = useState(null);
  const [editVisible, setEditVisible] = useState(false);
  const [addVisible, setAddVisible] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionStart, setSessionStart] = useState(null);

  const vendorRef = doc(db, 'vendors', vendorId);

  // Catalog items that are not yet in vendor's fishList
  const availableCatalog = catalog.filter((catItem) => !fishList.some((f) => f.id === catItem.id));

  // Listen for vendor fishList and session state
  useEffect(() => {
    if (!vendorId) return;
    const interval = setInterval(async () => {
      const now = new Date();
      const snapshot = await getDoc(vendorRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        const lastSeen = data.lastSeen?.toDate?.();
        const offline = !lastSeen || (now - lastSeen) / 1000 > 5; // offline if lastSeen > 10s

        const updatedFishList = (data.fishList || []).map(fish => ({
          ...fish,
          quantity: offline ? 0 : (fish.quantity ?? 0),
          status: offline ? 'No Stock' : (fish.quantity > 0 ? 'Available' : 'No Stock'),
        }));

        setFishList(updatedFishList);
        setSessionActive(!!data.session?.active);
        setSessionStart(data.session?.start || null);
      } else {
        setFishList([]);
        setSessionActive(false);
        setSessionStart(null);
      }
    }, 5000); // refresh every 5 seconds

    return () => clearInterval(interval);
  }, [vendorId]);

  // Load fishCatalog for Add Fish modal
  const loadCatalog = async () => {
    const snapshot = await getDocs(collection(db, 'fishCatalog'));
    const fishes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setCatalog(fishes);
  };

  const openAddModal = async () => {
    await loadCatalog();
    setAddVisible(true);
  };

  const handleAddFish = async (fish) => {
    try {
      const updatedList = [
        ...fishList,
        {
          id: fish.id,
          name: fish.name,
          quantity: null, // Pi updates this
          price: 0,
          status: 'No Stock',
        },
      ];
      await updateDoc(vendorRef, { fishList: updatedList });
      setFishList(updatedList);
      await addVendorActivityLog(vendorId, "Add Fish", `Added ${fish.name} to stall`);
      setAddVisible(false);
      Alert.alert("Success", `"${fish.name}" added to your stall.`);
    } catch (error) {
      console.error("Error adding fish:", error);
      Alert.alert("Error", "Failed to add fish. Please try again.");
    }
  };

  const handleDeleteFish = async (fish) => {
    Alert.alert(
      "Delete Fish",
      `Are you sure you want to remove "${fish.name}" from your stall?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedList = fishList.filter((f) => f.id !== fish.id);
              await updateDoc(vendorRef, { fishList: updatedList });
              setFishList(updatedList);
              await addVendorActivityLog(vendorId, "Delete Fish", `Deleted ${fish.name} from stall`);
              Alert.alert("Success", `"${fish.name}" removed successfully.`);
            } catch (error) {
              console.error("Error deleting fish:", error);
              Alert.alert("Error", "Failed to delete fish. Please try again.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Stall Management</Text>

      <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
        <Text style={styles.addBtnText}>+ Add Fish</Text>
      </TouchableOpacity>

      {fishList.length === 0 ? (
        <Text style={styles.noFish}>No fish in your stall. Add from catalog.</Text>
      ) : (
        <FlatList
          data={fishList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.fishCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fishName}>{item.name}</Text>
                <Text style={styles.fishText}>
                  {item.status === 'Available' ? `Qty: ${item.quantity}` : "No Stock"}
                </Text>
                <Text style={styles.fishText}>₱{item.price ?? 0}/kg</Text>
                <Text style={[styles.status, { color: item.status === 'Available' ? 'green' : 'red' }]}>
                  {item.status}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TouchableOpacity
                  accessibilityLabel={`Edit ${item.name}`}
                  style={styles.iconBtn}
                  onPress={() => {
                    setSelectedFish(item);
                    setEditVisible(true);
                  }}
                >
                  <Ionicons name="pencil" size={18} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityLabel={`Delete ${item.name}`}
                  style={[styles.iconBtn, { backgroundColor: '#e74c3c' }]}
                  onPress={() => handleDeleteFish(item)}
                >
                  <Ionicons name="trash" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <EditFishModal visible={editVisible} onClose={() => setEditVisible(false)} fish={selectedFish} vendorId={vendorId} />

      <Modal visible={addVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Fish to Add</Text>
            {availableCatalog.length === 0 ? (
              <Text style={{ textAlign: 'center', marginVertical: 12, color: '#666' }}>
                All catalog fish have already been added to your stall.
              </Text>
            ) : (
              <FlatList
                data={availableCatalog}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalButton} onPress={() => handleAddFish(item)}>
                    <Text style={styles.modalButtonText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity style={[styles.modalButtonred, { backgroundColor: 'red' }]} onPress={() => setAddVisible(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 16, color: '#103461' },
  noFish: { fontSize: 16, textAlign: 'center', marginTop: 32, color: '#999' },
  fishCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  fishName: { fontSize: 24, fontWeight: '700', color: '#103461', marginBottom: 6 },
  fishText: { fontSize: 20, color: '#555', marginBottom: 3 },
  status: { marginTop: 6, fontWeight: '600', fontSize: 18 },
  iconBtn: { backgroundColor: '#103461', padding: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  addBtn: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '85%', maxHeight: '75%' },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, textAlign: 'center', color: '#103461' },
  input: { fontSize: 20, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 16, width: '100%', color: '#333' },
  buttonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  modalButton: {
    backgroundColor: '#103461',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 6,
    alignItems: 'center',
    flex: 1,
  },
  modalButtonred: {
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  modalButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
