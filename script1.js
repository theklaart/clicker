let score = 0;
let danger = 0;
let level = 1;

let clickPower = 2;
let dangerSpeed = 4.5;
let lastClickTime = Date.now();

let powerPrice = 100;
let ragePrice = 200;
let barrierPrice = 400;
let slowPrice = 550;

let barrierActive = false;
let slowActive = false;
let gameOver = false;
let gameStarted = false;

let barrierTimer = null;
let barrierDuration = 30;
let barrierTimeLeft = 0;

let attackWaveActive = false;
let wavesDone = {};
let effectsDone = {};
let clickProtectionMultiplier = 1;

const scoreText = document.getElementById("score");
const dangerText = document.getElementById("danger");
const levelText = document.getElementById("level");
const dangerFill = document.getElementById("dangerFill");

const scene = document.getElementById("scene");
const protectBtn = document.getElementById("protectBtn");
const message = document.getElementById("message");
const rage = document.getElementById("rage");
const barrier = document.getElementById("barrier");

const bigMessage = document.getElementById("bigMessage");
const bigTitle = document.getElementById("bigTitle");
const bigText = document.getElementById("bigText");

const monsters = document.querySelectorAll(".monster");

const powerBtn = document.getElementById("powerBtn");
const rageBtn = document.getElementById("rageBtn");
const barrierBtn = document.getElementById("barrierBtn");
const slowBtn = document.getElementById("slowBtn");

const powerPriceText = document.getElementById("powerPrice");
const ragePriceText = document.getElementById("ragePrice");
const slowPriceText = document.getElementById("slowPrice");

const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");
const countdownText = document.getElementById("countdown");

const readySound = document.getElementById("readySound");
const closingSound = document.getElementById("closingSound");
const screamSound = document.getElementById("screamSound");

readySound.volume = 0.8;
closingSound.volume = 0.15;
screamSound.volume = 0.9;

protectBtn.addEventListener("click", protect);

document.addEventListener("keydown", function(e) {
  if (e.code === "Space") {
    e.preventDefault();
    protect();
  }
});

startBtn.addEventListener("click", function() {
  readySound.currentTime = 0;
  readySound.play();

  let count = 3;
  countdownText.textContent = count;
  startBtn.style.display = "none";

  const countdownInterval = setInterval(function() {
    count--;
    countdownText.textContent = count;

    if (count <= 0) {
      clearInterval(countdownInterval);
      startScreen.style.display = "none";
      gameStarted = true;
      lastClickTime = Date.now();

      closingSound.currentTime = 0;
      closingSound.play();
    }
  }, 1000);
});

function protect() {
  if (!gameStarted || gameOver) return;

  score += clickPower;
  danger -= clickPower * 0.28 * clickProtectionMultiplier;

  if (attackWaveActive) {
    danger -= clickPower * 0.25;
  }

  lastClickTime = Date.now();

  if (danger < 0) danger = 0;

  smallPulse();
  update();
}

function smallPulse() {
  rage.classList.remove("active");
  void rage.offsetWidth;
  rage.classList.add("active");
}

function updateSound() {
  if (!gameStarted || gameOver) return;

  closingSound.volume = Math.min(0.95, 0.12 + danger / 110);
  closingSound.playbackRate = Math.min(1.7, 0.8 + danger / 120 + level / 20);
}

function update() {
  scoreText.textContent = Math.floor(score);
  dangerText.textContent = Math.floor(danger) + "%";
  levelText.textContent = level;
  dangerFill.style.width = danger + "%";

  powerPriceText.textContent = powerPrice;
  ragePriceText.textContent = ragePrice;
  slowPriceText.textContent = slowPrice;

  if (!barrierActive) {
    document.getElementById("barrierPrice").textContent = barrierPrice;
  }

  updateLevel();
  applyLevelEffects();
  moveMonsters();
  updateSound();
  checkAttackWave();

  if (danger > 45 || attackWaveActive) {
    scene.classList.add("danger");
  } else {
    scene.classList.remove("danger");
  }

  if (danger >= 100) {
    endGame();
  }
}

function endGame() {
  if (gameOver) return;

  gameOver = true;
  danger = 100;

  if (barrierTimer) {
    clearInterval(barrierTimer);
  }

  closingSound.pause();
  closingSound.currentTime = 0;

  screamSound.currentTime = 0;
  screamSound.play();

  bigMessage.classList.remove("hidden");
  bigTitle.textContent = "GAME OVER";
  bigText.textContent = "Tu n’as pas assez amélioré ta protection.";

  message.textContent = "GAME OVER — les monstres l’ont atteinte.";

  protectBtn.disabled = true;
  powerBtn.disabled = true;
  rageBtn.disabled = true;
  barrierBtn.disabled = true;
  slowBtn.disabled = true;
}

