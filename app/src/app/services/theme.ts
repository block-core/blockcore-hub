import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  constructor(@Inject(DOCUMENT) private document: Document) {}

  get darkMode(): boolean {
    if (localStorage.getItem('blockcore:hub:theme')) {
      if (localStorage.getItem('blockcore:hub:theme') === 'dark') {
        return true;
      }
    } else if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return true;
    }

    return false;
  }

  set darkMode(value: boolean) {
    if (value) {
      localStorage.setItem('blockcore:hub:theme', 'dark');
    } else {
      localStorage.setItem('blockcore:hub:theme', 'light');
    }

    this.update();
  }

  public init() {
    // Just get the darkMode will trigger a read.
    this.update();

    // Listen for changes to the prefers-color-scheme media query
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (event) => {
        const newColorScheme = event.matches ? 'dark' : 'light';

        if (newColorScheme == 'light') {
          this.darkMode = false;
        } else {
          this.darkMode = true;
        }
      });
  }

  update() {
    if (this.darkMode) {
      if (this.document.documentElement.classList.contains('light')) {
        this.document.documentElement.classList.remove('light');
      }
    } else {
      if (!this.document.documentElement.classList.contains('light')) {
        this.document.documentElement.classList.add('light');
      }
    }
  }
}
