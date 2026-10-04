
import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { useFocusEffect } from "@react-navigation/native";

import { getAuth } from "firebase/auth";

import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase/config";
import { rooms } from "../data/rooms";
import { Booking } from "../types";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";


// ======================================================
// Helpers
// ======================================================

/**
 * Chuyển ngày + giờ thành Date local.
 *
 * Ví dụ:
 * 2026-10-02 + 09:00
 * => 02/10/2026 09:00
 */
const getBookingStartDate = (
  date: string,
  startTime: string
) => {
  return new Date(
    `${date}T${startTime}:00`
  );
};


/**
 * Kiểm tra booking đã bắt đầu chưa.
 *
 * Nếu hiện tại >= giờ bắt đầu
 * => không được hủy nữa.
 */
const isBookingStarted = (
  booking: Booking,
  currentTime: Date
) => {
  const startDate = getBookingStartDate(
    booking.date,
    booking.startTime
  );

  return (
    startDate.getTime() <=
    currentTime.getTime()
  );
};


/**
 * 2026-10-02
 * =>
 * 02/10/2026
 */
const formatDate = (
  date: string
) => {
  const [
    year,
    month,
    day,
  ] = date.split("-");

  if (
    !year ||
    !month ||
    !day
  ) {
    return date;
  }

  return `${day}/${month}/${year}`;
};


// ======================================================
// Fetch bookings
// ======================================================

const fetchBookings = async (
  userId: string
): Promise<Booking[]> => {
  const bookingsQuery =
    query(
      collection(db, "bookings"),
      where("userId", "==", userId)
    );

  const snapshot =
    await getDocs(bookingsQuery);

  const data =
    snapshot.docs.map(
      (document) => {
        const bookingData =
          document.data();

        return {
          id: document.id,
          ...bookingData,
        } as Booking;
      }
    );

  // Sort theo ngày + giờ bắt đầu
  data.sort(
    (a, b) => {
      const dateA =
        getBookingStartDate(
          a.date,
          a.startTime
        ).getTime();

      const dateB =
        getBookingStartDate(
          b.date,
          b.startTime
        ).getTime();

      return dateA - dateB;
    }
  );

  return data;
};


// ======================================================
// Screen
// ======================================================

