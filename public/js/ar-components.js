// Componentes para la experiencia AR
document.addEventListener('DOMContentLoaded', function() {
  // Componente para reproducir/pausar video al hacer clic
  AFRAME.registerComponent('play-on-click', {
    init: function () {
      try {
        const video = document.querySelector('#main-content');
        if (!video) {
          console.warn('Main content video not found');
          return;
        }

        this.video = video;
        this.isPlaying = false;
        
        // Configurar el video para que sea reproducible
        video.muted = false; // Permitir audio por defecto
        video.playsInline = true;
        video.loop = true;
        video.crossOrigin = 'anonymous';
        
        // Agregar un indicador visual de reproducción
        const playIndicator = document.createElement('div');
        playIndicator.style.position = 'absolute';
        playIndicator.style.bottom = '10px';
        playIndicator.style.right = '10px';
        playIndicator.style.backgroundColor = 'rgba(0,0,0,0.5)';
        playIndicator.style.color = 'white';
        playIndicator.style.padding = '5px 10px';
        playIndicator.style.borderRadius = '5px';
        playIndicator.style.zIndex = '1000';
        playIndicator.style.display = 'none';
        document.body.appendChild(playIndicator);
        
        this.playIndicator = playIndicator;

        // Tratar de reproducir automáticamente cuando la escena esté lista
        this.el.sceneEl.addEventListener('loaded', () => {
          console.log('Escena cargada, intentando reproducción automática del video principal');
          setTimeout(() => this.playMainVideo(), 1000); // Pequeño retraso para asegurar que todo está listo
        });

        // El video también puede ser clickeado para pausar/reanudar
        this.el.addEventListener('click', () => {
          console.log('Main video clicked, isPlaying:', this.isPlaying);
          if (this.isPlaying) {
            this.video.pause();
            this.isPlaying = false;
            if (this.playIndicator) this.playIndicator.style.display = 'none';
          } else {
            this.playMainVideo();
          }
        });
        
        // Intentar reproducir automáticamente cuando cargue
        this.video.addEventListener('canplaythrough', () => {
          // Verificar si estamos en el panel de inicio
          const menuManager = this.el.sceneEl.components['menu-manager'];
          if (menuManager && menuManager.activeModuleId === 'inicio') {
            console.log('Video principal listo, intentando reproducción automática');
            this.playMainVideo();
          }
        }, { once: true });

        // También intentar reproducción automática cuando se active el botón de inicio
        document.getElementById('start-button')?.addEventListener('click', () => {
          setTimeout(() => {
            if (this.el.sceneEl.components['menu-manager']?.activeModuleId === 'inicio') {
              console.log('Botón de inicio presionado, intentando reproducción automática');
              this.playMainVideo();
            }
          }, 2000); // Esperar a que AR se inicialice
        });
      } catch (error) {
        console.error('Error in play-on-click:', error);
      }
    },
    
    playMainVideo: function() {
      this.video.muted = false; // Intentar primero con sonido
      
      const playPromise = this.video.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('Main video playing with sound');
          this.isPlaying = true;
          if (this.playIndicator) {
            this.playIndicator.style.display = 'none'; // Ocultar indicador
          }
        }).catch(error => {
          console.warn('Error playing main video with sound:', error);
          // Intentar reproducir muted (política de autoplay)
          this.video.muted = true;
          this.video.play().then(() => {
            console.log('Main video playing muted');
            this.isPlaying = true;
            if (this.playIndicator) {
              this.playIndicator.style.display = 'none'; // Ocultar indicador
            }
            
            // Configurar un evento para activar el sonido en el próximo clic
            document.addEventListener('click', () => {
              this.video.muted = false;
            }, { once: true });
          }).catch(err => {
            console.error('Failed to play even muted:', err);
            document.addEventListener('click', () => {
              this.video.play().catch(finalErr => console.error('Final attempt failed:', finalErr));
            }, { once: true });
          });
        });
      }
    }
  });

  // Componente para controles de video
  AFRAME.registerComponent('video-controls', {
    schema: {
      initialized: { default: false }
    },

    init: function() {
      if (this.data.initialized) return;
      
      try {
        // Obtener el elemento de video del asset
        const videoId = this.el.getAttribute('src').substring(1); // Remover el #
        this.videoEl = document.getElementById(videoId);
        
        if (!this.videoEl) {
          console.warn('Video element not found:', videoId);
          return;
        }

        this.isPlaying = false;
        this.data.initialized = true;

        // Obtener referencias a los elementos
        this.wrapper = this.el.parentElement;
        this.playButton = this.el.querySelector('.play-button');

        console.log('Inicializando controles de video para:', videoId);
        console.log('¿Botón de play encontrado?:', !!this.playButton);
        
        if (!this.playButton) {
          console.warn('No se encontró el botón de play para el video:', videoId);
        }

        // Configurar el video
        this.videoEl.muted = false; // Intentar permitir audio 
        this.videoEl.playsInline = true;
        this.videoEl.loop = true;
        this.videoEl.crossOrigin = 'anonymous';
        this.videoEl.currentTime = 0;
        this.videoEl.pause();

        // Crear indicador de estado
        this.createStatusIndicator();

        // Agregar flag para seguir el estado de interactividad
        this.isInteractable = true;

        // Hacer que tanto el video como el botón de play sean clickeables
        if (this.playButton) {
          this.playButton.addEventListener('click', (evt) => {
            console.log('Click en botón de play para video:', videoId);
            evt.stopPropagation();
            
            // Verificar si el botón de play tiene la clase clickable
            if (!this.playButton.classList.contains('clickable')) {
              console.log('Botón de play no clickeable, ignorando');
              evt.preventDefault();
              return;
            }
            
            // Verificar si está activo para interacción
            if (!this.isInteractable) {
              console.log('Video no interactuable, reinicializando...');
              this.resetForNewInteraction();
              return;
            }
            
            // Obtener el estado actual del gestor de menú
            const menuManager = this.el.sceneEl.components['menu-manager'];
            const currentModule = menuManager ? menuManager.activeModuleId : null;
            
            console.log('Estado al hacer clic: módulo:', currentModule);
            
            // Verificar estado de módulos
            if (currentModule === 'videos') {
              // Verificar que estamos en el submódulo correcto (videos normales)
              if (menuManager.videoSubModule !== 'normal') {
                console.log('No estamos en el submódulo de videos normales, ignorando clic en play');
                return;
              }
              
              console.log('Iniciando reproducción de video desde botón de play');
              this.startPlayback();
            } else {
              console.log('No se inicia reproducción: no estamos en módulo de videos');
            }
          });
        }

        // El video entero también puede ser clickeado
        this.el.addEventListener('click', (evt) => {
          console.log('Click en video:', videoId);
          evt.stopPropagation();
          
          // Verificar si el elemento tiene la clase clickable
          if (!this.el.classList.contains('clickable')) {
            console.log('Video no clickeable, ignorando');
            evt.preventDefault();
            return;
          }
          
          // Verificar si está activo para interacción
          if (!this.isInteractable) {
            console.log('Video no interactuable, reinicializando...');
            this.resetForNewInteraction();
            return;
          }
          
          // Obtener el estado actual del gestor de menú
          const menuManager = this.el.sceneEl.components['menu-manager'];
          const currentModule = menuManager ? menuManager.activeModuleId : null;
          
          console.log('Estado al hacer clic: módulo:', currentModule);
          
          // Verificar estado de módulos
          if (currentModule === 'videos') {
            // Verificar que estamos en el submódulo correcto (videos normales)
            if (menuManager.videoSubModule !== 'normal') {
              console.log('No estamos en el submódulo de videos normales, ignorando clic');
              return;
            }
            
            if (this.isPlaying) {
              console.log('Deteniendo reproducción por clic en video');
              this.stopPlayback();
            } else {
              console.log('Iniciando reproducción por clic en video');
              this.startPlayback();
            }
          } else {
            console.log('No se inicia reproducción: no estamos en módulo de videos');
          }
        });
        
        // Timeout para garantizar que el componente esté completamente inicializado
        setTimeout(() => {
          console.log(`Video ${videoId} completamente inicializado`);
        }, 500);
        
      } catch (error) {
        console.error('Error inicializando video-controls:', error);
      }
    },

    resetForNewInteraction: function() {
      // Restaurar el estado del video a su configuración inicial
      if (this.videoEl) {
        this.videoEl.pause();
        this.videoEl.currentTime = 0;
      }
      
      // Restaurar posición y escala
      this.el.setAttribute('scale', '1 1 1');
      this.el.setAttribute('position', '0 0 0');
      
      // Restaurar wrapper si existe
      if (this.wrapper) {
        // Calcular posición original basada en el índice del video
        const videoId = this.videoEl.id;
        const videoIndex = parseInt(videoId.split('-')[1]) - 1;
        const row = Math.floor(videoIndex / 3);
        const col = videoIndex % 3;
        const xPos = -0.3 + (col * 0.3);
        const yPos = 0.0 - (row * 0.2);
        
        this.wrapper.setAttribute('position', `${xPos} ${yPos} 0`);
      }
      
      // Restaurar visibilidad del botón de play
      if (this.playButton) {
        this.playButton.setAttribute('visible', true);
        this.playButton.object3D.visible = true;
      }
      
      // Restablecer estado
      this.isPlaying = false;
      this.isInteractable = true;
      
      // Ocultar indicador de estado
      if (this.statusIndicator) {
        this.statusIndicator.style.display = 'none';
      }
      
      console.log('Video reinicializado para nueva interacción');
    },

    createStatusIndicator: function() {
      // Crear un indicador de estado para el video
      this.statusIndicator = document.createElement('div');
      this.statusIndicator.style.position = 'fixed';
      this.statusIndicator.style.bottom = '10px';
      this.statusIndicator.style.left = '10px';
      this.statusIndicator.style.backgroundColor = 'rgba(0,0,0,0.5)';
      this.statusIndicator.style.color = 'white';
      this.statusIndicator.style.padding = '5px 10px';
      this.statusIndicator.style.borderRadius = '5px';
      this.statusIndicator.style.zIndex = '1000';
      this.statusIndicator.style.display = 'none';
      document.body.appendChild(this.statusIndicator);
    },

    startPlayback: function() {
      if (this.isPlaying) return;
      
      // Verificar si el elemento tiene la clase clickable
      if (!this.el.classList.contains('clickable')) {
        console.log('Video no clickeable, no se puede reproducir');
        return;
      }
      
      // Verificar si estamos en el módulo y submódulo correcto
      const menuManager = this.el.sceneEl.components['menu-manager'];
      if (menuManager && (menuManager.activeModuleId !== 'videos' || menuManager.videoSubModule !== 'normal')) {
        console.log('No estamos en el módulo de videos normales, no se puede reproducir');
        return;
      }
      
      console.log('Iniciando reproducción de video normal');
      
      // Expandir y centrar el video
      this.el.setAttribute('scale', '4 4 1');
      this.el.setAttribute('position', '0 0 0.1');
      this.wrapper.setAttribute('position', '0 0 0');
      
      // Ocultar el botón de play
      if (this.playButton) {
        this.playButton.setAttribute('visible', false);
        this.playButton.object3D.visible = false;
      }
      
      // Ocultar otros videos
      const container = this.wrapper.parentElement;
      container.querySelectorAll('.video-wrapper').forEach(wrapper => {
        if (wrapper !== this.wrapper) {
          wrapper.object3D.visible = false;
        }
      });
      
      // Reproducir el video con sonido
      this.playVideoWithSoundFallback();
    },

    playVideoWithSoundFallback: function() {
      // Intentar reproducir con sonido primero
      this.videoEl.muted = false;
      
      const playPromise = this.videoEl.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('Video reproduciendo con sonido');
          this.isPlaying = true;
          
          // Mostrar indicador
          if (this.statusIndicator) {
            this.statusIndicator.textContent = 'Reproduciendo con sonido 🔊';
            this.statusIndicator.style.display = 'block';
          }
        }).catch(error => {
          console.warn('Error al reproducir video con sonido:', error);
          
          // Si falla, intentar reproducir sin sonido (muted)
          this.videoEl.muted = true;
          this.videoEl.play().then(() => {
            console.log('Video reproduciendo sin sonido (muted)');
            this.isPlaying = true;
            
            // Mostrar indicador de muted
            if (this.statusIndicator) {
              this.statusIndicator.textContent = 'Reproduciendo sin sonido 🔇';
              this.statusIndicator.style.display = 'block';
            }
            
            // Crear un mensaje para activar el sonido
            const unmuteBanner = document.createElement('div');
            unmuteBanner.style.position = 'fixed';
            unmuteBanner.style.top = '50%';
            unmuteBanner.style.left = '50%';
            unmuteBanner.style.transform = 'translate(-50%, -50%)';
            unmuteBanner.style.backgroundColor = 'rgba(0,0,0,0.8)';
            unmuteBanner.style.color = 'white';
            unmuteBanner.style.padding = '20px';
            unmuteBanner.style.borderRadius = '10px';
            unmuteBanner.style.zIndex = '2000';
            unmuteBanner.style.textAlign = 'center';
            unmuteBanner.innerHTML = '<p>Toca aquí para activar el sonido</p><button style="padding: 10px 20px; background: #4CAF50; border: none; color: white; border-radius: 5px; cursor: pointer;">Activar Sonido</button>';
            document.body.appendChild(unmuteBanner);
            
            unmuteBanner.querySelector('button').addEventListener('click', () => {
              this.videoEl.muted = false;
              if (this.statusIndicator) {
                this.statusIndicator.textContent = 'Reproduciendo con sonido 🔊';
              }
              unmuteBanner.remove();
            });
            
            // Ocultar después de 5 segundos
            setTimeout(() => unmuteBanner.remove(), 5000);
          }).catch(err => {
            console.error('Falló segundo intento de reproducción:', err);
            this.resetVideo();
            
            // Mostrar alerta al usuario
            alert('Toca la pantalla para permitir la reproducción de video');
            
            // Configurar un event listener para reproducir después de la interacción
            const clickHandler = () => {
              this.startPlayback();
              document.removeEventListener('click', clickHandler);
            };
            
            document.addEventListener('click', clickHandler, { once: true });
          });
        });
      }
    },

    stopPlayback: function() {
      if (!this.isPlaying) return;
      
      console.log('Deteniendo reproducción');
      
      try {
        // Pausar el video
        this.videoEl.pause();
        
        // Restaurar el video a su tamaño y posición original
        this.resetVideo();
        
        this.isPlaying = false;
        
        // Ocultar indicador
        if (this.statusIndicator) {
          this.statusIndicator.style.display = 'none';
        }
      } catch (error) {
        console.error('Error en stopPlayback:', error);
      }
    },

    resetVideo: function() {
      try {
        // Restaurar tamaño original
        this.el.setAttribute('scale', '1 1 1');
        this.el.setAttribute('position', '0 0 0');
        
        // Restaurar posición del wrapper
        if (this.wrapper) {
          // Calcular posición original basada en el índice del video
          const videoId = this.videoEl.id;
          const videoIndex = parseInt(videoId.split('-')[1]) - 1;
          const row = Math.floor(videoIndex / 3);
          const col = videoIndex % 3;
          const xPos = -0.3 + (col * 0.3);
          const yPos = 0.0 - (row * 0.2);
          
          this.wrapper.setAttribute('position', `${xPos} ${yPos} 0`);
        }
        
        // Mostrar el botón de play
        if (this.playButton) {
          this.playButton.setAttribute('visible', true);
          this.playButton.object3D.visible = true;
        }
        
        // Restaurar visibilidad de todos los videos
        if (this.wrapper && this.wrapper.parentElement) {
          const container = this.wrapper.parentElement;
          container.querySelectorAll('.video-wrapper').forEach(wrapper => {
            wrapper.object3D.visible = true;
          });
        }
        
        this.isPlaying = false;
        this.isInteractable = true; // Restablecer interactividad
      } catch (error) {
        console.error('Error en resetVideo:', error);
      }
    }
  });

  // Componente para el feedback visual de los botones
  AFRAME.registerComponent('button-feedback', {
    init: function() {
      const el = this.el;
      const originalScale = el.getAttribute('scale') || {x: 1, y: 1, z: 1};
      const originalColor = el.getAttribute('material').color;

      el.addEventListener('mouseenter', () => {
        el.setAttribute('scale', {
          x: originalScale.x * 1.2,
          y: originalScale.y * 1.2,
          z: originalScale.z * 1.2
        });
        el.setAttribute('material', 'opacity', 0.8);
      });

      el.addEventListener('mouseleave', () => {
        el.setAttribute('scale', originalScale);
        el.setAttribute('material', 'opacity', 1);
      });

      el.addEventListener('click', () => {
        // Efecto visual al hacer clic
        el.setAttribute('material', 'opacity', 0.6);
        setTimeout(() => {
          el.setAttribute('material', 'opacity', 1);
        }, 150);
      });
    }
  });

  // Componente para manejar el carrusel de imágenes
  AFRAME.registerComponent('carousel-manager', {
    init: function() {
      // Obtener todas las imágenes adicionales
      const images = [];
      let i = 0;
      let img = document.querySelector(`#additional-image-${i}`);
      while (img) {
        images.push(img.getAttribute('src'));
        i++;
        img = document.querySelector(`#additional-image-${i}`);
      }
      
      if (images.length === 0) {
        console.warn('No additional images found for carousel');
        return;
      }
      
      this.images = images;
      this.currentIndex = 0;
      
      // Configurar botones de navegación
      const nextBtn = this.el.querySelector('.next-btn');
      const prevBtn = this.el.querySelector('.prev-btn');
      
      if (nextBtn) {
        nextBtn.addEventListener('click', (evt) => {
          evt.stopPropagation();
          // Solo navegar si estamos en el módulo de imágenes
          const menuManager = this.el.sceneEl.components['menu-manager'];
          if (menuManager && menuManager.activeModuleId === 'imagenes') {
            this.nextImage();
          }
        });
      }
      
      if (prevBtn) {
        prevBtn.addEventListener('click', (evt) => {
          evt.stopPropagation();
          // Solo navegar si estamos en el módulo de imágenes
          const menuManager = this.el.sceneEl.components['menu-manager'];
          if (menuManager && menuManager.activeModuleId === 'imagenes') {
            this.prevImage();
          }
        });
      }
      
      // Crear un indicador de navegación
      this.createNavigationIndicator();
      
      console.log('Carousel initialized with', images.length, 'images');
    },
    
    createNavigationIndicator: function() {
      // No crear indicador de navegación
    },
    
    updateNavigationIndicator: function() {
      // No hacer nada, no hay indicador
    },
    
    nextImage: function() {
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
      this.updateImage();
    },
    
    prevImage: function() {
      this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
      this.updateImage();
    },
    
    updateImage: function() {
      const img = this.images[this.currentIndex];
      this.el.setAttribute('material', 'src', img);
      console.log('Carousel updated to image', this.currentIndex + 1, 'of', this.images.length);
      
      // Actualizar el indicador de navegación
      this.updateNavigationIndicator();
    }
  });
}); 