import * as THREE from 'three';

// Shared materials for optimal performance
const darkMetalMat = new THREE.MeshStandardMaterial({
  color: 0x1e293b,
  metalness: 0.85,
  roughness: 0.35,
});

const rubberMat = new THREE.MeshStandardMaterial({
  color: 0x111827,
  roughness: 0.9,
  metalness: 0.1,
});

const chromeMat = new THREE.MeshStandardMaterial({
  color: 0xe2e8f0,
  metalness: 0.95,
  roughness: 0.1,
});

const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0x67e8f9,
  metalness: 0.1,
  roughness: 0.1,
  transmission: 0.6,
  transparent: true,
  opacity: 0.75,
});

const woodMat = new THREE.MeshStandardMaterial({
  color: 0x78350f,
  roughness: 0.8,
  metalness: 0.05,
});

const snowMat = new THREE.MeshStandardMaterial({
  color: 0xf8fafc,
  roughness: 0.75,
  metalness: 0.02,
});

export const glowWindowMat = new THREE.MeshStandardMaterial({
  color: 0xfef08a,
  emissive: 0xf59e0b,
  emissiveIntensity: 0.8,
  roughness: 0.3,
});

/**
 * Creates a fully composite procedural Snow Plow Truck (8–14 distinct parts)
 */
