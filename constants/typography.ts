// Each file is registered separately so native platforms select the actual bold
// artwork instead of synthesizing a weight from the regular face.
export const SCOTTY_FONTS = {
  regular: 'ScottyTasksRegular',
  bold: 'ScottyTasksBold',
} as const;

// Shared display-text sizing; device accessibility scaling still applies.
export const TEXT_SIZE_SCALE = 1.15;

// Use the handwritten faces for display text; smaller copy stays in the system font.
export const CUSTOM_FONT_MIN_SIZE = 18;
