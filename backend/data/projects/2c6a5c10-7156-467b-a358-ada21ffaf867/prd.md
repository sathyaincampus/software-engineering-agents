# Product Requirements Document: RoutineRally

**Version:** 1.0
**Date:** 2023-10-27
**Author:** Product Requirements Agent (SparkToShip AI)

---

## 1. Executive Summary

RoutineRally is a cross-platform mobile and web application designed to empower parents in orchestrating their children's busy schedules and to motivate children through an integrated reward system. The app aims to foster better habits, improve accountability, and create a harmonious family environment by providing intuitive tools for schedule management, task tracking, and positive reinforcement. Key features include a comprehensive calendar for diverse child activities, a gamified reward system for completed tasks, seamless Google Calendar synchronization, multi-parent sharing, and customizable recurring schedules. A unique "21-Day Kickstart" feature will help families establish or reinforce daily routines. RoutineRally will operate on a freemium subscription model, offering basic functionality for free and unlocking advanced features through premium tiers.

---

## 2. User Personas

### 2.1 Parent Persona: "The Organizer Mom"

*   **Name:** Sarah Chen
*   **Age:** 38
*   **Occupation:** Marketing Manager, Mother of two (Leo, 8, and Maya, 5)
*   **Needs:**
    *   A centralized place to manage her children's diverse schedules (soccer, piano lessons, tutoring, playdates).
    *   To ensure her children complete homework and chores without constant nagging.
    *   To track her children's progress and celebrate their achievements.
    *   To coordinate schedules with her partner, David.
    *   A simple, intuitive interface that doesn't add to her mental load.
*   **Frustrations:**
    *   Scattered information across various notes, emails, and calendars.
    *   Difficulty motivating her children to complete tasks.
    *   Forgetting appointments or double-booking.
    *   The complexity of existing family management apps.
*   **Goals:** To reduce family chaos, instill discipline and responsibility in her children, and have more quality family time.

### 2.2 Child Persona: "The Goal-Getter Kid"

*   **Name:** Leo Chen
*   **Age:** 8
*   **Occupation:** Student, aspiring soccer star
*   **Needs:**
    *   Clear understanding of what activities and tasks are expected of him.
    *   Motivation to complete homework, chores, and practice.
    *   Recognition and rewards for his efforts.
    *   A fun and engaging way to track his progress.
    *   To balance structured activities with free play and screen time.
*   **Frustrations:**
    *   Forgetting what he needs to do.
    *   Feeling overwhelmed by chores or homework.
    *   Not understanding the benefits of completing tasks.
    *   Boring and repetitive tasks.
*   **Goals:** To earn rewards, improve his skills (soccer, chess), get good grades, and have fun.

---

## 3. Functional Requirements

### 3.1 Must Have (Core Functionality)

**3.1.1 User Authentication & Profiles:**
*   **FR-001:** Users (parents) shall be able to create an account using email/password or sign in via Google.
*   **FR-002:** Users shall be able to create profiles for each child, including name, age, and optional profile picture.
*   **FR-003:** System shall support multi-parent/guardian access for a single family unit.

**3.1.2 Calendar Management (Parent View):**
*   **FR-004:** Parents shall be able to add new events/activities to the family calendar.
*   **FR-005:** Each event shall include: Title, Date, Time (Start & End), Location, Description/Notes.
*   **FR-006:** Support for various activity types (e.g., Music Class, Cricket Practice, Math Tutoring, English Study, Chess Club, Tamil Class, Study Time, Homework, Outdoor Play, Game Time, Park Time, Chores). Categories should be customizable.
*   **FR-007:** Support for adding recurring schedules: Daily, Weekly, Monthly.
*   **FR-008:** Ability to edit existing events/activities.
*   **FR-009:** Ability to delete existing events/activities.
*   **FR-010:** A clear, intuitive calendar view (e.g., monthly, weekly, daily).
*   **FR-011:** Visual indicators (e.g., color-coding) for different types of activities.