export function createSnowPlowTruck(
  bladeLevel: number = 1,
  truckColorHex: string = '#f97316',
  bladeColorHex: string = '#ea580c',
  hasHeater: boolean = false,
  hasSalter: boolean = false
): {
  group: THREE.Group;
  beacon: THREE.Mesh;
  bladeGroup: THREE.Group;
  wheels: THREE.Mesh[];
  contactShadow: THREE.Mesh;
  headlightSpot: THREE.SpotLight;
  headlightLensMat: THREE.MeshStandardMaterial;
} {
  const truckGroup = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(truckColorHex),
    metalness: 0.35,
    roughness: 0.25,
  });

  const bladeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(bladeColorHex),
    metalness: 0.75,
    roughness: 0.3,
  });

  // 1. Lower Chassis Frame (Blackened Steel)
  const chassisGeo = new THREE.BoxGeometry(1.6, 0.45, 3.2);
  const chassis = new THREE.Mesh(chassisGeo, darkMetalMat);
  chassis.position.set(0, 0.5, 0);
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  truckGroup.add(chassis);

  // 2. Cabin Main Body
  const cabinGeo = new THREE.BoxGeometry(1.5, 1.1, 1.7);
  const cabin = new THREE.Mesh(cabinGeo, bodyMat);
  cabin.position.set(0, 1.25, -0.3);
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  truckGroup.add(cabin);

  // 3. Cabin Windshield and Side Windows
  const windshieldGeo = new THREE.BoxGeometry(1.42, 0.6, 0.15);
  const windshield = new THREE.Mesh(windshieldGeo, glassMat);
  windshield.position.set(0, 1.35, -1.16);
  windshield.rotation.x = -0.15;
  truckGroup.add(windshield);

  const sideWindowsGeo = new THREE.BoxGeometry(1.52, 0.55, 0.9);
  const sideWindows = new THREE.Mesh(sideWindowsGeo, glassMat);
  sideWindows.position.set(0, 1.35, -0.3);
  truckGroup.add(sideWindows);

  // 4. Rear Cargo Bed (Carries salt/equipment)
  const bedGeo = new THREE.BoxGeometry(1.52, 0.65, 1.3);
  const bed = new THREE.Mesh(bedGeo, bodyMat);
  bed.position.set(0, 0.85, 0.95);
  bed.castShadow = true;
  truckGroup.add(bed);

  // 5. Wheels (4 chunky heavy tread wheels)
  const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.42, 18);
  wheelGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.44, 12);
  rimGeo.rotateZ(Math.PI / 2);

  const wheels: THREE.Mesh[] = [];
  const wheelOffsets = [
    [-0.85, 0.48, -0.9], // front left
    [0.85, 0.48, -0.9],  // front right
    [-0.85, 0.48, 0.9],  // rear left
    [0.85, 0.48, 0.9],   // rear right
  ];

  wheelOffsets.forEach(([wx, wy, wz]) => {
    const wheelMesh = new THREE.Mesh(wheelGeo, rubberMat);
    wheelMesh.position.set(wx, wy, wz);
    wheelMesh.castShadow = true;

    const rimMesh = new THREE.Mesh(rimGeo, chromeMat);
    wheelMesh.add(rimMesh);

    truckGroup.add(wheelMesh);
    wheels.push(wheelMesh);
  });

  // 6. Amber Warning Flasher Beacon on Roof
  const beaconBaseGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.12, 12);
  const beaconBase = new THREE.Mesh(beaconBaseGeo, darkMetalMat);
  beaconBase.position.set(0, 1.86, -0.3);
  truckGroup.add(beaconBase);

  const beaconGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.22, 12);
  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.2,
    roughness: 0.1,
  });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.set(0, 2.02, -0.3);
  truckGroup.add(beacon);

  // 7. Headlights (Twin bright warm spotlights)
  const lightHousingGeo = new THREE.BoxGeometry(0.3, 0.22, 0.15);
  const lightLensMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfef08a,
    emissiveIntensity: 1.5,
  });

  [-0.55, 0.55].forEach((lx) => {
    const lightHousing = new THREE.Mesh(lightHousingGeo, darkMetalMat);
    lightHousing.position.set(lx, 0.65, -1.62);
    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.05), lightLensMat);
    lens.position.set(0, 0, -0.06);
    lightHousing.add(lens);
    truckGroup.add(lightHousing);
  });

  // Dynamic forward headlight cone beam casting light ahead in dusk/night
  const headlightSpot = new THREE.SpotLight(0xffedd5, 0.0, 28, Math.PI / 4, 0.45, 1.4);
  headlightSpot.position.set(0, 0.75, -1.6);
  const spotTarget = new THREE.Object3D();
  spotTarget.position.set(0, 0, -14);
  truckGroup.add(spotTarget);
  headlightSpot.target = spotTarget;
  truckGroup.add(headlightSpot);

  // 8. Chrome Vertical Exhaust Stack
  const exhaustGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8);
  const exhaust = new THREE.Mesh(exhaustGeo, chromeMat);
  exhaust.position.set(0.68, 1.5, 0.4);
  const exhaustCap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.04, 0.15, 8), darkMetalMat);
  exhaustCap.position.set(0, 0.7, 0);
  exhaust.add(exhaustCap);
  truckGroup.add(exhaust);

  // 9. Front Blade Mount & Plow Blade Assembly (Varies with bladeLevel)
  const bladeGroup = new THREE.Group();
  bladeGroup.position.set(0, 0.25, -1.8);

  // Hydraulic mounting arms
  const armGeo = new THREE.BoxGeometry(0.12, 0.12, 0.7);
  [-0.45, 0.45].forEach((ax) => {
    const arm = new THREE.Mesh(armGeo, darkMetalMat);
    arm.position.set(ax, 0.2, 0.25);
    arm.rotation.x = -0.15;
    bladeGroup.add(arm);
  });

  // Blade geometry based on Level
  let bladeWidth = 2.1;
  if (bladeLevel === 2) bladeWidth = 2.8;
  if (bladeLevel === 3) bladeWidth = 3.5;
  if (bladeLevel >= 4) bladeWidth = 4.2;

  if (bladeLevel === 3) {
    // V-Plow shape (two angled wings)
    const wingWidth = bladeWidth * 0.52;
    const wingGeo = new THREE.BoxGeometry(wingWidth, 0.7, 0.14);
    
    const leftWing = new THREE.Mesh(wingGeo, bladeMat);
    leftWing.position.set(-wingWidth * 0.4, 0.25, 0.2);
    leftWing.rotation.y = 0.38;
    leftWing.castShadow = true;
    bladeGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, bladeMat);
    rightWing.position.set(wingWidth * 0.4, 0.25, 0.2);
    rightWing.rotation.y = -0.38;
    rightWing.castShadow = true;
    bladeGroup.add(rightWing);

    // Center divider wedge
    const wedge = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.75, 0.25), darkMetalMat);
    wedge.position.set(0, 0.25, -0.05);
    bladeGroup.add(wedge);
  } else {
    // Curved/Flat scoop blade
    const mainBladeGeo = new THREE.BoxGeometry(bladeWidth, 0.68, 0.16);
    const mainBlade = new THREE.Mesh(mainBladeGeo, bladeMat);
    mainBlade.position.set(0, 0.25, 0);
    mainBlade.castShadow = true;
    bladeGroup.add(mainBlade);

    // End wing deflectors on wider blades
    if (bladeLevel >= 2) {
      const deflectorGeo = new THREE.BoxGeometry(0.12, 0.68, 0.35);
      const leftDeflector = new THREE.Mesh(deflectorGeo, bladeMat);
      leftDeflector.position.set(-bladeWidth / 2, 0.25, -0.1);
      leftDeflector.rotation.y = -0.3;
      bladeGroup.add(leftDeflector);

      const rightDeflector = new THREE.Mesh(deflectorGeo, bladeMat);
      rightDeflector.position.set(bladeWidth / 2, 0.25, -0.1);
      rightDeflector.rotation.y = 0.3;
      bladeGroup.add(rightDeflector);
    }

    // Industrial Level 4 adds dual rotary turbine sweepers
    if (bladeLevel >= 4) {
      const turbineGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12);
      turbineGeo.rotateZ(Math.PI / 2);
      const turbineMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.9, roughness: 0.2 });
      [-bladeWidth * 0.38, bladeWidth * 0.38].forEach((tx) => {
        const turbine = new THREE.Mesh(turbineGeo, turbineMat);
        turbine.position.set(tx, 0.25, -0.15);
        bladeGroup.add(turbine);
      });
    }
  }

  // Heated Blade Thermal Coils (Glowing orange/red strips if unlocked)
  if (hasHeater) {
    const heaterGeo = new THREE.BoxGeometry(bladeWidth * 0.85, 0.08, 0.05);
    const heaterMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xff3b00,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });
    const heaterStrip = new THREE.Mesh(heaterGeo, heaterMat);
    heaterStrip.position.set(0, 0.1, -0.09);
    bladeGroup.add(heaterStrip);
  }

  truckGroup.add(bladeGroup);

  // 10. Rear Salt Spreader Hopper (if unlocked)
  if (hasSalter) {
    const salterHopperGeo = new THREE.ConeGeometry(0.55, 0.65, 8);
    salterHopperGeo.rotateX(Math.PI);
    const hopper = new THREE.Mesh(salterHopperGeo, darkMetalMat);
    hopper.position.set(0, 0.9, 1.85);

    const spinnerDiscGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 12);
    const spinner = new THREE.Mesh(spinnerDiscGeo, chromeMat);
    spinner.position.set(0, -0.35, 0);
    hopper.add(spinner);

    truckGroup.add(hopper);
  }

  // 11. Soft Radial Contact Shadow Plane (grounds the truck onto snow)
  const contactCanvas = document.createElement('canvas');
  contactCanvas.width = 128;
  contactCanvas.height = 128;
  const cCtx = contactCanvas.getContext('2d')!;
  const cGrad = cCtx.createRadialGradient(64, 64, 10, 64, 64, 60);
  cGrad.addColorStop(0, 'rgba(15, 23, 42, 0.7)');
  cGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.35)');
  cGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  cCtx.fillStyle = cGrad;
  cCtx.fillRect(0, 0, 128, 128);

  const contactTex = new THREE.CanvasTexture(contactCanvas);
  contactTex.colorSpace = THREE.SRGBColorSpace;

  const contactGeo = new THREE.PlaneGeometry(2.7, 4.5);
  contactGeo.rotateX(-Math.PI / 2);

  const contactMat = new THREE.MeshBasicMaterial({
    map: contactTex,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const contactShadow = new THREE.Mesh(contactGeo, contactMat);
  contactShadow.position.set(0, 0.05, 0);
  truckGroup.add(contactShadow);

  return {
    group: truckGroup,
    beacon,
    bladeGroup,
    wheels,
    contactShadow,
    headlightSpot,
    headlightLensMat: lightLensMat,
  };
}

/**
 * Creates a cozy Alpine Chalet house (wood logs, stone chimney, snow roof, warm windows)
 */
export function createAlpineChalet(seed: number = 0, isShop: boolean = false): THREE.Group {
  const house = new THREE.Group();

  // House dimensions
  const width = 4.2 + (seed % 3) * 0.6;
  const depth = 5.0 + ((seed * 7) % 3) * 0.5;
  const height = 3.0;

  // Base stone foundation
  const foundGeo = new THREE.BoxGeometry(width + 0.4, 0.5, depth + 0.4);
  const foundMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
  const found = new THREE.Mesh(foundGeo, foundMat);
  found.position.set(0, 0.25, 0);
  found.castShadow = true;
  found.receiveShadow = true;
  house.add(found);

  // Main wooden chalet walls
  const wallGeo = new THREE.BoxGeometry(width, height, depth);
  const wallColors = [0x9a3412, 0x7c2d12, 0x854d0e, 0x475569];
  const wallColor = wallColors[seed % wallColors.length];
  const wallMesh = new THREE.Mesh(
    wallGeo,
    new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.85 })
  );
  wallMesh.position.set(0, 0.5 + height / 2, 0);
  wallMesh.castShadow = true;
  wallMesh.receiveShadow = true;
  house.add(wallMesh);

  // Steep Alpine Gabled Roof with thick snow blanket
  const roofHeight = 2.4;
  const roofLength = depth + 0.8;
  const roofWidth = width + 1.0;

  // Triangular gable prism
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-roofWidth / 2, 0);
  roofShape.lineTo(0, roofHeight);
  roofShape.lineTo(roofWidth / 2, 0);
  roofShape.closePath();

  const extrudeSettings = {
    steps: 1,
    depth: roofLength,
    bevelEnabled: false,
  };

  const roofGeo = new THREE.ExtrudeGeometry(roofShape, extrudeSettings);
  roofGeo.translate(0, 0, -roofLength / 2);
  const roofMesh = new THREE.Mesh(roofGeo, woodMat);
  roofMesh.position.set(0, height + 0.5, 0);
  roofMesh.castShadow = true;
  house.add(roofMesh);

  // Thick fluffy snow blanket resting on roof
  const snowRoofGeo = new THREE.ExtrudeGeometry(roofShape, {
    steps: 1,
    depth: roofLength + 0.2,
    bevelEnabled: true,
    bevelThickness: 0.18,
    bevelSize: 0.15,
  });
  snowRoofGeo.translate(0, 0.12, -(roofLength + 0.2) / 2);
  const snowRoof = new THREE.Mesh(snowRoofGeo, snowMat);
  snowRoof.position.set(0, height + 0.55, 0);
  snowRoof.castShadow = true;
  snowRoof.receiveShadow = true;
  house.add(snowRoof);

  // Stone Chimney
  const chimGeo = new THREE.BoxGeometry(0.7, 3.2, 0.7);
  const chimMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.95 });
  const chimney = new THREE.Mesh(chimGeo, chimMat);
  chimney.position.set(width * 0.28, height + 1.2, depth * 0.2);
  chimney.castShadow = true;

  const chimCap = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.25, 0.85), snowMat);
  chimCap.position.set(0, 1.6, 0);
  chimney.add(chimCap);
  house.add(chimney);

  // Warm Glowing Windows
  const winGeo = new THREE.BoxGeometry(0.8, 0.8, 0.12);
  [-width * 0.25, width * 0.25].forEach((wx) => {
    // Front windows
    const win = new THREE.Mesh(winGeo, glowWindowMat);
    win.position.set(wx, height * 0.65, depth / 2 + 0.05);
    house.add(win);
  });

  // Front Wooden Door with porch lantern
  const doorGeo = new THREE.BoxGeometry(0.9, 1.6, 0.1);
  const door = new THREE.Mesh(doorGeo, woodMat);
  door.position.set(0, 0.5 + 0.8, depth / 2 + 0.05);
  house.add(door);

  // Front Porch steps
  const porchGeo = new THREE.BoxGeometry(1.6, 0.25, 1.2);
  const porch = new THREE.Mesh(porchGeo, woodMat);
  porch.position.set(0, 0.25, depth / 2 + 0.6);
  house.add(porch);

  // Return house with chimney position for smoke particle emission
  house.userData = {
    chimneyWorldPos: new THREE.Vector3(chimney.position.x, chimney.position.y + 1.6, chimney.position.z),
  };

  return house;
}

