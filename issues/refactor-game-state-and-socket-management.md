---

### Refactor Game State and Socket Management for v1.0 Release

This issue outlines the planned restructuring and improvements for the game state management and socket handling logic in `app/composables/sockets/game.ts`. The goal is to make the system more modular, efficient, and scalable for the 1.0 release.

#### **Proposed Changes**

1. **State Management**
   - Adopt Pinia for modular and centralized state management. Create distinct stores for:
     - **GameStore**: Manage core game data (e.g., `game`, `gameState`).
     - **VoteStore**: Centralize vote handling logic (`addVote`, `removeVote`, `voted`).
     - **LobbyStore**: Handle lobby-related states.
   - Normalize and encapsulate initial state within modules for cleaner resets.

2. **Event Handling**
   - Abstract redundant logic in events like `addVote` and `removeVote` using higher-order reusable functions.
   - Break down `connect` function into smaller responsibilities:
     - `subscribeSocketEvents`: Handles socket event listeners.
     - `initializeGameState`: Initializes game state on connection.
     - `routeToLobby`: Handles routing back to the lobby.

3. **Socket Optimization**
   - Introduce guards and reconnection logic for lost socket connections.
   - Optimize state updates by sending diffs rather than full game state objects (delta updates via timestamps or JSON diffing).

4. **Modularization**
   - Split socket handling (`useGameSocket`) from state logic management (`useGameState`) for better separation of concerns.
   - Reduce tight coupling between the game’s state and WebSocket communication.

5. **Improved Debugging and Error Handling**
   - Replace `console.log` with a proper logging utility, toggleable via environment (e.g., production vs. development).

#### **Acceptance Criteria**
- Modular Pinia stores for `GameStore`, `VoteStore`, and `LobbyStore` are implemented.
- Socket handling logic is decoupled from state management.
- Critical workflow functions (e.g., `connect`) are broken down and refactored.
- Automatic retry/reconnection logic for WebSocket is in place.
- Differential state update mechanism is implemented.

---

This enhancement aims to improve maintainability and scalability for the game system leading into the 1.0 release.