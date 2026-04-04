import React, { useRef, useMemo, forwardRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer } from '@react-three/postprocessing';
import { COLOR_HEX } from '../logic/shapeInventory';
import { DitherEffect } from '../effects/DitherEffect';
import WaterTube from './WaterTube';
import { useBeadScreenPositions } from '../hooks/useBeadScreenPositions';

/* =============================================
   SHAPE SHOWER SCENE
   Phase: 'shower' -> 'forming' -> 'formed'
   ============================================= */

const SHAPE_COLORS = [
  COLOR_HEX.red, COLOR_HEX.blue, COLOR_HEX.green,
  COLOR_HEX.yellow, COLOR_HEX.purple, COLOR_HEX.orange,
];

const PRIMARY_COLORS = [
  COLOR_HEX.red, COLOR_HEX.blue, COLOR_HEX.green, COLOR_HEX.yellow,
];

const FALLING_COUNT = 35;
const AMBIENT_COUNT = 55;

/* ---- Shower Head geometry ---- */

function ShowerHead({ opacity }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.05;
  });

  return (
    <group ref={ref} position={[0, 3.2, 0]}>
      {/* Pipe */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 1.2, 8]} />
        <meshStandardMaterial color="#B0BEC5" metalness={0.6} roughness={0.2} transparent opacity={opacity} />
      </mesh>
      {/* Head disc */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.45, 0.35, 0.12, 16]} />
        <meshStandardMaterial color="#CFD8DC" metalness={0.7} roughness={0.15} transparent opacity={opacity} />
      </mesh>
      {/* Head rim */}
      <mesh position={[0, -0.06, 0]}>
        <torusGeometry args={[0.4, 0.025, 8, 24]} />
        <meshStandardMaterial color="#90A4AE" metalness={0.5} roughness={0.3} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

/* ---- Single falling shape (decorative rain) ---- */

function FallingShape({ index, phase, totalCount }) {
  const ref = useRef();
  const seed = useRef({
    x: (Math.random() - 0.5) * 1.8,
    speed: 1.2 + Math.random() * 2.0,
    rotSpeed: (Math.random() - 0.5) * 3,
    yStart: 2.8 + Math.random() * 1.5,
    type: Math.random() > 0.5 ? 'cube' : 'round',
    color: SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)],
    size: 0.08 + Math.random() * 0.1,
    delay: Math.random() * 2,
    z: (Math.random() - 0.5) * 0.6,
  }).current;
  const y = useRef(seed.yStart + seed.delay * seed.speed);
  const fadeOut = useRef(1);

  useFrame((_, delta) => {
    if (!ref.current) return;

    if (phase === 'shower') {
      y.current -= delta * seed.speed;
      if (y.current < -3) y.current = seed.yStart;
      fadeOut.current = 1;
    } else {
      // Slow down and fade
      y.current -= delta * seed.speed * fadeOut.current;
      fadeOut.current = Math.max(0, fadeOut.current - delta * 0.8);
    }

    ref.current.position.set(
      seed.x + Math.sin(y.current * 1.5 + index) * 0.15,
      y.current,
      seed.z
    );
    ref.current.rotation.x += delta * seed.rotSpeed;
    ref.current.rotation.y += delta * seed.rotSpeed * 0.7;

    const s = seed.size * fadeOut.current;
    ref.current.scale.set(s, s, s);
  });

  return (
    <mesh ref={ref}>
      {seed.type === 'cube'
        ? <boxGeometry args={[1, 1, 1]} />
        : <sphereGeometry args={[0.6, 10, 10]} />
      }
      <meshStandardMaterial
        color={seed.color}
        roughness={0.3}
        metalness={0.15}
        transparent
      />
    </mesh>
  );
}

/* ---- Necklace bead that animates into position ---- */