function updateLevel() {
  const levels = [
    { score: 180, level: 2, speed: 5.5 },
    { score: 420, level: 3, speed: 6.8 },
    { score: 800, level: 4, speed: 8 },
    { score: 1300, level: 5, speed: 9.5 },
    { score: 1900, level: 6, speed: 11 },
    { score: 2600, level: 7, speed: 12.5 },
    { score: 3400, level: 8, speed: 14 },
    { score: 4300, level: 9, speed: 15.5 },
    { score: 5300, level: 10, speed: 17 },
    { score: 6500, level: 11, speed: 18.5 },
    { score: 7800, level: 12, speed: 20 },
    { score: 9200, level: 13, speed: 22 },
    { score: 10800, level: 14, speed: 24 },
    { score: 12600, level: 15, speed: 27 }
  ];

  levels.forEach(function(lv) {
    if (score >= lv.score && level < lv.level) {
      level = lv.level;
      dangerSpeed = lv.speed;
      message.textContent = "Niveau " + level + " — la menace augmente.";
    }
  });
}

function applyLevelEffects() {
  if (level >= 5 && !effectsDone.level5) {
    effectsDone.level5 = true;
    danger += 25;
    message.textContent = "NIVEAU 5 — l’air devient toxique. Améliore vite.";
    scene.classList.add("attack-wave");
    setTimeout(() => scene.classList.remove("attack-wave"), 2000);
  }

  if (level >= 10 && !effectsDone.level10) {
    effectsDone.level10 = true;
    clickProtectionMultiplier = 0.6;
    danger += 40;
    message.textContent = "NIVEAU 10 — tes clics protègent moins. Achète des options.";
    scene.classList.add("attack-wave");
    setTimeout(() => scene.classList.remove("attack-wave"), 3000);
  }

  if (level >= 15 && !effectsDone.level15) {
    effectsDone.level15 = true;
    clickProtectionMultiplier = 0.4;
    danger += 55;
    message.textContent = "NIVEAU 15 — cauchemar final. Sans améliorations, c’est fini.";
    scene.classList.add("attack-wave");
    setTimeout(() => scene.classList.remove("attack-wave"), 5000);
  }
}

function checkAttackWave() {
  if (attackWaveActive || gameOver) return;

  const attacks = [
    { level: 2, score: 220, damage: 45, duration: 1800, title: "ATTAQUE SOUDAINE" },
    { level: 3, score: 500, damage: 65, duration: 2200, title: "ILS FONCENT" },
    { level: 4, score: 900, damage: 85, duration: 2600, title: "PRESSION NOIRE" },
    { level: 5, score: 1400, damage: 105, duration: 3200, title: "VAGUE TOXIQUE" },
    { level: 6, score: 2000, damage: 125, duration: 3600, title: "ASSAUT BRUTAL" },
    { level: 7, score: 2700, damage: 145, duration: 4000, title: "OMBRE RAPIDE" },
    { level: 8, score: 3500, damage: 165, duration: 4400, title: "CHASSE NOCTURNE" },
    { level: 9, score: 4400, damage: 185, duration: 4800, title: "MURMURES VIOLENTS" },
    { level: 10, score: 5400, damage: 210, duration: 5500, title: "BRISURE DE PROTECTION" },
    { level: 11, score: 6600, damage: 230, duration: 5800, title: "ASSAUT SANS FIN" },
    { level: 12, score: 7900, damage: 250, duration: 6200, title: "NUIT ROUGE" },
    { level: 13, score: 9300, damage: 275, duration: 6800, title: "HURLEMENTS" },
    { level: 14, score: 10900, damage: 300, duration: 7400, title: "DERNIER CERCLE" },
    { level: 15, score: 12700, damage: 360, duration: 9000, title: "ATTAQUE FINALE" }
  ];

  attacks.forEach(function(attack) {
    const key = "level" + attack.level;

    if (level === attack.level && !wavesDone[key] && score >= attack.score) {
      wavesDone[key] = true;
      startAttackWave(attack.damage, attack.title, attack.duration);
    }
  });
}

function startAttackWave(damage, title, duration) {
  attackWaveActive = true;

  message.textContent = title + " — améliore ou clique très vite !";
  scene.classList.add("attack-wave");

  closingSound.playbackRate = 1.8;
  closingSound.volume = 0.95;

  setTimeout(function() {
    let protection = 0;

    if (barrierActive) protection += 30;
    if (slowActive) protection += 25;
    if (clickPower >= 6) protection += 20;
    if (clickPower >= 10) protection += 25;
    if (clickPower >= 14) protection += 30;
    if (clickPower >= 20) protection += 40;

    let finalDamage = damage - protection;

    if (finalDamage < 30) finalDamage = 30;

    danger += finalDamage;

    if (danger > 100) danger = 100;

    message.textContent = "Impact : +" + Math.floor(finalDamage) + "% de danger.";

    scene.classList.remove("attack-wave");
    attackWaveActive = false;

    update();

    if (danger >= 100) {
      endGame();
    }
  }, duration);
}

