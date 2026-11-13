const matches = [
  { round: 27, date: "10.10", team: "天津津门虎", crest: "tianjin", score: "0 : 1", venue: "主场", prize: 3,
    note: "补时被绝杀，第一刀砍了个空。",
    source: "https://news.chengdu.cn/2026/1010/6aca3f03f56a2b480c5091c9.shtml" },
  { round: 28, date: "10.18", team: "上海海港", crest: "shanghai", score: "0 : 3", venue: "客场", prize: 1,
    note: "助力积分到账。联赛积分原地不动。",
    source: "https://sports.cctv.cn/2026/10/18/ARTIUmhr4U16FK61BvoKMNZd261018.shtml" },
  { round: 29, date: "10.24", team: "大连英博", crest: "dalian", score: "0 : 1", venue: "主场", prize: 2,
    note: "碎片到手，冠军点只剩最后一次。",
    source: "https://www.xinhuanet.com/sports/20261026/2d3c75fa81f646f18b41e57ae4214edb/c.html" },
  { round: 30, date: "11.08", team: "山东泰山", crest: "shandong", score: "2 : 3", venue: "客场", prize: 4,
    note: "冠军物料也凑齐了，快去兑换！",
    source: "https://sc.people.com.cn/n2/2026/1109/c345167-41745287.html" },
];

const prizes = [
  { icon: "🏆", name: "冠军奖杯", jackpot: true },
  { icon: "●", name: "助力积分", material: "points", amount: 100, note: "助力专用，联赛积分 +0" },
  { icon: "✦", name: "冠军碎片", material: "fragment", amount: 1, note: "距离兑奖只差一份物料" },
  { icon: "◆", name: "助力钻石", material: "diamond", amount: 1, note: "闪是挺闪，联赛积分 +0" },
  { icon: "▣", name: "冠军物料", material: "supply", amount: 1, note: "最后一件，兑换条件已达成" },
  { icon: "↻", name: "再砍一刀" },
];

const dalianMatches = [
  { date: "10.11", team: "青岛西海岸", crest: "qingdao", score: "4 : 0", venue: "客场",
    source: "https://sports.cri.cn/2026-10-12/e77e11c0-3ea7-4bcd-8217-46ebce4392fe.html" },
  { date: "10.17", team: "深圳新鹏城", crest: "shenzhen", score: "3 : 1", venue: "主场",
    source: "https://ent.people.com.cn/n1/2026/1019/c1012-40817035.html" },
  { date: "10.24", team: "成都蓉城", crest: "chengdu", score: "1 : 0", venue: "客场", source: matches[2].source },
  { date: "11.08", team: "天津津门虎", crest: "tianjin", score: "3 : 1", venue: "主场",
    source: "https://www.cfl-china.cn/zh/content/news/YyFN.html" },
];

const byId = (id) => document.getElementById(id);
const wheel = byId("wheel");
const wheelArea = byId("wheel-area");
const rim = byId("wheel-rim");
const face = byId("wheel-face");
const spin = byId("spin");
const mainAction = byId("main-action");
const assist = byId("assist-dalian");
const invite = byId("invite");
const friendPacket = byId("friend-packet");
const rules = byId("rules");
const reset = byId("reset");
const modal = byId("modal");
const content = byId("modal-content");
const list = byId("rounds");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let roundIndex = 0;
let revealed = 0;
let dalianRevealed = 0;
let phase = "ready";
let rotation = 0;
let timer;
let friendAssist = null;
const hand = '<span class="guide-hand" aria-hidden="true">☝️</span>';
const burst = '<span class="burst" aria-hidden="true"></span>';
const materials = [prizes[3], prizes[1], prizes[2], prizes[4]];

for (let index = 0; index < 24; index += 1) {
  const light = document.createElement("i");
  light.style.setProperty("--angle", index * 15 + "deg");
  rim.append(light);
}

