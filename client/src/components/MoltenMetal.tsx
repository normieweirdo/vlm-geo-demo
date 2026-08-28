import React, { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

export type MoltenMetalProps = {
  color1?: string;
  color2?: string;
  color3?: string;
  speed?: number;
  scale?: number;
  detail?: number;
  glow?: number;
  coreSize?: number;
  swirl?: number;
  fold?: number;
  blackPoint?: number;
  brightness?: number;
  colorMode?: "molten" | "plasma" | "aurora" | string;
  grain?: boolean;
  grainIntensity?: number;
  mouseInteraction?: boolean;
  mouseStrength?: number;
  opacity?: number;
  className?: string;
};

const vertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform float uSpeed;
  uniform float uScale;
  uniform float uDetail;
  uniform float uGlow;
  uniform float uCoreSize;
  uniform float uSwirl;
  uniform float uFold;
  uniform float uBlackPoint;
  uniform float uBrightness;
  uniform float uColorMode;
  uniform float uGrain;
  uniform float uGrainIntensity;
  uniform float uMouseInteraction;
  uniform float uMouseStrength;
  uniform float uOpacity;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 6; i++) {
      if (float(i) >= uDetail) break;
      value += amplitude * noise(p);
      p = p * 2.03 + vec2(13.7, 7.9);
      amplitude *= 0.5;
    }
    return value;
  }

  mat2 rotate(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c);
  }

  void main() {
    float time = uTime * uSpeed;
    vec2 p = (vUv - 0.5) * 2.0;
    p.x *= uResolution.x / max(uResolution.y, 1.0);

    vec2 mouse = (uMouse - 0.5) * 2.0;
    p += mouse * uMouseInteraction * uMouseStrength * 0.14;
    p = rotate(sin(time * 0.22 + length(p) * 1.8) * uSwirl * 0.42) * p;

    vec2 flow = p * uScale;
    flow += vec2(time * 0.12, -time * 0.08);
    float base = fbm(flow);
    float detailNoise = fbm(flow * 1.85 - vec2(time * 0.07, time * 0.1));
    float ribbons = 0.5 + 0.5 * sin((p.x + p.y * 0.8 + detailNoise * 0.55) * 4.4 + time * 0.9 + uFold * 5.0);
    float field = clamp(base * 0.78 + ribbons * 0.34 + detailNoise * 0.18, 0.0, 1.0);

    float radius = length(p);
    float core = pow(max(0.0, 1.0 - radius / (1.45 + uCoreSize * 2.0)), max(0.35, uGlow));
    float mask = smoothstep(uBlackPoint, 0.92, field);
    float plasma = smoothstep(0.24, 0.95, field + core * 0.22);

    vec3 molten = mix(uColor1, uColor2, smoothstep(0.18, 0.82, field));
    molten = mix(molten, uColor3, smoothstep(0.6, 1.0, field) * 0.64);
    vec3 color = molten;
    if (uColorMode > 0.5) {
      color = mix(uColor1, uColor3, plasma);
      color = mix(color, uColor2, smoothstep(0.35, 0.82, detailNoise));
    }
    color *= uBrightness * (0.76 + core * 0.7);

    float grain = 0.0;
    if (uGrain > 0.5) {
      grain = (hash(vUv * uResolution + uTime) - 0.5) * uGrainIntensity;
    }

    float alpha = clamp((mask * 0.78 + core * 0.34) * uOpacity, 0.0, 1.0);
    gl_FragColor = vec4(max(vec3(0.0), color + grain), alpha);
  }
