import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import {
  getFirestore,
} from "firebase-admin/firestore";

import serviceAccount from "../serviceAccountKey.json";


if (getApps().length === 0) {
  initializeApp({
    credential: cert(
      serviceAccount as any
    ),
  });
}


const db = getFirestore();


const ROOM_ID = "room-1";
const DATE = "2026-10-03";
const START_TIME = "09:00";
const END_TIME = "10:00";


const BOOKING_ID =
  `${ROOM_ID}_${DATE}_${START_TIME.replace(":", "")}`;


type TestUser = {
  userId: string;
  userName: string;
};


const userA: TestUser = {
  userId: "test-user-A",
  userName: "Test User A",
};


const userB: TestUser = {
  userId: "test-user-B",
  userName: "Test User B",
};


const attemptBooking = async (
  user: TestUser
) => {

  const bookingRef = db
    .collection("bookings")
    .doc(BOOKING_ID);


  try {

    await db.runTransaction(
      async (transaction) => {

        const existing =
          await transaction.get(
            bookingRef
          );


        if (existing.exists) {

          const data =
            existing.data();


          if (
            data?.status ===
            "confirmed"
          ) {

            throw new Error(
              "SLOT_ALREADY_BOOKED"
            );
          }
        }


        /*
         * Giả lập thời gian xử lý.
         * Hai request sẽ cạnh tranh
         * trên cùng một document.
         */
        await new Promise(
          (resolve) =>
            setTimeout(resolve, 300)
        );


        transaction.set(
          bookingRef,
          {
            roomId: ROOM_ID,
            userId: user.userId,
            userName: user.userName,
            date: DATE,
            startTime: START_TIME,
            endTime: END_TIME,
            status: "confirmed",
            createdAt:
              new Date(),
          }
        );
      }
    );


    console.log(
      `✅ ${user.userName}: BOOKING SUCCESS`
    );

    return true;

  } catch (error: any) {

    if (
      error?.message ===
      "SLOT_ALREADY_BOOKED"
    ) {

      console.log(
        `❌ ${user.userName}: SLOT_ALREADY_BOOKED`
      );

      return false;
    }


    console.log(
      `❌ ${user.userName}: ERROR`
    );

    console.log(error);

    return false;
  }
};


const testDoubleBooking = async () => {

  console.log(
    "\n========================================"
  );

  console.log(
    "      FIRESTORE DOUBLE BOOKING TEST"
  );

  console.log(
    "========================================\n"
  );


  console.log(
    `Room: ${ROOM_ID}`
  );

  console.log(
    `Date: ${DATE}`
  );

  console.log(
    `Time: ${START_TIME} - ${END_TIME}`
  );

  console.log(
    `Booking ID: ${BOOKING_ID}\n`
  );


  console.log(
    "Sending 2 requests simultaneously...\n"
  );


  const results =
    await Promise.all([
      attemptBooking(userA),
      attemptBooking(userB),
    ]);


  const successCount =
    results.filter(Boolean).length;


  const failedCount =
    results.length - successCount;


  console.log(
    "\n========================================"
  );

  console.log(
    "                  RESULT"
  );

  console.log(
    "========================================\n"
  );


  console.log(
    `Success: ${successCount}`
  );

  console.log(
    `Failed:  ${failedCount}`
  );


  if (
    successCount === 1 &&
    failedCount === 1
  ) {

    console.log(
      "\n🎉 DOUBLE BOOKING PROTECTION PASSED!"
    );

    console.log(
      "Only ONE user was allowed to book."
    );

  } else {

    console.log(
      "\n⚠️ DOUBLE BOOKING TEST FAILED!"
    );

    console.log(
      "More than one request succeeded."
    );
  }


  console.log(
    "\n========================================\n"
  );
};


testDoubleBooking();