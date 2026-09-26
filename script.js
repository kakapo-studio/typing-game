// ※ 問題（LEVEL1・LEVEL2）は questions.js、ローマ字判定は romaji.js、
//    カカポの絵は stages.js に書いてあります

const QUESTION_COUNT = 20;              // 1回に出す問題の数
const LEVELS = { 1: LEVEL1, 2: LEVEL2 };

// ===== ゲームの状態 =====
let level = 1;          // 今遊んでいるレベル
let quizList = [];      // 今回の20問
let index = 0;          // 今何問目か（0から数える）
let matcher = null;     // 今の問題のローマ字判定係
let correct = 0;        // 正解数
let stageIndex = 0;     // カカポの成長段階（0〜5）
let keystrokes = 0;     // 打ったキーの数
let mistakes = 0;       // ミスタイプの数
let hintCount = 0;      // 今の問題で、ヒントで見せている文字数
let results = [];       // 1問ずつの結果（あとで一覧に出す）
let playing = false;    // キー入力を受け付けてよいか
let locked = false;     // 正解・スキップのあと、次の問題に進むまで入力を止める
let startTime = 0;
let timerId = null;
let nextTimer = null;   // 「次の問題へ」の予約（やめるときに取り消すため）

// ===== 画面の部品 =====
const $ = (id) => document.getElementById(id);
const screens = ["title-screen", "countdown-screen", "play-screen", "result-screen"];

// ===== 小さな道具 =====
// 配列をシャッフルしたコピーを返す（クイズゲームと同じ Fisher–Yates）
function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatTime(ms) {
  return (ms / 1000).toFixed(1) + " 秒";
}

// 指定した画面だけを表示する
function showScreen(id) {
  screens.forEach((screenId) => {
    $(screenId).hidden = screenId !== id;
  });
}

// ===== ベストタイム（ブラウザに保存） =====
// localStorage は、ブラウザを閉じても残る小さな保存場所
function loadBest(lv) {
  try {
    const value = localStorage.getItem("kakapo-typing-best-" + lv);
    return value === null ? null : Number(value);
  } catch (e) {
    return null; // 保存が使えない環境でも、ゲームは遊べるようにする
  }
}

function saveBest(lv, ms) {
  try {
    localStorage.setItem("kakapo-typing-best-" + lv, String(ms));
  } catch (e) {
    // 保存できなくても気にしない
  }
}

function updateBestLabels() {
  [1, 2].forEach((lv) => {
    const best = loadBest(lv);
    $("best" + lv).textContent = best === null ? "" : "ベスト " + formatTime(best);
  });
}

// ===== タイトル画面 =====
$("titleEgg").innerHTML = stageMarkup(0);
updateBestLabels();

document.querySelectorAll(".level-card").forEach((card) => {
  card.addEventListener("click", () => {
    card.blur();
    startLevel(Number(card.dataset.level));
  });
});

// ===== ゲーム開始（カウントダウン） =====
function startLevel(lv) {
  level = lv;
  quizList = shuffle(LEVELS[lv]).slice(0, QUESTION_COUNT); // ランダムに20問
  index = 0;
  correct = 0;
  stageIndex = 0;
  keystrokes = 0;
  mistakes = 0;
  results = [];

  showScreen("countdown-screen");
  let count = 3;
  const countdown = $("countdown");

  const showCount = () => {
    countdown.textContent = count;
    countdown.classList.remove("tick");
    void countdown.offsetWidth; // アニメーションを最初から再生し直す
    countdown.classList.add("tick");
  };

  showCount();
  const countTimer = setInterval(() => {
    count--;
    if (count === 0) {
      clearInterval(countTimer);
      startPlay();
    } else {
      showCount();
    }
  }, 800);
}

function startPlay() {
  showScreen("play-screen");
  $("effects").innerHTML = ""; // 前のゲームの演出が残っていたら片付ける
  renderStage(false);
  showQuestion();

  startTime = performance.now();
  timerId = setInterval(() => {
    $("timer").textContent = formatTime(performance.now() - startTime);
  }, 100);
  playing = true;
}

