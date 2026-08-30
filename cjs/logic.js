const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(freq, dur, type, vol) {
    type = type || 'sine';
    vol = vol || 0.3;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + dur);
}

function playClick() { playSound(800, 0.08, 'square', 0.2); }
function playWin() {
    playSound(523, 0.15, 'sine', 0.3);
    setTimeout(() => playSound(659, 0.15, 'sine', 0.3), 100);
    setTimeout(() => playSound(784, 0.2, 'sine', 0.3), 200);
}
function playLose() { playSound(200, 0.3, 'sawtooth', 0.2); }
function playJackpot() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playSound(f, 0.2, 'sine', 0.4), i * 100));
}

let state = {
    balance: parseInt(localStorage.getItem('maya_balance')) || 100,
    history: JSON.parse(localStorage.getItem('maya_history') || '[]'),
    streak: parseInt(localStorage.getItem('maya_streak')) || 0,
    bonusMult: parseInt(localStorage.getItem('maya_bonus')) || 1,
    debtMode: localStorage.getItem('maya_debt') === 'true',
    debtWins: parseInt(localStorage.getItem('maya_debtWins')) || 0
};

function saveState() {
    localStorage.setItem('maya_balance', state.balance.toString());
    localStorage.setItem('maya_history', JSON.stringify(state.history.slice(-5)));
    localStorage.setItem('maya_streak', state.streak.toString());
    localStorage.setItem('maya_bonus', state.bonusMult.toString());
    localStorage.setItem('maya_debt', state.debtMode.toString());
    localStorage.setItem('maya_debtWins', state.debtWins.toString());
}

function updateUI() {
    const hudBal = document.getElementById('hudBalance');
    const uiBal = document.getElementById('uiBalance');
    if (hudBal) hudBal.textContent = state.balance;
    if (uiBal) uiBal.textContent = state.balance;
    const bb = document.getElementById('bonusBar');
    if (bb) {
        if (state.bonusMult > 1) {
            bb.classList.add('active');
            document.getElementById('bonusMult').textContent = state.bonusMult;
        } else {
            bb.classList.remove('active');
        }
    }
    renderHistory();
}

function addHistory(win, amount, game) {
    state.history.push({ win, amount, game });
    if (state.history.length > 5) state.history.shift();
    saveState();
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('historyList');
    if (!list) return;
    if (state.history.length === 0) {
        list.innerHTML = '<div style="color:#555; font-size:10px;">Пока пусто</div>';
        return;
    }
    list.innerHTML = state.history.map(h =>
        `<div class="history-item ${h.win ? 'win' : 'lose'}">${h.game} ${h.win ? '+' : '-'}${h.amount}</div>`
    ).join('');
}

function applyBonus(amount) {
    let final = amount;
    if (state.bonusMult > 1) {
        final = amount * state.bonusMult;
        state.bonusMult = 1;
    }
    if (state.debtMode) {
        final = Math.floor(final * 0.8);
        state.debtWins++;
        if (state.debtWins >= 3) {
            state.debtMode = false;
            state.debtWins = 0;
        }
    }
    return final;
}

function checkDebt() {
    if (state.balance <= 0) {
        state.balance = 9;
        state.debtMode = true;
        state.debtWins = 0;
        saveState();
        updateUI();
        return ' | ДАР БОГОВ: +9 Ꚛ';
    }
    return '';
}

function getBet(inputId) {
    const val = parseInt(document.getElementById(inputId).value);
    if (isNaN(val) || val < 10) return 10;
    return val;
}

function validateBet(inputId) {
    const input = document.getElementById(inputId);
    let val = parseInt(input.value);
    if (isNaN(val) || val < 10) val = 10;
    if (val > state.balance) val = state.balance;
    input.value = val;
}

const slotSymbols = ['', '🍋', '🍊', '⭐', '💎', '👁️'];
const slotValues = { '🍒': 2, '🍋': 3, '🍊': 4, '⭐': 5, '💎': 10, '️': 20 };

