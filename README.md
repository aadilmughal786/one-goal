![One Goal App](https://aadilmughal786.github.io/one-goal/og-image.png)

# One Goal App

**One Goal** is a minimalist, yet powerful productivity application designed to channel your focus onto a single, high-impact objective at a time. In a world filled with constant distractions, this app acts as your digital command center, fostering deep concentration, meticulous tracking, and lasting progress.

## Table of Contents

- [The Philosophy: Why One Goal?](#the-philosophy-why-one-goal)
- [Key Features](#key-features)
- [Application Structure](#application-structure)
- [Core Technologies](#core-technologies)
- [Getting Started](#getting-started)
- [License](#license)

## The Philosophy: Why One Goal?

Multitasking often scatters attention, leading to mediocre results across many fronts. True excellence, however, emerges from deep, intentional focus. **One Goal** is built on this principle. It guides you to simplify your digital workspace, eliminate context-switching, and prioritize what truly matters.

This app promotes a mindset of **clarity through reduction**, helping you amplify your purpose and achieve meaningful outcomes. One goal. No distractions. Real results.

## Key Features

The application has evolved into a comprehensive suite of tools to support every aspect of your journey towards achieving your goal.

| Feature                       | Description                                                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Singular Goal Focus**       | Define one primary objective with a clear description and deadline to serve as your north star.                                        |
| **Holistic Routine Tracking** | Log and monitor daily routines including Sleep, Water, Exercise, Meals, Dental Care, and Bathing schedules.                            |
| **Daily Timeline**            | Visualize and plan your day with custom, color-coded Time Blocks to allocate your focus effectively.                                   |
| **Advanced Task Management**  | Utilize a drag-and-drop To-Do list, a "What Not To Do" list for distraction management, and digital Sticky Notes for quick thoughts.   |
| **Productivity Toolkit**      | Leverage built-in tools like a chat-based calculator, a time estimator for planning, and a drawing pad for brainstorming.              |
| **Insightful Analytics**      | Dive deep into performance with charts for weekly consistency, cumulative progress, satisfaction trends, and day-of-the-week analysis. |
| **Focus Timer & Session Log** | Use the integrated stopwatch for focused work sessions and breaks. All sessions are logged and can be reviewed in a calendar view.     |
| **Wellness Reminders**        | Enable gentle, periodic reminders for posture checks, hydration, stretching, and eye care to maintain well-being.                      |
| **Command Palette**           | Navigate the entire application instantly with a ⌘K (or Ctrl+K) command palette, designed for power users.                             |
| **Resource Hub**              | Attach and organize relevant resources—articles, videos, images, and documents—directly to your goal for easy access.                  |
| **Data Portability**          | Securely import and export all your goal data as a JSON file, ensuring you always own your data.                                       |
| **Customization**             | Personalize your experience by choosing from a selection of avatars for your user profile.                                             |

## Application Structure

The application is organized into several key pages, each with its own set of tabs for focused functionality.

- **/dashboard**
  - `Main`: Overview of your goal, countdown, and daily progress calendar.
  - `Time Blocks`: A visual timeline of your daily schedule.
  - `Analytics`: In-depth charts and performance insights.
  - `Quotes`: A space for motivation with random and starred quotes.
- **/todo**
  - `My Tasks`: Your primary to-do list.
  - `What Not To Do`: A list to track and manage distractions.
  - `Sticky Notes`: A digital board for your quick notes and ideas.
  - `Random Picker`: A tool to help with decision-making.
- **/stop-watch**
  - `Stopwatch`: The main focus timer.
  - `Session Log`: A calendar view of all your logged focus sessions.
- **/routine**
  - `Sleep`: Manage your main sleep schedule and naps.
  - `Water`: Track your daily water intake.
  - `Exercise`: Log your workout routines.
  - `Meals`: Plan your daily meals and track weight.
  - `Teeth`: Manage your dental care schedule.
  - `Bath`: Schedule your hygiene routines.
- **/goal**
  - `Goal Hub`: Manage all your goals (active, paused, completed).
  - `Resources`: A central repository for all resources linked to your active goal.
- **/profile**
  - `Profile`: View your user profile and change your avatar.
  - `Data Management`: Import, export, or reset your application data.
  - `Wellness`: Configure your wellness reminders.
- **/tools**
  - `Calculator`: A chat-based scientific calculator.
  - `Time Estimator`: Calculate your effective workdays over a period.
  - `Drawing Pad`: A simple canvas for sketching ideas.

## Core Technologies

| Stack / Tool        | Description                                                             |
| ------------------- | ----------------------------------------------------------------------- |
| **Next.js 14**      | App Router, static export for performance.                              |
| **React 19**        | Core UI library for building components.                                |
| **TypeScript**      | For type safety and improved developer experience.                      |
| **Tailwind CSS**    | A utility-first CSS framework for rapid UI development.                 |
| **Firebase**        | Backend services for Authentication and Firestore DB.                   |
| **Zustand**         | A small, fast, and scalable state-management solution.                  |
| **Recharts**        | A composable charting library for data visualization.                   |
| **React Hook Form** | Performant, flexible, and extensible forms with easy-to-use validation. |
| **KBar**            | Command palette for fast navigation and actions.                        |
| **Date-fns**        | Modern JavaScript date utility library.                                 |
| **Jest & RTL**      | For comprehensive unit and integration testing.                         |

## Getting Started

### Prerequisites

| Tool    | Version |
| ------- | ------- |
| Node.js | 20.x+   |
| Yarn    | Latest  |

### Installation

```bash
git clone [https://github.com/aadilmughal786/one-goal.git](https://github.com/aadilmughal786/one-goal.git)
cd one-goal
yarn install
```

### Configuration

1.  **Firebase Setup**:

    - Go to the [Firebase Console](https://console.firebase.google.com/).
    - Create a new Firebase project.
    - Enable **Google Authentication** in the "Authentication" -> "Sign-in method" tab.
    - Create a **Firestore Database** in production mode.
    - Register a new **Web App** in your project settings to get your Firebase configuration keys.

2.  **Environment Variables**:
    Create a file named `.env.local` in the root of your project and add your Firebase configuration keys to it. This file is included in `.gitignore` and should not be committed to your repository.

    ```bash
    # .env.local

    NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
    NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABCDEFGHIJ # Optional
    ```

3.  **Firestore Security Rules**:
    In the Firebase Console, navigate to "Firestore Database" -> "Rules" and paste the following rules. This ensures that users can only read and write their own data.

    ```javascript
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /users/{userId}/{documents=**} {
          allow read, write: if request.auth.uid == userId;
        }
      }
    }
    ```

    Click **Publish** to save the rules.

### Running the App

```bash
yarn dev
```

Open [http://localhost:3000/one-goal](http://localhost:3000/one-goal) in your browser.

## License

This project is licensed under the [MIT License](./LICENSE).
