const copyBtn = document.getElementById("copy-cmd");

if (copyBtn) {
  const label = copyBtn.querySelector(".btn-label");
  const command = copyBtn.dataset.cmd || "npx noah-cursor browse";

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(command);
      copyBtn.classList.add("copied");
      if (label) label.textContent = "Copied";
      toast("Copied to clipboard", { type: "success" });
      window.setTimeout(() => {
        copyBtn.classList.remove("copied");
        if (label) label.textContent = "Copy";
      }, 1600);
    } catch {
      if (label) label.textContent = "Select & copy";
      toast("Could not copy — select and copy manually", { type: "error" });
    }
  });
}

function ensureToastContainer() {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    container.setAttribute("popover", "manual");
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-relevant", "additions");
    document.body.appendChild(container);
  }
  // Native <dialog showModal()> uses the top layer; popover joins it so toasts sit above.
  // Re-show so this entry is the newest top-layer item (above an already-open modal).
  if (typeof container.showPopover === "function") {
    try {
      if (container.matches(":popover-open")) container.hidePopover();
      container.showPopover();
    } catch {
      /* ignore if unsupported */
    }
  }
  return container;
}

function toastIcon(type) {
  if (type === "success") {
    return `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M8 12.5l2.5 2.5L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  if (type === "error") {
    return `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  }
  return `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 8v5M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
}

function toast(message, { type = "success", duration = 2800 } = {}) {
  const container = ensureToastContainer();
  const el = document.createElement("div");
  el.className = `toast toast--${type}`;
  el.setAttribute("role", "status");
  el.innerHTML = `
    ${toastIcon(type)}
    <div class="toast-body">${escapeHtml(message)}</div>
    <button type="button" class="toast-close" aria-label="Dismiss">×</button>
  `;

  const remove = () => {
    el.classList.remove("is-in");
    el.classList.add("is-out");
    window.setTimeout(() => el.remove(), 280);
  };

  el.querySelector(".toast-close")?.addEventListener("click", remove);
  container.appendChild(el);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add("is-in"));
  });
  window.setTimeout(remove, duration);
}

const HEADER_OFFSET = 88;

if (typeof Lenis === "function") {
  const lenis = new Lenis({
    autoRaf: true,
    anchors: {
      offset: -HEADER_OFFSET,
      duration: 1.1,
    },
    smoothWheel: true,
  });

  window.lenis = lenis;

  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) {
      requestAnimationFrame(() => {
        lenis.scrollTo(target, { offset: -HEADER_OFFSET, immediate: true });
      });
    }
  }
} else {
  document.documentElement.style.scrollBehavior = "smooth";
}

function observeReveals(root = document) {
  const revealEls = root.querySelectorAll(
    ".section-head, .flow li, .ide-list li, .skill-list li, .doc-block",
  );

  if (!("IntersectionObserver" in window) || revealEls.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
  );

  for (const el of revealEls) {
    if (!el.classList.contains("will-reveal")) {
      el.classList.add("will-reveal");
    }
    observer.observe(el);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function versionAnchor(version) {
  return `v${String(version).replaceAll(".", "-")}`;
}

function formatReleaseDate(isoDate) {
  if (!isoDate) return "";
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function renderInlineCode(text) {
  return escapeHtml(text).replace(/`([^`]+)`/g, "<code>$1</code>");
}

function compareSemver(a, b) {
  const pa = String(a).split(".").map((n) => Number.parseInt(n, 10) || 0);
  const pb = String(b).split(".").map((n) => Number.parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const av = pa[i] || 0;
    const bv = pb[i] || 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

async function loadReleasesPage() {
  const root = document.getElementById("releases-root");
  if (!root) return;

  const toc = document.getElementById("releases-toc");
  const latestEl = document.getElementById("releases-latest");
  const status = document.getElementById("releases-status");
  const pager = root.querySelector(".doc-pager");
  const src = root.dataset.releasesSrc || "releases.json";

  try {
    const response = await fetch(src, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Failed to load ${src}`);
    const data = await response.json();

    if (latestEl) latestEl.textContent = data.latest || "—";

    const minVersion = data.minVersion || "1.5.7";
    const releases = (Array.isArray(data.releases) ? data.releases : []).filter(
      (release) => compareSemver(release.version, minVersion) >= 0,
    );
    const fragments = [];

    if (data.disclaimer) {
      const d = data.disclaimer;
      fragments.push(`
        <section class="doc-block" id="${escapeHtml(d.id || "disclaimer")}">
          <div class="release-callout" role="note">
            <p class="release-callout-label">${escapeHtml(d.label || "Disclaimer")}</p>
            <h2>${escapeHtml(d.title || "Still in development")}</h2>
            <p>${escapeHtml(d.body || "")}</p>
          </div>
        </section>
      `);
    }

    for (const release of releases) {
      const id = versionAnchor(release.version);
      const isLatest = release.version === data.latest;
      const notes = Array.isArray(release.notes) ? release.notes : [];
      const labels = Array.isArray(release.labels) ? release.labels : [];
      const npmUrl =
        release.npm ||
        `${data.npmUrl || "https://www.npmjs.com/package/noah-cursor"}/v/${encodeURIComponent(release.version)}`;

      const labelHtml = labels
        .map((label) => {
          const text = typeof label === "string" ? label : label.text;
          const tone = typeof label === "string" ? "default" : label.tone || "default";
          if (!text) return "";
          return `<span class="release-tag release-tag--${escapeHtml(tone)}">${escapeHtml(text)}</span>`;
        })
        .join("");

      fragments.push(`
        <section class="doc-block" id="${id}">
          <div class="release-meta">
            <h2>v${escapeHtml(release.version)}</h2>
            ${isLatest ? '<span class="release-tag">latest</span>' : ""}
            ${labelHtml}
            ${
              release.date
                ? `<time class="release-date" datetime="${escapeHtml(release.date)}">${escapeHtml(formatReleaseDate(release.date))}</time>`
                : ""
            }
          </div>
          ${release.title ? `<p class="release-title">${escapeHtml(release.title)}</p>` : ""}
          ${release.summary ? `<p>${escapeHtml(release.summary)}</p>` : ""}
          ${
            notes.length
              ? `<ul class="release-list">${notes
                  .map((note) => `<li>${renderInlineCode(note)}</li>`)
                  .join("")}</ul>`
              : ""
          }
          <p class="release-links">
            <a href="${escapeHtml(npmUrl)}" target="_blank" rel="noopener">npm v${escapeHtml(release.version)} ↗</a>
            ${
              release.tag
                ? ` · <a href="https://github.com/itsmenoahpoli/noah-cursor/releases/tag/${escapeHtml(release.tag)}" target="_blank" rel="noopener">${escapeHtml(release.tag)} ↗</a>`
                : ""
            }
          </p>
        </section>
      `);
    }

    if (data.roadmap) {
      const r = data.roadmap;
      const items = Array.isArray(r.items) ? r.items : [];
      fragments.push(`
        <section class="doc-block" id="${escapeHtml(r.id || "roadmap")}">
          <h2>${escapeHtml(r.title || "Growing next")}</h2>
          ${r.summary ? `<p>${escapeHtml(r.summary)}</p>` : ""}
          ${
            items.length
              ? `<ul class="release-list">${items
                  .map((item) => `<li>${renderInlineCode(item)}</li>`)
                  .join("")}</ul>`
              : ""
          }
        </section>
      `);
    }

    if (status) status.remove();

    const mount = document.createElement("div");
    mount.className = "releases-feed";
    mount.innerHTML = fragments.join("");
    root.insertBefore(mount, pager || null);

    if (toc) {
      const tocItems = [];
      if (data.disclaimer) {
        tocItems.push(
          `<li><a href="#${escapeHtml(data.disclaimer.id || "disclaimer")}">${escapeHtml(data.disclaimer.label || "Disclaimer")}</a></li>`,
        );
      }
      for (const release of releases) {
        tocItems.push(
          `<li><a href="#${versionAnchor(release.version)}">v${escapeHtml(release.version)}</a></li>`,
        );
      }
      if (data.roadmap) {
        tocItems.push(
          `<li><a href="#${escapeHtml(data.roadmap.id || "roadmap")}">${escapeHtml(data.roadmap.title || "Growing next")}</a></li>`,
        );
      }
      toc.innerHTML = tocItems.join("");
    }

    observeReveals(root);

    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      if (target && window.lenis) {
        window.lenis.scrollTo(target, { offset: -HEADER_OFFSET, immediate: true });
      } else if (target) {
        target.scrollIntoView();
      }
    }
  } catch (error) {
    if (status) {
      status.textContent =
        "Could not load release notes. Check releases.json or refresh the page.";
      status.classList.add("is-error");
    }
    console.error(error);
  }
}

observeReveals(document);
loadReleasesPage();
loadCatalogPage();

async function loadCatalogPage() {
  const skillRoot = document.getElementById("skills-catalog");
  const ruleRoot = document.getElementById("rules-catalog");
  if (!skillRoot && !ruleRoot) return;

  const src =
    (skillRoot || ruleRoot).dataset.catalogSrc || "catalog.json";

  try {
    const response = await fetch(src, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Failed to load ${src}`);
    const data = await response.json();

    if (skillRoot) renderCatalogList(skillRoot, data.skills || [], "skill");
    if (ruleRoot) renderCatalogList(ruleRoot, data.rules || [], "rule");
    setupAssetDialog();
    observeReveals(document.getElementById("skills") || document);
    observeReveals(document.getElementById("rules") || document);

    if (window.location.hash.startsWith("#asset-")) {
      const id = window.location.hash.slice("#asset-".length);
      const kind = id.startsWith("rule-") ? "rule" : "skill";
      const assetId = id.replace(/^(skill|rule)-/, "");
      const list = kind === "rule" ? data.rules : data.skills;
      const asset = (list || []).find((item) => item.id === assetId);
      if (asset) openAssetDialog(asset, kind);
    }
  } catch (error) {
    for (const root of [skillRoot, ruleRoot]) {
      if (!root) continue;
      root.innerHTML =
        '<p class="releases-status is-error">Could not load catalog details.</p>';
    }
    console.error(error);
  }
}

function stackBadgeClass(stack) {
  const key = String(stack || "")
    .toLowerCase()
    .replace(/\.js$/i, "js")
    .replace(/[^a-z0-9]+/g, "");

  const map = {
    git: "git",
    docs: "docs",
    react: "react",
    laravel: "laravel",
    nestjs: "nestjs",
    nodejs: "nodejs",
    node: "nodejs",
    nextjs: "nextjs",
    next: "nextjs",
    nuxt: "nuxt",
    multi: "multi",
  };

  return `stack-badge stack-badge--${map[key] || "default"}`;
}

function renderStackBadge(stack) {
  if (!stack) return "";
  return `<span class="${stackBadgeClass(stack)}">${escapeHtml(stack)}</span>`;
}

function renderCatalogList(root, items, kind) {
  if (!items.length) {
    root.innerHTML = `<p class="releases-status">No ${kind}s published yet.</p>`;
    return;
  }

  root.innerHTML = items
    .map(
      (item) => `
      <button
        type="button"
        class="catalog-item"
        data-asset-kind="${escapeHtml(kind)}"
        data-asset-id="${escapeHtml(item.id)}"
        aria-haspopup="dialog"
      >
        <code>${escapeHtml(item.id)}</code>
        ${renderStackBadge(item.stack)}
        <p class="summary">${escapeHtml(item.summary || "")}</p>
        <span class="cta">View details →</span>
      </button>
    `,
    )
    .join("");

  for (const btn of root.querySelectorAll(".catalog-item")) {
    btn.addEventListener("click", () => {
      const asset = items.find((item) => item.id === btn.dataset.assetId);
      if (asset) openAssetDialog(asset, kind);
    });
  }
}

function setupAssetDialog() {
  const dialog = document.getElementById("asset-dialog");
  if (!dialog || dialog.dataset.ready === "1") return;
  dialog.dataset.ready = "1";

  document.getElementById("asset-dialog-close")?.addEventListener("click", () => {
    closeAssetDialog();
  });
  document.getElementById("asset-dialog-dismiss")?.addEventListener("click", () => {
    closeAssetDialog();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeAssetDialog();
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeAssetDialog();
  });

  const copyBtn = document.getElementById("asset-dialog-copy");
  copyBtn?.addEventListener("click", async () => {
    const cmd = document.getElementById("asset-dialog-cmd")?.textContent || "";
    const label = copyBtn.querySelector(".btn-label");
    try {
      await navigator.clipboard.writeText(cmd);
      if (label) label.textContent = "Copied";
      toast("Copied to clipboard", { type: "success" });
      window.setTimeout(() => {
        if (label) label.textContent = "Copy";
      }, 1400);
    } catch {
      if (label) label.textContent = "Select & copy";
      toast("Could not copy — select and copy manually", { type: "error" });
    }
  });
}

function lockPageScroll() {
  if (document.documentElement.classList.contains("modal-open")) return;
  document.documentElement.classList.add("modal-open");
  document.body.classList.add("modal-open");
  if (window.lenis && typeof window.lenis.stop === "function") {
    window.lenis.stop();
  }
}

function unlockPageScroll() {
  document.documentElement.classList.remove("modal-open");
  document.body.classList.remove("modal-open");
  if (window.lenis && typeof window.lenis.start === "function") {
    window.lenis.start();
  }
}

function closeAssetDialog() {
  const dialog = document.getElementById("asset-dialog");
  if (!dialog || !dialog.open || dialog.classList.contains("is-closing")) return;

  dialog.classList.remove("is-open");
  dialog.classList.add("is-closing");

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    dialog.removeEventListener("transitionend", onEnd);
    dialog.classList.remove("is-closing");
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
    unlockPageScroll();
    if (window.location.hash.startsWith("#asset-")) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  };

  const onEnd = (event) => {
    if (event.target !== dialog) return;
    finish();
  };

  dialog.addEventListener("transitionend", onEnd);
  window.setTimeout(finish, 320);
}

function openAssetDialog(asset, kind) {
  const dialog = document.getElementById("asset-dialog");
  if (!dialog) return;

  const kindLabel = kind === "rule" ? "Rule" : "Skill";
  document.getElementById("asset-dialog-kind").textContent = kindLabel;
  document.getElementById("asset-dialog-title").textContent = asset.id;

  const tags = Array.isArray(asset.tags) ? asset.tags : [];
  const highlights = Array.isArray(asset.highlights) ? asset.highlights : [];
  const install =
    asset.install ||
    `npx noah-cursor add --${kind} ${asset.id}`;

  document.getElementById("asset-dialog-body").innerHTML = `
    <div class="asset-dialog-meta">
      ${renderStackBadge(asset.stack)}
      ${asset.version ? `<span class="meta-chip">v${escapeHtml(asset.version)}</span>` : ""}
      ${tags.map((tag) => `<span class="meta-chip">${escapeHtml(tag)}</span>`).join("")}
    </div>
    <p>${escapeHtml(asset.description || asset.summary || "")}</p>
    ${
      asset.whenToUse
        ? `<h3>When to use</h3><p>${escapeHtml(asset.whenToUse)}</p>`
        : ""
    }
    ${
      highlights.length
        ? `<h3>What you get</h3><ul>${highlights
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}</ul>`
        : ""
    }
  `;

  document.getElementById("asset-dialog-cmd").textContent = install;
  const copyLabel = document.querySelector("#asset-dialog-copy .btn-label");
  if (copyLabel) copyLabel.textContent = "Copy";

  history.replaceState(null, "", `#asset-${kind}-${asset.id}`);

  dialog.classList.remove("is-closing", "is-open");
  lockPageScroll();
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      dialog.classList.add("is-open");
    });
  });
}
