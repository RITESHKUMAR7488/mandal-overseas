/* Run against npm run dev. Uses the installed agent-browser CLI. */
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const cli = path.resolve(
  process.platform === "win32"
    ? "node_modules/agent-browser/bin/agent-browser-win32-x64.exe"
    : "node_modules/agent-browser/bin/agent-browser.js",
);
const session = "mandal-check";
const report = [];
const fallbackOnly = process.argv.includes("--fallback-only");
fs.mkdirSync("artifacts", { recursive: true });
function browser(...args) {
  // A background browser daemon must not inherit a pipe that spawnSync waits on.
  const responseFile = path.join(
    require("node:os").tmpdir(),
    `mandal-browser-${process.pid}.json`,
  );
  const output = fs.openSync(responseFile, "w");
  try {
    const command = process.platform === "win32" ? cli : process.execPath;
    const prefix = process.platform === "win32" ? [] : [cli];
    execFileSync(
      command,
      [...prefix, "--session", session, "--json", ...args],
      { stdio: ["ignore", output, output], timeout: 30000, windowsHide: true },
    );
  } finally {
    fs.closeSync(output);
  }
  const raw = fs.readFileSync(responseFile, "utf8");
  fs.unlinkSync(responseFile);
  const result = JSON.parse(raw);
  assert.ok(result.success, result.error);
  return result.data;
}
const evaluate = (code) => browser("eval", code).result;
const pause = () => new Promise((resolve) => setTimeout(resolve, 1000));
async function scroll(top) {
  evaluate(`window.scrollTo({top:${top},behavior:'instant'})`);
  await pause();
}
const bounds = `(() => {
  const rect = element => { const r = element.getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}; };
  return {viewport:[innerWidth,innerHeight],overflow:document.documentElement.scrollWidth,scene:rect(document.querySelector('.scene')),
    visibleChapters:[...document.querySelectorAll('.chapter')].filter(e=>+getComputedStyle(e).opacity>.8).map(rect),
    door:rect(document.querySelector('.door-pivot')), model:rect(document.querySelector('.door-object')), hero:rect(document.querySelector('.hero-copy h1')),
    floor:parseFloat(document.querySelector('.scene').style.getPropertyValue('--room-floor-y')),front:rect(document.querySelector('.sheet-plywood .sheet-front')),
    frame:rect(document.querySelector('.door-frame')),furnitureStart:parseFloat(document.querySelector('.scene').style.getPropertyValue('--furniture-start-x')),
    heroStack:+getComputedStyle(document.querySelector('.hero-copy')).zIndex,doorStack:+getComputedStyle(document.querySelector('.door-object')).zIndex,
    angle:parseFloat(getComputedStyle(document.querySelector('.door-pivot')).getPropertyValue('--corner-angle')),
    anchor:rect(document.querySelector('.corner-anchor')),
    sheets:[...document.querySelectorAll('.sheet')].map(rect),wells:[...document.querySelectorAll('.product-well')].map(rect),
    products:rect(document.querySelector('.products')),inert:document.querySelector('.products').inert,
    unloaded:[...document.images].filter(i=>(i.loading!=='lazy'&&!i.complete)||(i.complete&&i.naturalWidth===0)).map(i=>i.src)};
})()`;

