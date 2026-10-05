import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { db } from "../firebase/config";

export type CreateBookingInput = {
  roomId: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
};

export type RoomBooking = {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "cancelled";
};

export const getBookingsForRoomAndDate = async (
  roomId: string,
  date: string
): Promise<RoomBooking[]> => {
  const bookingsQuery = query(
    collection(db, "bookings"),
    where("roomId", "==", roomId),
    where("date", "==", date),
    where("status", "==", "confirmed")
  );

  const snapshot = await getDocs(bookingsQuery);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  })) as RoomBooking[];
};


/*
 * Tạo ID cố định cho mỗi room + date + time slot.
 *
 * Ví dụ:
 * room-1_2026-10-02_0900
 *
 * Vì ID là cố định nên 2 người không thể
 * cùng tạo một booking cho cùng slot.
 */
const createBookingId = (
  roomId: string,
  date: string,
  startTime: string
) => {
  const cleanTime = startTime.replace(":", "");

  return `${roomId}_${date}_${cleanTime}`;
};


export const createBooking = async (
  booking: CreateBookingInput
) => {
  const bookingId = createBookingId(
    booking.roomId,
    booking.date,
    booking.startTime
  );

  const bookingRef = doc(
    db,
    "bookings",
    bookingId
  );

  await runTransaction(
    db,
    async (transaction) => {

      // Kiểm tra slot hiện tại
      const existingBooking =
        await transaction.get(bookingRef);

      // Nếu đã có booking confirmed
      // thì từ chối ngay.
      if (existingBooking.exists()) {
        const existingData =
          existingBooking.data();

        if (
          existingData.status === "confirmed"
        ) {
          throw new Error(
            "SLOT_ALREADY_BOOKED"
          );
        }
      }

      // Nếu chưa có booking hoặc booking
      // cũ đã cancelled thì cho phép đặt.
      transaction.set(
        bookingRef,
        {
          roomId: booking.roomId,
          userId: booking.userId,
          userName: booking.userName,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: "confirmed",
          createdAt: serverTimestamp(),
        }
      );
    }
  );

  return bookingId;
};