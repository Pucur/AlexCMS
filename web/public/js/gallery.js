class GalleryLightbox {
  constructor() {
    this.images = [];
    this.currentIndex = 0;
    this.zoomLevel = 1;
    this.maxZoom = 5;
    this.minZoom = 0.2;
    
    this.init();
  }
  
  init() {
    this.lightbox = document.getElementById('lightbox');
    this.img = document.getElementById('lightbox-img');
    this.closeBtn = document.getElementById('lightbox-close');
    this.prevBtn = document.getElementById('prev');
    this.nextBtn = document.getElementById('next');
    this.zoomInBtn = document.getElementById('zoom-in');
    this.zoomOutBtn = document.getElementById('zoom-out');
    this.resetBtn = document.getElementById('zoom-reset');
    this.indexEl = document.getElementById('lightbox-index');
    this.titleEl = document.getElementById('lightbox-title');
    
    this.galleryImgs = document.querySelectorAll('.gallery-img');
    this.galleryImgs.forEach((img, index) => {
      img.addEventListener('click', () => this.open(index));
    });
    
    this.closeBtn.addEventListener('click', () => this.close());
    this.prevBtn.addEventListener('click', () => this.prev());
    this.nextBtn.addEventListener('click', () => this.next());
    
    this.zoomInBtn.addEventListener('click', () => this.zoom(0.5));
    this.zoomOutBtn.addEventListener('click', () => this.zoom(-0.5));
    this.resetBtn.addEventListener('click', () => this.resetZoom());
    
    document.addEventListener('keydown', (e) => {
      if (!this.lightbox.classList.contains('lightbox-hidden')) {
        switch(e.key) {
          case 'Escape': this.close(); break;
          case 'ArrowLeft': this.prev(); break;
          case 'ArrowRight': this.next(); break;
        }
      }
    });
    
    this.initGestures();
  }
  
  open(index) {
    this.currentIndex = index;
    this.images = Array.from(document.querySelectorAll('.gallery-img'));
    this.zoomLevel = 1;
    this.updateImage();
    this.lightbox.classList.remove('lightbox-hidden');
    document.body.style.overflow = 'hidden';
  }
  
  close() {
    this.lightbox.classList.add('lightbox-hidden');
    document.body.style.overflow = '';
    this.resetZoom();
  }
  
  next() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.updateImage();
  }
  
  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.updateImage();
  }
  
  updateImage() {
    const imgEl = this.images[this.currentIndex];
    this.img.src = imgEl.dataset.full || imgEl.src;
    this.img.alt = imgEl.alt;
    this.indexEl.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
    this.titleEl.textContent = imgEl.alt;
  }
  
  zoom(delta) {
    this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel + delta));
    this.applyZoom();
  }
  
  resetZoom() {
    this.zoomLevel = 1;
    this.applyZoom();
  }
  
  applyZoom() {
    this.img.style.transform = `scale(${this.zoomLevel})`;
  }
  
  initGestures() {
    let startX = 0, startY = 0;
    let startDistance = 0;
    
    this.img.addEventListener('mousedown', (e) => {
      startX = e.clientX;
      startY = e.clientY;
      this.img.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (this.zoomLevel > 1 && this.img.style.cursor === 'grabbing') {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        const currentTransform = this.img.style.transform || 'translate(0px, 0px)';
        this.img.style.transform = `${currentTransform} translate(${deltaX}px, ${deltaY}px)`;
      }
    });
    
    document.addEventListener('mouseup', () => {
      this.img.style.cursor = 'grab';
    });
    
    let initialDistance = 0;
    this.img.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
      } else if (e.touches.length === 2) {
        initialDistance = this.getDistance(e.touches[0], e.touches[1]);
      }
    });
    
    this.img.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 2) {
        const distance = this.getDistance(e.touches[0], e.touches[1]);
        const scale = distance / initialDistance;
        this.zoomLevel *= scale;
        this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel));
        this.applyZoom();
        initialDistance = distance;
      }
    });
  }
  
  getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

new GalleryLightbox();
