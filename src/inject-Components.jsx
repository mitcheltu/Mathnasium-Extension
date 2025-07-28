import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import IframeMenu from "./components/iframe-menu";

const container = document.createElement('div');
container.id = 'math-ext-right-splitscreen';
document.body.appendChild(container);


console.log('1234')
const root = createRoot(container);
root.render(
    <StrictMode>
        <IframeMenu />
    </StrictMode>
);