async function verifyViewport(width, height, name) {
  browser("set", "viewport", String(width), String(height));
  await pause();
  await scroll(0);
  let data = evaluate(bounds);
  assert.equal(
    data.visibleChapters.length,
    0,
    `${name}: company text is visible before scrolling`,
  );
  assert.ok(data.overflow <= width, `${name}: horizontal overflow`);
  assert.equal(data.unloaded.length, 0, `${name}: unloaded image`);
  assert.ok(
    Math.abs(data.front.bottom - data.floor) < 4,
    `${name}: door does not meet the room floor`,
  );
  assert.ok(
    data.hero.right < data.front.left ||
      data.hero.bottom < data.front.top ||
      data.heroStack > data.doorStack,
    `${name}: hero text is obscured by the door`,
  );
  if (width >= 768)
    assert.ok(
      data.frame.right < data.furnitureStart - 20,
      `${name}: door overlaps room furniture`,
    );
  browser("screenshot", `artifacts/${name}-hero.png`);
  const trigger = evaluate(
    `ScrollTrigger.getAll().map(t=>({start:t.start,end:t.end,duration:t.animation.duration(),labels:t.animation.labels}))[0]`,
  );
  assert.ok(trigger, `${name}: missing story trigger`);
  let previousAngle = -1;
  let cornerOffset = null;
  for (let index = 0; index < 4; index++) {
    const top =
      trigger.start +
      (trigger.labels["chapter-" + index] / trigger.duration) *
        (trigger.end - trigger.start);
    await scroll(top);
    data = evaluate(bounds);
    assert.equal(
      data.visibleChapters.length,
      1,
      `${name}: chapter ${index} is unreadable`,
    );
    const text = data.visibleChapters[0];
    assert.equal(
      evaluate(`document.querySelectorAll('.chapter')[${index}].inert`),
      false,
    );
    assert.ok(
      data.angle > previousAngle,
      `${name}: corner rotation reverses direction`,
    );
    previousAngle = data.angle;
    const offset = {
      x: data.anchor.left - data.model.left,
      y: data.anchor.top - data.model.top,
    };
    if (cornerOffset)
      assert.ok(
        Math.abs(offset.x - cornerOffset.x) < 3 &&
          Math.abs(offset.y - cornerOffset.y) < 3,
        `${name}: lower-left corner does not stay on its axis`,
      );
    cornerOffset = offset;
    assert.ok(
      text.left >= 0 &&
        text.right <= width + 1 &&
        text.top >= 74 &&
        text.bottom <= height,
      `${name}: chapter ${index} outside viewport`,
    );
    const door = data.door;
    const overlap = !(
      text.right < door.left ||
      text.left > door.right ||
      text.bottom < door.top ||
      text.top > door.bottom
    );
    assert.equal(overlap, false, `${name}: chapter ${index} overlaps door`);
    if (!index) browser("screenshot", `artifacts/${name}-company.png`);
  }
  await scroll(
    trigger.start +
      (trigger.labels.products / trigger.duration) *
        (trigger.end - trigger.start),
  );
  data = evaluate(bounds);
  assert.equal(data.inert, false, `${name}: product links inaccessible`);
  assert.ok(
    data.products.bottom <= height + 1,
    `${name}: product display overflows viewport`,
  );
  data.sheets.forEach((sheet, index) => {
    const well = data.wells[index];
    assert.ok(
      sheet.left >= well.left - 3 &&
        sheet.right <= well.right + 3 &&
        sheet.top >= well.top - 3 &&
        sheet.bottom <= well.bottom + 3,
      `${name}: panel ${index} misses its box`,
    );
  });
  browser("screenshot", `artifacts/${name}-products.png`);
  await scroll(0);
  assert.equal(
    evaluate(`+getComputedStyle(document.querySelector('.hero-room')).opacity`),
    1,
    `${name}: reverse scroll doesn't restore room`,
  );
  assert.equal(browser("errors").errors.length, 0, `${name}: browser errors`);
  report.push({
    viewport: [width, height],
    name,
    passed: [
      "assets",
      "overflow",
      "four readable chapters",
      "door/text separation",
      "three product landing positions",
      "reverse scroll",
      "no browser errors",
    ],
  });
  console.log(`${name}: passed`);
}

