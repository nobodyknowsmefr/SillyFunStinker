import React, { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, useTexture } from '@react-three/drei';
import * as THREE from 'three';

/* ==============================================
   WATER TUBE — Crayon-textured 2D shader gauge
   Perlin-noise organic fill driven by fillLevel.
   Rendered on a flat plane in the 3D scene.
   ============================================== */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uFillLevel;
  uniform float uTime;
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform vec3  uOutline;
  uniform vec2  uMouse;
  uniform float uMouseActive;

  varying vec2 vUv;

  /* ---- Perlin noise (Ken Perlin fade + gradient) ---- */

  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)),
             dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float perlin(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(
      mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
          dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
      mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
          dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
      u.y);
  }

  /* Fractal Brownian Motion — stacked octaves for crayon grain */
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) {
      v += a * perlin(p);
      p = rot * p * 2.0;
      a *= 0.5;
    }
    return v;
  }

  /* Rounded-rect SDF (capsule / test-tube shape) */
  float roundedBox(vec2 p, vec2 half_size, float radius) {
    vec2 d = abs(p) - half_size + radius;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - radius;
  }

  void main() {
    // Work in centered UV space
    vec2 uv = vUv;
    vec2 centeredUV = uv - 0.5;

    // Tube shape — tall rounded rectangle
    float tubeW = 0.28;
    float tubeH = 0.44;
    float corner = 0.12;
    float tubeSDF = roundedBox(centeredUV, vec2(tubeW, tubeH), corner);

    // Inside-tube mask with crayon-textured edge
    float edgeNoise = fbm(uv * 60.0 + uTime * 0.05) * 0.012;
    float tubeMask = 1.0 - smoothstep(-0.008 + edgeNoise, 0.004 + edgeNoise, tubeSDF);

    // Outline — hand-drawn crayon stroke
    float outlineNoise = fbm(uv * 45.0 - 3.0) * 0.008;
    float outlineOuter = smoothstep(0.015 + outlineNoise, 0.005 + outlineNoise, tubeSDF);
    float outlineInner = smoothstep(-0.003 + outlineNoise, -0.012 + outlineNoise, tubeSDF);
    float outlineMask = outlineOuter * (1.0 - outlineInner);
    // Crayon grain on outline
    float outlineGrain = 0.6 + 0.4 * fbm(uv * 80.0 + 7.0);
    outlineMask *= outlineGrain;

    // Fill-level coordinate (0 = tube bottom, 1 = tube top)
    float tubeBottom = 0.5 - tubeH + corner * 0.5;
    float tubeTop = 0.5 + tubeH - corner * 0.5;
    float localY = (uv.y - tubeBottom) / (tubeTop - tubeBottom);

    // Organic water surface with Perlin noise wobble
    float surfNoise = perlin(vec2(uv.x * 24.0, uTime * 0.6)) * 0.035
                    + perlin(vec2(uv.x * 50.0, uTime * 0.9)) * 0.015;

    // Mouse ripple on water surface
    float mouseDist = distance(uv, uMouse);
    float ripple = sin(mouseDist * 80.0 - uTime * 6.0) * 0.02
                 * smoothstep(0.18, 0.0, mouseDist) * uMouseActive;
    float surface = uFillLevel + surfNoise + ripple;
    float waterMask = smoothstep(surface + 0.015, surface - 0.025, localY);

    // ---- Crayon water texture ----
    // Big grain (color variation)
    float bigNoise = fbm(uv * 18.0 + vec2(0.0, uTime * 0.08));
    // Fine grain (crayon stroke feel)
    float fineNoise = fbm(uv * 55.0 + vec2(uTime * 0.03, 0.0));
    // Micro grain (paper texture)
    float microNoise = perlin(uv * 120.0 + uTime * 0.02);

    float crayonTex = 0.65 + 0.2 * bigNoise + 0.1 * fineNoise + 0.05 * microNoise;

    // Color — blend between two water blues based on noise
    float colorMix = smoothstep(-0.3, 0.4, bigNoise);
    vec3 waterColor = mix(uColorA, uColorB, colorMix) * crayonTex;

    // Subtle lighter band near the surface (light refraction feel)
    float surfaceBand = smoothstep(surface - 0.08, surface - 0.01, localY)
                      * smoothstep(surface + 0.01, surface - 0.01, localY);
    waterColor += vec3(0.12, 0.15, 0.18) * surfaceBand * crayonTex;

    // Depth darkening near bottom
    float depthDarken = smoothstep(0.0, 0.35, localY);
    waterColor *= 0.7 + 0.3 * depthDarken;

    // ---- Tick marks (goal markers) ----
    float tickAlpha = 0.0;
    for (int i = 1; i <= 4; i++) {
      float tickY = float(i) * 0.2;
      float tickDist = abs(localY - tickY);
      float tickLine = 1.0 - smoothstep(0.002, 0.006, tickDist);
      float tickX = abs(centeredUV.x);
      float tickInset = smoothstep(tubeW - 0.04, tubeW - 0.02, tickX);
      tickAlpha += tickLine * tickInset * 0.3;
    }

    // ---- Floating mini shapes in the water ----
    float shapeMask = 0.0;
    vec3 shapeColor = vec3(0.0);

    // 8 shapes with seeded positions that bob in the water
    for (int si = 0; si < 8; si++) {
      float fi = float(si);
      // Pseudo-random seed per shape
      float sx = fract(sin(fi * 73.13) * 4375.5) * 0.38 - 0.19;  // x within tube
      float sy = fract(sin(fi * 127.7) * 9182.3) * 0.6 + 0.1;    // base y (0-0.7 fill range)
      float sType = fract(sin(fi * 311.1) * 6521.9);              // shape type selector
      float sColorSeed = fract(sin(fi * 53.7) * 8123.1);

      // Only show shape if water level is above its base position
      float shapeVisible = smoothstep(sy - 0.02, sy + 0.02, uFillLevel);
      if (shapeVisible < 0.01) continue;

      // Bob motion — gentle float in the water
      float bobX = sx + sin(uTime * 0.4 + fi * 2.1) * 0.03;
      float bobY = sy + sin(uTime * 0.55 + fi * 1.7) * 0.025
                      + cos(uTime * 0.3 + fi * 3.2) * 0.015;

      // Push away from mouse
      vec2 shapePosUV = vec2(0.5 + bobX, tubeBottom + bobY * (tubeTop - tubeBottom));
      vec2 toShape = shapePosUV - uMouse;
      float mDist = length(toShape);
      float pushStrength = smoothstep(0.12, 0.0, mDist) * uMouseActive * 0.06;
      bobX += (toShape.x / max(mDist, 0.001)) * pushStrength;
      bobY += (toShape.y / max(mDist, 0.001)) * pushStrength / (tubeTop - tubeBottom);

      // Convert to UV space for SDF
      vec2 shapeCenter = vec2(0.5 + bobX, tubeBottom + bobY * (tubeTop - tubeBottom));
      vec2 d = uv - shapeCenter;
      float shapeSize = 0.018 + fract(sin(fi * 41.3) * 1234.5) * 0.012;

      float dist = 10.0;
      if (sType < 0.33) {
        // Circle
        dist = length(d) - shapeSize;
      } else if (sType < 0.66) {
        // Square
        vec2 ad = abs(d) - shapeSize * 0.85;
        dist = length(max(ad, 0.0)) + min(max(ad.x, ad.y), 0.0);
      } else {
        // Star (5-point approximation)
        float angle = atan(d.y, d.x);
        float r = length(d);
        float star = cos(floor(0.5 + angle / 1.2566) * 1.2566 - angle) * r;
        dist = star - shapeSize * 0.7;
      }

      // Crayon edge + grain
      float shapeGrain = 0.7 + 0.3 * fbm(uv * 90.0 + fi * 5.0);
      float sMask = (1.0 - smoothstep(-0.003, 0.003, dist)) * shapeGrain * shapeVisible;

      // Pick color from palette (red, yellow, blue, green, purple, orange)
      vec3 sCol;
      if (sColorSeed < 0.167)      sCol = vec3(0.84, 0.20, 0.19);  // red
      else if (sColorSeed < 0.333) sCol = vec3(0.96, 0.72, 0.0);   // yellow
      else if (sColorSeed < 0.5)   sCol = vec3(0.11, 0.30, 0.89);  // blue
      else if (sColorSeed < 0.667) sCol = vec3(0.18, 0.58, 0.42);  // green
      else if (sColorSeed < 0.833) sCol = vec3(0.48, 0.18, 0.56);  // purple
      else                          sCol = vec3(0.91, 0.35, 0.05);  // orange

      // Apply crayon texture to shape color
      sCol *= (0.7 + 0.3 * shapeGrain);

      // Outline for the shape
      float outDist = abs(dist + 0.003);
      float sOutline = (1.0 - smoothstep(0.0, 0.005, outDist)) * shapeGrain * shapeVisible * 0.6;

      // Accumulate
      shapeColor = mix(shapeColor, sCol, sMask);
      shapeMask = max(shapeMask, sMask);
      shapeMask = max(shapeMask, sOutline);
      shapeColor = mix(shapeColor, uOutline * 0.3, sOutline * (1.0 - sMask));
    }

    // ---- Combine ----
    // Water inside tube
    float waterAlpha = tubeMask * waterMask * (0.75 + 0.25 * crayonTex);

    // Glass interior (very faint when empty)
    float emptyAlpha = tubeMask * (1.0 - waterMask) * 0.04;

    // Total
    vec3 finalColor = waterColor;
    float finalAlpha = waterAlpha + emptyAlpha;

    // Overlay floating shapes (only inside water)
    float shapeInWater = shapeMask * tubeMask * waterMask;
    finalColor = mix(finalColor, shapeColor, shapeInWater * 0.85);
    finalAlpha = max(finalAlpha, shapeInWater * 0.8);

    // Overlay outline
    finalColor = mix(finalColor, uOutline, outlineMask * 0.85);
    finalAlpha = max(finalAlpha, outlineMask * 0.55);

    // Overlay tick marks
    finalColor = mix(finalColor, uOutline * 0.6, tickAlpha * tubeMask);
    finalAlpha = max(finalAlpha, tickAlpha * tubeMask * 0.3);

    // Discard fully transparent pixels
    if (finalAlpha < 0.01) discard;

    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

/* ---- Component ---- */

export default function WaterTube({ fillLevel = 0.35, position = [-2.5, 0.5, 0.5], mobileScale = 1 }) {
  const matRef = useRef();
  const fillSmooth = useRef(fillLevel);
  const mouseUV = useRef(new THREE.Vector2(0.5, 0.5));
  const mouseActive = useRef(0);
  const mouseOver = useRef(false);
  const lilwaterTex = useTexture('/lilwater.png');
  const lilbillTex = useTexture('/lilbill.png');

  const uniforms = useMemo(() => ({
    uFillLevel:   { value: fillLevel },
    uTime:        { value: 0 },
    uColorA:      { value: new THREE.Color('#1565C0') },
    uColorB:      { value: new THREE.Color('#42A5F5') },
    uOutline:     { value: new THREE.Color('#1A1918') },
    uMouse:       { value: new THREE.Vector2(0.5, 0.5) },
    uMouseActive: { value: 0 },
  }), []);

  const onPointerMove = useCallback((e) => {
    if (e.uv) {
      mouseUV.current.set(e.uv.x, e.uv.y);
      mouseOver.current = true;
    }
  }, []);

  const onPointerLeave = useCallback(() => {
    mouseOver.current = false;
  }, []);

  useFrame((_, delta) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value += delta;
    fillSmooth.current += (fillLevel - fillSmooth.current) * 0.04;
    matRef.current.uniforms.uFillLevel.value = fillSmooth.current;
    // Smooth mouse activation
    const target = mouseOver.current ? 1 : 0;
    mouseActive.current += (target - mouseActive.current) * 0.08;
    matRef.current.uniforms.uMouse.value.copy(mouseUV.current);
    matRef.current.uniforms.uMouseActive.value = mouseActive.current;
  });

  return (
    <Billboard position={position} follow lockX={false} lockY={false} lockZ={false}>
      <group scale={[mobileScale, mobileScale, mobileScale]}>
        <mesh onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
          <planeGeometry args={[1.2, 3.0]} />
          <shaderMaterial
            ref={matRef}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={uniforms}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* lilwater.png above the vat */}
        <mesh position={[0, 1.45, 0.01]}>
          <planeGeometry args={[0.9, 0.35]} />
          <meshBasicMaterial map={lilwaterTex} transparent depthWrite={false} />
        </mesh>
        {/* lilbill.png below the vat */}
        <mesh position={[0, -1.55, 0.01]}>
          <planeGeometry args={[0.9, 0.35]} />
          <meshBasicMaterial map={lilbillTex} transparent depthWrite={false} />
        </mesh>
      </group>
    </Billboard>
  );
}
