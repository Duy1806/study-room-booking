import { onAuthStateChanged, User } from "firebase/auth";
import { create } from "zustand";

import { auth } from "../firebase/auth";

type AuthStore = {
  user: User | null;
  loading: boolean;
  initialize: () => () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,

  initialize: () => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        set({
          user,
          loading: false,
        });
      }
    );

    return unsubscribe;
  },
}));