// ===== カカポの表示 =====
function renderStage(animate) {
  const stage = $("kakapoStage");
  stage.innerHTML = stageMarkup(stageIndex);
  $("stageName").textContent = STAGES[stageIndex].name;
  $("growthFill").style.width = (correct / QUESTION_COUNT) * 100 + "%";

  if (animate) {
    react("grow");
  }
}

// カカポに動きのクラスを付けて、アニメーションを最初から再生する
function react(className) {
  const stage = $("kakapoStage");
  stage.classList.remove("grow", "hit", "munch");
  void stage.offsetWidth;
  stage.classList.add(className);
}

// ===== 演出（小石・リムの実・♥） =====
const STONE_SVG = '<svg viewBox="0 0 20 16"><path d="M3 10 Q2 4 8 3 Q15 1 17 7 Q19 13 11 14 Q4 15 3 10 Z" fill="#a8a293" stroke="#2b2a26" stroke-width="1.8"/></svg>';
const BERRY_SVG = '<svg viewBox="0 0 20 24"><path d="M10 2 v5" stroke="#6b8f35" stroke-width="2" stroke-linecap="round"/><circle cx="10" cy="15" r="7" fill="#d9534f" stroke="#2b2a26" stroke-width="1.8"/><ellipse cx="10" cy="8" rx="3" ry="2.5" fill="#3c3a33"/><circle cx="7.5" cy="13" r="1.5" fill="#ffffff" opacity="0.6"/></svg>';

// 演出の部品を1つ出して、アニメーションが終わったら消す
function spawnEffect(className, html) {
  const el = document.createElement("div");
  el.className = "fx " + className;
  el.innerHTML = html;
  el.addEventListener("animationend", () => el.remove());
  $("effects").append(el);
  return el;
}

// ミスタイプ：小石がコツン
function throwStone() {
  // 連打で小石だらけにならないように、同時に出すのは3つまで
  if (document.querySelectorAll(".fx-stone").length >= 3) {
    return;
  }
  spawnEffect("fx-stone", STONE_SVG);
  react("hit");
  if (!document.querySelector(".fx-ouch")) {
    spawnEffect("fx-ouch", stageIndex < 2 ? "コツン" : "いてっ");
  }
}

// 正解：リムの実をもぐもぐ（たまごの間は、♥ であたためる）
function feed() {
  $("growthFill").style.width = (correct / QUESTION_COUNT) * 100 + "%";
  if (stageIndex >= 2) {
    spawnEffect("fx-berry", BERRY_SVG);
  }
  spawnEffect("fx-heart", "♥");
  spawnEffect("fx-heart right", "♥");
  react("munch");
}

// ===== 問題を表示する =====
function showQuestion() {
  const q = quizList[index];
  matcher = new RomajiMatcher(q.kana);
  hintCount = 0;
  locked = false;

  $("progress").textContent = (index + 1) + " / " + QUESTION_COUNT;
  $("pref").textContent = q.pref;
  $("kanji").textContent = q.kanji;
  $("message").textContent = "";
  $("message").className = "message";

  if (level === 1) {
    $("furigana").textContent = q.kana; // レベル1はふりがなあり
    $("reading").hidden = true;
    $("hintButton").hidden = true;      // ふりがながあるので、ヒントはいらない
  } else {
    $("furigana").textContent = "";
    $("reading").hidden = false;
    $("hintButton").hidden = false;
  }

  renderTyping();
}

// 打ったところ・残りのお手本・（レベル2）読みの表示を更新する
function renderTyping() {
  const guide = matcher.guide();
  $("typed").textContent = guide.typed;
  // レベル2は読み方がバレないように、ローマ字のお手本を出さない
  $("rest").textContent = level === 1 ? guide.rest : "";

  if (level === 2) {
    const kana = matcher.kana;
    const hintEnd = Math.max(matcher.pos, hintCount);
    const reading = $("reading");
    reading.innerHTML = "";

    const done = document.createElement("span");
    done.textContent = kana.slice(0, matcher.pos);           // 打てたところ

    const hint = document.createElement("span");
    hint.className = "hint";
    hint.textContent = kana.slice(matcher.pos, hintEnd);     // ヒントで見えているところ

    const blank = document.createElement("span");
    blank.className = "blank";
    blank.textContent = "・".repeat(kana.length - hintEnd); // まだわからないところ

    reading.append(done, hint, blank);
  }
}

