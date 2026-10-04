import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { doc, getDoc } from "firebase/firestore";

import { db } from "../firebase/config";
import { logoutUser } from "../firebase/auth";
import { useAuthStore } from "../store/authStore";


// ======================================================
// Types
// ======================================================

type ProfileData = {
  name: string;
  email: string;
};


// ======================================================
// Screen
// ======================================================

export default function ProfileScreen() {
  const user = useAuthStore(
    (state) => state.user
  );

  const [
    profile,
    setProfile,
  ] = useState<ProfileData | null>(null);

  const [
    loading,
    setLoading,
  ] = useState(true);


  // ====================================================
  // Load profile
  // ====================================================

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(
          doc(
            db,
            "users",
            user.uid
          )
        );

        if (userDoc.exists()) {
          const data =
            userDoc.data();

          setProfile({
            name:
              data.name ??
              "User",

            email:
              data.email ??
              user.email ??
              "",
          });
        } else {
          setProfile({
            name: "User",
            email:
              user.email ?? "",
          });
        }

      } catch (error) {
        console.log(
          "PROFILE ERROR:",
          error
        );

        Alert.alert(
          "Lỗi",
          "Không thể tải thông tin tài khoản."
        );

      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);


  // ====================================================
  // Logout
  // ====================================================

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc muốn đăng xuất khỏi tài khoản?",

      [
        {
          text: "Hủy",
          style: "cancel",
        },

        {
          text: "Đăng xuất",
          style: "destructive",

          onPress:
            async () => {
              try {
                await logoutUser();
              } catch (error) {
                Alert.alert(
                  "Lỗi",
                  "Không thể đăng xuất. Vui lòng thử lại."
                );
              }
            },
        },
      ]
    );
  };


  // ====================================================
  // Loading
  // ====================================================

  if (loading) {
    return (
      <SafeAreaView
        style={styles.loadingContainer}
      >
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text
          style={styles.loadingText}
        >
          Đang tải thông tin...
        </Text>
      </SafeAreaView>
    );
  }


  // ====================================================
  // Data
  // ====================================================

  const displayName =
    profile?.name ??
    "User";

  const displayEmail =
    profile?.email ??
    user?.email ??
    "";

  const avatarLetter =
    displayName
      .charAt(0)
      .toUpperCase() || "U";


  // ====================================================
  // Main UI
  // ====================================================

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
      >

        {/* ==========================================
            Header
        ========================================== */}

        <View style={styles.header}>

          <View>
            <Text
              style={styles.headerTitle}
            >
              Hồ sơ
            </Text>

            <Text
              style={styles.headerSubtitle}
            >
              Quản lý tài khoản của bạn
            </Text>
          </View>

        </View>


        {/* ==========================================
            Profile Hero
        ========================================== */}

        <View
          style={styles.profileCard}
        >

          {/* Avatar */}

          <View
            style={styles.avatarWrapper}
          >

            <View
              style={styles.avatar}
            >
              <Text
                style={styles.avatarText}
              >
                {avatarLetter}
              </Text>
            </View>

            <View
              style={styles.onlineDot}
            />

          </View>


          {/* Name */}

          <Text
            style={styles.name}
            numberOfLines={1}
          >
            {displayName}
          </Text>


          {/* Email */}

          <Text
            style={styles.email}
            numberOfLines={1}
          >
            {displayEmail}
          </Text>


          {/* Account status */}

          <View
            style={styles.accountBadge}
          >
            <View
              style={styles.accountDot}
            />

            <Text
              style={styles.accountBadgeText}
            >
              Tài khoản đang hoạt động
            </Text>
          </View>

        </View>


        {/* ==========================================
            Account Information
        ========================================== */}

        <View
          style={styles.section}
        >

          <Text
            style={styles.sectionTitle}
          >
            Thông tin tài khoản
          </Text>

          <View
            style={styles.infoCard}
          >

            {/* Name */}

            <View
              style={styles.infoRow}
            >

              <View
                style={styles.infoIcon}
              >
                <Text
                  style={styles.infoIconText}
                >
                  👤
                </Text>
              </View>

              <View
                style={styles.infoContent}
              >

                <Text
                  style={styles.infoLabel}
                >
                  Họ và tên
                </Text>

                <Text
                  style={styles.infoValue}
                  numberOfLines={1}
                >
                  {displayName}
                </Text>

              </View>

            </View>


            <View
              style={styles.divider}
            />


            {/* Email */}

            <View
              style={styles.infoRow}
            >

              <View
                style={styles.infoIcon}
              >
                <Text
                  style={styles.infoIconText}
                >
                  ✉️
                </Text>
              </View>

              <View
                style={styles.infoContent}
              >

                <Text
                  style={styles.infoLabel}
                >
                  Email
                </Text>

                <Text
                  style={styles.infoValue}
                  numberOfLines={1}
                >
                  {displayEmail}
                </Text>

              </View>

            </View>

          </View>

        </View>


        {/* ==========================================
            Account Section
        ========================================== */}

        <View
          style={styles.section}
        >

          <Text
            style={styles.sectionTitle}
          >
            Tài khoản
          </Text>

          <View
            style={styles.menuCard}
          >

            <View
              style={styles.menuRow}
            >

              <View
                style={styles.menuIcon}
              >
                <Text
                  style={styles.menuIconText}
                >
                  🔐
                </Text>
              </View>

              <View
                style={styles.menuContent}
              >

                <Text
                  style={styles.menuTitle}
                >
                  Bảo mật tài khoản
                </Text>

                <Text
                  style={styles.menuSubtitle}
                >
                  Email và mật khẩu được bảo vệ
                </Text>

              </View>

              <Text
                style={styles.menuArrow}
              >
                ›
              </Text>

            </View>


            <View
              style={styles.divider}
            />


            <View
              style={styles.menuRow}
            >

              <View
                style={styles.menuIcon}
              >
                <Text
                  style={styles.menuIconText}
                >
                  📱
                </Text>
              </View>

              <View
                style={styles.menuContent}
              >

                <Text
                  style={styles.menuTitle}
                >
                  StudyRoom
                </Text>

                <Text
                  style={styles.menuSubtitle}
                >
                  Ứng dụng đặt phòng học tập
                </Text>

              </View>

              <Text
                style={styles.version}
              >
                v1.0
              </Text>

            </View>

          </View>

        </View>


        {/* ==========================================
            Logout
        ========================================== */}

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed &&
              styles.logoutButtonPressed,
          ]}
          onPress={handleLogout}
        >

          <View
            style={styles.logoutIcon}
          >
            <Text
              style={styles.logoutIconText}
            >
              ↪
            </Text>
          </View>

          <Text
            style={styles.logoutText}
          >
            Đăng xuất
          </Text>

        </Pressable>


        {/* Footer */}

        <Text
          style={styles.footer}
        >
          StudyRoom • Quản lý phòng học tập
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}