prizes.forEach((prize, index) => {
  const wedge = document.createElement("div");
  wedge.className = prize.jackpot ? "prize prize-jackpot" : "prize";
  wedge.style.setProperty("--angle", index * 60 - 180 + "deg");
  const icon = prize.material ? materialIcon(prize) : "<b>" + prize.icon + "</b>";
  wedge.innerHTML = icon + "<span>" + prize.name + "</span>";
  face.append(wedge);
});

function positionLights() {
  rim.style.setProperty("--radius", wheel.clientWidth * 0.473 + "px");
}
positionLights();
new ResizeObserver(positionLights).observe(wheel);

function crest(key, name = "") {
  return '<img src="crests/' + key + '.png" alt="' + name + '" width="67" height="67">';
}

function materialIcon(prize) {
  return '<span class="material-icon ' + prize.material + '" aria-hidden="true"></span>';
}

function lootList(rewards) {
  return '<ul class="loot-list">' + rewards.map((prize) =>
    '<li class="loot-item">' + materialIcon(prize) + '<span><strong>' + prize.name + '</strong><small>'
    + prize.note + '</small></span><b>+' + prize.amount + '</b></li>'
  ).join("") + '</ul>';
}

function renderInventory() {
  byId("inventory").innerHTML = materials.map((prize) => {
    const earned = matches.slice(0, revealed).some((match) => prizes[match.prize] === prize);
    const collected = earned && (phase !== "complete" || prize.material !== "fragment");
    return '<div class="inventory-item">' + materialIcon(prize) + '<span>' + prize.name + '</span><strong>'
      + (collected ? prize.amount : 0) + '</strong></div>';
  }).join("");
}

function buildRecord(match, index) {
  const item = document.createElement("li");
  const row = document.createElement("button");
  const chengduKnown = index < revealed;
  const dalianKnown = index < dalianRevealed;
  const isRevealed = chengduKnown || dalianKnown;
  const opponent = dalianMatches[index];
  row.className = "record-row";
  row.type = "button";
  row.disabled = !isRevealed;
  if (index === roundIndex && phase !== "complete") {
    row.classList.add("current");
  }
  if (!isRevealed) row.setAttribute("aria-disabled", "true");
  row.innerHTML = '<span class="record-meta"><b>第 ' + match.round + ' 轮</b><small>' + match.date + '</small></span>'
    + '<span class="record-lines">'
    + recordLine("成都蓉城", match, chengduKnown)
    + recordLine("大连英博", opponent, dalianKnown)
    + '</span>';
  if (isRevealed) {
    row.setAttribute("aria-label", "查看第 " + match.round + " 轮争冠赛果");
    row.addEventListener("click", () => {
      if (chengduKnown && dalianKnown) showRoundRecord(index);
      else if (chengduKnown) showMatch(index, false);
      else showDalianResult(index, false);
    });
  }
  item.append(row);
  return item;
}

function recordLine(team, match, known) {
  return '<span><b>' + team + '</b><strong>' + (known ? match.score : '待揭晓') + '</strong>' + match.team + '</span>';
}

