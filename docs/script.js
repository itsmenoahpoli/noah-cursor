const copyBtn = document.getElementById("copy-cmd");

if (copyBtn) {
  const label = copyBtn.querySelector(".btn-label");
  const command = copyBtn.dataset.cmd || "npx noah-cursor browse";

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(command);
      copyBtn.classList.add("copied");
      if (label) label.textContent = "Copied";
      window.setTimeout(() => {
        copyBtn.classList.remove("copied");
        if (label) label.textContent = "Copy";
      }, 1600);
    } catch {
      if (label) label.textContent = "Select & copy";
    }
  });
}

const revealEls = document.querySelectorAll(".section-head, .flow li, .ide-list li, .skill-list li");

if ("IntersectionObserver" in window) {
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
    el.classList.add("will-reveal");
    observer.observe(el);
  }
}
