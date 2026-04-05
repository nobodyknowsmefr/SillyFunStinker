import React, { useEffect, useRef, useState, useMemo, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const SHOPIFY_SCRIPT_URL = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';

const SHOPIFY_OPTIONS = {
  product: {
    styles: {
      product: {
        '@media (min-width: 601px)': {
          'max-width': 'calc(25% - 20px)',
          'margin-left': '20px',
          'margin-bottom': '50px',
        },
      },
      button: {
        'font-family': 'Avant Garde, sans-serif',
        ':hover': { 'background-color': '#ab76dc' },
        'background-color': '#be83f4',
        ':focus': { 'background-color': '#ab76dc' },
      },
    },
    text: { button: 'Add to cart' },
  },
  productSet: {
    styles: {
      products: {
        '@media (min-width: 601px)': { 'margin-left': '-20px' },
      },
    },
  },
  modalProduct: {
    contents: {
      img: false,
      imgWithCarousel: true,
      button: false,
      buttonWithQuantity: true,
    },
    styles: {
      product: {
        '@media (min-width: 601px)': {
          'max-width': '100%',
          'margin-left': '0px',
          'margin-bottom': '0px',
        },
      },
      button: {
        'font-family': 'Avant Garde, sans-serif',
        ':hover': { 'background-color': '#ab76dc' },
        'background-color': '#be83f4',
        ':focus': { 'background-color': '#ab76dc' },
      },
    },
    text: { button: 'Add to cart' },
  },
  option: {},
  cart: {
    styles: {
      button: {
        'font-family': 'Avant Garde, sans-serif',
        ':hover': { 'background-color': '#ab76dc' },
        'background-color': '#be83f4',
        ':focus': { 'background-color': '#ab76dc' },
      },
    },
    text: { total: 'Subtotal', button: 'Checkout' },
  },
  toggle: {
    styles: {
      toggle: {
        'font-family': 'Avant Garde, sans-serif',
        'background-color': '#be83f4',
        ':hover': { 'background-color': '#ab76dc' },
        ':focus': { 'background-color': '#ab76dc' },
      },
    },
  },
};

function initShopifyBuyButton(node) {
  if (!node) return;

  function ShopifyBuyInit() {
    var client = window.ShopifyBuy.buildClient({
      domain: '41ic0w-2f.myshopify.com',
      storefrontAccessToken: '6e54032e3f45a6f5eae1c08fedff0078',
    });
    window.ShopifyBuy.UI.onReady(client).then(function (ui) {
      ui.createComponent('product', {
        id: '8699892859033',
        node: node,
        moneyFormat: '%24%7B%7Bamount%7D%7D',
        options: SHOPIFY_OPTIONS,
      });
    });
  }

  if (window.ShopifyBuy) {
    if (window.ShopifyBuy.UI) {
      ShopifyBuyInit();
    } else {
      loadScript(ShopifyBuyInit);
    }
  } else {
    loadScript(ShopifyBuyInit);
  }

  function loadScript(cb) {
    var script = document.createElement('script');
    script.async = true;
    script.src = SHOPIFY_SCRIPT_URL;
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(script);
    script.onload = cb;
  }
}

/* ---- Halftone shader (same as main screen) ---- */

const htVertex = /* glsl */ `
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

const htFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uDotScale;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  varying vec2 vScreenUV;

  float celBand(float v, float bands) {
    return floor(v * bands + 0.5) / bands;
  }

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = normalize(vViewPosition);
    vec3 viewNorm = normalize(vNormal);
    vec3 lightDir1 = normalize(vec3(3.0, 5.0, 4.0) - vWorldPosition);
    float diff1 = max(dot(normal, lightDir1), 0.0);
    vec3 lightDir2 = normalize(vec3(-3.0, 3.0, -2.0) - vWorldPosition);
    float diff2 = max(dot(normal, lightDir2), 0.0) * 0.3;
    float rawDiff = diff1 * 0.7 + diff2;
    float toonDiff = celBand(rawDiff, 4.0);
    vec3 halfVec = normalize(lightDir1 + viewDir);
    float rawSpec = pow(max(dot(viewNorm, halfVec), 0.0), 24.0);
    float toonSpec = step(0.5, rawSpec) * 0.6;
    float rim = 1.0 - max(dot(viewNorm, viewDir), 0.0);
    float toonRim = step(0.65, rim) * 0.35;
    float ambient = 0.35;
    vec3 celColor = uColor * (ambient + toonDiff * 0.65) + vec3(1.0) * toonSpec + uColor * toonRim;
    float fresnel = dot(viewNorm, viewDir);
    float edgeFade = smoothstep(0.0, 0.4, fresnel);
    vec2 dotUV = vScreenUV * uDotScale;
    vec2 local = fract(dotUV) - 0.5;
    float distToDot = length(local);
    float lum = dot(celColor, vec3(0.299, 0.587, 0.114));
    float dotRadius = mix(0.42, 0.1, clamp(lum, 0.0, 1.0));
    float dotMask = 1.0 - smoothstep(dotRadius - 0.06, dotRadius + 0.06, distToDot);
    float alpha = uOpacity * edgeFade * mix(0.45, 1.0, dotMask);
    gl_FragColor = vec4(celColor, alpha);
  }
`;

function HtMat({ color, opacity, dotScale }) {
  const matRef = useRef();
  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(color) },
    uOpacity: { value: opacity },
    uDotScale: { value: dotScale || 80.0 },
    uTime: { value: 0.0 },
  }), [color, opacity, dotScale]);

  useFrame((_, dt) => {
    if (matRef.current) matRef.current.uniforms.uTime.value += dt;
  });

  return (
    <shaderMaterial
      ref={matRef}
      vertexShader={htVertex}
      fragmentShader={htFragment}
      uniforms={uniforms}
      transparent
      depthWrite={false}
      side={THREE.DoubleSide}
    />
  );
}

