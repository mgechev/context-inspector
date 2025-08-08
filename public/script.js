let contexts = [];
let selectedContexts = [];
let eventSource = null;
let currentTheme = "auto";

// Initialize SSE connection
function connectSSE() {
  eventSource = new EventSource("/events");

  eventSource.onopen = function () {
    updateStatus("Connected", true);
  };

  eventSource.onmessage = function (event) {
    contexts = JSON.parse(event.data);
    renderContexts();
  };

  eventSource.onerror = function () {
    updateStatus("Disconnected", false);
    // Try to reconnect after 5 seconds
    setTimeout(connectSSE, 5000);
  };
}

function updateStatus(message, connected) {
  const statusEl = document.getElementById("status");
  const statusText = statusEl.querySelector("span");
  statusText.textContent = message;
  statusEl.className = `status ${connected ? "connected" : "disconnected"}`;
}

function renderContexts() {
  const contextsList = document.getElementById("contextsList");
  contextsList.innerHTML = "";

  contexts.forEach((context) => {
    const contextEl = document.createElement("div");
    contextEl.className = "context-item";
    contextEl.dataset.id = context.id;

    const isSelected = selectedContexts.some((c) => c.id === context.id);
    if (isSelected) {
      contextEl.classList.add("selected");
    }

    contextEl.innerHTML = `
            <div class="context-title">${escapeHtml(context.title)}</div>
            <div class="context-timestamp">${formatTimestamp(
              context.timestamp
            )}</div>
            <div class="context-content">${escapeHtml(context.content)}</div>
        `;

    contextEl.addEventListener("click", () => toggleContextSelection(context));
    contextsList.appendChild(contextEl);
  });
}

function toggleContextSelection(context) {
  const index = selectedContexts.findIndex((c) => c.id === context.id);

  if (index !== -1) {
    // Deselect
    selectedContexts.splice(index, 1);
  } else {
    // Select (max 2)
    if (selectedContexts.length >= 2) {
      selectedContexts.shift();
    }
    selectedContexts.push(context);
  }

  renderContexts();
  renderDiff();
}

function renderDiff() {
  const diffContainer = document.getElementById("diffContainer");

  if (selectedContexts.length === 0) {
    diffContainer.innerHTML = `
      <div class="no-selection">
        Select a context to view it, or select two contexts to compare them
      </div>
    `;
    return;
  }

  if (selectedContexts.length === 1) {
    const context = selectedContexts[0];

    diffContainer.innerHTML = `
      <div class="diff-header">
        <div class="diff-title">Viewing Context</div>
        <div class="diff-info">
          ${context.title} (${formatTimestamp(context.timestamp)})
        </div>
      </div>
      <div class="diff-content">
        <div class="context-view">
          <pre class="context-text">${escapeHtml(context.content)}</pre>
        </div>
      </div>
    `;
    return;
  }

  if (selectedContexts.length > 2) {
    diffContainer.innerHTML = `
      <div class="no-selection">
        Too many contexts selected. Please select only one or two contexts.
      </div>
    `;
    return;
  }

  // Two contexts selected - show diff
  const [context1, context2] = selectedContexts;

  // Add a small delay to ensure the library is fully loaded
  const diff = generateDiff(context1.content, context2.content);

  diffContainer.innerHTML = `
<div class="diff-header">
    <div class="diff-title">Comparing Contexts</div>
    <div class="diff-info">
    ${context1.title} (${formatTimestamp(context1.timestamp)}) vs ${
    context2.title
  } (${formatTimestamp(context2.timestamp)})
    </div>
</div>
<div class="diff-content">${diff}</div>
`;
}

function generateDiff(text1, text2) {
  const changes = window.Diff.diffLines(text1, text2, {
    ignoreWhitespace: false,
    newlineIsToken: true,
  });

  let diffHtml = "";
  let unchangedCount = 0;
  let unchangedContent = "";

  changes.forEach((change, index) => {
    if (change.added) {
      // If we have accumulated unchanged content, add it
      if (unchangedCount > 0) {
        if (unchangedCount >= 3) {
          diffHtml += createCollapsibleSection(unchangedContent, unchangedCount);
        } else {
          diffHtml += createUnchangedContent(unchangedContent);
        }
        unchangedCount = 0;
        unchangedContent = "";
      }
      diffHtml += `<div class="diff-line added">${escapeHtml(
        change.value
      )}</div>`;
    } else if (change.removed) {
      // If we have accumulated unchanged content, add it
      if (unchangedCount > 0) {
        if (unchangedCount >= 3) {
          diffHtml += createCollapsibleSection(unchangedContent, unchangedCount);
        } else {
          diffHtml += createUnchangedContent(unchangedContent);
        }
        unchangedCount = 0;
        unchangedContent = "";
      }
      diffHtml += `<div class="diff-line removed">${escapeHtml(
        change.value
      )}</div>`;
    } else {
      // Accumulate unchanged content
      const lines = change.value.split("\n");
      unchangedCount += lines.length - 1;
      unchangedContent += change.value;
    }
  });

  // Add any remaining unchanged content at the end
  if (unchangedCount > 0) {
    if (unchangedCount >= 3) {
      diffHtml += createCollapsibleSection(unchangedContent, unchangedCount);
    } else {
      diffHtml += createUnchangedContent(unchangedContent);
    }
  }

  return diffHtml;
}

