## LiveFlow Chat App – Project Overview

### 1. What this project is

LiveFlow is a **full‑stack, interest‑based real‑time chat application**.  
It lets people:

- Register and log in (with email OTP verification and password reset)
- Choose **interests/tags** (Technology, Art, Music, etc.)
- Discover other users with similar interests and send **chat requests**
- Accept requests and then chat in a modern messenger‑style UI
- Set a **mood/emotion status** (emoji + sentence) that others can see
- Switch between **English and Amharic** for the entire UI

The goal is to help users **“Build Meaningful Connections”** through shared passions.

---

### 2. Project structure

At the repository root you have two main apps:

- `ChatPulseBackend/` – **Laravel** backend (REST API + WebSockets)
- `web_chatapp/` – **React + Vite** frontend

The frontend talks to the backend using JSON APIs under `http://127.0.0.1:8000/api/...`, and optionally to a WebSocket server at `ws://127.0.0.1:6001` for real‑time updates.

---

### 3. Frontend (web_chatapp)

**Tech stack**

- React (functional components, hooks)
- Vite for dev/build
- Tailwind CSS + Shadcn UI components
- Redux Toolkit Query (RTK Query) for data fetching
- `react-i18next` for internationalization (EN/AM)
- Contexts: `AuthContext`, `ThemeContext`, `WebSocketContext`, `ChatsContext`

**Key features**

- **Authentication flows**
  - Register → pick interests → verify email with OTP
  - Login, logout, forgot password (temporary password email), reset password
  - Per‑user **language preference** (English / Amharic)

- **Chat layout**
  - `ChatLayout.jsx` divides the screen into:
    - **Left sidebar** (`ChatSidebar.jsx`): current user, search, navigation tabs
    - **Center** (`ChatMain.jsx`): messages, day separators, reactions, attachments
    - **Right panel** (`ChatRightPanel.jsx`): Discovery, Requests, Settings, Contact Info

- **Discovery & Requests**
  - `DiscoveryView.jsx`: shows recommended users based on interests; lets you **Send Request**
  - `RequestsView.jsx`: shows incoming chat requests with **Accept / Decline**

- **Conversations & messages**
  - `ChatsView.jsx`: lists conversations with:
    - Other user’s name, avatar, bio snippet
    - Last message + timestamp
    - Unread count badge
    - Online indicator
    - Mood emoji badge (if set and still fresh)
  - `ChatMain.jsx`: displays the active conversation:
    - Messages grouped and separated by **day** (“Today”, etc.)
    - Supports text, files, images and reply‑to
    - Handles blocked‑user messages (shows a warning instead of sending)

- **Profile & settings**
  - `ProfileView.jsx`: user can:
    - Change profile picture
    - Edit first/last name, username, phone, bio
    - Add/remove interest tags
    - See and edit **mood/emotion**
  - `SettingsView.jsx`: controls:
    - Theme (light/dark)
    - Notifications (sound/push toggles)
    - Privacy (read receipts, show online status)
    - **Language** selector (EN/AM) – persists via backend
    - Export chat data, delete account

- **Mood / emotion status**
  - Frontend helper in `src/lib/mood.js` defines:
    - Allowed mood keys (e.g. `happy`, `sad`, `exhausted`, `anxious`, `calm`, `energetic`, `stressed`)
    - Emoji mapping
    - `getFormattedMoodSentence(moodKey, t)` which uses i18n:
      - EN: `😊 I am feeling happy today`
      - AM: `😊 ዛሬ ደስተኛ ነኝ`
  - Mood is shown:
    - On profile (full sentence)
    - On the chat header
    - As an emoji badge on avatars in the chat list
  - Mood is only shown if it is **less than 24 hours old** (based on `mood_updated_at`)
  - A “How do you feel today?” modal can be triggered **after login and every 24 hours**

- **Amharic / English translations**
  - i18n config: `src/i18n/index.js`
  - Locales:
    - `src/i18n/locales/en.json`
    - `src/i18n/locales/am.json`
  - All user‑visible strings (buttons, labels, headings, errors, mood sentences, etc.) are referenced via `t("key.path")` and defined in JSON, for example:
    - `auth.loginTitle`, `auth.signUp`, `home.heroTitle1`, `chat.failedToLoadChats`, `profile.bio`, `settings.language`
  - The **language selector** in the header and settings updates:
    - `i18next` current language
    - The user’s `language` field in the database via an API call

---

### 4. Backend (ChatPulseBackend)

**Tech stack**

- Laravel (PHP)
- MySQL
- Laravel Sanctum for API token auth
- Laravel Echo + WebSockets (Reverb / Pusher‑compatible)

**Key models**

- `User`
  - Fields: `email`, `password`, `role` (`user`/`admin`), `profile_picture`, `mood`, `mood_updated_at`, `language`, timestamps
  - Accessor: `profile_picture_url`
  - Relationships: `profile()`, `conversations()`, `buckets()`, etc.