function render() {
  const match = matches[roundIndex];
  const dalianKnown = dalianRevealed > roundIndex;
  const complete = phase === "complete";
  byId("gap-copy").textContent = complete ? "赛季收官，锁定目标仍差" : "距锁定中超冠军还差";
  byId("champion-progress-status").textContent = complete ? "兑奖失败 · 还差 1 分" : "离冠军还差 1 分";
  byId("round-label").textContent = complete ? "赛季收官" : "第 " + match.round + " 轮";
  byId("round-context").textContent = complete ? "四个冠军点全部错过" : "第 " + (roundIndex + 1) + " / 4 次冠军点";
  byId("versus-label").textContent = complete ? "成都蓉城 · 中超亚军" : "成都蓉城 vs " + match.team;
  spin.disabled = phase !== "ready";
  spin.querySelector("strong").textContent = complete ? "已结束" : "砍一刀";
  spin.querySelector("small").textContent = phase === "ready" ? "还剩 1 次" : "还剩 0 次";
  spin.querySelector(".guide-hand").hidden = phase !== "ready";
  mainAction.disabled = phase === "spinning";
  assist.disabled = phase === "spinning";
  assist.hidden = phase === "result" && !dalianKnown;
  byId("assist-label").textContent = dalianKnown ? "查看大连本轮赛果" : "助力大连输球";
  byId("main-guide").hidden = phase === "spinning" || complete;
  invite.disabled = phase === "spinning";
  friendPacket.disabled = phase === "spinning";
  rules.disabled = phase === "spinning";
  invite.lastChild.textContent = complete ? " 分享夺冠挑战" : " 邀请好友助力";
  const labels = {
    ready: ["打开转盘砍一刀", "本轮还有 1 次免费机会"],
    spinning: ["正在砍价…", "转盘正在揭晓本轮红包"],
    packet: ["拆开本轮红包", "红包已到账，拆开看比分"],
    result: dalianKnown
      ? ["进入下一轮", "蓉城 +0，大连 +3，夺冠还差 1 分"]
      : ["助力大连输球", "蓉城 +0。大连这场掉分，冠军就到手。"],
    finale: ["兑换冠军", "冠军物料已集齐，快去兑换！"],
    complete: ["再玩一次", "四轮拿了 0 分，冠军还是差 1 分"],
  };
  [byId("main-label").textContent, byId("game-status").textContent] = labels[phase];
  const settled = Math.min(revealed, dalianRevealed);
  const lead = 12 - dalianRevealed * 3;
  byId("record-count").textContent = "已结算 " + settled + " / " + matches.length + " 轮";
  byId("dalian-points").textContent = 40 + dalianRevealed * 3 + " 分";
  byId("dalian-status").textContent = lead ? "成都领先 " + lead + " 分" : "两队同积 52 分";
  byId("season-result").hidden = !complete;
  reset.disabled = phase === "spinning" || (roundIndex === 0 && phase === "ready" && !dalianKnown);
  list.replaceChildren(...matches.map(buildRecord));
  renderInventory();
}

function showDialog(html, className = "") {
  const alreadyOpen = modal.open;
  content.className = "modal-inner";
  void content.offsetWidth;
  content.className = "modal-inner " + className;
  content.innerHTML = '<button class="close" type="button" data-close aria-label="关闭">×</button>' + html;
  if (!alreadyOpen) modal.showModal();
  (content.querySelector("[data-focus]") ?? content.querySelector("[data-close]")).focus();
}

content.addEventListener("click", (event) => {
  if (phase !== "spinning" && event.target.closest("[data-close]")) modal.close();
});
modal.addEventListener("click", (event) => {
  if (phase !== "spinning" && event.target === modal) modal.close();
});
modal.addEventListener("cancel", (event) => {
  if (phase === "spinning") event.preventDefault();
});
modal.addEventListener("close", () => {
  if (!modal.open && document.activeElement === document.body) mainAction.focus();
});

function showWelcome() {
  showDialog(
    burst + '<div class="welcome-art">' + materialIcon(prizes[3]) + materialIcon(prizes[2]) + materialIcon(prizes[4]) + '</div>'
    + '<h2 id="modal-title">领取你的冠军助力机会</h2>'
    + '<p>离冠军只差 <strong>1 分</strong>。你的第一刀已到账！</p>'
    + resultButton("claim-chance", "收下机会，马上去砍"),
    "hype campaign welcome-campaign",
  );
  byId("claim-chance").addEventListener("click", showWheel);
}

function showWheel() {
  const match = matches[roundIndex];
  showDialog(
    burst + '<p class="hype-kicker">第 ' + match.round + ' 轮冠军点</p>'
    + '<h2 id="modal-title">冠军助力大转盘</h2>'
    + '<div class="wheel-matchup"><div>' + crest("chengdu") + '<span>成都蓉城</span></div>'
    + '<strong>VS</strong><div>' + crest(match.crest) + '<span>' + match.team + '</span></div></div>'
    + '<div class="campaign-wheel-slot" id="wheel-slot"></div><p id="wheel-status" role="status">点中间「砍一刀」抽本轮助力</p>',
    "hype campaign wheel-campaign",
  );
  byId("wheel-slot").append(wheelArea);
  positionLights();
  spin.focus({ preventScroll: true });
}

