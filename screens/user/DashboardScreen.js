import { useState, useEffect } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { collection, doc, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

export default function DashboardScreen({ navigation }) {
  const [fishCatalog, setFishCatalog] = useState([]);
  const [search, setSearch] = useState('');
  const [vendorFishLists, setVendorFishLists] = useState([]);
  const [disabledFish, setDisabledFish] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch fish catalog (real-time)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'fishCatalog'), snapshot => {
      const fishArray = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFishCatalog(fishArray);
    });
    return () => unsubscribe();
  }, []);

  // Fetch disabled fish list (real-time)
  useEffect(() => {
    const docRef = doc(db, 'settings', 'fishStatus');
    const unsubscribe = onSnapshot(docRef, docSnap => {
      setDisabledFish(docSnap.exists() ? docSnap.data().disabledFish || [] : []);
    });
    return () => unsubscribe();
  }, []);

  // Function to fetch vendors and compute fish data
  const fetchVendors = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'vendors'));
      const now = new Date();
      const allFish = [];

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const lastSeen = data.lastSeen?.toDate?.();
        const offline = !lastSeen || (now - lastSeen) / 1000 > 5; // offline if lastSeen > 10s

        if (data.fishList && data.fishList.length > 0) {
          data.fishList.forEach(fish => {
            allFish.push({
              name: fish.name,
              price: fish.price || 0,
              quantity: offline ? 0 : (fish.quantity || 0),
              status: offline ? 'No Stock' : (fish.quantity > 0 ? 'Available' : 'No Stock'),
              vendorId: docSnap.id,
            });
          });
        }
      });

      setVendorFishLists(allFish);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setLoading(false);
    }
  };

  // Initial fetch and auto-refresh every 5 seconds
  useEffect(() => {
    fetchVendors();
    const interval = setInterval(fetchVendors, 5000);
    return () => clearInterval(interval);
  }, []);

  // Combine catalog with vendor fish data
  const displayFish = fishCatalog
    .filter(fish => !disabledFish.includes(fish.name))
    .map(fish => {
      const vendorEntries = vendorFishLists.filter(f => f.name === fish.name);

      let totalQty = 0;
      let isAvailable = false;
      let firstVendorId = null;

      vendorEntries.forEach(f => {
        totalQty += f.quantity || 0;
        if (f.status === 'Available' && !firstVendorId) firstVendorId = f.vendorId;
        if (f.status === 'Available') isAvailable = true;
      });

      // If no available vendor, use the first one from the list
      if (!firstVendorId && vendorEntries.length > 0) firstVendorId = vendorEntries[0].vendorId;

      return {
        ...fish,
        status: isAvailable ? 'Available' : 'No Stock',
        quantity: totalQty,
        vendorId: firstVendorId,
      };
    })
    .filter(fish => fish.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TextInput
          placeholder="Search fish..."
          placeholderTextColor="#000000ff"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        <TouchableOpacity style={styles.stallButton} onPress={() => navigation.navigate('VendorLogin')}>
          <Image source={require('../../assets/stall-icon.png')} style={styles.icon} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayFish}
        keyExtractor={item => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.fishCard}
            onPress={() => navigation.navigate('FishInfo', { fishName: item.name })}
          >
            <View style={styles.imagecontainer}>
              <Image source={{ uri: item.image }} style={styles.fishImage} />
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start', marginLeft: 10 }}>
              <Text style={styles.fishName}>{item.name}</Text>
              <Text style={{ fontSize: 18, color: item.status === 'Available' ? 'green' : 'red', fontWeight: 'bold' }}>
                {item.status}
              </Text>
              <Text style={styles.fishQuantity}>Qty: {item.quantity}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#103461', paddingBottom: 50 },
  topBar: { paddingTop: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  searchInput: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 25,
    height: 55,
    fontSize: 19,
  },
  stallButton: { marginLeft: 10, padding: 6, backgroundColor: '#103461', borderRadius: 6 },
  icon: { width: 45, height: 45, tintColor: '#fff' },

  fishCard: {
    flex: 1,
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  imagecontainer: { height: 80, width: 200, marginRight: 15 },
  fishImage: { width: '100%', height: '100%', marginRight: 12 },
  fishName: { fontWeight: 'bold', fontSize: 20 },
  fishQuantity: { fontSize: 17 },
});