- `UserProfile`
  - Fields: `first_name`, `last_name`, `user_name`, `phone`, `bio`, `status` (`Active`, `Suspended`, `Banned`), etc.

- `Conversation`, `Message`
  - Standard chat conversations and messages table with sender/receiver, content, attachments, `read_at`, etc.

- `ChatRequest`
  - Represents a pending chat request between two users before a conversation is created.

- `UserBlock`
  - `blocker_id`, `blocked_user_id`
  - Used to prevent blocked users from sending messages.

**Important controllers**

- **Auth**
  - `RegisterController` – register user + profile + tags.
  - `LoginController` – handles normal and temporary password login; checks email verification and account status (Active/Suspended/Banned); returns `user` + `token`.
  - `EmailVerificationController` – sends OTP and verifies it. On success:
    - Marks email verified
    - Logs in user
    - Returns `user` (with profile) + `token`
  - `ForgotPasswordController` / `ResetPasswordController` – forgot/reset password with optional temporary password email.

- **User profile & mood**
  - `App\Http\Controllers\Api\Users\UserProfile`
    - Returns profile data and selected tags.
    - Updates profile fields and tags.
    - Updates `language`.
    - Has an authenticated endpoint to **update mood**:
      - Validates that the mood key is allowed
      - Stores `mood` and `mood_updated_at` on `users` table

- **Chat and conversations**
  - `ChatController` (under `/api/chat/...` with `auth:sanctum`):
    - `sendChatRequest`, `listReceivedRequests`, `acceptRequest`, `rejectRequest`
    - `listUserConversations` – `GET /chat/users/{userId}/conversations`
      - Checks that `{userId}` equals the authenticated user
      - Returns conversations with other user’s profile, last message, unread count, mood, etc.
    - `fetchMessages`, `sendMessage`, `deleteConversation`, `markAsRead`
    - `blockUser`, `unblockUser` – uses `user_blocks` table to enforce blocking

- **Admin**
  - `ReportController` (admin) – lists and processes user reports.
  - `UserManagementController` – updates account status; integrates with report actions (warnings, suspensions).

**WebSockets / notifications**

- `routes/channels.php` declares private channels like:
  - `chat.{conversationId}` – only participants of that conversation can subscribe.
- When messages are created or deleted, notifications are broadcast:
  - Frontend `WebSocketContext` or other listeners can refresh chat lists, show real‑time updates, etc.
- If the WebSocket server is not running, the app still works via HTTP polling but logs a console warning.

---

### 5. Typical user flow (end‑to‑end)

1. **Visitor lands on `/` (Home)**  
   Sees hero, features, CTA, language selector next to “Sign In”.

2. **Sign Up**
   - Fills registration form (names, username, email, phone, bio, password).
   - Chooses **interest tags**.
   - Backend saves data and sends a 6‑digit OTP email.
   - OTP screen (`Enter OTP`) appears. On success:
     - Email verified.
     - Backend returns `user` + `token`.
     - Frontend stores `user` and `token` in `AuthContext` + `localStorage` and navigates to `/chat`.

3. **First time in chat**
   - `AuthContext` loads user.
   - `ChatsView` calls `/api/chat/users/{userId}/conversations`.
   - If no conversations yet, user sees an empty state and can:
     - Open **Discover** to find people and send chat requests.

4. **Mood prompt**
   - After login (and then at most every **24 hours**), a **Mood Prompt** UI asks:
     > “How do you feel today?”
   - User chooses one of the fixed mood options.
   - Frontend calls `/api/user/mood` with `{ mood: "happy" }`, backend saves key + timestamp.
   - Mood is visible to others (avatar badge, profile, chat header) until it’s older than 24 hours.

5. **Discover & requests**
   - User opens **Discovery**: recommended users appear with interests and match scores.
   - Clicking **Send Request** calls `/api/chat/requests`.
   - Recipient sees the request in **Requests** and **Accepts** it → backend creates a conversation.

6. **Chatting**
   - Messages are sent via `/api/chat/conversations/{conversationId}/messages/send`.
   - Messages show in `ChatMain` with day separators, timestamps, emoji reactions, attachments, and blocked‑user handling.

7. **Profile & settings**
   - User can adjust profile details, mood, interests, language, privacy options, etc.
   - Changing language updates both backend `language` and the frontend i18n language.

8. **Reporting / admin actions**
   - Users can report others; reports go to admin.
   - Admin can send a **warning** (“your account has been reported, after 3 times you will be suspended”), suspend, or ban.
   - Suspended users see a special dialog after login; banned users cannot log in.

---

### 6. Local folder structure (frontend)

This is the folder structure for the **`web_chatapp/`** React app (simplified to the most important parts):