function showPacket() {
  const match = matches[roundIndex];
  showDialog(
    burst + '<h2 id="modal-title">哇！助力红包掉下来啦！</h2>'
    + '<p>第 ' + match.round + ' 轮 · 抽中「' + prizes[match.prize].name + '」</p>'
    + '<div class="big-packet"><button id="open-packet" data-focus class="packet-open" type="button" aria-label="拆红包揭晓比分">开' + hand + '</button></div>'
    + '<p class="envelope-note">拆开红包，看看这一刀砍了多少分</p>',
    "envelope hype campaign",
  );
  byId("open-packet").addEventListener("click", () => {
    revealed = roundIndex + 1;
    finishRound();
    render();
    showMatch(roundIndex, true);
  });
}

function matchBox(match, team, teamCrest, round) {
  return '<div class="match-box' + (teamCrest === "dalian" ? ' dalian-reveal' : '') + '"><div class="match-round">第 ' + round + ' 轮 · ' + match.date + ' · ' + team + match.venue + '</div>'
    + '<div class="match-grid"><div class="match-team">' + crest(teamCrest) + '<span>' + team + '</span></div>'
    + '<strong class="match-score">' + match.score + '</strong>'
    + '<div class="match-team">' + crest(match.crest) + '<span>' + match.team + '</span></div></div>'
    + '<a class="match-source" href="' + match.source + '" target="_blank" rel="noopener noreferrer">比赛报道 ↗</a></div>';
}

function finishRound() {
  if (revealed > roundIndex) {
    phase = Math.min(revealed, dalianRevealed) === matches.length ? "finale" : "result";
  }
}

function resultButton(id, label) {
  return '<button id="' + id + '" data-focus class="primary" type="button">' + label + hand + '</button>';
}

function recordButton(index) {
  return resultButton("view-records", index === matches.length - 1 ? "查看四轮争冠记录" : "返回争冠记录");
}

function bindRecordButton(index) {
  byId("view-records")?.addEventListener("click", () => {
    modal.close();
    list.children[index].firstElementChild.focus({ preventScroll: true });
    byId("record-title").scrollIntoView({ behavior: reduceMotion.matches ? "instant" : "smooth", block: "start" });
  });
}

function showRoundRecord(index) {
  const match = matches[index];
  const opponent = dalianMatches[index];
  const games = match.round === 29
    ? matchBox(match, "成都蓉城", "chengdu", match.round) + '<p>这轮是直接交锋。蓉城 +0，大连 +3。</p>'
    : '<div class="dalian-pair">' + matchBox(match, "成都蓉城", "chengdu", match.round)
      + matchBox(opponent, "大连英博", "dalian", match.round) + '</div>';
  showDialog('<h2 id="modal-title">第 ' + match.round + ' 轮争冠赛果</h2>' + games + recordButton(index));
  bindRecordButton(index);
}

function showMatch(index, fresh) {
  const match = matches[index];
  const dalianKnown = index < dalianRevealed;
  const prize = prizes[match.prize];
  const heading = fresh ? "恭喜！没砍成功，但你获得了" + prize.name + "！" : "第 " + match.round + " 轮赛果";
  let action = recordButton(index);
  if (fresh && !dalianKnown) action = resultButton("match-assist", "赶紧助力大连输球！");
  else if (fresh && phase === "finale") action = resultButton("claim-finale", "去兑换冠军");
  else if (fresh && phase === "result") action = resultButton("next-round", "去下一轮再砍");
  showDialog(
    (fresh ? burst + '<p class="hype-kicker">助力大奖已到账</p>' : '')
    + '<h2 id="modal-title">' + heading + '</h2>'
    + (fresh ? lootList([prize]) : '')
    + matchBox(match, "成都蓉城", "chengdu", match.round)
    + '<p class="reward">本轮联赛积分 +0 · ' + prizes[match.prize].name + ' ×1</p><p>' + match.note + '</p>'
    + action
    + (dalianKnown ? '<button id="dalian-details" class="secondary" type="button">查看大连本轮赛果</button>' : ''),
    fresh ? "hype campaign loot-campaign" : "",
  );
  byId("next-round")?.addEventListener("click", nextRound);
  byId("match-assist")?.addEventListener("click", showDalianAssist);
  byId("claim-finale")?.addEventListener("click", showCollected);
  byId("dalian-details")?.addEventListener("click", () => showDalianResult(index, fresh));
  bindRecordButton(index);
}

