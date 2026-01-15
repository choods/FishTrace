import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';

export default function AdminLogin({ navigation }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleLogin = async () => {
    if (!email || !pw) return Alert.alert('Missing fields', 'Please enter email and password.');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pw);
      console.log('Admin logged in:', userCredential.user.email);
      navigation.replace('AdminDashboard'); 
    } catch (error) {
      console.log('Login error:', error.message);
      Alert.alert('Login Failed', 'Invalid email or password');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Top bar with back to User Dashboard */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.replace('Dashboard')} style={{ padding: 4 }}>
          <Ionicons name="person-circle-outline" size={50} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Admin Login</Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.title}>FishTrace Admin</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#6b7a90"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.passwordRow}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, { paddingRight: 48, marginBottom: 0 }]}
              placeholder="Password"
              placeholderTextColor="#6b7a90"
              secureTextEntry={!showPw}
              value={pw}
              onChangeText={setPw}
            />
            <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
              <Ionicons name={showPw ? 'eye-off' : 'eye'} size={20} color="#103461" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginText}>Log In</Text>
        </TouchableOpacity>

        <View style={styles.linksRow}>
          <TouchableOpacity onPress={() => navigation.replace('VendorLogin')}>
            <Text style={styles.linkText}>Login as Vendor</Text>
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
passwordRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  eyeBtn: { position: 'absolute', right: 10, top: 10, backgroundColor: 'transparent', borderRadius: 6 },
  inputWrapper: { position: 'relative', width: '100%' },
loginBtn: { backgroundColor: '#103461', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 4 },
loginText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
linksRow: { marginTop: 12, flexDirection: 'row', marginLeft: '65%' },
linkText: { color: '#103461', fontWeight: 'bold' },
});