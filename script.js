/**
 * ROMANTIC DATE INVITATION — JAVASCRIPT
 * Handles screen transitions, playful dodging logic, confetti celebration,
 * ambient floating hearts canvas, sound engine (with offline synthesizer fallback),
 * and WhatsApp message generation.
 */

(function () {
  'use strict';

  // --- STATE ---
  let currentScreen = 'welcome';
  // Default WhatsApp Phone Number (+91 9567158313)
  const DEFAULT_PHONE_NUMBER = '919567158313';
  let dodgeCount = 0;
  let selectedPlan = {
    id: 'coffee',
    title: 'Coffee & conversations ☕',
    tag: 'Cozy & Chill'
  };

  const funnyMessages = [
    'Excuse me?? 😭',
    'That button seems broken 😂',
    'Give me one more chance 🥺',
    'You sure about that? 👀',
    'Wait, let’s pretend you didn’t click that 🙈',
    'Are you sure your finger didn’t slip? 😜',
    'Pink button comes with free dessert! 🍰',
    'Nice try, but resistance is futile 💖',
    'The universe says YES is the answer 🪐✨'
  ];

  // --- DOM ELEMENTS ---
  const screens = {
    welcome: document.getElementById('screen-welcome'),
    question: document.getElementById('screen-question'),
    yes: document.getElementById('screen-yes'),
    final: document.getElementById('screen-final')
  };

  const envelopeWrapper = document.getElementById('envelope-trigger');
  const mainEnvelope = document.getElementById('main-envelope');
  const btnOpenSurprise = document.getElementById('btn-open-surprise');

  const btnYes = document.getElementById('btn-yes');
  const btnNo = document.getElementById('btn-no');
  const dodgeContainer = document.getElementById('dodge-container');
  const dodgeBubble = document.getElementById('dodge-bubble');
  const decisionArena = document.getElementById('decision-arena');

  const dateCards = document.querySelectorAll('.date-option-card');
  const dateSweetNoteInput = document.getElementById('date-sweet-note');
  const btnConfirmPlan = document.getElementById('btn-confirm-plan');

  const summaryChoiceText = document.getElementById('summary-choice-text');
  const btnSendWhatsApp = document.getElementById('btn-send-whatsapp');
  const btnCopyReply = document.getElementById('btn-copy-reply');
  const copyBtnText = document.getElementById('copy-btn-text');
  const btnRestart = document.getElementById('btn-restart');

  const musicBtn = document.getElementById('music-btn');
  const musicStatusText = musicBtn.querySelector('.music-status');
  const bgMusic = document.getElementById('bg-music');

  const configBtn = document.getElementById('config-btn');
  const configModal = document.getElementById('config-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const phoneInput = document.getElementById('phone-input');
  const savePhoneBtn = document.getElementById('save-phone-btn');

  // --- WEB AUDIO SYNTHESIZER & SOUND EFFECTS ---
  // Works offline without any external mp3 dependencies
  let audioCtx = null;
  let isMusicPlaying = false;
  let synthMusicInterval = null;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Play delicate synthesized UI sound effects
  function playSound(type) {
    try {
      initAudioContext();
      if (!audioCtx) return;

      const now = audioCtx.currentTime;

      if (type === 'pop') {
        // Soft pop for envelope or button
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'dodge') {
        // Playful boing/wobble for dodge button
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.22);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'celebrate') {
        // Magical victory arpeggio for YES!
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
        notes.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          const noteTime = now + (idx * 0.08);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteTime);
          gain.gain.setValueAtTime(0.2, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(noteTime);
          osc.stop(noteTime + 0.35);
        });
      } else if (type === 'select') {
        // Crisp chime for card selection
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch (e) {
      console.warn('Audio effect unavailable', e);
    }
  }

  // Sweet music box synthesizer loop (dreamy romantic progression: Cmaj7 - Am7 - Fmaj7 - G)
  function startMusicBoxSynth() {
    if (synthMusicInterval) return;
    const chords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [196.00, 246.94, 293.66, 392.00]  // G7
    ];
    let chordIdx = 0;
    let step = 0;

    synthMusicInterval = setInterval(() => {
      if (!isMusicPlaying || !audioCtx) return;
      try {
        const chord = chords[chordIdx];
        const noteFreq = chord[step % chord.length];
        const now = audioCtx.currentTime;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(noteFreq * 2, now); // high bell octave
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.85);

        step++;
        if (step % 4 === 0) {
          chordIdx = (chordIdx + 1) % chords.length;
        }
      } catch (err) {
        // fail silently
      }
    }, 450);
  }

  function stopMusicBoxSynth() {
    if (synthMusicInterval) {
      clearInterval(synthMusicInterval);
      synthMusicInterval = null;
    }
  }

  // Background Music Toggle (OFF by default)
  function toggleMusic() {
    initAudioContext();
    if (isMusicPlaying) {
      // Turn OFF
      isMusicPlaying = false;
      bgMusic.pause();
      stopMusicBoxSynth();
      musicBtn.classList.remove('is-playing');
      musicStatusText.textContent = 'Play Music';
    } else {
      // Turn ON
      isMusicPlaying = true;
      musicBtn.classList.add('is-playing');
      musicStatusText.textContent = 'Music Playing ✨';

      // Try playing mp3 track first
      bgMusic.volume = 0.45;
      const playPromise = bgMusic.play();

      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If remote track fails or is blocked, seamlessly fallback to dreamy synth!
          startMusicBoxSynth();
        });
      } else {
        startMusicBoxSynth();
      }
    }
  }

  musicBtn.addEventListener('click', toggleMusic);

  // --- SCREEN SWITCHING ---
  function navigateTo(targetScreen) {
    if (!screens[targetScreen]) return;

    // Fade out current screen
    const currentEl = screens[currentScreen];
    if (currentEl) {
      currentEl.style.opacity = '0';
      currentEl.style.transform = 'translateY(-16px) scale(0.97)';
      setTimeout(() => {
        currentEl.classList.remove('active');
        currentEl.style.transform = '';

        // Fade in new screen
        const targetEl = screens[targetScreen];
        targetEl.classList.add('active');
        targetEl.style.opacity = '0';
        targetEl.style.transform = 'translateY(24px) scale(0.97)';
        targetScreen = targetScreen;
        currentScreen = targetScreen;

        // Force reflow
        void targetEl.offsetWidth;
        targetEl.style.opacity = '1';
        targetEl.style.transform = 'translateY(0) scale(1)';

        // Scroll to top smoothly if on mobile
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 350);
    }
  }

  // --- SCREEN 1: ENVELOPE OPENING ---
  function triggerEnvelopeOpen() {
    playSound('pop');
    mainEnvelope.classList.add('opened');

    // Automatically start the romantic music on opening the envelope!
    if (!isMusicPlaying) {
      toggleMusic();
    }

    // Launch small sparkle burst from envelope
    spawnEnvelopeSparkles();

    setTimeout(() => {
      navigateTo('question');
    }, 850);
  }

  if (envelopeWrapper) {
    envelopeWrapper.addEventListener('click', () => {
      if (!mainEnvelope.classList.contains('opened')) {
        triggerEnvelopeOpen();
      }
    });
  }

  if (btnOpenSurprise) {
    btnOpenSurprise.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerEnvelopeOpen();
    });
  }

  // --- SCREEN 2: PLAYFUL DODGING "NO" BUTTON ---
  function dodgeNoButton(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    playSound('dodge');
    dodgeCount++;

    // 1. Show next funny message in speech bubble
    const msg = funnyMessages[(dodgeCount - 1) % funnyMessages.length];
    dodgeBubble.querySelector('span').textContent = msg;
    dodgeBubble.classList.add('show');

    // 2. Playful dodging movement
    // Calculate safe boundaries inside the arena
    const arenaRect = decisionArena.getBoundingClientRect();
    const btnRect = btnNo.getBoundingClientRect();

    const maxDeltaX = Math.min(130, (arenaRect.width - btnRect.width) / 2);
    const maxDeltaY = 55;

    // Random displacement ensuring it moves significantly from current pos
    let randX = (Math.random() - 0.5) * 2 * maxDeltaX;
    let randY = (Math.random() - 0.5) * 2 * maxDeltaY;

    // Small random rotation for cute personality
    const randRot = (Math.random() - 0.5) * 18;

    dodgeContainer.style.transform = `translate(${randX}px, ${randY}px) rotate(${randRot}deg)`;

    // 3. Make YES button gently expand to invite the click
    const yesScale = Math.min(1.35, 1 + (dodgeCount * 0.05));
    btnYes.style.transform = `scale(${yesScale})`;
    btnYes.style.boxShadow = `0 12px ${25 + dodgeCount * 3}px rgba(255, 77, 109, ${0.4 + dodgeCount * 0.03})`;

    // Hide speech bubble after 2.5 seconds if no further dodge
    clearTimeout(dodgeBubble._hideTimer);
    dodgeBubble._hideTimer = setTimeout(() => {
      dodgeBubble.classList.remove('show');
    }, 2500);
  }

  // Dodge triggers: Mouse hover / Pointer Enter / Touch Start
  btnNo.addEventListener('mouseenter', dodgeNoButton);
  btnNo.addEventListener('touchstart', dodgeNoButton, { passive: false });
  btnNo.addEventListener('click', dodgeNoButton);

  // YES button clicked!
  btnYes.addEventListener('click', () => {
    playSound('celebrate');
    triggerGrandCelebrationConfetti();
    navigateTo('yes');
  });

  // --- SCREEN 3: DATE SELECTION ---
  dateCards.forEach(card => {
    card.addEventListener('click', () => {
      dateCards.forEach(c => {
        c.classList.remove('selected');
        c.setAttribute('aria-checked', 'false');
      });

      card.classList.add('selected');
      card.setAttribute('aria-checked', 'true');
      playSound('select');

      const dateId = card.getAttribute('data-date-id');
      const title = card.querySelector('.option-title').textContent;
      const tag = card.querySelector('.option-tag').textContent;
      const emoji = card.querySelector('.card-emoji').textContent;

      selectedPlan = {
        id: dateId,
        title: `${title} ${emoji}`,
        tag: tag
      };
    });

    // Support keyboard selection
    card.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        card.click();
      }
    });
  });

  btnConfirmPlan.addEventListener('click', () => {
    playSound('pop');
    // Update summary text on Screen 4
    const customNote = dateSweetNoteInput.value.trim();
    if (customNote) {
      summaryChoiceText.textContent = `${selectedPlan.title} ("${customNote}")`;
    } else {
      summaryChoiceText.textContent = selectedPlan.title;
    }

    navigateTo('final');
  });

  // --- SCREEN 4: WHATSAPP INTEGRATION & SHARING ---
  function getRecipientNumber() {
    return localStorage.getItem('romantic_date_wa_phone') || DEFAULT_PHONE_NUMBER;
  }

  function generateWhatsAppMessage() {
    const customNote = dateSweetNoteInput.value.trim();
    let message = `Hey! 🥰 I opened your surprise and I said YES! 💖\n\n`;
    message += `Our plan: ${selectedPlan.title}\n`;
    if (customNote) {
      message += `My note: "${customNote}" 🍓\n`;
    }
    message += `\nNow you owe me that cute smile. Can’t wait to see you! ✨`;
    return message;
  }

  function openWhatsApp() {
    playSound('pop');
    const message = generateWhatsAppMessage();
    const encoded = encodeURIComponent(message);
    const phone = getRecipientNumber().replace(/[^0-9]/g, '');

    let waUrl = '';
    if (phone) {
      waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`;
    } else {
      waUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    }

    window.open(waUrl, '_blank');
  }

  btnSendWhatsApp.addEventListener('click', openWhatsApp);

  // Copy message button
  btnCopyReply.addEventListener('click', () => {
    playSound('select');
    const message = generateWhatsAppMessage();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(message).then(() => {
        copyBtnText.textContent = 'Copied to clipboard! 📋✨';
        setTimeout(() => {
          copyBtnText.textContent = 'Copy message to send anywhere 📋';
        }, 3000);
      }).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }

    function fallbackCopy() {
      const textarea = document.createElement('textarea');
      textarea.value = message;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      copyBtnText.textContent = 'Copied to clipboard! 📋✨';
      setTimeout(() => {
        copyBtnText.textContent = 'Copy message to send anywhere 📋';
      }, 3000);
    }
  });

  // Restart to relive experience
  btnRestart.addEventListener('click', () => {
    playSound('pop');
    dodgeCount = 0;
    btnYes.style.transform = 'scale(1)';
    dodgeContainer.style.transform = 'translate(0, 0)';
    dodgeBubble.classList.remove('show');
    mainEnvelope.classList.remove('opened');
    navigateTo('welcome');
  });

  // --- SETTINGS MODAL (PHONE CONFIG) ---
  configBtn.addEventListener('click', () => {
    phoneInput.value = getRecipientNumber();
    configModal.classList.add('show');
    configModal.setAttribute('aria-hidden', 'false');
  });

  closeModalBtn.addEventListener('click', () => {
    configModal.classList.remove('show');
    configModal.setAttribute('aria-hidden', 'true');
  });

  configModal.addEventListener('click', (e) => {
    if (e.target === configModal) {
      configModal.classList.remove('show');
      configModal.setAttribute('aria-hidden', 'true');
    }
  });

  savePhoneBtn.addEventListener('click', () => {
    const num = phoneInput.value.trim().replace(/[^0-9]/g, '');
    localStorage.setItem('romantic_date_wa_phone', num);
    configModal.classList.remove('show');
    configModal.setAttribute('aria-hidden', 'true');

    // Visual feedback
    configBtn.style.color = 'var(--color-pink-500)';
    setTimeout(() => {
      configBtn.style.color = '';
    }, 1500);
  });

  // --- CONFETTI & SPARKLE ANIMATIONS ---
  function triggerGrandCelebrationConfetti() {
    if (window.confetti) {
      // 1. Initial explosive multi-color burst
      window.confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF4D6D', '#FF758F', '#FFCCD5', '#FFD166', '#C9184A']
      });

      // 2. Cascading side cannons
      const end = Date.now() + 2.5 * 1000;
      const colors = ['#FF4D6D', '#FFB3C1', '#FFD166'];

      (function frame() {
        window.confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        window.confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }
  }

  function spawnEnvelopeSparkles() {
    if (window.confetti) {
      window.confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.45 },
        colors: ['#FF758F', '#FFD166', '#FFE3E8'],
        disableForReducedMotion: true
      });
    }
  }

  // --- AMBIENT FLOATING HEARTS & PARTICLES CANVAS ---
  const canvas = document.getElementById('ambient-canvas');
  const ctx = canvas.getContext('2d');
  let width, height;
  const particles = [];
  const maxParticles = 28;

  function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class HeartParticle {
    constructor(x, y) {
      this.reset(x, y);
    }

    reset(x, y) {
      this.x = x !== undefined ? x : Math.random() * width;
      this.y = y !== undefined ? y : height + Math.random() * 80;
      this.size = 10 + Math.random() * 18;
      this.speedY = 0.5 + Math.random() * 1.2;
      this.speedX = (Math.random() - 0.5) * 0.8;
      this.opacity = 0.15 + Math.random() * 0.45;
      this.fadeSpeed = 0.0015 + Math.random() * 0.002;
      this.rotation = (Math.random() - 0.5) * 0.6;
      this.rotationSpeed = (Math.random() - 0.5) * 0.015;
      this.color = Math.random() > 0.4 ? '#FF8FA3' : '#FFCCD5';
    }

    update() {
      this.y -= this.speedY;
      this.x += this.speedX + Math.sin(this.y * 0.01) * 0.5;
      this.rotation += this.rotationSpeed;
      this.opacity -= this.fadeSpeed;

      if (this.y < -30 || this.opacity <= 0) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = Math.max(0, this.opacity);
      ctx.fillStyle = this.color;

      // Draw vector heart shape
      const s = this.size;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.3);
      ctx.bezierCurveTo(-s * 0.6, -s * 0.3, -s, s * 0.4, 0, s);
      ctx.bezierCurveTo(s, s * 0.4, s * 0.6, -s * 0.3, 0, s * 0.3);
      ctx.fill();
      ctx.restore();
    }
  }

  // Populate particles
  for (let i = 0; i < maxParticles; i++) {
    const p = new HeartParticle();
    p.y = Math.random() * height; // initial random spread
    particles.push(p);
  }

  // Interactive hearts on touch or click
  function addTouchHeart(e) {
    const touch = e.touches ? e.touches[0] : e;
    if (particles.length < maxParticles + 15) {
      const p = new HeartParticle(touch.clientX, touch.clientY);
      p.speedY = 1.6 + Math.random() * 1.5;
      p.opacity = 0.7;
      particles.push(p);
    }
  }

  window.addEventListener('pointerdown', (e) => {
    // Only spawn if not clicking interactive buttons
    if (!e.target.closest('button, input, .date-option-card, .envelope-wrapper')) {
      addTouchHeart(e);
    }
  });

  function renderAmbient() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }
    requestAnimationFrame(renderAmbient);
  }
  renderAmbient();

})();
