// ===== ローマ字判定のしくみ =====
// 「おしゃまんべ」のようなひらがなを、ローマ字で1文字ずつ判定します。
// 「shi」と「si」のように、打ち方が何通りかある文字にも対応しています。

// ひらがな1文字の打ち方（先頭に書いたものが、画面に表示するお手本になる）
const KANA = {
  "あ": ["a"], "い": ["i", "yi"], "う": ["u", "wu"], "え": ["e"], "お": ["o"],
  "か": ["ka", "ca"], "き": ["ki"], "く": ["ku", "cu", "qu"], "け": ["ke"], "こ": ["ko", "co"],
  "さ": ["sa"], "し": ["shi", "si", "ci"], "す": ["su"], "せ": ["se", "ce"], "そ": ["so"],
  "た": ["ta"], "ち": ["chi", "ti"], "つ": ["tsu", "tu"], "て": ["te"], "と": ["to"],
  "な": ["na"], "に": ["ni"], "ぬ": ["nu"], "ね": ["ne"], "の": ["no"],
  "は": ["ha"], "ひ": ["hi"], "ふ": ["fu", "hu"], "へ": ["he"], "ほ": ["ho"],
  "ま": ["ma"], "み": ["mi"], "む": ["mu"], "め": ["me"], "も": ["mo"],
  "や": ["ya"], "ゆ": ["yu"], "よ": ["yo"],
  "ら": ["ra"], "り": ["ri"], "る": ["ru"], "れ": ["re"], "ろ": ["ro"],
  "わ": ["wa"], "を": ["wo"], "ん": ["nn", "xn"],
  "が": ["ga"], "ぎ": ["gi"], "ぐ": ["gu"], "げ": ["ge"], "ご": ["go"],
  "ざ": ["za"], "じ": ["ji", "zi"], "ず": ["zu"], "ぜ": ["ze"], "ぞ": ["zo"],
  "だ": ["da"], "ぢ": ["di"], "づ": ["du"], "で": ["de"], "ど": ["do"],
  "ば": ["ba"], "び": ["bi"], "ぶ": ["bu"], "べ": ["be"], "ぼ": ["bo"],
  "ぱ": ["pa"], "ぴ": ["pi"], "ぷ": ["pu"], "ぺ": ["pe"], "ぽ": ["po"],
  "ぁ": ["xa", "la"], "ぃ": ["xi", "li"], "ぅ": ["xu", "lu"], "ぇ": ["xe", "le"], "ぉ": ["xo", "lo"],
  "ゃ": ["xya", "lya"], "ゅ": ["xyu", "lyu"], "ょ": ["xyo", "lyo"],
  "っ": ["xtu", "ltu", "xtsu", "ltsu"],
  "ー": ["-"],
};

// 「きゃ」「しょ」のような2文字でひとまとまりの音（拗音）
const YOON_HEAD = {
  "き": ["ky"], "ぎ": ["gy"], "し": ["sh", "sy"], "じ": ["j", "jy", "zy"],
  "ち": ["ch", "ty", "cy"], "ぢ": ["dy"], "に": ["ny"], "ひ": ["hy"],
  "び": ["by"], "ぴ": ["py"], "み": ["my"], "り": ["ry"],
};
const YOON_TAIL = { "ゃ": "a", "ゅ": "u", "ょ": "o" };

// ひらがなの i 番目から始まる「打ち方の候補」を全部返す
// 例）「しゃ」→ sha, sya（2文字分）／ shi, si, ci（1文字分）
function chunksAt(kana, i) {
  const c = kana[i];
  const next = kana[i + 1];
  const list = [];

  // 拗音（きゃ・しょ など）
  if (YOON_TAIL[next] && YOON_HEAD[c]) {
    YOON_HEAD[c].forEach((head) => {
      list.push({ len: 2, romaji: head + YOON_TAIL[next] });
    });
  }

  // 小さい「っ」は、次の文字の最初の子音を重ねる（「っぷ」→ ppu）
  if (c === "っ" && i + 1 < kana.length) {
    chunksAt(kana, i + 1).forEach((chunk) => {
      const first = chunk.romaji[0];
      if (!"aiueon".includes(first)) {
        list.push({ len: 1 + chunk.len, romaji: first + chunk.romaji });
        if (chunk.romaji.startsWith("ch")) {
          list.push({ len: 1 + chunk.len, romaji: "t" + chunk.romaji }); // 「っち」→ tchi も OK
        }
      }
    });
  }

  // 「ん」は、次が母音・や行・な行でなければ「n」1回でも OK（言葉の最後は nn）
  if (c === "ん" && i + 1 < kana.length) {
    const after = chunksAt(kana, i + 1);
    const canSingleN = after.every((chunk) => !"aiueoyn".includes(chunk.romaji[0]));
    if (canSingleN) {
      list.push({ len: 1, romaji: "n" });
    }
  }

  // ふつうの1文字
  (KANA[c] || []).forEach((romaji) => {
    list.push({ len: 1, romaji: romaji });
  });

  return list;
}

// ===== 1つの言葉を打ち進めるための「判定係」 =====
class RomajiMatcher {
  constructor(kana) {
    this.kana = kana;     // お題の読み（ひらがな）
    this.pos = 0;         // ひらがなの何文字目まで打てたか
    this.buffer = "";     // 今打っている途中のローマ字（例：「sh」）
    this.doneRomaji = ""; // 確定したローマ字
  }

  isDone() {
    return this.pos >= this.kana.length;
  }

  // キーを1つ受け取って、正しければ true、間違いなら false を返す
  input(key) {
    if (this.isDone()) {
      return false;
    }

    const candidates = chunksAt(this.kana, this.pos);
    const next = this.buffer + key;
    const matching = candidates.filter((c) => c.romaji.startsWith(next));

    if (matching.length > 0) {
      this.buffer = next;
      const exact = matching.find((c) => c.romaji === next);
      const hasLonger = matching.some((c) => c.romaji.length > next.length);
      // ぴったり一致して、もっと長い候補がなければ確定する
      if (exact && !hasLonger) {
        this.commit(exact);
      }
      return true;
    }

    // 「n」だけ打って次の文字に進んだとき（例：kan + t）は、
    // 「ん」を n で確定してから、同じキーで次の文字を判定し直す
    const exactNow = candidates.find((c) => c.romaji === this.buffer);
    if (this.buffer !== "" && exactNow) {
      this.commit(exactNow);
      return this.input(key);
    }

    return false;
  }

  commit(chunk) {
    this.pos += chunk.len;
    this.doneRomaji += chunk.romaji;
    this.buffer = "";
  }

  // 画面に出す「打ったところ」と「残りのお手本」
  guide() {
    let rest = "";
    let i = this.pos;

    if (i < this.kana.length) {
      // 今打っている途中の文字は、その人の打ち方に合わせたお手本を出す
      const candidates = chunksAt(this.kana, i);
      const follow = candidates.find((c) => c.romaji.startsWith(this.buffer)) || candidates[0];
      rest += follow.romaji.slice(this.buffer.length);
      i += follow.len;
    }
    while (i < this.kana.length) {
      const chunk = chunksAt(this.kana, i)[0];
      rest += chunk.romaji;
      i += chunk.len;
    }

    return { typed: this.doneRomaji + this.buffer, rest: rest };
  }
}
