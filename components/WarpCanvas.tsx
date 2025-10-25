
import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { useTexture, OrthographicCamera, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useWarpStore } from '../hooks/useWarpStore';

const deformGeometry = (
  geometry: THREE.BufferGeometry,
  originalPositions: THREE.BufferAttribute,
  curve: THREE.CatmullRomCurve3,
  warpIntensity: number,
  pathOffset: number,
  imageLengthRatio: number,
) => {
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  
  for (let i = 0; i < pos.count; i++) {
    const x = originalPositions.getX(i);
    const y = originalPositions.getY(i);

    const u = (x + 1) / 2;
    const t = pathOffset + u * imageLengthRatio;
    const clampedT = Math.max(0, Math.min(1, t));

    const pointOnPath = curve.getPointAt(clampedT);
    const tangent = curve.getTangentAt(clampedT).normalize();

    const normal = new THREE.Vector3(-tangent.y, tangent.x, 0);
    const offsetVector = new THREE.Vector3().copy(normal).multiplyScalar(y * warpIntensity);
    const newPos = pointOnPath.add(offsetVector);
    
    pos.setXYZ(i, newPos.x, newPos.y, newPos.z);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
};


const DeformablePlane: React.FC<{ texture: THREE.Texture }> = ({ texture }) => {
  const { resolution, warpIntensity, controlPoints, heightScale, pathOffset, setPathOffset, imageLengthRatio } = useWarpStore();
  const meshRef = useRef<THREE.Mesh>(null!);
  const planeHeight = 2 * heightScale;
  
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ startPoint: new THREE.Vector3(), startOffset: 0, startT: 0 });

  const intersectionPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);

  const { geometry, originalPositions } = useMemo(() => {
    const geom = new THREE.PlaneGeometry(2, planeHeight, resolution, 1);
    const origPos = geom.attributes.position.clone();
    return { geometry: geom, originalPositions: origPos };
  }, [resolution, planeHeight]);
  
  useEffect(() => () => geometry.dispose(), [geometry]);

  const curve = useMemo(() => {
    if (controlPoints.length < 2) return null;
    return new THREE.CatmullRomCurve3(controlPoints.map(p => p.clone()), false, 'catmullrom', 0.5);
  }, [controlPoints]);

  const curveLength = useMemo(() => curve?.getLength() ?? 1, [curve]);

  useEffect(() => {
    document.body.style.cursor = isDragging ? 'grabbing' : 'auto';
  }, [isDragging]);

  useFrame(() => {
    if (!meshRef.current || !curve) return;
    deformGeometry(
        meshRef.current.geometry,
        originalPositions,
        curve,
        warpIntensity,
        pathOffset,
        imageLengthRatio
    );
  });
  
  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!e.uv || !curve) return;

    setIsDragging(true);

    const startPointOnPlane = new THREE.Vector3();
    if (!e.ray.intersectPlane(intersectionPlane, startPointOnPlane)) {
      console.error("Ray did not intersect the drag plane on pointer down.");
      setIsDragging(false);
      return;
    }

    const startT = pathOffset + e.uv.x * imageLengthRatio;
    
    dragStartRef.current = { 
      startPoint: startPointOnPlane,
      startOffset: pathOffset,
      startT: Math.max(0, Math.min(1, startT)),
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(false);
     (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !curve) return;
    e.stopPropagation();
    
    const currentPointOnPlane = new THREE.Vector3();
    if (!e.ray.intersectPlane(intersectionPlane, currentPointOnPlane)) {
      return;
    }
    
    const moveVector = currentPointOnPlane.clone().sub(dragStartRef.current.startPoint);
    const tangent = curve.getTangentAt(dragStartRef.current.startT).normalize();
    const distanceAlongCurve = moveVector.dot(tangent);
    const deltaOffset = distanceAlongCurve / curveLength;
    const newOffset = dragStartRef.current.startOffset + deltaOffset;
    
    setPathOffset(newOffset);
  };
  
  return (
    <mesh 
      ref={meshRef}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerUp}
      geometry={geometry}
    >
      <meshStandardMaterial
        map={texture}
        side={THREE.DoubleSide}
        map-anisotropy={16}
      />
    </mesh>
  );
};

const DraggablePoint: React.FC<{ index: number }> = ({ index }) => {
    const { controlPoints, updateControlPoint } = useWarpStore();
    const meshRef = useRef<THREE.Mesh>(null!);
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const intersectionPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
    const intersectionPoint = useMemo(() => new THREE.Vector3(), []);

    useEffect(() => {
        if (meshRef.current) {
            meshRef.current.position.copy(controlPoints[index]);
        }
    }, [controlPoints, index]);
    
    useEffect(() => {
      document.body.style.cursor = isDragging || isHovered ? 'grab' : 'auto';
      if (isDragging) document.body.style.cursor = 'grabbing';
      return () => { document.body.style.cursor = 'auto' };
    }, [isDragging, isHovered]);

    const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setIsDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
        if (!isDragging) return;
        e.stopPropagation();
        if (e.ray.intersectPlane(intersectionPlane, intersectionPoint)) {
            updateControlPoint(index, intersectionPoint);
        }
    };

    return (
        <mesh
            ref={meshRef}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerMove={onPointerMove}
            onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); }}
            onPointerOut={(e) => { e.stopPropagation(); setIsHovered(false); }}
        >
            <sphereGeometry args={[0.05, 32, 32]} />
            <meshBasicMaterial
                color={isDragging ? 'hotpink' : 'white'}
                transparent
                opacity={0.8}
            />
        </mesh>
    );
};

