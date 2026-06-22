// --- VARIABLES GLOBALES ET CONFIGURATION ---
let score = 0;
let danger = 0;
let level = 1;

const baseClickPower = 6;      
let clickPower = baseClickPower;

const baseDangerSpeed = 2.5;    
let dangerSpeed = baseDangerSpeed;

let powerPrice = 100;
let ragePrice = 250;
let barrierPrice = 500;
let slowPrice = 1200; 

let barrierActive = false;
let slowActive = false;
let gameOver = false;
let gameStarted = false;

let barrierTimer = null;
let barrierDuration = 20; 
let barrierTimeLeft = 0;

// Variables pour le système de Surchauffe
let clickTimes = [];
let isOverheated = false;
let overheatTimeout = null;

// Système de sauvegarde locale (Prestige)
let totalFragments = parseInt(localStorage.getItem("totalFragments")) || 0;
let permanentPowerBonus = parseInt(localStorage.getItem("permanentPowerBonus")) || 0;
let permanentDefenseBonus = parseInt(localStorage.getItem("permanentDefenseBonus")) || 0;

// --- SÉLECTEURS DU DOM ---
const scoreText = document.getElementById("score");
const dangerText = document.getElementById("danger");
const levelText = document.getElementById("level");
const dangerFill = document.getElementById("dangerFill");
const scene = document.getElementById("scene");
const message = document.getElementById("message");
const barrier = document.getElementById("barrier");
const flashlight = document.getElementById("flashlight");
const bloodScreen = document.getElementById("bloodScreen");
const overheatAlert = document.getElementById("overheatAlert");

// Éléments des bonus en haut de l'écran
const bonusPowerVal = document.getElementById("bonusPowerVal");
const bonusDefenseVal = document.getElementById("bonusDefenseVal");

// Écrans d'accueil
const startScreen = document.getElementById("startScreen");
const storyBox = document.getElementById("storyBox");
const readyBox = document.getElementById("readyBox");
const nextBtn = document.getElementById("nextBtn");
const startBtn = document.getElementById("startBtn");
const countdownText = document.getElementById("countdown");

// Game Over & Prestige
const bigMessage = document.getElementById("bigMessage");
const restartBtn = document.getElementById("restartBtn");
const fragmentsGainedText = document.getElementById("fragmentsGained");
const totalFragmentsText = document.getElementById("totalFragments");
const upPermanentPowerBtn = document.getElementById("upPermanentPower");
const upPermanentDefenseBtn = document.getElementById("upPermanentDefense");

// Boutique Standard
const powerBtn = document.getElementById("powerBtn");
const rageBtn = document.getElementById("rageBtn");
const barrierBtn = document.getElementById("barrierBtn");
const slowBtn = document.getElementById("slowBtn");

// Sons
const readySound = document.getElementById("readySound");
const closingSound = document.getElementById("closingSound");
const screamSound = document.getElementById("screamSound");
const clickSound = document.getElementById("clickSound");

const monsterTracks = {
  mt1: document.querySelector(".mt1"),
  mt2: document.querySelector(".mt2"),
  mt3: document.querySelector(".mt3"),
  mt4: document.querySelector(".mt4"),
  mt5: document.querySelector(".mt5"),
  mt6: document.querySelector(".mt6")
};

function initShopPrices() {
  if (powerBtn) powerBtn.querySelector("span").textContent = powerPrice;
  if (rageBtn) rageBtn.querySelector("span").textContent = ragePrice;
  if (barrierBtn) barrierBtn.querySelector("span").textContent = barrierPrice;
  if (slowBtn) slowBtn.querySelector("span").textContent = slowPrice;
}

// Fonction pour mettre à jour l'affichage des bonus permanents en haut
function updatePermanentBonusDisplay() {
  if (bonusPowerVal) bonusPowerVal.textContent = permanentPowerBonus;
  if (bonusDefenseVal) bonusDefenseVal.textContent = permanentDefenseBonus * 5;
}

// --- NOUVEAUX SÉLECTEURS POUR LA TRANSITION ---
const prestigeGuideBox = document.getElementById("prestigeGuideBox");
const goToReadyBtn = document.getElementById("goToReadyBtn");

