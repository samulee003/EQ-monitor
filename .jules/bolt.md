## 2024-05-23 - Playwright vs. CSS Float Animations
**Learning:** The `EmotionGrid` (and likely other components) uses continuous CSS float animations (`animation: float 6s ease-in-out infinite`). This causes Playwright's auto-waiting actionability checks to fail or time out because the element is constantly "moving" or "unstable".
**Action:** When writing verification scripts for animated components in this codebase, always inject global styles `* { animation: none !important; transition: none !important; }` into the page context before interacting with elements.