**3.1.3 Task Management (Child View & Parent Oversight):**
*   **FR-012:** Parents shall be able to create tasks for children (e.g., Homework, Chores, Practice specific skills).
*   **FR-013:** Tasks shall be assignable to specific children or all children.
*   **FR-014:** Tasks shall support due dates/times.
*   **FR-015:** Tasks can be recurring (Daily, Weekly, Monthly).
*   **FR-016:** Children shall be able to view their assigned tasks in a dedicated section.
*   **FR-017:** Children shall be able to mark tasks as "Completed".
*   **FR-018:** Parents shall receive notifications when tasks are completed.
*   **FR-019:** Parents shall be able to review and approve completed tasks (optional, configurable).

**3.1.4 Reward System:**
*   **FR-020:** Parents shall be able to define rewards (e.g., points, virtual badges, custom rewards like 'Extra Screen Time', 'Trip to the Park').
*   **FR-021:** Parents shall be able to associate rewards with specific tasks or task categories.
*   **FR-022:** Upon task completion (and optional parent approval), children shall be awarded the associated rewards.
*   **FR-023:** Children shall have a dedicated view to see their earned rewards and available rewards.
*   **FR-024:** The system shall maintain a running total of points/rewards for each child.

**3.1.5 Google Calendar Integration:**
*   **FR-025:** Users shall be able to connect their Google Calendar account upon sign-in.
*   **FR-026:** RoutineRally events and activities shall be syncable to the connected Google Calendar.
*   **FR-027:** RoutineRally shall be able to import events from the connected Google Calendar (user opt-in).

**3.1.6 Family Sharing:**
*   **FR-028:** Parents within the same family unit shall be able to view and edit the shared family calendar and task lists.
*   **FR-029:** Each parent shall have individual login credentials but share access to the family's data.

**3.1.7 "21-Day Kickstart" Feature:**
*   **FR-030:** Parents shall be able to initiate a "21-Day Kickstart" program for specific habits or routines (e.g., 'Get Ready for School', 'Daily Reading Practice').
*   **FR-031:** The Kickstart program shall create a series of daily tasks for the specified duration.
*   **FR-032:** Progress within the Kickstart program shall be visually tracked for the child.

**3.1.8 Cross-Platform Compatibility:**
*   **FR-033:** The application shall be accessible and functional on major web browsers (Chrome, Firefox, Safari, Edge).
*   **FR-034:** Native mobile applications shall be available for iOS and Android platforms.

### 3.2 Should Have (High Value Features)

*   **FR-035:** Push notifications for upcoming events, assigned tasks, and reward milestones.
*   **FR-036:** Customizable notification settings for parents and children.
*   **FR-037:** Ability to add attachments (e.g., images of completed work, instructions) to tasks and events.
*   **FR-038:** A "Family Dashboard" summarizing upcoming events, pending tasks, and recent achievements.
*   **FR-039:** Customizable chore lists with specific instructions and time estimates.
*   **FR-040:** Advanced reward options, such as setting a "cost" in points for redeemable rewards.
*   **FR-041:** Ability to set time limits or duration for recreational activities (e.g., Game Time, Park Time).

### 3.3 Could Have (Future Enhancements)

*   **FR-042:** Integration with other calendar services (e.g., Outlook Calendar).
*   **FR-043:** In-app messaging between parents within the family unit.
*   **FR-044:** Age-appropriate interfaces for younger children (under 5).
*   **FR-045:** Family goal setting and tracking.
*   **FR-046:** Reports and analytics for parents on child's activity completion and reward spending.
*   **FR-047:** Integration with wearable devices for activity tracking.
*   **FR-048:** Ability to schedule and pay for external classes/activities directly through the app (via payment gateway integration).

---

## 4. Non-Functional Requirements

