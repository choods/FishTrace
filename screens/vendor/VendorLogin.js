import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export default function VendorLogin({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      return Alert.alert('Missing Fields', 'Please enter username and password');
    }

    try {
      const q = query(
        collection(db, 'vendors'),
        where('username', '==', username),
        where('password', '==', password)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const vendorDoc = querySnapshot.docs[0];
        const vendorId = vendorDoc.id;
        const vendorData = vendorDoc.data();

        Alert.alert('Welcome', `Hello ${vendorData.stallName || username}!`);

        navigation.replace('VendorDashboard', { vendorId });
      } else {
        Alert.alert('Invalid credentials', 'Username or password is incorrect');
      }
    } catch (error) {
      console.log('Login error:', error);
      Alert.alert('Error', 'Could not login');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.replace('Dashboard')} style={{ padding: 4 }}>
          <Ionicons name="person-circle-outline" size={50} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Vendor Login</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>FishTrace Vendor</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#6b7a90"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />

        <View style={styles.passwordRow}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, { paddingRight: 48, marginBottom: 0 }]}
              placeholder="Password"
              placeholderTextColor="#6b7a90"
              secureTextEntry={!showPw}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
              <Ionicons name={showPw ? 'eye-off' : 'eye'} size={20} color="#103461"/>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginText}>Log In</Text>
        </TouchableOpacity>

        <View style={styles.linksRow}>
          <TouchableOpacity onPress={() => navigation.replace('AdminLogin')}>
            <Text style={styles.linkText}>Login as Admin</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: '#103461', padding: 16 },
topBar: { flexDirection: 'row', alignItems: 'center', marginTop: 28, marginBottom: 16, gap: 8 },
topTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: '40%' },
title: { fontSize: 20, fontWeight: 'bold', color: '#103461', marginBottom: 12, textAlign: 'center' },
input: { backgroundColor: '#eef2f6', color: '#103461', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16 },
  eyeBtn: { position: 'absolute', right: 10, top: 10, backgroundColor: 'transparent', borderRadius: 6 },
  inputWrapper: { position: 'relative', width: '100%' },
loginBtn: { backgroundColor: '#103461', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 4 },
loginText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
linkText: { color: '#103461', fontWeight: 'bold' },
passwordRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
linksRow: { marginTop: 12, flexDirection: 'row', marginLeft: '65%' },
});