/* ---- Star geometry ---- */
function StarGeo({ size }) {
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

/* ---- Single background shape that follows mouse ---- */
const PRIMARY_COLORS = ['#D63230', '#F5B700', '#1B4DE4', '#2D936C', '#be83f4'];

function BgShape({ seed }) {
  const ref = useRef();
  const t = useRef(Math.random() * 100);
  const { pointer, viewport, camera } = useThree();

  useFrame((_, delta) => {
    if (!ref.current) return;
    t.current += delta;

    const aspect = viewport.width / viewport.height;
    const fovRad = (camera.fov * Math.PI) / 180;
    const dist = Math.abs(seed.z - camera.position.z);
    const halfH = Math.tan(fovRad / 2) * dist;
    const halfW = halfH * aspect;
    const mouseX = pointer.x * halfW;
    const mouseY = pointer.y * halfH;

    // Gently follow the mouse with a spring
    const followStrength = seed.followStrength;
    const targetX = seed.x + mouseX * followStrength;
    const targetY = seed.y + mouseY * followStrength;
    const floatX = Math.sin(t.current * seed.orbitSpeed + seed.phase) * seed.orbitRadius;
    const floatY = Math.cos(t.current * seed.orbitSpeed * 0.7 + seed.phase) * seed.orbitRadius * 0.6;

    ref.current.position.x += (targetX + floatX - ref.current.position.x) * 0.03;
    ref.current.position.y += (targetY + floatY - ref.current.position.y) * 0.03;

    ref.current.rotation.x += delta * seed.rotX;
    ref.current.rotation.y += delta * seed.rotY;
    ref.current.rotation.z += delta * seed.rotZ;
  });

  return (
    <mesh ref={ref} position={[seed.x, seed.y, seed.z]}>
      {seed.type === 'cube' && <boxGeometry args={[seed.size, seed.size, seed.size]} />}
      {seed.type === 'round' && <sphereGeometry args={[seed.size * 0.6, 16, 16]} />}
      {seed.type === 'star' && <StarGeo size={seed.size} />}
      <HtMat color={seed.color} opacity={seed.opacity} dotScale={seed.dotScale} />
    </mesh>
  );
}

/* ---- Background scene with shapes ---- */
function BgShapesScene() {
  const seeds = useMemo(() => {
    const types = ['cube', 'round', 'star'];
    return Array.from({ length: 30 }, (_, i) => {
      const r = () => Math.random();
      return {
        x: (r() - 0.5) * 14,
        y: (r() - 0.5) * 10,
        z: -3 - r() * 6,
        size: 0.3 + r() * 0.7,
        type: types[i % 3],
        color: PRIMARY_COLORS[i % PRIMARY_COLORS.length],
        opacity: 0.15 + r() * 0.25,
        dotScale: 60 + r() * 60,
        orbitSpeed: 0.1 + r() * 0.2,
        orbitRadius: 0.1 + r() * 0.3,
        phase: r() * Math.PI * 2,
        rotX: (r() - 0.5) * 0.3,
        rotY: (r() - 0.5) * 0.4,
        rotZ: (r() - 0.5) * 0.2,
        followStrength: 0.15 + r() * 0.35,
      };
    });
  }, []);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 4]} intensity={0.8} />
      <directionalLight position={[-3, 3, -2]} intensity={0.3} color="#E3F2FD" />
      {seeds.map((s, i) => (
        <BgShape key={i} seed={s} />
      ))}
    </>
  );
}

