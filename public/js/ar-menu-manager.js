// Gestor de menús para la experiencia AR
document.addEventListener('DOMContentLoaded', function() {
  // Componente para manejar los botones y paneles
  AFRAME.registerComponent('menu-manager', {
    init: function() {
      // Referencias a los botones
      this.btnInicio = document.querySelector('#btn-inicio');
      this.btnInfo = document.querySelector('#btn-info');
      this.btnSocial = document.querySelector('#btn-social');
      this.btnVideos = document.querySelector('#btn-videos');
      this.btnImagenes = document.querySelector('#btn-imagenes');

      // Referencias a los paneles
      this.inicioPanel = document.querySelector('#inicio-panel');
      this.infoPanel = document.querySelector('#info-panel');
      this.socialPanel = document.querySelector('#social-panel');
      this.videosPanel = document.querySelector('#videos-panel');
      this.imagenesPanel = document.querySelector('#imagenes-panel');

      // Referencias a los contenedores de videos
      this.youtubeContainer = document.querySelector('#youtube-videos-container');
      this.normalContainer = document.querySelector('#normal-videos-container');
      this.btnYoutube = document.querySelector('#btn-youtube');
      this.btnNormal = document.querySelector('#btn-normal');

      // Estado actual
      this.currentPanel = this.inicioPanel;
      this.activeModuleId = 'inicio'; // Módulo activo
      this.videoSubModule = 'normal'; // Submódulo de video activo (normal o youtube)
      
      console.log('Estado inicial: módulo:', this.activeModuleId, 'submódulo:', this.videoSubModule);

      // Configurar eventos de los botones principales
      this.setupButton(this.btnInicio, this.inicioPanel, 'inicio');
      this.setupButton(this.btnInfo, this.infoPanel, 'info');
      this.setupButton(this.btnSocial, this.socialPanel, 'social');
      this.setupButton(this.btnVideos, this.videosPanel, 'videos');
      this.setupButton(this.btnImagenes, this.imagenesPanel, 'imagenes');

      // Configurar eventos para los botones de tipo de video
      if (this.btnYoutube && this.btnNormal) {
        this.btnYoutube.addEventListener('click', (evt) => {
          evt.stopPropagation();
          if (this.activeModuleId !== 'videos') return; // Solo responder si estamos en el módulo de videos
          
          console.log('Cambiando a videos de YouTube');
          
          // Actualizar submódulo activo
          this.videoSubModule = 'youtube';
          
          // Actualizar estilo de los botones
          this.btnYoutube.setAttribute('material', 'color', '#c71d1d'); // Rojo más intenso
          this.btnNormal.setAttribute('material', 'color', '#4CAF50'); // Verde normal
          
          // Detener cualquier video normal que esté reproduciéndose
          this.resetAllNormalVideos();
          
          // Deshabilitar interacción con videos normales
          if (this.normalContainer) {
            this.normalContainer.querySelectorAll('.video-player, .play-button').forEach(el => {
              el.classList.remove('clickable');
              
              // Marcar los componentes de control de video como no interactuables
              if (el.components && el.components['video-controls']) {
                el.components['video-controls'].isInteractable = false;
              }
            });
          }
          
          // Cambiar visibilidad de contenedores
          if (this.youtubeContainer) {
            this.youtubeContainer.setAttribute('visible', true);
            this.youtubeContainer.object3D.visible = true;
            
            // Asegurar que el contenedor esté en frente
            this.youtubeContainer.setAttribute('position', '0 0 0.03');
            
            // Habilitar todos los thumbnails de YouTube
            this.youtubeContainer.querySelectorAll('.youtube-thumbnail').forEach(thumbnail => {
              thumbnail.classList.add('clickable');
            });
          }
          
          if (this.normalContainer) {
            this.normalContainer.setAttribute('visible', false);
            this.normalContainer.object3D.visible = false;
          }
          
          console.log('Estado actualizado: módulo:', this.activeModuleId, 'submódulo:', this.videoSubModule);
        });

        this.btnNormal.addEventListener('click', (evt) => {
          evt.stopPropagation();
          if (this.activeModuleId !== 'videos') return; // Solo responder si estamos en el módulo de videos
          
          console.log('Cambiando a videos normales');
          
          // Actualizar submódulo activo
          this.videoSubModule = 'normal';
          
          // Actualizar estilo de los botones
          this.btnNormal.setAttribute('material', 'color', '#2E7D32'); // Verde más intenso
          this.btnYoutube.setAttribute('material', 'color', '#FF0000'); // Rojo normal
          
          // Cerrar cualquier modal de YouTube que esté abierto
          this.closeAllModals();
          
          // Cambiar visibilidad de contenedores
          if (this.youtubeContainer) {
            this.youtubeContainer.setAttribute('visible', false);
            this.youtubeContainer.object3D.visible = false;
            
            // Deshabilitar todos los thumbnails de YouTube para que no respondan a clics
            this.youtubeContainer.querySelectorAll('.youtube-thumbnail').forEach(thumbnail => {
              thumbnail.classList.remove('clickable');
            });
            
            // También quitar las clases clickable de los wrappers y botones de play
            this.youtubeContainer.querySelectorAll('.youtube-wrapper, .play-button').forEach(el => {
              el.classList.remove('clickable');
            });
          }
          
          if (this.normalContainer) {
            this.normalContainer.setAttribute('visible', true);
            this.normalContainer.object3D.visible = true;
            
            // Asegurar que el contenedor esté en frente
            this.normalContainer.setAttribute('position', '0 0 0.03');
          }

          // Asegurarse de que los videos normales sean clickeables nuevamente
          this.resetVideoClickability();
          
          console.log('Estado actualizado: módulo:', this.activeModuleId, 'submódulo:', this.videoSubModule);
        });
      }

      // Configurar eventos para miniaturas de YouTube
      document.querySelectorAll('.youtube-thumbnail').forEach(thumbnail => {
        thumbnail.addEventListener('click', (evt) => {
          evt.stopPropagation();
          console.log('Click en thumbnail de YouTube, estado actual: módulo:', 
                     this.activeModuleId, 'submódulo:', this.videoSubModule);
          
          // Solo procesar el clic si el elemento tiene la clase clickable
          if (!thumbnail.classList.contains('clickable')) {
            console.log('Thumbnail de YouTube no clickeable, ignorando');
            evt.preventDefault();
            return;
          }
          
          // Solo abrir si estamos en el módulo de videos 
          if (this.activeModuleId === 'videos') {
            // Solo si estamos en submódulo YouTube o si el contenedor de YouTube está visible
            if (this.videoSubModule === 'youtube' || 
                (this.youtubeContainer && this.youtubeContainer.object3D.visible)) {
              const videoId = thumbnail.getAttribute('data-video-id');
              if (videoId) {
                console.log('Abriendo video de YouTube:', videoId);
                this.openYoutubeModal(videoId);
              }
            } else {
              // No hacemos nada si estamos en el submódulo de videos normales
              console.log('No se puede abrir video de YouTube en submódulo de videos normales');
            }
          } else {
            console.log('Ignorando clic en thumbnail de YouTube: módulo incorrecto');
          }
        });
      });

      // Configurar eventos para las redes sociales
      document.querySelectorAll('.social-link').forEach(socialLink => {
        socialLink.addEventListener('click', (evt) => {
          evt.stopPropagation();
          // Solo abrir si estamos en el módulo de redes sociales
          if (this.activeModuleId === 'social') {
            const url = socialLink.getAttribute('data-url');
            if (url) {
              // Construir una URL válida si no comienza con http o https
              let finalUrl = url;
              if (!url.startsWith('http://') && !url.startsWith('https://')) {
                if (url.includes('@')) {
                  // Probablemente es un correo electrónico
                  finalUrl = 'mailto:' + url;
                } else if (url.includes('instagram.com') || url.startsWith('@')) {
                  // Es una cuenta de Instagram
                  const username = url.startsWith('@') ? url.substring(1) : url;
                  finalUrl = 'https://instagram.com/' + username.replace('@', '');
                } else if (url.includes('facebook.com')) {
                  finalUrl = 'https://' + url;
                } else if (url.includes('twitter.com') || url.includes('x.com')) {
                  finalUrl = 'https://' + url;
                } else {
                  finalUrl = 'https://' + url;
                }
              }
              console.log('Abriendo URL de red social:', finalUrl);
              window.open(finalUrl, '_blank');
            }
          }
        });
      });

      // Limpiar cualquier modal abierto al iniciar
      this.closeAllModals();
      
      // Configurar estados iniciales
      this.setInitialStates();
      
      // Verificar que el submódulo de video esté correctamente inicializado
      setTimeout(() => {
        // Forzar el submódulo normal
        this.videoSubModule = 'normal';
        console.log('Submódulo de video forzado a normal');
      }, 1000);

      // Reproduce automáticamente el video principal cuando se entra en el módulo de inicio
      this.playMainContentIfNeeded();
    },

    playMainContentIfNeeded: function() {
      const mainVideo = document.querySelector('#main-content');
      if (mainVideo && mainVideo.tagName === 'VIDEO') {
        console.log('Intentando reproducir automáticamente el video principal');
        
        // Forzar la reproducción sin esperar a canplaythrough
        this.attemptToPlayVideo(mainVideo);
        
        // También configurar un evento por si la reproducción inmediata falla
        mainVideo.addEventListener('canplaythrough', () => {
          if (this.activeModuleId === 'inicio' && mainVideo.paused) {
            console.log('Video principal listo para reproducción (canplaythrough)');
            this.attemptToPlayVideo(mainVideo);
          }
        });
      }
    },
    
    attemptToPlayVideo: function(video) {
      // Intentar reproducir con sonido primero
      video.muted = false;
      video.playsInline = true;
      video.loop = true;
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('Video principal reproduciendo con sonido automáticamente');
        }).catch(error => {
          console.warn('Error reproduciendo video principal con sonido:', error);
          
          // Intentar reproducir sin sonido (muted) como respaldo
          video.muted = true;
          video.play().then(() => {
            console.log('Video principal reproduciendo sin sonido (muted)');
            
            // Configurar evento para activar sonido con interacción del usuario
            document.addEventListener('click', () => {
              video.muted = false;
            }, { once: true });
          }).catch(err => {
            console.error('No se pudo reproducir ni siquiera sin sonido:', err);
          });
        });
      }
    },

    setInitialStates: function() {
      // Establecer el panel de inicio como visible
      this.inicioPanel.setAttribute('visible', true);
      this.inicioPanel.object3D.visible = true;
      
      // Ocultar otros paneles
      [this.infoPanel, this.socialPanel, this.videosPanel, this.imagenesPanel].forEach(panel => {
        if (panel) {
          panel.setAttribute('visible', false);
          panel.object3D.visible = false;
        }
      });
      
      // Configurar visibilidad inicial de contenedores de video
      if (this.youtubeContainer) {
        this.youtubeContainer.setAttribute('visible', false);
        this.youtubeContainer.object3D.visible = false;
        
        // Deshabilitar inicialmente los thumbnails de YouTube
        this.youtubeContainer.querySelectorAll('.youtube-thumbnail').forEach(thumbnail => {
          thumbnail.classList.remove('clickable');
        });
      }
      
      if (this.normalContainer) {
        this.normalContainer.setAttribute('visible', true);
        this.normalContainer.object3D.visible = true;
      }
      
      // Asegurar que todos los botones de video normal sean clickeables
      document.querySelectorAll('.video-player').forEach(videoPlayer => {
        videoPlayer.classList.add('clickable');
      });
      
      // Asegurarnos de que los thumbnails de YouTube sean clickeables también cuando corresponda
      if (this.videoSubModule === 'youtube') {
        document.querySelectorAll('.youtube-thumbnail').forEach(thumbnail => {
          thumbnail.classList.add('clickable');
        });
      }
      
      // Asegurarnos de que los botones sean clickeables
      document.querySelectorAll('.play-button, .prev-btn, .next-btn, #btn-inicio, #btn-info, #btn-social, #btn-videos, #btn-imagenes, #btn-youtube, #btn-normal').forEach(button => {
        button.classList.add('clickable');
      });
      
      // Estilo inicial para los botones de tipo de video
      if (this.btnNormal) this.btnNormal.setAttribute('material', 'color', '#2E7D32'); // Verde más intenso
      if (this.btnYoutube) this.btnYoutube.setAttribute('material', 'color', '#FF0000'); // Rojo normal
      
      // Estado de submódulo inicial
      this.videoSubModule = 'normal';
      
      console.log('Estados iniciales configurados, submódulo: normal');
    },

    setupButton: function(button, panel, moduleId) {
      if (!button || !panel) return;

      button.addEventListener('click', (evt) => {
        evt.stopPropagation();
        console.log(`Click en botón ${moduleId}`);
        
        // Si ya estamos en este módulo, no hacer nada
        if (this.activeModuleId === moduleId) {
          console.log(`Ya estamos en el módulo ${moduleId}, ignorando click`);
          return;
        }
        
        // Ocultar panel actual
        if (this.currentPanel) {
          this.currentPanel.setAttribute('visible', false);
          this.currentPanel.object3D.visible = false;
        }

        // Cerrar cualquier modal o video expandido
        this.closeAllModals();
        this.resetAllVideos();

        // Mostrar nuevo panel
        panel.setAttribute('visible', true);
        panel.object3D.visible = true;
        
        // Si el panel tiene position, asegurarse de que sea (0,0,0) para centrar
        panel.setAttribute('position', '0 0 0');
        
        this.currentPanel = panel;
        this.activeModuleId = moduleId; // Actualizar módulo activo

        // Restaurar la visibilidad y el estado de todos los contenedores
        this.restoreContainersState();

        // Configuración específica por tipo de panel
        if (moduleId === 'videos') {
          // Restablecer al submódulo de videos normales por defecto
          this.videoSubModule = 'normal';
          
          // Actualizar visibilidad de contenedores
          if (this.youtubeContainer) {
            this.youtubeContainer.setAttribute('visible', false);
            this.youtubeContainer.object3D.visible = false;
            
            // Deshabilitar los thumbnails de YouTube
            this.youtubeContainer.querySelectorAll('.youtube-thumbnail').forEach(thumbnail => {
              thumbnail.classList.remove('clickable');
            });
          }
          
          if (this.normalContainer) {
            this.normalContainer.setAttribute('visible', true);
            this.normalContainer.object3D.visible = true;
            this.normalContainer.setAttribute('position', '0 0 0.03');
          }
          
          // Actualizar estilo de botones
          if (this.btnNormal) this.btnNormal.setAttribute('material', 'color', '#2E7D32'); // Verde más intenso
          if (this.btnYoutube) this.btnYoutube.setAttribute('material', 'color', '#FF0000'); // Rojo normal
          
          // Establecer botones de video a clickable después de cambiar de módulo
          document.querySelectorAll('.video-player, .play-button').forEach(element => {
            element.classList.add('clickable');
          });
        } 
        else if (moduleId === 'inicio') {
          // Reproducir automáticamente el video principal si es que hay uno
          this.playMainContentIfNeeded();
        }
        else if (moduleId === 'imagenes') {
          // Asegurarse de que el carrusel funcione correctamente
          const carousel = panel.querySelector('#carousel-container');
          if (carousel && carousel.components['carousel-manager']) {
            const carouselManager = carousel.components['carousel-manager'];
            // Actualizar la imagen mostrada
            carouselManager.updateImage();
          }
        }

        console.log('Módulo activo ahora:', this.activeModuleId);
      });
    },

    restoreContainersState: function() {
      // Restaurar el estado de todos los contenedores y elementos interactivos
      
      // Asegurar que los videos normales estén en su estado original
      document.querySelectorAll('.video-player').forEach(videoPlayer => {
        // Restaurar escala y posición
        videoPlayer.setAttribute('scale', '1 1 1');
        videoPlayer.setAttribute('position', '0 0 0');
        
        // Restaurar visibilidad del botón de play
        const playButton = videoPlayer.querySelector('.play-button');
        if (playButton) {
          playButton.setAttribute('visible', true);
          playButton.object3D.visible = true;
        }
        
        // Reiniciar el componente de control de video si existe
        if (videoPlayer.components && videoPlayer.components['video-controls']) {
          const component = videoPlayer.components['video-controls'];
          component.resetForNewInteraction();
        }
      });
      
      // Restaurar posición de los wrappers de video
      document.querySelectorAll('.video-wrapper').forEach((wrapper, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        const xPos = -0.3 + (col * 0.3);
        const yPos = 0.0 - (row * 0.2);
        
        wrapper.setAttribute('position', `${xPos} ${yPos} 0`);
        wrapper.object3D.visible = true;
      });
      
      // Asegurar que todos los wrappers de video sean visibles
      document.querySelectorAll('.video-wrapper, .youtube-wrapper').forEach(wrapper => {
        wrapper.object3D.visible = true;
      });
      
      // Pausar todos los videos
      document.querySelectorAll('a-assets video').forEach(video => {
        if (!video.paused) {
          video.pause();
          video.currentTime = 0;
        }
      });
      
      console.log('Estado de contenedores restablecido');
    },

    openYoutubeModal: function(videoId) {
      // Solo abrir si estamos en el módulo de videos
      if (this.activeModuleId !== 'videos') {
        console.log('No se abre modal de YouTube: no estamos en módulo videos');
        return;
      }

      const modal = document.getElementById('youtube-modal');
      const iframe = document.getElementById('youtube-iframe');
      if (modal && iframe) {
        // Incluir parámetros para autoplay, control y sonido
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&enablejsapi=1`;
        modal.style.display = 'flex';
        console.log('Modal de YouTube abierto para:', videoId);

        // Desactivar la interactividad de todos los videos normales cuando el modal está abierto
        document.querySelectorAll('.video-player').forEach(videoPlayer => {
          if (videoPlayer.components && videoPlayer.components['video-controls']) {
            videoPlayer.components['video-controls'].isInteractable = false;
          }
        });
      }
    },

    closeAllModals: function() {
      // Cerrar modal de YouTube
      const modal = document.getElementById('youtube-modal');
      const iframe = document.getElementById('youtube-iframe');
      if (modal && iframe) {
        iframe.src = '';
        modal.style.display = 'none';
        console.log('Modal de YouTube cerrado');

        // Reactivar la interactividad de los videos normales cuando se cierra el modal
        document.querySelectorAll('.video-player').forEach(videoPlayer => {
          if (videoPlayer.components && videoPlayer.components['video-controls']) {
            videoPlayer.components['video-controls'].isInteractable = true;
          }
        });
      }
    },

    resetAllVideos: function() {
      console.log('Reseteando todos los videos...');
      
      // Reiniciar todos los videos a su estado inicial
      this.resetAllNormalVideos();
      
      // Cerrar cualquier modal de YouTube
      this.closeAllModals();
      
      console.log('Videos reseteados');
    },
    
    resetAllNormalVideos: function() {
      console.log('Reseteando videos normales...');
      
      let videosDetenidos = 0;
      
      // Primera verificación: buscar componentes video-controls
      document.querySelectorAll('.video-player').forEach(videoPlayer => {
        if (videoPlayer.components && videoPlayer.components['video-controls']) {
          const component = videoPlayer.components['video-controls'];
          if (component && component.isPlaying) {
            component.stopPlayback();
            videosDetenidos++;
            console.log('Video detenido mediante componente');
          }
        }
      });
      
      // Segunda verificación: buscar elementos de video directamente
      document.querySelectorAll('a-assets video').forEach(video => {
        if (!video.paused) {
          video.pause();
          videosDetenidos++;
          console.log('Video detenido directamente:', video.id);
        }
      });

      // Asegurarse de que todos los videos sean visibles
      document.querySelectorAll('.video-wrapper').forEach(wrapper => {
        wrapper.object3D.visible = true;
        
        // Restaurar posición y escala de todos los videos
        const videoPlayer = wrapper.querySelector('.video-player');
        if (videoPlayer) {
          videoPlayer.setAttribute('scale', '1 1 1');
          videoPlayer.setAttribute('position', '0 0 0');
          
          // Hacer visible el botón de play
          const playButton = videoPlayer.querySelector('.play-button');
          if (playButton) {
            playButton.setAttribute('visible', true);
            playButton.object3D.visible = true;
          }
        }
      });
      
      console.log(`${videosDetenidos} videos detenidos`);
      
      // Asegurarse de que el contenedor normal esté visible si estamos en submódulo normal
      if (this.videoSubModule === 'normal' && this.normalContainer) {
        this.normalContainer.setAttribute('visible', true);
        console.log('Contenedor de videos normales hecho visible');
      }
    },
    
    resetVideoClickability: function() {
      // Restaurar interactividad a todos los videos normales
      document.querySelectorAll('.video-player').forEach(videoPlayer => {
        videoPlayer.classList.add('clickable');
        
        // Asegurarse de que el botón de play es visible e interactivo
        const playButton = videoPlayer.querySelector('.play-button');
        if (playButton) {
          playButton.setAttribute('visible', true);
          playButton.object3D.visible = true;
          playButton.classList.add('clickable');
        }
        
        // Restaurar la interactividad del componente si existe
        if (videoPlayer.components && videoPlayer.components['video-controls']) {
          const component = videoPlayer.components['video-controls'];
          component.isPlaying = false;
          component.isInteractable = true;
        }
      });
      
      // Restaurar la visibilidad de todos los wrappers de video
      document.querySelectorAll('.video-wrapper').forEach(wrapper => {
        wrapper.object3D.visible = true;
        
        // Restaurar escala y posición de videos
        const videoPlayer = wrapper.querySelector('.video-player');
        if (videoPlayer) {
          videoPlayer.setAttribute('scale', '1 1 1');
          videoPlayer.setAttribute('position', '0 0 0');
        }
      });
      
      // Pausar todos los videos para asegurar que estén en estado inicial
      document.querySelectorAll('a-assets video').forEach(video => {
        if (!video.paused) {
          video.pause();
          video.currentTime = 0;
        }
      });
      
      console.log('Interactividad de videos restaurada');
    }
  });

  // Agregar el componente menu-manager a la escena
  document.querySelector('a-scene').setAttribute('menu-manager', '');

  // Configurar cierre del modal de YouTube
  document.getElementById('close-youtube')?.addEventListener('click', () => {
    const menuManager = document.querySelector('a-scene').components['menu-manager'];
    if (menuManager) {
      menuManager.closeAllModals();
    } else {
      const modal = document.getElementById('youtube-modal');
      const iframe = document.getElementById('youtube-iframe');
      if (modal && iframe) {
        iframe.src = '';
        modal.style.display = 'none';
      }
    }
  });

  // Agregar evento para cerrar el modal con Escape
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const menuManager = document.querySelector('a-scene').components['menu-manager'];
      if (menuManager) {
        menuManager.closeAllModals();
      }
    }
  });
}); 