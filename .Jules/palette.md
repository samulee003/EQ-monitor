# Palette's Journal

## 2024-05-22 - Accessibility Enhancements
**Learning:** Custom interactive elements (divs as buttons) require manual `aria-pressed` or `aria-checked` management to communicate state changes to screen readers. Standard HTML elements like `<button>` or `<input type="radio">` handle this natively, but when using custom styling, these ARIA attributes are critical.
**Action:** When creating custom toggle or selection interfaces, always verify that state changes are reflected in ARIA attributes, not just visual classes.