function moveMonsters() {
  monsters.forEach(function(monster, index) {
    let approach = danger * (2.2 + level / 10);
    let shakeX = Math.sin(Date.now() / 90 + index * 4) * (10 + danger / 4 + level);
    let shakeY = Math.cos(Date.now() / 120 + index * 3) * (10 + danger / 4 + level);
    let rotate = Math.sin(Date.now() / 140 + index) * (8 + danger / 12);
    let scale = 1 + danger / 130 + level / 80;

    let x = 0;
    let y = 0;

    if (index === 0) { x = approach + shakeX; y = approach + shakeY; }
    if (index === 1) { x = -approach + shakeX; y = approach + shakeY; }
    if (index === 2) { x = approach + shakeX; y = -approach + shakeY; }
    if (index === 3) { x = -approach + shakeX; y = -approach + shakeY; }
    if (index === 4) { x = approach + shakeX; y = shakeY; }
    if (index === 5) { x = -approach + shakeX; y = shakeY; }

    if (attackWaveActive) {
      x *= 1.6;
      y *= 1.6;
      scale += 0.35;
    }

    monster.style.transform = `
      translate(${x}px, ${y}px)
      rotate(${rotate}deg)
      scale(${scale})
    `;

    monster.style.opacity = Math.min(1, 0.35 + danger / 100);
  });
}

setInterval(function() {
  if (!gameStarted || gameOver) return;

  let secondsWithoutClick = (Date.now() - lastClickTime) / 1000;
  let stressBonus = 0;

  if (secondsWithoutClick > 0.7) stressBonus = 5;
  if (secondsWithoutClick > 1.5) stressBonus = 10;
  if (secondsWithoutClick > 2.5) stressBonus = 18;

  danger += dangerSpeed + stressBonus;

  if (barrierActive) danger -= 2.2;
  if (slowActive) danger -= 1.5;

  if (attackWaveActive) {
    danger += 8 + level;
  }

  if (danger < 0) danger = 0;
  if (danger > 100) danger = 100;

  update();
}, 500);

powerBtn.addEventListener("click", function() {
  if (!gameStarted || gameOver) return;

  if (score >= powerPrice) {
    score -= powerPrice;
    clickPower += 4;
    powerPrice += 220;
    message.textContent = "Clic violent amélioré.";
    update();
  } else {
    message.textContent = "Pas assez de score.";
  }
});

rageBtn.addEventListener("click", function() {
  if (!gameStarted || gameOver) return;

  if (score >= ragePrice) {
    score -= ragePrice;
    danger -= 60;
    ragePrice += 260;

    if (danger < 0) danger = 0;

    smallPulse();
    message.textContent = "Explosion rouge : ils reculent.";
    update();
  } else {
    message.textContent = "Pas assez de score.";
  }
});

barrierBtn.addEventListener("click", function() {
  if (!gameStarted || gameOver) return;

  if (barrierActive) {
    message.textContent = "Le cercle est déjà actif : " + barrierTimeLeft + "s restantes.";
    return;
  }

  if (score >= barrierPrice) {
    score -= barrierPrice;

    barrierActive = true;
    barrierTimeLeft = barrierDuration;
    barrier.classList.remove("hidden");

    message.textContent = "Cercle de sang activé pour 30 secondes.";

    barrierBtn.disabled = true;

    barrierTimer = setInterval(function() {
      barrierTimeLeft--;

      barrierBtn.innerHTML = "Cercle actif <span>" + barrierTimeLeft + "s</span>";

      if (barrierTimeLeft <= 0) {
        clearInterval(barrierTimer);
        barrierTimer = null;

        barrierActive = false;
        barrier.classList.add("hidden");

        barrierPrice += 250;

        barrierBtn.disabled = false;
        barrierBtn.innerHTML = 'Cercle de sang <span id="barrierPrice">' + barrierPrice + '</span>';

        message.textContent = "Le cercle de sang a disparu.";
      }
    }, 1000);

    update();
  } else {
    message.textContent = "Pas assez de score.";
  }
});

slowBtn.addEventListener("click", function() {
  if (!gameStarted || gameOver) return;

  if (score >= slowPrice && !slowActive) {
    score -= slowPrice;
    slowActive = true;
    dangerSpeed -= 1.4;
    message.textContent = "L’ombre ralentit.";
    update();
  } else if (slowActive) {
    message.textContent = "L’ombre est déjà ralentie.";
  } else {
    message.textContent = "Pas assez de score.";
  }
});

update();