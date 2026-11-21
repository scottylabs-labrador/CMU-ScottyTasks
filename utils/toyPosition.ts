export type ToyPosition = { x: number; y: number };
export const DEFAULT_TOY_POSITION: ToyPosition = { x: 0.59, y: 0.57 };
export const TOY_SIZE = 0.36;
// Keep the baked-in toy shadows near the grass, including older saved positions.
export const MIN_TOY_Y = 0.54;
export function normalizeToyPosition(value: unknown): ToyPosition {
  if (!value || typeof value !== 'object') return DEFAULT_TOY_POSITION;
  const { x, y } = value as Partial<ToyPosition>;
  if (typeof x !== 'number' || !Number.isFinite(x) || typeof y !== 'number' || !Number.isFinite(y)) return DEFAULT_TOY_POSITION;
  return { x: Math.max(0, Math.min(1 - TOY_SIZE, x)), y: Math.max(MIN_TOY_Y, Math.min(1 - TOY_SIZE, y)) };
}
