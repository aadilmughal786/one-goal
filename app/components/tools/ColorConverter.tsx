'use client';

import React, { useCallback, useEffect, useState } from 'react';

const ColorConverter: React.FC = () => {
  const [hex, setHex] = useState<string>('#FFFFFF');
  const [rgb, setRgb] = useState<string>('rgb(255, 255, 255)');
  const [hsl, setHsl] = useState<string>('hsl(0, 0%, 100%)');

  const hexToRgb = (h: string) => {
    let r = 0,
      g = 0,
      b = 0;
    // 3 digits
    if (h.length === 4) {
      r = parseInt(h[1] + h[1], 16);
      g = parseInt(h[2] + h[2], 16);
      b = parseInt(h[3] + h[3], 16);
    } else if (h.length === 7) {
      r = parseInt(h.substring(1, 3), 16);
      g = parseInt(h.substring(3, 5), 16);
      b = parseInt(h.substring(5, 7), 16);
    }
    return `rgb(${r}, ${g}, ${b})`;
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0;
    const l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  };

  const hslToRgb = (h: number, s: number, l: number) => {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s,
      x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
      m = l - c / 2;
    let r = 0,
      g = 0,
      b = 0;

    if (0 <= h && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (60 <= h && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (120 <= h && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (180 <= h && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (240 <= h && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else if (300 <= h && h < 360) {
      r = c;
      g = 0;
      b = x;
    }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return `rgb(${r}, ${g}, ${b})`;
  };

  const handleHexChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setHex(value);
    if (/^#([0-9A-F]{3}){1,2}$/.test(value)) {
      const newRgb = hexToRgb(value);
      setRgb(newRgb);
      const [r, g, b] = newRgb.match(/\d+/g)!.map(Number);
      setHsl(rgbToHsl(r, g, b));
    }
  }, []);

  const handleRgbChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRgb(value);
    const match = value.match(/\d+/g);
    if (match && match.length === 3) {
      const [r, g, b] = match.map(Number);
      setHex(rgbToHex(r, g, b));
      setHsl(rgbToHsl(r, g, b));
    }
  }, []);

  const handleHslChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHsl(value);
    const match = value.match(/\d+/g);
    if (match && match.length === 3) {
      const [h, s, l] = match.map(Number);
      const newRgb = hslToRgb(h, s, l);
      setRgb(newRgb);
      const [r, g, b] = newRgb.match(/\d+/g)!.map(Number);
      setHex(rgbToHex(r, g, b));
    }
  }, []);

  useEffect(() => {
    // Initial conversion when component mounts
    const [r, g, b] = rgb.match(/\d+/g)!.map(Number);
    setHex(rgbToHex(r, g, b));
    setHsl(rgbToHsl(r, g, b));
  }, [rgb]);

  return (
    <div className="p-6 rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Color Converter</h2>

      <div className="mb-4">
        <label htmlFor="hex" className="block mb-2 text-sm font-medium">
          HEX:
        </label>
        <input
          type="text"
          id="hex"
          className="p-2 w-full rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          value={hex}
          onChange={handleHexChange}
          placeholder="#RRGGBB or #RGB"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="rgb" className="block mb-2 text-sm font-medium">
          RGB:
        </label>
        <input
          type="text"
          id="rgb"
          className="p-2 w-full rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          value={rgb}
          onChange={handleRgbChange}
          placeholder="rgb(R, G, B)"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="hsl" className="block mb-2 text-sm font-medium">
          HSL:
        </label>
        <input
          type="text"
          id="hsl"
          className="p-2 w-full rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          value={hsl}
          onChange={handleHslChange}
          placeholder="hsl(H, S%, L%)"
        />
      </div>

      <div
        className="mt-6 w-full h-20 rounded-md border border-border-primary"
        style={{ backgroundColor: hex }}
      ></div>
    </div>
  );
};

export default ColorConverter;
