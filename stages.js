// ===== カカポの成長段階 =====
// 正解4問ごとに1段階育つ（20問全問正解で、おとなのカカポ）

const INK = 'stroke="#2b2a26" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"';

// 巣（たまご〜わかどりの足もとに置く）
const NEST = `
  <path d="M28 134 Q80 162 132 134" fill="none" stroke="#b89b6a" stroke-width="8" stroke-linecap="round"/>
  <path d="M36 143 Q80 164 124 143" fill="none" stroke="#9c8157" stroke-width="4" stroke-linecap="round"/>
  <path d="M40 132 l10 6 M60 140 l10 -4 M92 141 l10 -5 M112 134 l8 5" stroke="#9c8157" stroke-width="2.5" stroke-linecap="round"/>`;

// たまご（crack が true なら、ひびが入る）
function eggSVG(crack) {
  return `
    <ellipse cx="80" cy="88" rx="40" ry="50" fill="#f6efc4" ${INK}/>
    <ellipse cx="64" cy="68" rx="7" ry="5" fill="#cfe0a8"/>
    <ellipse cx="97" cy="62" rx="5" ry="4" fill="#cfe0a8"/>
    <ellipse cx="95" cy="100" rx="9" ry="6" fill="#cfe0a8"/>
    <ellipse cx="68" cy="114" rx="6" ry="4" fill="#cfe0a8"/>
    ${crack ? `<path d="M44 84 L56 78 L64 88 L74 76 L84 88 L94 78 L104 86 L116 80" fill="none" ${INK}/>` : ""}
    ${NEST}`;
}

// 顔（目・くちばし・ほっぺ）
function faceSVG(cx, cy, eye) {
  return `
    <circle cx="${cx - 9}" cy="${cy}" r="${eye}" fill="#2b2a26"/>
    <circle cx="${cx + 9}" cy="${cy}" r="${eye}" fill="#2b2a26"/>
    <circle cx="${cx - 8}" cy="${cy - 1.5}" r="${eye / 3}" fill="#ffffff"/>
    <circle cx="${cx + 10}" cy="${cy - 1.5}" r="${eye / 3}" fill="#ffffff"/>
    <path d="M${cx - 4} ${cy + 5} Q${cx} ${cy + 3} ${cx + 4} ${cy + 5} Q${cx + 3} ${cy + 11} ${cx} ${cy + 13} Q${cx - 3} ${cy + 11} ${cx - 4} ${cy + 5} Z" fill="#ffffff" ${INK} stroke-width="2.5"/>
    <path d="M${cx - 20} ${cy + 8} l3 -5 M${cx - 15} ${cy + 9} l3 -5 M${cx + 13} ${cy + 9} l3 -5 M${cx + 18} ${cy + 8} l3 -5" stroke="#d9837a" stroke-width="2" stroke-linecap="round"/>`;
}

// うまれた！（からからヒナが顔を出す）
function hatchingSVG() {
  return `
    <circle cx="80" cy="84" r="30" fill="#e6ead6" ${INK}/>
    <path d="M72 56 q3 -9 7 -1 M80 55 q4 -9 7 0" fill="none" ${INK} stroke-width="3"/>
    ${faceSVG(80, 82, 4.5)}
    <path d="M40 100 L50 92 L60 102 L70 92 L80 102 L90 92 L100 102 L110 92 L120 100 Q122 142 80 144 Q38 142 40 100 Z" fill="#f6efc4" ${INK}/>
    <ellipse cx="96" cy="120" rx="8" ry="5" fill="#cfe0a8"/>
    <path d="M56 60 L64 52 L72 60 L80 52 L88 60 L96 54 Q94 36 76 36 Q58 38 56 60 Z" fill="#f6efc4" ${INK} transform="rotate(-14 76 50)"/>
    ${NEST}`;
}

// ヒナ（ふわふわ）
function chickSVG() {
  return `
    <path d="M48 116 q-10 8 -2 16 M112 116 q10 8 2 16" fill="none" ${INK}/>
    <circle cx="80" cy="100" r="38" fill="#e6ead6" ${INK}/>
    <path d="M70 63 q4 -11 8 -1 M80 62 q5 -11 9 0" fill="none" ${INK} stroke-width="3"/>
    <ellipse cx="80" cy="92" rx="24" ry="18" fill="#f6efc4" ${INK} stroke-width="3"/>
    ${faceSVG(80, 89, 5.5)}
    <path d="M70 126 l3 3 l3 -3 M84 126 l3 3 l3 -3" fill="none" ${INK} stroke-width="2.5"/>
    ${NEST}`;
}

// カカポ（わかどり・おとな共通の形。scale で大きさを変える）
function kakapoSVG(bodyColor, scale, withNest) {
  return `
    <g transform="translate(80 150) scale(${scale}) translate(-80 -150)">
      <ellipse cx="80" cy="88" rx="52" ry="56" fill="${bodyColor}"/>
      <ellipse cx="80" cy="78" rx="40" ry="32" fill="#f6efc4"/>
      <path d="M74 84 Q80 80 86 84 Q85 94 80 98 Q75 94 74 84 Z" fill="#ffffff"/>
      <g fill="none" ${INK}>
        <path d="M60 142 l-4 7 M66 144 v7 M72 142 l4 7 M88 142 l-4 7 M94 144 v7 M100 142 l4 7"/>
        <ellipse cx="80" cy="88" rx="52" ry="56"/>
        <path d="M29 84 Q14 100 30 116 M131 84 Q146 100 130 116"/>
        <path d="M67 34 Q70 24 74 33 M86 33 Q90 24 93 34"/>
        <ellipse cx="80" cy="78" rx="40" ry="32"/>
        <path d="M40 82 L28 78 M40 88 L28 90 M120 82 L132 78 M120 88 L132 90"/>
        <path d="M74 84 Q80 80 86 84 Q85 94 80 98 Q75 94 74 84 Z"/>
        <path d="M68 120 l4 4 l4 -4 M84 120 l4 4 l4 -4 M76 130 l4 4 l4 -4" stroke-width="2.5"/>
        <path d="M48 94 l4 -6 M54 95 l4 -6 M102 95 l4 -6 M108 94 l4 -6" stroke="#d9837a" stroke-width="2"/>
      </g>
      <circle cx="63" cy="74" r="8.5" fill="#2b2a26"/>
      <circle cx="97" cy="74" r="8.5" fill="#2b2a26"/>
      <circle cx="66" cy="71" r="3" fill="#ffffff"/>
      <circle cx="100" cy="71" r="3" fill="#ffffff"/>
    </g>
    ${withNest ? NEST : ""}`;
}

// 6つの段階（name：画面に出す名前、svg：絵）
const STAGES = [
  { name: "たまご", svg: eggSVG(false) },
  { name: "ひびが入った！", svg: eggSVG(true) },
  { name: "うまれた！", svg: hatchingSVG() },
  { name: "ヒナ", svg: chickSVG() },
  { name: "わかどり", svg: kakapoSVG("#dde9c2", 0.78, true) },
  { name: "おとなのカカポ", svg: kakapoSVG("#cfe0a8", 1, false) },
];

// 正解数から、今の段階（0〜5）を求める
function stageFor(correct) {
  return Math.min(Math.floor(correct / 4), STAGES.length - 1);
}

// 段階の絵を <svg> にして返す
function stageMarkup(index) {
  return `<svg viewBox="0 0 160 170" aria-hidden="true">${STAGES[index].svg}</svg>`;
}