function showDalianAssist() {
  if (phase === "spinning") return;
  if (dalianRevealed > roundIndex) {
    showDalianResult(roundIndex, false);
    return;
  }
  const match = dalianMatches[roundIndex];
  const unlocked = canOpenDalian();
  const waiting = friendAssist?.round === roundIndex && !unlocked;
  const directMatch = isDirectMatch();
  showDialog(
    burst + '<p class="hype-kicker">冠军助力红包</p><h2 id="modal-title">快！助力大连输球！</h2>'
    + '<div class="wheel-matchup"><div>' + crest("dalian") + '<span>大连英博</span></div>'
    + '<strong>VS</strong><div>' + crest(match.crest) + '<span>' + match.team + '</span></div></div>'
    + '<p>大连只要少拿分，蓉城就能夺冠。</p>'
    + '<div class="big-packet"><button id="open-dalian" class="packet-open" type="button" '
    + (unlocked ? 'data-focus aria-label="拆掉分红包，揭晓大连赛果">开' + hand : 'disabled aria-label="红包待解锁">锁')
    + '</button></div>'
    + '<p class="envelope-note">' + (directMatch ? '这轮是成都和大连直接交锋，可以直接拆。'
      : unlocked ? '好友助力已到账，点「开」揭晓比分。'
        : waiting ? '口令已复制，切到聊天或其他页面，再回来解锁。'
          : '先复制口令求助，离开页面再回来解锁红包。') + '</p>'
    + (unlocked ? '' : resultButton("invite-dalian", "复制口令，求助" + match.team)),
    "envelope hype",
  );
  byId("open-dalian").addEventListener("click", () => {
    if (!canOpenDalian()) return;
    dalianRevealed = roundIndex + 1;
    finishRound();
    render();
    showDalianResult(roundIndex, true);
  });
  byId("invite-dalian")?.addEventListener("click", () => showInvite(true));
}

function isDirectMatch() {
  return dalianMatches[roundIndex].crest === "chengdu";
}

function canOpenDalian() {
  return isDirectMatch() || (friendAssist?.round === roundIndex && friendAssist.unlocked);
}

function showAssistSuccess() {
  friendAssist.notified = true;
  showDialog(
    burst + '<p class="hype-kicker">掉分红包已解锁</p>'
    + '<h2 id="modal-title">恭喜！您的好友助力成功！</h2>'
    + '<p>' + dalianMatches[roundIndex].team + '收到助力，快去拆红包揭晓比分！</p>'
    + resultButton("claim-assist", "去拆掉分红包"),
    "hype campaign loot-campaign",
  );
  byId("claim-assist").addEventListener("click", showDalianAssist);
}

document.addEventListener("visibilitychange", () => {
  if (friendAssist?.round !== roundIndex || friendAssist.unlocked) return;
  if (document.hidden) {
    friendAssist.left = true;
  } else if (friendAssist.left) {
    friendAssist.unlocked = true;
    if (phase !== "spinning") showAssistSuccess();
  }
});