if (nextBtn) {
  nextBtn.addEventListener("click", function(e) {
    if (e) e.preventDefault();
    if (clickSound) { try { clickSound.currentTime = 0; clickSound.play().catch(() => {}); } catch(err){} }
    
    // On cache l'histoire, on montre le guide des bonus
    if (storyBox) storyBox.classList.add("hidden");
    if (prestigeGuideBox) prestigeGuideBox.classList.remove("hidden");
  });
}

if (goToReadyBtn) {
  goToReadyBtn.addEventListener("click", function(e) {
    if (e) e.preventDefault();
    if (clickSound) { try { clickSound.currentTime = 0; clickSound.play().catch(() => {}); } catch(err){} }
    
    // On cache le guide, on montre le compte à rebours
    if (prestigeGuideBox) prestigeGuideBox.classList.add("hidden");
    if (readyBox) readyBox.classList.remove("hidden");
    if (readySound) { try { readySound.play().catch(() => {}); } catch(err){} }
    start_countdownText()
  });
}

function start_countdownText(){
    if (clickSound) { try { clickSound.currentTime = 0; clickSound.play().catch(() => {}); } catch(err){} }
    startBtn.classList.add("hidden");
    
    let count = 3;
    if (countdownText) countdownText.textContent = count;
    
    let interval = setInterval(function() {
      count--;
      if (count > 0) {
        if (countdownText) countdownText.textContent = count;
      } else if (count === 0) {
        if (countdownText) countdownText.textContent = "PROTÈGE-LA !";
      } else {
        clearInterval(interval);
        if (startScreen) startScreen.classList.add("hidden");
        initGame();
      }
    }, 1000);
  
}

// --- BOUCLE PRINCIPALE DE JEU ---
function initGame() {
  gameStarted = true;
  gameOver = false;
  danger = 0;
  score = 0;
  level = 1;
  clickTimes = [];
  isOverheated = false;
  if (overheatAlert) overheatAlert.classList.add("hidden");
  if (flashlight) flashlight.classList.remove("lamp-overheat-flicker");
  
  powerPrice = 100;
  ragePrice = 250;
  barrierPrice = 500;
  slowPrice = 1200;
  initShopPrices();
  updatePermanentBonusDisplay();
  
  barrierActive = false;
  slowActive = false;
  if (barrier) barrier.classList.add("hidden");
  
  clickPower = baseClickPower + permanentPowerBonus;
  dangerSpeed = baseDangerSpeed; 

  if (closingSound) {
    try { closingSound.currentTime = 0; closingSound.play().catch(() => {}); } catch(err){}
  }
  
  let gameLoop = setInterval(function() {
    if (gameOver || !gameStarted) {
      clearInterval(gameLoop);
      return;
    }
    
    let defenseFactor = 1 - (permanentDefenseBonus * 0.05);
    if (defenseFactor < 0.2) defenseFactor = 0.2; 
    
    let currentSpeed = barrierActive ? (dangerSpeed * 0.1) : dangerSpeed;
    
    // Si la lampe surchauffe, le danger augmente deux fois plus vite pendant le bug !
    if (isOverheated) {
      currentSpeed *= 2;
    }
    
    danger += (currentSpeed * defenseFactor);
    
    if (danger >= 100) {
      danger = 100;
      triggerGameOver();
    }
    
    updateUI();
  }, 100);
}

// --- CLIC SUR LA SCÈNE ET VÉRIFICATION DE LA SURCHAUFFE ---
if (scene) {
  scene.addEventListener("mousemove", function(e) {
    if (!gameStarted || gameOver || !flashlight) return;
    const rect = scene.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    flashlight.style.left = x + "px";
    flashlight.style.top = y + "px";
  });
  
  scene.addEventListener("click", function(e) {
    if (!gameStarted || gameOver) return;
    if (e) e.preventDefault(); 

    // --- LOGIQUE DE DÉTECTION DE SURCHAUFFE ---
    const now = Date.now();
    clickTimes.push(now);
    // On ne garde que les clics des 1.5 dernières secondes
    clickTimes = clickTimes.filter(time => now - time < 1500);

    // Si le joueur clique plus de 13 fois en 1.5s (vitesse de clic anormale / spam extrême)
    if (clickTimes.length > 13 && !isOverheated) {
      isOverheated = true;
      if (overheatAlert) overheatAlert.classList.remove("hidden");
      if (flashlight) flashlight.classList.add("lamp-overheat-flicker");

      // Le système se réinitialise après 3.5 secondes de dysfonctionnement
      overheatTimeout = setTimeout(() => {
        isOverheated = false;
        if (overheatAlert) overheatAlert.classList.add("hidden");
        if (flashlight) flashlight.classList.remove("lamp-overheat-flicker");
        clickTimes = [];
      }, 3500);
    }
    
    if (clickSound) {
      try { clickSound.currentTime = 0; clickSound.play().catch(() => {}); } catch(err){}
    }
    
    // Si la lampe est en surchauffe, le clic perd toute son efficacité (force = 1) !
    let currentClickPower = isOverheated ? 1 : clickPower;
    
    danger -= currentClickPower;
    if (danger < 0) danger = 0;
    
    score += 10;
    
    if (message) {
      if (isOverheated) {
        message.innerHTML = `<span style="color: #ff3b30;">PRODUIT DÉFECTUEUX - PUISSANCE MINIMALE (1)</span>`;
      } else {
        message.textContent = `+10 Points ! Force de repoussement : ${currentClickPower}`;
      }
    }
    updateUI();
  });
}

