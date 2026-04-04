import { useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Projects 3D necklace bead positions to 2D screen coords each frame.
 * Writes to a shared mutable ref — no React re-renders.
 */
export function useBeadScreenPositions(outputRef, arcPositions, groupOffset, beadRadius, active) {
  const { camera, gl } = useThree();
  const _v = useRef(new THREE.Vector3());
  const _v2 = useRef(new THREE.Vector3());

  useFrame(({ clock }) => {
    if (!active || !arcPositions?.length) {
      outputRef.current = [];
      return;
    }

    const rect = gl.domElement.getBoundingClientRect();
    const results = [];
    const t = clock.getElapsedTime();

    for (let i = 0; i < arcPositions.length; i++) {
      const [bx, by, bz] = arcPositions[i];
      // Apply group offset + gentle oscillation
      const oscY = Math.sin(t * 0.8 + i * 0.4) * 0.04;
      const oscX = Math.cos(t * 0.5 + i * 0.3) * 0.02;

      _v.current.set(bx + groupOffset[0] + oscX, by + groupOffset[1] + oscY, bz + groupOffset[2]);
      _v.current.project(camera);

      const screenX = rect.left + ((_v.current.x + 1) / 2) * rect.width;
      const screenY = rect.top + ((-_v.current.y + 1) / 2) * rect.height;

      // Project a point offset by beadRadius to get screen-space radius
      _v2.current.set(bx + groupOffset[0] + beadRadius, by + groupOffset[1], bz + groupOffset[2]);
      _v2.current.project(camera);
      const edgeX = rect.left + ((_v2.current.x + 1) / 2) * rect.width;
      const screenRadius = Math.abs(edgeX - screenX) * 1.6; // padding

      results.push({ x: screenX, y: screenY, radius: screenRadius });
    }

    outputRef.current = results;
  });
}
