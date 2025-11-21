Mathnasium Chrome Extension
Instruction Workflow Automation for Math Tutors

This Chrome extension streamlines the Mathnasium tutoring workflow by consolidating instructional resources and providing automated, context-aware assistance directly within the browser. The extension injects React components into Mathnasium’s instructor dashboard to create a unified interface for lesson materials, student work, and automated hint generation. This reduces tab switching and improves overall session efficiency.

Key Features
React-Powered UI Injection

Injects React components into existing Mathnasium pages without modifying the underlying site.

Provides an integrated sidebar and tool panel designed to match instructor workflows.

Utilizes client-side state management for a responsive and consistent user experience.

Screenshot OCR with Tesseract.js

Enables instructors to capture on-screen student work directly from the browser.

Uses Tesseract.js to perform real-time text recognition.

Feeds extracted math expressions and problem statements into the downstream hint-generation pipeline.

LLM-Based Math Hint Generation

Routes OCR-parsed content to a custom LLM gateway hosted on Vercel Serverless Functions.

The gateway validates and structures prompts before forwarding them to the selected language model.

Returns clear, contextually aligned hints and explanations suitable for Mathnasium instructional methods.

Ensures secure handling of API keys through serverless backend isolation.

Workflow Automation

Reduces reliance on multiple tabs, reference materials, and manual lookup.

Consolidates lesson plans, strategy guides, and relevant resources into a single interface.

Demonstrated approximately 30% reduction in instructor preparation and search time in testing.

Tech Stack

JavaScript / Chrome Extensions API

React (component injection)

Tesseract.js (client-side OCR)

Vercel Serverless Functions (LLM gateway)

Fetch and streaming APIs

Lightweight DOM mounting utilities

Architecture Overview
Browser Page → Injected React UI → OCR (Tesseract.js)  
    → LLM Gateway (Vercel Serverless Function) → LLM Model → Response Returned to UI

Project Status

Actively developed. Current work includes UI refinement, improved error handling, and expansion of LLM prompt templates and capabilities.
