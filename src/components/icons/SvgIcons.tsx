/**
 * SVG Icon Library for 今心 APP
 * Morandi-compatible monochrome icons for all RULER steps
 */
import React from 'react';

// Helper type for icon components
type IconComponent = React.ReactNode;

// ===== REGULATION STRATEGY ICONS =====
export const regulationIcons: Record<string, IconComponent> = {
    // Red Quadrant (High Energy, Low Pleasantness)
    breathing: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 4c2 0 4 2 4 4 0 3-4 6-4 6s-4-3-4-6c0-2 2-4 4-4z" />
            <path d="M8 16c0 2 2 4 4 4s4-2 4-4" />
            <path d="M12 14v6" />
        </svg>
    ),
    grounding: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 2v4" />
            <path d="M6.34 6.34l2.83 2.83" />
            <path d="M2 12h4" />
            <path d="M12 22v-4" />
            <circle cx="12" cy="12" r="4" />
        </svg>
    ),
    running: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="14" cy="4" r="2" />
            <path d="M7 22l3-7" />
            <path d="M10 15l5-5" />
            <path d="M15 10l4-3" />
            <path d="M17 22l-2-7" />
        </svg>
    ),
    water: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 2c-4 5-6 8-6 12 0 3.5 2.5 6 6 6s6-2.5 6-6c0-4-2-7-6-12z" />
            <path d="M9 16c1-1 3-1 4 0" />
        </svg>
    ),

    // Yellow Quadrant (High Energy, High Pleasantness)
    gratitude: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="4" y="3" width="16" height="18" rx="2" />
            <path d="M8 8h8" />
            <path d="M8 12h6" />
            <path d="M8 16h4" />
        </svg>
    ),
    sparkle: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="M2 12h4" />
            <path d="M18 12h4" />
            <path d="M5 5l3 3" />
            <path d="M16 16l3 3" />
            <path d="M5 19l3-3" />
            <path d="M16 8l3-3" />
        </svg>
    ),
    target: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="12" cy="12" r="1" fill="currentColor" />
        </svg>
    ),
    dance: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="4" r="2" />
            <path d="M12 6v6" />
            <path d="M8 10l4 2 4-2" />
            <path d="M8 22l4-10" />
            <path d="M16 22l-4-10" />
        </svg>
    ),

    // Blue Quadrant (Low Energy, Low Pleasantness)
    coffee: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M5 10h12a2 2 0 012 2v2a6 6 0 01-6 6H9a6 6 0 01-6-6v-2a2 2 0 012-2z" />
            <path d="M17 12h1a2 2 0 012 2v0a2 2 0 01-2 2h-1" />
            <path d="M8 6c0-1 1-2 2-2s2 1 2 0 1-2 2-2 2 1 2 2" />
        </svg>
    ),
    tidy: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="4" y="4" width="6" height="6" rx="1" />
            <rect x="14" y="4" width="6" height="6" rx="1" />
            <rect x="4" y="14" width="6" height="6" rx="1" />
            <path d="M14 17h6" />
            <path d="M17 14v6" />
        </svg>
    ),
    selfLove: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 21c-4-3-8-6-8-10a4 4 0 018 0 4 4 0 018 0c0 4-4 7-8 10z" />
            <path d="M12 13v4" />
            <path d="M10 15h4" />
        </svg>
    ),
    plant: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 22v-8" />
            <path d="M12 14c-3 0-5-2-5-5 0 0 2-1 5-1s5 1 5 1c0 3-2 5-5 5z" />
            <path d="M7 8c0-2 2-4 5-4s5 2 5 4" />
            <rect x="8" y="18" width="8" height="4" rx="1" />
        </svg>
    ),

    // Green Quadrant (Low Energy, High Pleasantness)
    meditate: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="6" r="3" />
            <path d="M12 9v4" />
            <path d="M8 13c0 0-2 2-2 4s1 3 2 3h8c1 0 2-1 2-3s-2-4-2-4" />
            <path d="M8 17h8" />
        </svg>
    ),
    book: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14" />
            <path d="M4 19a2 2 0 002 2h12a2 2 0 002-2" />
            <path d="M12 3v18" />
            <path d="M7 7h2" />
            <path d="M7 11h2" />
        </svg>
    ),
    doodle: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 20l4-4" />
            <path d="M8 16l8-12 4 4-12 8" />
            <circle cx="17" cy="7" r="1" fill="currentColor" />
        </svg>
    ),
    offline: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="7" y="3" width="10" height="18" rx="2" />
            <path d="M10 18h4" />
            <path d="M4 4l16 16" />
        </svg>
    ),
};

// ===== EXPRESSING MODE ICONS =====
export const expressingIcons: Record<string, IconComponent> = {
    letter: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
        </svg>
    ),
    shredder: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6 7h12" />
            <rect x="4" y="7" width="16" height="6" rx="1" />
            <path d="M6 17v4" />
            <path d="M10 17v4" />
            <path d="M14 17v4" />
            <path d="M18 17v4" />
        </svg>
    ),
    freewrite: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M17 3l4 4-10 10H7v-4L17 3z" />
            <path d="M7 21h10" />
        </svg>
    ),
};