// --- MISE À JOUR DES MONSTRES ET DES NIVEAUX ---
function updateUI() {
  if (scoreText) scoreText.textContent = Math.floor(score);
  if (dangerText) dangerText.textContent = Math.floor(danger) + "%";
  if (levelText) levelText.textContent = level;
  if (dangerFill) dangerFill.style.width = danger + "%";
  
  if (bloodScreen) {
    if (danger >= 75 && gameStarted && !gameOver) {
      bloodScreen.classList.add("critical-flicker");
    } else {
      bloodScreen.classList.remove("critical-flicker");
      bloodScreen.style.opacity = danger / 100;
    }
  }

  let pct = danger / 100; 
  let distance = pct * 40; 

  if (monsterTracks.mt1) { monsterTracks.mt1.style.top = distance + "%"; monsterTracks.mt1.style.left = distance + "%"; monsterTracks.mt1.style.opacity = pct > 0.05 ? 1 : pct * 20; }
  if (monsterTracks.mt2) { monsterTracks.mt2.style.top = distance + "%"; monsterTracks.mt2.style.right = distance + "%"; monsterTracks.mt2.style.opacity = pct > 0.05 ? 1 : pct * 20; }
  if (monsterTracks.mt3) { monsterTracks.mt3.style.bottom = distance + "%"; monsterTracks.mt3.style.left = distance + "%"; monsterTracks.mt3.style.opacity = pct > 0.05 ? 1 : pct * 20; }
  if (monsterTracks.mt4) { monsterTracks.mt4.style.bottom = distance + "%"; monsterTracks.mt4.style.right = distance + "%"; monsterTracks.mt4.style.opacity = pct > 0.05 ? 1 : pct * 20; }
  if (monsterTracks.mt5) { monsterTracks.mt5.style.top = "42%"; monsterTracks.mt5.style.left = distance + "%"; monsterTracks.mt5.style.opacity = pct > 0.05 ? 1 : pct * 20; }
  if (monsterTracks.mt6) { monsterTracks.mt6.style.top = "42%"; monsterTracks.mt6.style.right = distance + "%"; monsterTracks.mt6.style.opacity = pct > 0.05 ? 1 : pct * 20; }
  
  let targetLevel = Math.floor(score / 250) + 1;
  if (targetLevel > level && level < 10) {
    level = targetLevel;
    dangerSpeed += 0.9; 
    
    let attackPower = 15 + (level * 6); 
    danger += attackPower;
    if (danger > 100) danger = 100;

    if (message) {
      message.innerHTML = `⚠️ <span style="color: #ff0000;">NIVEAU ${level} ! VAGUE D'OMBRE (+${attackPower}% Danger)</span>`;
    }
  }
  
  if (powerBtn) powerBtn.disabled = (score < powerPrice);
  if (rageBtn) rageBtn.disabled = (score < ragePrice);
  if (barrierBtn) barrierBtn.disabled = (score < barrierPrice || barrierActive);
  if (slowBtn) slowBtn.disabled = (score < slowPrice || slowActive);
}

// --- MAGASIN EN JEU ---
if (powerBtn) {
  powerBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    if (score >= powerPrice) {
      score -= powerPrice;
      clickPower += 5; 
      powerPrice = Math.floor(powerPrice * 1.6);
      powerBtn.querySelector("span").textContent = powerPrice;
      updateUI();
    }
  });
}

