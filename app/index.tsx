import { Redirect } from "expo-router";

export default function Index() {
  // This immediately sends everyone to Scotty
  // Your _layout.tsx will still catch them and send them to Login if they aren't authed
  return <Redirect href="/(tabs)/scotty" />;
}