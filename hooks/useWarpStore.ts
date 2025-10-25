import { create } from 'zustand';
import * as THREE from 'three';

interface WarpState {
  imageUrl: string | null;
  resolution: number;
  warpIntensity: number;
  heightScale: number;
  pathOffset: number;
  imageLengthRatio: number;
  controlPoints: THREE.Vector3[];
  setImageUrl: (url: string | null) => void;
  setResolution: (res: number) => void;
  setWarpIntensity: (intensity: number) => void;
  setHeightScale: (scale: number) => void;
  setPathOffset: (offset: number) => void;
  setImageLengthRatio: (ratio: number) => void;
  updateControlPoint: (index: number, position: THREE.Vector3) => void;
  saveTrigger: number;
  triggerSave: () => void;
  isSaving: boolean;
  setIsSaving: (isSaving: boolean) => void;
}

const initialPoints = [
  new THREE.Vector3(-1.5, 0.5, 0),
  new THREE.Vector3(-0.75, -0.5, 0),
  new THREE.Vector3(0.75, 0.5, 0),
  new THREE.Vector3(1.5, -0.5, 0)
];

export const useWarpStore = create<WarpState>((set) => ({
  imageUrl: 'https://picsum.photos/1024/1024',
  resolution: 50,
  warpIntensity: 1,
  heightScale: 1,
  pathOffset: 0,
  imageLengthRatio: 0.5,
  controlPoints: initialPoints,
  saveTrigger: 0,
  isSaving: false,

  setIsSaving: (isSaving) => set({ isSaving }),
  setImageUrl: (url) => set({ imageUrl: url }),
  setResolution: (res) => set({ resolution: res }),
  setWarpIntensity: (intensity) => set({ warpIntensity: intensity }),
  setHeightScale: (scale) => set({ heightScale: scale }),
  setPathOffset: (offset) =>
    set((state) => ({
      pathOffset: Math.max(0, Math.min(offset, 1 - state.imageLengthRatio)),
    })),
  setImageLengthRatio: (ratio) =>
    set((state) => ({
      imageLengthRatio: ratio,
      pathOffset: Math.min(state.pathOffset, 1 - ratio),
    })),
  updateControlPoint: (index, position) =>
    set((state) => {
      const newPoints = state.controlPoints.map(p => p.clone());
      if (newPoints[index]) {
        newPoints[index].copy(position);
      }
      return { controlPoints: newPoints };
    }),
  triggerSave: () => set((state) => ({ saveTrigger: state.saveTrigger + 1 })),
}));
