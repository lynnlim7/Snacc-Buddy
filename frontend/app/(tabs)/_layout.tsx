import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, View } from "react-native";
import { colors, fonts } from "../../constants/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  if (focused) {
    return (
      <View
        style={{
          width:           40,
          height:          40,
          borderRadius:    20,
          backgroundColor: colors.primary,
          alignItems:      "center",
          justifyContent:  "center",
        }}
      >
        <Ionicons name={name} size={20} color="#FFFFFF" />
      </View>
    );
  }
  return <Ionicons name={name} size={22} color={colors.textMuted} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:             false,
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopWidth:  1,
          borderTopColor:  colors.primaryLight,
          height:          Platform.OS === "ios" ? 88 : 72,
          paddingBottom:   Platform.OS === "ios" ? 24 : 12,
          paddingTop:      8,
        },
        tabBarItemStyle: {
          flexDirection: "column",
          alignItems:    "center",
          gap:           4,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.body500,
          fontSize:   11,
          marginTop:  0,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title:      "Diary",
          tabBarIcon: ({ focused }) => <TabIcon name="book-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title:      "Progress",
          tabBarIcon: ({ focused }) => <TabIcon name="trending-up-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title:      "Chat",
          tabBarIcon: ({ focused }) => <TabIcon name="restaurant-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title:      "You",
          tabBarIcon: ({ focused }) => <TabIcon name="person-outline" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
