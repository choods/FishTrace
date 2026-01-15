import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { addVendorActivityLog } from '../../helpers/vendorActivityLog';

export default function StallSettingsTab({
  vendorId,
  stallName,
  setStallName,
  location,
  setLocation,
  stallContact,
  setStallContact,
  stallHours,
  setStallHours,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const originalValuesRef = useRef({
    stallName: '',
    location: '',
    stallContact: '',
    stallHours: '',
  });
  //Fetch current stall settings
  useEffect(() => {
    if (!vendorId) return;

    const vendorRef = doc(db, 'vendors', vendorId);

    const unsubscribe = onSnapshot(vendorRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setStallName(data.stallName || '');
        setLocation(data.location || '');
        setStallContact(data.stallContact || '');
        setStallHours(data.stallHours || '');
        // store originals so we can revert on cancel
        originalValuesRef.current = {
          stallName: data.stallName || '',
          location: data.location || '',
          stallContact: data.stallContact || '',
          stallHours: data.stallHours || '',
        };
      }
    });

    return () => unsubscribe();
  }, [vendorId]);

  // Save stall settings
  const handleSaveStallSettings = async () => {
    if (!vendorId) return;

    try {
      const vendorRef = doc(db, 'vendors', vendorId);

      await updateDoc(vendorRef, {
        stallName,
        location,
        stallContact,
        stallHours,
      });

      await addVendorActivityLog(
        vendorId,
        'Update Stall Settings',
        `Updated stall settings: name="${stallName}", location="${location}", contact="${stallContact}", hours="${stallHours}"`
      );
      // update original snapshot copy and reset editing state
      originalValuesRef.current = { stallName, location, stallContact, stallHours };
      setIsEditing(false);
      alert('Stall settings updated successfully!');
    } catch (error) {
      console.error('Error updating stall settings:', error);
      alert('Failed to update stall settings.');
    }
  };

  const handleCancel = () => {
    const o = originalValuesRef.current;
    setStallName(o.stallName);
    setLocation(o.location);
    setStallContact(o.stallContact);
    setStallHours(o.stallHours);
    setIsEditing(false);
  };

  // Time picker state and helpers
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempStart, setTempStart] = useState('6:00 AM');
  const [tempEnd, setTempEnd] = useState('6:00 PM');

  const generateTimes = () => {
    const list = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour = h % 12 === 0 ? 12 : h % 12;
        const ampm = h < 12 ? 'AM' : 'PM';
        const minute = m === 0 ? '00' : String(m).padStart(2, '0');
        list.push(`${hour}:${minute} ${ampm}`);
      }
    }
    return list;
  };

  const times = generateTimes();

  const openTimePicker = () => {
    // initialize temp values from current stallHours if possible
    if (stallHours && stallHours.includes('-')) {
      const parts = stallHours.split('-').map(s => s.trim());
      setTempStart(parts[0] || '6:00 AM');
      setTempEnd(parts[1] || '6:00 PM');
    } else {
      setTempStart('6:00 AM');
      setTempEnd('6:00 PM');
    }
    setShowTimePicker(true);
  };

  const applyTimeSelection = () => {
    // basic validation: ensure start is not after end by index
    const si = times.indexOf(tempStart);
    const ei = times.indexOf(tempEnd);
    if (si === -1 || ei === -1 || si > ei) {
      alert('Please select a valid start and end time (start should be before end).');
      return;
    }
    const value = `${tempStart} - ${tempEnd}`;
    setStallHours(value);
    setIsEditing(true);
    setShowTimePicker(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        Stall Settings
      </Text>

      <TextInput
        style={styles.input}
        value={stallName}
        onChangeText={(text) => { setIsEditing(true); setStallName(text); }}
        placeholder="Stall Name"
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={(text) => { setIsEditing(true); setLocation(text); }}
        placeholder="Location"
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={styles.input}
        value={stallContact}
        onChangeText={(text) => { setIsEditing(true); setStallContact(text); }}
        placeholder="Contact Number"
        keyboardType="phone-pad"
        placeholderTextColor="#aaa"
      />
      <TouchableOpacity style={[styles.input, styles.pickerTrigger]} onPress={openTimePicker}>
        <Text style={stallHours ? styles.pickerText : styles.pickerPlaceholder}>{stallHours || 'Operating Hours (6:00 AM - 6:00 PM)'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSaveStallSettings}>
        <Text style={styles.saveBtnText}>Save Settings</Text>
      </TouchableOpacity>

      {isEditing && (
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      )}
      <Modal visible={showTimePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Select Operating Hours</Text>
            <View style={styles.timesRow}>
              <ScrollView style={styles.timesColumn}>
                <Text style={{ marginBottom: 8, fontWeight: '600' }}>Start</Text>
                {times.map(t => {
                  const sel = t === tempStart;
                  return (
                    <TouchableOpacity key={`s-${t}`} style={[styles.timeItem, sel && styles.timeItemSelected]} onPress={() => setTempStart(t)}>
                      <Text style={[styles.timeText, sel && styles.timeTextSelected]}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <ScrollView style={styles.timesColumn}>
                <Text style={{ marginBottom: 8, fontWeight: '600' }}>End</Text>
                {times.map(t => {
                  const sel = t === tempEnd;
                  return (
                    <TouchableOpacity key={`e-${t}`} style={[styles.timeItem, sel && styles.timeItemSelected]} onPress={() => setTempEnd(t)}>
                      <Text style={[styles.timeText, sel && styles.timeTextSelected]}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={() => setShowTimePicker(false)}>
                <Text style={styles.modalCancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalApply]} onPress={applyTimeSelection}>
                <Text style={styles.modalApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
  header: { fontSize: 24, fontWeight: '700', color: '#103461', marginBottom: 24 },
  input: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    color: '#333',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  saveBtn: {
    backgroundColor: '#103461',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelBtnText: { color: '#103461', fontWeight: '700', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxHeight: '70%', backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  modalHeader: { fontSize: 18, fontWeight: '700', color: '#103461', marginBottom: 12 },
  timesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timesColumn: { width: '48%', maxHeight: 300 },
  timeItem: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 8 },
  timeItemSelected: { backgroundColor: '#103461' },
  timeText: { color: '#333' },
  timeTextSelected: { color: '#fff', fontWeight: '700' },
  pickerTrigger: { justifyContent: 'center' },
  pickerText: { color: '#333', fontSize: 16 },
  pickerPlaceholder: { color: '#aaa', fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  modalButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, marginLeft: 8 },
  modalApply: { backgroundColor: '#103461' },
  modalCancel: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0' },
  modalApplyText: { color: '#fff', fontWeight: '700' },
  modalCancelText: { color: '#103461', fontWeight: '700' },
});
