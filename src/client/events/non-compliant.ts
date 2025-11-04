// NON-COMPLIANT: Event listeners are registered but never cleaned up
// This can lead to memory leaks, especially in SPAs

class UserActivityTracker {
  private activityCount = 0;

  constructor() {
    // Adding listeners without storing references or cleanup
    window.addEventListener('click', this.handleClick);
    window.addEventListener('scroll', this.handleScroll);
    document.addEventListener('keydown', this.handleKeydown);
  }

  private handleClick = (e: MouseEvent) => {
    this.activityCount++;
    console.log('Click detected:', this.activityCount);
  };

  private handleScroll = (e: Event) => {
    console.log('Scroll detected');
  };

  private handleKeydown = (e: KeyboardEvent) => {
    console.log('Key pressed:', e.key);
  };

  // No cleanup method provided - listeners will persist even after this object is destroyed
}

// Component without cleanup
class MessagePanel {
  private messageDiv: HTMLDivElement;

  constructor(containerId: string) {
    this.messageDiv = document.createElement('div');
    const container = document.getElementById(containerId);
    container?.appendChild(this.messageDiv);

    // Adding listener directly without cleanup mechanism
    this.messageDiv.addEventListener('mouseover', () => {
      console.log('Mouse over message panel');
    });

    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    console.log('Window resized');
  };

  // destroy method exists but doesn't clean up listeners
  destroy() {
    this.messageDiv.remove();
    // BUG: Event listeners still attached to window and messageDiv
  }
}

// Usage that creates memory leaks
function initializeApp() {
  const tracker = new UserActivityTracker();
  const panel = new MessagePanel('container');

  // Later, trying to clean up
  setTimeout(() => {
    panel.destroy(); // Listeners not removed!
    // tracker has no cleanup method at all
  }, 5000);
}