function showDalianResult(index, fresh) {
  const match = dalianMatches[index];
  const chengduKnown = index < revealed;
  const lead = 9 - index * 3;
  let action = recordButton(index);
  if (fresh && !chengduKnown) action = resultButton("back-chengdu", "回去砍蓉城这轮");
  else if (fresh && phase === "finale") action = resultButton("claim-finale", "去兑换冠军");
  else if (fresh && phase === "result") action = resultButton("next-round", "去下一轮再砍");
  showDialog(
    (fresh ? burst + '<p class="hype-kicker">掉分红包结算</p>' : '')
    + '<h2 id="modal-title">' + (fresh ? '坏了！大连又赢了！' : '大连英博本轮赛果') + '</h2>'
    + (fresh ? '<p class="hype-number no-drop">掉分 0</p>' : '')
    + matchBox(match, "大连英博", "dalian", matches[index].round)
    + '<p class="reward">大连本轮 +3 · 累计 ' + (43 + index * 3) + ' 分</p>'
    + '<p>' + (lead ? '本轮结束后，成都的领先优势只剩 ' + lead + ' 分。' : '末轮结算：双方同积 52 分。') + '</p>'
    + (index === 2 ? '<p>本轮双方直接交锋，两条线对应同一场比赛。</p>' : '')
    + action
    + (chengduKnown ? '<button id="chengdu-details" class="secondary" type="button">查看蓉城本轮赛果</button>' : ''),
    fresh ? "hype" : "",
  );
  byId("next-round")?.addEventListener("click", nextRound);
  byId("claim-finale")?.addEventListener("click", showCollected);
  byId("chengdu-details")?.addEventListener("click", () => showMatch(index, fresh));
  byId("back-chengdu")?.addEventListener("click", () => {
    if (phase === "packet") showPacket();
    else showWheel();
  });
  bindRecordButton(index);
}

function showCollected() {
  showDialog(
    burst + '<p class="hype-kicker">冠军兑换资格已达成</p>'
    + '<h2 id="modal-title">恭喜你集齐了！</h2>'
    + lootList(materials)
    + resultButton("redeem-champion", "立即兑换中超冠军"),
    "hype campaign collected-campaign",
  );
  byId("redeem-champion").addEventListener("click", showFinale);
}

function showFinale() {
  phase = "complete";
  render();
  showDialog(
    '<p class="hype-kicker">兑奖失败 · 碎片已回收</p>'
    + '<h2 id="modal-title">抱歉，冠军碎片被收废品大爷收走了！</h2>'
    + '<img class="final-photo" src="scrap-yard.jpg" width="828" height="594" alt="废品回收场，蓝色板材和杂物堆在围栏内">'
    + '<div class="final-champion">' + crest("dalian") + '<strong>大连英博是冠军！</strong></div>'
    + '<p>成都蓉城、大连英博同积 52 分，大连凭相互战绩夺冠。</p>'
    + recordButton(roundIndex),
    "hype campaign final-campaign",
  );
  bindRecordButton(roundIndex);
}

function startSpin() {
  if (phase !== "ready") return;
  phase = "spinning";
  const target = (360 - matches[roundIndex].prize * 60) % 360;
  rotation += 1440 + (target - rotation % 360 + 360) % 360;
  face.style.transform = "rotate(" + rotation + "deg)";
  render();
  byId("wheel-status").textContent = "正在结算这一刀……";
  content.querySelector("[data-close]").disabled = true;
  timer = window.setTimeout(() => {
    phase = "packet";
    render();
    if (friendAssist?.round === roundIndex && friendAssist.unlocked && !friendAssist.notified) {
      showAssistSuccess();
    } else {
      showPacket();
    }
  }, reduceMotion.matches ? 0 : 1350);
}

function nextRound() {
  if (phase !== "result" || dalianRevealed <= roundIndex) return;
  roundIndex += 1;
  friendAssist = null;
  phase = "ready";
  render();
  showWheel();
}

function restart() {
  window.clearTimeout(timer);
  roundIndex = 0;
  friendAssist = null;
  revealed = 0;
  dalianRevealed = 0;
  phase = "ready";
  rotation = 0;
  face.style.transition = "none";
  face.style.transform = "rotate(0deg)";
  void face.offsetWidth;
  face.style.removeProperty("transition");
  render();
  showWelcome();
}

