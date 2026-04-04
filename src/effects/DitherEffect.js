import { Effect } from 'postprocessing';
import { Uniform } from 'three';

const fragmentShader = /* glsl */ `
  // 8x8 Bayer matrix for ordered dithering
  float bayer8(vec2 p) {
    ivec2 ip = ivec2(mod(p, 8.0));
    int index = ip.x + ip.y * 8;
    // Bayer 8x8 threshold values (0-63 range, normalized)
    int b[64] = int[64](
       0, 32,  8, 40,  2, 34, 10, 42,
      48, 16, 56, 24, 50, 18, 58, 26,
      12, 44,  4, 36, 14, 46,  6, 38,
      60, 28, 52, 20, 62, 30, 54, 22,
       3, 35, 11, 43,  1, 33,  9, 41,
      51, 19, 59, 27, 49, 17, 57, 25,
      15, 47,  7, 39, 13, 45,  5, 37,
      63, 31, 55, 23, 61, 29, 53, 21
    );
    return float(b[index]) / 64.0;
  }

  uniform float ditherStrength;
  uniform float colorLevels;
  uniform float grainAmount;
  uniform float time;

  // Simple hash for grain
  float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 color = inputColor.rgb;

    // Screen-space pixel position for dithering pattern
    vec2 screenPos = uv * resolution;

    // Bayer threshold
    float threshold = bayer8(screenPos) - 0.5;

    // Apply dithering: shift colors by threshold before quantizing
    vec3 dithered = color + threshold * ditherStrength;

    // Quantize to limited color levels (subtle — keeps most detail)
    dithered = floor(dithered * colorLevels + 0.5) / colorLevels;

    // Blend between original and dithered
    vec3 result = mix(color, dithered, 0.55);

    // Subtle animated film grain
    float grain = (hash(screenPos + fract(time * 0.7)) - 0.5) * grainAmount;
    result += grain;

    // Slight luminance-based softening in highlights (keeps white bg clean)
    float lum = dot(result, vec3(0.299, 0.587, 0.114));
    float ditherFade = smoothstep(0.85, 1.0, lum);
    result = mix(result, color, ditherFade);

    outputColor = vec4(result, inputColor.a);
  }
`;

export class DitherEffect extends Effect {
  constructor({
    ditherStrength = 0.08,
    colorLevels = 24.0,
    grainAmount = 0.018,
  } = {}) {
    super('DitherEffect', fragmentShader, {
      uniforms: new Map([
        ['ditherStrength', new Uniform(ditherStrength)],
        ['colorLevels', new Uniform(colorLevels)],
        ['grainAmount', new Uniform(grainAmount)],
        ['time', new Uniform(0)],
      ]),
    });
  }

  update(renderer, inputBuffer, deltaTime) {
    this.uniforms.get('time').value += deltaTime;
  }
}
