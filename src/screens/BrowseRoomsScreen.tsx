
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getRooms } from "../services/roomService";
import { Room } from "../types";

type StatusFilter = "all" | "available" | "occupied";
type CapacityFilter = "all" | "small" | "medium" | "large";

export default function BrowseRoomsScreen({ navigation }: any) {
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [buildingFilter, setBuildingFilter] =
    useState<string>("all");

  const [capacityFilter, setCapacityFilter] =
    useState<CapacityFilter>("all");

  const [showFilters, setShowFilters] = useState(false);

  const {
    data: roomList = [],
    isLoading: loading,
    isError,
  } = useQuery({
    queryKey: ["rooms"],
    queryFn: getRooms,
  });

  const availableCount = roomList.filter(
    (room) => room.status === "available"
  ).length;

  const buildings = useMemo(() => {
    const uniqueBuildings = Array.from(
      new Set(roomList.map((room) => room.building))
    );

    return uniqueBuildings.sort();
  }, [roomList]);

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) +
    (buildingFilter !== "all" ? 1 : 0) +
    (capacityFilter !== "all" ? 1 : 0);

  const filteredRooms = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return roomList.filter((room) => {
      const matchesSearch =
        keyword.length === 0 ||
        room.name.toLowerCase().includes(keyword) ||
        room.building.toLowerCase().includes(keyword) ||
        room.facilities.some((facility) =>
          facility.toLowerCase().includes(keyword)
        );

      const matchesStatus =
        statusFilter === "all" ||
        room.status === statusFilter;

      const matchesBuilding =
        buildingFilter === "all" ||
        room.building === buildingFilter;

      const matchesCapacity = (() => {
        switch (capacityFilter) {
          case "small":
            return room.capacity <= 10;

          case "medium":
            return (
              room.capacity > 10 &&
              room.capacity <= 30
            );

          case "large":
            return room.capacity > 30;

          default:
            return true;
        }
      })();

      return (
        matchesSearch &&
        matchesStatus &&
        matchesBuilding &&
        matchesCapacity
      );
    });
  }, [
    roomList,
    search,
    statusFilter,
    buildingFilter,
    capacityFilter,
  ]);

  const resetFilters = () => {
    setStatusFilter("all");
    setBuildingFilter("all");
    setCapacityFilter("all");
  };

  const renderRoom = ({ item }: { item: Room }) => {
    const isAvailable = item.status === "available";

    return (
      <View style={styles.card}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.roomImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>
              Chưa có hình ảnh
            </Text>
          </View>
        )}

        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text
                style={styles.roomName}
                numberOfLines={1}
              >
                {item.name}
              </Text>

              <Text style={styles.building}>
                Tòa nhà {item.building}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                isAvailable
                  ? styles.availableBadge
                  : styles.occupiedBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  isAvailable
                    ? styles.availableText
                    : styles.occupiedText,
                ]}
              >
                {isAvailable
                  ? "Còn trống"
                  : "Đang sử dụng"}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoText}>
              👥 {item.capacity} chỗ
            </Text>

            {item.facilities.length > 0 && (
              <Text
                style={styles.infoText}
                numberOfLines={1}
              >
                •{" "}
                {item.facilities
                  .slice(0, 2)
                  .join(" • ")}
              </Text>
            )}
          </View>

          <Pressable
            style={styles.viewButton}
            onPress={() =>
              navigation.navigate("RoomDetail", {
                roomId: item.id,
              })
            }
          >
            <Text style={styles.viewButtonText}>
              Xem phòng
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  if (isError) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top"]}
      >
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>
            Không thể tải danh sách phòng
          </Text>

          <Text style={styles.emptyText}>
            Vui lòng kiểm tra kết nối mạng và thử lại.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top"]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#2563EB"
          />

          <Text style={styles.loadingText}>
            Đang tải danh sách phòng...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
      <FlatList
        data={filteredRooms}
        keyExtractor={(item) => item.id}
        renderItem={renderRoom}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            {/* HEADER */}
            <View style={styles.header}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.smallTitle}>
                  PHÒNG HỌC
                </Text>

                <Text style={styles.headerTitle}>
                  Tìm phòng học
                </Text>

                <Text style={styles.headerSubtitle}>
                  Chọn phòng phù hợp và đặt thời gian học.
                </Text>
              </View>

              <View style={styles.logo}>
                <Text style={styles.logoText}>
                  SR
                </Text>
              </View>
            </View>

            {/* SEARCH + FILTER BUTTON */}
            <View style={styles.searchRow}>
              <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>
                  ⌕
                </Text>

                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Tìm phòng, tòa nhà..."
                  placeholderTextColor="#94A3B8"
                  style={styles.searchInput}
                />

                {search.length > 0 && (
                  <Pressable
                    onPress={() => setSearch("")}
                    style={styles.clearSearchButton}
                  >
                    <Text style={styles.clearSearchText}>
                      ×
                    </Text>
                  </Pressable>
                )}
              </View>

              <Pressable
                style={[
                  styles.filterButton,
                  showFilters &&
                    styles.filterButtonActive,
                ]}
                onPress={() =>
                  setShowFilters((value) => !value)
                }
              >
                <Text
                  style={[
                    styles.filterButtonIcon,
                    showFilters &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  ☷
                </Text>

                <Text
                  style={[
                    styles.filterButtonText,
                    showFilters &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  Lọc
                </Text>

                {activeFilterCount > 0 && (
                  <View
                    style={[
                      styles.filterCount,
                      showFilters &&
                        styles.filterCountActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterCountText,
                        showFilters &&
                          styles.filterCountTextActive,
                      ]}
                    >
                      {activeFilterCount}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* COLLAPSIBLE FILTER */}
            {showFilters && (
              <View style={styles.filterCard}>
                <View style={styles.filterHeader}>
                  <View>
                    <Text style={styles.filterHeaderTitle}>
                      Bộ lọc phòng
                    </Text>

                    <Text
                      style={styles.filterHeaderSubtitle}
                    >
                      Chọn điều kiện để tìm phòng phù hợp
                    </Text>
                  </View>

                  {activeFilterCount > 0 && (
                    <Pressable
                      onPress={resetFilters}
                      style={styles.resetButton}
                    >
                      <Text style={styles.resetButtonText}>
                        Đặt lại
                      </Text>
                    </Pressable>
                  )}
                </View>

                {/* STATUS */}
                <View style={styles.filterSection}>
                  <Text
                    style={styles.filterSectionTitle}
                  >
                    Trạng thái
                  </Text>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}
                  >
                    <Pressable
                      style={[
                        styles.filterChip,
                        statusFilter === "all" &&
                          styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setStatusFilter("all")
                      }
                    >
                      <Text
                        style={[
                          styles.filterText,
                          statusFilter === "all" &&
                            styles.filterTextActive,
                        ]}
                      >
                        Tất cả
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.filterChip,
                        statusFilter === "available" &&
                          styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setStatusFilter("available")
                      }
                    >
                      <Text
                        style={[
                          styles.filterText,
                          statusFilter === "available" &&
                            styles.filterTextActive,
                        ]}
                      >
                        Còn trống
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.filterChip,
                        statusFilter === "occupied" &&
                          styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setStatusFilter("occupied")
                      }
                    >
                      <Text
                        style={[
                          styles.filterText,
                          statusFilter === "occupied" &&
                            styles.filterTextActive,
                        ]}
                      >
                        Đang sử dụng
                      </Text>
                    </Pressable>
                  </ScrollView>
                </View>

                {/* BUILDING */}
                <View style={styles.filterSection}>
                  <Text
                    style={styles.filterSectionTitle}
                  >
                    Tòa nhà
                  </Text>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}
                  >
                    <Pressable
                      style={[
                        styles.filterChip,
                        buildingFilter === "all" &&
                          styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setBuildingFilter("all")
                      }
                    >
                      <Text
                        style={[
                          styles.filterText,
                          buildingFilter === "all" &&
                            styles.filterTextActive,
                        ]}
                      >
                        Tất cả
                      </Text>
                    </Pressable>

                    {buildings.map((building) => (
                      <Pressable
                        key={building}
                        style={[
                          styles.filterChip,
                          buildingFilter ===
                            building &&
                            styles.filterChipActive,
                        ]}
                        onPress={() =>
                          setBuildingFilter(building)
                        }
                      >
                        <Text
                          style={[
                            styles.filterText,
                            buildingFilter ===
                              building &&
                              styles.filterTextActive,
                          ]}
                        >
                          {building}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>

                {/* CAPACITY */}
                <View
                  style={[
                    styles.filterSection,
                    styles.lastFilterSection,
                  ]}
                >
                  <Text
                    style={styles.filterSectionTitle}
                  >
                    Sức chứa
                  </Text>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}
                  >
                    <Pressable
                      style={[
                        styles.filterChip,
                        capacityFilter === "all" &&
                          styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setCapacityFilter("all")
                      }
                    >
                      <Text
                        style={[
                          styles.filterText,
                          capacityFilter === "all" &&
                            styles.filterTextActive,
                        ]}
                      >
                        Tất cả
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.filterChip,
                        capacityFilter === "small" &&
                          styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setCapacityFilter("small")
                      }
                    >
                      <Text
                        style={[
                          styles.filterText,
                          capacityFilter === "small" &&
                            styles.filterTextActive,
                        ]}
                      >
                        ≤ 10 chỗ
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.filterChip,
                        capacityFilter === "medium" &&
                          styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setCapacityFilter("medium")
                      }
                    >
                      <Text
                        style={[
                          styles.filterText,
                          capacityFilter === "medium" &&
                            styles.filterTextActive,
                        ]}
                      >
                        11–30 chỗ
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.filterChip,
                        capacityFilter === "large" &&
                          styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setCapacityFilter("large")
                      }
                    >
                      <Text
                        style={[
                          styles.filterText,
                          capacityFilter === "large" &&
                            styles.filterTextActive,
                        ]}
                      >
                        &gt; 30 chỗ
                      </Text>
                    </Pressable>
                  </ScrollView>
                </View>
              </View>
            )}

            {/* SUMMARY */}
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.sectionTitle}>
                  Phòng học
                </Text>

                <Text style={styles.sectionSubtitle}>
                  {filteredRooms.length} phòng phù hợp
                </Text>
              </View>

              <View style={styles.availableSummary}>
                <View style={styles.greenDot} />

                <Text
                  style={styles.availableSummaryText}
                >
                  {availableCount} phòng còn trống
                </Text>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>
              ⌕
            </Text>

            <Text style={styles.emptyTitle}>
              Không tìm thấy phòng
            </Text>

            <Text style={styles.emptyText}>
              Hãy thử tìm kiếm hoặc thay đổi bộ lọc.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAF4FF",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 20,
  },

  headerTextContainer: {
    flex: 1,
    paddingRight: 16,
  },

  smallTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2563EB",
    letterSpacing: 1.4,
    marginBottom: 4,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
  },

  headerSubtitle: {
    marginTop: 5,
    fontSize: 13,
    color: "#64748B",
  },

  logo: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },

  logoText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  /* SEARCH + FILTER */

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },

  searchContainer: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#DCE8F5",
  },

  searchIcon: {
    fontSize: 25,
    color: "#64748B",
    marginRight: 7,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
  },

  clearSearchButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  clearSearchText: {
    fontSize: 20,
    lineHeight: 22,
    color: "#64748B",
    fontWeight: "600",
  },

  filterButton: {
    height: 52,
    minWidth: 68,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE8F5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  filterButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  filterButtonIcon: {
    fontSize: 18,
    color: "#2563EB",
    fontWeight: "700",
  },

  filterButtonText: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "800",
  },

  filterButtonTextActive: {
    color: "#FFFFFF",
  },

  filterCount: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  filterCountActive: {
    backgroundColor: "#FFFFFF",
  },

  filterCountText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563EB",
  },

  filterCountTextActive: {
    color: "#2563EB",
  },

  /* FILTER CARD */

  filterCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 15,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#DCE8F5",
  },

  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  filterHeaderTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },

  filterHeaderSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: "#94A3B8",
  },

  resetButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: "#EFF6FF",
  },

  resetButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2563EB",
  },

  filterSection: {
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },

  lastFilterSection: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },

  filterSectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 8,
  },

  chipRow: {
    gap: 7,
  },

  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 11,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  filterChipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  filterText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },

  filterTextActive: {
    color: "#FFFFFF",
  },

  /* SUMMARY */

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#64748B",
  },

  availableSummary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22C55E",
    marginRight: 6,
  },

  availableSummaryText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16A34A",
  },

  /* ROOM CARD */

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DCE8F5",
  },

  roomImage: {
    width: "100%",
    height: 150,
  },

  imagePlaceholder: {
    width: "100%",
    height: 150,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },

  placeholderText: {
    color: "#64748B",
    fontSize: 13,
  },

  cardContent: {
    padding: 15,
  },

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  titleContainer: {
    flex: 1,
    paddingRight: 10,
  },

  roomName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },

  building: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },

  availableBadge: {
    backgroundColor: "#DCFCE7",
  },

  occupiedBadge: {
    backgroundColor: "#FEE2E2",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "800",
  },

  availableText: {
    color: "#16A34A",
  },

  occupiedText: {
    color: "#DC2626",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  infoText: {
    flexShrink: 1,
    fontSize: 12,
    color: "#64748B",
    marginRight: 8,
  },

  viewButton: {
    height: 42,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },

  viewButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2563EB",
  },

  /* LOADING */

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#64748B",
  },

  /* EMPTY */

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 60,
  },

  emptyIcon: {
    fontSize: 42,
    color: "#94A3B8",
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },

  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
});

