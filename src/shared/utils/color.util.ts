type CorValue = string;
type CanalOffset = number;

/** Converte tokens HSL para o formato aceito pelo seletor nativo de cores. */
export function hslParaHex(value: CorValue): string {
  const [h, s, l] = value.replace(/%/g, '').trim().split(/\s+/).map(Number);
  if (![h, s, l].every(Number.isFinite)) return '#000000';
  const saturation = s / 100;
  const lightness = l / 100;
  const amplitude = saturation * Math.min(lightness, 1 - lightness);
  const canal = (offset: CanalOffset) => {
    const k = (offset + h / 30) % 12;
    const color = lightness - amplitude * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(color * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${canal(0)}${canal(8)}${canal(4)}`;
}

export function hexParaHsl(value: CorValue): string | null {
  if (!/^#[0-9a-f]{6}$/i.test(value)) return null;
  const [r, g, b] = [1, 3, 5].map(
    (index) => parseInt(value.slice(index, index + 2), 16) / 255,
  );
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  const hue =
    delta === 0
      ? 0
      : max === r
        ? ((g - b) / delta) % 6
        : max === g
          ? (b - r) / delta + 2
          : (r - g) / delta + 4;
  return `${Number(((hue * 60 + 360) % 360).toFixed(2))} ${Number((s * 100).toFixed(2))}% ${Number((l * 100).toFixed(2))}%`;
}