function NecklaceBead({ bead, targetPos, delay, phase }) {
  const ref = useRef();
  const t = useRef(0);
  const scale = useRef(0);
  const startPos = useRef([
    (Math.random() - 0.5) * 1.5,
    2.5 + Math.random() * 1.0,
    (Math.random() - 0.5) * 0.5,
  ]);

  useFrame((_, delta) => {
    if (!ref.current) return;

    if (phase !== 'forming' && phase !== 'formed') {
      scale.current = 0;
      ref.current.scale.set(0, 0, 0);
      return;
    }

    t.current += delta;
    const elapsed = t.current - delay;

    if (elapsed > 0 && scale.current < 1) {
      scale.current = Math.min(1, scale.current + delta * 2.5);
    }

    const s = scale.current;
    ref.current.scale.set(s, s, s);

    // Lerp position from start to target
    const lerpFactor = Math.min(1, elapsed > 0 ? elapsed * 1.8 : 0);
    const eased = 1 - Math.pow(1 - lerpFactor, 3);
    ref.current.position.set(
      startPos.current[0] + (targetPos[0] - startPos.current[0]) * eased,
      startPos.current[1] + (targetPos[1] - startPos.current[1]) * eased,
      startPos.current[2] + (targetPos[2] - startPos.current[2]) * eased,
    );

    // Idle float after formed
    if (phase === 'formed' && s > 0.9) {
      ref.current.position.y += Math.sin(t.current * 1.1 + delay * 3) * 0.02;
    }

    // Rotation
    if (bead.type === 'cube') {
      ref.current.rotation.y += delta * 0.3;
      ref.current.rotation.x += delta * 0.15;
    } else if (bead.type === 'star') {
      ref.current.rotation.z += delta * 0.2;
    }
  });

  const hex = bead.type === 'star' ? COLOR_HEX.yellow : bead.hex;

  return (
    <group ref={ref} position={startPos.current}>
      {bead.type === 'cube' && (
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.22, 0.22]} />
          <meshStandardMaterial color={hex} roughness={0.55} metalness={0.05} />
        </mesh>
      )}
      {bead.type === 'round' && (
        <mesh castShadow>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial color={hex} roughness={0.45} metalness={0.08} />
        </mesh>
      )}
      {bead.type === 'star' && <StarMesh3D />}
    </group>
  );
}

/* ---- Star geometry ---- */

function StarMesh3D() {
  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const outerR = 0.26;
    const innerR = 0.11;
    const pts = 5;
    for (let i = 0; i < pts * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / pts - Math.PI / 2;
      if (i === 0) shape.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      else shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    shape.closePath();
    return shape;
  }, []);

  return (
    <mesh castShadow>
      <extrudeGeometry args={[starShape, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.01, bevelSegments: 1 }]} />
      <meshStandardMaterial color={COLOR_HEX.yellow} roughness={0.3} metalness={0.15} emissive="#D4A017" emissiveIntensity={0.35} />
    </mesh>
  );
}

/* ---- Rope curve ---- */

function RopeCurve({ positions, opacity }) {
  const curve = useMemo(() => {
    const pts = positions.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
  }, [positions]);

  return (
    <mesh>
      <tubeGeometry args={[curve, 80, 0.015, 6, false]} />
      <meshStandardMaterial color="#8D6E63" roughness={0.6} transparent opacity={opacity} />
    </mesh>
  );
}

/* ---- Water droplets (subtle effect around shower) ---- */

function WaterDroplets({ phase }) {
  const count = 40;
  const seeds = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 1.0,
      speed: 2.5 + Math.random() * 3.5,
      yStart: 3.0 + Math.random() * 0.5,
      z: (Math.random() - 0.5) * 0.6,
      size: 0.018 + Math.random() * 0.025,
    }))
  , []);

  return (
    <group>
      {seeds.map((s, i) => (
        <WaterDrop key={i} seed={s} index={i} phase={phase} />
      ))}
    </group>
  );
}

