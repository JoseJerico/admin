import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

export default function RoomMeasurementAR({ onMeasureComplete }) {
  const mountRef = useRef(null);
  const [points, setPoints] = useState([]);
  const maxPoints = 4;

  useEffect(() => {
    let scene, camera, renderer;
    let raycaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2();
    let pointSpheres = [];

    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    );

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // AR Button
    document.body.appendChild(ARButton.createButton(renderer));

    // Light
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    // Floor reference plane (for raycasting)
    const planeGeometry = new THREE.PlaneGeometry(100, 100);
    const planeMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const floorPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    floorPlane.rotation.x = -Math.PI / 2;
    scene.add(floorPlane);

    // Click handler
    const handleClick = (event) => {
      if (points.length >= maxPoints) return;

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(floorPlane);

      if (intersects.length > 0) {
        const intersectPoint = intersects[0].point.clone();

        // Add small sphere to visualize point
        const sphereGeom = new THREE.SphereGeometry(0.05, 16, 16);
        const sphereMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const sphere = new THREE.Mesh(sphereGeom, sphereMat);
        sphere.position.copy(intersectPoint);
        scene.add(sphere);
        pointSpheres.push(sphere);

        const newPoints = [...points, intersectPoint];
        setPoints(newPoints);

        if (newPoints.length === maxPoints) {
          calculateMeasurements(newPoints);
        }
      }
    };

    const calculateMeasurements = (pts) => {
      // Simple bounding rectangle (assuming roughly rectangular room)
      const xs = pts.map((p) => p.x);
      const zs = pts.map((p) => p.z);
      const length = Math.max(...xs) - Math.min(...xs);
      const width = Math.max(...zs) - Math.min(...zs);
      const area = length * width;

      // Callback to parent
      onMeasureComplete({
        length: length.toFixed(2),
        width: width.toFixed(2),
        area: area.toFixed(2),
      });
    };

    renderer.domElement.addEventListener('click', handleClick);

    const animate = () => {
      renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
      });
    };
    animate();

    // Cleanup
    return () => {
      renderer.domElement.removeEventListener('click', handleClick);
      mountRef.current.removeChild(renderer.domElement);
      pointSpheres.forEach((s) => scene.remove(s));
    };
  }, [points, onMeasureComplete]);

  return <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />;
}