function createUnchangedContent(content) {
  return `<div class="diff-line unchanged">${escapeHtml(content).replace(/\n/g, '<br>')}</div>`;
}

function createCollapsibleSection(content, lineCount) {
  const sectionId = "collapsed-" + Math.random().toString(36).substr(2, 9);
  return `
    <div class="collapsible-section collapsed" data-section-id="${sectionId}">
      <div class="collapsible-header" onclick="toggleCollapsible('${sectionId}')">
        <span class="expand-icon">+</span>
        <span class="collapsed-text">Same content</span>
      </div>
      <div class="collapsible-content" onclick="toggleCollapsible('${sectionId}')">
        <div class="diff-line unchanged">${escapeHtml(content).replace(/\n/g, '<br>')}</div>
      </div>
    </div>
  `;
}

// Make toggleCollapsible globally accessible
window.toggleCollapsible = function (sectionId) {
  const section = document.querySelector(`[data-section-id="${sectionId}"]`);
  if (section) {
    section.classList.toggle("collapsed");
    const icon = section.querySelector(".expand-icon");
    const collapsedText = section.querySelector(".collapsed-text");
    
    if (icon) {
      icon.textContent = section.classList.contains("collapsed") ? "+" : "−";
    }
    
    if (collapsedText) {
      collapsedText.style.display = section.classList.contains("collapsed") ? "inline" : "none";
    }
  }
};

function generateSimpleDiff(text1, text2) {
  const lines1 = text1.split("\n");
  const lines2 = text2.split("\n");

  let diff = "";
  let i = 0,
    j = 0;

  while (i < lines1.length || j < lines2.length) {
    if (i < lines1.length && j < lines2.length && lines1[i] === lines2[j]) {
      diff += `<div class="diff-line unchanged">${escapeHtml(
        lines1[i]
      )}</div>`;
      i++;
      j++;
    } else {
      if (i < lines1.length) {
        diff += `<div class="diff-line removed">-${escapeHtml(
          lines1[i]
        )}</div>`;
        i++;
      }
      if (j < lines2.length) {
        diff += `<div class="diff-line added">+${escapeHtml(lines2[j])}</div>`;
        j++;
      }
    }
  }

  return diff;
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Theme management
function initTheme() {
  // Check for saved theme preference or default to auto
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    currentTheme = savedTheme;
    setTheme(currentTheme);
  } else {
    // Auto-detect based on system preference
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    currentTheme = prefersDark ? "dark" : "light";
    setTheme(currentTheme);
  }

  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
    // Also add event listener for touch devices
    themeToggle.addEventListener("touchend", toggleTheme);
  }
}

function setTheme(theme) {
  const root = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");

  if (!themeToggle) {
    return;
  }

  const themeText = themeToggle.querySelector(".theme-text");
  const sunIcon = themeToggle.querySelector(".sun-icon");

  // Force remove any existing theme attribute first
  root.removeAttribute("data-theme");

  if (theme === "dark") {
    root.setAttribute("data-theme", "dark");
    if (themeText) themeText.textContent = "Dark";
    if (sunIcon) {
      sunIcon.innerHTML = `
        <path fill-rule="evenodd" d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" clip-rule="evenodd"></path>
      `;
    }
  } else {
    if (themeText) themeText.textContent = "Light";
    if (sunIcon) {
      sunIcon.innerHTML = `
        <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path>
      `;
    }
  }

  currentTheme = theme;
  localStorage.setItem("theme", theme);

  // Force a repaint to ensure CSS changes are applied
  document.body.style.display = "none";
  document.body.offsetHeight; // Trigger reflow
  document.body.style.display = "";
}

function toggleTheme(e) {
  if (e) e.preventDefault();
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  setTheme(newTheme);
}

// Resizer functionality
function initResizer() {
  const resizer = document.getElementById("resizer");
  const leftPanel = document.querySelector(".left-panel");

  if (!resizer || !leftPanel) return;

  let isResizing = false;
  let startX;
  let startWidth;

  resizer.addEventListener("mousedown", function (e) {
    isResizing = true;
    startX = e.clientX;
    startWidth = parseInt(getComputedStyle(leftPanel).width, 10);

    resizer.classList.add("active");
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    e.preventDefault();
  });

  document.addEventListener("mousemove", function (e) {
    if (!isResizing) return;

    const deltaX = e.clientX - startX;
    const newWidth = Math.max(280, Math.min(400, startWidth + deltaX));

    leftPanel.style.width = newWidth + "px";
  });

  document.addEventListener("mouseup", function () {
    if (!isResizing) return;

    isResizing = false;
    resizer.classList.remove("active");
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  });

  // Save and restore resizer position
  const savedWidth = localStorage.getItem("leftPanelWidth");
  if (savedWidth) {
    leftPanel.style.width = savedWidth + "px";
  }

  // Save width on resize
  resizer.addEventListener("mouseup", function () {
    const currentWidth = parseInt(getComputedStyle(leftPanel).width, 10);
    localStorage.setItem("leftPanelWidth", currentWidth);
  });
}

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  initTheme();
  initResizer();
  connectSSE();
});
