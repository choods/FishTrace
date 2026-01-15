import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Linking, Platform, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function StallScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { vendorId, location, fishName } = route.params || {};
  const [stalls, setStalls] = useState([]);
  const [singleVendor, setSingleVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Phone call and map handlers
  const onCall = (phone) => {
    if (!phone) {
      Alert.alert('No contact', 'Contact number not available');
      return;
    }
    const url = `tel:${phone}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) return Linking.openURL(url);
        Alert.alert('Cannot make call', 'No phone app available');
      })
      .catch((err) => console.error('Error opening dialer', err));
  };

  const onOpenMap = (loc) => {
    if (!loc) {
      Alert.alert('No location', 'Location not provided');
      return;
    }
    const query = encodeURIComponent(loc);
    const geoUrl = Platform.OS === 'ios' ? `maps:0,0?q=${query}` : `geo:0,0?q=${query}`;
    const browserUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(geoUrl).catch(() => Linking.openURL(browserUrl)).catch((err) => console.error('Error opening map', err));
  };

  // If vendorId is provided, fetch that single vendor's details
  useEffect(() => {
    const fetchVendor = async () => {
      const now = new Date();
      try {
        if (vendorId) {
          const vendorSnap = await getDoc(doc(db, 'vendors', vendorId));
          if (vendorSnap.exists()) {
            const data = vendorSnap.data();
            const lastSeen = data.lastSeen?.toDate?.();
            // Consider vendor offline if lastSeen > 60 seconds
            const offline = !lastSeen || (now - lastSeen) / 1000 > 5;

            // Debug: help confirm lastSeen values during testing
            console.log('[StallScreen] vendor', vendorId, 'lastSeen', lastSeen, 'offline', offline);

            const fishList = (data.fishList || []).map(fish => ({
              ...fish,
              quantity: offline ? 0 : (fish.quantity || 0),
              status: offline ? 'No Stock' : (fish.quantity > 0 ? 'Available' : 'No Stock'),
            }));

            setSingleVendor({
              stallName: data.stallName || '',
              location: data.location || '',
              stallContact: data.stallContact || '',
              stallHours: data.stallHours || '',
              stallPicture: data.stallPicture || null,
              fishList,
            });
          }
          setLoading(false);
        } else {
          // Fetch stalls at the selected location that have the specified fish in stock
          const vendorsSnapshot = await getDocs(collection(db, 'vendors'));
          const foundStalls = [];
          vendorsSnapshot.forEach(docSnap => {
            const data = docSnap.data();
            const lastSeen = data.lastSeen?.toDate?.();
            const offline = !lastSeen || (now - lastSeen) / 1000 > 5; // match 60s threshold

            // Debug: log each vendor lastSeen during testing
            // console.log('[StallScreen] vendor', docSnap.id, 'lastSeen', lastSeen, 'offline', offline);

            if (
              data.location === location &&
              data.fishList &&
              data.fishList.some(fish => fish.name === fishName && (offline ? 0 : (fish.quantity || 0)) > 0)
            ) {
              foundStalls.push({
                stallName: data.stallName,
                vendorId: docSnap.id,
              });
            }
          });

          setStalls(foundStalls);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching vendor/stalls:', err);
        setLoading(false);
      }
    };

    fetchVendor();

    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchVendor, 5000);
    return () => clearInterval(interval);
  }, [vendorId, location, fishName]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#103461" size="large" />
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
        <Text style={styles.title}>{singleVendor ? singleVendor.stallName : location}</Text>
      </View>

      <View style={styles.innerContainer}>
        {singleVendor ? (
          <View>
            {singleVendor.stallPicture ? (
              <Image source={{ uri: singleVendor.stallPicture }} style={styles.stallImage} resizeMode="cover" />
            ) : (
              <View style={[styles.stallImage, { backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="image-outline" size={40} color="#999" />
              </View>
            )}
            <View style={styles.vendorHeaderRow}>
              <View style={styles.vendorInfoColumn}>
                <Text style={styles.vendorTitle}>{singleVendor.stallName}</Text>
                <Text style={styles.vendorInfo}>📍 {singleVendor.location || 'Location not provided'}</Text>
                <Text style={styles.vendorInfo}>📞 {singleVendor.stallContact || 'Contact not provided'}</Text>
                <Text style={styles.vendorInfo}>🕒 {singleVendor.stallHours || 'Hours not provided'}</Text>
              </View>
              <View style={styles.actionColumn}>
                <TouchableOpacity style={styles.smallIconBtn} onPress={() => onCall(singleVendor.stallContact)}>
                  <Ionicons name="call" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.smallIconBtn, { marginTop: 10 }]} onPress={() => onOpenMap(singleVendor.location)}>
                  <Ionicons name="navigate" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={{ marginTop: 16, fontWeight: '700', color: '#103461', fontSize: 20 }}>Fish Available</Text>
            <View style={{ maxHeight: 300, marginTop: 8 }}>
              <ScrollView contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={true}>
                {singleVendor.fishList && singleVendor.fishList.length > 0 ? (
                  singleVendor.fishList.map((fish, index) => (
                    <View key={`${fish.name ?? 'fish'}-${index}`} style={[styles.fishItem, styles.fishRow]}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '600', fontSize: 20 }}>{fish.name}</Text>
                        <Text style={{ fontSize: 15, color: '#666' }}>
                          Qty: {fish.quantity} | Price: ₱{fish.price}/kg{' '}
                          <Text style={{ color: fish.quantity > 0 ? '#4CAF50' : 'red', fontWeight: '600' }}>
                            {fish.quantity > 0 ? 'Available' : 'No Stock'}
                          </Text>
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.fishGoBtn}
                        onPress={() => navigation.navigate('FishInfo', { vendorId, fishName: fish.name })}
                      >
                        <Ionicons name="chevron-forward" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: '#999', marginTop: 8 }}>No fish available</Text>
                )}
              </ScrollView>
            </View> 
          </View>
        ) : (
          <>
            {stalls.length === 0 ? (
              <Text style={{ color: '#103461', fontSize: 16 }}>No stalls found with {fishName}.</Text>
            ) : (
              stalls.map((stall, index) => (
                <TouchableOpacity
                  key={stall.vendorId}
                  style={styles.stallCard}
                  onPress={() =>
                    navigation.navigate('FishInfo', {
                      vendorId: stall.vendorId,
                      fishName,
                    })
                  }
                >
                  <Ionicons name="storefront-outline" size={24} color="#000" />
                  <Text style={styles.stallText}>{stall.stallName}</Text>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#103461', paddingTop: 50, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 16, marginTop: 8, flexShrink: 1 },
  innerContainer: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  stallCard: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#ccc' },
  stallText: { fontSize: 21, color: '#000' },
  stallImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16 },
  iconButton: { backgroundColor: '#103461', padding: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  vendorTitle: { fontSize: 25, fontWeight: 'bold', color: '#103461', marginBottom: 12 },
  vendorInfo: { fontSize: 18, color: '#333', marginBottom: 6 },
  fishItem: { backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, marginBottom: 8, marginTop: 8 },
  fishRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fishGoBtn: { marginLeft: 12, width: 44, height: 36, borderRadius: 8, backgroundColor: '#103461', alignItems: 'center', justifyContent: 'center' },
  vendorHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  vendorInfoColumn: { flex: 1, paddingRight: 12 },
  actionColumn: { width: 56, alignItems: 'center', justifyContent: 'flex-start' },
  smallIconBtn: { width: 80, height: 48, borderRadius: 10, backgroundColor: '#103461', alignItems: 'center', justifyContent: 'center', marginRight: 20, marginTop: 25},
});
