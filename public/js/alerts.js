// Utilidad para mostrar alertas usando SweetAlert2
const Alerts = {
    // Mostrar mensaje de éxito
    success: function(message, timer = 3000) {
        Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: message,
            timer: timer,
            timerProgressBar: true,
            showConfirmButton: false
        });
    },

    // Mostrar mensaje de error
    error: function(message, timer = 0) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
            timer: timer,
            showConfirmButton: timer === 0
        });
    },

    // Mostrar mensaje de advertencia
    warning: function(message, timer = 0) {
        Swal.fire({
            icon: 'warning',
            title: '¡Atención!',
            text: message,
            timer: timer,
            showConfirmButton: timer === 0
        });
    },

    // Mostrar mensaje de información
    info: function(message, timer = 3000) {
        Swal.fire({
            icon: 'info',
            title: 'Información',
            text: message,
            timer: timer,
            timerProgressBar: true,
            showConfirmButton: false
        });
    },

    // Mostrar confirmación
    confirm: async function(message, confirmButtonText = 'Sí', cancelButtonText = 'No') {
        const result = await Swal.fire({
            icon: 'question',
            title: '¿Estás seguro?',
            text: message,
            showCancelButton: true,
            confirmButtonText: confirmButtonText,
            cancelButtonText: cancelButtonText,
            reverseButtons: true
        });
        return result.isConfirmed;
    },

    // Mostrar mensaje de carga
    loading: function(message = 'Procesando...') {
        Swal.fire({
            title: message,
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            }
        });
    },

    // Cerrar alerta actual
    close: function() {
        Swal.close();
    },

    // Mostrar mensaje de error de red
    networkError: function() {
        this.error('Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.');
    },

    // Mostrar mensaje de error del servidor
    serverError: function() {
        this.error('Ha ocurrido un error en el servidor. Por favor, intenta nuevamente más tarde.');
    },

    // Mostrar mensaje de sesión expirada
    sessionExpired: function() {
        Swal.fire({
            icon: 'warning',
            title: 'Sesión Expirada',
            text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
            showConfirmButton: true,
            allowOutsideClick: false
        }).then(() => {
            window.location.href = '/auth/login';
        });
    }
}; 