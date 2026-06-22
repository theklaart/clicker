// --- VARIABLES GLOBALES ET CONFIGURATION ---
let score = 0;
let danger = 0;
let level = 1;

let clickPower = 2;
let dangerSpeed = 4.5;

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

// Système de sauvegarde locale (Sauvegarde des fragments / Prestige)
let totalFragments = parseInt(localStorage.getItem("totalFragments")) || 0;
let permanentPowerBonus = parseInt(localStorage.getItem("permanentPowerBonus")) || 0;
let permanentDefenseBonus = parseInt(localStorage.getItem("permanentDefenseBonus")) || 0;

// Application immédiate des bonus permanents achetés au prestige
clickPower += permanentPowerBonus;

// --- SÉLECTEURS DU DOM ---
const scoreText = document.getElementById("score");
const dangerText = document.getElementById("danger");
const levelText = document.getElementById("level");
const dangerFill = document.getElementById("dangerFill");
const scene = document.getElementById("scene");
const message = document.getElementById("message");
const barrier = document.getElementById("barrier");
const flashlight = document.getElementById("flashlight");

// Écrans d'introduction & Boutons
const startScreen = document.getElementById("startScreen");
const storyBox = document.getElementById("storyBox");
const readyBox = document.getElementById("readyBox");
const nextBtn = document.getElementById("nextBtn");
const startBtn = document.getElementById("startBtn");
const countdownText = document.getElementById("countdown");

// Écran Game Over & Boutique Prestige
const bigMessage = document.getElementById("bigMessage");
const restartBtn = document.getElementById("restartBtn");
const fragmentsGainedText = document.getElementById("fragmentsGained");
const totalFragmentsText = document.getElementById("totalFragments");
const upPermanentPowerBtn = document.getElementById("upPermanentPower");
const upPermanentDefenseBtn = document.getElementById("upPermanentDefense");

// Boutique Standard (In-Game)
const powerBtn = document.getElementById("powerBtn");
const rageBtn = document.getElementById("rageBtn");
const barrierBtn = document.getElementById("barrierBtn");
const slowBtn = document.getElementById("slowBtn");

// Fichiers Audio
const readySound = document.getElementById("readySound");
const closingSound = document.getElementById("closingSound");
const screamSound = document.getElementById("screamSound");
const clickSound = document.getElementById("clickSound");

// --- INTERFACE DE DÉMARRAGE ET CINÉMATIQUE ---

// Étape 1 : Passage du pitch de l'histoire à l'avertissement
if (nextBtn) {
  nextBtn.addEventListener("click", function() {
    if (clickSound) { clickSound.currentTime = 0; clickSound.play().catch(() => {}); }
    storyBox.classList.add("hidden");
    readyBox.classList.remove("hidden");
    if (readySound) readySound.play().catch(() => {});
  });
}

// Étape 2 : Clic sur SURVIVRE -> Compte à rebours immersif
if (startBtn) {
  startBtn.addEventListener("click", function() {
    if (clickSound) { clickSound.currentTime = 0; clickSound.play().catch(() => {}); }
    startBtn.classList.add("hidden"); // Cache le bouton pour éviter le double-clic
    
    let count = 3;
    countdownText.textContent = count;
    
    let interval = setInterval(function() {
      count--;
      if (count > 0) {
        countdownText.textContent = count;
      } else if (count === 0) {
        countdownText.textContent = "PROTÈGE-LA !";
      } else {
        clearInterval(interval);
        startScreen.classList.add("hidden");
        initGame();
      }
    }, 1000);
  });
}

// --- BOUCLE PRINCIPALE DE JEU ---
function initGame() {
  gameStarted = true;
  gameOver = false;
  danger = 0;
  score = 0;
  level = 1;
  
  if (closingSound) {
    closingSound.currentTime = 0;
    closingSound.play().catch(() => {});
  }
  
  // Boucle de rafraîchissement du danger (Toutes les secondes)
  let gameLoop = setInterval(function() {
    if (gameOver || !gameStarted) {
      clearInterval(gameLoop);
      return;
    }
    
    // Calcul de la réduction de danger grâce à la recherche de défense de prestige (+5% par niveau)
    let defenseFactor = 1 - (permanentDefenseBonus * 0.05);
    if (defenseFactor < 0.2) defenseFactor = 0.2; // Limite de sécurité (cap à 80% max de réduction)
    
    // Si le bouclier (Lumière Sacrée) est actif, la montée du danger est divisée par 10
    let currentSpeed = barrierActive ? (dangerSpeed * 0.1) : dangerSpeed;
    
    danger += (currentSpeed * defenseFactor);
    score += level; // Le score augmente passivement selon le niveau actuel
    
    if (danger >= 100) {
      danger = 100;
      triggerGameOver();
    }
    
    updateUI();
  }, 1000);
}