function FloatingShapes() {
  return (
    <div className="vista-shapes">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ alpha: true }}
      >
        <Suspense fallback={null}>
          <BgShapesScene />
        </Suspense>
      </Canvas>
    </div>
  );
}

/* ---- Vista-style floating popup window (draggable + auto-float + pinch-resize + minimize/close) ---- */
function VistaPopup({ title, children, style, className = '', floatSeed = 0 }) {
  const popupRef = useRef(null);
  const dragged = useRef(false);
  const [pos, setPos] = useState(null);
  const posRef = useRef(null);
  const [scale, setScale] = useState(1);
  const scaleRef = useRef(1);
  const [minimized, setMinimized] = useState(false);
  const [closed, setClosed] = useState(false);
  const animRef = useRef(null);
  const startTime = useRef(Date.now() + floatSeed * 3000);
  const touchId = useRef(null);
  const touchOffset = useRef({ x: 0, y: 0 });
  const pinchStartDist = useRef(0);
  const pinchStartScale = useRef(1);

  // Autonomous floating when not dragged (desktop only)
  useEffect(() => {
    if (dragged.current) return;
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return;
    const animate = () => {
      if (dragged.current || !popupRef.current) return;
      const t = (Date.now() - startTime.current) / 1000;
      const sx = Math.sin(t * 0.12 + floatSeed * 2.1) * 40 + Math.sin(t * 0.07 + floatSeed * 1.3) * 25;
      const sy = Math.cos(t * 0.09 + floatSeed * 3.7) * 30 + Math.cos(t * 0.14 + floatSeed * 0.8) * 20;
      const rot = Math.sin(t * 0.1 + floatSeed * 1.7) * 2;
      popupRef.current.style.transform = `translate(${sx}px, ${sy}px) rotate(${rot}deg)`;
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [floatSeed]);

  // Desktop pointer drag (mouse only)
  const onPointerDown = useCallback((e) => {
    if (e.pointerType === 'touch') return;
    e.preventDefault();
    e.stopPropagation();
    dragged.current = true;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const rect = popupRef.current.getBoundingClientRect();
    const ox = e.clientX - rect.left;
    const oy = e.clientY - rect.top;
    popupRef.current.style.zIndex = '50';

    const onMove = (ev) => {
      const p = { left: ev.clientX - ox, top: ev.clientY - oy };
      posRef.current = p;
      setPos(p);
    };
    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, []);

  // Mobile: attach touch listeners imperatively with { passive: false } so preventDefault works
  useEffect(() => {
    const el = popupRef.current;
    if (!el) return;

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = el.getBoundingClientRect();
        touchId.current = touch.identifier;
        touchOffset.current = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
        dragged.current = true;
        if (animRef.current) cancelAnimationFrame(animRef.current);
        el.style.zIndex = '50';
      } else if (e.touches.length === 2) {
        e.preventDefault();
        touchId.current = null;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchStartDist.current = Math.sqrt(dx * dx + dy * dy);
        pinchStartScale.current = scaleRef.current;
      }
    };

    const handleTouchMove = (e) => {
      e.preventDefault(); // THIS works because { passive: false }
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const s = Math.max(0.4, Math.min(2.5, pinchStartScale.current * (dist / pinchStartDist.current)));
        scaleRef.current = s;
        setScale(s);
      } else if (e.touches.length === 1 && touchId.current !== null) {
        const touch = e.touches[0];
        const p = { left: touch.clientX - touchOffset.current.x, top: touch.clientY - touchOffset.current.y };
        posRef.current = p;
        setPos(p);
      }
    };

    const handleTouchEnd = () => {
      touchId.current = null;
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [closed, minimized]);

  const handleMinimize = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    setMinimized((v) => !v);
  }, []);

  const handleClose = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setClosed(true);
  }, []);

  if (closed) return null;

  const mergedStyle = pos
    ? { ...style, position: 'fixed', left: pos.left, top: pos.top, right: 'auto', bottom: 'auto', transform: `scale(${scale})`, transformOrigin: 'top left' }
    : style;

  return (
    <div
      ref={popupRef}
      className={`vista-popup ${className} ${minimized ? 'vista-popup--minimized' : ''}`}
      style={{ ...mergedStyle, touchAction: 'none' }}
    >
      <div className="vista-popup__titlebar" onPointerDown={onPointerDown} style={{ cursor: 'grab' }}>
        <span className="vista-popup__title">{title}</span>
        <div className="vista-popup__controls" onPointerDown={(e) => e.stopPropagation()}>
          <span className="vista-popup__ctrl" onClick={handleMinimize} style={{ cursor: 'pointer' }}>—</span>
          <span className="vista-popup__ctrl vista-popup__ctrl--close" onClick={handleClose} style={{ cursor: 'pointer' }}>✕</span>
        </div>
      </div>
      {!minimized && (
        <div className="vista-popup__body">
          {children}
        </div>
      )}
    </div>
  );
}

