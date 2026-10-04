import {
  Auth,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { app } from "./config";

const auth: Auth = getAuth(app);

export { auth };

export const registerUser = async (
  email: string,
  password: string
) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const loginUser = async (
  email: string,
  password: string
) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = async () => {
  return signOut(auth);
};