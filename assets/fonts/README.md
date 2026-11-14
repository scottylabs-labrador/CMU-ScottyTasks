# ScottyTasks fonts

Custom regular and bold faces supplied by the ScottyTasks team. These files are loaded at startup with `expo-font` in `app/_layout.tsx`, including Expo Go and web. The splash screen stays visible while loading; a load failure falls back to system text.

Use `Text` from `@/components/ScottyText` for app text. It preserves the standard React Native Text props and maps weights 600–900/bold to the supplied bold face. Nested text inherits its parent's weight. Explicit fontFamily overrides remain supported.

Only A–Z and a–z use the custom artwork for now. Numbers, punctuation, whitespace, emoji and other scripts explicitly use the platform system font, even if a font file has a placeholder mapping for a character. Icon fonts are unchanged. TextInput remains in the system font so editable numbers, email addresses and passwords remain legible.

When complete fonts are available, replace the assets and update the character coverage in ScottyText. Keep both files registered under the names in constants/typography.ts.
