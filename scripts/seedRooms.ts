import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "../serviceAccountKey.json";

const firebaseAdminApp =
  getApps().length === 0
    ? initializeApp({
        credential: cert(serviceAccount as any),
      })
    : getApps()[0];

const db = getFirestore(firebaseAdminApp);

const rooms = [
  {
    id: "room-1",
    name: "Lab A3-101",
    building: "A3",
    capacity: 40,
    status: "available",
    image:
      "https://images.unsplash.com/photo-1562774053-701939374585",
    facilities: [
      "Computer",
      "Projector",
      "Air Conditioner",
    ],
  },
  {
    id: "room-2",
    name: "Lab A3-102",
    building: "A3",
    capacity: 35,
    status: "available",
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
    facilities: [
      "Computer",
      "Projector",
    ],
  },
  {
    id: "room-3",
    name: "Lab A3-201",
    building: "A3",
    capacity: 50,
    status: "occupied",
    image:
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2",
    facilities: [
      "Computer",
      "Projector",
      "Air Conditioner",
    ],
  },
  {
    id: "room-4",
    name: "Study Room B1-101",
    building: "B1",
    capacity: 12,
    status: "available",
    image:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36",
    facilities: [
      "Table",
      "Whiteboard",
      "Air Conditioner",
    ],
  },
  {
    id: "room-5",
    name: "Study Room B1-102",
    building: "B1",
    capacity: 8,
    status: "occupied",
    image:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4",
    facilities: [
      "Table",
      "Whiteboard",
    ],
  },
  {
    id: "room-6",
    name: "Library Zone A",
    building: "Library",
    capacity: 20,
    status: "available",
    image:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da",
    facilities: [
      "Table",
      "Power Outlet",
      "Wi-Fi",
    ],
  },
];

const seedRooms = async () => {
  try {
    console.log("Starting room seed...");

    const batch = db.batch();

    rooms.forEach((room) => {
      const roomRef = db.collection("rooms").doc(room.id);

      batch.set(roomRef, {
        name: room.name,
        building: room.building,
        capacity: room.capacity,
        status: room.status,
        image: room.image,
        facilities: room.facilities,
      });
    });

    await batch.commit();

    console.log(
      `Successfully seeded ${rooms.length} rooms.`
    );
  } catch (error) {
    console.error("SEED ROOMS ERROR:", error);
    process.exit(1);
  }
};

seedRooms();