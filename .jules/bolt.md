## 2026-10-17 - Direct TypedArray Access in Geometry Plowing Loop
**Learning:** Calling Three.js `BufferAttribute.getX/getZ/setY` methods inside high-frequency per-frame animation/physics loops creates noticeable method dispatch overhead over 5,000+ vertices per frame. Accessing `attribute.array as Float32Array` directly eliminates thousands of function calls per plowing tick.
**Action:** When modifying geometry attributes in high-frequency loops, cast `attribute.array` to `Float32Array` and operate directly on flat array indices (`i * 3`).