export default function ShopPage({ onBack, fortuneImage }) {
  const buyBtnRef = useRef(null);
  const initRef = useRef(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    if (buyBtnRef.current && !initRef.current) {
      initRef.current = true;
      initShopifyBuyButton(buyBtnRef.current);
    }
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const popups = (
    <>
      <VistaPopup
        title="the-necklace.png"
        className="vista-popup--necklace"
        floatSeed={0}
        style={isMobile ? {} : { top: '8%', right: '4%' }}
      >
        <img src="/the-necklace.png" alt="Necklace" className="vista-popup__img" />
      </VistaPopup>

      {fortuneImage && (
        <VistaPopup
          title="my_fortune.png"
          className="vista-popup--fortune"
          floatSeed={1}
          style={isMobile ? {} : { bottom: '6%', left: '3%' }}
        >
          <img src={fortuneImage} alt="Your Fortune" className="vista-popup__img" />
        </VistaPopup>
      )}

      <VistaPopup
        title="README.txt - Notepad"
        className="vista-popup--notepad"
        floatSeed={2}
        style={isMobile ? {} : { top: '12%', left: '2%' }}
      >
        <div className="notepad-menubar">
          <span>File</span>
          <span>Edit</span>
          <span>Format</span>
          <span>View</span>
          <span>Help</span>
        </div>
        <div className="notepad-content">
{`Please make sure to save the image that holds your fortune as well as the instruction on the exact pattern placement for your shapes that you must follow in order to activate the fortune.

This is a pre-order so please allow 4-5 weeks for the necklaces to be shipped.

Thank you for supporting ykare and The Shape Store.`}
        </div>
      </VistaPopup>
    </>
  );

  return (
    <div className="shop-page">
      {/* Floating background shapes */}
      <FloatingShapes />

      {/* On mobile: popups in a row at top. On desktop: floating freely */}
      {isMobile ? (
        <div className="vista-popup-row">{popups}</div>
      ) : (
        popups
      )}

      {/* Vista-style browser window */}
      <div className="vista-browser">
        {/* Title bar */}
        <div className="vista-browser__titlebar">
          <img src="/favicon.svg" alt="" className="vista-browser__favicon" />
          <span className="vista-browser__title">The Shape Store - Windows Internet Explorer</span>
          <div className="vista-browser__controls">
            <span className="vista-browser__ctrl">—</span>
            <span className="vista-browser__ctrl">☐</span>
            <span className="vista-browser__ctrl vista-browser__ctrl--close">✕</span>
          </div>
        </div>

        {/* Menu bar */}
        <div className="vista-browser__menubar">
          <span>File</span>
          <span>Edit</span>
          <span>View</span>
          <span>Favorites</span>
          <span>Tools</span>
          <span>Help</span>
        </div>

        {/* Address bar */}
        <div className="vista-browser__addressbar">
          <span className="vista-browser__address-label">Address</span>
          <div className="vista-browser__address-input">
            <span className="vista-browser__lock">🔒</span>
            https://theshapestore.com/obtain
          </div>
          <button className="vista-browser__go">Go</button>
        </div>

        {/* Browser content area */}
        <div className="vista-browser__content">
          <div className="vista-browser__bg">
            {/* Logo at top */}
            <div className="shop-header">
              <img src="/thelogo.png" alt="The Shape Store" className="shop-header__logo" />
            </div>

            {/* Shopify Buy Button */}
            <div className="shop-product">
              <div ref={buyBtnRef} id="product-component-shop" />
            </div>

            {/* Back link */}
            <button className="shop-back-btn" onClick={onBack}>
              ← Back to Fortune
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="vista-browser__statusbar">
          <span>Done</span>
          <span>Internet | Protected Mode: On</span>
        </div>
      </div>
    </div>
  );
}