/**
 * Creates a beautiful tiered Pine Tree frosted with sculpted snow
 */
export function createSnowPineTree(heightScale: number = 1.0, seed: number = 0): THREE.Group {
  const tree = new THREE.Group();

  // 1. Tapered Brown Trunk
  const trunkHeight = 1.6 * heightScale;
  const trunkGeo = new THREE.CylinderGeometry(0.22 * heightScale, 0.35 * heightScale, trunkHeight, 8);
  const trunk = new THREE.Mesh(trunkGeo, woodMat);
  trunk.position.set(0, trunkHeight / 2, 0);
  trunk.castShadow = true;
  tree.add(trunk);

  // 2. 3 Tiers of Pine Needle Cones + Frosted Snow Caps
  const greenMat = new THREE.MeshStandardMaterial({
    color: 0x14532d, // Deep spruce green
    roughness: 0.85,
    metalness: 0.05,
    flatShading: true,
  });

  const tiers = [
    { radius: 2.2 * heightScale, height: 1.8 * heightScale, y: trunkHeight * 0.7 },
    { radius: 1.7 * heightScale, height: 1.5 * heightScale, y: trunkHeight * 0.7 + 1.1 * heightScale },
    { radius: 1.1 * heightScale, height: 1.3 * heightScale, y: trunkHeight * 0.7 + 2.0 * heightScale },
  ];

  tiers.forEach((tier) => {
    // Green bough cone
    const boughGeo = new THREE.ConeGeometry(tier.radius, tier.height, 8);
    const bough = new THREE.Mesh(boughGeo, greenMat);
    bough.position.set(0, tier.y + tier.height / 2, 0);
    bough.castShadow = true;
    bough.receiveShadow = true;
    tree.add(bough);

    // Sculpted Snow Cap on top of this tier
    const snowCapGeo = new THREE.ConeGeometry(tier.radius * 0.92, tier.height * 0.45, 8);
    const snowCap = new THREE.Mesh(snowCapGeo, snowMat);
    snowCap.position.set(0, tier.y + tier.height * 0.7, 0);
    snowCap.castShadow = true;
    tree.add(snowCap);
  });

  // Random gentle scale and rotation for organic look
  tree.rotation.y = (seed * 1.618) % (Math.PI * 2);
  const s = 0.9 + ((seed * 3) % 4) * 0.08;
  tree.scale.set(s, s, s);

  return tree;
}

