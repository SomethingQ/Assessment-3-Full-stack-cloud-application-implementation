export type PhonemeHints = Record<string, string>;

export function downloadHTML(filename: string, htmlString: string): void {
  const blob = new Blob([htmlString], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export const DEFAULT_PHONEME_HINTS: PhonemeHints = {
  θ: "TH (as in thin)",
  ð: "TH (as in this)",
  ʃ: "SH (as in shin)",
  ʒ: "S (as in measure)",
  tʃ: "CH (as in chin)",
  dʒ: "J (as in jam)",
  ŋ: "NG (as in ring)",
  æ: "short A (as in cat)",
  ɪ: "short I (as in bit)",
  ɛ: "short E (as in bed)",
  ɒ: "short O (as in dog)",
  ʊ: "short OO (as in book)",
  ʌ: "short U (as in cup)",
  ɐ: "uh (as in sun)",
  ɔ: "AW (as in log)",
  ʉː: "long OO (as in boot)",
  æɪ: "long A (as in bait)",
  ɹ: "R (as in ring)",
  ɡ: "G (as in go)",
  j: "Y (as in yes)",
  w: "W (as in win)",
  p: "P",
  b: "B",
  t: "T",
  d: "D",
  k: "K",
  f: "F",
  v: "V",
  s: "S",
  z: "Z",
  m: "M",
  n: "N",
  l: "L",
  h: "H",
};