function showInvite(forDalian = false, returnToWheel = false) {
  const complete = phase === "complete";
  const invitedRound = roundIndex;
  const round = matches[invitedRound].round;
  const opponent = dalianMatches[invitedRound].team;
  const needsAssist = !complete && !isDirectMatch() && dalianRevealed <= invitedRound && !canOpenDalian();
  const message = complete ? "四轮砍完还差 1 分，来玩蓉城夺冠砍一刀！"
    : isDirectMatch() ? "第 " + round + " 轮，成都蓉城和大连英博直接交锋，来看看这一刀！"
      : "第 " + round + " 轮，求助" + opponent + "帮忙拦住大连英博！快来助力蓉城砍冠军！";
  showDialog(
    '<h2 id="modal-title">' + (complete ? "分享夺冠挑战" : "邀请好友助力") + '</h2>'
    + '<p class="share-copy">' + message + '</p>'
    + '<button class="primary" id="copy-invite" data-focus type="button">复制助力口令</button>'
    + '<p class="share-status" id="share-status" role="status"></p>'
    + '<textarea id="share-manual" class="share-manual" aria-label="助力口令" readonly hidden></textarea>'
    + '<button class="secondary" id="return-game" type="button">返回挑战</button>',
  );
  const status = byId("share-status");
  const manual = byId("share-manual");
  function onCopied() {
    if (!status.isConnected) return;
    if (needsAssist && roundIndex === invitedRound && dalianRevealed <= invitedRound && !canOpenDalian()) {
      friendAssist ??= { round: invitedRound, left: false, unlocked: false, notified: false };
      if (document.hidden) friendAssist.left = true;
      status.textContent = "口令已复制。切到聊天或其他页面，再回来解锁红包。";
    } else {
      status.textContent = "口令已复制，可以粘贴给好友。";
    }
  }
  manual.addEventListener("copy", onCopied);
  byId("copy-invite").addEventListener("click", async () => {
    const link = new URL("./", window.location.href).href;
    const text = message + "\n" + link;
    try {
      await navigator.clipboard.writeText(text);
      onCopied();
    } catch {
      manual.value = text;
      manual.hidden = false;
      manual.select();
      status.textContent = "请长按或使用复制快捷键。";
    }
  });
  byId("return-game").addEventListener("click", () => {
    if (forDalian) showDalianAssist();
    else if (returnToWheel) showWheel();
    else if (phase === "result") showMatch(roundIndex, true);
    else if (phase === "packet") showPacket();
    else modal.close();
  });
}

rules.addEventListener("click", () => showDialog(
  '<h2 id="modal-title">活动规则</h2>'
  + '<ol class="rules-list"><li>从第 27 轮起，每轮转一次盘、拆蓉城红包，再拆大连掉分红包。两条线都结算后进入下一轮。</li>'
  + '<li>蓉城拿 1 分或大连掉分都能改变争冠结果。第 29 轮是两队直接交锋，两个视角对应同一场比赛。</li>'
  + '<li>助力积分、钻石、碎片和物料用来兑换冠军，联赛积分按真实比分结算。</li>'
  + '<li>大连掉分红包需复制本轮口令，切走再回来触发游戏内好友助力。第 29 轮可直接拆。</li></ol>'
  + '<a class="rules-reference" href="https://www.cfl-china.cn/zh/content/league/CSL.html" target="_blank" rel="noopener noreferrer">队徽来源 · 中足联 ↗</a>'
  + '<button data-close data-focus class="primary" type="button">知道了</button>',
));

spin.addEventListener("click", startSpin);
mainAction.addEventListener("click", () => {
  if (phase === "ready") showWheel();
  else if (phase === "packet") showPacket();
  else if (phase === "result" && dalianRevealed <= roundIndex) showDalianAssist();
  else if (phase === "result") nextRound();
  else if (phase === "finale") showCollected();
  else if (phase === "complete") restart();
});
invite.addEventListener("click", () => showInvite());
friendPacket.addEventListener("click", () => showInvite(false, true));
assist.addEventListener("click", showDalianAssist);
reset.addEventListener("click", restart);
render();
const opening = byId("opening-sequence");
function finishOpening() {
  if (!opening.isConnected) return;
  opening.remove();
  showWelcome();
}
if (reduceMotion.matches) {
  finishOpening();
} else {
  opening.lastElementChild.addEventListener("animationend", finishOpening, { once: true });
  window.setTimeout(finishOpening, 3200);
}
