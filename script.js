
// ==========================================
// MEMORY MAYHEM - THE ROYAL DEBT
// STAGE 1: ROYAL BATTLE IMPROVEMENTS
// ==========================================

// *** EXISTING HTML ELEMENTS

const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const endScreen = document.getElementById("endScreen");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const cardBoard = document.getElementById("cardBoard");
const turnDisplay = document.getElementById("turnDisplay");
const message = document.getElementById("message");

const playerScoreDisplay = document.getElementById("playerScore");
const kingScoreDisplay = document.getElementById("kingScore");

const kingPanel = document.querySelector(".king-fighter");
const playerPanel = document.querySelector(".player");

const kingStatus = document.getElementById("kingStatus");
const playerStatus = document.getElementById("playerStatus");

const resultTitle = document.getElementById("resultTitle");
const resultMessage = document.getElementById("resultMessage");
const resultIcon = document.getElementById("resultIcon");

// *** EXISTING CARD SYMBOLS

const cardSymbols = [
    "👑", "🧪", "⚔️", "💎",
    "🐉", "🍄", "📖", "🗝️"
];

// *** KING PERSONALITY

const kingDialogue = {
    thinking: [
        "The King is plotting something... 🤴",
        "Hmm... where did I put my glasses?",
        "A royal genius is at work!",
        "The King is consulting his crown...",
        "I demand a royal moment to think!"
    ],

    mistake: [
        "Impossible! These cards are clearly defective!",
        "I meant to do that!",
        "Someone has moved my cards!",
        "My royal memory is having a tiny problem...",
        "This is absolutely your fault!"
    ],

    match: [
        "HA! The King never forgets!",
        "A royal victory!",
        "Bow before my magnificent memory!",
        "Excellent! Another pair for my treasury!",
        "I am simply too clever!"
    ],

    angry: [
        "STOP STEALING MY PAIRS!",
        "This is outrageous!",
        "My royal patience is running out!",
        "I shall remember this betrayal!",
        "Guards! This is getting suspicious!"
    ],

    happy: [
        "A magnificent match!",
        "The royal treasury grows!",
        "Perhaps I should become a professional card player!",
        "Gold! Wonderful, wonderful gold!"
    ]
};

// *** GAME STATE

let gameState = {};

// ==========================================
// GAME INITIALIZATION
// ==========================================

