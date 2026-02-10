# Real-Time Multi-Modal Collaborative Notes App
## Project Proposal - Improved Version

---

## 1. Executive Summary

This proposal outlines the development of a **Real-Time Multi-Modal Collaborative Notes App** - a hybrid application that enables users to create, edit, and collaborate on notes using multiple editing modes (document, presentation, and handwriting) in real-time. The application leverages modern web technologies (Svelte, NativeScript) with a Node.js backend and integrates AI capabilities through n8n workflows for enhanced productivity features.

**Key Value Propositions:**
- **Multi-modal editing**: Seamlessly switch between text, presentation, and handwriting modes
- **Real-time collaboration**: Google Docs-like simultaneous multi-user editing
- **AI-powered features**: OCR, intelligent chat, and context-aware assistance
- **Cross-platform**: Web and native mobile support through hybrid architecture
- **Community sharing**: Share notes publicly and collaborate with teams

---

## 2. Project Goals and Objectives

### Primary Goals
1. Create a unified note-taking platform supporting multiple editing paradigms
2. Enable real-time collaboration with conflict-free synchronization
3. Integrate AI capabilities for enhanced productivity
4. Ensure cross-platform compatibility (web, iOS, Android)

### Success Metrics
- **Performance**: Sub-100ms latency for real-time updates
- **Reliability**: 99.9% uptime for collaboration features
- **User Experience**: <2 second page load times
- **Scalability**: Support 1000+ concurrent users per workspace
- **AI Accuracy**: 95%+ OCR accuracy for handwritten content

---

## 3. Technology Stack and Rationale

### Frontend
- **Svelte 4+**: Modern, performant framework with small bundle sizes
- **NativeScript**: Native mobile capabilities without separate codebases
- **Yjs**: Conflict-free replicated data types (CRDTs) for real-time collaboration
- **TypeScript**: Type safety and better developer experience

### Backend
- **Node.js**: JavaScript runtime for code reuse and fast development
- **WebSocket (ws)**: Low-latency bidirectional communication
- **MongoDB**: Document-based storage for flexible note schemas
- **Express.js**: RESTful API framework

### AI/Workflow Automation
- **n8n**: Open-source workflow automation for AI integrations
- **Integration-ready**: Support for OpenAI, Anthropic, or self-hosted models

### Infrastructure
- **Docker**: Containerization for consistent deployments
- **Redis** (optional): Caching layer for improved performance
- **Nginx**: Reverse proxy and load balancing

### Rationale
- **Yjs over Operational Transform**: CRDTs provide better conflict resolution without a central authority
- **Svelte over React**: Smaller bundle sizes and better runtime performance
- **NativeScript over React Native**: Better integration with Svelte codebase
- **n8n over custom AI infrastructure**: Flexible, maintainable workflow management

---

## 4. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐     │
│  │  Web Client  │   │ iOS Client   │   │Android Client│     │
│  │  (Svelte)    │   │(NativeScript)│   │(NativeScript)│     │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘     │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                │
│                    ┌───────▼────────┐                       │
│                    │  Yjs Sync Layer│                       │
│                    └───────┬────────┘                       │
└────────────────────────────┼────────────────────────────────┘
                             │ WebSocket
┌────────────────────────────▼─────────────────────────────────┐
│                    Application Layer                         │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐      │
│  │ WebSocket    │   │  REST API    │   │ AI Webhook   │      │
│  │  Server      │   │  (Express)   │   │  Handler     │      │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │ Business Logic │                        │
│                    └───────┬────────┘                        │
└────────────────────────────┼─────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      Data Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   MongoDB    │  │  Redis Cache │  │ File Storage │       │
│  │  (Notes DB)  │  │  (Optional)  │  │  (Media)     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    External Services                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  n8n AI      │  │  Auth        │  │ CDN/Storage  │       │
│  │  Workflows   │  │  Provider    │  │  Provider    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Core Features

### 5.1 Multi-Modal Editing

#### 5.1.1 Document Mode (Word Mode)
- Rich text editing with formatting (bold, italic, headings, lists)
- **Slash Commands**: Quick insertion of special symbols and elements
  - Math symbols: `\pi`, `\theta`, `\sqrt[4]`, etc.
  - Interactive elements: `\image`, `\video`, `\table`, `\graph`, etc.
  - Command palettes for visual selection
