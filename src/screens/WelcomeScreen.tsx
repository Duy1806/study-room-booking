import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function WelcomeScreen({
  navigation,
}: any) {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>SR</Text>
        </View>

        <Text style={styles.title}>
          StudyRoom
        </Text>

        <Text style={styles.subtitle}>
          Find the perfect place to study,
          {"\n"}
          focus and get things done.
        </Text>
      </View>

      <View style={styles.bottom}>
        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            navigation.navigate("Login")
          }
        >
          <Text style={styles.primaryText}>
            Get Started
          </Text>
        </Pressable>

        <Text style={styles.footer}>
          Smart room booking for students
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 24,
    justifyContent: "space-between",
  },

  hero: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  logo: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  logoText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
  },

  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#0F172A",
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: "#64748B",
    textAlign: "center",
    marginTop: 12,
  },

  bottom: {
    paddingBottom: 12,
  },

  primaryButton: {
    backgroundColor: "#2563EB",
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  footer: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 16,
  },
});