function WaterDrop({ seed, index, phase }) {
  const ref = useRef();
  const y = useRef(seed.yStart);
  const fade = useRef(1);

  useFrame((_, delta) => {
    if (!ref.current) return;
    if (phase === 'shower') {
      y.current -= delta * seed.speed;
      if (y.current < -2) y.current = seed.yStart;
      fade.current = 1;
    } else {
      y.current -= delta * seed.speed * fade.current;
      fade.current = Math.max(0, fade.current - delta * 1.2);
    }
    ref.current.position.set(seed.x, y.current, seed.z);
    const s = seed.size * fade.current;
    ref.current.scale.set(s, s, s);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial color="#90CAF9" transparent opacity={0.6} />
    </mesh>
  );
}

/* ---- Necklace arc positions ---- */

function computeArcPositions(total) {
  const positions = [];
  const mid = Math.floor(total / 2);
  for (let i = 0; i < total; i++) {
    const t = i / (total - 1);
    const angle = Math.PI * 0.18 + t * Math.PI * 0.64;
    const radius = 2.5;
    const x = Math.cos(angle) * radius;
    const y = -Math.sin(angle) * radius * 0.5;
    // Push center beads forward, star (index 12) gets most Z
    const distFromCenter = Math.abs(i - mid) / mid;
    const z = (1 - distFromCenter) * 1.2;
    positions.push([x, y, z]);
  }
  return positions;
}

/* ---- Water droplets falling on necklace (formed phase) ---- */

const NECKLACE_DROP_COUNT = 60;

function NecklaceDroplet({ index }) {
  const ref = useRef();
  const seed = useRef({
    x: (Math.random() - 0.5) * 5,
    speed: 2.0 + Math.random() * 3.0,
    yStart: 3.5 + Math.random() * 1.5,
    z: 0.5 + (Math.random() - 0.5) * 1.0,
    size: 0.025 + Math.random() * 0.04,
    delay: Math.random() * 2,
  }).current;
  const y = useRef(seed.yStart + seed.delay * seed.speed);

  useFrame((_, delta) => {
    if (!ref.current) return;
    y.current -= delta * seed.speed;
    if (y.current < -2.5) y.current = seed.yStart;
    ref.current.position.set(
      seed.x + Math.sin(y.current * 0.8 + index) * 0.1,
      y.current,
      seed.z
    );
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[seed.size, 6, 6]} />
      <meshStandardMaterial color="#64B5F6" transparent opacity={0.65} />
    </mesh>
  );
}

function NecklaceDroplets() {
  return (
    <group position={[0, 0.8, 0]}>
      {Array.from({ length: NECKLACE_DROP_COUNT }, (_, i) => (
        <NecklaceDroplet key={`ndrop-${i}`} index={i} />
      ))}
    </group>
  );
}

/* ---- Halftone feathered material for ambient shapes ---- */

const halftoneVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  varying vec2 vScreenUV;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPos.xyz;
    gl_Position = projectionMatrix * mvPos;
    vScreenUV = gl_Position.xy / gl_Position.w * 0.5 + 0.5;
  }
`;

const halftoneFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uDotScale;
  uniform float uWobble;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  varying vec2 vScreenUV;

  // Quantize into cel-shading bands
  float celBand(float v, float bands) {
    return floor(v * bands + 0.5) / bands;
  }

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = normalize(vViewPosition);
    vec3 viewNorm = normalize(vNormal);

    // === Cel-shaded lighting ===
    // Key light
    vec3 lightDir1 = normalize(vec3(3.0, 5.0, 4.0) - vWorldPosition);
    float diff1 = max(dot(normal, lightDir1), 0.0);
    // Fill light
    vec3 lightDir2 = normalize(vec3(-3.0, 3.0, -2.0) - vWorldPosition);
    float diff2 = max(dot(normal, lightDir2), 0.0) * 0.3;

    // Combine diffuse and quantize into 4 toon bands
    float rawDiff = diff1 * 0.7 + diff2;
    float toonDiff = celBand(rawDiff, 4.0);

    // Specular — hard-edged toon highlight
    vec3 halfVec = normalize(lightDir1 + viewDir);
    float rawSpec = pow(max(dot(viewNorm, halfVec), 0.0), 24.0);
    float toonSpec = step(0.5, rawSpec) * 0.6;

    // Rim light — cel-shaded hard edge
    float rim = 1.0 - max(dot(viewNorm, viewDir), 0.0);
    float toonRim = step(0.65, rim) * 0.35;

    // Assemble cel-shaded color
    float ambient = 0.35;
    vec3 celColor = uColor * (ambient + toonDiff * 0.65) + vec3(1.0) * toonSpec + uColor * toonRim;

    // Fresnel edge fade
    float fresnel = dot(viewNorm, viewDir);
    float edgeFade = smoothstep(0.0, 0.4, fresnel);

    // Wobble distortion
    vec2 wobbleOffset = vec2(
      sin(vScreenUV.y * 12.0 + uTime * 3.0) * uWobble * 0.06,
      cos(vScreenUV.x * 14.0 + uTime * 2.5) * uWobble * 0.06
    );

    // Halftone dot pattern
    vec2 dotUV = (vScreenUV + wobbleOffset) * uDotScale;
    vec2 local = fract(dotUV) - 0.5;
    float distToDot = length(local);

    float lum = dot(celColor, vec3(0.299, 0.587, 0.114));
    float dotRadius = mix(0.42, 0.1, clamp(lum, 0.0, 1.0)) + uWobble * 0.04;
    float dotMask = 1.0 - smoothstep(dotRadius - 0.06, dotRadius + 0.06, distToDot);

    float alpha = uOpacity * edgeFade * mix(0.45, 1.0, dotMask);

    gl_FragColor = vec4(celColor, alpha);
  }
`;

