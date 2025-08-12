/**
 * Auto-Repair Injector
 * Automatically loads and applies synthetic user test repairs
 */

class AutoRepairInjector {
  private repairsLoaded = false;
  private repairScripts: Set<string> = new Set();
  private repairStyles: Set<string> = new Set();

  constructor() {
    this.init();
  }

  private async init() {
    // Check for auto-repairs every 30 seconds
    setInterval(() => this.checkForRepairs(), 30000);
    
    // Initial check
    this.checkForRepairs();
    
    // Listen for repair events
    window.addEventListener('synthetic-repair', (event: CustomEvent) => {
      this.applyRepair(event.detail);
    });
  }

  private async checkForRepairs() {
    try {
      // Check for JavaScript repairs
      const jsResponse = await fetch('/auto-repairs.js', { cache: 'no-cache' });
      if (jsResponse.ok) {
        const jsContent = await jsResponse.text();
        if (jsContent && !this.repairScripts.has(jsContent)) {
          this.injectScript(jsContent);
          this.repairScripts.add(jsContent);
          console.log('✅ Auto-repair JavaScript injected');
        }
      }

      // Check for CSS repairs
      const cssResponse = await fetch('/auto-repairs.css', { cache: 'no-cache' });
      if (cssResponse.ok) {
        const cssContent = await cssResponse.text();
        if (cssContent && !this.repairStyles.has(cssContent)) {
          this.injectStyles(cssContent);
          this.repairStyles.add(cssContent);
          console.log('✅ Auto-repair CSS injected');
        }
      }
    } catch (error) {
      // Silently fail - repairs are not critical
      console.debug('Auto-repair check failed:', error);
    }
  }

  private injectScript(code: string) {
    const script = document.createElement('script');
    script.textContent = code;
    script.setAttribute('data-synthetic-repair', 'true');
    document.head.appendChild(script);
  }

  private injectStyles(css: string) {
    const style = document.createElement('style');
    style.textContent = css;
    style.setAttribute('data-synthetic-repair', 'true');
    document.head.appendChild(style);
  }

  private applyRepair(repair: any) {
    console.log('🔧 Applying repair:', repair);
    
    switch (repair.type) {
      case 'ADD_ELEMENT':
        this.addMissingElement(repair);
        break;
      case 'FIX_HANDLER':
        this.fixEventHandler(repair);
        break;
      case 'FIX_VISIBILITY':
        this.fixVisibility(repair);
        break;
      case 'FIX_ACCESSIBILITY':
        this.fixAccessibility(repair);
        break;
      default:
        console.warn('Unknown repair type:', repair.type);
    }
  }

  private addMissingElement(repair: any) {
    const { selector, html, parentSelector } = repair;
    
    // Check if element already exists
    if (document.querySelector(selector)) {
      return;
    }
    
    const parent = document.querySelector(parentSelector || 'body');
    if (parent) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      const element = wrapper.firstElementChild;
      if (element) {
        element.classList.add('synthetic-repair-element');
        parent.appendChild(element);
        console.log(`✅ Added missing element: ${selector}`);
      }
    }
  }

  private fixEventHandler(repair: any) {
    const { selector, event, handler } = repair;
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(element => {
      // Remove existing handlers
      const clone = element.cloneNode(true) as HTMLElement;
      element.parentNode?.replaceChild(clone, element);
      
      // Add new handler
      clone.addEventListener(event, () => {
        try {
          // Execute handler code
          new Function(handler)();
        } catch (error) {
          console.error('Handler execution failed:', error);
        }
      });
      
      console.log(`✅ Fixed ${event} handler for: ${selector}`);
    });
  }

  private fixVisibility(repair: any) {
    const { selector } = repair;
    const elements = document.querySelectorAll(selector);
    
    elements.forEach((element: HTMLElement) => {
      element.style.display = 'block';
      element.style.visibility = 'visible';
      element.style.opacity = '1';
      element.classList.remove('hidden', 'invisible', 'd-none');
      console.log(`✅ Fixed visibility for: ${selector}`);
    });
  }

  private fixAccessibility(repair: any) {
    const { selector, attributes } = repair;
    const elements = document.querySelectorAll(selector);
    
    elements.forEach((element: HTMLElement) => {
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value as string);
      });
      console.log(`✅ Fixed accessibility for: ${selector}`);
    });
  }

  // Public API for manual repairs
  public forceRepair(selector: string, type: string) {
    this.applyRepair({ selector, type });
  }

  public clearRepairs() {
    // Remove all repair elements and styles
    document.querySelectorAll('[data-synthetic-repair]').forEach(el => el.remove());
    document.querySelectorAll('.synthetic-repair-element').forEach(el => el.remove());
    this.repairScripts.clear();
    this.repairStyles.clear();
    console.log('🧹 Cleared all synthetic repairs');
  }

  public getRepairStatus() {
    return {
      scriptsLoaded: this.repairScripts.size,
      stylesLoaded: this.repairStyles.size,
      elements: document.querySelectorAll('.synthetic-repair-element').length
    };
  }
}

// Initialize in development mode
if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
  const repairInjector = new AutoRepairInjector();
  
  // Expose to window for debugging
  (window as any).syntheticRepairs = repairInjector;
  
  console.log('🔧 Auto-Repair Injector initialized');
}

export default AutoRepairInjector;