import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import fishIcon from '../../assets/fish-icon.png';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    setTimeout(() => {
      navigation.replace('Dashboard');
    }, 1200);
  }, []);

  return (
    <View style={styles.container}>
      <Image source={fishIcon} style={styles.logo} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1,backgroundColor: '#103461',justifyContent: 'center',alignItems: 'center',},
  logo: {width: 300,height: 300,resizeMode: 'contain',},
});
