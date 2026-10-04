export type RoomStatus = "available" | "occupied";

export type Room = {
  id: string;
  name: string;
  building: string;
  capacity: number;
  image?: string;
  status: RoomStatus;
  facilities: string[];
};

export type BookingStatus = "confirmed" | "cancelled";

export type Booking = {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt: string;
};

export type User = {
  id: string;
  name: string;
  studentId: string;
  email: string;
};