if (rageBtn) {
  rageBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    if (score >= ragePrice) {
      score -= ragePrice;
      danger -= 45; 
      if (danger < 0) danger = 0;
      ragePrice = Math.floor(ragePrice * 1.5);
      rageBtn.querySelector("span").textContent = ragePrice;
      updateUI();
    }
  });
}

if (barrierBtn) {
  barrierBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    if (score >= barrierPrice && !barrierActive) {
      score -= barrierPrice;
      barrierActive = true;
      barrierTimeLeft = barrierDuration;
      if (barrier) barrier.classList.remove("hidden");
      
      barrierTimer = setInterval(function() {
        barrierTimeLeft--;
        if (barrierBtn.querySelector("span")) barrierBtn.querySelector("span").textContent = barrierTimeLeft + "s";
        
        if (barrierTimeLeft <= 0) {
          clearInterval(barrierTimer);
          barrierActive = false;
          if (barrier) barrier.classList.add("hidden");
          barrierPrice = Math.floor(barrierPrice * 1.7);
          barrierBtn.innerHTML = `Lumière Sacrée <br><span>${barrierPrice}</span>`;
          updateUI();
        }
      }, 1000);
      updateUI();
    }
  });
}

if (slowBtn) {
  slowBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    if (score >= slowPrice && !slowActive) {
      score -= slowPrice;
      slowActive = true;
      dangerSpeed = Math.max(0.8, dangerSpeed - 1.5);
      slowBtn.querySelector("span").textContent = "ACTIF";
      updateUI();
    }
  });
}

// --- GAME OVER & SHOP PRESTIGE ---
function triggerGameOver() {
  gameOver = true;
  gameStarted = false;
  clearTimeout(overheatTimeout);
  
  if (bloodScreen) bloodScreen.classList.remove("critical-flicker");
  if (closingSound) { try { closingSound.pause(); } catch(err){} }
  if (screamSound) { try { screamSound.currentTime = 0; screamSound.play().catch(() => {}); } catch(err){} }
  
  let fragmentsGained = Math.floor(score / 100);
  totalFragments += fragmentsGained;
  localStorage.setItem("totalFragments", totalFragments);
  
  if (fragmentsGainedText) fragmentsGainedText.textContent = fragmentsGained;
  if (totalFragmentsText) totalFragmentsText.textContent = totalFragments;
  
  if (bigMessage) bigMessage.classList.remove("hidden");
  updatePrestigeShopButtons();
}

function updatePrestigeShopButtons() {
  if (upPermanentPowerBtn) {
    upPermanentPowerBtn.disabled = (totalFragments < 5);
    upPermanentPowerBtn.querySelector("span").textContent = `Coût: 5 ✨ (Bonus : +${permanentPowerBonus})`;
  }
  if (upPermanentDefenseBtn) {
    upPermanentDefenseBtn.disabled = (totalFragments < 10);
    upPermanentDefenseBtn.querySelector("span").textContent = `Coût: 10 ✨ (Bonus : -${permanentDefenseBonus * 5}%)`;
  }
}

if (upPermanentPowerBtn) {
  upPermanentPowerBtn.addEventListener("click", function(e) {
    if (e) e.stopPropagation();
    if (totalFragments >= 5) {
      totalFragments -= 5;
      permanentPowerBonus += 3; 
      localStorage.setItem("totalFragments", totalFragments);
      localStorage.setItem("permanentPowerBonus", permanentPowerBonus);
      if (totalFragmentsText) totalFragmentsText.textContent = totalFragments;
      updatePrestigeShopButtons();
      updatePermanentBonusDisplay();
    }
  });
}

if (upPermanentDefenseBtn) {
  upPermanentDefenseBtn.addEventListener("click", function(e) {
    if (e) e.stopPropagation();
    if (totalFragments >= 10) {
      totalFragments -= 10;
      permanentDefenseBonus += 1; 
      localStorage.setItem("totalFragments", totalFragments);
      localStorage.setItem("permanentDefenseBonus", permanentDefenseBonus);
      if (totalFragmentsText) totalFragmentsText.textContent = totalFragments;
      updatePrestigeShopButtons();
      updatePermanentBonusDisplay();
    }
  });
}

if (restartBtn) {
  restartBtn.addEventListener("click", function() {
    if (bigMessage) bigMessage.classList.add("hidden");
    initGame();
  });
}

// Chargement initial des interfaces au lancement de la page
initShopPrices();
updatePermanentBonusDisplay();