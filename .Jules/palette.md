## 2024-05-23 - MoodMeter Focus Visibility
**Learning:** Custom interactive elements (like the MoodMeter spheres) that use transform/scale effects often neglect keyboard focus states. The default browser outline is frequently suppressed or invisible against dark/custom backgrounds.
**Action:** Always pair `:hover` effects with `:focus-visible` and ensure a high-contrast visual indicator (like a ring or border) is present for keyboard users.
