const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const RED_SUITS = new Set(['♥', '♦']);

const state = {
  balance: 0,
  bet: 0,
  wins: 0,
  losses: 0,
  deck: [],
  player: [],
  dealer: [],
  phase: 'bet', // 'bet' | 'play' | 'end'
};

// DEPOSIT

function setupDepositScreen() {
  const customInput = document.getElementById('custom-amount');
  const preview     = document.getElementById('deposit-preview');
  const depositBtn  = document.getElementById('deposit-btn');

  customInput.addEventListener('input', () => {
    const val = parseInt(customInput.value) || 0;
    preview.textContent = '$' + val.toLocaleString();
    depositBtn.disabled = val <= 0;
  });

  // Allow pressing Enter to confirm
  customInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !depositBtn.disabled) depositBtn.click();
  });

  depositBtn.addEventListener('click', () => {
    const amount = parseInt(customInput.value) || 0;
    if (amount <= 0) return;
    state.balance = amount;
    document.getElementById('deposit-screen').style.display = 'none';
    document.getElementById('bj').style.display = 'flex';
    updateStats();
  });
}

// ADD FUNDS 

function setupModal() {
  const overlay     = document.getElementById('modal-overlay');
  const customInput = document.getElementById('modal-custom-amount');
  const preview     = document.getElementById('modal-deposit-preview');
  const confirmBtn  = document.getElementById('modal-confirm-btn');
  const cancelBtn   = document.getElementById('modal-cancel');
  const addFundsBtn = document.getElementById('add-funds-btn');

  addFundsBtn.addEventListener('click', () => {
    if (state.phase === 'play') return; // no adding funds mid-hand
    customInput.value       = '';
    preview.textContent     = '$0';
    confirmBtn.disabled     = true;
    overlay.style.display   = 'flex';
    setTimeout(() => customInput.focus(), 50);
  });

  customInput.addEventListener('input', () => {
    const val = parseInt(customInput.value) || 0;
    preview.textContent = '$' + val.toLocaleString();
    confirmBtn.disabled = val <= 0;
  });

  // Allow pressing Enter to confirm
  customInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !confirmBtn.disabled) confirmBtn.click();
  });

  confirmBtn.addEventListener('click', () => {
    const amount = parseInt(customInput.value) || 0;
    if (amount <= 0) return;
    state.balance += amount;
    overlay.style.display = 'none';
    updateStats();
    setMessage('Funds added! Good luck. 🍀', 'info');
  });

  cancelBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
  });

  // Close on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.style.display = 'none';
  });
}

// ─── Deck ─────────────────────────────────────────────────────────────────────

function buildDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function cardValue(rank) {
  if (rank === 'A') return 11;
  if (['K', 'Q', 'J'].includes(rank)) return 10;
  return parseInt(rank);
}

function handScore(hand) {
  let score = 0;
  let aces  = 0;
  for (const card of hand) {
    score += cardValue(card.rank);
    if (card.rank === 'A') aces++;
  }
  while (score > 21 && aces > 0) { score -= 10; aces--; }
  return score;
}

// ─── Rendering ────────────────────────────────────────────────────────────────

function createCardElement(card, hidden = false) {
  const div = document.createElement('div');
  if (hidden) {
    div.className = 'card hidden';
    div.innerHTML = '<div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:24px;color:rgba(255,255,255,0.15)">🂠</div>';
    return div;
  }
  div.className = `card ${RED_SUITS.has(card.suit) ? 'red' : 'black'}`;
  div.innerHTML = `
    <div><div>${card.rank}</div><div class="suit-sm">${card.suit}</div></div>
    <div class="center">${card.suit}</div>
    <div class="bot"><div>${card.rank}</div><div class="suit-sm">${card.suit}</div></div>
  `;
  return div;
}

function renderHands(showAll = false) {
  const dealerEl = document.getElementById('dealer-cards');
  const playerEl = document.getElementById('player-cards');
  dealerEl.innerHTML = '';
  playerEl.innerHTML = '';

  state.dealer.forEach((card, i) => dealerEl.appendChild(createCardElement(card, !showAll && i === 1)));
  state.player.forEach(card => playerEl.appendChild(createCardElement(card)));

  document.getElementById('player-score').textContent = handScore(state.player);

  if (showAll) {
    document.getElementById('dealer-score').textContent = handScore(state.dealer);
  } else {
    const vis = state.dealer[0];
    document.getElementById('dealer-score').textContent = vis
      ? cardValue(vis.rank) + (vis.rank === 'A' ? '/11' : '')
      : '?';
  }
}

function updateStats() {
  document.getElementById('balance').textContent     = '$' + state.balance.toLocaleString();
  document.getElementById('current-bet').textContent = '$' + state.bet;
  document.getElementById('wins').textContent        = state.wins;
  document.getElementById('losses').textContent      = state.losses;
  document.getElementById('bet-display').textContent = 'Bet: $' + state.bet;
}