- Inline markdown-like syntax for fast editing
- Real-time collaborative editing with cursor awareness

#### 5.1.2 Presentation Mode (PPT Mode)
- Frame-based editing with drag-and-drop
- Support for text frames, images, shapes, and graphs
- Layered canvas with z-index management
- Grouping and alignment tools

#### 5.1.3 Handwriting Mode
- Pressure-sensitive pen input
- Multiple pen types and colors
- Eraser and lasso selection tools
- **OCR Conversion**: Convert handwritten text to typed text
- Stroke replay for undo/redo operations

### 5.2 Real-Time Collaboration

#### 5.2.1 Presence Awareness
- Live user cursors with color-coded identification
- Active user indicators
- Frame/selection highlighting
- Real-time typing indicators

#### 5.2.2 Synchronization
- Conflict-free merging using Yjs CRDTs
- Automatic conflict resolution
- Offline support with sync on reconnect
- Version history (future enhancement)

#### 5.2.3 Sharing and Permissions
- Public note sharing with unique URLs
- Workspace-based organization
- Permission levels: owner, editor, viewer (future enhancement)
- Share links with expiration dates (future enhancement)

### 5.3 AI-Powered Features

#### 5.3.1 OCR (Optical Character Recognition)
- Convert handwriting to text
- Multi-language support (future enhancement)
- Batch processing for multiple pages

#### 5.3.2 AI Chat Assistant
- Context-aware responses based on note content
- Screen capture questioning (Ctrl+P mode)
- Visual question answering with labeled regions
- Integration with workplace context

#### 5.3.3 Content Enhancement
- Automatic summarization
- Grammar and spelling suggestions
- Content recommendations

### 5.4 Special Features

#### 5.4.1 Screen Asking Mode (Ctrl+P)
- Full-screen capture interface
- Label regions of interest (ra0, ra1, etc.)
- Multi-capture support
- Context-aware AI responses

#### 5.4.2 Command Input System
- Slash command syntax (`\command`)
- Real-time validation with visual feedback
- Parameter validation with error highlighting
- Command palette for visual selection

---

## 6. User Interface Layouts

### 6.1 Sign-In Layout
**Purpose**: Authentication and onboarding

**Components**:
- Centered login form
- Social login options (Google only)
- Password recovery link
- Terms of service and privacy policy links

**Behavior**:
- Validates credentials on submit
- Shows error messages inline
- Redirects to workplace on success

### 6.2 Workplace Layout
**Purpose**: Note management and organization

**Structure**:
- **Left Sidebar** (20% width, collapsible on mobile):
  - Workplace dropdown (owned notes)
  - Shared notes dropdown
  - Tutorial/help dropdown
  - Profile icon
  - "Create New Workplace" button

- **Main Body**:
  - Responsive grid of note cards
  - Search and filter bar
  - Sort options (date, name, recently edited)
  - Each card shows: title, preview, last edited date, collaborator avatars

**Behavior**:
- Click card → Opens note in edit layout
- Search filters notes in real-time
- Create new note → Opens blank note in edit layout

### 6.3 Edit Layout
**Purpose**: Note editing and collaboration

**Structure**:
- **Left Sidebar**: Same as workplace layout (persistent)
- **Top Toolbar**: Mode-specific tools + universal actions (save, undo/redo, share)
- **Main Body**: Editing area (canvas/text editor)
- **Bottom-Right**: Mode selector (Word/PPT/Handwrite floating buttons)

**Toolbars by Mode**:
- **Word Mode**: Formatting, lists, headings, insert elements
- **PPT Mode**: Frame tools, alignment, grouping, insert shapes
- **Handwrite Mode**: Pen settings, colors, eraser, OCR button

---

## 7. Technical Design Patterns

### 7.1 Architecture Patterns

#### 7.1.1 MVC (Model-View-Controller)
- **Models**: Data classes (Frame, StrokePoint, NoteMetadata)
- **Views**: Svelte components (SignInView, WorkplaceView, EditView)
- **Controllers**: Business logic (EditController, NotesController, ShareController)

#### 7.1.2 Singleton Pattern
- `YDocManager`: Single source of truth for collaborative document
- `ConnectionManager`: WebSocket connection management
- `UserManager`: Current user context
- `PersistenceSingleton`: Database access layer

