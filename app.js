const form = document.querySelector("#lockerForm");
const tasksList = document.querySelector("#tasksList");
const taskTemplate = document.querySelector("#taskTemplate");
const resultUrl = document.querySelector("#resultUrl");
const copyLink = document.querySelector("#copyLink");
const openLink = document.querySelector("#openLink");
const addTaskButton = document.querySelector("#addTask");
const resetButton = document.querySelector("#resetForm");
const downloadButton = document.querySelector("#downloadHtml");
const builderView = document.querySelector("#builderView");
const unlockView = document.querySelector("#unlockView");
const unlockTasks = document.querySelector("#unlockTasks");
const unlockTitle = document.querySelector("#unlockTitle");
const destinationLink = document.querySelector("#destinationLink");
const modePill = document.querySelector("#modePill");

const defaultTasks = [
  {
    type: "subscribe",
    label: "Subscribe to the channel",
    url: "https://example.com/channel"
  },
  {
    type: "visit",
    label: "Visit the project page",
    url: "https://example.com"
  }
];

function encodeConfig(config) {
  const json = JSON.stringify(config);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodeConfig(value) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function addTask(task = {}) {
  const row = taskTemplate.content.firstElementChild.cloneNode(true);
  row.querySelector(".task-type").value = task.type || "visit";
  row.querySelector(".task-label").value = task.label || "";
  row.querySelector(".task-url").value = task.url || "";
  row.querySelector(".remove-task").addEventListener("click", () => {
    row.remove();
    if (!tasksList.children.length) addTask();
  });
  tasksList.append(row);
}

function getConfig() {
  const tasks = [...tasksList.querySelectorAll(".task-row")]
    .map((row) => ({
      type: row.querySelector(".task-type").value,
      label: row.querySelector(".task-label").value.trim(),
      url: row.querySelector(".task-url").value.trim()
    }))
    .filter((task) => task.label && task.url);

  return {
    destination: document.querySelector("#destination").value.trim(),
    title: document.querySelector("#title").value.trim() || "Complete the steps to unlock",
    accent: document.querySelector("#accent").value,
    tasks
  };
}

function setResult(url) {
  resultUrl.value = url;
  openLink.href = url;
}

function generateUrl(config) {
  const baseUrl = `${location.origin}${location.pathname}`;
  return `${baseUrl}#unlock=${encodeConfig(config)}`;
}

function progressKey() {
  return `unlockly:progress:${location.hash}`;
}

function loadProgress() {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(progressKey()) || "[]"));
  } catch {
    return new Set();
  }
}

function saveProgress(completed) {
  sessionStorage.setItem(progressKey(), JSON.stringify([...completed]));
}

function renderUnlock(config) {
  builderView.hidden = true;
  unlockView.hidden = false;
  modePill.textContent = "Unlock";
  document.body.className = config.accent ? `accent-${config.accent}` : "";
  unlockTitle.textContent = config.title || "Complete the steps to unlock";
  destinationLink.href = config.destination;
  destinationLink.classList.add("disabled");
  unlockTasks.innerHTML = "";

  const completed = loadProgress();

  function syncUnlockState() {
    if (completed.size === config.tasks.length) {
      destinationLink.classList.remove("disabled");
    }
  }

  config.tasks.forEach((task, index) => {
    const item = document.createElement("div");
    item.className = "unlock-task";
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(task.label)}</strong>
        <span>${escapeHtml(task.type)}</span>
      </div>
      <a class="secondary task-open" href="${escapeAttribute(task.url)}" target="_blank" rel="noreferrer">Open</a>
    `;

    item.querySelector(".task-open").addEventListener("click", (event) => {
      event.preventDefault();
      completed.add(index);
      saveProgress(completed);
      item.classList.add("done");
      item.querySelector(".task-open").textContent = "Done";
      syncUnlockState();
      window.open(task.url, "_blank", "noopener,noreferrer");
    });

    if (completed.has(index)) {
      item.classList.add("done");
      item.querySelector(".task-open").textContent = "Done";
    }

    unlockTasks.append(item);
  });

  syncUnlockState();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function bootBuilder() {
  defaultTasks.forEach(addTask);
  setResult("");
}

function bootUnlockFromHash() {
  const match = location.hash.match(/^#unlock=([^&]+)/);
  if (!match) return false;

  try {
    const config = decodeConfig(match[1]);
    renderUnlock(config);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

function showBuilder() {
  builderView.hidden = false;
  unlockView.hidden = true;
  modePill.textContent = "Builder";
  document.body.className = "";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const config = getConfig();

  if (!config.destination) {
    document.querySelector("#destination").focus();
    return;
  }

  if (!config.tasks.length) {
    addTask();
    tasksList.querySelector(".task-label").focus();
    return;
  }

  const url = generateUrl(config);
  setResult(url);
  localStorage.setItem("unlockly:lastConfig", JSON.stringify(config));
});

addTaskButton.addEventListener("click", () => addTask());

resetButton.addEventListener("click", () => {
  form.reset();
  tasksList.innerHTML = "";
  defaultTasks.forEach(addTask);
  setResult("");
});

copyLink.addEventListener("click", async () => {
  if (!resultUrl.value) return;
  await navigator.clipboard.writeText(resultUrl.value);
  copyLink.textContent = "Copied";
  setTimeout(() => {
    copyLink.textContent = "Copy";
  }, 1200);
});

downloadButton.addEventListener("click", () => {
  const config = getConfig();
  const html = `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${escapeAttribute(generateUrl(config))}"><a href="${escapeAttribute(generateUrl(config))}">Open unlock page</a>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "unlock-link.html";
  a.click();
  URL.revokeObjectURL(url);
});

if (!bootUnlockFromHash()) {
  bootBuilder();
}

window.addEventListener("hashchange", () => {
  if (!bootUnlockFromHash()) {
    showBuilder();
  }
});
