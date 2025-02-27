import './style.css';
import { LinkPreviewGenerator } from './linkPreview';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="container">
    <div class="header">
      <img src="/favicon.png" alt="Link Preview Generator Logo" />
      <h1>Link Preview Generator</h1>
    </div>
    <div class="input-container">
      <input type="text" id="url-input" placeholder="Enter a URL (e.g., https://example.com)" />
      <button id="fetch-button">Generate Preview</button>
    </div>
    
    <div class="style-container">
      <label for="style-selector">Preview Style:</label>
      <select id="style-selector" class="style-selector">
        <option value="default">Default</option>
        <option value="instagram">Instagram</option>
        <option value="discord">Discord</option>
      </select>
    </div>
    
    <div id="loading-indicator" class="loading-indicator">
      <div class="spinner"></div>
      <p>Fetching preview...</p>
    </div>
    
    <div id="error-message" class="error-message"></div>
    
    <div id="preview-container" class="preview-container"></div>
  </div>

  <footer class="footer">
    <p>Created by <a href="https://moutaz.lol" target="_blank">OMouta</a></p>
  </footer>
`;

// Initialize the link preview generator
document.addEventListener('DOMContentLoaded', () => {
  new LinkPreviewGenerator();
});