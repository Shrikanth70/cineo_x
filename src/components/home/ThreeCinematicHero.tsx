'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { FIXTURE_MOVIES } from '@/data/fixtures';
import { safeStorage } from '@/lib/storage';
import { Search, Play, Pause, Sparkles, ArrowRight } from 'lucide-react';

export function ThreeCinematicHero() {
  const router = useRouter();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const [query, setQuery] = useState('');

  // Sync ref with state
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Check prefers-reduced-motion & safeStorage on mount
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stored = safeStorage.getPauseMotion();
    if (prefersReduced || stored) {
      setIsPaused(true);
      isPausedRef.current = true;
    }
  }, []);

  const togglePause = () => {
    const next = !isPaused;
    setIsPaused(next);
    isPausedRef.current = next;
    safeStorage.setPauseMotion(next);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/discover?q=${encodeURIComponent(query.trim())}`);
    }
  };

  // Three.js Scene Setup & Lifecycle
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    let animationFrameId: number;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 600;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0c, 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 8.5);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      // Graceful fallback if WebGL is unavailable or fails
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 2. Cinematic Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    // Warm amber key spotlight
    const amberSpot = new THREE.SpotLight(0xf5c26b, 4.5, 25, Math.PI / 4, 0.4, 1.2);
    amberSpot.position.set(0, 6, 6);
    scene.add(amberSpot);

    // Cool rim light from rear
    const coolRimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    coolRimLight.position.set(-5, -2, -5);
    scene.add(coolRimLight);

    // 3. Curved 3D Film Cells Group
    const filmGroup = new THREE.Group();
    scene.add(filmGroup);

    const posters = FIXTURE_MOVIES.slice(0, 8);
    const textureLoader = new THREE.TextureLoader();

    // Create film frames in a graceful curved carousel arc
    const frameGeometry = new THREE.PlaneGeometry(1.6, 2.3, 16, 16);
    const borderGeometry = new THREE.PlaneGeometry(1.72, 2.44);
    const borderMaterial = new THREE.MeshBasicMaterial({
      color: 0x1f242e,
      wireframe: false,
      transparent: true,
      opacity: 0.85,
    });

    const meshes: THREE.Mesh[] = [];
    const radius = 5.2;

    posters.forEach((movie, i) => {
      const angle = (i / posters.length) * Math.PI * 2;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius - radius + 1.2;
      const y = Math.sin(i * 0.8) * 0.35;

      const texture = textureLoader.load(movie.posterUrl);
      texture.colorSpace = THREE.SRGBColorSpace;

      const mat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.35,
        metalness: 0.15,
        side: THREE.DoubleSide,
      });

      const frameMesh = new THREE.Mesh(frameGeometry, mat);
      const borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
      borderMesh.position.z = -0.01;
      frameMesh.add(borderMesh);

      frameMesh.position.set(x, y, z);
      frameMesh.rotation.y = angle + Math.PI;
      frameMesh.rotation.x = 0.08;

      filmGroup.add(frameMesh);
      meshes.push(frameMesh);
    });

    // 4. Floating Cinematic Dust / Particle Vortex
    const particleCount = 280;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const amberColor = new THREE.Color(0xf5c26b);
    const coolColor = new THREE.Color(0x38bdf8);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const radiusP = 2 + Math.random() * 6.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.6;

      particlePositions[i3] = radiusP * Math.cos(theta) * Math.cos(phi);
      particlePositions[i3 + 1] = radiusP * Math.sin(phi) + 0.5;
      particlePositions[i3 + 2] = radiusP * Math.sin(theta) * Math.cos(phi);

      const isAmber = Math.random() > 0.4;
      const c = isAmber ? amberColor : coolColor;
      particleColors[i3] = c.r;
      particleColors[i3 + 1] = c.g;
      particleColors[i3 + 2] = c.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 5. Mouse Parallax Tracking
    let targetX = 0;
    let targetY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      targetX = (e.clientX - halfW) / halfW;
      targetY = (e.clientY - halfH) / halfH;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 6. Responsive Window Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 7. Render Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();

      // Smooth parallax damping
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      camera.position.x = mouseX * 0.6;
      camera.position.y = 1.2 - mouseY * 0.35;
      camera.lookAt(0, 0.4, 0);

      // Only advance rotation when not paused
      if (!isPausedRef.current) {
        filmGroup.rotation.y += delta * 0.12;
        particles.rotation.y += delta * 0.05;
        particles.rotation.x += delta * 0.02;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Lifecycle Teardown
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      // Geometries & Materials disposal
      frameGeometry.dispose();
      borderGeometry.dispose();
      borderMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      meshes.forEach((m) => {
        if (Array.isArray(m.material)) {
          m.material.forEach((mat) => mat.dispose());
        } else {
          m.material.dispose();
        }
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative min-h-[82vh] w-full overflow-hidden flex flex-col items-center justify-center pt-8 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Three.js Canvas Container (Background Parallax) */}
      <div
        ref={canvasContainerRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-70"
      />

      {/* Atmospheric Vignette Gradients */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-radial-vignette opacity-60" />

      {/* Hero Foreground Content */}
      <div className="relative z-10 max-w-4xl text-center flex flex-col items-center">
        {/* Craft Controls Badge */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={togglePause}
            aria-pressed={isPaused}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-surface/80 backdrop-blur px-3.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-amber-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-accent"
          >
            {isPaused ? (
              <>
                <Play className="h-3.5 w-3.5 text-amber-accent fill-amber-accent" />
                <span>Resume 3D Motion</span>
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5 text-amber-accent" />
                <span>Pause Motion</span>
              </>
            )}
          </button>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-400">
            <Sparkles className="h-3 w-3 text-amber-accent" />
            <span>Interactive 3D Cinema Space</span>
          </span>
        </div>

        {/* Display Headline */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-6 text-balance">
          Every movie. Every show.{' '}
          <span className="text-amber-accent block sm:inline">Every answer.</span>
        </h1>

        {/* Lead Paragraph */}
        <p className="max-w-2xl text-sm sm:text-base text-zinc-300 leading-relaxed mb-8 text-pretty">
          Unfiltered cinema discovery across all streaming platforms, franchise timelines, and real-time synchronized Watch Parties with friends.
        </p>

        {/* Primary Natural Language Search Pill */}
        <div className="w-full max-w-2xl mb-8">
          <form
            onSubmit={handleSearch}
            className="relative flex items-center rounded-full border border-amber-border/60 bg-surface/90 backdrop-blur-md p-1.5 shadow-glow focus-within:border-amber-accent transition-colors"
          >
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-amber-accent/15 text-amber-accent">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about any movie or franchise..."
              className="flex-1 bg-transparent px-4 text-xs sm:text-sm text-white placeholder-zinc-400 focus:outline-none"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-full bg-amber-accent px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-background hover:bg-amber-hover transition-colors shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span>Explore</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

        {/* Curated Suggestion Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-zinc-400 mr-1">Trending:</span>
          {[
            { label: 'Until Dawn (2025)', href: '/movies-like/101-until-dawn' },
            { label: 'Inception', href: '/movies-like/102-inception' },
            { label: 'Dune Timeline', href: '/watch-order/dune' },
            { label: 'Telugu Cinema', href: '/discover?lang=Telugu' },
            { label: 'Horror Thrillers', href: '/discover?genre=Horror' },
          ].map((chip) => (
            <button
              key={chip.label}
              onClick={() => router.push(chip.href)}
              className="rounded-full border border-white/10 bg-surface/60 px-3 py-1 text-xs text-zinc-300 hover:border-amber-border hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-accent"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

