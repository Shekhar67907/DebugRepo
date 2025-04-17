import { Tabs } from 'expo-router';
import {
  ChartBar as BarChart2,
  ChartLine as LineChart,
  ChartPie as PieChart,
} from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Analysis',
          tabBarIcon: ({ size, color }) => (
            <LineChart size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