#### 7.1.3 Command Pattern
- `AbstractCommand`: Base class for all commands
- `InsertSpecialSignCommand`: Math symbol insertion
- `InsertSpecialElementCommand`: Interactive element insertion
- `CommandProcessor`: Command invoker and validator

#### 7.1.4 State Pattern
- `EditingState`: Abstract base for editing modes
  - `WordState`: Text editing behavior
  - `PPTState`: Frame manipulation behavior
  - `HandwriteState`: Stroke capture behavior
- `ScreenAskingState`: Ctrl+P mode behavior

#### 7.1.5 Factory Pattern
- `FrameFactory`: Creates different frame types (text, image, graph, etc.)

#### 7.1.6 Facade Pattern
- `AIFacade`: Simplified interface to AI services
- `CollabController`: Simplified collaboration setup

### 7.2 Data Models

```typescript
interface NoteMetadata {
  id: string;
  title: string;
  ownerId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  workspaceId: string;
}

interface Frame {
  id: string;
  type: 'text' | 'image' | 'graph' | 'video' | 'table';
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  content?: string;
  url?: string;
  locked: boolean;
  createdAt: Date;
}

interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
  color: string;
  width: number;
  timestamp: number;
}

interface AwarenessUser {
  id: string;
  name: string;
  color: string;
  cursorPosition: { x: number; y: number };
  selectedFrameId?: string;
  currentMode: 'word' | 'ppt' | 'handwrite';
}
```

---

## 8. Command Input System Specification

### 8.1 Command Syntax

