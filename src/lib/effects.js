// Shared celebration effects

export async function fireConfetti() {
  try {
    const confetti = (await import('canvas-confetti')).default;
    const end = Date.now() + 600;
    const colors = ['#34d399', '#f59e0b', '#60a5fa', '#a78bfa'];
    (function frame() {
      confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  } catch {}
}

export function playVictorySound() {
  // Try to play /victory.mp3 if present; fallback to WebAudio jingle
  const tryHtmlAudio = () => new Promise((resolve, reject) => {
    try {
      const a = new Audio('/victory.mp3');
      a.volume = 0.4;
      a.oncanplay = () => { a.play().then(resolve).catch(reject); };
      a.onerror = () => reject(new Error('audio load error'));
      // Safari compatibility: attempt play after small delay
      setTimeout(() => a.play().then(resolve).catch(reject), 50);
    } catch (e) { reject(e); }
  });

  const playWebAudio = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = freq;
        o.connect(g);
        g.connect(ctx.destination);
        const start = now + i * 0.08;
        const end = start + 0.2;
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, end);
        o.start(start);
        o.stop(end + 0.02);
      });
      setTimeout(() => ctx.close().catch(() => {}), 600);
    } catch {}
  };

  tryHtmlAudio().catch(playWebAudio);
}