function resetGameState() {
    gameState = {
        currentTurn: "player",

        playerScore: 0,
        kingScore: 0,

        cards: [],
        selectedCards: [],

        matchedPairs: 0,
        totalPairs: 8,

        gameActive: true,
        isBusy: false,

        // *** KING MEMORY NOW STORES ACTUAL SYMBOLS
        kingMemory: {},

        // *** KING PROGRESSION
        kingTurnCount: 0,
        kingMistakes: 0,

        // *** PLAYER PROGRESSION
        playerStreak: 0,
        bestStreak: 0,
        bonusGold: 0,

        // *** ABILITY SYSTEM
        abilitiesUsed: {
            hint: false,
            swap: false,
            shuffle: false,
            chaos: false,
            shield: false
        },

        kingMustSkip: false,
        shieldActive: false,

        // *** PROTECTS AGAINST OLD TIMERS
        roundNumber: 0
    };
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

// ==========================================
// *** SOUND EFFECT SYSTEM
// No external audio files required.
// ==========================================

let audioContext = null;

function playSound(type) {
    try {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        if (!audioContext) {
            audioContext = new AudioContextClass();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const sounds = {
            flip: [440, 0.07],
            match: [740, 0.22],
            miss: [180, 0.18],
            ability: [620, 0.25],
            gold: [950, 0.18],
            king: [280, 0.3],
            victory: [880, 0.4],
            defeat: [130, 0.4]
        };

        const settings = sounds[type];

        if (!settings) return;

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = type === "miss" || type === "defeat"
            ? "triangle"
            : "sine";

        oscillator.frequency.setValueAtTime(
            settings[0],
            audioContext.currentTime
        );

        if (type === "match" || type === "victory") {
            oscillator.frequency.exponentialRampToValueAtTime(
                settings[0] * 1.4,
                audioContext.currentTime + settings[1]
            );
        }

        gain.gain.setValueAtTime(
            0.0001,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.12,
            audioContext.currentTime + 0.02
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            audioContext.currentTime + settings[1]
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + settings[1]);

    } catch (error) {
        console.warn("Sound could not play:", error);
    }
}

// ==========================================
// *** BATTLE STATISTICS HUD
// Created dynamically to preserve HTML IDs.
// ==========================================

function createBattleStats() {
    let extras = document.getElementById("battleExtras");

    if (extras) {
        extras.remove();
    }

    extras = document.createElement("div");

    extras.id = "battleExtras";
    extras.className = "battle-extras";

    extras.innerHTML = `
        <div class="battle-stat">
            🔥 Streak: <span id="streakValue">0</span>
        </div>

        <div class="battle-stat">
            🏆 Best: <span id="bestStreakValue">0</span>
        </div>

        <div class="battle-stat">
            💰 Bonus Gold: <span id="goldValue">0</span>
        </div>
    `;

    const statusPanel = document.querySelector(".game-status");

    statusPanel.insertAdjacentElement("afterend", extras);

    updateBattleStats();
}

function updateBattleStats() {
    const streak = document.getElementById("streakValue");
    const best = document.getElementById("bestStreakValue");
    const gold = document.getElementById("goldValue");

    if (!streak || !best || !gold) return;

    streak.textContent = gameState.playerStreak;
    best.textContent = gameState.bestStreak;
    gold.textContent = gameState.bonusGold;
}

// ==========================================
// *** FLOATING BATTLE FEEDBACK
// ==========================================

function showFloatingText(text) {
    const floating = document.createElement("div");

    floating.className = "battle-float";
    floating.textContent = text;

    document.body.appendChild(floating);

    setTimeout(() => {
        floating.remove();
    }, 1300);
}

// ==========================================
// START GAME
// ==========================================

function startGame() {
    resetGameState();

    playerScoreDisplay.textContent = "0";
    kingScoreDisplay.textContent = "0";

    startScreen.classList.add("hidden");
    endScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");

    createBattleStats();
    createCards();

    updateTurnDisplay();
    updateAbilityButtons();

    kingStatus.textContent = "Waiting...";
    playerStatus.textContent = "Ready!";

    message.textContent =
        "Find your first matching pair!";

    console.log("Memory Mayhem started!");
}

// ==========================================
// CARD CREATION
// ==========================================

function createCards() {
    const cardValues = [...cardSymbols, ...cardSymbols];

    shuffleArray(cardValues);

    gameState.cards = cardValues.map((symbol, index) => ({
        id: index,
        symbol: symbol,
        revealed: false,
        matched: false
    }));

    cardBoard.innerHTML = "";

    gameState.cards.forEach(card => {
        const button = document.createElement("button");

        button.className = "memory-card";
        button.type = "button";

        button.dataset.cardId = card.id;

        button.setAttribute(
            "aria-label",
            "Face-down memory card"
        );

        button.innerHTML = `
            <span class="card-inner">
                <span class="card-face card-back">?</span>
                <span class="card-face card-front">${card.symbol}</span>
            </span>
        `;

        button.addEventListener("click", () => {
            handlePlayerCardClick(card.id);
        });

        cardBoard.appendChild(button);
    });
}

// ==========================================
// CARD UTILITIES
// ==========================================

function getCardButton(cardId) {
    return cardBoard.querySelector(
        `[data-card-id="${cardId}"]`
    );
}

function revealCard(cardId) {
    const card = gameState.cards[cardId];

    if (!card || card.matched || card.revealed) return;

    card.revealed = true;

    const button = getCardButton(cardId);

    button.classList.add("revealed");

    button.setAttribute(
        "aria-label",
        `Revealed ${card.symbol}`
    );

    playSound("flip");
}

function hideCard(cardId) {
    const card = gameState.cards[cardId];

    if (!card || card.matched) return;

    card.revealed = false;

    const button = getCardButton(cardId);

    if (!button) return;

    button.classList.remove("revealed");

    button.setAttribute(
        "aria-label",
        "Face-down memory card"
    );
}

function animateCard(cardId, effect) {
    const button = getCardButton(cardId);

    if (!button) return;

    button.classList.remove(
        "match-effect",
        "miss-effect",
        "hint-effect",
        "ability-effect"
    );

    void button.offsetWidth;

    button.classList.add(effect);

    setTimeout(() => {
        button.classList.remove(effect);
    }, 650);
}

function markMatched(cardA, cardB) {
    cardA.matched = true;
    cardB.matched = true;

    cardA.revealed = true;
    cardB.revealed = true;

    const buttonA = getCardButton(cardA.id);
    const buttonB = getCardButton(cardB.id);

    buttonA.classList.add("matched");
    buttonB.classList.add("matched");

    buttonA.disabled = true;
    buttonB.disabled = true;

    animateCard(cardA.id, "match-effect");
    animateCard(cardB.id, "match-effect");

    gameState.matchedPairs++;
}

// ==========================================
// PLAYER TURN
// ==========================================

function handlePlayerCardClick(cardId) {
    if (!gameState.gameActive) return;
    if (gameState.currentTurn !== "player") return;
    if (gameState.isBusy) return;

    const card = gameState.cards[cardId];

    if (!card || card.matched || card.revealed) return;

    if (gameState.selectedCards.length >= 2) return;

    revealCard(cardId);

    // *** THE KING CAN OBSERVE PLAYER-REVEALED CARDS
    rememberCard(card);

    gameState.selectedCards.push(cardId);

    if (gameState.selectedCards.length === 2) {
        gameState.isBusy = true;

        updateAbilityButtons();

        const [firstId, secondId] =
            gameState.selectedCards;

        const firstCard = gameState.cards[firstId];
        const secondCard = gameState.cards[secondId];

        setTimeout(() => {
            checkPlayerMatch(firstCard, secondCard);
        }, 850);
    }
}

function checkPlayerMatch(firstCard, secondCard) {
    if (!gameState.gameActive) return;

    if (firstCard.symbol === secondCard.symbol) {

        markMatched(firstCard, secondCard);

        gameState.playerScore++;

        playerScoreDisplay.textContent =
            gameState.playerScore;

        // *** PLAYER COMBO SYSTEM
        gameState.playerStreak++;

        gameState.bestStreak = Math.max(
            gameState.bestStreak,
            gameState.playerStreak
        );

        // *** BONUS GOLD FOR TWO OR MORE CONSECUTIVE MATCHES
        let reward = 0;

        if (gameState.playerStreak >= 2) {
            reward = 5 * (gameState.playerStreak - 1);

            gameState.bonusGold += reward;

            showFloatingText(`🔥 COMBO +${reward} GOLD!`);

            playSound("gold");
        } else {
            showFloatingText("✨ MATCH FOUND!");
        }

        updateBattleStats();

        message.textContent =
            gameState.playerStreak >= 2
                ? `Amazing! ${gameState.playerStreak} matches in a row!`
                : "Amazing! You found a pair! 🎉";

        playerStatus.textContent =
            gameState.playerStreak >= 2
                ? `🔥 ${gameState.playerStreak} streak!`
                : "Pair found!";

        playSound("match");

        gameState.selectedCards = [];
        gameState.isBusy = false;

        if (checkGameEnd()) return;

        updateAbilityButtons();

        return;
    }

    // *** PLAYER MISTAKE
    gameState.playerStreak = 0;

    updateBattleStats();

    message.textContent =
        "No match! The King gets his turn!";

    playerStatus.textContent = "Missed!";

    showFloatingText("❌ NO MATCH!");

    playSound("miss");

    animateCard(firstCard.id, "miss-effect");
    animateCard(secondCard.id, "miss-effect");

    gameState.selectedCards = [];

    setTimeout(() => {
        hideCard(firstCard.id);
        hideCard(secondCard.id);

        gameState.isBusy = false;

        startKingTurn();

    }, 650);
}

// ==========================================
// TURN MANAGEMENT
// ==========================================

function updateTurnDisplay() {
    if (gameState.currentTurn === "player") {

        turnDisplay.textContent = "YOUR TURN";

        playerPanel.classList.add("active-fighter");
        kingPanel.classList.remove("active-fighter");

    } else {

        turnDisplay.textContent = "KING'S TURN";

        kingPanel.classList.add("active-fighter");
        playerPanel.classList.remove("active-fighter");
    }

    updateAbilityButtons();
}

function getUnmatchedCards() {
    return gameState.cards.filter(card => !card.matched);
}

// ==========================================
// *** KING MEMORY SYSTEM
// ==========================================

function rememberCard(card) {
    if (!card || card.matched) return;

    gameState.kingMemory[card.id] = {
        symbol: card.symbol,
        seenAt: gameState.kingTurnCount
    };
}

function forgetCard(cardId) {
    delete gameState.kingMemory[cardId];
}

function ageKingMemory() {

    const progress =
        gameState.matchedPairs / gameState.totalPairs;

    // *** THE KING IMPROVES AS THE BATTLE PROGRESSES
    const forgetChance = Math.max(
        0.12,
        0.42 - progress * 0.25
    );

    Object.keys(gameState.kingMemory).forEach(id => {

        if (Math.random() < forgetChance) {
            forgetCard(id);
        }
    });
}

function getKingMemoryPairs(availableCards) {
    const rememberedPairs = {};

    availableCards.forEach(card => {

        const memory = gameState.kingMemory[card.id];

        if (!memory) return;

        // *** THE KING MAY HAVE FORGOTTEN THE CARD'S REAL VALUE
        if (memory.symbol !== card.symbol) {
            forgetCard(card.id);
            return;
        }

        if (!rememberedPairs[memory.symbol]) {
            rememberedPairs[memory.symbol] = [];
        }

        rememberedPairs[memory.symbol].push(card);
    });

    return Object.values(rememberedPairs)
        .filter(cards => cards.length >= 2);
}

// ==========================================
// KING TURN
// ==========================================

function startKingTurn() {
    if (!gameState.gameActive) return;

    gameState.currentTurn = "king";
    gameState.isBusy = true;

    gameState.kingTurnCount++;

    ageKingMemory();

    updateTurnDisplay();

    kingStatus.textContent = "Thinking...";

    message.textContent = randomItem(
        kingDialogue.thinking
    );

    playSound("king");

    setTimeout(() => {

        if (!gameState.gameActive) return;

        if (gameState.kingMustSkip) {

            gameState.kingMustSkip = false;

            message.textContent =
                "💥 The King tripped over his own crown! He skips his turn.";

            kingStatus.textContent = "Skipped!";

            showFloatingText("KING SKIPPED!");

            setTimeout(endKingTurn, 1200);

            return;
        }

        kingChooseCards();

    }, 1000);
}

// ==========================================
// *** KING AI DIFFICULTY PROGRESSION
// ==========================================

function getKingSkill() {
    const progress =
        gameState.matchedPairs / gameState.totalPairs;

    // The King begins with 58% confidence.
    // His memory improves throughout the battle.
    return Math.min(
        0.94,
        0.58 + progress * 0.36
    );
}

function kingChooseCards() {
    if (!gameState.gameActive) return;

    const availableCards = getUnmatchedCards();

    if (availableCards.length < 2) {
        finishGame();
        return;
    }

    let firstCard = null;
    let secondCard = null;

    const rememberedPairs =
        getKingMemoryPairs(availableCards);

    const skill = getKingSkill();

    // *** THE KING SOMETIMES MAKES MEMORY MISTAKES
    const useMemory =
        rememberedPairs.length > 0 &&
        Math.random() < skill;

    if (useMemory) {

        const knownMatch = randomItem(rememberedPairs);

        firstCard = knownMatch[0];
        secondCard = knownMatch[1];

        message.textContent =
            "The King remembers where those cards are!";

    } else {

        const randomCards =
            shuffleArray([...availableCards]);

        firstCard = randomCards[0];
        secondCard = randomCards[1];

        message.textContent =
            "The King is guessing...";

    }

    setTimeout(() => {

        if (!gameState.gameActive) return;

        revealCard(firstCard.id);
        rememberCard(firstCard);

        setTimeout(() => {

            if (!gameState.gameActive) return;

            revealCard(secondCard.id);
            rememberCard(secondCard);

            setTimeout(() => {
                checkKingMatch(firstCard, secondCard);
            }, 850);

        }, 700);

    }, 500);
}

// ==========================================
// KING MATCH SYSTEM
// ==========================================

function checkKingMatch(firstCard, secondCard) {
    if (!gameState.gameActive) return;

    if (firstCard.symbol === secondCard.symbol) {

        // *** ROYAL SHIELD BLOCKS THE KING'S MATCH
        if (gameState.shieldActive) {

            gameState.shieldActive = false;

            message.textContent =
                "🛡️ Royal Shield blocked the King's match!";

            kingStatus.textContent = "Blocked!";

            showFloatingText("🛡️ BLOCKED!");

            playSound("ability");

            setTimeout(() => {

                hideCard(firstCard.id);
                hideCard(secondCard.id);

                endKingTurn();

            }, 1000);

            return;
        }

        markMatched(firstCard, secondCard);

        gameState.kingScore++;

        kingScoreDisplay.textContent =
            gameState.kingScore;

        // *** KING BREAKS THE PLAYER'S STREAK
        gameState.playerStreak = 0;

        updateBattleStats();

        message.textContent =
            randomItem(kingDialogue.match);

        kingStatus.textContent = "Pair found!";

        playerStatus.textContent = "King found a pair!";

        showFloatingText("👑 KING MATCH!");

        playSound("king");

        if (checkGameEnd()) return;

        // *** KING GETS ANOTHER TURN
        setTimeout(() => {
            kingChooseCards();
        }, 1200);

        return;
    }

    // *** KING MAKES A MISTAKE
    gameState.kingMistakes++;

    message.textContent =
        randomItem(kingDialogue.mistake);

    kingStatus.textContent = "Missed!";

    playerStatus.textContent = "Your chance!";

    showFloatingText("THE KING MISSED!");

    playSound("miss");

    animateCard(firstCard.id, "miss-effect");
    animateCard(secondCard.id, "miss-effect");

    setTimeout(() => {

        hideCard(firstCard.id);
        hideCard(secondCard.id);

        endKingTurn();

    }, 1000);
}

// ==========================================
// END KING TURN
// ==========================================

function endKingTurn() {
    if (!gameState.gameActive) return;

    gameState.currentTurn = "player";
    gameState.isBusy = false;

    kingStatus.textContent = "Waiting...";
    playerStatus.textContent = "Your move!";

    gameState.roundNumber++;

    updateTurnDisplay();

    message.textContent =
        randomItem(kingDialogue.angry);

    updateAbilityButtons();
}

// ==========================================
// GAME END
// ==========================================

function checkGameEnd() {
    if (gameState.matchedPairs >= gameState.totalPairs) {
        finishGame();
        return true;
    }

    return false;
}

function finishGame() {
    gameState.gameActive = false;
    gameState.isBusy = true;

    gameScreen.classList.add("hidden");
    endScreen.classList.remove("hidden");

    const playerWon =
        gameState.playerScore > gameState.kingScore;

    const draw =
        gameState.playerScore === gameState.kingScore;

    if (playerWon) {

        resultIcon.textContent = "🏆";

        resultTitle.textContent =
            "YOU DEFEATED THE KING!";

        // *** VICTORY REWARD
        const victoryGold = 25;

        gameState.bonusGold += victoryGold;

        resultMessage.textContent =
            `You collected ${gameState.playerScore} pairs while the King collected ${gameState.kingScore}. Your debt has been cancelled! You earned ${gameState.bonusGold} bonus gold, including ${victoryGold} victory gold!`;

        playSound("victory");

    } else if (draw) {

        resultIcon.textContent = "⚖️";

        resultTitle.textContent = "A ROYAL DRAW!";

        resultMessage.textContent =
            `You and the King both collected ${gameState.playerScore} pairs! Neither of you can claim victory. Your bonus gold: ${gameState.bonusGold}.`;

        playSound("match");

    } else {

        resultIcon.textContent = "👑";

        resultTitle.textContent =
            "THE KING WINS!";

        resultMessage.textContent =
            `The King collected ${gameState.kingScore} pairs while you collected ${gameState.playerScore}. He has added another 10,000 gold coins to your debt! You still earned ${gameState.bonusGold} bonus gold.`;

        playSound("defeat");
    }

    updateAbilityButtons();

    console.log("Battle complete!", {
        playerScore: gameState.playerScore,
        kingScore: gameState.kingScore,
        playerStreak: gameState.playerStreak,
        bestStreak: gameState.bestStreak,
        bonusGold: gameState.bonusGold,
        kingMistakes: gameState.kingMistakes,
        kingSkill: getKingSkill()
    });
}

// ==========================================
// ABILITY BUTTON MANAGEMENT
// ==========================================

function updateAbilityButtons() {
    document.querySelectorAll("[data-ability]").forEach(button => {

        const ability = button.dataset.ability;

        if (!gameState.abilitiesUsed) {
            button.disabled = true;
            return;
        }

        const used = gameState.abilitiesUsed[ability];

        button.disabled =
            used ||
            gameState.currentTurn !== "player" ||
            gameState.isBusy ||
            !gameState.gameActive;

        button.classList.toggle("used", used);

        button.setAttribute(
            "aria-pressed",
            String(used)
        );
    });
}

// ==========================================
// USE ABILITY
// ==========================================

function useAbility(ability) {

    if (!gameState.gameActive) return;
    if (gameState.currentTurn !== "player") return;
    if (gameState.isBusy) return;
    if (gameState.abilitiesUsed[ability]) return;

    if (gameState.selectedCards.length > 0) {

        message.textContent =
            "Finish your current card selection first!";

        return;
    }

    const validAbilities = [
        "hint",
        "swap",
        "shuffle",
        "chaos",
        "shield"
    ];

    if (!validAbilities.includes(ability)) return;

    gameState.abilitiesUsed[ability] = true;

    playSound("ability");

    switch (ability) {

        case "hint":
            useLuckyHint();
            break;

        case "swap":
            useSwitcheroo();
            break;

        case "shuffle":
            useRoyalShuffle();
            break;

        case "chaos":
            useChaosCard();
            break;

        case "shield":
            useRoyalShield();
            break;
    }

    updateAbilityButtons();
}

// ==========================================
// LUCKY HINT
// ==========================================

function useLuckyHint() {

    const availableCards = getUnmatchedCards();

    const pairs = {};

    availableCards.forEach(card => {

        if (!pairs[card.symbol]) {
            pairs[card.symbol] = [];
        }

        pairs[card.symbol].push(card);
    });

    const possiblePairs = Object.values(pairs)
        .filter(cards => cards.length === 2);

    if (possiblePairs.length === 0) {

        message.textContent =
            "Lucky Hint couldn't find a pair!";

        return;
    }

    const pair = randomItem(possiblePairs);

    // *** PREVENT CARD CLICKS DURING THE HINT
    gameState.isBusy = true;

    revealCard(pair[0].id);
    revealCard(pair[1].id);

    animateCard(pair[0].id, "hint-effect");
    animateCard(pair[1].id, "hint-effect");

    message.textContent =
        "🔮 Lucky Hint revealed a matching pair!";

    showFloatingText("🔮 LUCKY HINT!");

    updateAbilityButtons();

    setTimeout(() => {

        if (!gameState.gameActive) return;

        hideCard(pair[0].id);
        hideCard(pair[1].id);

        gameState.isBusy = false;

        message.textContent =
            "Now try to remember their positions!";

        updateAbilityButtons();

    }, 1800);
}

// ==========================================
// SWITCHEROO
// ==========================================

function useSwitcheroo() {

    const availableCards = getUnmatchedCards();

    if (availableCards.length < 2) return;

    const selected = shuffleArray(
        [...availableCards]
    ).slice(0, 2);

    // *** SWAPPING TWO SYMBOLS PRESERVES THE TOTAL PAIR COUNT
    const temporarySymbol = selected[0].symbol;

    selected[0].symbol = selected[1].symbol;
    selected[1].symbol = temporarySymbol;

    selected.forEach(card => {

        const button = getCardButton(card.id);

        button.querySelector(".card-front").textContent =
            card.symbol;

        animateCard(card.id, "ability-effect");

        // *** REMOVE STALE KING MEMORY
        forgetCard(card.id);
    });

    message.textContent =
        "🪄 Switcheroo! Two cards have changed places!";

    showFloatingText("🪄 SWITCHEROO!");
}

// ==========================================
// ROYAL SHUFFLE
// ==========================================

function useRoyalShuffle() {

    const availableCards = getUnmatchedCards();

    if (availableCards.length < 2) return;

    const symbols = shuffleArray(
        availableCards.map(card => card.symbol)
    );

    availableCards.forEach((card, index) => {

        card.symbol = symbols[index];

        const button = getCardButton(card.id);

        button.querySelector(".card-front").textContent =
            card.symbol;

        animateCard(card.id, "ability-effect");
    });

    // *** THE KING MUST RELEARN THE BOARD
    gameState.kingMemory = {};

    message.textContent =
        "🌀 The entire board has been shuffled!";

    showFloatingText("🌀 ROYAL SHUFFLE!");
}

// ==========================================
// CHAOS CARD
// ==========================================

function useChaosCard() {

    gameState.kingMustSkip = true;

    message.textContent =
        "💥 Chaos Card activated! The King will lose his next turn!";

    showFloatingText("💥 CHAOS ACTIVATED!");
}

// ==========================================
// ROYAL SHIELD
// ==========================================

function useRoyalShield() {

    gameState.shieldActive = true;

    message.textContent =
        "🛡️ Royal Shield activated! The next King match will be blocked!";

    showFloatingText("🛡️ SHIELD ACTIVATED!");
}

// ==========================================
// EVENT LISTENERS
// ==========================================

// Start and restart buttons.
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

// Special ability buttons.
document.querySelectorAll("[data-ability]").forEach(button => {

    button.addEventListener("click", () => {
        useAbility(button.dataset.ability);
    });

    button.disabled = true;
});

console.log(
    "Memory Mayhem Stage 1 loaded successfully!"
);
