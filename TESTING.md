# Running the App - Real-Time Multi-Modal Collaborative Notes

## Prerequisites

- **Node.js** 18+ installed
- **MongoDB** running locally or connection string configured
- **npm** or **pnpm** package manager

---

## 🌐 Web (All Platforms)

### Development Server

```bash
# Install dependencies
cd apps/frontend
npm install

# Start dev server
npm run dev
```

Opens at `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

---

## 🖥️ Backend Server

```bash
# Start MongoDB (Docker)
docker-compose up -d

# Install dependencies
cd apps/backend
npm install

# Start server
npm run dev
```

Runs at `http://localhost:3000`

> **Note**: MongoDB runs in Docker on port `27017`. Use `docker-compose down` to stop it.

---

## 📱 Android

### Prerequisites
- Android Studio installed
- Android SDK configured

### Run

```bash
# Build and sync (required after code changes)
npm run build
npm run cap:sync

# Open in Android Studio
npm run cap:open:android
```

In Android Studio: Press `Shift+F10` to run on emulator/device.

> ⚠️ **Important**: Android uses a static copy of the app. Run `npm run build; npm run cap:sync` after making changes to see updates.

---

## 🍎 iOS (macOS only)

### Prerequisites
- Xcode installed
- CocoaPods installed

### Run

```bash
# Build and sync (required after code changes)
npm run build
npm run cap:sync

# Open in Xcode
npm run cap:open:ios
```

In Xcode: Press `Cmd+R` to run on simulator/device.

> ⚠️ **Important**: iOS uses a static copy of the app. Run `npm run build && npm run cap:sync` after making changes to see updates.

---

## 🪟 Windows Desktop (Electron)

```powershell
# Build, sync, and launch (required after code changes)
npm run build
npx cap sync electron
npm run electron:start
```

Or use the shortcut:

```powershell
npm run electron:build; npm run electron:start
```

With live reload (watches for changes):

```powershell
npm run electron:start-live
```

> ⚠️ **Important**: Electron loads from `electron/app/` folder (static copy). Run build + sync after making changes to see updates.

---

## 🐧 Linux Desktop (Electron)

```bash
# Build, sync, and launch (required after code changes)
npm run build
npx cap sync electron
npm run electron:start
```

Or use the shortcut:

```bash
npm run electron:build && npm run electron:start
```

To create distributable:

```bash
cd electron
npm run electron:make
```

Creates `.AppImage`, `.deb`, `.rpm` in `electron/dist/`.

> ⚠️ **Important**: Electron loads from `electron/app/` folder (static copy). Run build + sync after making changes to see updates.

---

## 🍏 macOS Desktop (Electron)

```bash
# Build, sync, and launch (required after code changes)
npm run build
npx cap sync electron
npm run electron:start
```

Or use the shortcut:

```bash
npm run electron:build && npm run electron:start
```

To create distributable:

```bash
cd electron
npm run electron:make
```

Creates `.dmg` and `.app` in `electron/dist/`.

> ⚠️ **Important**: Electron loads from `electron/app/` folder (static copy). Run build + sync after making changes to see updates.

---

## Quick Reference

| Platform | Command | Live Reload? |
|----------|---------|--------------|
| Web Dev | `npm run dev` | ✅ Yes |
| Backend | `cd apps/backend; npm run dev` | ✅ Yes |
| Android | `npm run build; npm run cap:sync` | ❌ No (rebuild required) |
| iOS | `npm run build; npm run cap:sync` | ❌ No (rebuild required) |
| Electron (Win/Linux/Mac) | `npm run electron:build; npm run electron:start` | ❌ No (rebuild required) |

> **Note**: Use `;` instead of `&&` in PowerShell. On Linux/macOS bash, both work.

> **Web vs Native**: Web dev server shows changes instantly. Android, iOS, and Electron use static copies - you must rebuild and sync after code changes.

---

## Troubleshooting

**Port in use**: Kill process or change port in `vite.config.ts`

**Android not building**: Run `cd android; ./gradlew clean` (or `cd android; .\gradlew.bat clean` on Windows PowerShell)

**Electron won't start**: Run `cd electron; npm install` first
