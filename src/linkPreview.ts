import { LinkMetadata, FetchState, PreviewStyle } from './types';

// Proxy URL to bypass CORS
const CORS_PROXY = 'https://api.allorigins.win/get?url=';

export class LinkPreviewGenerator {
  private inputElement: HTMLInputElement;
  private buttonElement: HTMLButtonElement;
  private previewContainer: HTMLDivElement;
  private loadingElement: HTMLDivElement;
  private errorElement: HTMLDivElement;
  private styleSelector: HTMLSelectElement;
  private currentStyle: PreviewStyle = 'default';
  private state: FetchState = {
    loading: false,
    error: null,
    data: null
  };
  private currentRequestId: number = 0;

  constructor() {
    this.inputElement = document.getElementById('url-input') as HTMLInputElement;
    this.buttonElement = document.getElementById('fetch-button') as HTMLButtonElement;
    this.previewContainer = document.getElementById('preview-container') as HTMLDivElement;
    this.loadingElement = document.getElementById('loading-indicator') as HTMLDivElement;
    this.errorElement = document.getElementById('error-message') as HTMLDivElement;
    this.styleSelector = document.getElementById('style-selector') as HTMLSelectElement;
    
    this.init();
  }

  private init(): void {
    this.buttonElement.addEventListener('click', () => this.fetchPreview());
    this.inputElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.fetchPreview();
      }
    });
    
    this.styleSelector.addEventListener('change', () => {
      this.currentStyle = this.styleSelector.value as PreviewStyle;
      if (this.state.data) {
        this.renderPreview(this.state.data);
      }
    });
  }

  private updateUI(): void {
    // Update loading state
    this.loadingElement.style.display = this.state.loading ? 'block' : 'none';
    
    // Update error state
    if (this.state.error) {
      this.errorElement.textContent = this.state.error;
      this.errorElement.style.display = 'block';
    } else {
      this.errorElement.style.display = 'none';
    }
    
    // Update preview
    if (this.state.data && !this.state.loading) {
      this.renderPreview(this.state.data);
      this.previewContainer.style.display = 'block';
    } else if (!this.state.loading) {
      this.previewContainer.style.display = 'none';
    }
  }

  private async fetchPreview(): Promise<void> {
    const url = this.inputElement.value.trim();
    
    // Validate URL
    if (!url) {
      this.state = {
        loading: false,
        error: 'Please enter a URL',
        data: null
      };
      this.updateUI();
      return;
    }
    
    try {
      // Check if URL is valid
      new URL(url);
    } catch (e) {
      this.state = {
        loading: false,
        error: 'Invalid URL format',
        data: null
      };
      this.updateUI();
      return;
    }
    
    // Set loading state
    this.state = {
      loading: true,
      error: null,
      data: null
    };
    this.updateUI();
    
    // Generate a unique request ID for this fetch operation
    const requestId = ++this.currentRequestId;
    
    try {
      const metadata = await this.extractMetadata(url);
      
      // Only update state if this is still the most recent request
      if (requestId === this.currentRequestId) {
        this.state = {
          loading: false,
          error: null,
          data: metadata
        };
        this.updateUI();
      }
    } catch (error) {
      // Only update state if this is still the most recent request
      if (requestId === this.currentRequestId) {
        this.state = {
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch URL preview',
          data: null
        };
        this.updateUI();
      }
    }
  }

  private async extractMetadata(url: string): Promise<LinkMetadata> {
    try {
      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }
      
      const data = await response.json();
      const html = data.contents;
      
      // Create a DOM parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Extract domain
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // Extract title
      const title = this.getMetaContent(doc, 'og:title') || 
                    doc.querySelector('title')?.textContent || 
                    domain;
      
      // Extract description
      const description = this.getMetaContent(doc, 'og:description') || 
                          this.getMetaContent(doc, 'description') || 
                          '';
      
      // Extract image
      let image = this.getMetaContent(doc, 'og:image');
      if (image && !image.startsWith('http')) {
        image = new URL(image, url).href;
      }
      
      // Extract favicon
      let favicon = '';
      const faviconEl = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
      if (faviconEl) {
        const faviconHref = faviconEl.getAttribute('href');
        if (faviconHref) {
          favicon = faviconHref.startsWith('http') 
            ? faviconHref 
            : new URL(faviconHref, url).href;
        }
      }
      
      if (!favicon) {
        favicon = `${urlObj.protocol}//${domain}/favicon.ico`;
      }
      
      return {
        title,
        description,
        image: image || '',
        favicon,
        domain,
        url
      };
    } catch (error) {
      console.error('Error extracting metadata:', error);
      throw new Error('Failed to extract metadata from the URL');
    }
  }

  private getMetaContent(doc: Document, metaName: string): string {
    const metaTag = doc.querySelector(`meta[property="${metaName}"], meta[name="${metaName}"]`);
    return metaTag ? metaTag.getAttribute('content') || '' : '';
  }

  private renderPreview(data: LinkMetadata): void {
    switch (this.currentStyle) {
      case 'instagram':
        this.renderInstagramStyle(data);
        break;
      case 'discord':
        this.renderDiscordStyle(data);
        break;
      default:
        this.renderDefaultStyle(data);
        break;
    }
  }

  private renderDefaultStyle(data: LinkMetadata): void {
    this.previewContainer.innerHTML = `
      <div class="preview-card default-style">
        <div class="preview-header">
          <div class="site-info">
            <img src="${data.favicon}" alt="Favicon" class="favicon" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌐</text></svg>'">
            <span class="domain">${data.domain}</span>
          </div>
        </div>
        <div class="preview-content">
          <h2 class="title">${data.title}</h2>
          <p class="description">${this.truncateText(data.description, 150)}</p>
        </div>
        ${data.image ? `<div class="preview-image">
          <img src="${data.image}" alt="${data.title}" onerror="this.style.display='none'">
        </div>` : ''}
        <a href="${data.url}" target="_blank" class="preview-link" rel="noopener noreferrer">Visit Site</a>
      </div>
    `;
  }

  private renderInstagramStyle(data: LinkMetadata): void {
    this.previewContainer.innerHTML = `
      <div class="preview-card instagram-style">
        ${data.image ? `
          <div class="instagram-image">
            <img src="${data.image}" alt="${data.title}" onerror="this.style.display='none'">
          </div>
        ` : ''}
        <div class="instagram-content">
          <div class="instagram-header">
            <img src="${data.favicon}" alt="Favicon" class="instagram-favicon" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌐</text></svg>'">
            <div class="instagram-site-info">
              <span class="instagram-domain">${data.domain}</span>
              <span class="instagram-url">${this.truncateText(data.url, 30)}</span>
            </div>
          </div>
          <h2 class="instagram-title">${data.title}</h2>
          <p class="instagram-description">${this.truncateText(data.description, 100)}</p>
          <a href="${data.url}" target="_blank" class="instagram-link" rel="noopener noreferrer">Learn More</a>
        </div>
      </div>
    `;
  }

  private renderDiscordStyle(data: LinkMetadata): void {
    this.previewContainer.innerHTML = `
      <div class="preview-card discord-style">
        <div class="discord-content">
          <h2 class="discord-title"><a href="${data.url}" target="_blank" class="discord-link" rel="noopener noreferrer">${data.title}</a></h2>
          <p class="discord-description">${this.truncateText(data.description, 120)}</p>
        </div>
        ${data.image ? `
          <div class="discord-image">
            <img src="${data.image}" alt="${data.title}" onerror="this.style.display='none'">
          </div>
        ` : ''}
      </div>
    `;
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}