import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { db } from "../firebase/config";
import {
  getBookingsForRoomAndDate,
  createBooking,
} from "../services/bookingService";
import { rooms } from "../data/rooms";
import { Room } from "../types";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "RoomDetail"
>;

/* =========================
   TIME SLOTS
   ========================= */

const timeSlots = [
  {
    id: "09:00-10:00",
    startTime: "09:00",
    endTime: "10:00",
  },
  {
    id: "10:00-11:00",
    startTime: "10:00",
    endTime: "11:00",
  },
  {
    id: "11:00-12:00",
    startTime: "11:00",
    endTime: "12:00",
  },
  {
    id: "13:00-14:00",
    startTime: "13:00",
    endTime: "14:00",
  },
  {
    id: "14:00-15:00",
    startTime: "14:00",
    endTime: "15:00",
  },
  {
    id: "15:00-16:00",
    startTime: "15:00",
    endTime: "16:00",
  },
];

/* =========================
   DATE HELPERS
   ========================= */

const formatDate = (date: Date) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDayName = (date: Date) => {
  const days = [
    "CN",
    "T2",
    "T3",
    "T4",
    "T5",
    "T6",
    "T7",
  ];

  return days[date.getDay()];
};

const formatDisplayDate = (dateString: string) => {
  const [year, month, day] =
    dateString.split("-");

  return `${day}/${month}/${year}`;
};

/* =========================
   SCREEN
   ========================= */

