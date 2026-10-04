# Mandal Overseas — From Room to Material

A responsive, premium landing page for Mandal Overseas. Built with semantic HTML, CSS 3D faces, vanilla JavaScript and locally served GSAP/ScrollTrigger. No framework or backend is required.

## Local preview

```powershell
npm install
npm run dev -- --listen 3000
```

Open http://localhost:3000. The complete deployable site is in `public/`; fonts, room photography, wood texture, logo and animation libraries are served locally.

## Experience

- Warm interior hero with a recessed wooden door aligned to the measured floor plane, positioned left of the room furniture, and a separate portrait room composition for mobile. Hero text stays in front of the door where they overlap.
- Reversible, native-scroll timeline: room fades, door lifts and makes one smooth turn around its lower-left to upper-right diagonal. Four company chapters appear and fade one at a time, alternating sides.
- Door separates into three named product panels and settles into the actual product boxes.
- The rotating door is a closed cuboid with all six faces. Additional product panels remain hidden until the separation starts.
- Desktop uses three columns; mobile uses vertically stacked boxes with material enquiry links.
- Short previews retain the scroll animation with a compact layout. Motion runs by default; the explicit Pause motion control shows every section in normal flow. Unavailable JavaScript also uses normal document flow.
- Grey interior contact section with existing WhatsApp, call, email, founder and India–Gabon details.
- Cormorant Garamond and Manrope are self-hosted WOFF2 fonts. Font licenses are included.

Products are **Okoume Face Veneers, Okoume Sawn Timber and Okoume Plywood**. The visual separation is a conceptual collection reveal, not a diagram of door construction. No dimensions, grades, certifications or performance specifications are invented. Product links request details by email.

## Verification

With the local preview running:

```powershell
npm run check
npm test
```

The verification uses the installed agent-browser CLI, opens a separate headless session, and checks 1440×900, 768×1024, 390×844 and 360×740. It verifies the door meets the floor, the corner remains on its rotation axis, rotation advances in one direction, all four chapters, door/text separation, product landing positions, loaded images, horizontal overflow, reverse scrolling, mobile navigation, the motion control, short landscape and actual JavaScript-disabled rendering. Screenshots and a JSON report are saved in `artifacts/`.

If Chromium is unavailable on another machine, run `npx agent-browser install` first. To refresh the committed animation libraries after a GSAP dependency update, run `npm run vendor` and rerun verification.

## Assets and maintenance

- `public/index.html`: copy, accessible sections, product and contact links.
- `public/styles.css`: typography, room composition, 3D door surfaces and responsive/static layouts.
- `public/door.css`: recessed frame, floor alignment, mobile room composition and diagonal corner pivot.
- `public/compact.css`: animation layout for short viewports and mobile landscape.
- `public/animation.js`: responsive timelines, landing geometry, navigation and accessibility state.
- `public/assets/`: optimized project-local imagery and existing brand mark.
- `ASSET_PROMPTS.md`: built-in image-generation prompts and reference provenance.

The social preview URL uses the existing production hostname; it will resolve to the new image after publication. No deployment or push is part of this local implementation.
