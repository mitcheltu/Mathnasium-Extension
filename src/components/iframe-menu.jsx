import { useState, useEffect, useRef} from "react";


export default function IframeMenu() {
    console.log(4321);
    const [iframes, setIframes] = useState({}); // key_id, url
    const [current, setCurrent] = useState('');
    const [isOpen, setOpen] = useState(false);
    const iframeRef = useRef(null);



    function embedPDF(answerKey_id, url) {
        setIframes((prev) => {
            if (answerKey_id in prev) return prev;
            return { ...prev, [answerKey_id]: url };
        });
        setCurrent(answerKey_id);
        setOpen(true);
    }

    useEffect(() => {
        console.log("iframes updated:", iframes);
    }, [iframes]);

    useEffect(() => {
        console.log("isOpen changed to:", isOpen);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        }, [isOpen]);

    useEffect(() => {
        function onClick(e) {
            const anchor = e.target.closest('a');
            if (anchor && anchor.href) {
                e.preventDefault();
                const answerKey_id = anchor.textContent.trim();
                embedPDF(answerKey_id, anchor.href);
            }
        }

        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
        }, []);  // empty deps to run once

    

    function xButtonClick(){        
        setOpen(false);
    }


    
    return(
        <>
        {/* Placeholder to maintain layout when iframe menu is closed */
            isOpen ? null : 
            <div style={{ height: '100%', width: '40%', alignItems: 'center', justifyContent: 'center'}}>
                <h1>Answer Keys Are Displayed Here</h1>
            </div>
        }

        <div className="math-ext-pdf-viewer-container" style={{ visibility: isOpen && current ? "visible" : "hidden",
    opacity: isOpen && current ? 1 : 0, pointerEvents: isOpen && current ? "auto" : "none"}}>
            <div className="math-ext-button-menu">
                {Object.keys(iframes).map((id) => (
                    <button className="math-ext-menu-buttons" key={id} onClick={() => setCurrent(id)}>
                        {id}
                    </button>
                ))}
            </div>
            <iframe id="math-ext-pdf-iframe" ref={iframeRef} src={isOpen ? iframes[current] : ""} title="PDF-Viewer"></iframe>
            <button id="math-ext-X-button" onClick={xButtonClick}>X</button>
            
        </div>
        </>
    );
}