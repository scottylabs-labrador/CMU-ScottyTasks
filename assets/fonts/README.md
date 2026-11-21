# ScottyTasks fonts

Custom regular and bold faces supplied by the ScottyTasks team. These files are loaded at startup with `expo-font` in `app/_layout.tsx`, including Expo Go and web. The splash screen stays visible while loading; a load failure falls back to system text.

Use `Text` from `@/components/ScottyText` for app text. It preserves the standard React Native Text props and maps weights 600–900/bold to the supplied bold face. Nested text inherits its parent's weight. Explicit fontFamily overrides remain supported.

Both faces cover A–Z, a–z, digits 0–9, and common punctuation/symbols (`!`, `?`, `.`, `,`, `:`, `'`, `"`, `/`, `-`, `+`, `%`, `#`, `(`, `)`). Unsupported symbols (such as `;`, `·`, `—`, `…`), emoji, and other scripts explicitly fall back to the platform system font in `ScottyText`. Icon fonts are unchanged. TextInput remains in the system font so editable email addresses and passwords remain legible.

When complete fonts are available, replace the assets and update the character coverage in ScottyText. Keep both files registered under the names in constants/typography.ts.
