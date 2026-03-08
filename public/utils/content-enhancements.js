const PREVIEW_KEY = "__CONTENT_PREVIEW_MAP__";

const createPreviewElement = () => {
  const existing = document.getElementById("content-link-preview");
  if (existing) return existing;

  const tooltip = document.createElement("div");
  tooltip.id = "content-link-preview";
  tooltip.className =
    "pointer-events-none fixed z-[70] hidden max-w-xs rounded-md border border-black/20 bg-[var(--color-background)] px-3 py-2 text-xs shadow-xl dark:border-white/20";
  document.body.appendChild(tooltip);
  return tooltip;
};

const attachHoverPreview = () => {
  const previewMap = window[PREVIEW_KEY];
  if (!previewMap || typeof previewMap !== "object") return;

  const tooltip = createPreviewElement();
  const links = document.querySelectorAll("article a[href^='/notes/'], article a[href^='/snippets/']");

  links.forEach((link) => {
    link.addEventListener("mouseenter", () => {
      const href = link.getAttribute("href");
      if (!href || !previewMap[href]) return;

      const item = previewMap[href];
      tooltip.innerHTML = `
        <p class='m-0 font-semibold text-black dark:text-white'>${item.title}</p>
        <p class='m-0 mt-1 text-black/70 dark:text-white/70'>${item.description}</p>
        <p class='m-0 mt-1 text-[11px] text-black/60 dark:text-white/60'>${(item.tags || []).slice(0, 4).join(" • ")}</p>
      `;
      tooltip.classList.remove("hidden");
    });

    link.addEventListener("mousemove", (event) => {
      tooltip.style.left = `${event.clientX + 14}px`;
      tooltip.style.top = `${event.clientY + 14}px`;
    });

    const hide = () => tooltip.classList.add("hidden");
    link.addEventListener("mouseleave", hide);
    link.addEventListener("blur", hide);
  });
};

const enhanceCodeBlocks = () => {
  const blocks = document.querySelectorAll("article pre");
  blocks.forEach((pre) => {
    if (pre.dataset.enhanced === "true") return;
    pre.dataset.enhanced = "true";

    const code = pre.querySelector("code");
    const classes = (code?.className ?? "").split(" ");
    const languageClass = classes.find((item) => item.startsWith("language-"));
    const language = languageClass ? languageClass.replace("language-", "") : "text";

    const shell = document.createElement("div");
    shell.className = "not-prose mb-2 flex items-center justify-between rounded-t-md border border-black/15 bg-black/[0.04] px-3 py-1.5 text-xs dark:border-white/15 dark:bg-white/[0.04]";
    shell.innerHTML = `<span>${language}</span>`;

    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "rounded-sm border border-black/20 px-2 py-0.5 text-[11px] transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5";
    button.textContent = "Copy";

    button.addEventListener("click", async () => {
      const text = code?.textContent ?? "";
      await navigator.clipboard.writeText(text);
      button.textContent = "Copied";
      window.setTimeout(() => {
        button.textContent = "Copy";
      }, 1300);
    });

    shell.appendChild(button);
    pre.parentElement?.insertBefore(shell, pre);
  });
};

const enhanceHeadings = () => {
  const markdownRoot = document.querySelector("[data-md-content]");
  if (!markdownRoot) return;

  const headings = markdownRoot.querySelectorAll("h2");
  headings.forEach((heading, index) => {
    if (heading.dataset.collapsible === "true") return;
    heading.dataset.collapsible = "true";

    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "ml-2 rounded-sm border border-black/20 px-1.5 py-0.5 text-[11px] align-middle transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5";
    button.textContent = "Collapse";

    const sectionNodes = [];
    let sibling = heading.nextElementSibling;
    while (sibling && sibling.tagName !== "H2") {
      sectionNodes.push(sibling);
      sibling = sibling.nextElementSibling;
    }

    button.addEventListener("click", () => {
      const collapsed = button.getAttribute("aria-pressed") === "true";
      const nextState = !collapsed;
      button.setAttribute("aria-pressed", String(nextState));
      button.textContent = nextState ? "Expand" : "Collapse";
      sectionNodes.forEach((node) => {
        node.style.display = nextState ? "none" : "";
      });
    });

    heading.appendChild(button);

    if (index > 1) return;
  });
};

const wirePrint = () => {
  const button = document.getElementById("print-content-button");
  if (!button) return;
  button.addEventListener("click", () => window.print());
};

const runEnhancements = () => {
  enhanceCodeBlocks();
  enhanceHeadings();
  attachHoverPreview();
  wirePrint();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runEnhancements);
} else {
  runEnhancements();
}