// --- LOGIQUE DE LA LAMPE TORCHE ET CLICS SUR LA SCÈNE ---
if (scene && flashlight) {
  // Suivi ultra-fluide du curseur (optimisé via la suppression des transitions globales en CSS)
  scene.addEventListener("mousemove", function(e) {
    if (!gameStarted || gameOver) return;
    const rect = scene.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    flashlight.style.left = x + "px";
    flashlight.style.top = y + "px";
  });
  
  // Clic sur la scène pour faire reculer la jauge de danger
  scene.addEventListener("click", function() {
    if (!gameStarted || gameOver) return;
    if (clickSound) {
      clickSound.currentTime = 0;
      clickSound.play().catch(() => {});
    }
    
    danger -= clickPower;
    if (danger < 0) danger = 0;
    updateUI();
  });
}

// --- REFRESH DE L'INTERFACE DYNAMIQUE ---
function updateUI() {
  if (scoreText) scoreText.textContent = Math.floor(score);
  if (dangerText) dangerText.textContent = Math.floor(danger) + "%";
  if (levelText) levelText.textContent = level;
  if (dangerFill) dangerFill.style.width = danger + "%";
  
  // Changement de niveau automatique tous les 150 points de score (Max niveau 10)
  let targetLevel = Math.floor(score / 150) + 1;
  if (targetLevel > level && level < 10) {
    level = targetLevel;
    dangerSpeed += 1.5; // Accélération de la difficulté
    if (message) message.textContent = "NIVEAU " + level + " : L'obscurité s'épaissit !";
  }
  
  // Gestion d'activation/désactivation visuelle (Néons cassés ou allumés) des boutons du shop standard
  if (powerBtn) powerBtn.disabled = (score < powerPrice);
  if (rageBtn) rageBtn.disabled = (score < ragePrice);
  if (barrierBtn) barrierBtn.disabled = (score < barrierPrice || barrierActive);
  if (slowBtn) slowBtn.disabled = (score < slowPrice || slowActive);
}

// --- MAGASIN STANDARD (EN JEU) ---

// 1. Projecteur Halogène (Amélioration du clic de base)
if (powerBtn) {
  powerBtn.addEventListener("click", function(e) {
    e.stopPropagation(); // Évite que le clic déclenche aussi l'attaque sur la scène
    if (score >= powerPrice) {
      score -= powerPrice;
      clickPower += 3;
      powerPrice = Math.floor(powerPrice * 1.5);
      
      const priceSpan = powerBtn.querySelector("span");
      if (priceSpan) priceSpan.textContent = powerPrice;
      
      if (message) message.textContent = "Projecteur amélioré ! Puissance de frappe : " + clickPower;
      updateUI();
    }
  });
}

// 2. Flash Magnésium (Réduction instantanée massive du danger)
if (rageBtn) {
  rageBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    if (score >= ragePrice) {
      score -= ragePrice;
      danger -= 35;
      if (danger < 0) danger = 0;
      ragePrice = Math.floor(ragePrice * 1.4);
      
      const priceSpan = rageBtn.querySelector("span");
      if (priceSpan) priceSpan.textContent = ragePrice;
      
      if (message) message.textContent = "Flash aveuglant activé ! Le danger recule.";
      updateUI();
    }
  });
}