// ===== PSYCHOLOGICAL NEEDS ICONS =====
export const needsIcons: Record<string, IconComponent> = {
    respect: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M7 12c2 0 3 1 3 3v4H4v-4c0-2 1-3 3-3z" />
            <path d="M17 12c2 0 3 1 3 3v4h-6v-4c0-2 1-3 3-3z" />
            <circle cx="7" cy="8" r="2" />
            <circle cx="17" cy="8" r="2" />
            <path d="M10 15h4" />
        </svg>
    ),
    safety: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 3l8 4v5c0 5-3 8-8 10-5-2-8-5-8-10V7l8-4z" />
            <path d="M9 12l2 2 4-4" />
        </svg>
    ),
    connection: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 21c-4-3-8-6-8-10a4 4 0 018 0 4 4 0 018 0c0 4-4 7-8 10z" />
        </svg>
    ),
    autonomy: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 4c4 0 7 3 7 7 0 5-7 10-7 10s-7-5-7-10c0-4 3-7 7-7z" />
            <path d="M12 4v6" />
            <path d="M9 7l3 3 3-3" />
        </svg>
    ),
    meaning: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
        </svg>
    ),
    rest: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 12c0-4 3-7 7-7 0 4 3 7 7 7-4 0-7 3-7 7-4 0-7-3-7-7z" />
            <circle cx="18" cy="6" r="1" fill="currentColor" />
            <circle cx="20" cy="10" r="0.5" fill="currentColor" />
        </svg>
    ),
    growth: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 22v-10" />
            <path d="M12 12c-3 0-5-2-5-5 3 0 5 2 5 5z" />
            <path d="M12 8c3 0 5-2 5-5-3 0-5 2-5 5z" />
        </svg>
    ),
};

// ===== UTILITY ICONS =====
export const utilityIcons: Record<string, IconComponent> = {
    toolbox: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="10" width="18" height="10" rx="2" />
            <path d="M7 10V7a5 5 0 0110 0v3" />
            <path d="M10 14h4" />
        </svg>
    ),
};

// ===== UI ICONS (Summaries, Actions, etc.) =====
export const uiIcons: Record<string, IconComponent> = {
    sparkle: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7l2-7z" />
        </svg>
    ),
    brain: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 4c-2 0-3 1-3 2s1 2 1 3-1 2-1 3 1 2 3 2" />
            <path d="M12 4c2 0 3 1 3 2s-1 2-1 3 1 2 1 3-1 2-3 2" />
            <circle cx="9" cy="8" r="1" fill="currentColor" />
            <circle cx="15" cy="8" r="1" fill="currentColor" />
            <path d="M12 14v6" />
            <path d="M9 18h6" />
        </svg>
    ),
    microphone: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="9" y="2" width="6" height="11" rx="3" />
            <path d="M5 10v1a7 7 0 0014 0v-1" />
            <path d="M12 18v4" />
            <path d="M8 22h8" />
        </svg>
    ),
    leaf: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 22c-4-4-6-8-6-12C6 6 9 3 12 3s6 3 6 7c0 4-2 8-6 12z" />
            <path d="M12 8v8" />
            <path d="M9 12h6" />
        </svg>
    ),
    folder: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" />
        </svg>
    ),
    trash: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 6h16" />
            <path d="M10 6V4a2 2 0 012-2h0a2 2 0 012 2v2" />
            <path d="M6 6v12a2 2 0 002 2h8a2 2 0 002-2V6" />
            <path d="M10 11v5" />
            <path d="M14 11v5" />
        </svg>
    ),
    seedling: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 22v-10" />
            <path d="M12 12c-3 0-5-2-5-5 3 0 5 2 5 5z" />
            <path d="M12 8c3 0 5-2 5-5-3 0-5 2-5 5z" />
        </svg>
    ),
    shield: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 3l8 4v5c0 5-3 8-8 10-5-2-8-5-8-10V7l8-4z" />
        </svg>
    ),
    wrench: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94L6.7 20.3a2 2 0 01-2.83 0l-.17-.17a2 2 0 010-2.83l6.83-6.83a6 6 0 017.94-7.94l-3.77 3.77z" />
        </svg>
    ),
    hammer: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M15 12l-8.5 8.5a2.12 2.12 0 01-3-3L12 9" />
            <path d="M17.64 6.36a7 7 0 00-9.9 0L12 10.59l4.24 4.24a7 7 0 000-9.9z" />
        </svg>
    ),
    gear: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
    ),
    trophy: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6 9H3a1 1 0 01-1-1V5a1 1 0 011-1h3" />
            <path d="M18 9h3a1 1 0 001-1V5a1 1 0 00-1-1h-3" />
            <path d="M6 4h12v6a6 6 0 01-12 0V4z" />
            <path d="M12 16v4" />
            <path d="M8 22h8" />
        </svg>
    ),
    tree: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 22v-8" />
            <path d="M12 14L7 8h10l-5 6z" />
            <path d="M12 8L8 3h8l-4 5z" />
        </svg>
    ),
    branch: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 22v-6" />
            <path d="M12 16c-4 0-6-3-6-6 4 0 6 3 6 6z" />
            <path d="M12 12c4 0 6-3 6-6-4 0-6 3-6 6z" />
        </svg>
    ),
};
