import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { registerUser } from "../firebase/auth";
import { db } from "../firebase/config";

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert("Thiếu thông tin", "Vui lòng điền đầy đủ thông tin.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Mật khẩu chưa hợp lệ",
        "Mật khẩu phải có ít nhất 6 ký tự."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setLoading(true);

      const credential = await registerUser(
        email.trim(),
        password
      );

      await setDoc(doc(db, "users", credential.user.uid), {
        name: name.trim(),
        email: email.trim(),
        createdAt: serverTimestamp(),
      });

      Alert.alert(
        "Thành công",
        "Tài khoản đã được tạo thành công!"
      );
    } catch (error: any) {
      let message = "Không thể tạo tài khoản. Vui lòng thử lại.";

      if (error?.code === "auth/email-already-in-use") {
        message = "Email này đã được sử dụng.";
      } else if (error?.code === "auth/invalid-email") {
        message = "Địa chỉ email không hợp lệ.";
      } else if (error?.code === "auth/weak-password") {
        message = "Mật khẩu quá yếu.";
      } else if (error?.code === "permission-denied") {
        message = "Firestore chưa cho phép lưu dữ liệu người dùng.";
      }

      Alert.alert("Đăng ký thất bại", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>‹  Quay lại</Text>
        </Pressable>

        <View style={styles.heading}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>SR</Text>
          </View>

          <Text style={styles.title}>Tạo tài khoản</Text>
          <Text style={styles.subtitle}>
            Tham gia StudyRoom để đặt phòng học
            và quản lý lịch học của bạn.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập họ và tên"
            placeholderTextColor="#94A3B8"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="example@email.com"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="Ít nhất 6 ký tự"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.label}>Xác nhận mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập lại mật khẩu"
            placeholderTextColor="#94A3B8"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Pressable
            style={[
              styles.button,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
            </Text>
          </Pressable>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>
              Đã có tài khoản?
            </Text>

            <Pressable
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.loginLink}> Đăng nhập</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
  },
  backText: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "500",
  },
  heading: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 32,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "800",
  },
  title: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 10,
    maxWidth: 300,
  },
  form: {
    width: "100%",
  },
  label: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#0F172A",
  },
  button: {
    height: 54,
    backgroundColor: "#2563EB",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginText: {
    color: "#64748B",
    fontSize: 14,
  },
  loginLink: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "700",
  },
});