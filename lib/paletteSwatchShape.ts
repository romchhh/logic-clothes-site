/** Organic blob radii + slight tilt — delicate paint dots. */
const SHAPES: { br: string; rot: number }[] = [
  { br: "56% 44% 50% 50% / 48% 52% 46% 54%", rot: -2.5 },
  { br: "48% 52% 54% 46% / 52% 48% 50% 50%", rot: 2 },
  { br: "52% 48% 46% 54% / 50% 50% 52% 48%", rot: -1.5 },
  { br: "50% 50% 48% 52% / 54% 46% 48% 52%", rot: 1.8 },
  { br: "54% 46% 52% 48% / 46% 54% 50% 50%", rot: -2 },
  { br: "46% 54% 50% 50% / 52% 48% 54% 46%", rot: 1.2 },
  { br: "50% 50% 44% 56% / 48% 52% 46% 54%", rot: -1 },
  { br: "52% 48% 50% 50% / 50% 50% 44% 56%", rot: 2.2 },
  { br: "48% 52% 52% 48% / 46% 54% 52% 48%", rot: -1.8 },
];

export function paintSwatchShape(index: number): {
  borderRadius: string;
  transform: string;
} {
  const s = SHAPES[index % SHAPES.length];
  return {
    borderRadius: s.br,
    transform: `rotate(${s.rot}deg)`,
  };
}
