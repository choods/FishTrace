import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VendorManagement from './VendorManagement';
import ActivityLogs from './ActivityLogs';
import AdminFishManager from './AdminFishManager'; 

export default function AdminDashboard({ navigation }) {
  const [activeTab, setActiveTab] = useState('Vendor Management');
  const [menuVisible, setMenuVisible] = useState(false);


  const renderContent = () => {
    if (activeTab === 'Vendor Management') return <VendorManagement navigation={navigation} />;
    if (activeTab === 'Activity Logs') return <ActivityLogs navigation={navigation} />;
    if (activeTab === 'Manage Fish') return <AdminFishManager />;
    return (
      <View style={styles.content}>
        <Text style={styles.welcome}>Welcome, Admin 👋</Text>
        <Text style={styles.subText}>Select a menu option to manage the system.</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.menuBar}>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={28} color="#103461" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {activeTab}
        </Text>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={styles.sideMenu}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Menu</Text>
              <TouchableOpacity onPress={() => setMenuVisible(false)} accessibilityLabel="Close menu">
                <Text style={{ fontSize: 20, color: '#103461' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.menuItems}>
              <TouchableOpacity
                style={[styles.sideMenuItem, activeTab === 'Vendor Management' && styles.activeItem]}
                onPress={() => { setMenuVisible(false); setActiveTab('Vendor Management'); }}
              >
                <View style={styles.itemRow}><Ionicons name="people" size={20} color={activeTab === 'Vendor Management' ? '#103461' : '#777'} /><Text style={[styles.menuText, activeTab === 'Vendor Management' && styles.activeText]}> Vendor Management</Text></View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sideMenuItem, activeTab === 'Manage Fish' && styles.activeItem]}
                onPress={() => { setMenuVisible(false); setActiveTab('Manage Fish'); }}
              >
                <View style={styles.itemRow}><Ionicons name="restaurant" size={20} color={activeTab === 'Manage Fish' ? '#103461' : '#777'} /><Text style={[styles.menuText, activeTab === 'Manage Fish' && styles.activeText]}> Manage Fish</Text></View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sideMenuItem, activeTab === 'Activity Logs' && styles.activeItem]}
                onPress={() => { setMenuVisible(false); setActiveTab('Activity Logs'); }}
              >
                <View style={styles.itemRow}><Ionicons name="list" size={20} color={activeTab === 'Activity Logs' ? '#103461' : '#777'} /><Text style={[styles.menuText, activeTab === 'Activity Logs' && styles.activeText]}> Activity Logs</Text></View>
              </TouchableOpacity>
            </View>

            <View style={styles.logoutRow}>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => { setMenuVisible(false); navigation.replace('AdminLogin'); }}
              >
                <Ionicons name="log-out" size={18} color="#c23" />
                <Text style={styles.logoutText}> Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: '#f8f9fa' },
menuBar: { paddingTop: 33, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16, elevation: 2 },
title: { marginLeft: 16, fontSize: 20, fontWeight: '700', color: '#103461' },
menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-start', alignItems: 'flex-start' },
sideMenu: { position: 'absolute', top: 0, left: 0, width: 260, backgroundColor: '#fff', padding: 16, paddingTop: 20, elevation: 6, height: '100%', zIndex: 10, borderTopRightRadius: 12, borderBottomRightRadius: 12 },
menuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
menuTitle: { fontSize: 18, fontWeight: '700', color: '#103461' },
menuItems: { marginTop: 8 },
sideMenuItem: { paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8 },
itemRow: { flexDirection: 'row', alignItems: 'center' },
menuText: { fontSize: 16, color: '#103461', marginLeft: 8 },
activeItem: { backgroundColor: '#e6f0ff' },
activeText: { color: '#103461', fontWeight: '700' },
logoutRow: { marginTop: 24, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
logoutBtn: { flexDirection: 'row', alignItems: 'center' },
logoutText: { color: '#c23', fontWeight: '700', marginLeft: 8 },
content: { flex: 1, padding: 0 },
welcome: { fontSize: 22, color: '#103461', fontWeight: '700', textAlign: 'center', marginTop: 40 },
subText: { fontSize: 16, color: '#555', marginTop: 8, textAlign: 'center' },
});