// 3. Lumière Sacrée (Bouclier temporaire de protection)
if (barrierBtn) {
  barrierBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    if (score >= barrierPrice && !barrierActive) {
      score -= barrierPrice;
      barrierActive = true;
      barrierTimeLeft = barrierDuration;
      if (barrier) barrier.classList.remove("hidden");
      if (message) message.textContent = "Lumière Sacrée activée (Protection 30s) !";
      
      barrierTimer = setInterval(function() {
        barrierTimeLeft--;
        const priceSpan = barrierBtn.querySelector("span");
        if (priceSpan) priceSpan.textContent = barrierTimeLeft + "s";
        
        if (barrierTimeLeft <= 0) {
          clearInterval(barrierTimer);
          barrierActive = false;
          if (barrier) barrier.classList.add("hidden");
          barrierPrice = Math.floor(barrierPrice * 1.6);
          
          // Réinitialise le texte propre du bouton avec le nouveau coût calculé
          barrierBtn.innerHTML = `Lumière Sacrée <br><span>${barrierPrice}</span>`;
          if (message) message.textContent = "Le bouclier s'est dissipé...";
          updateUI();
        }
      }, 1000);
      updateUI();
    }
  });
}

// 4. Figer le temps (Ralentissement permanent du palier de vitesse actuel)
if (slowBtn) {
  slowBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    if (score >= slowPrice && !slowActive) {
      score -= slowPrice;
      slowActive = true;
      dangerSpeed = Math.max(1.5, dangerSpeed - 2.0); // Réduit la vitesse sans la faire tomber à 0 ou en négatif
      
      const priceSpan = slowBtn.querySelector("span");
      if (priceSpan) priceSpan.textContent = "ACTIF";
      
      if (message) message.textContent = "Le temps est figé. Les monstres se déplacent au ralenti.";
      updateUI();
    }
  });
}

// --- SYSTÈME DE MORT ET DE PRESTIGE (FIN DE PARTIE) ---
function triggerGameOver() {
  gameOver = true;
  gameStarted = false;
  
  if (closingSound) closingSound.pause();
  if (screamSound) { screamSound.currentTime = 0; screamSound.play().catch(() => {}); }
  
  // Calcul et ajout des fragments de lumière (Prestige) obtenus durant la partie (1 fragment par tranche de 100 points)
  let fragmentsGained = Math.floor(score / 100);
  totalFragments += fragmentsGained;
  localStorage.setItem("totalFragments", totalFragments);
  
  // Mise à jour des valeurs textuelles sur le panneau de Game Over
  if (fragmentsGainedText) fragmentsGainedText.textContent = fragmentsGained;
  if (totalFragmentsText) totalFragmentsText.textContent = totalFragments;
  
  if (bigMessage) bigMessage.classList.remove("hidden");
  updatePrestigeShopButtons();
}

// Rafraîchit l'état des boutons de la boutique de Prestige
function updatePrestigeShopButtons() {
  if (upPermanentPowerBtn) {
    upPermanentPowerBtn.disabled = (totalFragments < 5);
    const textSpan = upPermanentPowerBtn.querySelector("span");
    if (textSpan) textSpan.textContent = `Coût: 5 ✨ (Bonus : +${permanentPowerBonus})`;
  }
  if (upPermanentDefenseBtn) {
    upPermanentDefenseBtn.disabled = (totalFragments < 10);
    const textSpan = upPermanentDefenseBtn.querySelector("span");
    if (textSpan) textSpan.textContent = `Coût: 10 ✨ (Bonus : -${permanentDefenseBonus * 5}%)`;
  }
}

// Achat d'un point d'attaque permanent (Coût: 5 fragments)
if (upPermanentPowerBtn) {
  upPermanentPowerBtn.addEventListener("click", function() {
    if (totalFragments >= 5) {
      totalFragments -= 5;
      permanentPowerBonus += 1;
      localStorage.setItem("totalFragments", totalFragments);
      localStorage.setItem("permanentPowerBonus", permanentPowerBonus);
      if (totalFragmentsText) totalFragmentsText.textContent = totalFragments;
      updatePrestigeShopButtons();
    }
  });
}

// Achat d'une réduction permanente de danger (Coût: 10 fragments)
if (upPermanentDefenseBtn) {
  upPermanentDefenseBtn.addEventListener("click", function() {
    if (totalFragments >= 10) {
      totalFragments -= 10;
      permanentDefenseBonus += 1;
      localStorage.setItem("totalFragments", totalFragments);
      localStorage.setItem("permanentDefenseBonus", permanentDefenseBonus);
      if (totalFragmentsText) totalFragmentsText.textContent = totalFragments;
      updatePrestigeShopButtons();
    }
  });
}

// Gestion du bouton Recommencer pour relancer une partie propre
if (restartBtn) {
  restartBtn.addEventListener("click", function() {
    location.reload();
  });
}