/**
 * Creates a cute Snowman with top hat, scarf, and carrot nose
 */
export function createSnowman(): THREE.Group {
  const snowman = new THREE.Group();

  // Bottom snowball
  const baseGeo = new THREE.SphereGeometry(0.7, 14, 12);
  const base = new THREE.Mesh(baseGeo, snowMat);
  base.position.set(0, 0.6, 0);
  base.castShadow = true;
  snowman.add(base);

  // Middle torso
  const torsoGeo = new THREE.SphereGeometry(0.5, 12, 10);
  const torso = new THREE.Mesh(torsoGeo, snowMat);
  torso.position.set(0, 1.45, 0);
  torso.castShadow = true;
  snowman.add(torso);

  // Head
  const headGeo = new THREE.SphereGeometry(0.36, 12, 10);
  const head = new THREE.Mesh(headGeo, snowMat);
  head.position.set(0, 2.1, 0);
  head.castShadow = true;
  snowman.add(head);

  // Carrot nose
  const carrotGeo = new THREE.ConeGeometry(0.08, 0.35, 8);
  carrotGeo.rotateX(Math.PI / 2);
  const carrotMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.6 });
  const carrot = new THREE.Mesh(carrotGeo, carrotMat);
  carrot.position.set(0, 2.1, 0.38);
  snowman.add(carrot);

  // Coal eyes & buttons
  const coalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
  const coalGeo = new THREE.SphereGeometry(0.045, 6, 6);
  [-0.1, 0.1].forEach((ex) => {
    const eye = new THREE.Mesh(coalGeo, coalMat);
    eye.position.set(ex, 2.2, 0.32);
    snowman.add(eye);
  });

  // Red winter scarf
  const scarfMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.7 });
  const scarfGeo = new THREE.TorusGeometry(0.34, 0.1, 8, 16);
  scarfGeo.rotateX(Math.PI / 2);
  const scarf = new THREE.Mesh(scarfGeo, scarfMat);
  scarf.position.set(0, 1.82, 0);
  snowman.add(scarf);

  // Black Top Hat
  const hatBrimGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.05, 14);
  const hatBrim = new THREE.Mesh(hatBrimGeo, darkMetalMat);
  hatBrim.position.set(0, 2.4, 0);
  snowman.add(hatBrim);

  const hatCrownGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.4, 14);
  const hatCrown = new THREE.Mesh(hatCrownGeo, darkMetalMat);
  hatCrown.position.set(0, 2.62, 0);
  snowman.add(hatCrown);

  // Stick arms
  const twigGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6);
  twigGeo.rotateZ(Math.PI / 3);
  const leftArm = new THREE.Mesh(twigGeo, woodMat);
  leftArm.position.set(-0.6, 1.55, 0);
  snowman.add(leftArm);

  const rightArm = new THREE.Mesh(twigGeo, woodMat);
  rightArm.rotation.y = Math.PI;
  rightArm.position.set(0.6, 1.55, 0);
  snowman.add(rightArm);

  return snowman;
}