export default function RoomDetailScreen({
  route,
  navigation,
}: Props) {
  const { roomId } = route.params;

  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] =
    useState(formatDate(new Date()));

  const [selectedSlot, setSelectedSlot] =
    useState<string | null>(null);

  const [booking, setBooking] =
    useState(false);

  const [showConfirmModal, setShowConfirmModal] =
    useState(false);

  /* =========================
     7 NGÀY TIẾP THEO
     ========================= */

  const dates = Array.from(
    { length: 7 },
    (_, index) => {
      const date = new Date();

      date.setDate(
        date.getDate() + index
      );

      return date;
    }
  );

  /* =========================
     ROOM QUERY
     ========================= */

  const {
    data: room = null,
    isLoading: loading,
  } = useQuery<Room | null>({
    queryKey: ["room", roomId],

    queryFn: async () => {
      try {
        const roomRef = doc(
          db,
          "rooms",
          roomId
        );

        const snapshot =
          await getDoc(roomRef);

        if (snapshot.exists()) {
          return {
            id: snapshot.id,
            ...snapshot.data(),
          } as Room;
        }

        /*
         * Nếu Firestore không có phòng
         * thì lấy dữ liệu local.
         */
        const localRoom =
          rooms.find(
            (item) =>
              item.id === roomId
          );

        return localRoom ?? null;
      } catch (error) {
        console.log(
          "LOAD ROOM ERROR:",
          error
        );

        const localRoom =
          rooms.find(
            (item) =>
              item.id === roomId
          );

        return localRoom ?? null;
      }
    },

    enabled: !!roomId,

    staleTime: 1000 * 60 * 5,
  });

  /* =========================
     BOOKING QUERY
     ========================= */

  const {
    data: bookings = [],
    isLoading: loadingSlots,
  } = useQuery<any[]>({
    queryKey: [
      "roomBookings",
      roomId,
      selectedDate,
    ],

    queryFn: () =>
      getBookingsForRoomAndDate(
        roomId,
        selectedDate
      ),

    enabled:
      !!roomId &&
      !!selectedDate,

    staleTime: 0,
  });

  /* =========================
     SLOT ĐÃ ĐẶT
     ========================= */

  const bookedSlots = bookings.map(
    (item: any) =>
      `${item.startTime}-${item.endTime}`
  );

  /*
   * Nếu slot đang chọn vừa bị người khác
   * đặt thì tự động bỏ chọn.
   */

  useEffect(() => {
    if (
      selectedSlot &&
      bookedSlots.includes(selectedSlot)
    ) {
      setSelectedSlot(null);
    }
  }, [bookedSlots, selectedSlot]);

  /* =========================
     CHỌN NGÀY
     ========================= */

  const handleSelectDate = (
    date: string
  ) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  /* =========================
     BẮT ĐẦU BOOKING
     ========================= */

  const handleBooking = () => {
    if (!selectedSlot) {
      Alert.alert(
        "Chưa chọn thời gian",
        "Vui lòng chọn một khung giờ."
      );

      return;
    }

    if (booking) {
      return;
    }

    /*
     * Kiểm tra nhanh ở UI.
     */

    if (
      bookedSlots.includes(selectedSlot)
    ) {
      Alert.alert(
        "Khung giờ đã được đặt",
        "Khung giờ này đã có người đặt. Vui lòng chọn khung giờ khác."
      );

      return;
    }

    setShowConfirmModal(true);
  };

  /* =========================
     XÁC NHẬN BOOKING
     ========================= */

  const confirmBooking = async () => {
    if (!selectedSlot) {
      return;
    }

    if (booking) {
      return;
    }

    const selectedTime =
      timeSlots.find(
        (slot) =>
          slot.id === selectedSlot
      );

    if (!selectedTime) {
      return;
    }

    /*
     * Kiểm tra lại trước khi ghi.
     */

    if (
      bookedSlots.includes(selectedSlot)
    ) {
      setShowConfirmModal(false);

      Alert.alert(
        "Khung giờ đã được đặt",
        "Khung giờ này vừa được người khác đặt. Vui lòng chọn khung giờ khác."
      );

      return;
    }

    try {
      setBooking(true);

      const auth = getAuth();

      const user = auth.currentUser;

      if (!user) {
        setShowConfirmModal(false);

        Alert.alert(
          "Chưa đăng nhập",
          "Vui lòng đăng nhập lại."
        );

        return;
      }

      /* =========================
         LẤY THÔNG TIN USER
         ========================= */

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      const userSnapshot =
        await getDoc(userRef);

      const userData =
        userSnapshot.exists()
          ? userSnapshot.data()
          : null;

      const userName =
        userData?.name ||
        user.displayName ||
        user.email ||
        "Người dùng";

      /* =========================
         TẠO BOOKING
         ========================= */

      await createBooking({
        roomId,
        userId: user.uid,
        userName,
        date: selectedDate,
        startTime:
          selectedTime.startTime,
        endTime:
          selectedTime.endTime,
      });

      /* =========================
         RESET UI
         ========================= */

      setShowConfirmModal(false);
      setSelectedSlot(null);

      /* =========================
         REFRESH ROOM BOOKINGS
         ========================= */

      await queryClient.invalidateQueries({
        queryKey: [
          "roomBookings",
          roomId,
          selectedDate,
        ],
      });

      /* =========================
         REFRESH MY BOOKINGS
         ========================= */

      await queryClient.invalidateQueries({
        queryKey: [
          "bookings",
          user.uid,
        ],
      });

      /* =========================
         SUCCESS
         ========================= */

      Alert.alert(
        "Đặt phòng thành công",
        `${room?.name ?? "Phòng"}\n${formatDisplayDate(
          selectedDate
        )}\n${selectedTime.startTime} - ${selectedTime.endTime}`,
        [
          {
            text: "Xem lịch đặt",

            onPress: () => {
              navigation.navigate(
                "MainTabs",
                {
                  screen: "Bookings",
                }
              );
            },
          },

          {
            text: "Ở lại",
            style: "cancel",
          },
        ]
      );
    } catch (error: any) {
      console.log(
        "CREATE BOOKING ERROR:",
        error
      );

      /*
       * Người khác vừa đặt slot.
       */

      if (
        error?.message ===
        "SLOT_ALREADY_BOOKED"
      ) {
        setShowConfirmModal(false);

        Alert.alert(
          "Khung giờ vừa được đặt",
          "Một người khác đã đặt khung giờ này trước bạn. Vui lòng chọn khung giờ khác."
        );

        await queryClient.invalidateQueries({
          queryKey: [
            "roomBookings",
            roomId,
            selectedDate,
          ],
        });

        return;
      }

      setShowConfirmModal(false);

      Alert.alert(
        "Đặt phòng thất bại",
        "Không thể đặt phòng lúc này. Vui lòng thử lại."
      );
    } finally {
      setBooking(false);
    }
  };

  /* =========================
     LOADING
     ========================= */

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
            Đang tải phòng...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /* =========================
     KHÔNG TÌM THẤY PHÒNG
     ========================= */

  if (!room) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={
            styles.loadingContainer
          }
        >
          <Text
            style={styles.errorTitle}
          >
            Không tìm thấy phòng
          </Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              navigation.goBack()
            }
          >
            <Text
              style={
                styles.backButtonText
              }
            >
              Quay lại
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* =========================
     SELECTED TIME
     ========================= */

  const selectedTime =
    timeSlots.find(
      (slot) =>
        slot.id === selectedSlot
    );

  /* =========================
     UI
     ========================= */

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
        {/* =========================
            ROOM IMAGE
            ========================= */}

        {room.image ? (
          <Image
            source={{
              uri: room.image,
            }}
            style={styles.roomImage}
          />
        ) : (
          <View
            style={
              styles.imagePlaceholder
            }
          >
            <Text
              style={
                styles.placeholderIcon
              }
            >
              🏫
            </Text>
          </View>
        )}

        {/* =========================
            ROOM INFO
            ========================= */}

        <View style={styles.infoCard}>
          <View style={styles.titleRow}>
            <View
              style={
                styles.titleContainer
              }
            >
              <Text
                style={styles.roomName}
              >
                {room.name}
              </Text>

              <Text
                style={styles.building}
              >
                Tòa {room.building}
              </Text>
            </View>
          </View>

          {/* CAPACITY */}

          <View
            style={styles.capacityRow}
          >
            <Text
              style={
                styles.capacityIcon
              }
            >
              👥
            </Text>

            <Text
              style={
                styles.capacityText
              }
            >
              Sức chứa {room.capacity} người
            </Text>
          </View>

          {/* FACILITIES */}

          <Text
            style={styles.sectionTitle}
          >
            Tiện ích
          </Text>

          <View
            style={styles.facilities}
          >
            {room.facilities.map(
              (facility) => (
                <View
                  key={facility}
                  style={
                    styles.facilityChip
                  }
                >
                  <Text
                    style={
                      styles.facilityText
                    }
                  >
                    {facility}
                  </Text>
                </View>
              )
            )}
          </View>
        </View>

        {/* =========================
            DATE
            ========================= */}

        <View style={styles.section}>
          <Text
            style={styles.sectionTitle}
          >
            Chọn ngày
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.dateList
            }
          >
            {dates.map((date) => {
              const dateString =
                formatDate(date);

              const selected =
                selectedDate ===
                dateString;

              return (
                <TouchableOpacity
                  key={dateString}
                  style={[
                    styles.dateCard,
                    selected &&
                      styles.selectedDateCard,
                  ]}
                  onPress={() =>
                    handleSelectDate(
                      dateString
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dayName,
                      selected &&
                        styles.selectedDateText,
                    ]}
                  >
                    {getDayName(date)}
                  </Text>

                  <Text
                    style={[
                      styles.dayNumber,
                      selected &&
                        styles.selectedDateText,
                    ]}
                  >
                    {date.getDate()}
                  </Text>

                  <Text
                    style={[
                      styles.monthText,
                      selected &&
                        styles.selectedDateText,
                    ]}
                  >
                    Th{date.getMonth() + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* =========================
            TIME SLOTS
            ========================= */}

        <View style={styles.section}>
          <View
            style={styles.timeHeader}
          >
            <Text
              style={styles.sectionTitle}
            >
              Chọn khung giờ
            </Text>

            {loadingSlots && (
              <ActivityIndicator
                size="small"
                color="#2563EB"
              />
            )}
          </View>

          <View
            style={styles.timeGrid}
          >
            {timeSlots.map((slot) => {
              /*
               * Slot đã được đặt
               */

              const booked =
                bookedSlots.includes(
                  slot.id
                );

              /*
               * Slot đang chọn
               */

              const selected =
                selectedSlot ===
                slot.id;

              return (
                <TouchableOpacity
                  key={slot.id}
                  disabled={
                    booked ||
                    loadingSlots ||
                    booking
                  }
                  activeOpacity={
                    booked ? 1 : 0.8
                  }
                  onPress={() => {
                    if (booked) {
                      return;
                    }

                    setSelectedSlot(
                      slot.id
                    );
                  }}
                  style={[
                    styles.timeCard,

                    selected &&
                      !booked &&
                      styles.selectedTimeCard,

                    booked &&
                      styles.bookedTimeCard,
                  ]}
                >
                  <Text
                    style={[
                      styles.timeText,

                      selected &&
                        !booked &&
                        styles.selectedTimeText,

                      booked &&
                        styles.bookedTimeText,
                    ]}
                  >
                    {slot.startTime}
                  </Text>

                  <Text
                    style={[
                      styles.timeSeparator,

                      selected &&
                        !booked &&
                        styles.selectedTimeText,

                      booked &&
                        styles.bookedTimeText,
                    ]}
                  >
                    -
                  </Text>

                  <Text
                    style={[
                      styles.timeText,

                      selected &&
                        !booked &&
                        styles.selectedTimeText,

                      booked &&
                        styles.bookedTimeText,
                    ]}
                  >
                    {slot.endTime}
                  </Text>

                  {booked && (
                    <View
                      style={
                        styles.bookedBadge
                      }
                    >
                      <Text
                        style={
                          styles.bookedLabel
                        }
                      >
                        Đã đặt
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* =========================
          BOOKING BAR
          ========================= */}

      <View
        style={styles.bookingBar}
      >
        <View
          style={styles.selectedInfo}
        >
          <Text
            style={
              styles.selectedLabel
            }
          >
            Khung giờ đã chọn
          </Text>

          <Text
            style={
              styles.selectedValue
            }
          >
            {selectedSlot
              ? selectedSlot.replace(
                  "-",
                  " - "
                )
              : "Chưa chọn"}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.bookingButton,

            (!selectedSlot ||
              booking ||
              loadingSlots) &&
              styles.disabledButton,
          ]}
          disabled={
            !selectedSlot ||
            booking ||
            loadingSlots
          }
          onPress={handleBooking}
          activeOpacity={0.8}
        >
          {booking ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <Text
              style={
                styles.bookingButtonText
              }
            >
              Đặt phòng
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* =========================
          CONFIRM MODAL
          ========================= */}

      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!booking) {
            setShowConfirmModal(
              false
            );
          }
        }}
      >
        <View
          style={styles.modalOverlay}
        >
          <View
            style={styles.confirmModal}
          >
            {/* HEADER */}

            <View
              style={styles.modalHeader}
            >
              <View
                style={styles.modalIcon}
              >
                <Text
                  style={
                    styles.modalIconText
                  }
                >
                  📅
                </Text>
              </View>

              <View
                style={
                  styles.modalTitleContainer
                }
              >
                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  Xác nhận đặt phòng
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  Kiểm tra thông tin trước khi đặt
                </Text>
              </View>
            </View>

            {/* ROOM */}

            <View
              style={
                styles.confirmInfoCard
              }
            >
              <Text
                style={
                  styles.confirmRoomName
                }
              >
                {room.name}
              </Text>

              <Text
                style={
                  styles.confirmBuilding
                }
              >
                Tòa {room.building}
              </Text>
            </View>

            {/* DATE */}

            <View
              style={styles.confirmRow}
            >
              <View
                style={
                  styles.confirmRowIcon
                }
              >
                <Text>📅</Text>
              </View>

              <View
                style={
                  styles.confirmRowContent
                }
              >
                <Text
                  style={
                    styles.confirmLabel
                  }
                >
                  Ngày đặt
                </Text>

                <Text
                  style={
                    styles.confirmValue
                  }
                >
                  {formatDisplayDate(
                    selectedDate
                  )}
                </Text>
              </View>
            </View>

            {/* TIME */}

            <View
              style={styles.confirmRow}
            >
              <View
                style={
                  styles.confirmRowIcon
                }
              >
                <Text>🕐</Text>
              </View>

              <View
                style={
                  styles.confirmRowContent
                }
              >
                <Text
                  style={
                    styles.confirmLabel
                  }
                >
                  Khung giờ
                </Text>

                <Text
                  style={
                    styles.confirmValue
                  }
                >
                  {selectedTime
                    ? `${selectedTime.startTime} - ${selectedTime.endTime}`
                    : "--"}
                </Text>
              </View>
            </View>

            {/* DURATION */}

            <View
              style={styles.confirmRow}
            >
              <View
                style={
                  styles.confirmRowIcon
                }
              >
                <Text>⏱️</Text>
              </View>

              <View
                style={
                  styles.confirmRowContent
                }
              >
                <Text
                  style={
                    styles.confirmLabel
                  }
                >
                  Thời lượng
                </Text>

                <Text
                  style={
                    styles.confirmValue
                  }
                >
                  1 giờ
                </Text>
              </View>
            </View>

            {/* ACTIONS */}

            <View
              style={styles.modalActions}
            >
              <TouchableOpacity
                style={
                  styles.cancelModalButton
                }
                disabled={booking}
                onPress={() =>
                  setShowConfirmModal(
                    false
                  )
                }
                activeOpacity={0.8}
              >
                <Text
                  style={
                    styles.cancelModalText
                  }
                >
                  Hủy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.confirmButton
                }
                disabled={booking}
                onPress={
                  confirmBooking
                }
                activeOpacity={0.8}
              >
                {booking ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={
                      styles.confirmButtonText
                    }
                  >
                    Xác nhận đặt
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* =========================
   STYLES
   ========================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAF4FF",
  },

  scrollContent: {
    paddingBottom: 110,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 14,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 20,
  },

  backButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  roomImage: {
    width: "100%",
    height: 220,
  },

  imagePlaceholder: {
    width: "100%",
    height: 220,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
  },

  placeholderIcon: {
    fontSize: 60,
  },

  infoCard: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    marginBottom: 8,
    borderRadius: 18,
    padding: 18,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  titleContainer: {
    flex: 1,
    paddingRight: 10,
  },

  roomName: {
    fontSize: 23,
    fontWeight: "800",
    color: "#0F172A",
  },

  building: {
    marginTop: 5,
    fontSize: 14,
    color: "#64748B",
  },

  capacityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },

  capacityIcon: {
    fontSize: 20,
    marginRight: 8,
  },

  capacityText: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },

  facilities: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },

  facilityChip: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
  },

  facilityText: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "600",
  },

  section: {
    marginTop: 10,
    paddingHorizontal: 16,
  },

  dateList: {
    paddingTop: 12,
    paddingBottom: 6,
    gap: 10,
  },

  dateCard: {
    width: 68,
    height: 82,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  selectedDateCard: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  dayName: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },

  dayNumber: {
    marginTop: 3,
    fontSize: 21,
    fontWeight: "800",
    color: "#0F172A",
  },

  monthText: {
    marginTop: 2,
    fontSize: 11,
    color: "#94A3B8",
  },

  selectedDateText: {
    color: "#FFFFFF",
  },

  timeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  timeCard: {
    width: "31%",
    minHeight: 70,
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },

  selectedTimeCard: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  bookedTimeCard: {
    backgroundColor: "#E5E7EB",
    borderColor: "#D1D5DB",
    opacity: 0.9,
  },

  timeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },

  timeSeparator: {
    fontSize: 11,
    color: "#94A3B8",
    marginVertical: 1,
  },

  selectedTimeText: {
    color: "#FFFFFF",
  },

  bookedTimeText: {
    color: "#9CA3AF",
  },

  bookedBadge: {
    position: "absolute",
    bottom: 4,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  bookedLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#6B7280",
  },

  bookingBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  selectedInfo: {
    flex: 1,
  },

  selectedLabel: {
    fontSize: 11,
    color: "#94A3B8",
  },

  selectedValue: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },

  bookingButton: {
    minWidth: 125,
    height: 48,
    backgroundColor: "#2563EB",
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },

  disabledButton: {
    backgroundColor: "#94A3B8",
  },

  bookingButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  /* =========================
     CONFIRM MODAL
     ========================= */

  modalOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  confirmModal: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  modalIconText: {
    fontSize: 23,
  },

  modalTitleContainer: {
    flex: 1,
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0F172A",
  },

  modalSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#64748B",
  },

  confirmInfoCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 15,
    padding: 14,
    marginBottom: 8,
  },

  confirmRoomName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },

  confirmBuilding: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748B",
  },

  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  confirmRowIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  confirmRowContent: {
    flex: 1,
  },

  confirmLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
  },

  confirmValue: {
    marginTop: 3,
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "700",
  },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },

  cancelModalButton: {
    flex: 1,
    height: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },

  cancelModalText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
  },

  confirmButton: {
    flex: 1.4,
    height: 48,
    borderRadius: 13,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },

  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});