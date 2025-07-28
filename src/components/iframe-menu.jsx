import { useState, useEffect } from "react";


export default function IframeMenu() {
    console.log(4321);
    const [iframes, setIframes] = useState({}); // key_id, url
    const [current, setCurrent] = useState('');


    function embedPDF(answerKey_id, url) { 
         const container = document.getElementById("math-ext-pdf-viewer-container");
         container.style.display = "";

        document.body.style.marginRight = '50%';
        if (!(answerKey_id in iframes)) setIframes((prev) => ({...prev, [answerKey_id]: url}));
        console.log(iframes);
        setCurrent(answerKey_id);
    }

    useEffect(() => {
        document.addEventListener('click', function(e) {
            // Find the closest anchor tag to the clicked element
            console.log('clicked')
            let target = e.target;
            console.log(target);
            console.log(target.href.toLowerCase())
            if (target && target.href.toLowerCase().includes('getwebviewerdocument')) {
                let answerKey_id = target.textContent.trim();
                console.log(answerKey_id);
            
    
                console.log('correct link')
                e.preventDefault();
                embedPDF(answerKey_id, target.href);
            }
        });
    }, [iframes]);

    

    function xButtonClick(){
        const container = document.getElementById("math-ext-pdf-viewer-container");
        
        document.body.style.marginRight = 0;
        container.style.display = "none";
    }


    
    return(
        <div id="math-ext-pdf-viewer-container" style={{display: "none"}}>
            <div id="math-ext-button-menu">
                {Object.keys(iframes).map((id) => (
                    <button className="math-ext-menu-buttons" key={id} onClick={() => setCurrent(id)}>
                        {id}
                    </button>
                ))}
            </div>
            <iframe id="math-ext-pdf-iframe" src={iframes[current]}></iframe>
            <button id="math-ext-X-button" onClick={xButtonClick}>X</button>
            
        </div>
    );
}