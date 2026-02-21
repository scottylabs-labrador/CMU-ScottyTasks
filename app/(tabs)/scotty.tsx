import React from "react";
import { View, Image, StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

const Colors = {
  sky: "#B8D4E8",
  grass: "#6C9264",
  dogHouseBg: "#EAD9C6",
};

export default function Index() {
  return (
    <View style={styles.container}>
      <Image 
        source={require("@/assets/images/scottyBackground.png")} 
        style={styles.backgroundImage}
      />
      {/* Your other Scotty task components go here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.sky 
  },
  backgroundImage: {
    // Using absolute positioning ensures the image spans the 
    // full height now that the nav bar is hidden.
    position: 'absolute',
    width: width,
    height: height,
    resizeMode: 'cover',
  },
});