function initSlot() {
    const input = document.getElementById('slotBet');
    input.addEventListener('change', () => validateBet('slotBet'));
    input.addEventListener('input', () => {
        let val = parseInt(input.value);
        if (val > state.balance) input.value = state.balance;
    });

    document.getElementById('slotSpin').addEventListener('click', () => {
        const bet = getBet('slotBet');
        if (bet > state.balance) { showSlotMsg('Мало Эхо!', 'lose'); playLose(); return; }
        state.balance -= bet; updateUI(); playClick();
        const reels = [document.getElementById('reel1'), document.getElementById('reel2'), document.getElementById('reel3')];
        const btn = document.getElementById('slotSpin'); btn.disabled = true;
        let spins = 0;
        const interval = setInterval(() => {
            reels.forEach(r => r.textContent = slotSymbols[Math.floor(Math.random() * 6)]);
            spins++;
            if (spins > 15) {
                clearInterval(interval);
                const res = [slotSymbols[Math.floor(Math.random()*6)], slotSymbols[Math.floor(Math.random()*6)], slotSymbols[Math.floor(Math.random()*6)]];
                reels.forEach((r, i) => r.textContent = res[i]);
                let win = 0, msg = '', type = 'lose';
                if (res[0] === res[1] && res[1] === res[2]) {
                    win = applyBonus(bet * slotValues[res[0]]); state.balance += win;
                    msg = 'ДЖЕКПОТ! +' + win + ' Ꚛ'; type = 'win'; playJackpot();
                } else if (res[0] === res[1] || res[1] === res[2] || res[0] === res[2]) {
                    win = applyBonus(bet * 2); state.balance += win;
                    msg = 'Пара! +' + win + ' '; type = 'win'; playWin();
                } else { msg = 'Пусто...'; type = 'lose'; playLose(); }
                state.streak++;
                if (state.streak >= 9) { state.bonusMult = [2, 3, 9][Math.floor(Math.random() * 3)]; state.streak = 0; }
                msg += checkDebt();
                addHistory(type === 'win', win || bet, 'СЛОТ');
                updateUI(); showSlotMsg(msg, type); btn.disabled = false;
            }
        }, 80);
    });
}

function showSlotMsg(text, type) {
    const el = document.getElementById('slotMsg');
    if (!el) return;
    el.textContent = text; el.className = 'msg-box ' + type;
    setTimeout(() => { el.textContent = ''; el.className = 'msg-box'; }, 3000);
}

let wheelRotation = 0;
const wheelMults = [2, 5, 9, 2, 5, 9, 2, 5, 9];

function initWheel() {
    const input = document.getElementById('wheelBet');
    input.addEventListener('change', () => validateBet('wheelBet'));
    input.addEventListener('input', () => {
        let val = parseInt(input.value);
        if (val > state.balance) input.value = state.balance;
    });

    document.getElementById('wheelSpin').addEventListener('click', () => {
        const bet = getBet('wheelBet');
        if (bet > state.balance) { showWheelMsg('Мало Эхо!', 'lose'); playLose(); return; }
        state.balance -= bet; updateUI(); playClick();
        const btn = document.getElementById('wheelSpin'); btn.disabled = true;
        const segment = Math.floor(Math.random() * 9);
        const mult = wheelMults[segment];
        const extraSpins = 5 + Math.floor(Math.random() * 3);
        wheelRotation += 360 * extraSpins + (segment * 40) + 20;
        document.getElementById('wheelCircle').style.transform = 'rotate(' + wheelRotation + 'deg)';
        setTimeout(() => {
            const win = applyBonus(bet * mult);
            state.balance += win; state.streak++;
            if (state.streak >= 9) { state.bonusMult = [2, 3, 9][Math.floor(Math.random() * 3)]; state.streak = 0; }
            addHistory(true, win, 'КОЛЕСО'); updateUI();
            showWheelMsg('x' + mult + '! +' + win + ' Ꚛ', 'win');
            playWin(); btn.disabled = false;
        }, 3100);
    });
}

function showWheelMsg(text, type) {
    const el = document.getElementById('wheelMsg');
    if (!el) return;
    el.textContent = text; el.className = 'msg-box ' + type;
    setTimeout(() => { el.textContent = ''; el.className = 'msg-box'; }, 3000);
}

const rpsChoices = ['rock', 'scissors', 'god'];
const rpsBeats = { rock: 'scissors', scissors: 'god', god: 'rock' };
const rpsEmojis = { rock: '🗿', scissors: '️', god: '👁️' };

