// ==========================================================================
// SEGURIDAD: Bloqueo de Código Fuente
// ==========================================================================
document.addEventListener("keydown", e => {
    if (e.ctrlKey && e.key === "u") {
        alert("Ver código fuente no permitido"); 
        e.preventDefault(); 
    }
});

$(document).ready(function() {
    
    // MANEJO DEL ENCABEZADO
    // ----------------------------------------------------------------------
    var contenidoUrl = window.location.pathname;
    $('.nav-links-container .nav-link').each(function() {
        var enlaceAttr = $(this).attr('href');
        if (contenidoUrl.indexOf(enlaceAttr) !== -1 || (enlaceAttr === 'menu.html' && contenidoUrl.endsWith('/main/'))) {
            $(this).addClass('active-page');
        } else {
            $(this).removeClass('active-page');
        }
    });

    // VALIDACIONES Y AUTENTICACIÓN (login.html)
    
    
    $('#txtCorreo').on('blur', function() {
        var correo = $(this).val().trim();
        var regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (correo !== "" && !regexCorreo.test(correo)) {
            $(this).addClass('input-error');
            alert("Email inválido. Ingrese un formato correcto");
        } else {
            $(this).removeClass('input-error');
        }
    });

    
        $('#txtPassword').on('input', function() {
        if ($(this).val().trim() !== "") {
            $(this).removeClass('input-error');
        }
    });

    // Envío del Formulario Login
    $('#loginForm').on('submit', function(e) {
        e.preventDefault(); 

        var correoInput = $('#txtCorreo');
        var passwordInput = $('#txtPassword');
        var esValido = true;

        if (passwordInput.val().trim() === "") {
            passwordInput.addClass('input-error');
            alert("La contraseña no puede estar vacía.");
            esValido = false;
        }

        if (esValido && !correoInput.hasClass('input-error')) {
            fetch('../data/usuarios.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error("No se pudo cargar al usuario");
                    }
                    return response.json();
                })
                .then(usuarios => {
                    var usuarioEncontrado = usuarios.find(u => u.correo === correoInput.val().trim() && u.contraseña === passwordInput.val().trim());

                    if (usuarioEncontrado) {
                        localStorage.setItem('usuarioSesion', JSON.stringify(usuarioEncontrado));
                        window.location.href = '../main/menu.html';
                    } else {
                        alert("Credenciales incorrectas. Inténtalo nuevamente.");
                    }
                })
                .catch(error => {
                    console.error("Error:", error);
                    alert("Error en el sistema de autenticación.");
                });
        }
    });

    // Entrada a menu.html
    
    if ($('body').data('page') === 'principal') {
        var datosGuardados = localStorage.getItem('usuarioSesion');

        if (datosGuardados) {
            var usuario = JSON.parse(datosGuardados);

            var panelInfo = `
                <div class="row justify-content-center mt-4">
                    <div class="col-md-6">
                        <div class="card p-4 shadow-sm text-start" style="border: 2px solid #000; background-color: rgba(255,255,255,0.9);">
                            <h3 class="fw-bold mb-3 text-center">¡Bienvenida(o) a tu billetera, ${usuario.nombre}!</h3>
                            <hr style="border-top: 2px solid #000;">
                            <p class="fs-5"><strong>Número de Cuenta:</strong> ${usuario.cuenta}</p>
                            <p class="fs-4 text-danger"><strong>Saldo Actual:</strong> $${usuario.saldo.toLocaleString('es-CL')}</p>
                        </div>
                    </div>
                </div>
            `;
            $('#userDataContainer').html(panelInfo);
        } else {
            window.location.href = '../login.html';
        }
    }

    // Cerrar sesión
    $('.btn-exit').on('click', function() {
        localStorage.removeItem('usuarioSesion');
    });
});