`;

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const expanded = normalized.length === 3 ? normalized.split("").map((value) => value + value).join("") : normalized;
  const value = Number.parseInt(expanded, 16);
  if (!Number.isFinite(value)) return [1, 1, 1];
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

export default function MoltenMetal({
  color1 = "#5227FF",
  color2 = "#FF9FFC",
  color3 = "#FFFFFF",
  speed = 0.35,
  scale = 4,
  detail = 3,
  glow = 1.6,
  coreSize = 0.1,
  swirl = 1,
  fold = -0.2,
  blackPoint = 0.05,
  brightness = 1.3,
  colorMode = "molten",
  grain = false,
  grainIntensity = 0.05,
  mouseInteraction = false,
  mouseStrength = 0.3,
  opacity = 1,
  className,
}: MoltenMetalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer | null = null;
    let frame = 0;
    let destroyed = false;

    try {
      renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 2) });
      const gl = renderer.gl;
      gl.canvas.setAttribute("aria-hidden", "true");
      gl.canvas.style.position = "absolute";
      gl.canvas.style.inset = "0";
      gl.canvas.style.width = "100%";
      gl.canvas.style.height = "100%";
      gl.canvas.style.display = "block";
      container.appendChild(gl.canvas);
      gl.clearColor(0, 0, 0, 0);

      const geometry = new Triangle(gl);
      const program = new Program(gl, {
        vertex,
        fragment,
        transparent: true,
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: [1, 1] },
          uMouse: { value: [0.5, 0.5] },
          uColor1: { value: hexToRgb(color1) },
          uColor2: { value: hexToRgb(color2) },
          uColor3: { value: hexToRgb(color3) },
          uSpeed: { value: speed },
          uScale: { value: scale },
          uDetail: { value: Math.min(6, Math.max(1, detail)) },
          uGlow: { value: glow },
          uCoreSize: { value: coreSize },
          uSwirl: { value: swirl },
          uFold: { value: fold },
          uBlackPoint: { value: blackPoint },
          uBrightness: { value: brightness },
          uColorMode: { value: colorMode === "molten" ? 0 : 1 },
          uGrain: { value: grain ? 1 : 0 },
          uGrainIntensity: { value: grainIntensity },
          uMouseInteraction: { value: mouseInteraction ? 1 : 0 },
          uMouseStrength: { value: mouseStrength },
          uOpacity: { value: opacity },
        },
      });
      const mesh = new Mesh(gl, { geometry, program });
      const mouse = [0.5, 0.5];

      const resize = () => {
        const width = Math.max(1, container.clientWidth);
        const height = Math.max(1, container.clientHeight);
        renderer?.setSize(width, height);
        program.uniforms.uResolution.value = [width, height];
      };
      const onMouseMove = (event: MouseEvent) => {
        if (!mouseInteraction) return;
        mouse[0] = event.clientX / Math.max(1, window.innerWidth);
        mouse[1] = 1 - event.clientY / Math.max(1, window.innerHeight);
        program.uniforms.uMouse.value = mouse;
      };

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
      resize();
      if (mouseInteraction) window.addEventListener("mousemove", onMouseMove, { passive: true });

      const render = (time: number) => {
        if (destroyed) return;
        program.uniforms.uTime.value = time * 0.001;
        renderer?.render({ scene: mesh });
        frame = requestAnimationFrame(render);
      };
      frame = requestAnimationFrame(render);

      return () => {
        destroyed = true;
        cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        if (mouseInteraction) window.removeEventListener("mousemove", onMouseMove);
        gl.canvas.remove();
      };
    } catch {
      return () => {
        destroyed = true;
        cancelAnimationFrame(frame);
      };
    }
  }, [blackPoint, brightness, color1, color2, color3, colorMode, coreSize, detail, fold, glow, grain, grainIntensity, mouseInteraction, mouseStrength, opacity, scale, speed, swirl]);

  return <div ref={containerRef} className={className} aria-hidden="true" style={{ background: "radial-gradient(circle at 20% 20%, rgba(82,39,255,.34), transparent 34%), radial-gradient(circle at 78% 28%, rgba(255,159,252,.3), transparent 30%), radial-gradient(circle at 52% 82%, rgba(255,255,255,.12), transparent 26%)" }} />;
}