// ===== キーボード入力 =====
document.addEventListener("keydown", (e) => {
  if (!playing) {
    return;
  }

  // 日本語入力がオンのときは、キーが「Process」になる
  if (e.isComposing || e.key === "Process") {
    $("imeWarning").hidden = false;
    return;
  }

  if (e.key === " ") {
    e.preventDefault(); // スペースで画面がスクロールしないように
    hint();
    return;
  }
  if (e.key === "Escape") {
    skip();
    return;
  }
  if (e.ctrlKey || e.metaKey || e.altKey || locked) {
    return;
  }

  const key = e.key.toLowerCase();
  if (!/^[a-z\-]$/.test(key)) {
    return; // ローマ字で使うキー以外は無視
  }
  e.preventDefault();
  $("imeWarning").hidden = true;
  keystrokes++;

  if (matcher.input(key)) {
    renderTyping();
    if (matcher.isDone()) {
      answerCorrect();
    }
  } else {
    mistakes++;
    const card = $("questionCard");
    card.classList.remove("miss");
    void card.offsetWidth;
    card.classList.add("miss");
    throwStone();
  }
});

// 成長したときのメッセージ（段階の番号と同じ順番）
const GROW_MESSAGES = [
  "",
  "たまごにひびが入った！",
  "ヒナがうまれた！",
  "ふわふわのヒナに育った！",
  "わかどりに育った！",
  "おとなのカカポに育った！",
];

// ===== 正解したとき =====
function answerCorrect() {
  locked = true;
  correct++;
  results.push({ q: quizList[index], skipped: false });

  const message = $("message");
  message.className = "message is-good";

  const newStage = stageFor(correct);
  if (newStage > stageIndex) {
    // 段階が上がった！
    stageIndex = newStage;
    renderStage(true);
    spawnEffect("fx-heart", "♥");
    spawnEffect("fx-heart right", "♥");
    message.textContent = GROW_MESSAGES[stageIndex];
    nextTimer = setTimeout(nextQuestion, 900);
  } else {
    feed();
    message.textContent = "正解！";
    nextTimer = setTimeout(nextQuestion, 450);
  }
}

// ===== ヒント（レベル2だけ） =====
function hint() {
  if (level !== 2 || locked) {
    return;
  }
  // 打てたところの次の1文字を見せる
  hintCount = Math.min(Math.max(hintCount, matcher.pos) + 1, matcher.kana.length);
  renderTyping();
}

$("hintButton").addEventListener("click", (e) => {
  e.currentTarget.blur();
  hint();
});

// ===== スキップ =====
function skip() {
  if (locked) {
    return;
  }
  locked = true;
  const q = quizList[index];
  results.push({ q: q, skipped: true });

  // 答えを見せてから、次の問題へ
  hintCount = q.kana.length;
  renderTyping();
  const message = $("message");
  message.className = "message is-skip";
  message.textContent = "正解は「" + q.kana + "」でした";
  nextTimer = setTimeout(nextQuestion, 1500);
}

$("skipButton").addEventListener("click", (e) => {
  e.currentTarget.blur();
  skip();
});

// ===== やめる =====
// タイマーと予約を止めて、タイトルに戻る（記録は残さない）
function quitGame() {
  playing = false;
  locked = true;
  clearInterval(timerId);
  clearTimeout(nextTimer);
  $("imeWarning").hidden = true;
  updateBestLabels();
  showScreen("title-screen");
}

$("quitButton").addEventListener("click", (e) => {
  e.currentTarget.blur();
  quitGame();
});

