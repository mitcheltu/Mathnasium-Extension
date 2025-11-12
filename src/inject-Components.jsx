import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import IframeMenu from "./components/iframe-menu";
import ScreenshotSelector from "./components/take-screenshot";

// Step 1: Wrap the body
const bodyContent = document.createElement("div");
bodyContent.id = "math-ext-body-original";

while (document.body.firstChild) {
  bodyContent.appendChild(document.body.firstChild);
}

// Step 2: Split container
const splitContainer = document.createElement("div");
splitContainer.id = "math-ext-splitscreen-container";
Object.assign(splitContainer.style, {
  display: "flex",
  width: "100vw",
  height: "100vh",
  margin: 0,
  padding: 0,
  overflow: "hidden",
});

// Step 3: Left pane
const leftPane = document.createElement("div");
leftPane.id = "math-ext-left-splitscreen";
Object.assign(leftPane.style, {
  width: "60%",
  height: "100%",
  borderRight: "1px solid #ccc",
  overflow: "auto",
  backgroundColor: "white",
});
bodyContent.style.width = "100%";
bodyContent.style.height = "100%";
bodyContent.style.overflow = "auto";
leftPane.appendChild(bodyContent);

// Step 4: Right pane
const rightPane = document.createElement("div");
rightPane.id = "math-ext-right-splitscreen";
Object.assign(rightPane.style, {
  width: "40%",
  height: "100%",
  borderLeft: "1px solid #ccc",
  overflow: "hidden",
  backgroundColor: "white",
  position: "relative",
});

// Containers for React
const iframeContainer = document.createElement("div");
iframeContainer.id = "math-ext-iframe-container";
Object.assign(iframeContainer.style, { width: "100%", height: "90%", overflow: "auto" });

const screenshotSelectorContainer = document.createElement("div");
screenshotSelectorContainer.id = "math-ext-screenshot-selector-container";
Object.assign(screenshotSelectorContainer.style, { width: "100%", height: "10%", borderTop: "1px solid #ccc" });

rightPane.appendChild(iframeContainer);
rightPane.appendChild(screenshotSelectorContainer);

splitContainer.appendChild(leftPane);
splitContainer.appendChild(rightPane);
document.body.appendChild(splitContainer);

// ✅ Step 5: Mount React directly
const iframeRoot = createRoot(iframeContainer);
iframeRoot.render(
  <StrictMode>
    <IframeMenu />
  </StrictMode>
);

const screenshotRoot = createRoot(screenshotSelectorContainer);
screenshotRoot.render(
  <StrictMode>
    <ScreenshotSelector />
  </StrictMode>
);

console.log("[EXT] React components mounted successfully");