function HalftoneFeatherMaterial({ color, opacity, dotScale, wobble }) {
  const matRef = useRef();
  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(color) },
    uOpacity: { value: opacity },
    uDotScale: { value: dotScale || 100.0 },
    uWobble: { value: 0.0 },
    uTime: { value: 0.0 },
  }), [color, opacity, dotScale]);

  useFrame((_, delta) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uWobble.value += (wobble - matRef.current.uniforms.uWobble.value) * 0.08;
    matRef.current.uniforms.uTime.value += delta;
  });

  return (
    <shaderMaterial
      ref={matRef}
      attach="material"
      vertexShader={halftoneVertexShader}
      fragmentShader={halftoneFragmentShader}
      uniforms={uniforms}
      transparent
      side={THREE.DoubleSide}
      depthWrite={false}
    />
  );
}

/* ---- Ambient floating shapes (mouse/touch collision) ---- */

const REPULSE_RADIUS = 2.5;
const REPULSE_STRENGTH = 4.0;

function AmbientShape({ seed }) {
  const ref = useRef();
  const { pointer, camera, viewport } = useThree();
  const t = useRef(Math.random() * 100);
  const pushX = useRef(0);
  const pushY = useRef(0);
  const velX = useRef(0);
  const velY = useRef(0);
  const spinBoost = useRef(0);
  const wobbleRef = useRef(0);

  useFrame((_, delta) => {
    if (!ref.current) return;
    t.current += delta;

    const aspect = viewport.width / viewport.height;
    const fovRad = (camera.fov * Math.PI) / 180;
    const dist = Math.abs(seed.z - camera.position.z);
    const halfH = Math.tan(fovRad / 2) * dist;
    const halfW = halfH * aspect;
    const mouseWorldX = pointer.x * halfW;
    const mouseWorldY = pointer.y * halfH;

    const floatX = Math.sin(t.current * seed.orbitSpeed + seed.phase) * seed.orbitRadius;
    const floatY = Math.cos(t.current * seed.orbitSpeed * 0.7 + seed.phase) * seed.orbitRadius * 0.6;
    const shapeX = seed.x + floatX + pushX.current;
    const shapeY = seed.y + floatY + pushY.current;

    const dx = shapeX - mouseWorldX;
    const dy = shapeY - mouseWorldY;
    const dist2D = Math.sqrt(dx * dx + dy * dy);

    // Repulsion + wobble intensity from proximity
    let proximity = 0;
    if (dist2D < REPULSE_RADIUS && dist2D > 0.01) {
      proximity = 1 - dist2D / REPULSE_RADIUS;
      const force = proximity * REPULSE_STRENGTH * seed.mass;
      const nx = dx / dist2D;
      const ny = dy / dist2D;
      velX.current += nx * force * delta;
      velY.current += ny * force * delta;
      spinBoost.current = Math.min(spinBoost.current + delta * 8, 5);
    }
    wobbleRef.current = proximity;

    const springK = 1.8;
    const damping = 0.92;
    velX.current += -pushX.current * springK * delta;
    velY.current += -pushY.current * springK * delta;
    velX.current *= damping;
    velY.current *= damping;
    pushX.current += velX.current * delta * 60;
    pushY.current += velY.current * delta * 60;

    spinBoost.current *= 0.96;

    ref.current.position.set(
      seed.x + floatX + pushX.current,
      seed.y + floatY + pushY.current,
      seed.z
    );

    const rotMul = 1 + spinBoost.current;
    ref.current.rotation.x += delta * seed.rotX * rotMul;
    ref.current.rotation.y += delta * seed.rotY * rotMul;
    ref.current.rotation.z += delta * seed.rotZ * rotMul;
  });

  return (
    <mesh ref={ref} position={[seed.x, seed.y, seed.z]}>
      {seed.type === 'cube' && <boxGeometry args={[seed.size, seed.size, seed.size]} />}
      {seed.type === 'round' && <sphereGeometry args={[seed.size * 0.6, 16, 16]} />}
      {seed.type === 'star' && <AmbientStarGeo size={seed.size} />}
      <HalftoneFeatherMaterial color={seed.color} opacity={seed.opacity} dotScale={seed.dotScale} wobble={wobbleRef.current} />
    </mesh>
  );
}

function AmbientStarGeo({ size }) {
  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    const outerR = size * 0.5;
    const innerR = size * 0.2;
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      if (i === 0) shape.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      else shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    shape.closePath();
    return shape;
  }, [size]);

  return <extrudeGeometry args={[geo, { depth: size * 0.15, bevelEnabled: false }]} />;
}