**General Rules**:
- All commands start with backslash (`\`)
- Commands execute on `Space` or `Enter` keypress
- Parameters use bracket syntax: `\command[param1,param2]`
- Escape literal backslash: `\\` → `\`

**Validation Rules**:
- ✅ Valid command with correct parameters → Instant replacement
- ⚠️ Valid command with missing/malformed parameters → Red underline
- ❌ Unknown command → Treated as plain text (no highlight)

### 8.2 Command Categories

#### Category 0: Command Palettes (Meta-commands)
These are meta-commands that open visual selection palettes. They never insert content directly but open a grid popup for fast visual selection.

- **`\math`** → Opens 6×8 grid of math symbols (left: command, right: live rendered symbol)
- **`\element`** → Opens 5×6 grid of interactive elements (left: command, right: icon + label)

**Behavior**: User clicks any cell → command is inserted and immediately executed → palette closes automatically

#### Category A: Elements (Interactive - always trigger popup on space)
These commands require user interaction via popup dialogs to configure parameters.

- **`\image`** → Image picker / URL / upload popup
- **`\video`** → Video URL + caption popup
- **`\graph`** → n×m table popup with graph types (left: command like `\graphline`, right: graph icon/preview)
- **`\table`** → Rows × columns + content configuration popup
- **`\code`** → Language selector + code editor popup
- **`\mindmap`** → New mind-map frame creation
- **`\katex[x^2+y^2=1]`** → Full LaTeX editor modal (requires parameter)
- **`\todo`** → Todo checkbox creation
- **`\quote[Einstein]`** → Blockquote + optional citation (optional parameter)
- **`\graphline`** → Popup for line graph data (x/y series, labels, colors)
- **`\graphpie`** → Popup for pie graph data (slices, values, labels)
- **`\graphbar`** → Popup for bar graph data (categories, values, stacked/grouped)
- **`\graphscatter`** → Popup for scatter graph data (points, trendline)
- **`\graphhistogram`** → Popup for histogram data (bins, frequency)
- **`\grapharea`** → Popup for area graph data (series, fill)
- **`\graphradar`** → Popup for radar graph data (axes, values)
- **`\graphbubble`** → Popup for bubble graph data (x/y/size)
- **`\graphdoughnut`** → Popup for doughnut graph data (slices, inner radius)
- **`\memorycard`** → Popup for flashcard: front/back text, optional image; interactive flip on click for study
- **`\questionbank`** → Popup for quiz bank: add questions/answers, types (MCQ, short answer); interactive mode for self-testing/random quizzing

#### Category B: Math Symbols & Signs (Inline - instant replace on space)
These commands instantly replace the text with symbols or formatted text. No popup required.

**Greek Letters & Constants:**
- **`\pi`** → π
- **`\theta`** → θ
- **`\delta`** → δ
- **`\alpha`** → α
- **`\beta`** → β
- **`\lambda`** → λ
- **`\sigma`** → σ (when used with parameters: `\sigma[i=1,10,i^2]` → summation notation ∑)

**Mathematical Operators:**
- **`\infty`** → ∞
- **`\sum`** → ∑ (require parameters: `\sigma[i=1,10,i^2]` → summation notation ∑)
- **`\int`** → ∫
- **`\sqrt[4]`** → √4 (requires parameter: `\sqrt[4]` or `\sqrt[x\^2+1]`)
- **`\approx`** → ≈
- **`\neq`** → ≠
- **`\leq`** → ≤
- **`\geq`** → ≥
- **`\pm`** → ±
- **`\times`** → ×
- **`\div`** → ÷
- **`\rightarrow`** → →
- **`\leftarrow`** → ←

**Formatting Commands (require parameters):**
- **`\^[2]`** → Superscript (e.g., `x\^[2]` → x², `e\^[i\pi]` → e^(iπ))
- **`\_[2]`** → Subscript (e.g., `H\_[2]O` → H₂O)
- **`\/[a,b]`** → Fraction (e.g., `\/[a,b]` → a/b)
- **`\sigma[i=1,10,i^2]`** → Summation notation with parameters

**Parameter Requirements:**
- Commands marked with `[param]` require parameters in bracket syntax
- Commands without brackets are instant replacements
- Invalid or missing parameters trigger red underline until corrected

### 8.3 Error Feedback

**Visual Indicators**:
- **Red wavy underline**: Command exists but parameters are invalid
- **No highlight**: Command doesn't exist (will be plain text)

**Examples**:
- `\sqrt` → Red underline until `[` appears
- `\sqrt[4]` → ✅ Instantly becomes √4
- `\xyz` → No highlight, remains as plain text

---

## 9. Screen Asking Mode (Ctrl+P) Specification

### 9.1 Workflow

1. **Activation**: Press `Ctrl+P` (or `Cmd+P` on Mac)
2. **Capture Interface**: Full-screen semi-transparent overlay appears
3. **Rectangle Creation**: Drag mouse to create labeled rectangles (ra0, ra1, etc.)
4. **Labeling**: Click "Add label" to assign label to selected rectangle
5. **Multiple Captures**: Click "Next" to capture different sections
6. **Finalization**: Click "Finish" to process all captures and open AI chat

### 9.2 Data Captured

For each capture:
- Full-page screenshot (PNG)
- Note location metadata (noteId, scrollY, viewport dimensions)
- Labeled rectangles array with coordinates
- Workplace context (all notes in current workspace)

### 9.3 AI Integration

- Screenshots and labels are sent to AI via n8n workflow
- AI chat panel opens with pre-inserted collaborative messages
- Each message shows: thumbnail, location context, labeled regions, quick action buttons
- User can ask questions referencing labels (e.g., "Explain ra0")

### 9.4 Keyboard Shortcuts

- `Ctrl+P` / `Cmd+P`: Toggle mode
- `Esc`: Cancel current rectangle
- `Backspace`: Delete latest rectangle
- `Enter` (with rectangle selected): Add label
- `N`: Next capture
- `F`: Finish and process

---

## 10. Project Structure

```
my-note-app/
├── apps/
│   ├── frontend/                   # Svelte + NativeScript app
│   │   ├── src/
│   │   │   ├── app.svelte          # Root component
│   │   │   ├── main.ts             # Entry point
│   │   │   ├── routes/             # SvelteKit routes
│   │   │   │   ├── +layout.svelte  # Global layout
│   │   │   │   ├── signin/         # Sign-in page
│   │   │   │   ├── workplace/      # Workplace page
│   │   │   │   └── edit/           # Edit page
│   │   │   ├── lib/
│   │   │   │   ├── controllers/    # MVC Controllers
│   │   │   │   │   ├── EditController.ts
│   │   │   │   │   ├── NotesController.ts
│   │   │   │   │   ├── CollabController.ts
│   │   │   │   │   ├── ShareController.ts
│   │   │   │   │   └── AuthController.ts
│   │   │   │   ├── managers/       # Singleton managers
│   │   │   │   │   ├── YDocManager.ts
│   │   │   │   │   ├── ConnectionManager.ts
│   │   │   │   │   └── UserManager.ts
│   │   │   │   ├── commands/       # Command pattern
│   │   │   │   │   ├── AbstractCommand.ts
│   │   │   │   │   ├── InsertSpecialSignCommand.ts
│   │   │   │   │   ├── InsertSpecialElementCommand.ts
│   │   │   │   │   └── CommandProcessor.ts
│   │   │   │   ├── states/         # State pattern
│   │   │   │   │   ├── EditingState.ts
│   │   │   │   │   ├── WordState.ts
│   │   │   │   │   ├── PPTState.ts
│   │   │   │   │   ├── HandwriteState.ts
│   │   │   │   │   └── ScreenAskingState.ts
│   │   │   │   ├── factories/      # Factory pattern
│   │   │   │   │   └── FrameFactory.ts
│   │   │   │   └── services/       # Service layer
│   │   │   │       ├── AIFacade.ts
│   │   │   │       ├── PopupManager.ts
│   │   │   │       └── ValidationStrategy.ts
│   │   │   ├── components/         # Svelte components
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Sidebar.svelte
│   │   │   │   │   ├── Toolbar.svelte
│   │   │   │   │   └── ModeSelector.svelte
│   │   │   │   ├── features/
│   │   │   │   │   ├── auth/
│   │   │   │   │   ├── workplace/
│   │   │   │   │   ├── edit/
│   │   │   │   │   ├── ai/
│   │   │   │   │   └── collab/
│   │   │   │   └── ui/
│   │   │   │       ├── Button.svelte
│   │   │   │       ├── Modal.svelte
│   │   │   │       └── Input.svelte
│   │   │   └── stores/             # Svelte stores (state management)
│   │   │       ├── notesStore.ts
│   │   │       ├── authStore.ts
│   │   │       └── editStore.ts
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── backend/                    # Node.js server
│       ├── src/
│       │   ├── index.ts            # Server entry point
│       │   ├── server.ts           # Express setup
│       │   ├── websocket/
│       │   │   ├── WSController.ts
│       │   │   └── YjsProvider.ts
│       │   ├── api/
│       │   │   ├── routes/
│       │   │   │   ├── notes.ts
│       │   │   │   ├── auth.ts
│       │   │   │   └── ai.ts
│       │   │   └── controllers/
│       │   │       ├── NotesAPIController.ts
│       │   │       ├── AuthAPIController.ts
│       │   │       └── AIWebhookController.ts
│       │   ├── persistence/
│       │   │   ├── PersistenceSingleton.ts
│       │   │   ├── MongoDBAdapter.ts
│       │   │   └── YDocStorage.ts
│       │   └── middleware/
│       │       ├── auth.ts
│       │       ├── errorHandler.ts
│       │       └── validation.ts
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── shared-types/               # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── Note.ts
│   │   │   ├── Frame.ts
│   │   │   ├── StrokePoint.ts
│   │   │   └── User.ts
│   │   └── package.json
│   │
│   └── utils/                      # Shared utilities
│       ├── src/
│       │   ├── validators.ts
│       │   ├── formatters.ts
│       │   └── constants.ts
│       └── package.json
│
├── workflows/                      # n8n workflows
│   ├── ocr-workflow.json
│   ├── ai-chat-workflow.json
│   └── summarize-workflow.json
│
├── docs/                           # Documentation
│   ├── api/                        # API documentation
│   ├── architecture/               # Architecture decisions
│   └── deployment/                 # Deployment guides
│
├── tests/                          # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── uml-diagrams/                   # UML diagrams
│
├── docker-compose.yml              # Local development setup
├── pnpm-workspace.yaml             # Monorepo configuration
└── package.json                    # Root package.json
```

---

## 11. Database Schema

### 11.1 MongoDB Collections

#### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  passwordHash: String,
  name: String,
  avatarUrl: String,
  createdAt: Date,
  lastLogin: Date,
  preferences: {
    theme: String,
    defaultWorkspace: ObjectId
  }
}
```

#### Notes Collection
```javascript
{
  _id: ObjectId,
  title: String,
  ownerId: ObjectId (ref: Users),
  workspaceId: ObjectId (ref: Workspaces),
  isPublic: Boolean (indexed),
  yDocSnapshot: Binary, // Yjs document state
  metadata: {
    createdAt: Date,
    updatedAt: Date,
    tags: [String],
    lastEditedBy: ObjectId
  },
  permissions: [{
    userId: ObjectId,
    role: String // 'owner' | 'editor' | 'viewer'
  }]
}
```

#### Workspaces Collection
```javascript
{
  _id: ObjectId,
  name: String,
  ownerId: ObjectId (ref: Users),
  memberIds: [ObjectId],
  createdAt: Date,
  settings: {
    defaultView: String,
    color: String
  }
}
```

#### Sessions Collection (for WebSocket connections)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  noteId: ObjectId,
  socketId: String,
  joinedAt: Date,
  lastActivity: Date
}
```

### 11.2 Indexing Strategy

- **Notes**: Index on `ownerId`, `workspaceId`, `isPublic`, `metadata.updatedAt`
- **Users**: Index on `email` (unique)
- **Sessions**: TTL index on `lastActivity` (auto-cleanup after 1 hour)

---

## 12. API Specifications

### 12.1 REST API Endpoints

#### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
```

#### Notes
```
GET    /api/notes                    # List user's notes
POST   /api/notes                    # Create new note
GET    /api/notes/:id                # Get note metadata
PUT    /api/notes/:id                # Update note metadata
DELETE /api/notes/:id                # Delete note
GET    /api/notes/:id/snapshot       # Get Yjs document snapshot
POST   /api/notes/:id/share          # Generate share link
```

#### Workspaces
```
GET    /api/workspaces
POST   /api/workspaces
GET    /api/workspaces/:id
PUT    /api/workspaces/:id
DELETE /api/workspaces/:id
GET    /api/workspaces/:id/notes
```

#### AI
```
POST   /api/ai/ocr                   # Upload image for OCR
POST   /api/ai/chat                  # Send chat message
POST   /api/ai/summarize             # Summarize note content
POST   /webhooks/ai                  # n8n webhook receiver
```

### 12.2 WebSocket Events

#### Client → Server
```typescript
{
  type: 'join-room',
  noteId: string,
  userId: string
}

{
  type: 'yjs-update',
  noteId: string,
  update: Uint8Array  // Yjs binary update
}

{
  type: 'awareness-update',
  noteId: string,
  awareness: AwarenessUpdate
}
```

#### Server → Client
```typescript
{
  type: 'yjs-update',
  update: Uint8Array,
  source: string  // userId who sent the update
}

{
  type: 'awareness-update',
  awareness: AwarenessUpdate
}

{
  type: 'user-joined',
  userId: string,
  userInfo: AwarenessUser
}

{
  type: 'user-left',
  userId: string
}

{
  type: 'ai-result',
  requestId: string,
  result: any
}
```

---

## 13. Security Considerations

### 13.1 Authentication & Authorization
- **JWT tokens** for stateless authentication
- **Refresh tokens** with rotation
- **Role-based access control** (RBAC) for workspace permissions
- **Rate limiting** on authentication endpoints
- **Password hashing** using bcrypt (10+ rounds)

### 13.2 Data Security
- **HTTPS/WSS** for all communications
- **Input validation** and sanitization
- **SQL injection prevention** (though using NoSQL, still validate)
- **XSS protection** through framework defaults + Content Security Policy
- **CORS** configuration for allowed origins

### 13.3 Real-Time Security
- **WebSocket authentication** via token verification
- **Room-based isolation** (users can only join authorized notes)
- **Update validation** before applying to Yjs document
- **Abuse prevention** (rate limiting on updates)

### 13.4 AI/External Services
- **API key management** (environment variables, secrets management)
- **Input sanitization** before sending to AI services
- **Output validation** before displaying to users
- **Privacy considerations** (user data not stored by AI providers)

---

## 14. Performance Requirements

### 14.1 Latency Targets
- **Initial page load**: < 2 seconds
- **Note opening**: < 500ms
- **Real-time update propagation**: < 100ms
- **AI response time**: < 3 seconds (async acceptable)
- **OCR processing**: < 5 seconds

### 14.2 Scalability Targets
- **Concurrent users per note**: 50+
- **Concurrent users per workspace**: 1000+
- **Notes per user**: 10,000+
- **Document size**: Up to 10MB per note

### 14.3 Optimization Strategies
- **Code splitting** in frontend bundles
- **Lazy loading** of components
- **Virtual scrolling** for large note lists
- **Debouncing** on input fields
- **Caching** frequently accessed notes
- **CDN** for static assets
- **Database connection pooling**
- **Yjs document compression** for storage

---

## 15. Testing Strategy

### 15.1 Unit Tests
- **Coverage target**: 80%+ for business logic
- **Frameworks**: Vitest (frontend), Jest (backend)
- **Focus areas**:
  - Controllers and business logic
  - Command processing
  - State management
  - Utility functions

### 15.2 Integration Tests
- **API endpoint testing**: Supertest
- **WebSocket connection testing**
- **Database operations**
- **Yjs synchronization testing**

### 15.3 End-to-End Tests
- **Framework**: Playwright or Cypress
- **Scenarios**:
  - User registration and login
  - Note creation and editing
  - Real-time collaboration
  - Mode switching
  - Command input
  - AI features

### 15.4 Performance Tests
- **Load testing**: k6 or Artillery
- **Stress testing**: Maximum concurrent users
- **Memory leak detection**: Long-running sessions

---

## 16. Deployment Strategy

### 16.1 Development Environment
- **Local setup**: Docker Compose
- **Services**: MongoDB, Redis, n8n
- **Hot reload**: Vite dev server + nodemon

### 16.2 Staging Environment
- **Purpose**: Pre-production testing
- **Deployment**: Automated via CI/CD
- **Database**: Separate staging database
- **Monitoring**: Full monitoring enabled

### 16.3 Production Environment
- **Containerization**: Docker
- **Orchestration**: Kubernetes or Docker Swarm
- **Database**: Managed MongoDB (MongoDB Atlas)
- **Hosting**: AWS/GCP/Azure or VPS
- **CDN**: CloudFront/Cloudflare
- **SSL**: Let's Encrypt or managed certificates

### 16.4 CI/CD Pipeline
1. **Code commit** → Trigger pipeline
2. **Linting & type checking**
3. **Unit tests**
4. **Build artifacts**
5. **Integration tests**
6. **Deploy to staging**
7. **E2E tests on staging**
8. **Manual approval**
9. **Deploy to production**

---

## 17. Monitoring and Logging

### 17.1 Application Monitoring
- **Error tracking**: Sentry or similar
- **Performance monitoring**: APM tool (New Relic, Datadog)
- **Uptime monitoring**: Pingdom or UptimeRobot
- **Real-time metrics**: Prometheus + Grafana

### 17.2 Logging
- **Structured logging**: JSON format
- **Log levels**: ERROR, WARN, INFO, DEBUG
- **Log aggregation**: ELK stack or similar
- **Retention**: 30 days for production logs

### 17.3 Key Metrics to Monitor
- Request latency (p50, p95, p99)
- Error rates
- Active WebSocket connections
- Database query performance
- Memory and CPU usage
- User activity (DAU, MAU)

---

## 18. Risk Assessment and Mitigation

### 18.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Yjs synchronization conflicts | High | Medium | CRDT design handles conflicts; add conflict resolution UI |
| WebSocket connection instability | High | Medium | Implement reconnection logic with exponential backoff |
| AI service downtime | Medium | Low | Fallback to local processing; queue requests |
| Database performance degradation | High | Medium | Indexing strategy; query optimization; caching |
| Large document performance | Medium | High | Implement pagination; virtual scrolling; lazy loading |

### 18.2 Project Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Scope creep | Medium | High | Clear requirements; feature freeze periods |
| Timeline delays | Medium | Medium | Agile methodology; regular sprint reviews |
| Resource constraints | High | Low | Cross-training; documentation; modular architecture |
| Third-party service changes | Medium | Low | Abstract external services; maintain alternatives |

---

## 19. Timeline and Milestones

### Phase 1: Foundation (Weeks 1-4)
- **Week 1-2**: Project setup, basic authentication, database schema
- **Week 3-4**: Core UI layouts (Sign-in, Workplace, Edit)

### Phase 2: Core Features (Weeks 5-10)
- **Week 5-6**: Word mode editing with basic formatting
- **Week 7-8**: Yjs integration and real-time sync
- **Week 9-10**: PPT mode and Handwrite mode

### Phase 3: Advanced Features (Weeks 11-16)
- **Week 11-12**: Command input system
- **Week 13-14**: AI integration (OCR, chat)
- **Week 15-16**: Screen Asking Mode (Ctrl+P)

### Phase 4: Polish and Launch (Weeks 17-20)
- **Week 17-18**: Testing and bug fixes
- **Week 19**: Performance optimization
- **Week 20**: Documentation and deployment

**Total Duration**: ~20 weeks (5 months)

---

## 20. Resource Requirements

### 20.1 Team Composition
- **1-2 Frontend Developers** (Svelte, TypeScript)
- **1 Backend Developer** (Node.js, MongoDB, WebSockets)
- **1 Full-stack Developer** (can work on both)
- **1 DevOps Engineer** (part-time, for deployment and infrastructure)
- **1 UI/UX Designer** (part-time, for design assets)

### 20.2 Infrastructure Costs (Estimated Monthly)
- **Development**: $100-200 (VPS, databases)
- **Staging**: $50-100
- **Production**: $200-500 (scales with usage)
  - Hosting: $50-150
  - Database: $50-200
  - CDN: $20-50
  - AI Services: $50-200 (usage-based)

---

## 21. Future Enhancements

### 21.1 Short-term (Post-MVP)
- Version history and document revision
- Export to PDF, DOCX, PPTX
- Mobile app optimization
- Offline mode improvements
- Commenting system

### 21.2 Medium-term (3-6 months)
- Video/audio recording in notes
- Advanced graph types
- Custom themes and plugins
- Team collaboration features (channels, mentions)
- Advanced permissions (folder-level)

### 21.3 Long-term (6+ months)
- Collaborative whiteboard mode
- Integration with third-party services (Google Drive, Notion, etc.)
- Mobile native apps (iOS/Android)
- Enterprise features (SSO, audit logs, compliance)
- Multi-language support
- Advanced AI features (auto-summarization, smart suggestions)

---

## 22. Success Criteria

### 22.1 Technical Success
- ✅ All core features implemented and tested
- ✅ Real-time sync latency < 100ms
- ✅ 99.9% uptime
- ✅ Zero critical security vulnerabilities
- ✅ Performance benchmarks met

### 22.2 User Experience Success
- ✅ Intuitive UI with < 5 minute learning curve
- ✅ Smooth mode switching (< 200ms)
- ✅ Responsive on mobile devices
- ✅ Positive user feedback (> 4/5 rating)

### 22.3 Business Success
- ✅ Successful beta launch with 100+ users
- ✅ User retention rate > 60% after 30 days
- ✅ Positive Net Promoter Score (NPS > 50)

---

## 23. Conclusion

This proposal outlines a comprehensive plan for developing a Real-Time Multi-Modal Collaborative Notes App. The architecture leverages modern technologies and design patterns to create a scalable, maintainable, and user-friendly application. The phased approach allows for iterative development and early user feedback, while the clear technical specifications ensure alignment across the development team.

**Key Strengths**:
- Clear separation of concerns with MVC architecture
- Robust real-time collaboration using CRDTs
- Flexible command system for power users
- AI integration for enhanced productivity
- Cross-platform support through hybrid architecture

**Next Steps**:
1. Review and approve proposal
2. Set up development environment
3. Begin Phase 1 development
4. Establish communication channels and project management tools

---

## Appendix A: Glossary

- **CRDT**: Conflict-free Replicated Data Type
- **Yjs**: A CRDT implementation for real-time collaboration
- **MVC**: Model-View-Controller architecture pattern
- **RBAC**: Role-Based Access Control
- **OCR**: Optical Character Recognition
- **CDN**: Content Delivery Network
- **SSO**: Single Sign-On
- **APM**: Application Performance Monitoring

## Appendix B: References

- [Yjs Documentation](https://docs.yjs.dev/)
- [Svelte Documentation](https://svelte.dev/docs)
- [NativeScript Documentation](https://docs.nativescript.org/)
- [n8n Documentation](https://docs.n8n.io/)
- [MongoDB Best Practices](https://www.mongodb.com/docs/manual/administration/production-notes/)

---

**Document Version**: 2.0  
**Last Updated**: 2024  
**Author**: Development Team  
**Status**: Proposal