*   **NFR-001 Performance:** The application should load within 3 seconds on a stable internet connection. Calendar views should render in under 2 seconds. Task completion actions should provide visual feedback within 1 second.
*   **NFR-002 Usability:** The UI must be highly intuitive and easy to navigate for both parents and children (age-appropriately). Key actions (adding events, marking tasks complete) should be discoverable within 3 taps/clicks. Visual design should be clean, modern, and engaging.
*   **NFR-003 Reliability:** The application should have an uptime of 99.5%. Data loss should be prevented through robust backup and synchronization mechanisms.
*   **NFR-004 Security:** All user data, especially personal information and authentication credentials, must be encrypted both in transit (TLS/SSL) and at rest. Implement secure authentication protocols.
*   **NFR-005 Scalability:** The architecture should support a growing user base and increasing data volume without significant performance degradation.
*   **NFR-006 Maintainability:** Code should be well-documented, modular, and follow established coding standards to facilitate future updates and bug fixes.
*   **NFR-007 Compatibility:**
    *   **Web:** Latest versions of Chrome, Firefox, Safari, Edge.
    *   **iOS:** Support for the last 2 major iOS versions.
    *   **Android:** Support for Android versions 8.0 (Oreo) and above.
*   **NFR-008 Accessibility:** Adhere to WCAG 2.1 AA guidelines where applicable, especially for web and parent-facing features.

---

## 5. User Flow / Journey

### 5.1 Parent Adding a New Recurring Class

1.  **Login:** Parent logs into RoutineRally (Web/Mobile).
2.  **Navigate to Calendar:** Parent selects the "Calendar" tab.
3.  **Initiate Add Event:** Parent taps the "+" button or a designated "Add Event" area.
4.  **Enter Event Details:**
    *   Selects "Class" as activity type.
    *   Enters Event Title (e.g., "Piano Lesson").
    *   Sets Start Date and Time.
    *   Sets End Time.
    *   Adds Location.
    *   Adds Notes (e.g., "Remember sheet music").
    *   Selects child(ren) associated with the event.
5.  **Set Recurrence:** Selects "Weekly" recurrence.
6.  **Set Recurrence End:** Chooses an end date or "No End Date".
7.  **Save Event:** Parent taps "Save".
8.  **Confirmation:** Event appears on the calendar. Google Calendar (if connected) syncs the event.

### 5.2 Child Completing a Task for Rewards

1.  **Notification:** Child receives a push notification: "New Task: Complete Math Homework".
2.  **View Tasks:** Child opens RoutineRally (Mobile) and navigates to the "My Tasks" section.
3.  **Select Task:** Child selects "Math Homework" from their list.
4.  **Review Task:** Child views task details (due time, associated reward points).
5.  **Mark Complete:** Child taps the "Mark as Complete" button.
6.  **Confirmation:** A success message appears ("Great job! Math homework complete!"). Reward points are added to their profile.
7.  **(Optional) Parent Approval:** If configured, the parent receives a notification: "Leo completed Math Homework. Approve?"
8.  **Parent Review:** Parent navigates to the "Approvals" section, reviews the task.
9.  **Approve:** Parent taps "Approve". Reward points are finalized for the child.

### 5.3 Initiating the "21-Day Kickstart"

1.  **Login:** Parent logs into RoutineRally.
2.  **Navigate to Kickstart:** Parent selects the "Routines" or "Kickstart" section.
3.  **Create Kickstart:** Parent taps "Start New Kickstart".
4.  **Define Program:**
    *   Enters Program Title (e.g., "Morning Routine").
    *   Selects associated tasks (e.g., "Get Dressed", "Brush Teeth", "Eat Breakfast").
    *   Assigns to child(ren).
5.  **Set Start Date:** Selects the start date for the 21-day program.
6.  **Initiate:** Parent taps "Start Program".
7.  **Confirmation:** The 21-day sequence of tasks is automatically generated and added to the children's task lists for each day. The Kickstart progress is displayed visually.

---