// Depositos y Giros : deposits.html
// ==========================================================================
if ($('body').data('page') === 'depositos') {
    // Datos del usuario activo
    var datosGuardados = localStorage.getItem('usuarioSesion');
    
    if (!datosGuardados) {
        window.location.href = '../login.html';
    } else {
        var usuario = JSON.parse(datosGuardados);
        
        // Datos iniciales
        $('#lblNombre').text(usuario.nombre);
        $('#lblSaldo').text(usuario.saldo.toLocaleString('es-CL'));
        
        // Formatear input con puntos de mil al perder el foco (blur)
        $('#txtCantidad').on('blur', function() {
            // Elimina no numericos
            var valorLimpio = $(this).val().replace(/\D/g, "");
            
            if (valorLimpio !== "") {
                var numero = parseInt(valorLimpio, 10);
                // IMPLEMENTANDO CON JQUERY
                // Guardamos el número limpio con jQuery para procesarlo después
                $(this).data('valor-numerico', numero);
                // Mostramos cifra formateada con puntos
                $(this).val(numero.toLocaleString('es-CL'));
            }
        });

        // Limpia formato cuando el usuario vuelva a hacer foco para que digite con facilidad
        $('#txtCantidad').on('focus', function() {
            var numeroReal = $(this).data('valor-numerico');
            if (numeroReal) {
                $(this).val(numeroReal);
            }
        });

        // Proceso del formulario (Botón Confirmar)
        $('#transactionForm').on('submit', function(e) {
            e.preventDefault();
            
            var tipoOperacion = $('#cmbTipo').val();
            var numeroReal = $('#txtCantidad').data('valor-numerico');

            // Validaciones 
            if (!numeroReal || numeroReal <= 0) {
                alert("Por favor, ingresa una cantidad válida.");
                $('#txtCantidad').addClass('input-error');
                return;
            }
            $('#txtCantidad').removeClass('input-error');

            // Valida fondos para Giro
            if (tipoOperacion === 'Giro' && numeroReal > usuario.saldo) {
                alert("Saldo insuficiente, intente una cantidad menor.");
                $('#txtCantidad').addClass('input-error');
                return;
            }

            // Actualiza saldo
            if (tipoOperacion === 'Deposito') {
                usuario.saldo += numeroReal;
            } else if (tipoOperacion === 'Giro') {
                usuario.saldo -= numeroReal;
            }

            // Actualizar en tiempo real
            $('#lblSaldo').text(usuario.saldo.toLocaleString('es-CL'));
            
            // Persistir saldo actualizado en el usuario activo de la sesión
            localStorage.setItem('usuarioSesion', JSON.stringify(usuario));

            // Simulación del registro del nuevo movimiento en movimientos.json (vía localStorage)
            // Obtenemos la fecha actual en formato DD-MM-AAAA
            var hoy = new Date();
            var dia = String(hoy.getDate()).padStart(2, '0');
            var mes = String(hoy.getMonth() + 1).padStart(2, '0');
            var anio = hoy.getFullYear();
            var fechaFormateada = `${dia}-${mes}-${anio}`;

            // Nuevo movimiento
            var nuevoMovimiento = {
                "Fecha": fechaFormateada,
                "Tipo": tipoOperacion,
                "Detalle": tipoOperacion === 'Deposito' ? 'Depósito' : 'Giro',
                "Mensaje": tipoOperacion === 'Deposito' ? 'Depósito registrado en cuenta' : 'Retiro de efectivo cajero',
                "Monto": numeroReal
            };

            // Historial guardado en el Navegador
            var historialMovimientos = localStorage.getItem('historicoMovimientos');
            var listaCompleta = [];

            if (historialMovimientos) {
                listaCompleta = JSON.parse(historialMovimientos);
            }

            // Buscar si el usuario ya tiene un bloque dentro del JSON de movimientos
            var usuarioBloque = listaCompleta.find(item => item.usuario.cuenta === usuario.cuenta);

            if (usuarioBloque) {
                // Si existe, insertamos al final de sus movimientos
                usuarioBloque.movimientos.push(nuevoMovimiento);
            } else {
                // Si es su primera transacción histórica detectada, creamos su bloque según tu estructura exacta
                listaCompleta.push({
                    "usuario": {
                        "nombre": usuario.nombre,
                        "cuenta": usuario.cuenta
                    },
                    "movimientos": [nuevoMovimiento]
                });
            }

            // Guardamos la estructura del JSON consolidado de vuelta en la memoria local
            localStorage.setItem('historicoMovimientos', JSON.stringify(listaCompleta));

            alert(`¡Operación exitosa! Se ha registrado tu ${tipoOperacion === 'Deposito' ? 'depósito' : 'giro'} de $${numeroReal.toLocaleString('es-CL')}.`);
            
            // Limpiar formulario
            $('#txtCantidad').val('').data('valor-numerico', null);
        });
    }
}

// Página de Transacciones (transacciones/sendmoney.html)

