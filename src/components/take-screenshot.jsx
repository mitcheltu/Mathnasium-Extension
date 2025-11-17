import React, { useState, useRef, useEffect } from 'react';
import { Camera, X } from 'lucide-react';
import Tesseract from 'tesseract.js';

export default function ScreenshotSelector() {
  const [captureMode, setCaptureMode] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentPos, setCurrentPos] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [llmOutput, setLlmOutput] = useState(null);
  const overlayRef = useRef(null);

  const captureScreenshot = async (region) => {
  console.log('[Screenshot] Starting capture for region:', region);

  // Check if Chrome APIs are available
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
    console.warn('[Screenshot] Chrome APIs not available. Using simulated screenshot.');
    return new Promise((resolve) => {
      setTimeout(() => {
        const simulatedImage =
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        console.log('[Screenshot] Simulated screenshot returned.');
        resolve(simulatedImage);
      }, 500);
    });
  }

  try {
    // 1️⃣ Request screenshot from background
    console.log('[Screenshot] Sending capture request to background script...');
    const screenshotDataUrl = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'CAPTURE_SCREENSHOT', region }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Screenshot] Runtime error during capture:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response || !response.imageDataUrl) {
          console.error('[Screenshot] No screenshot returned from background script:', response);
          reject(new Error('No screenshot data returned from background'));
          return;
        }
        console.log('[Screenshot] Screenshot received from background. Length:', response.imageDataUrl.length);
        resolve(response.imageDataUrl);
      });
    });

    

    // crop image
    
    const croppedDataUrl = await cropImage(screenshotDataUrl, region);
    setCapturedImage(croppedDataUrl);

    console.log('[Screenshot] Capture and cropping complete!');
    return croppedDataUrl;

  } catch (error) {
    console.error('[Screenshot] Error during capture/cropping:', error);
    alert('Screenshot capture failed. Please try again.');
    return null;
  }
};


  const cropImage = (dataUrl, region) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = region.width;
      canvas.height = region.height;

      ctx.drawImage(
        img,
        region.x * window.devicePixelRatio,
        region.y * window.devicePixelRatio,
        region.width * window.devicePixelRatio,
        region.height * window.devicePixelRatio,
        0,
        0,
        region.width,
        region.height
      );

      const croppedDataUrl = canvas.toDataURL('image/png');
      console.log('Cropped image length:', croppedDataUrl.length);
      resolve(croppedDataUrl); // <-- resolved here
    };

    img.onerror = (err) => {
      reject(err);
    };

    img.src = dataUrl;
  });
};

  // ✅ Mouse events
  const handleMouseDown = (e) => {
    if (captureMode && e.target === overlayRef.current) {
      const rightBoundary = window.innerWidth * 0.6;
      if (e.clientX >= rightBoundary) {
        const start = { x: e.clientX, y: e.clientY };
        setStartPos(start);
        setCurrentPos(start);
        setIsSelecting(true);
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!isSelecting) return;
    const rightBoundary = window.innerWidth * 0.6;
    const constrainedX = Math.max(rightBoundary, Math.min(window.innerWidth, e.clientX));
    setCurrentPos({
      x: constrainedX,
      y: Math.max(0, Math.min(window.innerHeight, e.clientY)),
    });
  };

  // ✅ Compute rect directly from mouseup event (fix)
  const handleMouseUp = (e) => {
    if (!isSelecting || !startPos) return;

    setIsSelecting(false);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);

    const rightBoundary = window.innerWidth * 0.6;
    const constrainedX = Math.max(rightBoundary, Math.min(window.innerWidth, e.clientX));
    const constrainedY = Math.max(0, Math.min(window.innerHeight, e.clientY));

    const rect = {
      x: Math.min(startPos.x, constrainedX),
      y: Math.min(startPos.y, constrainedY),
      width: Math.abs(constrainedX - startPos.x),
      height: Math.abs(constrainedY - startPos.y),
    };

    console.log('Final rect:', rect);

    if (rect.width > 20 && rect.height > 20) {
      captureScreenshot(rect);
    }

    setCaptureMode(false);
    setStartPos(null);
    setCurrentPos(null);
  };

  const handleExitCaptureMode = () => {
    setCaptureMode(false);
    setStartPos(null);
    setCurrentPos(null);
    setIsSelecting(false);
  };

  const handleStartCapture = () => {
    setCaptureMode(true);
    setCapturedImage(null);
  };

  const handleReset = () => setCapturedImage(null);

  // Event listeners for dragging
  useEffect(() => {
    if (isSelecting) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isSelecting]);

  // Listen for Chrome extension messages
  useEffect(() => {
    const messageListener = (message) => {
      if (message.type === 'START_CAPTURE') handleStartCapture();
      else if (message.type === 'CANCEL_CAPTURE') handleExitCaptureMode();
    };
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener(messageListener);
      return () => chrome.runtime.onMessage.removeListener(messageListener);
    }
  }, []);

  // Live rectangle preview
  const rect =
    startPos && currentPos
      ? {
          x: Math.min(startPos.x, currentPos.x),
          y: Math.min(startPos.y, currentPos.y),
          width: Math.abs(currentPos.x - startPos.x),
          height: Math.abs(currentPos.y - startPos.y),
        }
      : null;

  
  

  const handleOCR = async (imageDataUrl) => {
    try {
      setLlmOutput(null);
      setFetching(true);
      console.log('[React] Starting OCR processing...');
      const result = await Tesseract.recognize(
        capturedImage,
        'eng',
        { logger: (m) => console.log('[Tesseract]', m) }
      );
      const ocrText = result.data.text;
      console.log('[React] OCR complete. Extracted text length:', ocrText.length);
      console.log('[React] OCR Text:', ocrText);

      // Send OCR text and image to background for LLM processing
      console.log('[React] Sending OCR text to background for LLM processing...');
      chrome.runtime.sendMessage(
        {
          type: 'PROCESS_LLM',
          ocrText
        }, (response) => {
            if (chrome.runtime.lastError) {
            console.error('[React] Runtime error during LLM processing:', chrome.runtime.lastError);
            alert('LLM processing failed: ' + chrome.runtime.lastError.message);
            return;
            }

            if (!response || response.success === false) {
            const errMsg = response?.error || 'Unknown error from background';
            console.error('[React] LLM processing error:', errMsg, response);
            alert('LLM processing failed: ' + errMsg);
            return;
            }
            console.log('[React] LLM processing successful. Response received.', response);
            console.log('[React] LLM processing complete. Received output length:', response.llmOutput?.length);
            setLlmOutput(response.llmOutput);
            setCapturedImage(null); // Clear captured image after processing
            setFetching(false);
        }
      );


    } catch (error) {
      console.error('[React] OCR error:', error);
      setFetching(false);
      alert('OCR failed: ' + error.message);
    };
  };

  

  const styles = {
    buttonContainer: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      border: 'none',
      cursor: 'pointer',
      padding: 0,
      margin: 0
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      backgroundColor: '#3b82f6',
      color: 'white',
      padding: '16px 32px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '18px',
      fontWeight: '600',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      transition: 'background-color 0.2s'
    },
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      cursor: 'crosshair',
      zIndex: 999999
    },
    leftBlock: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      width: '60%',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    leftBlockMessage: {
      backgroundColor: 'rgba(239, 68, 68, 0.9)',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '8px',
      fontWeight: '600'
    },
    boundary: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: '60%',
      borderLeft: '2px solid #4ade80',
      pointerEvents: 'none'
    },
    boundaryLabel: {
      position: 'absolute',
      top: '-8px',
      left: '-128px',
      backgroundColor: '#22c55e',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '8px',
      fontWeight: '600',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    selectionRect: {
      position: 'absolute',
      border: '2px solid #60a5fa',
      backgroundColor: 'transparent',
      pointerEvents: 'none',
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
    },
    cornerHandle: {
      position: 'absolute',
      width: '16px',
      height: '16px',
      backgroundColor: '#60a5fa',
      borderRadius: '50%',
      border: '2px solid white'
    },
    dimensionsLabel: {
      position: 'absolute',
      top: '-40px',
      left: 0,
      backgroundColor: '#3b82f6',
      color: 'white',
      fontSize: '14px',
      padding: '6px 12px',
      borderRadius: '4px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    instructions: {
      position: 'absolute',
      top: '32px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 10px 15px rgba(0, 0, 0, 0.2)',
      padding: '16px 24px',
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    instructionsText: {
      color: '#1f2937',
      fontWeight: '500',
      margin: 0
    },
    cancelButton: {
      position: 'absolute',
      top: '32px',
      right: '32px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: '#1f2937',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 10px 15px rgba(0, 0, 0, 0.3)',
      transition: 'background-color 0.2s',
      pointerEvents: 'auto'
    },
    previewContainer: {
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      width: '60vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      padding: '32px',
      zIndex: 999999
    },
    previewCard: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
      padding: '24px',
      maxWidth: '672px',
      width: '100%',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column'
    },
    previewTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '16px',
      marginTop: 0
    },
    imageContainer: {
      backgroundColor: '#f3f4f6',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      overflowY: 'auto',
      overflowX: 'hidden',
      textAlign: 'left',
      flex: 1
    },
    previewImage: {
      borderRadius: '4px',
      border: '1px solid #d1d5db',
      maxHeight: '60vh',
      maxWidth: '100%',
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px'
    },
    resetButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: '#6b7280',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    continueButton: {
      flex: 1,
      backgroundColor: '#3b82f6',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      transition: 'background-color 0.2s'
    },
    previewTextOutput: {
      whiteSpace: 'pre-wrap',
      fontFamily: 'inherit',
      color: '#374151',
      wordBreak: 'break-word',
      width: '100%'
    }
  };

  return (
    <>
      {/* Take Screenshot Button - 100% width and height */}
      {!captureMode && !capturedImage && (
        <button
          onClick={handleStartCapture}
          style={styles.buttonContainer}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
        >
          <div style={styles.button}>
            <Camera size={24} />
            Capture Problem
          </div>
        </button>
      )}

      {/* Screenshot overlay - position: absolute covering viewport */}
      {captureMode && (
        <div
          ref={overlayRef}
          onMouseDown={handleMouseDown}
          style={styles.overlay}
        >
          {/* Left 60% blocked overlay */}
          <div style={styles.leftBlock}>
            <div style={styles.leftBlockMessage}>
              ✕ Selection disabled in this area
            </div>
          </div>
          
          {/* Right 40% boundary indicator */}
          <div style={styles.boundary}>
            <div style={styles.boundaryLabel}>
              ✓ Capture area →
            </div>
          </div>

          {/* Selection rectangle */}
          {rect && (
            <div
              style={{
                ...styles.selectionRect,
                left: `${rect.x}px`,
                top: `${rect.y}px`,
                width: `${rect.width}px`,
                height: `${rect.height}px`
              }}
            >
              {/* Corner handles */}
              <div style={{ ...styles.cornerHandle, top: '-6px', left: '-6px' }}></div>
              <div style={{ ...styles.cornerHandle, top: '-6px', right: '-6px' }}></div>
              <div style={{ ...styles.cornerHandle, bottom: '-6px', left: '-6px' }}></div>
              <div style={{ ...styles.cornerHandle, bottom: '-6px', right: '-6px' }}></div>
              
              {/* Dimensions label */}
              <div style={styles.dimensionsLabel}>
                {Math.round(rect.width)} × {Math.round(rect.height)} px
              </div>
            </div>
          )}

          {/* Instructions overlay */}
          <div style={styles.instructions}>
            <Camera size={24} color="#3b82f6" />
            <p style={styles.instructionsText}>
              Click and drag in the RIGHT 40% of screen • Release to capture
            </p>
          </div>

          {/* Cancel button */}
          <button
            onClick={handleExitCaptureMode}
            style={styles.cancelButton}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#111827'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
          >
            <X size={20} />
            Cancel
          </button>
        </div>
      )}

      {/* Show captured image preview */}
      {capturedImage && !captureMode && (
        <div style={styles.previewContainer}>
          <div style={styles.previewCard}>
            <h2 style={styles.previewTitle}>Screenshot Captured</h2>
            <div style={styles.imageContainer}>
              <img 
                src={capturedImage} 
                alt="Captured screenshot" 
                style={styles.previewImage}
              />
            </div>
            <div style={styles.buttonGroup}>
              <button
                onClick={handleReset}
                style={styles.resetButton}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
              >
                <Camera size={20} />
                Capture Again
              </button>
              { fetching ?
              (<button
                disabled
                style={{...styles.continueButton, backgroundColor: '#9ca3af', cursor: 'not-allowed'}}
              >
                Processing...
              </button>)
              :
              (<button
                onClick={() => {
                  handleOCR();
                }}
                style={styles.continueButton}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                Continue to Hint Generator →
              </button>)
              }

            </div>
          </div>
        </div>
      )}

      {llmOutput && (
        <div style={styles.previewContainer}>
          <div style={styles.previewCard}>
            <h2 style={styles.previewTitle}>LLM Output</h2>
            <div style={styles.imageContainer}>
              <pre style={styles.previewTextOutput}>{llmOutput}</pre>
            </div>
            <button
              onClick={() => setLlmOutput(null)}
              style={styles.continueButton}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
            >
              Close
            </button>
          </div>
            
        </div>
      )}


    </>
  );
}