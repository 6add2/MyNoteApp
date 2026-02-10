# UML Diagrams for Real-Time Multi-Modal Collaborative Notes App

This directory contains comprehensive UML diagrams documenting the architecture and design of the Real-Time Multi-Modal Collaborative Notes App.

## Diagrams Overview

### 1. Class Diagram (`class-diagram.puml`)
**Purpose**: Shows the complete object-oriented structure of the application, including all classes, their relationships, and design patterns used.

**Key Elements**:
- **Singletons**: YDocManager, ConnectionManager, UserManager, PersistenceSingleton
- **Controllers**: CollabController, ShareController, NotesController, EditController
- **Command Pattern**: AbstractCommand, InsertSpecialSignCommand, InsertSpecialElementCommand, CommandProcessor
- **State Pattern**: EditingState (WordState, PPTState, HandwriteState), ScreenAskingState
- **Factory Pattern**: FrameFactory
- **Data Models**: Frame, StrokePoint, NoteMetadata, AwarenessUser

**Design Patterns Highlighted**:
- Singleton Pattern (global managers)
- MVC Pattern (Controllers, Models, Views)
- Command Pattern (slash commands)
- State Pattern (editing modes, screen asking mode)
- Factory Pattern (frame creation)
- Facade Pattern (AIFacade, CollabController)

### 2. Sequence Diagram (`sequence-diagram.puml`)
**Purpose**: Illustrates the interaction flow when a user opens a note and real-time collaboration is established.

**Key Interactions**:
1. User clicks note block in WorkplaceView
2. Note metadata is fetched
3. EditController opens the note
4. CollabController establishes WebSocket connection
5. ConnectionManager connects to backend
6. YDocManager loads/syncs collaborative document
7. ModeContext switches to WordState
8. Real-time text editing synchronization

### 3. State Diagram (`state-diagram.puml`)
**Purpose**: Shows state transitions for editing modes and screen asking mode.

**States Covered**:
- **Editing Modes**: WordState (Text Editing, Command Mode), PPTState (Frame Selection, Frame Editing), HandwriteState (Drawing, OCR Processing)
- **Screen Asking Mode**: Inactive, Active (Creating Rectangles, Capturing, Processing)
- **Application Layouts**: SignInLayout, WorkplaceLayout, EditLayout

### 4. Component/Deployment Diagram (`component-diagram.puml`)
**Purpose**: Depicts the high-level system architecture and component relationships.

**Architecture Layers**:
- **Frontend**: Layout Views, Controllers, Services, State Management, Global Managers
- **Backend**: WebSocket Server, REST API, Persistence Layer, AI Integration
- **External Services**: n8n Workflows, MongoDB

### 5. Command Pattern Diagram (`command-pattern-diagram.puml`)
**Purpose**: Detailed sequence diagram showing how the special command input feature works (slash commands like `\pi`, `\image`).

**Flow**:
1. User types command (e.g., `\pi`)
2. CommandProcessor validates command
3. Routes to appropriate Command subclass
4. Math symbols insert directly
5. Elements trigger popup via PopupManager
6. Results inserted into YDocManager

### 6. Use Case Diagram (`use-case-diagram.puml`)
**Purpose**: Shows the main features and functionalities from a user perspective.

**Use Cases**:
- Authentication & Access
- Note Management
- Editing Features (Word, PPT, Handwriting modes)
- Collaboration (sharing, real-time sync)
- AI Features (OCR, chat, screen asking mode)
- Special Features (slash commands, command palettes)

## How to View the Diagrams

### Option 1: Online (Recommended)
1. Copy the contents of any `.puml` file
2. Paste into [PlantUML Web Server](http://www.plantuml.com/plantuml/uml/)
3. View the rendered diagram

### Option 2: VS Code Extension
1. Install the "PlantUML" extension in VS Code
2. Open any `.puml` file
3. Press `Alt+D` (or right-click → Preview) to see the diagram

### Option 3: Command Line
1. Install PlantUML: `npm install -g node-plantuml`
2. Generate images: `puml generate uml-diagrams/*.puml --output uml-diagrams/images/`

## Design Patterns Summary

The application extensively uses object-oriented design patterns:

1. **Singleton Pattern**: Ensures single instance of global managers (YDocManager, ConnectionManager, UserManager, PersistenceSingleton)

2. **MVC Pattern**: Clear separation of concerns:
   - **Models**: NotesModel, data classes (Frame, StrokePoint, etc.)
   - **Views**: Svelte components (SignInView, WorkplaceView, EditView)
   - **Controllers**: EditController, NotesController, ShareController

3. **Command Pattern**: Handles slash commands with AbstractCommand base class and concrete implementations

4. **State Pattern**: Manages editing modes (WordState, PPTState, HandwriteState) and screen asking mode

5. **Factory Pattern**: FrameFactory creates different types of frames dynamically

6. **Facade Pattern**: AIFacade provides simplified interface to complex AI services

7. **Strategy Pattern**: Used in command validation (ValidatorStrategy)

## Key Architectural Decisions

1. **Yjs for Real-time Collaboration**: Uses Yjs (CRDT) for conflict-free collaborative editing
2. **WebSocket for Real-time Sync**: Persistent WebSocket connections for low-latency updates
3. **Hybrid App**: Svelte for web, NativeScript for native mobile support
4. **n8n Integration**: Workflow automation for AI features (OCR, chat, summarization)
5. **MongoDB Persistence**: Stores Yjs documents for offline access and history

## Notes on Proposal

The UML diagrams are based on the proposal document. All major classes, relationships, and patterns described in the proposal have been included. The diagrams follow standard UML notation and PlantUML syntax.

If you notice any discrepancies or wish to add additional diagrams (e.g., activity diagrams for specific workflows), please feel free to suggest improvements.

