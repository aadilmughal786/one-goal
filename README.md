# One Goal App

It is a minimalist productivity application that empowers you to focus on a single, high-impact objective at a time. In a world filled with constant distractions, this app acts as your digital sanctuary, fostering deep concentration and lasting progress.

## Table of Contents

- [Features](#features)
- [Why One Goal? (The Philosophy)](#why-one-goal-the-philosophy)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running the App](#running-the-app)
- [Project Structure](#project-structure)
- [Core Technologies](#core-technologies)
- [Developer Information](#developer-information)
- [License](#license)

## Features

| Feature                | Description                                              |
| ---------------------- | -------------------------------------------------------- |
| One Focused Goal       | Define and work toward a single, overarching objective.  |
| Distraction Management | List "What Not To Do" items to maintain focus.           |
| Contextual Awareness   | Keep track of entries like lessons, insights, or notes.  |
| Time Tools Built-in    | Integrated stopwatch and deadline countdown.             |
| Secure Data Handling   | Google Sign-In, guest mode, and JSON data import/export. |
| Clean Minimal UI       | Monochrome, focus-centric interface.                     |
| Responsive Design      | Fully optimized across devices.                          |

## Why One Goal? (The Philosophy)

Multitasking often scatters attention. But excellence comes from deep, intentional focus. **One Goal** guides you to simplify your digital workspace and prioritize what truly matters.

This app promotes a mindset of **clarity through reduction**, helping you eliminate friction and amplify purpose. One goal. No distractions. Real results.

## Getting Started

### Prerequisites

| Tool       | Version |
| ---------- | ------- |
| Node.js    | 18.x+   |
| npm / Yarn | Latest  |
| Git        | Any     |

### Installation

```bash
git clone <repository-url>
cd one-goal
npm install
# or
yarn install
```

### Configuration

#### 1. Firebase Setup

| Step | Action                                                             |
| ---- | ------------------------------------------------------------------ |
| a    | Go to the [Firebase Console](https://console.firebase.google.com/) |
| b    | Create a Firebase Project                                          |
| c    | Enable **Google Authentication**                                   |
| d    | Create a **Firestore Database**                                    |
| e    | Register a **Web App** to get Firebase config                      |

#### 2. Create `.env.local` with the following:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
# NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=... (optional)
```

#### 3. Configure Firestore Rules

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{documents=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

Click **Publish** in Firebase Console.

### Running the App

```bash
npm run dev
# or
yarn dev
```

Then open:

```
http://localhost:3000/one-goal
```

## Core Technologies

| Stack / Tool      | Description               |
| ----------------- | ------------------------- |
| **Next.js 14**    | App Router, static export |
| **React**         | UI development            |
| **TypeScript**    | Type-safe JavaScript      |
| **Tailwind CSS**  | Utility-first styling     |
| **Framer Motion** | Animations                |
| **Firebase**      | Auth + Firestore DB       |
| **React Icons**   | Icon library              |
| **Local Storage** | Guest mode persistence    |

## Developer Information

Feel free to contribute or customize this app for your own workflow. It's built for clarity and intentional productivity.

## License

Licensed under the [MIT License](./License).
