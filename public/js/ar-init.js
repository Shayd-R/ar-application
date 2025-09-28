// Inicialización y configuración de la experiencia AR
document.addEventListener('DOMContentLoaded', function() {
  const sceneEl = document.querySelector('a-scene');
  const startButton = document.getElementById('start-button');
  const loadingScreen = document.getElementById('loading-screen');
  const errorScreen = document.getElementById('error-screen');
  const controlPanel = document.getElementById('control-panel');
  let initializationTimeout;

  // Preparar todos los videos
  function prepareVideos() {
    const videoElements = document.querySelectorAll('a-assets video');
    console.log(`Preparando ${videoElements.length} videos...`);
    
    videoElements.forEach((video, index) => {
      // Forzar la carga de metadatos
      video.load();
      
      // Importante: Configurar para que pueda reproducirse sin interacción del usuario
      video.muted = true; // Inicialmente muted para permitir autoplay
      video.playsInline = true;
      video.loop = true;
      video.crossOrigin = 'anonymous';
      
      // Añadir un ID único si no lo tiene
      if (!video.id) {
        video.id = `auto-video-${index}`;
      }
      
      console.log(`Preparando video: ${video.id}, src: ${video.src}`);
      
      // Cargar los primeros segundos y pausar para tener el video listo
      video.addEventListener('loadedmetadata', () => {
        console.log(`Metadatos cargados para video: ${video.id}, duración: ${video.duration}s`);
        video.currentTime = 0;
        
        // Reproducir y pausar inmediatamente para preparar el video
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            setTimeout(() => {
              video.pause();
              console.log(`Video preparado y pausado: ${video.id}`);
            }, 100);
          }).catch(error => {
            console.warn(`No se pudo precargar el video: ${video.id}`, error);
          });
        }
      });
      
      // Manejar errores de carga
      video.addEventListener('error', (err) => {
        console.error(`Error cargando video: ${video.id}`, video.error);
      });
    });
    
    console.log('Videos preparados para reproducción');
  }

  function showError(message) {
    console.error('Error:', message);
    loadingScreen.style.display = 'none';
    errorScreen.style.display = 'flex';
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
      errorMessage.textContent = message;
    }
    // Limpiar el timeout si existe
    if (initializationTimeout) {
      clearTimeout(initializationTimeout);
    }
  }

  // Función para verificar recursos
  async function checkResources() {
    const assets = document.querySelectorAll('a-assets img, a-assets video');
    try {
      await Promise.all(Array.from(assets).map(asset => {
        return new Promise((resolve, reject) => {
          if (asset.complete || asset.readyState >= 4) {
            resolve();
          } else {
            asset.addEventListener('load', resolve);
            asset.addEventListener('error', () => reject(new Error(`Error cargando: ${asset.src}`)));
          }
        });
      }));
      return true;
    } catch (error) {
      console.error('Error cargando recursos:', error);
      return false;
    }
  }

  // Función para manejar un toque en la pantalla
  function setupUserInteractionHandling() {
    // Habilitar audio en interacción de usuario sin mostrar mensajes
    document.addEventListener('click', () => {
      // Enumerar todos los videos y activar su audio
      document.querySelectorAll('video').forEach(video => {
        if (video.muted) {
          video.muted = false;
          console.log('Audio activado para:', video.id);
        }
      });
    }, { once: true });
  }

  if (startButton && sceneEl) {
    // Iniciar la preparación de videos inmediatamente
    prepareVideos();
    
    startButton.addEventListener('click', async function() {
      try {
        startButton.style.display = 'none';
        loadingScreen.style.display = 'flex';

        // Verificar recursos antes de iniciar
        const resourcesLoaded = await checkResources();
        if (!resourcesLoaded) {
          throw new Error('No se pudieron cargar todos los recursos necesarios');
        }

        // Timeout de 20 segundos para la inicialización (aumentado desde 15)
        initializationTimeout = setTimeout(() => {
          showError('Tiempo de espera agotado al iniciar AR');
        }, 20000);

        // Esperar a que el sistema AR esté disponible
        await new Promise((resolve, reject) => {
          if (sceneEl.systems['mindar-image-system']) {
            resolve();
          } else {
            sceneEl.addEventListener('loaded', resolve, { once: true });
            sceneEl.addEventListener('error', reject, { once: true });
          }
        });

        const arSystem = sceneEl.systems['mindar-image-system'];
        if (!arSystem) {
          throw new Error('Sistema AR no inicializado');
        }

        // Configurar manejo de interacción de usuario para audio
        setupUserInteractionHandling();

        // Limpiar el timeout ya que la inicialización fue exitosa
        clearTimeout(initializationTimeout);

        // Iniciar el sistema AR
        await arSystem.start();
        loadingScreen.style.display = 'none';
        controlPanel.style.display = 'block';

        // Intentar reproducir el video principal automáticamente
        try {
          console.log('AR iniciado, intentando reproducir el video principal...');
          const mainVideo = document.querySelector('#main-content');
          if (mainVideo && mainVideo.tagName === 'VIDEO') {
            // Intentar reproducir con audio
            const playPromise = mainVideo.play();
            playPromise.then(() => {
              console.log('Video principal reproduciendo automáticamente');
            }).catch(error => {
              console.warn('No se pudo reproducir con audio:', error);
              
              // Intentar reproducir sin audio (muted)
              mainVideo.muted = true;
              mainVideo.play().then(() => {
                console.log('Video principal reproduciendo sin audio');
                
                // Configurar evento para activar audio con clic, sin mostrar mensajes
                document.addEventListener('click', () => {
                  mainVideo.muted = false;
                }, { once: true });
              });
            });
          }
        } catch (error) {
          console.error('Error al intentar reproducir video automáticamente:', error);
        }

        // Verificar periódicamente si hay conexión al target
        let targetFoundOnce = false;
        const targetCheckInterval = setInterval(() => {
          const isTargetVisible = arSystem.arController && arSystem.targetFound;
          
          if (isTargetVisible) {
            targetFoundOnce = true;
            console.log('Target encontrado y visible');
          } else if (targetFoundOnce) {
            // Si perdimos el target después de haberlo encontrado
            console.log('Target perdido, esperando...');
          }
        }, 1000);

        // Si después de 30 segundos nunca se detectó el target, mostrar un mensaje
        setTimeout(() => {
          if (!targetFoundOnce) {
            // Crear un mensaje de ayuda
            const helpMessage = document.createElement('div');
            helpMessage.style.position = 'fixed';
            helpMessage.style.top = '50%';
            helpMessage.style.left = '50%';
            helpMessage.style.transform = 'translate(-50%, -50%)';
            helpMessage.style.backgroundColor = 'rgba(0,0,0,0.8)';
            helpMessage.style.color = 'white';
            helpMessage.style.padding = '20px';
            helpMessage.style.borderRadius = '10px';
            helpMessage.style.zIndex = '3000';
            helpMessage.style.maxWidth = '80%';
            helpMessage.style.textAlign = 'center';
            helpMessage.innerHTML = `
              <h3>¿Problemas para detectar el marcador?</h3>
              <p>Asegúrate de que:</p>
              <ul style="text-align: left; padding-left: 20px;">
                <li>El marcador esté bien iluminado</li>
                <li>No haya reflejos sobre el marcador</li>
                <li>La cámara esté enfocando correctamente</li>
                <li>Mantengas la cámara estable</li>
              </ul>
              <button id="close-help" style="margin-top: 10px; padding: 8px 16px; background: #4CAF50; border: none; color: white; border-radius: 4px;">Entendido</button>
            `;
            document.body.appendChild(helpMessage);
            
            // Configurar botón para cerrar
            document.getElementById('close-help').addEventListener('click', () => {
              helpMessage.remove();
            });
          }
        }, 30000);

      } catch (error) {
        console.error('Error al iniciar AR:', error);
        showError('No se pudo iniciar la experiencia AR. Por favor, verifica que tu dispositivo sea compatible y hayas dado los permisos necesarios.');
      }
    });

    // Eventos del sistema AR
    sceneEl.addEventListener('arReady', () => {
      console.log('AR está listo');
    });

    sceneEl.addEventListener('arError', (error) => {
      console.error('Error en AR:', error);
      showError('Ha ocurrido un error en la experiencia AR.');
    });

    // Controles de pausa/resume
    const pauseButton = document.getElementById('pause-button');
    const resumeButton = document.getElementById('resume-button');
    
    if (pauseButton && resumeButton) {
      pauseButton.addEventListener('click', async () => {
        try {
          const arSystem = sceneEl.systems['mindar-image-system'];
          if (arSystem) {
            await arSystem.pause();
            pauseButton.style.display = 'none';
            resumeButton.style.display = 'block';
          }
        } catch (error) {
          console.error('Error al pausar AR:', error);
        }
      });

      resumeButton.addEventListener('click', async () => {
        try {
          const arSystem = sceneEl.systems['mindar-image-system'];
          if (arSystem) {
            await arSystem.unpause();
            resumeButton.style.display = 'none';
            pauseButton.style.display = 'block';
          }
        } catch (error) {
          console.error('Error al reanudar AR:', error);
        }
      });
    }
  }
}); 