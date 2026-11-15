// Virtual tour: 360 degree panoramas rendered from the studio's Revit model, shown on the inside of a sphere.
// Loaded only after the visitor presses "Start the tour" (see Tour.astro), so the page pays nothing before that.
// One instance per started tour: several tours can sit on one page and only the started ones load anything.
//
// Angles match tools/tour-render.py: yaw 0 is the middle of the panorama, yaw grows to the right, pitch is up.
import * as THREE from "three";

export interface TourSpot { to: string; yaw: number; pitch: number }
export interface TourRoom { slug: string; name: string; floor: string; yaw: number; pitch: number; spots: TourSpot[] }
export interface TourData { title?: string; rooms: TourRoom[] }

export interface TourOptions {
  root: HTMLElement;          // the element that goes full screen
  stage: HTMLElement;         // the box the canvas fills
  canvas: HTMLCanvasElement;
  spots: HTMLElement;         // hotspot buttons are created in here
  data: TourData;
  base: string;               // folder of the panoramas, with a trailing slash
  onRoom: (room: TourRoom) => void;
  onBusy: (busy: boolean, room: TourRoom) => void;
  onMoved: () => void;        // the visitor has looked around for the first time
}

export interface TourApi {
  go: (slug: string, keepHeading?: boolean) => Promise<boolean>;   // false when the picture did not arrive
  resize: () => void;
  current: () => string;
}

const RAD = Math.PI / 180;
const FOV_MIN = 35, FOV_MAX = 100, PITCH_MAX = 80;

