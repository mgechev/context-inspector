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
  const statusText = statusEl.querySelector('span');
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

  if (selectedContexts.length !== 2) {
    diffContainer.innerHTML = `
            <div class="no-selection">
                ${
                  selectedContexts.length === 0
                    ? "Select two contexts to compare them"
                    : selectedContexts.length === 1
                    ? "Select one more context to compare"
                    : "Too many contexts selected"
                }
            </div>
        `;
    return;
  }

  const [context1, context2] = selectedContexts;

  // Load the diff library dynamically
  loadDiffLibrary().then(() => {
    const diff = generateDiff(context1.content, context2.content);

    diffContainer.innerHTML = `
            <div class="diff-header">
                <div class="diff-title">Comparing Contexts</div>
                <div class="diff-info">
                    ${context1.title} (${formatTimestamp(
      context1.timestamp
    )}) vs ${context2.title} (${formatTimestamp(context2.timestamp)})
                </div>
            </div>
            <div class="diff-content">${diff}</div>
        `;
  });
}

function loadDiffLibrary() {
  if (window.diff) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/diff@5.1.0/dist/diff.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });
}

function generateDiff(text1, text2) {
  if (!window.diff) {
    // Fallback to simple diff if library not loaded
    return generateSimpleDiff(text1, text2);
  }

  const lines1 = text1.split("\n");
  const lines2 = text2.split("\n");

  const changes = window.diff.diffLines(text1, text2, {
    ignoreWhitespace: false,
    newlineIsToken: true,
  });

  let diffHtml = "";

  changes.forEach((change) => {
    if (change.added) {
      diffHtml += `<div class="diff-line added">+ ${escapeHtml(
        change.value
      )}</div>`;
    } else if (change.removed) {
      diffHtml += `<div class="diff-line removed">- ${escapeHtml(
        change.value
      )}</div>`;
    } else {
      diffHtml += `<div class="diff-line unchanged">  ${escapeHtml(
        change.value
      )}</div>`;
    }
  });

  return diffHtml;
}

function generateSimpleDiff(text1, text2) {
  const lines1 = text1.split("\n");
  const lines2 = text2.split("\n");

  let diff = "";
  let i = 0,
    j = 0;

  while (i < lines1.length || j < lines2.length) {
    if (i < lines1.length && j < lines2.length && lines1[i] === lines2[j]) {
      diff += `<div class="diff-line unchanged">  ${escapeHtml(
        lines1[i]
      )}</div>`;
      i++;
      j++;
    } else {
      if (i < lines1.length) {
        diff += `<div class="diff-line removed">- ${escapeHtml(
          lines1[i]
        )}</div>`;
        i++;
      }
      if (j < lines2.length) {
        diff += `<div class="diff-line added">+ ${escapeHtml(lines2[j])}</div>`;
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
  console.log('Initializing theme...');
  
  // Check for saved theme preference or default to auto
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    console.log('Found saved theme:', savedTheme);
    currentTheme = savedTheme;
    setTheme(currentTheme);
  } else {
    // Auto-detect based on system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    currentTheme = prefersDark ? "dark" : "light";
    console.log('Auto-detected theme:', currentTheme);
    setTheme(currentTheme);
  }

  // Listen for system theme changes
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (currentTheme === "auto") {
      setTheme(e.matches ? "dark" : "light");
    }
  });

  // Setup theme toggle
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    console.log('Theme toggle button found, adding event listener');
    themeToggle.addEventListener("click", toggleTheme);
  } else {
    console.error('Theme toggle button not found during initialization');
  }
}

function setTheme(theme) {
  console.log('Setting theme to:', theme);
  const root = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  
  if (!themeToggle) {
    console.error('Theme toggle button not found');
    return;
  }
  
  const themeText = themeToggle.querySelector(".theme-text");
  const sunIcon = themeToggle.querySelector(".sun-icon");

  if (theme === "dark") {
    root.setAttribute("data-theme", "dark");
    if (themeText) themeText.textContent = "Dark";
    if (sunIcon) {
      sunIcon.innerHTML = `
        <path fill-rule="evenodd" d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" clip-rule="evenodd"></path>
      `;
    }
  } else {
    root.removeAttribute("data-theme");
    if (themeText) themeText.textContent = "Light";
    if (sunIcon) {
      sunIcon.innerHTML = `
        <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path>
      `;
    }
  }

  currentTheme = theme;
  localStorage.setItem("theme", theme);
  console.log('Theme set successfully, currentTheme:', currentTheme);
}

function toggleTheme() {
  console.log('Theme toggle clicked, current theme:', currentTheme);
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  console.log('Switching to theme:', newTheme);
  setTheme(newTheme);
}

// Resizer functionality
function initResizer() {
  const resizer = document.getElementById('resizer');
  const leftPanel = document.querySelector('.left-panel');
  
  if (!resizer || !leftPanel) return;
  
  let isResizing = false;
  let startX;
  let startWidth;
  
  resizer.addEventListener('mousedown', function(e) {
    isResizing = true;
    startX = e.clientX;
    startWidth = parseInt(getComputedStyle(leftPanel).width, 10);
    
    resizer.classList.add('active');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', function(e) {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startX;
    const newWidth = Math.max(280, Math.min(400, startWidth + deltaX));
    
    leftPanel.style.width = newWidth + 'px';
  });
  
  document.addEventListener('mouseup', function() {
    if (!isResizing) return;
    
    isResizing = false;
    resizer.classList.remove('active');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });
  
  // Save and restore resizer position
  const savedWidth = localStorage.getItem('leftPanelWidth');
  if (savedWidth) {
    leftPanel.style.width = savedWidth + 'px';
  }
  
  // Save width on resize
  resizer.addEventListener('mouseup', function() {
    const currentWidth = parseInt(getComputedStyle(leftPanel).width, 10);
    localStorage.setItem('leftPanelWidth', currentWidth);
  });
}

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  initTheme();
  initResizer();
  connectSSE();
});
