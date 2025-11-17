console.log('[Background] Service worker loaded');

// Single unified message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle screenshot capture requests
  if (message.type === 'CAPTURE_SCREENSHOT') {
    console.log('[Background] Received CAPTURE_SCREENSHOT request');

    if (!sender.tab) {
      console.error('[Background] No tab context available');
      sendResponse({ error: 'No tab context available' });
      return true;
    }

    console.log('[Background] Capturing visible tab for tab ID:', sender.tab.id);

    chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error('[Background] captureVisibleTab error:', chrome.runtime.lastError);
        sendResponse({ error: chrome.runtime.lastError.message });
        return;
      }

      if (!dataUrl) {
        console.error('[Background] No dataUrl returned from captureVisibleTab');
        sendResponse({ error: 'Failed to capture screenshot - no data returned' });
        return;
      }

      console.log('[Background] Screenshot captured successfully, length:', dataUrl.length);
      
      sendResponse({ 
        success: true, 
        imageDataUrl: dataUrl 
      });
    });

    return true; // Keep async response alive
  }

  // Handle LLM processing requests from content script
  if (message.type === 'PROCESS_LLM') {
    console.log('[Background] Received PROCESS_LLM request');
    console.log('[Background] OCR text length:', message.ocrText?.length);

    handleLLM(message.ocrText, sendResponse);
    
    return true; // Keep sendResponse alive for async
  }

  // No matching message type
  return false;
});

async function handleLLM(ocrText, sendResponse) {
  try {
    console.log('[Background] Sending OCR text to LLM gateway...');
    
    const prompt = `You are a Mathnasium instructor assistant that helps instructors give effective hints to students. 
  Your goal is to help the instructor guide the student toward the correct solution - not give away the final answer.

The student's answer key for their question is shown below:

---
${ocrText}
---

Generate 1-3 short hints that:
- Encourage the student to think critically rather than solve it for them.
- Are age-appropriate (grades 2–12, depending on the problem).
- Focus on the next logical step, not the full solution.
- Use clear and encouraging language similar to how a Mathnasium instructor would talk.

Format your response as:
"Hints:
1. …
2. …
3. …"

If the question is unclear or incomplete, politely note that more information is needed.`;

    const llmResponse = await fetch("https://math-ext-serverless-function.vercel.app/api/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    if (!llmResponse.ok) {
      throw new Error(`LLM API returned ${llmResponse.status}`);
    }

    const result = await llmResponse.json();
    console.log('[Background] Received LLM response, length:', result.output?.length);

    sendResponse({
      success: true,
      ocrText,
      llmOutput: result.output
    });

  } catch (error) {
    console.error('[Background] Error during LLM processing:', error);
    sendResponse({ 
      success: false, 
      error: error.message 
    });
  }
}