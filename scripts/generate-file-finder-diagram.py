#!/usr/bin/env python3
"""Generate a diagram showing how to find the downloadable files in the chat UI.

Creates a Playwright + CSS infographic showing:
1. The chat UI layout (where panels are)
2. Three paths to find the files
3. The tar extraction path
"""

import asyncio
from playwright.async_api import async_playwright
from pathlib import Path

OUTPUT = Path("/home/z/my-project/download/HOW-TO-FIND-FILES.png")

HTML = r"""
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0F172A;
    color: #F1F5F9;
    padding: 48px 56px;
    width: 1100px;
  }
  .title {
    font-size: 32px;
    font-weight: 800;
    color: #FFFFFF;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
  }
  .subtitle {
    font-size: 16px;
    color: #94A3B8;
    margin-bottom: 40px;
    line-height: 1.5;
  }

  /* === CHAT UI MOCKUP === */
  .ui-mockup {
    background: #1E293B;
    border: 2px solid #334155;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 36px;
    position: relative;
  }
  .ui-label {
    position: absolute;
    top: -12px;
    left: 20px;
    background: #3AAFA9;
    color: #0F172A;
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .ui-grid {
    display: grid;
    grid-template-columns: 200px 1fr 220px;
    gap: 16px;
    min-height: 320px;
  }
  .ui-panel {
    background: #0F172A;
    border: 1px solid #334155;
    border-radius: 10px;
    padding: 14px;
    position: relative;
  }
  .ui-panel.left { border-color: #475569; }
  .ui-panel.center { border-color: #3AAFA9; border-width: 2px; }
  .ui-panel.right { border-color: #475569; }
  .panel-title {
    font-size: 11px;
    font-weight: 700;
    color: #94A3B8;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid #334155;
  }
  .panel-title.highlight { color: #3AAFA9; border-bottom-color: #3AAFA9; }
  .panel-item {
    font-size: 12px;
    color: #CBD5E1;
    padding: 6px 8px;
    margin-bottom: 4px;
    background: #1E293B;
    border-radius: 5px;
    border-left: 2px solid #475569;
  }
  .panel-item.active {
    border-left-color: #3AAFA9;
    background: #0F172A;
    color: #FFFFFF;
    font-weight: 600;
  }
  .panel-item.file {
    border-left-color: #F59E0B;
    color: #FBBF24;
  }

  /* Center panel — chat content */
  .chat-msg {
    background: #1E293B;
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 10px;
    font-size: 12px;
    color: #CBD5E1;
    line-height: 1.5;
  }
  .chat-msg.ai { border-left: 3px solid #3AAFA9; }
  .chat-msg.user { border-left: 3px solid #6366F1; }

  /* "All files in task" callout */
  .files-panel {
    background: #1E293B;
    border: 2px dashed #F59E0B;
    border-radius: 8px;
    padding: 10px;
    margin-top: 10px;
  }
  .files-panel-title {
    font-size: 10px;
    font-weight: 800;
    color: #F59E0B;
    text-transform: uppercase;
    letter-spacing: 0.7px;
    margin-bottom: 6px;
  }
  .file-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #0F172A;
    padding: 6px 8px;
    border-radius: 4px;
    margin-bottom: 4px;
    font-size: 11px;
  }
  .file-name { color: #FBBF24; font-weight: 600; }
  .file-btn {
    background: #3AAFA9;
    color: #0F172A;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 9px;
    font-weight: 700;
  }

  /* Arrows pointing to elements */
  .arrow-pointer {
    position: absolute;
    font-size: 24px;
    color: #F59E0B;
    font-weight: bold;
  }

  /* === THREE PATHS === */
  .paths-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 20px;
    margin-bottom: 36px;
  }
  .path-card {
    background: #1E293B;
    border: 1px solid #334155;
    border-radius: 14px;
    padding: 20px;
    position: relative;
  }
  .path-card.recommended { border-color: #3AAFA9; border-width: 2px; }
  .path-number {
    position: absolute;
    top: -14px;
    left: 18px;
    width: 32px;
    height: 32px;
    background: #3AAFA9;
    color: #0F172A;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 800;
  }
  .path-card.recommended .path-number { background: #F59E0B; }
  .path-title {
    font-size: 15px;
    font-weight: 700;
    color: #FFFFFF;
    margin: 8px 0 4px 0;
  }
  .path-badge {
    display: inline-block;
    background: #3AAFA9;
    color: #0F172A;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    margin-bottom: 12px;
  }
  .path-card.recommended .path-badge { background: #F59E0B; }
  .path-steps {
    list-style: none;
    counter-reset: step;
  }
  .path-steps li {
    counter-increment: step;
    font-size: 12px;
    color: #CBD5E1;
    padding: 6px 0 6px 28px;
    position: relative;
    line-height: 1.5;
  }
  .path-steps li::before {
    content: counter(step);
    position: absolute;
    left: 0;
    top: 6px;
    width: 20px;
    height: 20px;
    background: #334155;
    color: #94A3B8;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
  }
  .path-steps code {
    background: #0F172A;
    color: #3AAFA9;
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 11px;
    font-family: 'Consolas', monospace;
  }

  /* === TAR EXTRACTION FLOW === */
  .tar-flow {
    background: #1E293B;
    border: 1px solid #334155;
    border-radius: 14px;
    padding: 24px;
  }
  .tar-title {
    font-size: 15px;
    font-weight: 700;
    color: #FFFFFF;
    margin-bottom: 4px;
  }
  .tar-subtitle {
    font-size: 12px;
    color: #94A3B8;
    margin-bottom: 20px;
  }
  .tar-steps {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .tar-step {
    background: #0F172A;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 12px 16px;
    flex: 1;
    min-width: 160px;
  }
  .tar-step-num {
    font-size: 10px;
    color: #3AAFA9;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .tar-step-text {
    font-size: 12px;
    color: #E2E8F0;
    line-height: 1.4;
  }
  .tar-step code {
    display: block;
    margin-top: 6px;
    color: #3AAFA9;
    font-family: 'Consolas', monospace;
    font-size: 10px;
    word-break: break-all;
  }
  .tar-arrow {
    color: #3AAFA9;
    font-size: 20px;
    font-weight: bold;
  }

  /* Footer */
  .footer {
    margin-top: 32px;
    padding-top: 20px;
    border-top: 1px solid #334155;
    font-size: 11px;
    color: #64748B;
    line-height: 1.6;
  }
  .footer strong { color: #94A3B8; }
</style>
</head>
<body>

<div class="title">📂 How to Find Your Downloadable Files</div>
<div class="subtitle">Three paths to get <code style="background:#1E293B;color:#3AAFA9;padding:2px 6px;border-radius:4px;">classroom-tools-hub-UPDATE-2026-08-17.zip</code> and the PowerShell commands doc</div>

<!-- === CHAT UI MOCKUP === -->
<div class="ui-mockup">
  <div class="ui-label">Your Chat Window Layout</div>
  <div class="ui-grid">

    <!-- Left sidebar -->
    <div class="ui-panel left">
      <div class="panel-title">Left Sidebar</div>
      <div class="panel-item">💬 Chat</div>
      <div class="panel-item">🤖 Agent</div>
      <div class="panel-item">📁 New Task</div>
      <div class="panel-item">📊 AI PPT</div>
      <div class="panel-item" style="color:#3AAFA9;">📁 Classroom Tools</div>
      <div class="panel-item">📁 MiniStar Lab</div>
    </div>

    <!-- Center — chat content -->
    <div class="ui-panel center">
      <div class="panel-title highlight">Center — Chat Conversation</div>
      <div class="chat-msg user">Provide download file please</div>
      <div class="chat-msg ai">✅ Files delivered to /home/z/my-project/download/...</div>

      <!-- THE KEY ELEMENT — All files in task panel -->
      <div class="files-panel">
        <div class="files-panel-title">📎 All Files in Task (3 files)</div>
        <div class="file-row">
          <span class="file-name">classroom-tools-hub-UPDATE-2026-08-17.zip</span>
          <span class="file-btn">DOWNLOAD</span>
        </div>
        <div class="file-row">
          <span class="file-name">POWERSHELL-COMMANDS.md</span>
          <span class="file-btn">DOWNLOAD</span>
        </div>
        <div class="file-row">
          <span class="file-name">CUSTOM-DICE-QUICK-SELECT.md</span>
          <span class="file-btn">DOWNLOAD</span>
        </div>
      </div>
    </div>

    <!-- Right — file browser -->
    <div class="ui-panel right">
      <div class="panel-title">Right — File Browser</div>
      <div class="panel-item">📁 db</div>
      <div class="panel-item">📁 examples</div>
      <div class="panel-item">📁 prisma</div>
      <div class="panel-item">📁 public</div>
      <div class="panel-item">📁 scripts</div>
      <div class="panel-item">📁 src</div>
      <div class="panel-item file">📁 download ← FILES HERE</div>
      <div class="panel-item">.gitignore</div>
      <div class="panel-item">package.json</div>
      <div class="panel-item">README.md</div>
      <div style="margin-top:10px;padding:6px;background:#3AAFA9;color:#0F172A;border-radius:5px;text-align:center;font-size:10px;font-weight:700;">⬇ DOWNLOAD BUTTON</div>
    </div>

  </div>
</div>

<!-- === THREE PATHS === -->
<div class="paths-grid">

  <!-- PATH 1 -->
  <div class="path-card recommended">
    <div class="path-number">1</div>
    <div class="path-badge">★ EASIEST</div>
    <div class="path-title">"All Files in Task" Panel</div>
    <ol class="path-steps">
      <li>Look in the <strong>center</strong> of your chat window</li>
      <li>Find the yellow dashed box labeled <code>All Files in Task</code></li>
      <li>It shows <strong>3 files</strong> with names + DOWNLOAD buttons</li>
      <li>Click <code>DOWNLOAD</code> on the ZIP file</li>
      <li>A <code>.tar</code> file downloads to your Downloads folder</li>
    </ol>
  </div>

  <!-- PATH 2 -->
  <div class="path-card">
    <div class="path-number">2</div>
    <div class="path-badge">ALTERNATIVE</div>
    <div class="path-title">Right-Side File Browser</div>
    <ol class="path-steps">
      <li>Look at the <strong>right panel</strong> of the chat window</li>
      <li>It shows the project directory tree</li>
      <li>Click the <code>download</code> folder to expand it</li>
      <li>Click on <code>classroom-tools-hub-UPDATE-2026-08-17.zip</code></li>
      <li>Click the <strong>Download</strong> button at the top-right of that panel</li>
    </ol>
  </div>

  <!-- PATH 3 -->
  <div class="path-card">
    <div class="path-number">3</div>
    <div class="path-badge">DIRECT URL</div>
    <div class="path-title">Click the Chat Link</div>
    <ol class="path-steps">
      <li>Scroll up in the chat to find my earlier message</li>
      <li>Look for the <strong>blue underlined link</strong>:</li>
      <li><code>Download classroom-tools-hub-latest.zip</code></li>
      <li>Click it — file downloads directly (no tar)</li>
      <li>Works only while the dev server is running</li>
    </ol>
  </div>

</div>

<!-- === TAR EXTRACTION FLOW === -->
<div class="tar-flow">
  <div class="tar-title">🔄 After Downloading the .tar — Extraction Flow</div>
  <div class="tar-subtitle">The Download button gives you a .tar containing the whole workspace. Here's how to get just the ZIP you want:</div>

  <div class="tar-steps">
    <div class="tar-step">
      <div class="tar-step-num">STEP 1</div>
      <div class="tar-step-text">Download lands in Downloads folder</div>
      <code>Downloads\workspace-XXXXX.tar</code>
    </div>
    <div class="tar-arrow">→</div>
    <div class="tar-step">
      <div class="tar-step-num">STEP 2</div>
      <div class="tar-step-text">Extract the tar</div>
      <code>tar -xvf workspace-*.tar</code>
    </div>
    <div class="tar-arrow">→</div>
    <div class="tar-step">
      <div class="tar-step-num">STEP 3</div>
      <div class="tar-step-text">Navigate to the download folder inside</div>
      <code>home\z\my-project\download\</code>
    </div>
    <div class="tar-arrow">→</div>
    <div class="tar-step">
      <div class="tar-step-num">STEP 4</div>
      <div class="tar-step-text">Find your 3 files</div>
      <code>classroom-tools-hub-UPDATE-2026-08-17.zip
POWERSHELL-COMMANDS.md
CUSTOM-DICE-QUICK-SELECT.md</code>
    </div>
    <div class="tar-arrow">→</div>
    <div class="tar-step">
      <div class="tar-step-num">STEP 5</div>
      <div class="tar-step-text">Copy the ZIP out + extract</div>
      <code>Expand-Archive classroom-tools-hub.zip</code>
    </div>
  </div>
</div>

<div class="footer">
  <strong>Need help?</strong> If you still can't find the files, tell me what your chat window looks like — describe the panels you see (left sidebar? center chat? right file browser?) and I'll guide you to the exact spot.<br>
  <strong>Files verified on disk:</strong> <code style="color:#3AAFA9;">/home/z/my-project/download/classroom-tools-hub-UPDATE-2026-08-17.zip</code> (13 MB) • <code style="color:#3AAFA9;">POWERSHELL-COMMANDS.md</code> (7.8 KB) • <code style="color:#3AAFA9;">CUSTOM-DICE-QUICK-SELECT.md</code> (2.9 KB)
</div>

</body>
</html>
"""

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(
            viewport={"width": 1200, "height": 1600},
            device_scale_factor=2,
        )
        page = await context.new_page()
        await page.set_content(HTML, wait_until="networkidle")

        # Read actual content height and resize viewport
        height = await page.evaluate("document.body.scrollHeight")
        await page.set_viewport_size({"width": 1200, "height": int(height) + 80})

        await page.screenshot(path=str(OUTPUT), full_page=True, type="png")
        await browser.close()

    size_kb = OUTPUT.stat().st_size // 1024
    print(f"Generated: {OUTPUT} ({size_kb} KB)")

asyncio.run(main())