const ControlPointDraggers = () => {
    const { controlPoints } = useWarpStore();
    return (
        <group>
            {controlPoints.map((_, i) => (
                <DraggablePoint key={i} index={i} />
            ))}
        </group>
    );
};

const CurvePath = () => {
    const { controlPoints } = useWarpStore();
    const curve = useMemo(() => new THREE.CatmullRomCurve3(controlPoints.map(p => p.clone()), false, 'catmullrom', 0.5), [controlPoints]);
    const points = useMemo(() => curve.getPoints(100), [curve]);
    
    return <Line points={points} color="white" lineWidth={1} transparent opacity={0.5} />;
};

const Scene: React.FC = () => {
    const {
        saveTrigger,
        imageUrl,
        warpIntensity,
        controlPoints,
        heightScale,
        pathOffset,
        imageLengthRatio,
        setIsSaving,
    } = useWarpStore();

    const texture = useTexture(imageUrl || 'https://picsum.photos/1024/1024');
  
    useEffect(() => {
      if (saveTrigger === 0) return;
      if (!texture || !texture.image) return;

      const handleSave = (sourceTexture: THREE.Texture) => {
          setIsSaving(true);
          
          let geometry: THREE.PlaneGeometry | undefined;
          let material: THREE.MeshBasicMaterial | undefined;
          let textureCopy: THREE.Texture | undefined;
          let offscreenRenderer: THREE.WebGLRenderer | undefined;

          const cleanup = () => {
              geometry?.dispose();
              material?.dispose();
              textureCopy?.dispose();
              offscreenRenderer?.dispose();
              setIsSaving(false);
          };

          try {
              const { naturalWidth } = sourceTexture.image;
              
              const highResWidthSegments = Math.min(2048, naturalWidth / 2);
              const planeHeight = 2 * heightScale;
              const highResHeightSegments = Math.round(highResWidthSegments * heightScale);

              geometry = new THREE.PlaneGeometry(2, planeHeight, highResWidthSegments, highResHeightSegments);
              const originalPositions = geometry.attributes.position.clone();
              const curve = new THREE.CatmullRomCurve3(controlPoints.map(p => p.clone()), false, 'catmullrom', 0.5);

              deformGeometry(geometry, originalPositions, curve, warpIntensity, pathOffset, imageLengthRatio);

              geometry.computeBoundingBox();
              const box = geometry.boundingBox!;
              
              const center = new THREE.Vector3();
              box.getCenter(center);
              const size = new THREE.Vector3();
              box.getSize(size);

              const worldWidth = size.x;
              const worldHeight = size.y;

              const pixelsPerUnit = naturalWidth / 2;
              const outputWidth = Math.ceil(worldWidth * pixelsPerUnit);
              const outputHeight = Math.ceil(worldHeight * pixelsPerUnit);
              
              if (outputWidth <= 0 || outputHeight <= 0) {
                  throw new Error(`Calculated output dimensions are invalid: ${outputWidth}x${outputHeight}`);
              }

              offscreenRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
              offscreenRenderer.setPixelRatio(1);
              offscreenRenderer.setSize(outputWidth, outputHeight);

              const offscreenScene = new THREE.Scene();
              const offscreenCamera = new THREE.OrthographicCamera(
                  -worldWidth / 2, worldWidth / 2,
                  worldHeight / 2, -worldHeight / 2,
                  0.1, 1000
              );
              offscreenCamera.position.z = 5;
              
              textureCopy = new THREE.Texture(sourceTexture.image);
              textureCopy.anisotropy = offscreenRenderer.capabilities.getMaxAnisotropy();
              
              textureCopy.onUpdate = () => {
                  if (!offscreenRenderer) return;
                  // Final render now that the texture is ready for this context
                  offscreenRenderer.render(offscreenScene, offscreenCamera);

                  const dataURL = offscreenRenderer.domElement.toDataURL('image/png');
                  const link = document.createElement('a');
                  link.download = 'warped-image.png';
                  link.href = dataURL;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  
                  cleanup();
              };
              
              material = new THREE.MeshBasicMaterial({ map: textureCopy, transparent: true, side: THREE.DoubleSide });
              const mesh = new THREE.Mesh(geometry, material);
              
              mesh.position.set(-center.x, -center.y, -center.z);
              offscreenScene.add(mesh);
              
              textureCopy.needsUpdate = true;
              
              // Initial render to kickstart the texture upload
              offscreenRenderer.render(offscreenScene, offscreenCamera);
              
          } catch (error) {
              console.error("Failed to save image:", error);
              alert("Could not save image. Check browser console for details.");
              cleanup();
          }
      };

      handleSave(texture);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [saveTrigger]);
  
    return (
      <>
        <ambientLight intensity={1.5} />
        <directionalLight position={[0, 0, 5]} intensity={1} />
        <CurvePath />
        <React.Suspense fallback={null}>
            <DeformablePlane texture={texture} />
        </React.Suspense>
        <ControlPointDraggers />
        <OrthographicCamera makeDefault position={[0, 0, 5]} zoom={100} near={0.1} far={1000} />
      </>
    );
  };
  

const WarpCanvas: React.FC = () => {
  return (
    <Canvas
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      dpr={[1, 2]}
    >
      <Scene />
    </Canvas>
  );
};

export default WarpCanvas;
