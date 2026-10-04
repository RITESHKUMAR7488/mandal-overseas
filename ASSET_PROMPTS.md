# Image asset provenance and final prompts

Generated with the built-in image_gen tool, then optimized to project-local WebP/JPEG with Sharp. These are photographic interpretations of the supplied room references; they are not photographs of company premises or verified products. The logo is the existing supplied brand asset.

## Warm interior — public/assets/room-warm.webp and room-warm.jpg

Reference: user attachment `codex-clipboard-4e492d7d-b44e-48df-9ab5-5b4437157912.png`.

Final prompt:

> Create a high-resolution photorealistic architectural interior image for a premium plywood website, based closely on the attached warm room reference. Landscape 3:2 or 16:9 composition. Keep ochre plaster wall, warm slanted afternoon sunlight, parquet floor, pale upholstered armchair and tripod floor lamp and bookshelf on far RIGHT, a subtle potted plant at far LEFT. Front-facing straight-on camera, wall occupies top 83 percent, floor bottom 17 percent. Preserve large EMPTY clean wall between x=5% and x=72% for website type and a separate animated door placed later. NO door in this image, no text, no logos, no watermarks. Realistic quiet luxury interior photography, authentic textures, sophisticated warm camel and honey tones. Reconstruct details at high resolution rather than simply enlarging blurry pixels.

## Mobile warm interior — public/assets/room-warm-mobile.webp

Reference: the generated warm interior above, adapted to leave space for the independently animated door and mobile headline.

Final prompt:

> Create a portrait 2:3 photorealistic architectural interior for the MOBILE version of this attached warm room. Preserve the ochre plaster, beautiful honey-colored parquet, white upholstered armchair, wooden tripod floor lamp and shelf at far right. IMPORTANT composition: blank clean ochre wall fills the TOP 86 PERCENT of the image; horizontal white baseboard at y=86 percent, parquet only bottom 14 percent. Furniture is smaller, placed on the lower FAR RIGHT, occupying roughly x=65%-100% and y=60%-93%. Its scale should leave empty wall x=10%-58% in the lower half for an independently composited door. Entire top half is clean empty wall with subtle daylight, for website title. Camera exactly level and front-facing. No plant at left, no foreground objects in lower-left empty wall/floor area. NO door, NO text, NO watermark. Quiet luxury interior photography, credible architecture, realistically sized armchair, atmospheric soft warm afternoon sun.

The rendered image has its floor boundary at approximately 80 percent; responsive cropping and measured door placement use that actual boundary.

## Grey interior — public/assets/room-grey.webp

Reference: user attachment `Screenshot 2026-10-04 095911.png`.

Final prompt:

> Reconstruct the supplied grey room reference as high-resolution premium architectural interior photography. Wide landscape composition 16:9. Keep the concrete plaster grey wall, dark wood plank floor, burnt orange leather lounge chair at LEFT, black floor lamp far left and small round wood side table with delicate plant. Keep RIGHT half as spacious bare grey wall, no added furniture or art. Front-facing camera, authentic material detail, soft natural daylight, sophisticated interior magazine photography. No text, logos, watermark, no door. Preserve the reference's arrangement and colors with sharper realistic detail.

## Wood grain — public/assets/okoume-grain.webp

Final prompt:

> Use case: product-mockup. Create a single seamless-looking flat photographed surface of premium Okoume wood veneer, warm honey walnut brown, beautiful subtle long straight vertical wood grain with natural thin dark growth streaks, matte oiled satin finish, NO knots, NO dramatic swirl, NO objects, no borders or background, no text. Orthographic macro material scan lit perfectly evenly from front. Portrait 2:3, wood grain runs vertically top to bottom across entire image. Authentic realistic timber material suitable for covering a wooden flush door in a luxury architecture website.

The door geometry, face thickness, brass handle, framing, product labels and motion are implemented in HTML/CSS/JavaScript so they remain independently animatable.