if ($('body').data('page') === 'transacciones') {
    // Verificar sesión activa
    var datosGuardados = localStorage.getItem('usuarioSesion');
    
    if (!datosGuardados) {
        window.location.href = '../login.html';
    } else {
        var usuario = JSON.parse(datosGuardados);
        
        // Encabezado User
        $('#lblNombreTransac').text(usuario.nombre);
        $('#lblCuentaTransac').text(usuario.cuenta);
        $('#lblSaldoTransac').text(usuario.saldo.toLocaleString('es-CL'));

        // Movimientos registrados localStorage
        var historialGlobal = localStorage.getItem('historicoMovimientos');
        var tablaHTML = "";

        if (historialGlobal) {
            var listaCompleta = JSON.parse(historialGlobal);
            
            // Filtrar por usuario actual
            var bloqueUsuario = listaCompleta.find(item => item.usuario.cuenta === usuario.cuenta);

            // Historial usuario
            if (bloqueUsuario && bloqueUsuario.movimientos.length > 0) {
                
                // Movimientos ordenados desde el más reciente
                var movimientosInvertidos = [...bloqueUsuario.movimientos].reverse();
                
                movimientosInvertidos.forEach(mov => {
                    // Definimos un color de Bootstrap según el tipo de movimiento para que sea visualmente atractivo
                    var badgeClase = "bg-secondary";
                    var textoMontoClase = "text-dark";
                    var signo = "";

                    if (mov.Tipo === "Deposito") {
                        badgeClase = "bg-success text-white";
                        textoMontoClase = "text-success fw-bold";
                        signo = "+";
                    } else if (mov.Tipo === "Giro" || mov.Tipo === "Envío") {
                        badgeClase = "bg-danger text-white";
                        textoMontoClase = "text-danger fw-bold";
                        signo = "-";
                    }

                    // Construimos la fila de la tabla de forma dinámica
                    tablaHTML += `
                        <tr>
                            <td>${mov.Fecha}</td>
                            <td><span class="badge ${badgeClase}">${mov.Tipo.toUpperCase()}</span></td>
                            <td>${mov.Detalle}</td>
                            <td class="text-muted"><em>${mov.Mensaje}</em></td>
                            <td class="text-end ${textoMontoClase}">${signo} $${mov.Monto.toLocaleString('es-CL')}</td>
                        </tr>
                    `;
                });

                // Inyectamos las filas construidas reemplazando el mensaje por default
                $('#tablaMovimientosBody').html(tablaHTML);
            }
        }
    }
}
// ==========================================================================
// 6. LÓGICA PARA LA PÁGINA DE TRANSFERENCIAS (transacciones/sendmoney.html)
// ==========================================================================
if ($('body').data('page') === 'transacciones') {
    var datosGuardados = localStorage.getItem('usuarioSesion');
    
    if (!datosGuardados) {
        window.location.href = '../login.html';
    } else {
        var usuario = JSON.parse(datosGuardados);
        
        // Cargar datos en el panel informativo
        $('#lblNombreTrans').text(usuario.nombre);
        $('#lblCuentaTrans').text(usuario.cuenta);
        $('#lblSaldoTrans').text(usuario.saldo.toLocaleString('es-CL'));

        // Instancia del modal de Bootstrap
        var modalContactoBS = new bootstrap.Modal(document.getElementById('modalContacto'));

        // Función reutilizable para renderizar la lista de contactos filtrados
        function cargarContactos() {
            var contactosAlmacenados = localStorage.getItem('listaContactos');
            
            if (contactosAlmacenados) {
                procesarListaContactos(JSON.parse(contactosAlmacenados));
            } else {
                // Primera carga: Leemos desde el archivo físico data/contactos.json
                fetch('../data/contactos.json')
                    .then(res => res.json())
                    .then(contactos => {
                        localStorage.setItem('listaContactos', JSON.stringify(contactos));
                        procesarListaContactos(contactos);
                    })
                    .catch(err => {
                        console.error("Error al leer contactos.json", err);
                        $('#contactosContainer').html('<p class="text-danger text-center">Error en la agenda.</p>');
                    });
            }
        }

        function procesarListaContactos(contactos) {
            // REQUERIMIENTO: Filtrar la lista según la cuenta del usuario conectado (cuentauser)
            var filtrados = contactos.filter(c => c.cuentauser === usuario.cuenta);
            var listadoHTML = "";

            if (filtrados.length === 0) {
                $('#contactosContainer').html('<p class="text-muted text-center py-3">No registras contactos asignados a tu cuenta.</p>');
                return;
            }

            filtrados.forEach((c, idx) => {
                listadoHTML += `
                    <label class="list-group-item d-flex align-items-center p-3 border-dark mb-2 rounded" style="cursor: pointer;">
                        <div class="me-3">
                            <input class="form-check-input chk-contacto border-dark" type="checkbox" 
                                   value="${c.cuenta}" 
                                   data-nombre="${c.nombre}" 
                                   style="width: 22px; height: 22px;">
                        </div>
                        <div class="flex-grow-1">
                            <h6 class="fw-bold mb-0">${c.nombre}</h6>
                            <small class="text-muted">Cuenta: ${c.cuenta} | Banco: ${c.banco}</small>
                        </div>
                    </label>
                `;
            });
            $('#contactosContainer').html(listadoHTML);

            // REQUERIMIENTO: Selección única (un solo checkbox activo)
            $('.chk-contacto').on('change', function() {
                if ($(this).is(':checked')) {
                    $('.chk-contacto').not(this).prop('checked', false);
                }
            });
        }

        // Ejecutar carga inicial
        cargarContactos();

        // Controladores de eventos de la cantidad
        $('#txtMontoTrans').on('blur', function() {
            var valorLimpio = $(this).val().replace(/\D/g, "");
            if (valorLimpio !== "") {
                var numero = parseInt(valorLimpio, 10);
                $(this).data('valor-numerico', numero);
                $(this).val(numero.toLocaleString('es-CL'));
            }
        });

        $('#txtMontoTrans').on('focus', function() {
            var numeroReal = $(this).data('valor-numerico');
            if (numeroReal) $(this).val(numeroReal);
        });

        // REQUERIMIENTO: Guardar un nuevo contacto en el listado JSON (localStorage)
        $('#btnAbrirModal').on('click', function() {
            modalContactoBS.show();
        });

        $('#formNuevoContacto').on('submit', function(e) {
            e.preventDefault();

            var nuevoC = {
                "nombre": $('#addNombre').val().trim(),
                "correo": $('#addCorreo').val().trim(),
                "cuenta": $('#addCuenta').val().trim(),
                "banco": $('#addBanco').val().trim(),
                "cuentauser": usuario.cuenta // Se vincula automáticamente al usuario actual
            };

            var contactosTotales = JSON.parse(localStorage.getItem('listaContactos')) || [];
            contactosTotales.push(nuevoC);
            localStorage.setItem('listaContactos', JSON.stringify(contactosTotales));

            alert("Contacto guardado de manera exitosa.");
            $('#formNuevoContacto')[0].reset();
            modalContactoBS.hide();
            
            // Volver a renderizar la lista para ver el cambio de inmediato
            cargarContactos();
        });

        // REQUERIMIENTO: Confirmar Envío / Transacción
        $('#transferForm').on('submit', function(e) {
            e.preventDefault();

            var montoReal = $('#txtMontoTrans').data('valor-numerico');
            var mensajeReal = $('#txtMensajeTrans').val().trim();
            var chkActivo = $('.chk-contacto:checked');

            if (!montoReal || montoReal <= 0) {
                alert("Por favor, ingresa un monto válido.");
                return;
            }
            if (mensajeReal === "") {
                alert("El campo Mensaje no puede estar vacío.");
                return;
            }
            if (chkActivo.length === 0) {
                alert("Debes seleccionar un destinatario de la lista.");
                return;
            }

            if (montoReal > usuario.saldo) {
                alert("Saldo insuficiente para completar la transacción.");
                return;
            }

            var destinoNombre = chkActivo.data('nombre');

            // 1. Descontar saldo en usuarios.json (localStorage)
            usuario.saldo -= montoReal;
            $('#lblSaldoTrans').text(usuario.saldo.toLocaleString('es-CL'));
            localStorage.setItem('usuarioSesion', JSON.stringify(usuario));

            // 2. Registrar en movimientos.json (localStorage) con la estructura solicitada
            var hoy = new Date();
            var fechaF = `${String(hoy.getDate()).padStart(2,'0')}-${String(hoy.getMonth()+1).padStart(2,'0')}-${hoy.getFullYear()}`;

            var nuevaTransaccion = {
                "Fecha": fechaF,
                "Tipo": "Transacción", // Estricto solicitado
                "Detalle": `Transacción a ${destinoNombre}`, // Estricto solicitado
                "Mensaje": mensajeReal, // Mensaje del formulario
                "Monto": montoReal
            };

            var historicoMovs = JSON.parse(localStorage.getItem('historicoMovimientos')) || [];
            var bloqueUsuario = historicoMovs.find(item => item.usuario.cuenta === usuario.cuenta);

            if (bloqueUsuario) {
                bloqueUsuario.movimientos.push(nuevaTransaccion);
            } else {
                historicoMovs.push({
                    "usuario": { "nombre": usuario.nombre, "cuenta": usuario.cuenta },
                    "movimientos": [nuevaTransaccion]
                });
            }

            localStorage.setItem('historicoMovimientos', JSON.stringify(historicoMovs));

            alert(`¡Transacción completada!\nSe enviaron $${montoReal.toLocaleString('es-CL')} a ${destinoNombre}.`);
            
            // Limpiar campos del formulario
            $('#txtMontoTrans').val('').data('valor-numerico', null);
            $('#txtMensajeTrans').val('');
            $('.chk-contacto').prop('checked', false);
        });
    }
}