- `web_chatapp/`
  - `index.html` – Vite entry HTML
  - `package.json` – frontend dependencies and scripts
  - `vite.config.js` – Vite configuration
  - `src/`
    - `main.jsx` – React root render, wraps `App` with providers (Auth, Theme, i18n, Redux, etc.)
    - `App.jsx` – top‑level routes and layouts
    - `index.css`, `App.css` – global styles
    - `app/`
      - `store.js` – Redux store and RTK Query setup
    - `assets/` – static images like `hero.png`
    - `components/`
      - `home/` – landing page sections (`hero`, `header`, `feature`, `footer`, etc.)
      - `chat/`
        - `ChatLayout.jsx`, `ChatSidebar.jsx`, `ChatMain.jsx`, `ChatRightPanel.jsx`
        - `views/` – `ChatsView`, `DiscoveryView`, `ProfileView`, `RequestsView`, `SettingsView`, `ContactInfoView`
        - `MoodPromptModal.jsx` – daily mood / emotion picker
      - `admin/`
        - `AdminLayout`, `AdminSidebar`, `ReportsDashboard`
        - `views/` – admin dashboards, logs, suspended messages, user management
      - `features/`
        - `ReportForm.jsx` – user → admin report modal
      - `ui/` – Shadcn UI building blocks (Button, Card, Dialog, Tabs, etc.)
      - Reusable helpers: `ProtectedRoute`, `DeleteAccountDialog`, `ChangePasswordDialog`, `NotificationBell`, etc.
    - `contexts/`
      - `AuthContext.jsx`, `ThemeContext.jsx`, `WebSocketContext.jsx`, `ChatsContext.tsx`
    - `features/`
      - `home/page.jsx`, `login/page.jsx`, `register/page.jsx`, `chat/page.jsx`, `admin/page.jsx`, etc. – route‑level pages
    - `i18n/`
      - `index.js` – i18n initialization
      - `locales/en.json`, `locales/am.json` – English and Amharic translations
    - `lib/`
      - `mood.js` – mood keys, emoji, sentence generator
      - `utils.ts` – generic helpers
    - `route/routes.js` – React Router / app routes configuration
    - `services/`
      - `authService.js`, `chatService.js`, `userService.js`, `reportService.js`, `adminService.js`, `matchService.js`, etc.
      - `echo.js` and `*WebSocketService.js` – Laravel Echo / WebSocket helpers
    - `hooks/`
      - `use-toast.ts`, `use-mobile.ts` – reusable hooks

> The backend (`ChatPulseBackend/`) has its own standard **Laravel** structure (`app/`, `routes/`, `config/`, `database/`, etc.).

---

### 7. How to run the project (frameworks & commands)

#### 7.1. Frontend (`web_chatapp/`)

**Frameworks / libraries used**

- **React** with hooks
- **Vite** for dev server and bundling
- **Redux Toolkit + RTK Query** for API calls and caching
- **react-router** (via `routes.js`) for client‑side routing
- **Shadcn UI + Tailwind CSS** for UI components and styling
- **react-i18next / i18next** for internationalization (EN/AM)
- **Laravel Echo** + WebSockets client for real‑time updates (optional)

**Typical commands**

From the `web_chatapp/` directory:

- Install dependencies:

  ```bash
  npm install
  ```

- Start the dev server (default: `http://localhost:3000`):

  ```bash
  npm run dev
  ```

- Create a production build:

  ```bash
  npm run build
  ```

- Preview the production build locally:

  ```bash
  npm run preview
  ```

#### 7.2. Backend (`ChatPulseBackend/`, Laravel)

**Frameworks / libraries used**

- **Laravel** (PHP framework)
- **MySQL** for persistence
- **Laravel Sanctum** for API authentication
- **Laravel Echo / WebSockets** (Reverb / Pusher compatible) for real‑time chat

**Typical commands** (run inside `ChatPulseBackend/`):

- Install PHP dependencies:

  ```bash
  composer install
  ```

- Copy and edit the environment file:

  ```bash
  cp .env.example .env
  ```

- Generate application key:

  ```bash
  php artisan key:generate
  ```

- Run database migrations (creates `users`, `messages`, `conversations`, `user_blocks`, etc.):

  ```bash
  php artisan migrate
  ```

- Start the API server (default: `http://127.0.0.1:8000`):

  ```bash
  php artisan serve
  ```

- (If using WebSockets / Reverb) start the WebSocket server:

  ```bash
  php artisan reverb:start
  ```

> The frontend expects the API at `http://127.0.0.1:8000/api/...` and the WebSocket server at `ws://127.0.0.1:6001/...` (configurable in the `services/echo*.js` files).

---

### 8. Extensibility

The project is designed to be **easy to extend**:

- To add a new language:
  - Create a new `locales/<lang>.json`
  - Add it to the i18n config and language selector
- To add more moods:
  - Update the mood list in `src/lib/mood.js`
  - Add translations under `mood.*` in each locale file
- To add new features:
  - Create backend endpoints in Laravel controllers
  - Hook them up in `src/services/*Service.js`
  - Consume them via RTK Query hooks in React components

This MD file should give you a detailed mental model of **what the project is for, where things live, and how they work together** across backend, frontend, mood feature, i18n, and admin tools.

