import { View, Text } from "react-native";
import { Link } from "expo-router";

export default function NotFoundScreen() { 
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text> Pagina no encontrada</Text>
      <Link href="/"> Volver al inicio</Link>
    </View>
  );
}
