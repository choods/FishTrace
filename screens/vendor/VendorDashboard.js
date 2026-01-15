import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import StallTab from './StallTab';
import ActivityLogTab from './ActivityLogTab';
import StallSettingsTab from './StallSettingsTab';
import { addVendorActivityLog } from '../../helpers/vendorActivityLog';

export default function VendorDashboard({ navigation, route }) {
  const vendorId = route.params?.vendorId;
  const [activeTab, setActiveTab] = useState('Stall');
  const [menuVisible, setMenuVisible] = useState(false);
  const [stallName, setStallName] = useState('');
  const [location, setLocation] = useState('');
  const [stallContact, setStallContact] = useState('');
  const [stallHours, setStallHours] = useState('');
  const [fishList, setFishList] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const slideAnim = useRef(new Animated.Value(-250)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: menuVisible ? 0 : -250,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [menuVisible]);

  useEffect(() => {
    const fetchVendorInfo = async () => {
      if (!vendorId) return;
      try {
        const vendorRef = doc(db, 'vendors', vendorId);
        const docSnap = await getDoc(vendorRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStallName(data.stallName || 'Vendor Dashboard');
          setLocation(data.location || '');
          setStallContact(data.stallContact || '');
          setStallHours(data.stallHours || '');
        }
      } catch (error) {
        console.log('Error fetching vendor info:', error);
      }
    };
    fetchVendorInfo();
  }, [vendorId]);

  return (
    <View style={{ flex: 1, backgroundColor: '#103461' }}>
      <View style={{ paddingTop: 33, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16 }}>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={35} color="#103461" />
        </TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#103461', marginLeft: 15 }}>
          {stallName || 'Vendor Dashboard'}
        </Text>
      </View>

      <Modal visible={menuVisible} transparent animationType="none">
        <View style={{ flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setMenuVisible(false)} />
          <Animated.View
            style={[{ position: 'absolute', top: 0, bottom: 0, width: 260, backgroundColor: '#fff', padding: 16, paddingTop: 18, elevation: 5 }, { left: slideAnim }]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#103461' }}>Menu</Text>
              <TouchableOpacity onPress={() => setMenuVisible(false)} style={{ padding: 6 }}>
                <Ionicons name="close" size={22} color="#103461" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => { setMenuVisible(false); setActiveTab('Stall'); }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8, backgroundColor: activeTab === 'Stall' ? '#e6f0ff' : 'transparent', marginBottom: 6 }}
            >
              <Ionicons name="storefront-outline" size={20} color={activeTab === 'Stall' ? '#103461' : '#666'} />
              <Text style={{ marginLeft: 12, fontSize: 16, fontWeight: '700', color: activeTab === 'Stall' ? '#103461' : '#333' }}>Stall</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setMenuVisible(false); setActiveTab('Activity Log'); }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8, backgroundColor: activeTab === 'Activity Log' ? '#e6f0ff' : 'transparent', marginBottom: 6 }}
            >
              <Ionicons name="list" size={20} color={activeTab === 'Activity Log' ? '#103461' : '#666'} />
              <Text style={{ marginLeft: 12, fontSize: 16, fontWeight: '700', color: activeTab === 'Activity Log' ? '#103461' : '#333' }}>Activity Log</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setMenuVisible(false); setActiveTab('Stall Settings'); }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8, backgroundColor: activeTab === 'Stall Settings' ? '#e6f0ff' : 'transparent', marginBottom: 14 }}
            >
              <Ionicons name="settings-outline" size={20} color={activeTab === 'Stall Settings' ? '#103461' : '#666'} />
              <Text style={{ marginLeft: 12, fontSize: 16, fontWeight: '700', color: activeTab === 'Stall Settings' ? '#103461' : '#333' }}>Stall Settings</Text>
            </TouchableOpacity>

            <View style={{ borderTopWidth: 1, borderTopColor: '#eee', marginTop: 8, paddingTop: 12 }}>
              <TouchableOpacity
                onPress={() => { setMenuVisible(false); navigation.replace('VendorLogin', { vendorId }); }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}
              >
                <Ionicons name="log-out-outline" size={20} color="#c23" />
                <Text style={{ marginLeft: 12, fontSize: 16, fontWeight: '700', color: '#c23' }}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <View style={{ flex: 1, padding: 16 }}>
        {activeTab === 'Stall' && (
          <StallTab
            fishList={fishList}
            setFishList={setFishList}
            vendorId={vendorId}
            addVendorActivityLog={addVendorActivityLog}
          />
        )}

        {activeTab === 'Activity Log' && (
          <ActivityLogTab vendorId={vendorId} activityLog={activityLog} setActivityLog={setActivityLog} />
        )}

        {activeTab === 'Stall Settings' && (
          <StallSettingsTab
            vendorId={vendorId}
            stallName={stallName}
            setStallName={setStallName}
            location={location}
            setLocation={setLocation}
            stallContact={stallContact}
            setStallContact={setStallContact}
            stallHours={stallHours}
            setStallHours={setStallHours}
            handleSaveStallSettings={async () => {
              try {
                await addVendorActivityLog(
                  vendorId,
                  'Stall Update',
                  `Updated stall info: ${stallName}, Location: ${location}, Contact: ${stallContact}, Hours: ${stallHours}`
                );
                alert('Stall settings updated!');
              } catch (error) {
                console.log(error);
                alert('Error updating stall settings');
              }
            }}
          />
        )}
      </View>
    </View>
  );
}