// ===== 次の問題へ =====
function nextQuestion() {
  index++;
  if (index < QUESTION_COUNT) {
    showQuestion();
  } else {
    finish();
  }
}

// ===== 結果画面 =====
const RESULT_MESSAGES = [
  "たまごのまま…もう一度チャレンジしてみよう",
  "ひびが入った！あと少しでうまれるよ",
  "うまれたね！次はもっと育てよう",
  "ふわふわのヒナになったよ",
  "わかどりまで育った！あと少しでおとなだ",
  "全問正解！おとなのカカポに育ったよ 🎉",
];

function finish() {
  playing = false;
  clearInterval(timerId);
  const elapsed = performance.now() - startTime;

  $("resultKakapo").innerHTML = stageMarkup(stageIndex);
  $("resultStage").textContent = STAGES[stageIndex].name;
  $("resultMessage").textContent = RESULT_MESSAGES[stageIndex];

  $("resultTime").textContent = formatTime(elapsed);
  $("resultCorrect").textContent = correct + " / " + QUESTION_COUNT;
  $("resultMiss").textContent = mistakes;
  const accuracy = keystrokes === 0 ? 0 : Math.round(((keystrokes - mistakes) / keystrokes) * 100);
  $("resultAccuracy").textContent = accuracy + "%";

  // ベストタイムは、全問正解（おとなのカカポ）のときだけ記録する
  const best = loadBest(level);
  const isNewRecord = correct === QUESTION_COUNT && (best === null || elapsed < best);
  if (isNewRecord) {
    saveBest(level, elapsed);
  }
  $("newRecord").hidden = !isNewRecord;

  // 今回の地名と読み方の一覧
  const list = $("answerList");
  list.innerHTML = "";
  results.forEach((r) => {
    const li = document.createElement("li");
    li.textContent = r.q.kanji + "（" + r.q.kana + "）";
    const small = document.createElement("small");
    small.textContent = " " + r.q.pref + (r.skipped ? "・スキップ" : "");
    li.append(small);
    if (r.skipped) {
      li.classList.add("is-skip");
    }
    list.append(li);
  });

  setupShare(elapsed);
  showScreen("result-screen");
}

// ===== SNS でシェア =====
const GAME_URL = "https://kakapo-studio.github.io/typing-game/";

// シェアの文章で使う、育った姿の言い方
const SHARE_NAMES = ["", "ひびの入ったたまご", "うまれたてのヒナ", "ふわふわのヒナ", "わかどり", "おとなのカカポ"];

let shareText = "";

function setupShare(elapsed) {
  const levelName = level === 1 ? "レベル1 ふりがなあり" : "レベル2 難読地名";
  const grown = stageIndex === 0
    ? "たまごのままだった…"
    : "「" + SHARE_NAMES[stageIndex] + "」まで育てたよ！";

  shareText =
    "カカポを育てる地名タイピング【" + levelName + "】で" + grown + "\n" +
    "正解 " + correct + "/" + QUESTION_COUNT + "・タイム " + formatTime(elapsed) + "\n" +
    "#カカポ地名タイピング";

  // encodeURIComponent：日本語や改行を、URL に入れられる形に変換する
  $("shareX").href =
    "https://x.com/intent/post?text=" + encodeURIComponent(shareText) +
    "&url=" + encodeURIComponent(GAME_URL);

  // LINE は URL を送る形（ゲームの OGP 画像つきのカードになる）
  $("shareLine").href =
    "https://social-plugins.line.me/lineit/share?url=" + encodeURIComponent(GAME_URL);

  $("copyMessage").textContent = "";
}

// 結果の文章をコピー（Instagram や Discord などに貼りたいとき用）
$("copyResult").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(shareText + "\n" + GAME_URL);
    $("copyMessage").textContent = "コピーしました！";
  } catch (e) {
    $("copyMessage").textContent = "コピーできませんでした…";
  }
});

$("retryButton").addEventListener("click", () => {
  startLevel(level);
});

$("backButton").addEventListener("click", () => {
  updateBestLabels();
  showScreen("title-screen");
});
