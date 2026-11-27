/**
 * Sonido de venta al agregar un producto al carrito.
 *
 * Se genera completamente con la Web Audio API: no necesita ningún archivo de
 * audio externo, funciona en todos los navegadores modernos y pesa 0 bytes
 * adicionales en la descarga.
 *
 * El sonido es un acorde breve de dos tonos ascendentes (do → mi, estilo caja
 * registradora suave) con un envolvente rápido para que sea agradable y no
 * moleste en tiendas con mucho tráfico.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return ctx;
}

/** Toca una nota simple con envolvente suave. */
function playNote(
  context: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  gainPeak: number
): void {
  const osc = context.createOscillator();
  const gain = context.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, startTime);

  // Envolvente: ataque rápido → decaimiento suave
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(context.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

/**
 * Reproduce el sonido de «ítem agregado al carrito».
 * Dos tonos ascendentes (do5 → mi5) con un breve delay entre ellos.
 * No hace nada si el navegador no soporta la Web Audio API.
 */
export function playSaleSound(): void {
  const context = getCtx();
  if (!context) return;

  // Desbloquea el contexto si el navegador lo tenía suspendido (política de iOS/Chrome)
  if (context.state === "suspended") {
    context.resume().catch(() => {});
  }

  const now = context.currentTime;

  // Primera nota: Do5 (523 Hz)
  playNote(context, 523.25, now, 0.18, 0.28);
  // Segunda nota: Mi5 (659 Hz), 100 ms después
  playNote(context, 659.25, now + 0.1, 0.22, 0.22);
  // Tercera nota (opcional armónico): Sol5 (784 Hz), sutil
  playNote(context, 784.0, now + 0.19, 0.18, 0.1);
}
