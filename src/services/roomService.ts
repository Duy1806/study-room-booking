import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../firebase/config";
import { Room } from "../types";

export const getRooms = async (): Promise<Room[]> => {
  const snapshot = await getDocs(
    collection(db, "rooms")
  );

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  })) as Room[];
};