/**
 * Creates an ornate wrought-iron Streetlamp with warm glowing lantern and snow cap
 */
export function createStreetlamp(): { group: THREE.Group; light: THREE.PointLight; bulbMat: THREE.MeshStandardMaterial } {
  const lamp = new THREE.Group();

  // Dark iron post
  const baseGeo = new THREE.CylinderGeometry(0.3, 0.4, 0.4, 8);
  const base = new THREE.Mesh(baseGeo, darkMetalMat);
  base.position.set(0, 0.2, 0);
  lamp.add(base);

  const postGeo = new THREE.CylinderGeometry(0.1, 0.12, 3.8, 8);
  const post = new THREE.Mesh(postGeo, darkMetalMat);
  post.position.set(0, 2.1, 0);
  lamp.add(post);

  // Lantern housing
  const cageGeo = new THREE.CylinderGeometry(0.28, 0.18, 0.65, 6);
  const cage = new THREE.Mesh(cageGeo, darkMetalMat);
  cage.position.set(0, 4.2, 0);
  lamp.add(cage);

  // Glowing lantern bulb
  const bulbGeo = new THREE.SphereGeometry(0.18, 8, 8);
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xffedd5,
    emissive: 0xfbbf24,
    emissiveIntensity: 2.0,
  });
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.position.set(0, 4.2, 0);
  lamp.add(bulb);

  // Snow cap on top of lamp
  const snowCapGeo = new THREE.ConeGeometry(0.36, 0.3, 8);
  const snowCap = new THREE.Mesh(snowCapGeo, snowMat);
  snowCap.position.set(0, 4.65, 0);
  lamp.add(snowCap);

  // Warm amber point light casting cozy glow on the snow
  const pointLight = new THREE.PointLight(0xfbbf24, 2.2, 14, 1.8);
  pointLight.position.set(0, 4.1, 0);
  pointLight.castShadow = false; // keep frame rate high
  lamp.add(pointLight);

  return { group: lamp, light: pointLight, bulbMat };
}

