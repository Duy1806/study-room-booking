import { create } from "zustand";

import { Booking } from "../types";
import { bookings as initialBookings } from "../data/bookings";

type BookingStore = {
  bookings: Booking[];

  addBooking: (booking: Booking) => void;

  cancelBooking: (bookingId: string) => void;
};

export const useBookingStore = create<BookingStore>((set) => ({
  bookings: initialBookings,

  addBooking: (booking) =>
    set((state) => ({
      bookings: [...state.bookings, booking],
    })),

  cancelBooking: (bookingId) =>
    set((state) => ({
      bookings: state.bookings.map((booking) =>
        booking.id === bookingId
          ? {
              ...booking,
              status: "cancelled",
            }
          : booking
      ),
    })),
}));