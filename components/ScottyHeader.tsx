import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { auth, signOut } from "@/config/firebase";

export default function ScottyHeader() {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
      }}
    >
      <ExpoImage
        source={require("@/assets/images/Scotty.png")}
        style={{ width: 50, height: 50 }}
      />
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>ScottyTasks</Text>
      <TouchableOpacity
        onPress={() => signOut(auth)}
        style={{ backgroundColor: "#ff4444", padding: 10, borderRadius: 6 }}
      >
        <Text style={{ color: "white" }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