/**
 * Creates a Mailbox with a snow mound on top
 */
export function createMailbox(): THREE.Group {
  const box = new THREE.Group();

  const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.1, 6);
  const post = new THREE.Mesh(postGeo, woodMat);
  post.position.set(0, 0.55, 0);
  box.add(post);

  const boxGeo = new THREE.BoxGeometry(0.35, 0.3, 0.6);
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 });
  const boxMesh = new THREE.Mesh(boxGeo, boxMat);
  boxMesh.position.set(0, 1.15, 0);
  box.add(boxMesh);

  const snowGeo = new THREE.BoxGeometry(0.38, 0.12, 0.62);
  const snowMesh = new THREE.Mesh(snowGeo, snowMat);
  snowMesh.position.set(0, 1.34, 0);
  box.add(snowMesh);

  return box;
}

/**
 * Creates a cozy wooden fence segment
 */
export function createFenceSegment(length: number = 3): THREE.Group {
  const fence = new THREE.Group();

  // Posts at each end
  const postGeo = new THREE.BoxGeometry(0.18, 1.0, 0.18);
  [-length / 2, length / 2].forEach((px) => {
    const post = new THREE.Mesh(postGeo, woodMat);
    post.position.set(px, 0.5, 0);
    fence.add(post);

    const snowCap = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.22), snowMat);
    snowCap.position.set(px, 1.04, 0);
    fence.add(snowCap);
  });

  // Cross rails
  const railGeo = new THREE.BoxGeometry(length, 0.12, 0.08);
  [0.35, 0.75].forEach((ry) => {
    const rail = new THREE.Mesh(railGeo, woodMat);
    rail.position.set(0, ry, 0);
    fence.add(rail);

    const snowRail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.05, 0.1), snowMat);
    snowRail.position.set(0, ry + 0.08, 0);
    fence.add(snowRail);
  });

  return fence;
}
