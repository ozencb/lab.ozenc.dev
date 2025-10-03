import { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import html2canvas from 'html2canvas';

function createTexture(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function useCroppedBackground() {
  const { gl } = useThree();
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const captureInFlight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let cancelled = false;
    let currentTexture: THREE.Texture | null = null;

    const capture = async () => {
      if (captureInFlight.current) return captureInFlight.current;

      const job = (async () => {
        try {
          const canvas = await html2canvas(document.body, {
            backgroundColor: null,
            logging: false,
            scale: gl.getPixelRatio(),
            useCORS: true,
            ignoreElements: element =>
              element instanceof HTMLCanvasElement &&
              element.classList.contains('scene'),
          });

          if (cancelled) return;

          const nextTexture = createTexture(canvas);
          const prevTexture = currentTexture;
          currentTexture = nextTexture;
          setTexture(nextTexture);
          prevTexture?.dispose();
        } catch (error) {
          console.error('Failed to capture DOM background', error);
        }
      })().finally(() => {
        captureInFlight.current = null;
      });

      captureInFlight.current = job;
      return job;
    };

    capture();

    const handleResize = () => {
      void capture();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', handleResize);
      captureInFlight.current = null;
      currentTexture?.dispose();
    };
  }, [gl]);

  return texture;
}
