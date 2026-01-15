
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

//user screens
import SplashScreen from './screens/user/SplashScreen';
import DashboardScreen from './screens/user/DashboardScreen';
import StallScreen from './screens/user/StallScreen';
import FishInfo from './screens/user/FishInfo';

//vendor screens
import VendorDashboard from './screens/vendor/VendorDashboard';
import VendorLogin from './screens/vendor/VendorLogin';

//admin screens
import AdminLogin from './screens/admin/AdminLogin';
import AdminDashboard from './screens/admin/AdminDashboard';
import VendorManagement from './screens/admin/VendorManagement';
import ActivityLogs from './screens/admin/ActivityLogs';
import AdminFishManager from './screens/admin/AdminFishManager';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        {/* User Screens */}
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Stall" component={StallScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FishInfo" component={FishInfo} options={{ headerShown: false }} />

        {/* Vendor Screens */}
        <Stack.Screen name="VendorLogin" component={VendorLogin} options={{ headerShown: false }} />
        <Stack.Screen name="VendorDashboard" component={VendorDashboard} options={{ headerShown: false }} />

        {/* Admin Screens */} 
        <Stack.Screen name="AdminLogin" component={AdminLogin} options={{ headerShown: false }} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={{ headerShown: false }} />
        <Stack.Screen name="VendorManagement" component={VendorManagement} options={{ headerShown: false }} />
        <Stack.Screen name="ActivityLogs" component={ActivityLogs} options={{ headerShown: false }} />
        <Stack.Screen name="AdminFishManager" component={AdminFishManager} options={{ title: 'Manage Fish' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

