import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

const WelcomeScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Main Content Card */}
        <LinearGradient
          colors={["#8A2BE2", "#4B0082", "#00BFFF"]} // Purple to blue gradient
          style={styles.card}
        >
          <View style={styles.logoContainer}>
            <Text style={{ fontSize: 40 }}>✨</Text>
          </View>
        </LinearGradient>

        <View style={styles.bottomContent}>
          <Text style={styles.title}>Welcome to App</Text>
          <Text style={styles.subtitle}>
            By using this App, you agree to the{" "}
            <Text style={styles.link}>terms</Text> and{" "}
            <Text style={styles.link}>privacy policy</Text>
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/(unauthenticated)")}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
    padding: 20,
  },
  card: {
    width: 200,
    height: 300,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomContent: {
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 14,
    color: "#A9A9A9",
    textAlign: "center",
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  link: {
    color: "#FFFFFF",
    textDecorationLine: "underline",
  },
  button: {
    backgroundColor: "#1E90FF",
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default WelcomeScreen;
