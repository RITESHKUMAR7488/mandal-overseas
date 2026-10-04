const fs = require("node:fs");
fs.mkdirSync("public/vendor", { recursive: true });
for (const filename of ["gsap.min.js", "ScrollTrigger.min.js"]) {
  fs.copyFileSync(
    `node_modules/gsap/dist/${filename}`,
    `public/vendor/${filename}`,
  );
}
console.log(
  "Local GSAP assets refreshed. License notices remain in their headers.",
);