export function createTour(o: TourOptions): TourApi {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saver = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

  const renderer = new THREE.WebGLRenderer({ canvas: o.canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  // small pictures on phones, on data saver, and where the card cannot take the large one
  const small = saver || window.matchMedia("(max-width: 760px)").matches || renderer.capabilities.maxTextureSize < 4096;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.1, 200);

  const geo = new THREE.SphereGeometry(50, 72, 48);
  geo.scale(-1, 1, 1);                                   // seen from the inside, not mirrored
  const makeBall = (order: number) => {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false }));
    m.renderOrder = order;
    m.visible = false;
    scene.add(m);
    return m;
  };
  let back = makeBall(0);                                // the room on show
  let front = makeBall(1);                               // the room fading in

  const rooms = new Map(o.data.rooms.map((r) => [r.slug, r]));
  let room = o.data.rooms[0];
  let yaw = room.yaw, pitch = room.pitch, fov = 70;
  let vy = 0, vp = 0;                                    // inertia, degrees per second
  let aim: { yaw: number; pitch: number } | null = null; // a turn in progress (keyboard focus on a hotspot)
  let drift = !reduce;                                   // a slow turn until the visitor touches it, never with reduced motion
  let driftLeft = 18;                                    // seconds
  let fade = 0, fading = false;
  let raf = 0, last = 0, moved = false;

  const loader = new THREE.TextureLoader();
  const load = (slug: string) => new Promise<THREE.Texture>((ok, fail) => {
    loader.load(`${o.base}${slug}${small ? "-sm" : ""}.webp`, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.generateMipmaps = true;
      ok(t);
    }, undefined, fail);
  });

  // ---- hotspots: real buttons laid over the canvas, moved to where their direction lands on screen
  const dirOf = (y: number, p: number, out: THREE.Vector3) => out.set(-Math.cos(p * RAD) * Math.cos(y * RAD), Math.sin(p * RAD), -Math.cos(p * RAD) * Math.sin(y * RAD));
  let spotEls: { el: HTMLButtonElement; spot: TourSpot }[] = [];
  const buildSpots = () => {
    o.spots.replaceChildren();
    spotEls = room.spots.map((spot) => {
      const target = rooms.get(spot.to)!;
      const el = document.createElement("button");
      el.type = "button";
      el.className = "tr-spot";
      el.setAttribute("aria-label", `Go to ${target.name}, ${target.floor}`);
      el.innerHTML = `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10l5-5 5 5"/></svg><span></span>`;
      el.querySelector("span")!.textContent = target.name;
      el.addEventListener("click", () => { void go(spot.to, true); });
      // reached with Tab while out of view: turn to face it
      el.addEventListener("focus", () => { if (el.classList.contains("is-off")) { turnTo(spot.yaw, Math.max(-15, Math.min(5, spot.pitch + 10))); } });
      o.spots.appendChild(el);
      return { el, spot };
    });
  };
  const v = new THREE.Vector3();
  const placeSpots = () => {
    const w = o.stage.clientWidth, h = o.stage.clientHeight;
    for (const { el, spot } of spotEls) {
      dirOf(spot.yaw, spot.pitch, v).multiplyScalar(10).project(camera);
      const x = (v.x * 0.5 + 0.5) * w, y = (-v.y * 0.5 + 0.5) * h;
      const on = v.z < 1 && x > 64 && x < w - 64 && y > 56 && y < h - 30;   // kept clear of the edges so a label is never cut
      el.classList.toggle("is-off", !on);
      if (on) el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) translate(-50%, -50%)`;
    }
  };

  // ---- drawing: only while something is changing
  const look = new THREE.Vector3();
  const draw = () => {
    camera.fov = fov;
    camera.updateProjectionMatrix();
    camera.lookAt(dirOf(yaw, pitch, look));
    camera.updateMatrixWorld();
    renderer.render(scene, camera);
    placeSpots();
  };
  const turnBy = (dy: number, dp: number) => {
    yaw = (yaw + dy + 360) % 360;
    pitch = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, pitch + dp));
  };
  const frame = (now: number) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    let busy = false;
    if (fading) {
      fade = Math.min(1, fade + dt / 0.45);
      (front.material as THREE.MeshBasicMaterial).opacity = fade * fade * (3 - 2 * fade);
      if (fade >= 1) endFade();
      busy = true;
    }
    if (aim) {
      const dy = ((aim.yaw - yaw + 540) % 360) - 180, dp = aim.pitch - pitch;
      if (Math.abs(dy) < 0.3 && Math.abs(dp) < 0.3) { turnBy(dy, dp); aim = null; }
      else { const k = 1 - Math.exp(-dt * 7); turnBy(dy * k, dp * k); busy = true; }
    } else if (Math.abs(vy) > 0.5 || Math.abs(vp) > 0.5) {
      turnBy(vy * dt, vp * dt);
      const k = Math.exp(-dt * 4.5);
      vy *= k; vp *= k;
      busy = true;
    } else if (drift && !held.size && driftLeft > 0) {
      turnBy(2.2 * dt, 0);
      driftLeft -= dt;
      busy = true;
    }
    draw();
    if (busy) kick();
  };
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const touched = () => {
    drift = false;
    if (!moved) { moved = true; o.onMoved(); }
  };
  const turnTo = (y: number, p: number) => {
    touched();
    vy = vp = 0;
    if (reduce) { yaw = (y + 360) % 360; pitch = p; aim = null; } else aim = { yaw: (y + 360) % 360, pitch: p };
    kick();
  };

  // ---- changing room
  const endFade = () => {
    fading = false;
    const old = (back.material as THREE.MeshBasicMaterial).map;
    back.visible = false;
    (back.material as THREE.MeshBasicMaterial).map = null;
    old?.dispose();                                      // one panorama in memory at a time
    [back, front] = [front, back];
    back.renderOrder = 0; front.renderOrder = 1;
    (back.material as THREE.MeshBasicMaterial).opacity = 1;
  };
  let ticket = 0;
  const go = async (slug: string, keepHeading = false) => {
    const next = rooms.get(slug);
    if (!next) return false;
    if (next === room && back.visible) return true;
    const mine = ++ticket;
    o.onBusy(true, next);
    let tex: THREE.Texture;
    try { tex = await load(slug); } catch { if (mine === ticket) o.onBusy(false, room); return false; }
    if (mine !== ticket) { tex.dispose(); return true; } // a newer choice won
    if (fading) endFade();
    const mat = front.material as THREE.MeshBasicMaterial;
    mat.map = tex; mat.needsUpdate = true;
    front.visible = true;
    room = next;
    vy = vp = 0; aim = null;
    if (!keepHeading) { yaw = next.yaw; pitch = next.pitch; } else pitch = Math.max(-10, Math.min(10, pitch));
    buildSpots();
    o.onRoom(next);
    o.onBusy(false, next);
    if (reduce || !back.visible) { mat.opacity = 1; fade = 1; fading = true; endFade(); }
    else { fade = 0; mat.opacity = 0; fading = true; }
    kick();
    return true;
  };

  // ---- pointer: drag to look, two fingers to zoom
  const held = new Map<number, { x: number; y: number }>();
  let pinch = 0, lastT = 0;
  const perPx = () => fov / o.stage.clientHeight;         // degrees per pixel, so the picture follows the finger
  o.canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    o.canvas.setPointerCapture(e.pointerId);
    held.set(e.pointerId, { x: e.clientX, y: e.clientY });
    vy = vp = 0; aim = null; lastT = performance.now();
    if (held.size === 2) { const [a, b] = [...held.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); }
    touched();
    o.canvas.classList.add("is-drag");
  });
  o.canvas.addEventListener("pointermove", (e) => {
    const p = held.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (held.size === 2) {
      const [a, b] = [...held.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch > 0 && d > 0) fov = Math.max(FOV_MIN, Math.min(FOV_MAX, fov * (pinch / d)));
      pinch = d;
    } else {
      const k = perPx();
      turnBy(-dx * k, dy * k);
      const now = performance.now(), dt = Math.max(0.008, (now - lastT) / 1000);
      lastT = now;
      if (!reduce) { vy = vy * 0.6 + (-dx * k / dt) * 0.4; vp = vp * 0.6 + (dy * k / dt) * 0.4; }
    }
    kick();
  });
  const release = (e: PointerEvent) => {
    if (!held.delete(e.pointerId)) return;
    pinch = 0;
    if (!held.size) {
      o.canvas.classList.remove("is-drag");
      if (performance.now() - lastT > 90) vy = vp = 0;   // the hand stopped before letting go
      vy = Math.max(-240, Math.min(240, vy)); vp = Math.max(-160, Math.min(160, vp));
      kick();
    }
  };
  o.canvas.addEventListener("pointerup", release);
  o.canvas.addEventListener("pointercancel", release);
  // the wheel zooms only once the view has been clicked or is full screen, so it never traps page scrolling
  o.canvas.addEventListener("wheel", (e) => {
    if (document.activeElement !== o.canvas && !document.fullscreenElement) return;
    const next = Math.max(FOV_MIN, Math.min(FOV_MAX, fov + Math.sign(e.deltaY) * 4));
    if (next === fov) return;
    e.preventDefault();
    fov = next; touched(); kick();
  }, { passive: false });

  // ---- keyboard: arrows turn, plus and minus zoom
  o.root.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const step = 14;
    let used = true;
    if (e.key === "ArrowLeft") turnTo(yaw - step, pitch);
    else if (e.key === "ArrowRight") turnTo(yaw + step, pitch);
    else if (e.key === "ArrowUp") turnTo(yaw, Math.min(PITCH_MAX, pitch + step * 0.7));
    else if (e.key === "ArrowDown") turnTo(yaw, Math.max(-PITCH_MAX, pitch - step * 0.7));
    else if (e.key === "+" || e.key === "=") { fov = Math.max(FOV_MIN, fov - 6); touched(); kick(); }
    else if (e.key === "-" || e.key === "_") { fov = Math.min(FOV_MAX, fov + 6); touched(); kick(); }
    else used = false;
    if (used) e.preventDefault();
  });

  const resize = () => {
    const w = o.stage.clientWidth, h = o.stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (!moved) fov = w / h > 1 ? 70 : 88;               // an upright stage needs a wider lens to read as a room
    kick();
  };
  new ResizeObserver(resize).observe(o.stage);
  o.canvas.addEventListener("webglcontextrestored", () => kick());
  resize();

  return { go, resize, current: () => room.slug };
}