function setMessage(text, type = '') {
  const el = document.getElementById('message');
  el.textContent = text;
  el.className   = 'message ' + type;
}

function showPhase(phase) {
  document.getElementById('bet-area').style.display    = phase === 'bet'  ? 'flex'  : 'none';
  document.getElementById('action-area').style.display = phase === 'play' ? 'flex'  : 'none';
  document.getElementById('new-area').style.display    = phase === 'end'  ? 'block' : 'none';
  if (phase === 'bet') {
    document.getElementById('bet-area').style.flexDirection = 'column';
  }
}

// GAMEPLAY

function deal() {
  if (state.bet === 0)           { setMessage('Place a bet first!', 'info'); return; }
  if (state.bet > state.balance) { setMessage('Not enough balance!', 'lose'); return; }

  state.balance -= state.bet;
  state.deck    = buildDeck();
  state.player  = [state.deck.pop(), state.deck.pop()];
  state.dealer  = [state.deck.pop(), state.deck.pop()];
  state.phase   = 'play';

  showPhase('play');
  renderHands(false);
  updateStats();
  setMessage('Hit, Stand, or Double?', 'info');

  if (handScore(state.player) === 21) setTimeout(() => stand(), 400);
}

function hit() {
  state.player.push(state.deck.pop());
  renderHands(false);
  const score = handScore(state.player);
  if      (score > 21)   { endGame('bust'); }
  else if (score === 21) { setTimeout(() => stand(), 300); }
  else                   { setMessage('Score: ' + score + ' — Hit or Stand?', 'info'); }
}

function stand() {
  renderHands(true);
  const interval = setInterval(() => {
    if (handScore(state.dealer) < 17) {
      state.dealer.push(state.deck.pop());
      renderHands(true);
    } else {
      clearInterval(interval);
      evaluate();
    }
  }, 500);
}

function doubleDown() {
  if (state.bet > state.balance) { setMessage("Can't afford double!", 'lose'); return; }
  state.balance -= state.bet;
  state.bet     *= 2;
  updateStats();
  state.player.push(state.deck.pop());
  renderHands(false);
  if (handScore(state.player) > 21) { endGame('bust'); } else { stand(); }
}

// RESULT

function evaluate() {
  const ps  = handScore(state.player);
  const ds  = handScore(state.dealer);
  const pBJ = ps === 21 && state.player.length === 2;
  const dBJ = ds === 21 && state.dealer.length === 2;

  if      (pBJ && dBJ)         { endGame('push');      }
  else if (pBJ)                 { endGame('blackjack'); }
  else if (dBJ)                 { endGame('dealer-bj'); }
  else if (ds > 21 || ps > ds) { endGame('win');       }
  else if (ps < ds)             { endGame('lose');      }
  else                          { endGame('push');      }
}

function endGame(result) {
  state.phase = 'end';
  showPhase('end');
  renderHands(true);

  const outcomes = {
    bust:        ['You busted! 💥',        'lose'],
    blackjack:   ['Blackjack! 🎉',         'win'],
    'dealer-bj': ['Dealer Blackjack! 😱',  'lose'],
    win:         ['You win! 🃏',           'win'],
    lose:        ['Dealer wins. 😤',       'lose'],
    push:        ["It's a push! 🤝",       'push'],
  };
  const [message, type] = outcomes[result];

  if      (result === 'blackjack') { state.balance += Math.floor(state.bet * 2.5); state.wins++;   }
  else if (result === 'win')       { state.balance += state.bet * 2;               state.wins++;   }
  else if (result === 'push')      { state.balance += state.bet;                                   }
  else                             {                                                state.losses++; }

  updateStats();
  setMessage(message, type);

  if (state.balance === 0) {
    setTimeout(() => setMessage("You're out of funds! Hit '+ Add Funds' to keep playing.", 'lose'), 800);
  }
}

function newHand() {
  state.bet    = 0;
  state.phase  = 'bet';
  state.player = [];
  state.dealer = [];

  showPhase('bet');
  document.getElementById('dealer-cards').innerHTML   = '';
  document.getElementById('player-cards').innerHTML   = '';
  document.getElementById('dealer-score').textContent = '?';
  document.getElementById('player-score').textContent = '0';

  updateStats();
  setMessage('Place your bet to begin', 'info');
}

// BETTING

document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    if (state.phase !== 'bet') return;
    const value = parseInt(chip.dataset.v);
    if (state.bet + value <= state.balance) {
      state.bet += value;
      updateStats();
    } else {
      setMessage("Not enough balance for that chip!", 'lose');
    }
  });
});

document.getElementById('clear-bet').addEventListener('click',  () => { state.bet = 0; updateStats(); });
document.getElementById('deal-btn').addEventListener('click',   deal);
document.getElementById('hit-btn').addEventListener('click',    hit);
document.getElementById('stand-btn').addEventListener('click',  stand);
document.getElementById('double-btn').addEventListener('click', doubleDown);
document.getElementById('new-btn').addEventListener('click',    newHand);

setupDepositScreen();
setupModal();