function AmbientShapes({ isMobile }) {
  const seeds = useMemo(() => {
    // On mobile: closer, tighter spread, more float
    const m = isMobile;
    return Array.from({ length: AMBIENT_COUNT }, (_, i) => {
      const types = ['cube', 'round', 'star'];
      // Three tiers: deep/large/faint, mid, near/small/brighter
      const tier = i < 20 ? 'deep' : i < 40 ? 'mid' : 'near';
      const depth = tier === 'deep'
        ? (m ? -2 - Math.random() * 3 : -4 - Math.random() * 5)
        : tier === 'mid'
        ? (m ? -0.8 - Math.random() * 2 : -1.5 - Math.random() * 3)
        : (m ? -0.3 - Math.random() * 0.8 : -0.5 - Math.random() * 1.5);
      const sizeBase = tier === 'deep' ? 0.6 + Math.random() * 1.0
        : tier === 'mid' ? 0.3 + Math.random() * 0.5
        : 0.15 + Math.random() * 0.3;
      const opBase = tier === 'deep'
        ? (m ? 0.2 + Math.random() * 0.2 : 0.15 + Math.random() * 0.18)
        : tier === 'mid'
        ? (m ? 0.28 + Math.random() * 0.22 : 0.22 + Math.random() * 0.2)
        : (m ? 0.35 + Math.random() * 0.25 : 0.3 + Math.random() * 0.25);
      const spreadX = tier === 'deep' ? (m ? 10 : 16) : tier === 'mid' ? (m ? 7 : 12) : (m ? 5 : 9);
      const spreadY = tier === 'deep' ? (m ? 8 : 12) : tier === 'mid' ? (m ? 6 : 8) : (m ? 4.5 : 6);
      return {
        x: (Math.random() - 0.5) * spreadX,
        y: (Math.random() - 0.5) * spreadY,
        z: depth,
        size: sizeBase,
        type: types[Math.floor(Math.random() * types.length)],
        color: PRIMARY_COLORS[Math.floor(Math.random() * PRIMARY_COLORS.length)],
        opacity: opBase,
        dotScale: tier === 'deep' ? 60.0 : tier === 'mid' ? 90.0 : 140.0,
        mass: 0.5 + Math.random() * 0.9,
        orbitSpeed: m ? 0.18 + Math.random() * 0.3 : 0.08 + Math.random() * 0.18,
        orbitRadius: m ? 0.15 + Math.random() * 0.4 : 0.06 + Math.random() * 0.2,
        phase: Math.random() * Math.PI * 2,
        rotX: (Math.random() - 0.5) * (m ? 0.5 : 0.25),
        rotY: (Math.random() - 0.5) * (m ? 0.6 : 0.35),
        rotZ: (Math.random() - 0.5) * (m ? 0.3 : 0.15),
      };
    });
  }, [isMobile]);

  return (
    <group>
      {seeds.map((s, i) => (
        <AmbientShape key={`amb-${i}`} seed={s} />
      ))}
    </group>
  );
}

/* ---- Volumetric light beam (cylindrical) ---- */

const beamVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying float vY;
  void main() {
    vUv = uv;
    vY = position.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const beamFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;
  varying float vY;

  void main() {
    // Vertical fade: bright at top, transparent at bottom
    float vertFade = smoothstep(-1.0, 1.0, vY) * 0.5 + 0.5;
    vertFade = pow(vertFade, 0.6);

    // Radial fade from center of cylinder
    float radial = 1.0 - abs(vUv.x - 0.5) * 2.0;
    radial = pow(max(radial, 0.0), 1.8);

    // Subtle animated shimmer
    float shimmer = 0.92 + 0.08 * sin(vUv.y * 20.0 + uTime * 1.5);

    float alpha = vertFade * radial * uIntensity * shimmer;

    // Pulsating blue tint — cycles between soft blue and lighter blue
    float pulse = 0.5 + 0.5 * sin(uTime * 0.8);
    vec3 blueA = vec3(0.55, 0.72, 1.0);  // soft sky blue
    vec3 blueB = vec3(0.38, 0.55, 0.95); // deeper blue
    vec3 beamColor = mix(blueA, blueB, pulse);

    gl_FragColor = vec4(beamColor, alpha * 0.09);
  }
`;

function LightBeam({ phase }) {
  const matRef = useRef();
  const intensity = phase === 'shower' ? 1.0 : phase === 'forming' ? 0.6 : 0.3;

  useFrame((_, delta) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value += delta;
    matRef.current.uniforms.uIntensity.value +=
      (intensity - matRef.current.uniforms.uIntensity.value) * 0.04;
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uIntensity: { value: 1.0 },
  }), []);

  return (
    <mesh position={[0, 1.0, 0.5]} rotation={[0, 0, 0]}>
      <cylinderGeometry args={[0.6, 1.1, 6, 32, 1, true]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={beamVertexShader}
        fragmentShader={beamFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ---- Main inner scene ---- */

const NECKLACE_GROUP_OFFSET = [0, 0.8, 0];
const BEAD_SCREEN_RADIUS = 0.28; // world-unit radius for projection

function SceneContent({ sequence, phase, fillLevel, beadScreenPositionsRef }) {
  const { viewport } = useThree();
  const isMobile = viewport.width < 6;
  const hasSequence = sequence && sequence.length > 0;
  const positions = useMemo(
    () => hasSequence ? computeArcPositions(sequence.length) : [],
    [hasSequence, sequence?.length]
  );

  // Project bead positions to screen coords for FortuneTextFlow
  useBeadScreenPositions(
    beadScreenPositionsRef,
    positions,
    NECKLACE_GROUP_OFFSET,
    BEAD_SCREEN_RADIUS,
    phase === 'formed' && hasSequence
  );

  const showerOpacity = phase === 'shower' ? 1 : phase === 'forming' ? 0.4 : 0;
  const ropeOpacity = phase === 'formed' ? 1 : phase === 'forming' ? 0.5 : 0;

  return (
    <>
      {/* Lighting — brighter for white bg */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 5, 4]} intensity={1.0} color="#fff" />
      <directionalLight position={[-3, 3, -2]} intensity={0.3} color="#E3F2FD" />
      <pointLight position={[0, -1, 3]} intensity={0.2} color="#FDD835" />

      {/* Ambient background shapes — always visible, mouse-reactive */}
      <AmbientShapes isMobile={isMobile} />

      {/* Volumetric light beam — hidden on mobile */}
      {!isMobile && <LightBeam phase={phase} />}

      {/* Water tube — purchase progress gauge */}
      <WaterTube fillLevel={fillLevel} position={isMobile ? [0, 0.2, 1.5] : [-2.2, 0.2, 1.0]} mobileScale={isMobile ? 0.5 : 0.8} visible={phase === 'shower'} />

      {/* Shower head */}
      {phase !== 'formed' && <ShowerHead opacity={showerOpacity} />}

      {/* Water droplets */}
      <WaterDroplets phase={phase} />

      {/* Decorative falling shapes */}
      {Array.from({ length: FALLING_COUNT }, (_, i) => (
        <FallingShape key={`fall-${i}`} index={i} phase={phase} totalCount={FALLING_COUNT} />
      ))}

      {/* Necklace formation */}
      {hasSequence && (
        <group position={isMobile ? [0, 0.2, 0] : [0, 0.8, 0]} scale={isMobile ? 0.4 : 1}>
          {ropeOpacity > 0 && <RopeCurve positions={positions} opacity={ropeOpacity} />}
          {sequence.map((bead, i) => {
            const stagger = Math.abs(i - 12) * 0.08;
            return (
              <NecklaceBead
                key={`bead-${i}`}
                bead={bead}
                targetPos={positions[i]}
                delay={0.6 + stagger}
                phase={phase}
              />
            );
          })}
        </group>
      )}

      {/* Water droplets falling on necklace during formed phase */}
      {(phase === 'forming' || phase === 'formed') && <NecklaceDroplets />}
    </>
  );
}

/* ---- Custom dither post-processing ---- */

const Dither = forwardRef(function Dither(props, ref) {
  const effect = useMemo(() => new DitherEffect({
    ditherStrength: 0.07,
    colorLevels: 26.0,
    grainAmount: 0.015,
  }), []);
  return <primitive ref={ref} object={effect} dispose={null} />;
});

/* ---- Exported scene ---- */

export default function ShapeTreeScene({ sequence, phase, fillLevel = 0.35, beadScreenPositionsRef }) {
  return (
    <Canvas
      camera={{ position: [0, 0.8, 6], fov: 38 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      style={{ background: 'transparent' }}
    >
      <SceneContent sequence={sequence} phase={phase} fillLevel={fillLevel} beadScreenPositionsRef={beadScreenPositionsRef} />
      <EffectComposer>
        <Dither />
      </EffectComposer>
    </Canvas>
  );
}
