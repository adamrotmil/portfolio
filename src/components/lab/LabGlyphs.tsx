"use client";

// Refined glyph marks used inside the shader tiles.  Each mark is a
// single, considered typographic element — no borders, no containers,
// rendered in white with a soft drop shadow for legibility against the
// animated shader backdrop.

const glyphWrap: React.CSSProperties = {
  color: "#FFFFFF",
  lineHeight: 1,
  // Very subtle soft shadow — just enough to keep the glyph crisp
  // against the shader's warmest highlights.
  filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.25))",
};

// Concentric motion ripples — abstract, hand-drawn in SVG so line weight
// stays consistent.  Matches SwiftUI's signature "spring/curve" feel.
export function RipplesGlyph() {
  return (
    <svg viewBox="-80 -80 160 160" style={{ width: "42%", height: "42%" }} aria-hidden>
      <g fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round">
        <path d="M -60 22 Q -30 -22 0 22 Q 30 66 60 22" strokeWidth="5" opacity="0.4" style={glyphWrap}/>
        <path d="M -48 4  Q -24 -28 0 4  Q 24 36 48 4"  strokeWidth="5" opacity="0.7"/>
        <path d="M -34 -12 Q -17 -32 0 -12 Q 17 8 34 -12" strokeWidth="5" opacity="1"/>
      </g>
    </svg>
  );
}

// Editorial open-quote mark, set in a serif with optical corrections
// (generous tracking, specific baseline).  SVG text uses the system
// serif so it renders the same everywhere.
export function QuoteGlyph() {
  return (
    <svg viewBox="-100 -100 200 200" style={{ width: "58%", height: "58%", ...glyphWrap }} aria-hidden>
      <text
        x="0" y="10"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Canela Text', 'Canela Deck', 'Cormorant Garamond', 'EB Garamond', Georgia, serif"
        fontSize="240"
        fontWeight="600"
        fontStyle="italic"
        fill="#FFFFFF"
      >
        &#8220;
      </text>
    </svg>
  );
}

// Serif question mark — more elegant than a sans-serif one, hints at
// old-school design trivia / typography history.
export function QuestionGlyph() {
  return (
    <svg viewBox="-100 -100 200 200" style={{ width: "46%", height: "46%", ...glyphWrap }} aria-hidden>
      <text
        x="0" y="0"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Canela Text', 'Cormorant Garamond', 'EB Garamond', Georgia, serif"
        fontSize="220"
        fontWeight="400"
        fill="#FFFFFF"
        letterSpacing="-4"
      >
        ?
      </text>
    </svg>
  );
}