function initRps() {
    const input = document.getElementById('rpsBet');
    input.addEventListener('change', () => validateBet('rpsBet'));
    input.addEventListener('input', () => {
        let val = parseInt(input.value);
        if (val > state.balance) input.value = state.balance;
    });

    document.querySelectorAll('.rps-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const bet = getBet('rpsBet');
            if (bet > state.balance) { showRpsMsg('Мало!', 'lose'); playLose(); return; }
            state.balance -= bet; updateUI(); playClick();
            const player = btn.dataset.choice;
            const ai = rpsChoices[Math.floor(Math.random() * 3)];
            document.getElementById('rpsResult').textContent = rpsEmojis[player] + ' vs ' + rpsEmojis[ai];
            let win = 0, msg = '', type = 'lose';
            if (player === ai) { state.balance += bet; msg = 'Ничья!'; type = 'win'; playClick(); }
            else if (rpsBeats[player] === ai) {
                win = applyBonus(bet * 3); state.balance += win;
                msg = 'Победа! +' + win + ' Ꚛ'; type = 'win'; playWin();
            } else { msg = 'Проигрыш...'; type = 'lose'; playLose(); }
            state.streak++;
            if (state.streak >= 9) { state.bonusMult = [2, 3, 9][Math.floor(Math.random() * 3)]; state.streak = 0; }
            msg += checkDebt();
            addHistory(type === 'win', win || bet, 'БОГ'); updateUI(); showRpsMsg(msg, type);
        });
    });
}

function showRpsMsg(text, type) {
    const el = document.getElementById('rpsMsg');
    if (!el) return;
    el.textContent = text; el.className = 'msg-box ' + type;
    setTimeout(() => { el.textContent = ''; el.className = 'msg-box'; }, 3000);
}

let pyrLocked = false;

function initPyramid() {
    const input = document.getElementById('pyrBet');
    input.addEventListener('change', () => validateBet('pyrBet'));
    input.addEventListener('input', () => {
        let val = parseInt(input.value);
        if (val > state.balance) input.value = state.balance;
    });

    document.querySelectorAll('.cup-btn').forEach(cup => {
        cup.addEventListener('click', () => {
            if (pyrLocked) return;
            const bet = getBet('pyrBet');
            if (bet > state.balance) { showPyrMsg('Мало!', 'lose'); playLose(); return; }
            state.balance -= bet; updateUI(); playClick(); pyrLocked = true;
            const chosen = parseInt(cup.dataset.cup);
            const correct = Math.floor(Math.random() * 3);
            setTimeout(() => {
                document.querySelectorAll('.cup-btn').forEach((c, i) => {
                    if (i === correct) { c.classList.add('revealed'); c.textContent = '💎'; }
                    else { c.textContent = '🏺'; }
                });
                let win = 0, msg = '', type = 'lose';
                if (chosen === correct) {
                    win = applyBonus(bet * 2); state.balance += win;
                    msg = 'Угадал! +' + win + ' Ꚛ'; type = 'win'; playWin();
                } else { msg = 'Мимо...'; type = 'lose'; playLose(); }
                state.streak++;
                if (state.streak >= 9) { state.bonusMult = [2, 3, 9][Math.floor(Math.random() * 3)]; state.streak = 0; }
                msg += checkDebt();
                addHistory(type === 'win', win || bet, 'ПИРАМИДА'); updateUI(); showPyrMsg(msg, type);
                setTimeout(() => {
                    document.querySelectorAll('.cup-btn').forEach(c => { c.classList.remove('revealed'); c.textContent = '🏺'; });
                    pyrLocked = false;
                }, 2000);
            }, 500);
        });
    });
}

function showPyrMsg(text, type) {
    const el = document.getElementById('pyrMsg');
    if (!el) return;
    el.textContent = text; el.className = 'msg-box ' + type;
    setTimeout(() => { el.textContent = ''; el.className = 'msg-box'; }, 3000);
}

export function initGames() {
    initSlot();
    initWheel();
    initRps();
    initPyramid();
}

export {
    state,
    saveState,
    updateUI,
    playClick,
    playWin,
    playLose,
    playJackpot
};