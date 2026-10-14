# HandVerseAI — Realistic 3D Jungle-Temple Endless Runner Game

A visually stunning, cinematic 3D endless runner adventure featuring a realistic human female adventurer running along an ancient jungle-temple flagstone trail, full obstacle avoidance mechanics (jump, slide, steer), collectible golden coins & glowing crystals, and real-time computer-vision webcam hand-tracking built with **Three.js** and **Google MediaPipe Hands**.

---

## 🌟 Key Features

1. **Realistic Female Adventurer Character:**
   - Realistic young adult female explorer (Michelle) with full skeletal animation rig, strictly upright with proper ground footing.
   - Smooth continuous locomotion, lane shifting with momentum banking, leaping jump physics arc with airborne lock, and crouch-slide transform under low obstacles.
   - High-fidelity procedural kinematic fallback ensuring 100% resilient rendering under any environment.

2. **Cinematic 3D Jungle-Temple World:**
   - Ancient carved flagstone path flanked by raised stone curbs and mossy trail edges.
   - Ancient weathered stone columns, monoliths, and ancient stone lintel archways.
   - Tropical vegetation: coconut palms with curved trunks, banyan trees with aerial roots, and lush jungle undergrowth.
   - Spinning 3D golden coins and floating radiant power crystals.
   - Atmospheric volumetric sunlight (Godrays), floating jungle motes, and distant mountain ridges with exponential fog depth.

3. **Third-Person Dynamic Camera:**
   - Smooth damped follow camera positioned behind and slightly above the adventurer.
   - Dynamic harmonic run bobbing synchronized with footsteps.
   - Jump response and landing shock absorption.
   - Screen trauma shake on obstacle impact.

4. **Real Webcam Hand-Gesture Gameplay Pipeline (Temple Run Style):**
   - Real-time 21-point hand landmark tracking using Google MediaPipe Hands.
   - **Hand-only close-up crop view** rendered on a cybernetic HUD canvas with zone partition overlays.
   - **Gesture Controls & Rearm State Machine:**
     - **MOVE LEFT:** Move hand toward the left side of the camera (`x < 0.36`). Switches one lane left. Returning hand to center neutral zone (`0.40 - 0.60`) rearms the next left switch.
     - **MOVE RIGHT:** Move hand toward the right side of the camera (`x > 0.64`). Switches one lane right. Returning hand to center neutral zone rearms the next right switch.
     - **JUMP / LEAP:** Pinch thumb tip and index finger tip together (`pinch distance < 0.34`). Character leaps over fallen logs. Opening fingers (`pinch distance > 0.48`) rearms the next jump (continuous pinch never triggers repeated jumps).
     - **SLIDE / DUCK:** Form a closed fist OR move hand downward into the lower zone (`y > 0.68`). Character crouches and slides smoothly under low-hanging tree branches and archways. Opening hand and raising it rearms the slide.
   - **Real-Time Visual Action Feedback:** Center-screen glowing HUD badges pop up in real time (`◀ LEFT`, `RIGHT ▶`, `⚡ JUMP`, `🔽 SLIDE`) confirming every recognized gesture instantly.
   - **Live Hand Tracking Status:** Clear status indicators (`CAMERA READY`, `HAND DETECTED`, `HAND NOT DETECTED`).

5. **Keyboard Backup Controls:**
   - `A` / `◄`: Steer Left
   - `D` / `►`: Steer Right
   - `W` / `Space` / `▲`: Leap / Jump over logs & boulders
   - `S` / `▼`: Slide / Duck under low-hanging tree branches
   - `P` / `Esc`: Pause / Resume
   - `M`: Toggle Sound Mute
   - `C`: Toggle Webcam Hand Tracking
   - `F`: Toggle Fullscreen

6. **Web Audio Synthesizer:**
   - Built-in multi-oscillator procedural sound effects:
     - Sparkling crystal chime chords
     - Airy jump pitch swooshes
     - Punchy obstacle collision thuds
     - Milestone fanfare trumpets
     - Ambient procedural forest breeze and periodic soft bird chirps
   - Zero external audio file download dependencies (works 100% offline).

---

## 🚀 How to Run the Game

Because the game loads 3D models (`.glb`) and Web Workers for MediaPipe, it should be served via a local web server (not opened directly via `file://`):

### Option 1: Using Node / NPM (Recommended)
```bash
npm start
```
Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Option 2: Using Python
```bash
python -m http.server 3000
```
Then open [http://localhost:3000](http://localhost:3000).

### Option 3: VS Code Live Server Extension
1. Open the folder in VS Code.
2. Right click on `index.html` -> **"Open with Live Server"**.

---

## 📁 Project Structure

```
Handverse AI/
├── index.html        # Game HUD, overlays, Three.js import map & MediaPipe scripts
├── style.css         # Glassmorphism styling, screen flash effects, responsive layouts
├── script.js         # Complete Game Engine, Character Rig, Procedural Forest & Vision
├── assets/
│   └── models/
│       ├── michelle.glb  # 3D Female Adventurer Model
│       └── soldier.glb   # Shared Mixamo Skeletal Animation Set
├── package.json      # NPM scripts
└── README.md         # Documentation
```