export default function MyBookingsScreen() {
  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  /**
   * Thời gian hiện tại.
   *
   * Cập nhật mỗi 30 giây để booking
   * tự động chuyển từ "Sắp tới"
   * sang "Đã kết thúc".
   */
  const [
    currentTime,
    setCurrentTime,
  ] = useState(
    new Date()
  );

  const user =
    getAuth().currentUser;

  const queryClient =
    useQueryClient();


  // ====================================================
  // Update current time
  // ====================================================

  useEffect(() => {
    const timer =
      setInterval(() => {
        setCurrentTime(
          new Date()
        );
      }, 30000);

    return () => {
      clearInterval(timer);
    };
  }, []);


  // ====================================================
  // TanStack Query - Load bookings
  // ====================================================

  const {
    data: bookingList = [],
    isLoading: loading,
    isError,
    refetch,
  } = useQuery<Booking[]>({
    queryKey: [
      "bookings",
      user?.uid ?? null,
    ],

    queryFn: async () => {
      const currentUser =
        getAuth().currentUser;

      if (!currentUser) {
        return [];
      }

      console.log(
        "Loading bookings for:",
        currentUser.uid
      );

      const response =
        await fetchBookings(
          currentUser.uid
        );

      console.log(
        "Bookings found:",
        response.length
      );

      return response;
    },

    enabled: !!user,
  });


  // ====================================================
  // Handle query errors
  // ====================================================

  useEffect(() => {
    if (isError) {
      Alert.alert(
        "Lỗi",
        "Không thể tải danh sách đặt phòng."
      );
    }
  }, [isError]);


  // ====================================================
  // Reload when opening Bookings tab
  // ====================================================

  useFocusEffect(
    useCallback(() => {
      setCurrentTime(
        new Date()
      );

      refetch();
    }, [refetch])
  );


  // ====================================================
  // Pull to refresh
  // ====================================================

  const handleRefresh =
    async () => {
      setRefreshing(true);

      setCurrentTime(
        new Date()
      );

      try {
        await refetch();
      } finally {
        setRefreshing(false);
      }
    };


  // ====================================================
  // Cancel mutation
  // ====================================================

  const cancelBookingMutation =
    useMutation({
      mutationFn: async (
        bookingId: string
      ) => {
        await updateDoc(
          doc(
            db,
            "bookings",
            bookingId
          ),
          {
            status: "cancelled",
          }
        );
      },

      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [
            "bookings",
            user?.uid ?? null,
          ],
        });

        Alert.alert(
          "Thành công",
          "Đã hủy đặt phòng."
        );
      },

      onError: (error) => {
        console.log(
          "CANCEL BOOKING ERROR:",
          error
        );

        Alert.alert(
          "Lỗi",
          "Không thể hủy đặt phòng."
        );
      },
    });


  // ====================================================
  // Cancel booking
  // ====================================================

  const handleCancel = (
    booking: Booking
  ) => {

    // Kiểm tra trước khi mở Alert
    if (
      isBookingStarted(
        booking,
        currentTime
      )
    ) {
      Alert.alert(
        "Không thể hủy",
        "Booking này đã bắt đầu hoặc đã qua thời gian đặt phòng."
      );

      return;
    }


    Alert.alert(
      "Hủy đặt phòng",

      `Bạn có chắc muốn hủy phòng vào ${formatDate(
        booking.date
      )} từ ${booking.startTime} đến ${booking.endTime}?`,

      [
        {
          text: "Không",
          style: "cancel",
        },

        {
          text: "Hủy đặt phòng",
          style: "destructive",

          onPress: () => {
            // Kiểm tra lại thời gian ngay trước khi hủy.
            const latestTime =
              new Date();

            if (
              isBookingStarted(
                booking,
                latestTime
              )
            ) {
              Alert.alert(
                "Không thể hủy",
                "Booking này đã bắt đầu hoặc đã qua thời gian đặt phòng."
              );

              setCurrentTime(
                latestTime
              );

              return;
            }

            cancelBookingMutation.mutate(
              booking.id
            );
          },
        },
      ]
    );
  };


  // ====================================================
  // Get room information
  // ====================================================

  const getRoomInfo = (
    roomId: string
  ) => {
    return rooms.find(
      (room) =>
        room.id === roomId
    );
  };


  // ====================================================
  // Booking groups
  // ====================================================

  /**
   * Booking sắp tới:
   * - confirmed
   * - chưa tới giờ bắt đầu
   */
  const upcomingBookings =
    bookingList
      .filter(
        (booking) => {
          if (
            booking.status ===
            "cancelled"
          ) {
            return false;
          }

          return !isBookingStarted(
            booking,
            currentTime
          );
        }
      )
      .sort(
        (a, b) => {
          const dateA =
            getBookingStartDate(
              a.date,
              a.startTime
            ).getTime();

          const dateB =
            getBookingStartDate(
              b.date,
              b.startTime
            ).getTime();

          return dateA - dateB;
        }
      );


  /**
   * Booking đã bắt đầu:
   * - confirmed
   * - đã tới giờ bắt đầu
   */
  const pastBookings =
    bookingList
      .filter(
        (booking) => {
          if (
            booking.status ===
            "cancelled"
          ) {
            return false;
          }

          return isBookingStarted(
            booking,
            currentTime
          );
        }
      )
      .sort(
        (a, b) => {
          const dateA =
            getBookingStartDate(
              a.date,
              a.startTime
            ).getTime();

          const dateB =
            getBookingStartDate(
              b.date,
              b.startTime
            ).getTime();

          return dateB - dateA;
        }
      );


  /**
   * Booking đã hủy.
   */
  const cancelledBookings =
    bookingList
      .filter(
        (booking) =>
          booking.status ===
          "cancelled"
      )
      .sort(
        (a, b) => {
          const dateA =
            getBookingStartDate(
              a.date,
              a.startTime
            ).getTime();

          const dateB =
            getBookingStartDate(
              b.date,
              b.startTime
            ).getTime();

          return dateB - dateA;
        }
      );


  // ====================================================
  // Render booking card
  // ====================================================

  const renderBooking = (
    booking: Booking
  ) => {
    const room =
      getRoomInfo(
        booking.roomId
      );

    const isCancelled =
      booking.status ===
      "cancelled";

    const hasStarted =
      isBookingStarted(
        booking,
        currentTime
      );


    return (
      <View
        key={booking.id}
        style={styles.card}
      >

        {/* ==========================================
            Header
        ========================================== */}

        <View
          style={styles.cardHeader}
        >

          <View
            style={styles.roomInfo}
          >

            <Text
              style={styles.roomName}
              numberOfLines={1}
            >
              {room?.name ??
                booking.roomId}
            </Text>

            <Text
              style={styles.building}
            >
              {room?.building ??
                "Không xác định"}
            </Text>

          </View>


          {/* Status */}

          <View
            style={[
              styles.statusBadge,

              isCancelled
                ? styles.cancelledBadge
                : hasStarted
                ? styles.finishedBadge
                : styles.confirmedBadge,
            ]}
          >

            <Text
              style={[
                styles.statusText,

                isCancelled
                  ? styles.cancelledText
                  : hasStarted
                  ? styles.finishedText
                  : styles.confirmedText,
              ]}
            >
              {isCancelled
                ? "Đã hủy"
                : hasStarted
                ? "Đã kết thúc"
                : "Đã đặt"}
            </Text>

          </View>

        </View>


        {/* ==========================================
            Date
        ========================================== */}

        <View
          style={styles.infoRow}
        >

          <Text
            style={styles.icon}
          >
            📅
          </Text>

          <View>
            <Text
              style={styles.infoLabel}
            >
              Ngày
            </Text>

            <Text
              style={styles.infoValue}
            >
              {formatDate(
                booking.date
              )}
            </Text>
          </View>

        </View>


        {/* ==========================================
            Time
        ========================================== */}

        <View
          style={styles.infoRow}
        >

          <Text
            style={styles.icon}
          >
            🕐
          </Text>

          <View>
            <Text
              style={styles.infoLabel}
            >
              Thời gian
            </Text>

            <Text
              style={styles.infoValue}
            >
              {booking.startTime}
              {" - "}
              {booking.endTime}
            </Text>
          </View>

        </View>


        {/* ==========================================
            User
        ========================================== */}

        <View
          style={styles.infoRow}
        >

          <Text
            style={styles.icon}
          >
            👤
          </Text>

          <View>
            <Text
              style={styles.infoLabel}
            >
              Người đặt
            </Text>

            <Text
              style={styles.infoValue}
            >
              {booking.userName}
            </Text>
          </View>

        </View>


        {/* ==========================================
            Upcoming
        ========================================== */}

        {!isCancelled &&
          !hasStarted && (
            <TouchableOpacity
              style={
                styles.cancelButton
              }
              onPress={() =>
                handleCancel(
                  booking
                )
              }
              activeOpacity={0.8}
            >
              <Text
                style={
                  styles.cancelButtonText
                }
              >
                Hủy đặt phòng
              </Text>
            </TouchableOpacity>
          )}


        {/* ==========================================
            Finished
        ========================================== */}

        {!isCancelled &&
          hasStarted && (
            <View
              style={
                styles.lockedBox
              }
            >
              <Text
                style={
                  styles.lockedIcon
                }
              >
                🔒
              </Text>

              <Text
                style={
                  styles.lockedText
                }
              >
                Booking đã bắt đầu
              </Text>
            </View>
          )}

      </View>
    );
  };


  // ====================================================
  // Section header
  // ====================================================

  const renderSectionHeader = (
    title: string,
    subtitle: string,
    count: number,
    type:
      | "upcoming"
      | "finished"
      | "cancelled"
  ) => {

    return (
      <View
        style={
          styles.sectionHeader
        }
      >

        <View
          style={
            styles.sectionTitleContainer
          }
        >

          <Text
            style={
              styles.sectionTitle
            }
          >
            {title}
          </Text>

          <Text
            style={
              styles.sectionSubtitle
            }
          >
            {subtitle}
          </Text>

        </View>


        <View
          style={[
            styles.countBadge,

            type === "finished" &&
              styles.finishedCountBadge,

            type === "cancelled" &&
              styles.cancelledCountBadge,
          ]}
        >

          <Text
            style={[
              styles.countText,

              type === "finished" &&
                styles.finishedCountText,

              type === "cancelled" &&
                styles.cancelledCountText,
            ]}
          >
            {count}
          </Text>

        </View>

      </View>
    );
  };


  // ====================================================
  // Loading
  // ====================================================

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >

        <View
          style={
            styles.loadingContainer
          }
        >

          <ActivityIndicator
            size="large"
            color="#2563EB"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Đang tải lịch đặt phòng...
          </Text>

        </View>

      </SafeAreaView>
    );
  }


  // ====================================================
  // Empty
  // ====================================================

  if (
    bookingList.length === 0
  ) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top"]}
      >

        <View
          style={styles.header}
        >

          <Text
            style={styles.title}
          >
            Lịch đặt phòng
          </Text>

          <Text
            style={styles.subtitle}
          >
            Quản lý các phòng bạn đã đặt
          </Text>

        </View>


        <ScrollView
          contentContainerStyle={
            styles.emptyContainer
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={
                handleRefresh
              }
            />
          }
        >

          <View
            style={styles.emptyBox}
          >

            <Text
              style={styles.emptyIcon}
            >
              📅
            </Text>

            <Text
              style={styles.emptyTitle}
            >
              Chưa có lịch đặt phòng
            </Text>

            <Text
              style={styles.emptyText}
            >
              Các phòng bạn đặt sẽ
              xuất hiện ở đây.
            </Text>

          </View>

        </ScrollView>

      </SafeAreaView>
    );
  }


  // ====================================================
  // Main UI
  // ====================================================

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >

      {/* ==========================================
          Header
      ========================================== */}

      <View
        style={styles.header}
      >

        <Text
          style={styles.title}
        >
          Lịch đặt phòng
        </Text>

        <Text
          style={styles.subtitle}
        >
          Quản lý các phòng bạn đã đặt
        </Text>

      </View>


      {/* ==========================================
          Content
      ========================================== */}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={
              handleRefresh
            }
            tintColor="#2563EB"
          />
        }
      >

        {/* ========================================
            UPCOMING
        ======================================== */}

        {upcomingBookings.length >
          0 && (
          <View
            style={
              styles.bookingSection
            }
          >

            {renderSectionHeader(
              "Sắp tới",
              "Những lịch bạn có thể hủy",
              upcomingBookings.length,
              "upcoming"
            )}


            {upcomingBookings.map(
              (booking) =>
                renderBooking(
                  booking
                )
            )}

          </View>
        )}


        {/* ========================================
            NO UPCOMING
        ======================================== */}

        {upcomingBookings.length ===
          0 && (
          <View
            style={
              styles.noUpcomingBox
            }
          >

            <View
              style={
                styles.noUpcomingIconBox
              }
            >
              <Text
                style={
                  styles.noUpcomingIcon
                }
              >
                📅
              </Text>
            </View>

            <View
              style={
                styles.noUpcomingContent
              }
            >

              <Text
                style={
                  styles.noUpcomingTitle
                }
              >
                Không có lịch sắp tới
              </Text>

              <Text
                style={
                  styles.noUpcomingText
                }
              >
                Các lịch đặt mới của bạn
                sẽ xuất hiện ở đây.
              </Text>

            </View>

          </View>
        )}


        {/* ========================================
            FINISHED
        ======================================== */}

        {pastBookings.length >
          0 && (
          <View
            style={
              styles.bookingSection
            }
          >

            {renderSectionHeader(
              "Đã kết thúc",
              "Các lịch đã qua thời gian bắt đầu",
              pastBookings.length,
              "finished"
            )}


            {pastBookings.map(
              (booking) =>
                renderBooking(
                  booking
                )
            )}

          </View>
        )}


        {/* ========================================
            CANCELLED
        ======================================== */}

        {cancelledBookings.length >
          0 && (
          <View
            style={
              styles.bookingSection
            }
          >

            {renderSectionHeader(
              "Đã hủy",
              "Những lịch đặt đã được hủy",
              cancelledBookings.length,
              "cancelled"
            )}


            {cancelledBookings.map(
              (booking) =>
                renderBooking(
                  booking
                )
            )}

          </View>
        )}

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
      backgroundColor:
        "#EAF4FF",
    },


    // ==================================================
    // Header
    // ==================================================

    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 14,
    },

    title: {
      fontSize: 28,
      fontWeight: "800",
      color: "#0F172A",
    },

    subtitle: {
      marginTop: 5,
      fontSize: 14,
      color: "#64748B",
    },


    // ==================================================
    // Scroll
    // ==================================================

    scrollView: {
      flex: 1,
    },

    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 30,
    },


    // ==================================================
    // Loading
    // ==================================================

    loadingContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems: "center",
    },

    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: "#64748B",
    },


    // ==================================================
    // Section
    // ==================================================

    bookingSection: {
      marginBottom: 8,
    },

    sectionHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginTop: 8,
      marginBottom: 12,
      paddingHorizontal: 2,
    },

    sectionTitleContainer: {
      flex: 1,
      paddingRight: 12,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: "#0F172A",
    },

    sectionSubtitle: {
      marginTop: 3,
      fontSize: 12,
      color: "#94A3B8",
    },


    // ==================================================
    // Count
    // ==================================================

    countBadge: {
      minWidth: 32,
      height: 32,
      paddingHorizontal: 9,
      borderRadius: 16,
      backgroundColor:
        "#DBEAFE",
      justifyContent:
        "center",
      alignItems: "center",
    },

    countText: {
      fontSize: 13,
      fontWeight: "800",
      color: "#2563EB",
    },

    finishedCountBadge: {
      backgroundColor:
        "#E2E8F0",
    },

    finishedCountText: {
      color: "#64748B",
    },

    cancelledCountBadge: {
      backgroundColor:
        "#FEE2E2",
    },

    cancelledCountText: {
      color: "#DC2626",
    },


    // ==================================================
    // Card
    // ==================================================

    card: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 18,
      padding: 16,
      marginBottom: 14,

      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 8,

      shadowOffset: {
        width: 0,
        height: 3,
      },

      elevation: 2,
    },


    // ==================================================
    // Card Header
    // ==================================================

    cardHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
      marginBottom: 18,
    },

    roomInfo: {
      flex: 1,
      paddingRight: 10,
    },

    roomName: {
      fontSize: 18,
      fontWeight: "800",
      color: "#0F172A",
    },

    building: {
      marginTop: 4,
      fontSize: 13,
      color: "#64748B",
    },


    // ==================================================
    // Status
    // ==================================================

    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
    },

    confirmedBadge: {
      backgroundColor:
        "#DCFCE7",
    },

    cancelledBadge: {
      backgroundColor:
        "#FEE2E2",
    },

    finishedBadge: {
      backgroundColor:
        "#E2E8F0",
    },

    statusText: {
      fontSize: 12,
      fontWeight: "700",
    },

    confirmedText: {
      color: "#15803D",
    },

    cancelledText: {
      color: "#B91C1C",
    },

    finishedText: {
      color: "#475569",
    },


    // ==================================================
    // Info
    // ==================================================

    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 14,
    },

    icon: {
      width: 34,
      fontSize: 20,
    },

    infoLabel: {
      fontSize: 12,
      color: "#94A3B8",
      marginBottom: 2,
    },

    infoValue: {
      fontSize: 15,
      fontWeight: "600",
      color: "#334155",
    },


    // ==================================================
    // Cancel Button
    // ==================================================

    cancelButton: {
      marginTop: 4,
      height: 46,
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        "#FCA5A5",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    cancelButtonText: {
      color: "#DC2626",
      fontSize: 14,
      fontWeight: "700",
    },


    // ==================================================
    // Locked
    // ==================================================

    lockedBox: {
      marginTop: 4,
      height: 44,
      borderRadius: 12,
      backgroundColor:
        "#F8FAFC",
      justifyContent:
        "center",
      alignItems:
        "center",
      flexDirection: "row",
    },

    lockedIcon: {
      fontSize: 14,
      marginRight: 6,
    },

    lockedText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#94A3B8",
    },


    // ==================================================
    // No Upcoming
    // ==================================================

    noUpcomingBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        "#FFFFFF",
      borderRadius: 16,
      padding: 16,
      marginTop: 8,
      marginBottom: 18,
      borderWidth: 1,
      borderColor:
        "#E2E8F0",
    },

    noUpcomingIconBox: {
      width: 46,
      height: 46,
      borderRadius: 14,
      backgroundColor:
        "#EFF6FF",
      justifyContent:
        "center",
      alignItems:
        "center",
      marginRight: 12,
    },

    noUpcomingIcon: {
      fontSize: 23,
    },

    noUpcomingContent: {
      flex: 1,
    },

    noUpcomingTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: "#334155",
    },

    noUpcomingText: {
      marginTop: 4,
      fontSize: 12,
      lineHeight: 18,
      color: "#94A3B8",
    },


    // ==================================================
    // Empty
    // ==================================================

    emptyContainer: {
      flexGrow: 1,
      justifyContent:
        "center",
      paddingHorizontal: 24,
      paddingBottom: 80,
    },

    emptyBox: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 20,
      padding: 30,
      alignItems:
        "center",
    },

    emptyIcon: {
      fontSize: 48,
      marginBottom: 14,
    },

    emptyTitle: {
      fontSize: 19,
      fontWeight: "800",
      color: "#0F172A",
      textAlign: "center",
    },

    emptyText: {
      marginTop: 8,
      fontSize: 14,
      lineHeight: 21,
      color: "#64748B",
      textAlign: "center",
    },

  });