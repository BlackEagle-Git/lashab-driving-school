"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Actor, SceneConfig, Vec2 } from "@/lib/scenarios";

export type Stage = "ready" | "playing" | "paused" | "solution";

const ROAD = "#8b97a4";
const LINE = "#f3f6f8";
const GRASS = "#dcebd6";
const CURB = "#eef1ea";

type Route = { pts: Vec2[]; cum: number[]; total: number };
type Leg = { route: Route; t0: number; t1: number; ease: string };
type Tracked = { group: THREE.Group; spec: Actor; wheels: THREE.Mesh[]; lamps: THREE.MeshStandardMaterial[]; legs: Leg[] };

/** Rounds every interior corner of a polyline with a circular fillet so a car
 *  sweeps through a junction on a believable arc instead of pivoting in place. */
function filletPath(points: Vec2[], radius: number): Vec2[] {
  if (points.length < 3 || radius <= 0) return points.slice();
  const out: Vec2[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i - 1], c = points[i], n = points[i + 1];
    const v1x = p[0] - c[0], v1z = p[1] - c[1];
    const v2x = n[0] - c[0], v2z = n[1] - c[1];
    const l1 = Math.hypot(v1x, v1z), l2 = Math.hypot(v2x, v2z);
    if (l1 < 1e-4 || l2 < 1e-4) continue;
    const u1: Vec2 = [v1x / l1, v1z / l1], u2: Vec2 = [v2x / l2, v2z / l2];
    const dot = Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1]));
    const theta = Math.acos(dot);
    if (theta > Math.PI - 0.06 || theta < 0.06) { out.push(c); continue; }
    const half = Math.tan(theta / 2);
    const tan = Math.min(radius / half, l1 * 0.5, l2 * 0.5);
    const rr = tan * half;
    const a: Vec2 = [c[0] + u1[0] * tan, c[1] + u1[1] * tan];
    const b: Vec2 = [c[0] + u2[0] * tan, c[1] + u2[1] * tan];
    const bix = u1[0] + u2[0], biz = u1[1] + u2[1];
    const bl = Math.hypot(bix, biz) || 1;
    const dist = rr / Math.sin(theta / 2);
    const center: Vec2 = [c[0] + (bix / bl) * dist, c[1] + (biz / bl) * dist];
    const a0 = Math.atan2(a[1] - center[1], a[0] - center[0]);
    const a1 = Math.atan2(b[1] - center[1], b[0] - center[0]);
    let d = a1 - a0;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    const steps = Math.max(5, Math.ceil(Math.abs(d) / 0.16));
    for (let s = 0; s <= steps; s++) {
      const ang = a0 + d * (s / steps);
      out.push([center[0] + Math.cos(ang) * rr, center[1] + Math.sin(ang) * rr]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

function makeRoute(points: Vec2[], radius: number): Route {
  const pts = filletPath(points, radius);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, total: cum[cum.length - 1] || 1 };
}

/** Position + heading at a normalised distance along the route. */
function sampleRoute(route: Route, p: number): { x: number; z: number; heading: number } {
  const target = THREE.MathUtils.clamp(p, 0, 1) * route.total;
  let i = 1;
  while (i < route.cum.length - 1 && route.cum[i] < target) i++;
  const segLen = route.cum[i] - route.cum[i - 1] || 1;
  const local = (target - route.cum[i - 1]) / segLen;
  const a = route.pts[i - 1], b = route.pts[i];
  const x = a[0] + (b[0] - a[0]) * local;
  const z = a[1] + (b[1] - a[1]) * local;
  const dx = b[0] - a[0], dz = b[1] - a[1];
  return { x, z, heading: Math.abs(dx) < 1e-6 && Math.abs(dz) < 1e-6 ? 0 : Math.atan2(-dx, -dz) };
}

export default function RoadScene3D({ config, stage, duration = 3400, pauseAt = 1 }: { config: SceneConfig; stage: Stage; duration?: number; pauseAt?: number }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Stage>(stage);
  stageRef.current = stage;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const night = config.weather === "night";
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(night ? "#1d2338" : config.weather === "fog" ? "#dfe5ee" : "#eaf0fa");
    if (config.weather === "fog") scene.fog = new THREE.Fog(0xdfe5ee, 16, 52);
    if (config.weather === "rain") scene.fog = new THREE.Fog(0xccd7e6, 22, 62);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    const camera = new THREE.OrthographicCamera(-14, 14, 11, -11, 0.1, 220);
    camera.position.set(15, 19, 22);
    camera.lookAt(0, 0, 1.5);

    const sunColor = night ? 0x8ea4d8 : 0xfff3e0;
    scene.add(new THREE.HemisphereLight(night ? 0x6e7ea8 : 0xffffff, night ? 0x1b2135 : 0xcedcc6, night ? 0.5 : 1));
    const sun = new THREE.DirectionalLight(sunColor, config.weather === "fog" ? 0.8 : night ? 0.55 : 1.5);
    sun.position.set(13, 21, 11);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -20; sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 20; sun.shadow.camera.bottom = -20;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 70;
    sun.shadow.bias = -0.0015; sun.shadow.normalBias = 0.03;
    sun.shadow.camera.updateProjectionMatrix();
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xbed3ff, 0.32);
    fill.position.set(-14, 11, -9);
    scene.add(fill);

    const disposables: Array<{ dispose: () => void }> = [];
    const track = <T extends THREE.BufferGeometry | THREE.Material | THREE.Texture>(item: T): T => { disposables.push(item); return item; };
    const std = (color: string, opts: THREE.MeshStandardMaterialParameters = {}) => track(new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, ...opts }));

    const box = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, rounded = 0) => {
      const geo = rounded > 0 ? track(new RoundedBoxGeometry(w, h, d, 3, rounded)) : track(new THREE.BoxGeometry(w, h, d));
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    };

    // ── Diorama base: a flat 2D world given real thickness ──────────────
    const grassMat = std(night ? "#2a3a32" : GRASS);
    const soilMat = std(night ? "#20283c" : "#cbb79c");
    box(30, 1, 30, grassMat, 0, -0.5, 0).castShadow = false;
    box(30.7, 0.7, 30.7, soilMat, 0, -1.3, 0).castShadow = false;

    const roadMat = std(night ? "#39414f" : ROAD, { roughness: config.weather === "rain" ? 0.35 : 0.95 });
    const lineMat = std(LINE, { roughness: 0.6 });
    const curbMat = std(night ? "#3b4458" : CURB);

    const flat = (w: number, d: number, mat: THREE.Material, x: number, z: number, y = 0.07, h = 0.14) => {
      const mesh = box(w, h, d, mat, x, y, z);
      mesh.castShadow = false;
      return mesh;
    };
    const paint = (w: number, d: number, x: number, z: number) => flat(w, d, lineMat, x, z, 0.155, 0.02);

    const dashes = (axis: "x" | "z", at: number, from: number, to: number, skip?: [number, number]) => {
      for (let p = from; p < to; p += 2.4) {
        if (skip && p > skip[0] - 1.2 && p < skip[1] + 1.2) continue;
        if (axis === "z") paint(0.16, 1.2, at, p); else paint(1.2, 0.16, p, at);
      }
    };
    const curbPad = (x: number, z: number, w = 10, d = 10) => {
      const pad = box(w, 0.26, d, curbMat, x, 0.13, z);
      pad.castShadow = false;
    };

    const tree = (x: number, z: number, s = 1) => {
      box(0.28 * s, 1.1 * s, 0.28 * s, std("#8d6a4b"), x, 0.55 * s + 0.26, z);
      const crown = new THREE.Mesh(track(new THREE.IcosahedronGeometry(0.85 * s, 0)), std(night ? "#2f4f3c" : "#78bb85", { flatShading: true }));
      crown.position.set(x, 1.65 * s + 0.26, z);
      crown.castShadow = true;
      scene.add(crown);
    };
    const building = (x: number, z: number, w: number, h: number, d: number, color: string) => {
      box(w, h, d, std(color), x, h / 2 + 0.26, z, 0.12);
      box(w * 0.78, 0.22, d * 0.78, std(night ? "#4a5570" : "#e4e8f2"), x, h + 0.38, z);
    };

    // ── Layout ──────────────────────────────────────────────────────────
    const layout = config.layout;
    if (layout === "roundabout") {
      const ring = new THREE.Mesh(track(new THREE.RingGeometry(3.5, 6.8, 64)), roadMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.14;
      ring.receiveShadow = true;
      scene.add(ring);
      const isl = new THREE.Mesh(track(new THREE.CylinderGeometry(3.5, 3.6, 0.42, 48)), std(night ? "#2d3f36" : "#cde3c4"));
      isl.position.y = 0.21; isl.receiveShadow = true; isl.castShadow = true;
      scene.add(isl);
      tree(0, 0, 1.3); tree(-1.5, 1.2, 0.8); tree(1.4, -1.1, 0.9);
      flat(3, 9, roadMat, 0, 10.3); flat(3, 9, roadMat, 0, -10.3);
      flat(9, 3, roadMat, 10.3, 0); flat(9, 3, roadMat, -10.3, 0);
      curbPad(10, 10, 12, 12); curbPad(-10, 10, 12, 12); curbPad(10, -10, 12, 12); curbPad(-10, -10, 12, 12);
      tree(8.5, 8.5); tree(-8.6, 9.2, 1.1); tree(9.4, -8.8, 0.9);
      building(-9.5, -9.5, 5.5, 3.4, 5, night ? "#39425c" : "#f0e2da");
    } else if (layout === "parking") {
      flat(6, 28, roadMat, 0, 0);
      dashes("z", 0, -13, 13);
      flat(7, 17, roadMat, 6.6, -1);
      for (let i = 0; i < 5; i++) paint(6.6, 0.14, 6.6, -8.4 + i * 4);
      curbPad(-9, 0, 12, 28);
      curbPad(13.5, 0, 6, 28);
      tree(-6.4, 6); tree(-6.6, -2, 1.2); tree(-6.2, -9, 0.9);
      building(-11, 7, 6, 3.6, 7, night ? "#39425c" : "#eee2f1");
      building(-11, -6, 6, 4.2, 8, night ? "#333c55" : "#e2e9f4");
    } else if (layout === "dual") {
      flat(13, 28, roadMat, 1, 0);
      flat(0.9, 28, std(night ? "#2f4034" : "#cfe3c6"), -4.9, 0, 0.16, 0.18);
      dashes("z", 2.4, -13, 13);
      dashes("z", 4.6, -13, 13);
      paint(0.16, 28, -0.3, 0);
      paint(0.16, 28, 7.3, 0);
      curbPad(-10, 0, 10, 28);
      curbPad(13.5, 0, 7, 28);
      tree(-8, 7); tree(-8.4, -3, 1.2); tree(11.5, 5, 1.1); tree(11.8, -6);
    } else if (layout === "rail") {
      flat(6, 28, roadMat, 0, 0);
      dashes("z", 0, -13, 13, [-2.6, 2.6]);
      paint(0.16, 28, 2.9, 0);
      paint(0.16, 28, -2.9, 0);
      const ballast = box(30, 0.2, 3.4, std(night ? "#3a3f4d" : "#b9b0a2"), 0, 0.12, 0);
      ballast.castShadow = false;
      for (let s = -14; s <= 14; s += 1.3) {
        const sleeper = box(0.45, 0.14, 2.9, std(night ? "#4a4036" : "#8b7252"), s, 0.24, 0);
        sleeper.castShadow = false;
      }
      const railMat = std("#cdd4dd", { metalness: 0.55, roughness: 0.35 });
      [-0.75, 0.75].forEach(rz => { const r = box(30, 0.14, 0.16, railMat, 0, 0.35, rz); r.castShadow = false; });
      paint(6, 0.2, 0, 3.6); paint(6, 0.2, 0, -3.6);
      [[3.9, 3.9], [-3.9, -3.9]].forEach(([bx, bz]) => {
        box(0.2, 2.4, 0.2, std("#e6e9ee"), bx, 1.2 + 0.26, bz);
        box(0.34, 0.9, 0.34, std("#d8403f"), bx, 2.75, bz, 0.08);
        const beam = box(0.16, 0.22, 6.2, std("#eceff3"), bx, 1.35, bz > 0 ? bz - 3.1 : bz + 3.1);
        beam.castShadow = true;
      });
      curbPad(-9.5, 8, 11, 12); curbPad(9.5, 8, 11, 12);
      curbPad(-9.5, -8, 11, 12); curbPad(9.5, -8, 11, 12);
      tree(-6.6, 8.5); tree(6.8, 9.2, 1.2); tree(-6.9, -8.8, 1.1); tree(6.6, -7.6);
    } else {
      const vertical = layout !== "tjunction" ? 28 : 13;
      const vz = layout !== "tjunction" ? 0 : 7.5;
      flat(6, vertical, roadMat, 0, vz);
      if (layout === "cross" || layout === "tjunction") {
        flat(28, 6, roadMat, 0, 0);
        dashes("x", 0, -13, 13, [-3.2, 3.2]);
        paint(0.16, 0.9, 0, 3.4);
      }
      dashes("z", 0, layout === "tjunction" ? 3.4 : -13, 13, layout === "cross" ? [-3.2, 3.2] : undefined);
      paint(0.16, vertical, 2.9, vz);
      paint(0.16, vertical, -2.9, vz);
      if (layout === "cross") {
        curbPad(8, 8); curbPad(-8, 8); curbPad(8, -8); curbPad(-8, -8);
        tree(6.5, 6.6); tree(-6.4, 7.2, 1.2); tree(6.8, -6.5, 0.9); tree(-7, -7, 1.1);
        building(10.5, 9.5, 6, 3.8, 6, night ? "#39425c" : "#f3e4dd");
        building(-10.5, 9.8, 5.5, 3, 5.5, night ? "#333c55" : "#e3e9f6");
        building(10.8, -10, 6, 4.4, 6, night ? "#3a4158" : "#eee3f3");
      } else if (layout === "tjunction") {
        curbPad(8, 8); curbPad(-8, 8); curbPad(0, -9, 28, 10);
        tree(6.5, 6.6); tree(-6.4, 7.2, 1.2); tree(-3, -6.5); tree(4, -6.8, 1.2);
      } else {
        curbPad(-8.5, 0, 11, 28); curbPad(8.5, 0, 11, 28);
        tree(-6.2, 7); tree(-6.4, -1, 1.2); tree(-6, -9, 0.9);
        tree(6.3, 9, 1.1); tree(6.5, 1); tree(6.2, -7, 1.2);
        building(-11, 4, 6, 3.6, 8, night ? "#39425c" : "#f1e3dc");
        building(11, -3, 6, 4.2, 9, night ? "#333c55" : "#e3e8f5");
      }
    }

    if (config.crosswalk) {
      for (let i = 0; i < 7; i++) paint(0.42, 2.4, -2.55 + i * 0.85, 4.4);
    }

    // ── Signs & traffic lights ──────────────────────────────────────────
    const svgTexture = (url: string, onReady?: () => void) => {
      const tex = track(new THREE.Texture());
      tex.colorSpace = THREE.SRGBColorSpace;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 256; canvas.height = 256;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 256, 256);
        tex.image = canvas;
        tex.needsUpdate = true;
        onReady?.();
      };
      img.src = url;
      return tex;
    };

    (config.signs ?? []).forEach(prop => {
      const [x, z] = prop.at;
      box(0.09, 1.55, 0.09, std("#9ba5b1", { metalness: 0.2, roughness: 0.6 }), x, 0.77 + 0.26, z);
      let plate: THREE.Mesh | null = null;
      const texture = svgTexture(prop.icon, () => { if (plate) plate.visible = true; });
      const mat = track(new THREE.MeshStandardMaterial({ map: texture, transparent: true, alphaTest: 0.25, roughness: 0.75, metalness: 0, side: THREE.DoubleSide }));
      plate = new THREE.Mesh(track(new THREE.PlaneGeometry(1.35, 1.35)), mat);
      plate.position.set(x, 2.1, z);
      plate.rotation.y = prop.facing ?? 0;
      plate.castShadow = true;
      plate.visible = false;
      scene.add(plate);
    });

    const lampMats: { mat: THREE.MeshStandardMaterial; on: boolean }[] = [];
    (config.lights ?? []).forEach(spec => {
      const [x, z] = spec.at;
      box(0.13, 2.3, 0.13, std("#78828f", { metalness: 0.3, roughness: 0.5 }), x, 1.15 + 0.26, z);
      box(0.52, 1.35, 0.36, std("#2f3845"), x, 2.55, z, 0.1);
      const states: Array<{ color: string; y: number; active: boolean }> = [
        { color: "#ff5a63", y: 3.0, active: spec.state === "red" },
        { color: "#ffb84d", y: 2.55, active: spec.state === "orange" },
        { color: "#4fd894", y: 2.1, active: spec.state === "green" },
      ];
      states.forEach(s => {
        const mat = track(new THREE.MeshStandardMaterial({ color: s.active ? s.color : "#5a6472", emissive: new THREE.Color(s.active ? s.color : "#000000"), emissiveIntensity: s.active ? 1.5 : 0, roughness: 0.4 }));
        const bulb = new THREE.Mesh(track(new THREE.SphereGeometry(0.15, 18, 18)), mat);
        bulb.position.set(x, s.y, z + 0.2);
        scene.add(bulb);
        if (s.active) lampMats.push({ mat, on: true });
      });
    });

    // ── Actors ──────────────────────────────────────────────────────────
    const wheelGeo = track(new THREE.CylinderGeometry(0.33, 0.33, 0.26, 16));
    const wheelMat = std("#272f3b", { roughness: 0.7 });
    const glassMat = std(night ? "#5e7aa5" : "#bcd9ea", { roughness: 0.25, metalness: 0.15 });
    const headMat = track(new THREE.MeshStandardMaterial({ color: "#fff6d2", emissive: new THREE.Color("#fff0b8"), emissiveIntensity: night ? 2 : 0.7, roughness: 0.3 }));
    const tailMat = track(new THREE.MeshStandardMaterial({ color: "#ff6b6b", emissive: new THREE.Color("#ff3b3b"), emissiveIntensity: 1.1, roughness: 0.3 }));

    const addWheels = (group: THREE.Group, halfW: number, dz: number, wheels: THREE.Mesh[]) => {
      [[-halfW, dz], [halfW, dz], [-halfW, -dz], [halfW, -dz]].forEach(([wx, wz]) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.33, wz);
        wheel.castShadow = true;
        group.add(wheel);
        wheels.push(wheel);
      });
    };

    const buildActor = (spec: Actor) => {
      const group = new THREE.Group();
      const wheels: THREE.Mesh[] = [];
      const lamps: THREE.MeshStandardMaterial[] = [];
      const color = spec.color ?? "#6a63ef";
      const bodyMat = std(color, { roughness: 0.55, metalness: 0.08 });

      if (spec.kind === "pedestrian") {
        const legs = new THREE.Mesh(track(new THREE.CapsuleGeometry(0.17, 0.42, 4, 12)), std("#3c4560"));
        legs.position.y = 0.5; legs.castShadow = true; group.add(legs);
        const torso = new THREE.Mesh(track(new THREE.CapsuleGeometry(0.22, 0.4, 4, 12)), bodyMat);
        torso.position.y = 1.02; torso.castShadow = true; group.add(torso);
        const head = new THREE.Mesh(track(new THREE.SphereGeometry(0.21, 18, 18)), std("#e3b291"));
        head.position.y = 1.44; head.castShadow = true; group.add(head);
      } else if (spec.kind === "bike") {
        const frame = new THREE.Mesh(track(new THREE.BoxGeometry(0.28, 0.16, 1.5)), bodyMat);
        frame.position.y = 0.52; frame.castShadow = true; group.add(frame);
        const rider = new THREE.Mesh(track(new THREE.CapsuleGeometry(0.23, 0.5, 4, 12)), std("#44507a"));
        rider.position.set(0, 1.05, 0.05); rider.castShadow = true; group.add(rider);
        const head = new THREE.Mesh(track(new THREE.SphereGeometry(0.2, 16, 16)), std("#f0d27a"));
        head.position.set(0, 1.48, 0.05); head.castShadow = true; group.add(head);
        [0.62, -0.62].forEach(wz => {
          const wheel = new THREE.Mesh(track(new THREE.TorusGeometry(0.33, 0.055, 10, 24)), wheelMat);
          wheel.position.set(0, 0.33, wz); wheel.castShadow = true;
          group.add(wheel); wheels.push(wheel);
        });
      } else if (spec.kind === "truck" || spec.kind === "bus" || spec.kind === "tram" || spec.kind === "train") {
        const long = spec.kind === "train" ? 12 : spec.kind === "tram" ? 8.4 : spec.kind === "bus" ? 6.6 : 5.6;
        const wide = spec.kind === "train" || spec.kind === "tram" ? 2.3 : 2.1;
        const tall = spec.kind === "truck" ? 1.5 : 1.9;
        const body = new THREE.Mesh(track(new RoundedBoxGeometry(wide, tall, long, 3, 0.22)), bodyMat);
        body.position.y = tall / 2 + 0.3; body.castShadow = true; body.receiveShadow = true;
        group.add(body);
        const glass = new THREE.Mesh(track(new THREE.BoxGeometry(wide * 0.92, tall * 0.42, 0.12)), glassMat);
        glass.position.set(0, tall * 0.78, -long / 2 - 0.01); group.add(glass);
        for (let i = 0; i < (spec.kind === "truck" ? 2 : spec.kind === "train" ? 5 : 3); i++) {
          const side = new THREE.Mesh(track(new THREE.BoxGeometry(wide + 0.04, 0.55, 1.5)), glassMat);
          side.position.set(0, tall * 0.72, -long / 4 + i * 1.9);
          group.add(side);
        }
        if (spec.kind !== "tram" && spec.kind !== "train") addWheels(group, wide / 2 - 0.08, long / 2 - 1.1, wheels);
        const lampL = new THREE.Mesh(track(new THREE.BoxGeometry(0.34, 0.2, 0.1)), headMat);
        lampL.position.set(-wide / 2 + 0.38, 0.85, -long / 2 - 0.04); group.add(lampL);
        const lampR = lampL.clone(); lampR.position.x = wide / 2 - 0.38; group.add(lampR);
      } else {
        const body = new THREE.Mesh(track(new RoundedBoxGeometry(1.75, 0.62, 3.7, 4, 0.3)), bodyMat);
        body.position.y = 0.6; body.castShadow = true; body.receiveShadow = true;
        group.add(body);
        const cabin = new THREE.Mesh(track(new RoundedBoxGeometry(1.52, 0.6, 1.9, 4, 0.26)), bodyMat);
        cabin.position.set(0, 1.08, -0.12); cabin.castShadow = true;
        group.add(cabin);
        const windshield = new THREE.Mesh(track(new THREE.BoxGeometry(1.42, 0.42, 1.72)), glassMat);
        windshield.position.set(0, 1.18, -0.12);
        group.add(windshield);
        addWheels(group, 0.86, 1.16, wheels);
        [[-0.52, -1.85], [0.52, -1.85]].forEach(([lx, lz]) => {
          const lamp = new THREE.Mesh(track(new THREE.BoxGeometry(0.34, 0.16, 0.1)), headMat);
          lamp.position.set(lx, 0.66, lz); group.add(lamp);
        });
        [[-0.56, 1.85], [0.56, 1.85]].forEach(([lx, lz]) => {
          const mat = spec.brake ? tailMat : track(new THREE.MeshStandardMaterial({ color: "#c0545b", emissive: new THREE.Color("#8d2f36"), emissiveIntensity: 0.4, roughness: 0.4 }));
          const lamp = new THREE.Mesh(track(new THREE.BoxGeometry(0.34, 0.16, 0.1)), mat);
          lamp.position.set(lx, 0.66, lz); group.add(lamp);
        });
        if (spec.siren) {
          const barMat = track(new THREE.MeshStandardMaterial({ color: "#4f7dff", emissive: new THREE.Color("#4f7dff"), emissiveIntensity: 1.8, roughness: 0.4 }));
          const bar = new THREE.Mesh(track(new THREE.BoxGeometry(1.1, 0.16, 0.3)), barMat);
          bar.position.set(0, 1.46, -0.1); group.add(bar);
          lamps.push(barMat);
          const cross = new THREE.Mesh(track(new THREE.BoxGeometry(0.9, 0.02, 0.26)), std("#e24b5c"));
          cross.position.set(0, 1.39, 1.2); cross.rotation.x = Math.PI / 2; group.add(cross);
        }
      }

      if (spec.hero) {
        const ring = new THREE.Mesh(track(new THREE.RingGeometry(1.5, 1.78, 40)), track(new THREE.MeshBasicMaterial({ color: "#6a63ef", transparent: true, opacity: 0.6, side: THREE.DoubleSide, toneMapped: false })));
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.17;
        group.add(ring);
      }

      if (spec.label) {
        const canvas = document.createElement("canvas");
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.beginPath(); ctx.arc(64, 64, 50, 0, Math.PI * 2);
          ctx.fillStyle = color; ctx.fill();
          ctx.lineWidth = 9; ctx.strokeStyle = "#ffffff"; ctx.stroke();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 62px 'DM Sans', Arial, sans-serif";
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(spec.label, 64, 68);
        }
        const tex = track(new THREE.CanvasTexture(canvas));
        tex.colorSpace = THREE.SRGBColorSpace;
        const badge = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: tex, depthTest: false, depthWrite: false, toneMapped: false, sizeAttenuation: true })));
        badge.scale.set(1.75, 1.75, 1);
        badge.position.y = spec.kind === "tram" || spec.kind === "train" || spec.kind === "bus" ? 3.5 : 2.75;
        badge.renderOrder = 999;
        group.add(badge);
      }

      // Pre-compute every timed leg as a smooth, corner-filleted route.
      const legs: Leg[] = [];
      if (spec.moves?.length) {
        spec.moves.forEach(move => {
          if (move.path.length < 2) return;
          legs.push({ route: makeRoute(move.path, move.r ?? 2.2), t0: move.t0, t1: move.t1, ease: move.ease ?? "inout" });
        });
      } else if (spec.from && spec.to) {
        legs.push({ route: makeRoute([spec.from, spec.to], 0), t0: spec.t0 ?? 0, t1: spec.t1 ?? 1, ease: spec.brake ? "out" : "inout" });
      }

      scene.add(group);
      return { group, spec, wheels, lamps, legs } satisfies Tracked;
    };

    const actors: Tracked[] = config.actors.map(buildActor);

    // ── Rain ────────────────────────────────────────────────────────────
    let rain: THREE.Points | null = null;
    if (config.weather === "rain") {
      const count = 420;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 1] = Math.random() * 14 + 1;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      }
      const geo = track(new THREE.BufferGeometry());
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      rain = new THREE.Points(geo, track(new THREE.PointsMaterial({ color: "#d7e6ff", size: 0.13, transparent: true, opacity: 0.8, toneMapped: false })));
      scene.add(rain);
    }

    // ── Animation ───────────────────────────────────────────────────────
    const easeOut = (p: number) => 1 - Math.pow(1 - p, 2.4);
    const easeIn = (p: number) => p * p;
    const easeInOut = (p: number) => p * p * (3 - 2 * p);
    const applyEase = (p: number, kind: string) => kind === "linear" ? p : kind === "out" ? easeOut(p) : kind === "in" ? easeIn(p) : easeInOut(p);

    const place = (tracked: Tracked, progress: number, elapsed: number) => {
      const { spec, group, legs } = tracked;
      let x = spec.start?.[0] ?? 0, z = spec.start?.[1] ?? 0, heading = spec.face ?? 0;
      let moving = false;
      let visible = true;

      if (spec.arc) {
        const t0 = spec.t0 ?? 0, t1 = spec.t1 ?? 1;
        const local = THREE.MathUtils.clamp((progress - t0) / Math.max(0.001, t1 - t0), 0, 1);
        const eased = spec.brake ? easeOut(local) : easeInOut(local);
        const { c, r, a0, a1 } = spec.arc;
        const a = a0 + (a1 - a0) * eased;
        x = c[0] + Math.sin(a) * r;
        z = c[1] + Math.cos(a) * r;
        const dir = a1 >= a0 ? 1 : -1;
        heading = Math.atan2(-Math.cos(a) * dir, Math.sin(a) * dir);
        moving = local > 0 && local < 1;
      } else if (legs.length) {
        // Before its first leg a vehicle waits off-stage; between legs it holds
        // position, which is what produces a clean "order of passage" replay.
        const first = legs[0];
        if (progress < first.t0) {
          const head = sampleRoute(first.route, 0);
          x = head.x; z = head.z; heading = head.heading;
          visible = first.t0 <= 0.02;
        } else {
          let active = legs[0];
          for (const leg of legs) if (progress >= leg.t0) active = leg;
          const local = THREE.MathUtils.clamp((progress - active.t0) / Math.max(0.001, active.t1 - active.t0), 0, 1);
          const point = sampleRoute(active.route, applyEase(local, active.ease));
          x = point.x; z = point.z; heading = point.heading;
          moving = local > 0 && local < 1;
        }
      }

      group.visible = visible;
      group.position.x = x;
      group.position.z = z;
      group.rotation.y = heading;
      if (spec.kind === "pedestrian") {
        group.position.y = moving ? Math.abs(Math.sin(elapsed * 7)) * 0.07 : 0;
        group.rotation.z = moving ? Math.sin(elapsed * 7) * 0.05 : 0;
      } else {
        tracked.wheels.forEach(w => { if (moving) w.rotation.x -= 0.26; });
      }
      if (tracked.lamps.length) {
        const blink = Math.sin(elapsed * 12) > 0;
        tracked.lamps.forEach(m => { m.emissiveIntensity = blink ? 2.6 : 0.3; });
      }
    };

    const freeze = THREE.MathUtils.clamp(pauseAt, 0.05, 1);
    let raf = 0;
    let progress = stageRef.current === "ready" ? 0 : freeze;
    let previous: Stage = stageRef.current;
    const clock = new THREE.Clock();

    const resize = () => {
      const w = mount.clientWidth || 640;
      const h = mount.clientHeight || 340;
      renderer.setSize(w, h, false);
      const aspect = w / h;
      const half = Math.max(10.4, 13.6 / Math.max(aspect, 0.6));
      camera.top = half; camera.bottom = -half;
      camera.left = -half * aspect; camera.right = half * aspect;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      const current = stageRef.current;
      if (current === "playing") {
        if (previous !== "playing") progress = 0;
        progress = Math.min(freeze, progress + (dt * 1000) / duration);
      } else if (current === "solution") {
        if (previous !== "solution") progress = freeze;
        progress = Math.min(1, progress + (dt * 1000) / duration);
      } else if (current === "ready") progress = 0;
      else progress = freeze;
      previous = current;

      actors.forEach(a => place(a, progress, elapsed));
      lampMats.forEach(l => { l.mat.emissiveIntensity = 1.2 + Math.sin(elapsed * 3) * 0.25; });
      if (rain) {
        const pos = rain.geometry.getAttribute("position") as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) {
          let y = pos.getY(i) - dt * 17;
          if (y < 0.3) y = 14;
          pos.setY(i, y);
        }
        pos.needsUpdate = true;
      }
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      disposables.forEach(d => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [config, duration, pauseAt]);

  return <div ref={mountRef} className="scene-canvas" aria-hidden="true" />;
}