async function verifyNoJavascript() {
  // Disable execution through CDP, reload, then re-enable only for DOM inspection.
  const url = browser("get", "cdp-url").cdpUrl;
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  let counter = 0;
  const pending = new Map();
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error
        ? reject(new Error(message.error.message))
        : resolve(message.result);
    }
  };
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const id = ++counter;
      pending.set(id, { resolve, reject });
      socket.send(
        JSON.stringify({
          id,
          method,
          params,
          ...(sessionId ? { sessionId } : {}),
        }),
      );
    });
  const targets = await send("Target.getTargets");
  const page = targets.targetInfos.find(
    (t) => t.type === "page" && t.url.startsWith("http://localhost:3000"),
  );
  assert.ok(page, "No page to verify without JavaScript");
  const { sessionId } = await send("Target.attachToTarget", {
    targetId: page.targetId,
    flatten: true,
  });
  await send(
    "Emulation.setScriptExecutionDisabled",
    { value: true },
    sessionId,
  );
  await send("Page.reload", { ignoreCache: true }, sessionId);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await send(
    "Emulation.setScriptExecutionDisabled",
    { value: false },
    sessionId,
  );
  const result = await send(
    "Runtime.evaluate",
    {
      expression: `JSON.stringify({class:document.body.className,chapters:document.querySelectorAll('.chapter').length,products:document.querySelectorAll('.product-card').length,height:document.body.scrollHeight,overflow:document.documentElement.scrollWidth,viewport:innerWidth,buttonBottom:document.querySelector('.hero-copy .button').getBoundingClientRect().bottom,doorTop:document.querySelector('.door-object').getBoundingClientRect().top})`,
      returnByValue: true,
    },
    sessionId,
  );
  const data = JSON.parse(result.result.value);
  assert.equal(data.class, "");
  assert.equal(data.chapters, 4);
  assert.equal(data.products, 3);
  assert.ok(data.height > 2000);
  assert.ok(data.overflow <= data.viewport);
  assert.ok(
    data.buttonBottom < data.doorTop,
    "Static mobile door overlaps the enquiry action",
  );
  browser("screenshot", "artifacts/no-javascript.png");
  socket.close();
  report.push({
    name: "JavaScript disabled",
    passed: [
      "normal flow",
      "all company content",
      "three products",
      "no overflow",
    ],
  });
  console.log("JavaScript disabled: passed");
}

(async () => {
  try {
    browser("open", "http://localhost:3000");
    browser("set", "media", "light", "no-preference");
    if (!fallbackOnly) {
      await verifyViewport(1440, 900, "desktop");
      await verifyViewport(768, 1024, "tablet");
      await verifyViewport(390, 844, "mobile");
      await verifyViewport(360, 740, "mobile-small");
      browser("click", ".menu-toggle");
      assert.equal(
        evaluate(
          `document.querySelector('.menu-toggle').getAttribute('aria-expanded')`,
        ),
        "true",
      );
      browser("press", "Escape");
      assert.equal(
        evaluate(`document.querySelector('.mobile-menu').hidden`),
        true,
      );
      browser("click", ".menu-toggle");
      browser("click", '.mobile-menu a[href="#products"]');
      await pause();
      await pause();
      assert.equal(
        evaluate(`document.querySelector('.products').inert`),
        false,
      );
      assert.equal(
        evaluate(`document.querySelector('.mobile-menu').hidden`),
        true,
      );
      report.push({
        name: "Mobile navigation",
        passed: [
          "open",
          "Escape and focus",
          "product jump",
          "close after selection",
        ],
      });
    }
    await verifyViewport(844, 390, "compact-landscape");
    await verifyViewport(430, 480, "compact-preview");
    browser("set", "media", "light", "reduced-motion");
    await verifyViewport(390, 844, "browser-reduced-motion");
    browser("click", ".motion-control");
    await pause();
    await scroll(0);
    assert.equal(evaluate(`ScrollTrigger.getAll().length`), 0);
    assert.equal(
      evaluate(
        `[...document.querySelectorAll('.chapter')].every(e=>getComputedStyle(e).visibility==='visible' && !e.inert)`,
      ),
      true,
    );
    assert.equal(evaluate(`document.querySelector('.products').inert`), false);
    browser("screenshot", "artifacts/paused-motion.png");
    report.push({
      name: "Explicit pause",
      passed: ["no pinning", "all chapters readable", "products accessible"],
    });
    browser("click", ".motion-control");
    await pause();
    assert.equal(evaluate(`ScrollTrigger.getAll().length`), 1);
    assert.equal(
      evaluate(
        `[...document.querySelectorAll('.chapter')].filter(e=>+getComputedStyle(e).opacity>.8).length`,
      ),
      0,
    );
    await verifyNoJavascript();
    if (fallbackOnly && fs.existsSync("artifacts/verification.json")) {
      const earlier = JSON.parse(
        fs.readFileSync("artifacts/verification.json", "utf8"),
      ).report;
      report.unshift(
        ...earlier.filter(
          (entry) =>
            !["Reduced motion", "Mobile landscape"].includes(entry.name) &&
            !report.some((current) => current.name === entry.name),
        ),
      );
    }
    fs.writeFileSync(
      "artifacts/verification.json",
      JSON.stringify({ date: new Date().toISOString(), report }, null, 2),
    );
    console.log(
      "All landing-page checks passed. Screenshots and report saved in artifacts/.",
    );
  } finally {
    browser("close");
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