// ======================================================
// Styles
// ======================================================

const styles =
  StyleSheet.create({

    // ==================================================
    // Container
    // ==================================================

    container: {
      flex: 1,
      backgroundColor: "#EAF4FF",
    },

    scrollContent: {
      paddingBottom: 36,
    },


    // ==================================================
    // Loading
    // ==================================================

    loadingContainer: {
      flex: 1,
      backgroundColor: "#EAF4FF",
      justifyContent: "center",
      alignItems: "center",
    },

    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: "#64748B",
    },


    // ==================================================
    // Header
    // ==================================================

    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 14,
    },

    headerTitle: {
      fontSize: 28,
      fontWeight: "800",
      color: "#0F172A",
    },

    headerSubtitle: {
      marginTop: 5,
      fontSize: 14,
      color: "#64748B",
    },


    // ==================================================
    // Profile Hero
    // ==================================================

    profileCard: {
      marginHorizontal: 16,
      backgroundColor: "#FFFFFF",
      borderRadius: 24,
      paddingVertical: 28,
      paddingHorizontal: 20,
      alignItems: "center",

      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 10,

      shadowOffset: {
        width: 0,
        height: 4,
      },

      elevation: 3,
    },

    avatarWrapper: {
      position: "relative",
      marginBottom: 14,
    },

    avatar: {
      width: 92,
      height: 92,
      borderRadius: 46,
      backgroundColor: "#DBEAFE",
      alignItems: "center",
      justifyContent: "center",

      borderWidth: 5,
      borderColor: "#EFF6FF",
    },

    avatarText: {
      color: "#2563EB",
      fontSize: 34,
      fontWeight: "800",
    },

    onlineDot: {
      position: "absolute",
      right: 2,
      bottom: 4,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "#22C55E",
      borderWidth: 4,
      borderColor: "#FFFFFF",
    },

    name: {
      maxWidth: "90%",
      color: "#0F172A",
      fontSize: 22,
      fontWeight: "800",
    },

    email: {
      maxWidth: "90%",
      marginTop: 5,
      color: "#64748B",
      fontSize: 14,
    },

    accountBadge: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 14,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: "#F0FDF4",
    },

    accountDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: "#22C55E",
      marginRight: 7,
    },

    accountBadgeText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#15803D",
    },


    // ==================================================
    // Sections
    // ==================================================

    section: {
      marginTop: 22,
      marginHorizontal: 16,
    },

    sectionTitle: {
      marginLeft: 3,
      marginBottom: 10,
      fontSize: 17,
      fontWeight: "800",
      color: "#0F172A",
    },


    // ==================================================
    // Information Card
    // ==================================================

    infoCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 6,

      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowRadius: 8,

      shadowOffset: {
        width: 0,
        height: 2,
      },

      elevation: 2,
    },

    infoRow: {
      minHeight: 72,
      flexDirection: "row",
      alignItems: "center",
    },

    infoIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: "#EFF6FF",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 13,
    },

    infoIconText: {
      fontSize: 19,
    },

    infoContent: {
      flex: 1,
    },

    infoLabel: {
      fontSize: 12,
      color: "#94A3B8",
      marginBottom: 4,
    },

    infoValue: {
      fontSize: 15,
      fontWeight: "700",
      color: "#334155",
    },

    divider: {
      height: 1,
      backgroundColor: "#E2E8F0",
    },


    // ==================================================
    // Menu Card
    // ==================================================

    menuCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 4,

      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowRadius: 8,

      shadowOffset: {
        width: 0,
        height: 2,
      },

      elevation: 2,
    },

    menuRow: {
      minHeight: 72,
      flexDirection: "row",
      alignItems: "center",
    },

    menuIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: "#F8FAFC",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 13,
    },

    menuIconText: {
      fontSize: 18,
    },

    menuContent: {
      flex: 1,
    },

    menuTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#334155",
    },

    menuSubtitle: {
      marginTop: 4,
      fontSize: 12,
      color: "#94A3B8",
    },

    menuArrow: {
      fontSize: 28,
      fontWeight: "300",
      color: "#CBD5E1",
      marginLeft: 8,
    },

    version: {
      fontSize: 12,
      fontWeight: "700",
      color: "#94A3B8",
    },


    // ==================================================
    // Logout
    // ==================================================

    logoutButton: {
      height: 52,
      marginHorizontal: 16,
      marginTop: 24,
      borderRadius: 15,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      backgroundColor: "#FEF2F2",
      borderWidth: 1,
      borderColor: "#FECACA",
    },

    logoutButtonPressed: {
      opacity: 0.7,
      transform: [
        {
          scale: 0.99,
        },
      ],
    },

    logoutIcon: {
      width: 30,
      height: 30,
      borderRadius: 10,
      backgroundColor: "#FEE2E2",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 9,
    },

    logoutIconText: {
      fontSize: 18,
      fontWeight: "800",
      color: "#DC2626",
    },

    logoutText: {
      color: "#DC2626",
      fontSize: 15,
      fontWeight: "800",
    },


    // ==================================================
    // Footer
    // ==================================================

    footer: {
      marginTop: 22,
      textAlign: "center",
      fontSize: 11,
      color: "#94A3B8",
    },

  });

