import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { colors, fonts } from "../../constants/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <Ionicons
      name={name}
      size={22}
      color={focused ? colors.accent : colors.textMuted}
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgSecondary,
          borderTopWidth: 1.5,
          borderTopColor: colors.border,
          height: Platform.OS === "ios" ? 84 : 64,
          paddingBottom: Platform.OS === "ios" ? 24 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.body600,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Diary",
          tabBarIcon: ({ focused }) => <TabIcon name="book-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: "Scan",
          tabBarIcon: ({ focused }) => <TabIcon name="camera-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Progress",
          tabBarIcon: ({ focused }) => <TabIcon name="trending-up-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "You",
          tabBarIcon: ({ focused }) => <TabIcon name="person-outline" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
