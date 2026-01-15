import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Linking, Alert, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, doc, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

export default function FishInfo({ route, navigation }) {
  const { fishName } = route.params || {};
  const [imageUrl, setImageUrl] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch vendors from Firestore
  const fetchVendors = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'vendors'));
      const now = new Date();
      const list = [];

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const fishEntry = data.fishList?.find(f => f.name === fishName);

        // Check lastSeen timestamp to detect offline
        const lastSeen = data.lastSeen?.toDate?.();
        const offline = !lastSeen || (now - lastSeen) / 1000 > 5; // offline if lastSeen > 5s

        if (fishEntry) {
          const quantity = offline ? 0 : (fishEntry.quantity ?? 0);
          if (quantity >= 1) { // only include vendors with 1 or more
            list.push({
              vendorId: docSnap.id,
              stallName: data.stallName || '',
              location: data.location || '',
              stallContact: data.stallContact || '',
              stallHours: data.stallHours || '',
              price: fishEntry.price || 0,
              quantity,
              status: 'Available',
            });
          }
        }
      });

      // Sort vendors by quantity descending
      list.sort((a, b) => b.quantity - a.quantity);

      setVendors(list);
      setLoading(false);
    } catch (err) {
      console.warn('Error fetching vendors:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!fishName) return;

    // Load fish image
    const catalogRef = doc(db, 'fishCatalog', fishName);
    const unsubCatalog = onSnapshot(catalogRef, (snap) => {
      if (snap.exists()) setImageUrl(snap.data().image || null);
      else setImageUrl(null);
    });

    // Initial fetch and auto-refresh every 5 seconds
    fetchVendors();
    const interval = setInterval(fetchVendors, 5000);

    return () => {
      unsubCatalog();
      clearInterval(interval);
    };
  }, [fishName]);

  // Aggregate quantity and prices
  const totalQty = vendors.reduce((s, v) => s + (v.quantity || 0), 0);
  const totalWeightedPrice = vendors.reduce((s, v) => s + ((v.price || 0) * (v.quantity || 0)), 0);
  const avgPrice = totalQty > 0
    ? (totalWeightedPrice / totalQty).toFixed(2)
    : (vendors.length > 0 ? (vendors.reduce((s, v) => s + v.price, 0) / vendors.length).toFixed(2) : '0');

  const priceList = vendors.map(v => Number(v.price || 0));
  const minPrice = priceList.length > 0 ? Math.min(...priceList).toFixed(2) : '0.00';
  const maxPrice = priceList.length > 0 ? Math.max(...priceList).toFixed(2) : '0.00';
  const stockStatus = totalQty > 0 ? 'Available' : 'No Stock';
  const stockColor = totalQty > 0 ? 'green' : 'red';

  const onCall = (phone) => {
    if (!phone) return Alert.alert('No contact', 'Contact number not provided for this stall.');
    Linking.openURL(`tel:${phone}`).catch(err => console.warn('Cannot open dialer', err));
  };

  const onOpenMap = (locationText) => {
    if (!locationText) return Alert.alert('No location', 'Location not provided for this stall.');
    const query = encodeURIComponent(locationText);
    Linking.openURL(`geo:0,0?q=${query}`).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`)
        .catch(err => console.warn('Cannot open maps', err));
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
          <Ionicons name="home" size={24} color="#fff" style={{ marginLeft: 16 }} />
        </TouchableOpacity>
        <Text style={styles.title}>{fishName}</Text>
      </View>

      <View style={styles.innerContainer}>
        {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
                  : <Text style={{ color: 'gray' }}>No image available</Text>}

        <View style={{ alignItems: 'flex-start', marginTop: 10, width: '100%', flex: 1 }}>
          <Text style={styles.fishName}>{fishName}</Text>
          <Text style={styles.details}>Available Quantity: {totalQty}</Text>
          {vendors.length > 1 ? (
            <Text style={styles.details}>Price: ₱{minPrice}/kg - ₱{maxPrice}/kg</Text>
          ) : (
            <Text style={styles.details}>Price: ₱{avgPrice}/kg</Text>
          )}
          <Text style={[styles.details, { color: stockColor, fontWeight: 'bold' }]}>{stockStatus}</Text>

          <Text style={{ marginTop: 10, fontWeight: '700', color: '#103461', fontSize: 20 }}>Available At</Text>

          {vendors.length === 0 ? (
            <Text style={{ color: 'gray', fontSize: 18, marginTop: 45, marginLeft: 45 }}>No vendors selling this fish</Text>
          ) : (
            <FlatList
              data={vendors}
              keyExtractor={item => item.vendorId}
              style={{ width: '100%', marginTop: 10, flex: 1 }}
              scrollEnabled
              showsVerticalScrollIndicator
              contentContainerStyle={{ paddingBottom: 140 }}
              ListFooterComponent={() => <View style={{ height: 80 }} />}
              renderItem={({ item }) => (
                <View style={styles.vendorCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stallName}>{item.stallName || 'Unnamed Stall'}</Text>
                    <Text style={styles.vendorDetail}>Location: {item.location || 'Location not provided'}</Text>
                    <Text style={styles.vendorDetail}>Contact: {item.stallContact || 'Not provided'}</Text>
                    <Text style={styles.vendorDetail}>Hours: {item.stallHours || 'Unknown'}</Text>
                    <View style={{ flexDirection: 'row', marginTop: 6, alignItems: 'center' }}>
                      <Text style={{ fontWeight: '600', fontSize: 18 }}>Qty: </Text>
                      <Text style={{ fontSize: 18 }}>{item.quantity}</Text>
                      <Text style={{ marginLeft: 12, fontWeight: '600', fontSize: 18 }}>Price: </Text>
                      <Text style={{ fontSize: 18 }}>₱{item.price}/kg</Text>
                    </View>
                    <Text style={[styles.vendorDetail, { color: 'green', fontWeight: '600', marginTop: 4 }]}>
                      Available
                    </Text>
                  </View>

                  <View style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginLeft: 8 }}>
                    <View style={{ flexDirection: 'column', marginBottom: 8 }}>
                      <TouchableOpacity style={styles.iconButton} onPress={() => onCall(item.stallContact)}>
                        <Ionicons name="call" size={25} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.iconButton} onPress={() => onOpenMap(item.location)}>
                        <Ionicons name="navigate" size={25} color="#fff" />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.viewStallBtn} onPress={() => navigation.navigate('Stall', { vendorId: item.vendorId })}>
                      <Text style={{ color: '#103461', fontWeight: '700', fontSize: 17 }}>View Stall</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#103461', paddingTop: 50, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 16, flexShrink: 1 },
  innerContainer: { flex: 1, backgroundColor: '#fff', padding: 18, borderRadius: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 6, alignItems: 'flex-start', marginTop: 10 },
  image: { width: '100%', height: 180, borderRadius: 12, marginBottom: 12, marginTop: 6 },
  fishName: { fontSize: 28, fontWeight: 'bold', color: '#103461', marginBottom: 12 },
  details: { fontSize: 18, color: '#000000', marginBottom: 6, fontWeight: '600' },
  vendorCard: { width: '100%', backgroundColor: '#f6f6f6', padding: 12, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start' },
  stallName: { fontSize: 25, fontWeight: '700', color: '#103461' },
  vendorDetail: { fontSize: 18, color: '#333', marginTop: 3 },
  iconButton: { backgroundColor: '#103461', padding: 8, borderRadius: 8, width: 100, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  viewStallBtn: { marginTop: 6, backgroundColor: '#e6f0ff', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
});
