# Study Room Booking

A mobile application for booking study rooms using React Native and Expo.

## Technologies

* React Native
* Expo
* TypeScript
* React Navigation
* Zustand
* TanStack Query
* Firebase Authentication
* Cloud Firestore

## Features

* User registration and login
* Browse available study rooms
* Search and filter rooms
* View room details and facilities
* Select date and time slots
* Prevent double booking for the same room and time slot
* View personal bookings
* Cancel bookings
* User profile management

## Requirements

Before running the project, make sure you have installed:

* Node.js
* npm
* Expo Go (for testing on a physical device)

## Installation

Clone the repository:

```bash
git clone https://github.com/Duy1806/study-room-booking.git
```

Go to the project directory:

```bash
cd study-room-booking
```

Install dependencies:

```bash
npm install
```

## Firebase Configuration

This project uses Firebase Authentication and Cloud Firestore.

Create your own Firebase project and configure Firebase Authentication and Firestore before running the application.

The Firebase service account key is not included in this repository for security reasons.

## Run the Application

Start the Expo development server:

```bash
npx expo start
```

For Windows PowerShell, if `npx` is blocked by the execution policy, use:

```powershell
npx.cmd expo start
```

Then scan the QR code using Expo Go on your mobile device.

You can also run the application using an Android emulator.

## TypeScript Check

To check for TypeScript errors:

```powershell
npx.cmd tsc --noEmit
```

## Project Structure

```text
study-room-booking/
├── assets/
├── scripts/
├── src/
│   ├── data/
│   ├── firebase/
│   ├── lib/
│   ├── navigation/
│   ├── screens/
│   ├── services/
│   ├── store/
│   └── types/
├── App.tsx
├── app.json
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

## Repository

GitHub: https://github.com/Duy1806/study-room-booking
