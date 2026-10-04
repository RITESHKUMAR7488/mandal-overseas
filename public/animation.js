/* A single reversible timeline. Normal HTML remains the fallback. */
(() => {
  "use strict";

  const menuButton = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".mobile-menu");
  const closeMenu = () => {
    menu.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
  };
  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menu.hidden = !open;
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation",
    );
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) {
      closeMenu();
      menuButton.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!menu.hidden && !event.target.closest(".site-header")) closeMenu();
  });
  menu
    .querySelectorAll("a")
    .forEach((link) => link.addEventListener("click", closeMenu));
  document.getElementById("year").textContent = new Date().getFullYear();

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const scene = document.querySelector(".scene");
  const products = document.querySelector(".products");
  const door = document.querySelector(".door-object");
  const pivot = document.querySelector(".door-pivot");
  const roomImage = document.querySelector(".hero-room img");
  const sheets = gsap.utils.toArray(".sheet");
  const chapters = gsap.utils.toArray(".chapter");
  const wells = gsap.utils.toArray(".product-well");
  let timeline = null;

  function layoutHero() {
    const mobile = innerWidth < 768;
    const short = innerHeight < 520;
    const room = document.querySelector(".hero-room");
    const animated = document.body.classList.contains("motion-ready");
    // refreshInit runs before ScrollTrigger updates the old pinned dimensions.
    const width = animated
      ? document.documentElement.clientWidth
      : roomImage.clientWidth || room.clientWidth;
    const height = animated
      ? document.documentElement.clientHeight * (mobile ? 1.12 : 1)
      : roomImage.clientHeight || room.clientHeight;
    const naturalWidth = roomImage.naturalWidth || (mobile ? 1024 : 1920);
    const naturalHeight = roomImage.naturalHeight || (mobile ? 1536 : 1280);
    const fit = Math.max(width / naturalWidth, height / naturalHeight);
    const renderedHeight = naturalHeight * fit;
    const renderedWidth = naturalWidth * fit;
    const floorFraction = mobile ? 0.8 : 0.813;
    const floor =
      (height - renderedHeight) / 2 + renderedHeight * floorFraction;
    const sceneTop = scene.getBoundingClientRect().top;
    const actionBottom =
      document.querySelector(".hero-copy .button").getBoundingClientRect()
        .bottom - sceneTop;
    const desired = short
      ? Math.min(190, height * 0.48)
      : mobile
        ? Math.min(300, height * 0.38)
        : innerWidth < 1000
          ? Math.min(440, height * 0.52)
          : Math.min(560, height * 0.64);
    const available =
      mobile && !short ? floor - actionBottom - 30 : floor - 115;
    const doorHeight = Math.max(100, Math.min(desired, available));
    // Keep the entire casing to the left of the books, even when cover crops the room.
    const furnitureStart =
      naturalWidth * 0.56 * fit - (renderedWidth - width) / 2;
    const left = mobile
      ? width * (short ? 0.77 : 0.35)
      : Math.max(
          doorHeight / 4 + 24,
          furnitureStart - 35 - doorHeight / 4 - 14,
        );
    scene.style.setProperty("--door-h", doorHeight + "px");
    scene.style.setProperty("--door-w", doorHeight / 2 + "px");
    scene.style.setProperty("--hero-left", left + "px");
    scene.style.setProperty("--hero-top", floor - doorHeight / 2 + "px");
    scene.style.setProperty("--room-floor-y", floor + "px");
    scene.style.setProperty("--furniture-start-x", furnitureStart + "px");
    return { left, centerY: floor - doorHeight / 2 };
  }

  function updateAccessibility() {
    if (!timeline) return;
    const time = timeline.time();
    const heroVisible = time < 1.1;
    document.querySelector(".hero-copy").inert = !heroVisible;
    chapters.forEach((chapter, index) => {
      chapter.inert = !(time >= 1 + index * 1.05 && time < 2.25 + index * 1.05);
    });
    products.inert = time < 6.75;
  }

  const media = gsap.matchMedia();
  const motionControl = document.querySelector(".motion-control");
  motionControl.hidden = false;
  let motionEnabled = true;
  function startMotion() {
    media.add(
      {
        desktop: "(min-width: 768px)",
        mobile: "(max-width: 767px)",
        short: "(max-height: 519px)",
      },
      (context) => {
        const { mobile, short } = context.conditions;
        // Motion is the requested experience; the explicit control provides a static alternative.
        document.body.classList.add("motion-ready");
        document.body.classList.toggle("mobile-story", mobile);
        document.body.classList.toggle("short-story", short);

        layoutHero();
        const sceneHeight = () => scene.clientHeight;
        const heroX = () =>
          parseFloat(scene.style.getPropertyValue("--hero-left")) -
          scene.clientWidth / 2;
        const heroY = () =>
          parseFloat(scene.style.getPropertyValue("--hero-top")) -
          sceneHeight() / 2;
        const storyScale = () => {
          const targetHeight = short
            ? Math.min(155, sceneHeight() * 0.45)
            : mobile
              ? Math.min(240, scene.clientWidth * 0.64)
              : Math.min(320, (scene.clientWidth * 0.21) / 1.1);
          return targetHeight / door.offsetHeight;
        };
        const chapterY = () =>
          short
            ? 0
            : mobile
              ? 74 +
                36 +
                (door.offsetHeight * storyScale()) / 2 -
                sceneHeight() / 2
              : 20;
        const destination = (index) => {
          const target = wells[index].getBoundingClientRect();
          const base = scene.getBoundingClientRect();
          const availableHeight = mobile
            ? target.height - 12
            : target.height * 0.8;
          const scale = Math.min(
            availableHeight / door.offsetHeight,
            (target.width * 0.64) / door.offsetWidth,
          );
          return {
            x:
              target.left +
              target.width / 2 -
              base.left -
              scene.clientWidth / 2,
            y: target.top + target.height / 2 - base.top - sceneHeight() / 2,
            scale,
          };
        };

        gsap.set(door, {
          x: heroX,
          y: heroY,
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
          scale: 1,
        });
        gsap.set(pivot, { "--corner-angle": "0deg" });
        // A closed door is one solid object. Reveal the other materials only at separation.
        gsap.set(sheets.slice(0, 2), { visibility: "hidden" });
        gsap.set(chapters, { autoAlpha: 0 });
        gsap.set(products, { autoAlpha: 0 });
        gsap.set(".material-mark", { autoAlpha: 0 });

        timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            id: "material-story",
            trigger: scene,
            start: "top top",
            end: () => "+=" + sceneHeight() * (mobile ? 4.4 : 6),
            pin: true,
            scrub: 1.1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefreshInit: layoutHero,
          },
          onUpdate: updateAccessibility,
        });

        timeline
          .addLabel("home", 0)
          .to(
            ".hero-copy, .hero-footnote",
            { autoAlpha: 0, duration: 0.5 },
            0.2,
          )
          .to(".hero-room", { autoAlpha: 0, duration: 0.9 }, 0.25)
          .to(".door-frame", { autoAlpha: 0, duration: 0.45 }, 0.3)
          .fromTo(
            door,
            { x: heroX, y: heroY, z: 0, scale: 1 },
            {
              x: () => (short ? innerWidth * 0.24 : 0),
              z: 45,
              y: chapterY,
              scale: storyScale,
              ease: "sine.inOut",
              duration: 1,
            },
            0.25,
          )
          .to(
            ".door-shadow",
            { opacity: 0.1, x: 20, y: 32, duration: 0.9 },
            0.25,
          );

        // A single turn around the lower-left to upper-right diagonal.
        // The corner remains on the axis; the door never reverses direction.
        timeline.to(
          pivot,
          { "--corner-angle": "360deg", duration: 4.05, ease: "none" },
          1.25,
        );
        // The wall shadow disappears as the door leaves the room.
        timeline.to(".door-shadow", { opacity: 0, duration: 0.35 }, 1.05);

        chapters.forEach((chapter, index) => {
          const start = 1.1 + index * 1.05;
          timeline
            .addLabel("chapter-" + index, start + 0.3)
            .fromTo(
              chapter,
              { autoAlpha: 0, x: index % 2 ? 24 : -24 },
              { autoAlpha: 1, x: 0, duration: 0.28, ease: "sine.inOut" },
              start,
            )
            .to(
              chapter,
              { autoAlpha: 0, duration: 0.24, ease: "sine.inOut" },
              start + 0.76,
            );
          if (short) {
            timeline.to(
              door,
              {
                x: () => innerWidth * (index % 2 ? -0.24 : 0.24),
                duration: 0.35,
                ease: "sine.inOut",
              },
              start - 0.35,
            );
          }
        });

        timeline
          .addLabel("split", 5.45)
          .set(sheets.slice(0, 2), { visibility: "visible" }, 5.3)
          .to(".door-handle", { autoAlpha: 0, duration: 0.2 }, 5.3)
          .to(
            door,
            {
              x: 0,
              y: mobile ? chapterY : 0,
              scale: storyScale,
              ease: "sine.inOut",
              duration: 0.6,
            },
            5.3,
          )
          .to(
            sheets[0],
            { x: mobile ? -75 : -180, z: 65, rotationY: -12, duration: 0.65 },
            5.45,
          )
          .to(sheets[1], { x: 0, z: 15, duration: 0.65 }, 5.45)
          .to(
            sheets[2],
            { x: mobile ? 75 : 180, z: -35, rotationY: 12, duration: 0.65 },
            5.45,
          )
          .to(".material-mark", { autoAlpha: 1, duration: 0.4 }, 5.6)
          .to(".door-shadow", { autoAlpha: 0, duration: 0.3 }, 5.5)
          .to(products, { autoAlpha: 1, duration: 0.5 }, 6.25)
          .to(
            door,
            {
              x: 0,
              y: 0,
              z: 0,
              rotationX: 0,
              rotationY: 0,
              rotationZ: 0,
              scale: 1,
              duration: 0.65,
            },
            6.3,
          );

        sheets.forEach((sheet, index) => {
          timeline.to(
            sheet,
            {
              x: () => destination(index).x,
              y: () => destination(index).y,
              scale: () => destination(index).scale,
              z: 0,
              rotationX: 0,
              rotationY: 0,
              rotationZ: 0,
              duration: 0.8,
            },
            6.3 + index * 0.05,
          );
        });
        timeline.addLabel("products", 7.3).to({}, { duration: 0.5 });
        updateAccessibility();

        return () => {
          timeline = null;
          products.inert = false;
          chapters.forEach((chapter) => {
            chapter.inert = false;
          });
          document.querySelector(".hero-copy").inert = false;
          document.body.classList.remove(
            "motion-ready",
            "mobile-story",
            "short-story",
          );
        };
      },
    );
  }
  startMotion();
  motionControl.addEventListener("click", () => {
    motionEnabled = !motionEnabled;
    media.revert();
    window.scrollTo({ top: 0, behavior: "instant" });
    if (motionEnabled) startMotion();
    else layoutHero();
    motionControl.textContent = motionEnabled ? "Pause motion" : "Play motion";
    motionControl.setAttribute("aria-pressed", String(!motionEnabled));
    ScrollTrigger.refresh();
  });

  // Anchors point to timeline labels while their sections are pinned.
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href");
      const target = document.querySelector(id);
      if (!target) return;
      if (
        timeline &&
        (id === "#company" || id === "#home" || id === "#products")
      ) {
        event.preventDefault();
        const label =
          id === "#home"
            ? "home"
            : id === "#company"
              ? "chapter-0"
              : "products";
        const trigger = timeline.scrollTrigger;
        const top =
          trigger.start +
          (timeline.labels[label] / timeline.duration()) *
            (trigger.end - trigger.start);
        window.scrollTo({ top, behavior: "smooth" });
        history.replaceState(null, "", id);
        if (link.classList.contains("skip-link")) {
          target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
        }
      }
    });
  });

  // Loaded fonts and room images can affect destinations; refresh after layout settles.
  document.fonts.ready.then(() => ScrollTrigger.refresh());
  roomImage.addEventListener("load", () => {
    layoutHero();
    ScrollTrigger.refresh();
  });
  window.addEventListener(
    "load",
    () => {
      ScrollTrigger.refresh();
      if (location.hash === "#company" || location.hash === "#products") {
        const link = document.querySelector('a[href="' + location.hash + '"]');
        if (link) link.click();
      }
    },
    { once: true },
  );
  // Keep the timeline intact in the browser's back/forward cache.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) ScrollTrigger.refresh();
  });
})();
