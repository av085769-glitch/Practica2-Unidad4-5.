// ============================================
// SMARTORDERFOOD - LÓGICA GENERAL Y API REST
// ============================================

const API_BASE = "http://localhost:8080/api";
const API_PLATILLOS = `${API_BASE}/platillos`;
const API_USUARIOS = `${API_BASE}/usuarios`;
const API_RESERVACIONES = `${API_BASE}/reservaciones`;
const API_SUSCRIPCIONES = `${API_BASE}/suscripciones`;
const API_CALIFICACIONES = `${API_BASE}/calificaciones`;

let menuCacheCliente = [];
let categoriaActivaCliente = "Todos";
let textoBusquedaCliente = "";

// ============================================
// CALIFICACIONES DE EXPERIENCIA (CONECTADO A MYSQL)
// ============================================

async function enviarCalificacion(event) {
    event.preventDefault();

    const puntuacion = parseInt(
        document.getElementById("puntuacion")?.value ||
        document.getElementById("puntuacionGeneral")?.value ||
        document.querySelector('input[type="range"]')?.value ||
        "3",
        10
    );

    const seleccionados = Array.from(
        document.querySelectorAll('form input[type="checkbox"]:checked, input[name="gusto"]:checked')
    ).map(el => el.value || el.nextElementSibling?.textContent?.trim() || "");

    const aspectosDestacados = seleccionados.filter(Boolean).join(", ");

    const comentarios = (
        document.getElementById("comentariosCalificacion")?.value ||
        document.querySelector('form textarea')?.value ||
        ""
    ).trim();

    try {
        const response = await fetch(API_CALIFICACIONES, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                puntuacion,
                aspectosDestacados,
                comentarios
            })
        });

        if (!response.ok) {
            alert("No se pudo guardar tu calificación en la base de datos. Código: " + response.status);
            return;
        }

        const guardada = await response.json().catch(() => ({}));

        const mensaje = document.getElementById("mensajeCalificacion");
        if (mensaje) {
            mensaje.innerHTML = `
                <div class="alert alert-success border-0 shadow-sm rounded-4 text-center p-3 mt-3">
                    <i class="bi bi-check-circle-fill fs-3 text-success mb-2"></i>
                    <h5 class="fw-bold mb-1">¡Gracias por calificar tu experiencia!</h5>
                    <p class="small mb-0">ID guardado en BD: <strong>${guardada.id ?? "NO DEVUELTO"}</strong> | Puntuación: <strong>${guardada.puntuacion ?? puntuacion}</strong></p>
                </div>
            `;
        } else {
            alert("¡Gracias por calificar tu experiencia! ID: " + (guardada.id ?? "NO DEVUELTO"));
        }

        event.target.reset();
        const badgePuntuacion = document.getElementById("valorPuntuacion");
        if (badgePuntuacion) {
            badgePuntuacion.textContent = "★ 3 / 5";
        }
    } catch (error) {
        console.error("Error al enviar calificación:", error);
        alert("No se pudo conectar con el servidor Spring Boot.");
    }
}

async function cargarCalificacionesAdmin() {
    const contenedor = document.getElementById("adminListaCalificaciones");
    const contador = document.getElementById("contadorCalificaciones");
    if (!contenedor) return;

    try {
        const response = await fetch(API_CALIFICACIONES);
        if (!response.ok) throw new Error("Error al consultar calificaciones");
        const calificaciones = await response.json();

        if (contador) {
            contador.textContent = `${calificaciones.length} ${calificaciones.length === 1 ? "opinión" : "opiniones"}`;
        }

        if (calificaciones.length === 0) {
            contenedor.innerHTML = `<p class="text-muted small m-0">No hay calificaciones registradas en la base de datos.</p>`;
            return;
        }

        contenedor.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Puntuación</th>
                            <th>Aspectos destacados</th>
                            <th>Comentarios</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${calificaciones.map(cal => `
                            <tr>
                                <td><span class="badge bg-warning text-dark fw-bold">★ ${cal.puntuacion ?? "-"}/5</span></td>
                                <td>${cal.aspectosDestacados || "-"}</td>
                                <td>${cal.comentarios || "<span class='text-muted'>Sin comentarios</span>"}</td>
                                <td>
                                    <button onclick="eliminarCalificacionAdmin(${cal.id})" class="btn btn-sm btn-outline-danger rounded-pill" title="Eliminar calificación">
                                        <i class="bi bi-trash-fill"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error("Error cargando calificaciones:", error);
        contenedor.innerHTML = `<p class="text-danger small m-0">Error al cargar calificaciones desde la API.</p>`;
    }
}

async function eliminarCalificacionAdmin(idCalificacion) {
    if (!confirm("¿Deseas eliminar esta calificación de la base de datos?")) return;

    try {
        const response = await fetch(`${API_CALIFICACIONES}/${idCalificacion}`, {
            method: "DELETE"
        });

        if (!response.ok && response.status !== 204) {
            alert("No se pudo eliminar la calificación.");
            return;
        }

        await cargarCalificacionesAdmin();
    } catch (error) {
        console.error("Error eliminando calificación:", error);
        alert("Error de conexión con Spring Boot.");
    }
}

// ============================================
// SUSCRIPCIONES / CLUB VIP (CONECTADO A MYSQL)
// ============================================

async function registrarSuscripcion(event) {
    event.preventDefault();

    const nombre = document.getElementById("nombreSuscriptor").value.trim();
    const correo = document.getElementById("correoSuscriptor").value.trim().toLowerCase();
    const frecuencia = document.getElementById("frecuenciaSuscriptor").value;
    const favorito = document.querySelector('input[name="favorito"]:checked')?.value || "";

    try {
        const response = await fetch(API_SUSCRIPCIONES, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, correo, frecuencia, favorito })
        });

        if (!response.ok) {
            alert("No se pudo registrar tu suscripción en la base de datos.");
            return;
        }

        document.getElementById("mensajeSuscripcion").innerHTML = `
            <div class="alert alert-success border-0 shadow-sm rounded-4 text-center p-3">
                <i class="bi bi-check-circle-fill fs-3 text-success mb-2"></i>
                <h5 class="fw-bold mb-1">¡Bienvenido al Club VIP!</h5>
                <p class="small mb-0">Tu suscripción quedó guardada en SmartOrderFood.</p>
            </div>
        `;
        event.target.reset();
    } catch (error) {
        console.error("Error al guardar suscripción:", error);
        alert("No se pudo conectar con el servidor Spring Boot.");
    }
}

async function cargarSuscripcionesAdmin() {
    const contenedor = document.getElementById("adminListaSuscripciones");
    const contador = document.getElementById("contadorSuscripciones");
    if (!contenedor) return;

    try {
        const response = await fetch(API_SUSCRIPCIONES);
        if (!response.ok) throw new Error("Error al consultar suscripciones");
        const suscripciones = await response.json();

        if (contador) {
            contador.textContent = `${suscripciones.length} ${suscripciones.length === 1 ? "suscriptor" : "suscriptores"}`;
        }

        if (suscripciones.length === 0) {
            contenedor.innerHTML = `<p class="text-muted small m-0">No hay suscripciones registradas en la base de datos.</p>`;
            return;
        }

        contenedor.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Suscriptor</th>
                            <th>Frecuencia</th>
                            <th>Favorito</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${suscripciones.map(sub => `
                            <tr>
                                <td>
                                    <strong>${sub.nombre || "Sin nombre"}</strong><br>
                                    <small class="text-muted">${sub.correo || ""}</small>
                                </td>
                                <td><span class="badge bg-light text-dark border">${sub.frecuencia || "-"}</span></td>
                                <td><span class="badge bg-light text-dark border">${sub.favorito || "-"}</span></td>
                                <td>
                                    <button onclick="eliminarSuscripcionAdmin(${sub.id})" class="btn btn-sm btn-outline-danger rounded-pill" title="Eliminar suscripción">
                                        <i class="bi bi-trash-fill"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error("Error cargando suscripciones:", error);
        contenedor.innerHTML = `<p class="text-danger small m-0">Error al cargar suscripciones desde la API.</p>`;
    }
}

async function eliminarSuscripcionAdmin(idSuscripcion) {
    if (!confirm("¿Deseas eliminar esta suscripción del Club VIP de la base de datos?")) return;

    try {
        const response = await fetch(`${API_SUSCRIPCIONES}/${idSuscripcion}`, {
            method: "DELETE"
        });

        if (!response.ok && response.status !== 204) {
            alert("No se pudo eliminar la suscripción.");
            return;
        }

        await cargarSuscripcionesAdmin();
    } catch (error) {
        console.error("Error eliminando suscripción:", error);
        alert("Error de conexión con Spring Boot.");
    }
}

// ============================================
// REGISTRO, LOGIN Y SESIÓN (CONECTADO A MYSQL)
// ============================================

async function registrarUsuario(event) {
    event.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const telefono = document.getElementById("telefono").value.trim();
    const fechaNacimiento = document.getElementById("fecha").value;
    const tipoCliente = document.getElementById("tipoCliente")?.value || "";
    const modalidad = document.querySelector('input[name="modalidad"]:checked')?.value || "";

    try {
        const response = await fetch(`${API_USUARIOS}/registro`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nombre,
                correo,
                password,
                telefono,
                fechaNacimiento,
                tipoCliente,
                modalidad
            })
        });

        const data = await response.json().catch(() => ({}));

        if (response.status === 409) {
            document.getElementById("mensajeRegistro").innerHTML = `
                <div class="alert alert-warning">
                    <strong>${data.message || "Este correo ya está registrado."}</strong><br>
                    Puedes iniciar sesión con tu cuenta.<br><br>
                    <a href="login.html" class="btn btn-warning">Iniciar sesión</a>
                </div>
            `;
            return;
        }

        if (!response.ok) {
            alert(data.message || "No se pudo completar el registro.");
            return;
        }

        document.getElementById("mensajeRegistro").innerHTML = `
            <div class="alert alert-success border-0 shadow-sm rounded-4 text-center p-3">
                <i class="bi bi-check-circle-fill fs-3 text-success mb-2"></i>
                <h5 class="fw-bold mb-1">¡Registro exitoso!</h5>
                <p class="small mb-3">Tu cuenta se guardó en la base de datos. Ya puedes iniciar sesión.</p>
                <a href="login.html" class="btn btn-primary text-white fw-bold px-4 rounded-pill">
                    Iniciar sesión ahora <i class="bi bi-arrow-right ms-1"></i>
                </a>
            </div>
        `;
        event.target.reset();
    } catch (error) {
        console.error("Error al registrar usuario:", error);
        alert("No se pudo conectar con el servidor Spring Boot.");
    }
}

async function iniciarSesion(event) {
    event.preventDefault();

    const correo = document.getElementById("correoLogin").value.trim().toLowerCase();
    const password = document.getElementById("passwordLogin").value;

    if (correo === "admin@smartorderfood.com" && password === "admin123") {
        localStorage.setItem("sesionActiva", "true");
        localStorage.setItem("usuarioActivo", correo);
        localStorage.setItem("esAdmin", "true");
        alert("¡Bienvenido, Administrador!");
        window.location.href = "admin.html";
        return;
    }

    try {
        const response = await fetch(`${API_USUARIOS}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo, password })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            document.getElementById("mensajeLogin").innerHTML = `
                <div class="alert alert-danger">
                    <strong>${data.message || "Datos incorrectos."}</strong><br>
                    Verifica tus credenciales o regístrate.<br><br>
                    <a href="registro.html" class="btn btn-danger">Registrarme</a>
                </div>
            `;
            return;
        }

        localStorage.setItem("sesionActiva", "true");
        localStorage.setItem("usuarioActivo", data.correo);
        localStorage.setItem("usuarioActual", JSON.stringify(data));
        localStorage.removeItem("esAdmin");
        window.location.href = "index.html";
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        alert("No se pudo conectar con el servidor Spring Boot.");
    }
}

function tieneSesion() {
    return localStorage.getItem("sesionActiva") === "true";
}

function protegerPagina() {
    if (!tieneSesion()) {
        alert("Debes iniciar sesión para acceder a esta sección.");
        window.location.href = "login.html";
    }
}

function requiereSesion(pagina) {
    if (!tieneSesion()) {
        alert("Debes iniciar sesión para realizar esta acción.");
        window.location.href = "login.html";
        return;
    }
    window.location.href = pagina;
}

function cerrarSesion() {
    localStorage.removeItem("sesionActiva");
    localStorage.removeItem("usuarioActivo");
    localStorage.removeItem("usuarioActual");
    localStorage.removeItem("esAdmin");
    alert("Sesión cerrada correctamente.");
    window.location.href = "index.html";
}

async function cargarPerfil() {
    const activoCorreo = localStorage.getItem("usuarioActivo");
    if (!activoCorreo) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(API_USUARIOS);
        if (!response.ok) throw new Error("Error consultando usuarios");
        const usuarios = await response.json();
        const usuario = usuarios.find(u => (u.correo || "").toLowerCase() === activoCorreo.toLowerCase());

        if (!usuario) {
            window.location.href = "login.html";
            return;
        }

        document.getElementById("perfilNombre").value = usuario.nombre || "";
        document.getElementById("perfilCorreo").value = usuario.correo || "";
        document.getElementById("perfilTelefono").value = usuario.telefono || "";
    } catch (error) {
        console.error("Error cargando perfil:", error);
    }
}

// ============================================
// CRUD PLATILLOS CONECTADO A SPRING BOOT
// ============================================

async function obtenerMenu() {
    try {
        const response = await fetch(API_PLATILLOS);
        if (!response.ok) throw new Error("Error al obtener el menú desde la API");
        return await response.json();
    } catch (error) {
        console.error("No se pudo conectar con Spring Boot:", error);
        return [];
    }
}

async function registrarPlatilloAdmin(event) {
    event.preventDefault();

    const nombre = document.getElementById("adminNombrePlatillo").value.trim();
    const precio = parseFloat(document.getElementById("adminPrecioPlatillo").value);
    const categoria = document.getElementById("adminCategoriaPlatillo").value;
    const emoji = document.getElementById("adminEmojiPlatillo").value.trim() || "🍽️";

    try {
        const response = await fetch(API_PLATILLOS, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, precio, categoria, emoji })
        });

        if (!response.ok) {
            alert("Hubo un error al guardar el platillo en la base de datos.");
            return;
        }

        alert("¡Platillo guardado en la base de datos!");
        event.target.reset();
        await consultarMenuAdmin();
    } catch (error) {
        console.error("Error de conexión:", error);
        alert("No se pudo conectar con Spring Boot.");
    }
}

async function consultarMenuAdmin() {
    const contenedor = document.getElementById("adminListaMenu");
    if (!contenedor) return;

    const busqueda = (document.getElementById("buscarPlatilloInput")?.value || "").toLowerCase().trim();
    const categoria = document.getElementById("filtroCategoriaMenu")?.value || "Todas";
    const contador = document.getElementById("contadorMenu");

    const menu = await obtenerMenu();
    if (contador) contador.textContent = `${menu.length} platillos`;

    const filtrados = menu.filter(item => {
        const coincideTexto = (item.nombre || "").toLowerCase().includes(busqueda) ||
            (item.categoria || "").toLowerCase().includes(busqueda);
        const coincideCat = categoria === "Todas" || item.categoria === categoria;
        return coincideTexto && coincideCat;
    });

    if (filtrados.length === 0) {
        contenedor.innerHTML = `<p class="text-muted text-center small py-3">No se encontraron platillos.</p>`;
        return;
    }

    contenedor.innerHTML = filtrados.map(item => `
        <div class="d-flex align-items-center justify-content-between p-2 mb-2 border rounded-3 bg-white">
            <div class="d-flex align-items-center gap-2">
                <span class="fs-4">${item.emoji || "🍽️"}</span>
                <div>
                    <div class="fw-bold small">${item.nombre}</div>
                    <span class="badge bg-light text-dark border">${item.categoria}</span>
                    <span class="text-success fw-bold small ms-1">$${Number(item.precio).toFixed(2)}</span>
                </div>
            </div>
            <div class="d-flex gap-1">
                <button onclick='abrirModalEditarPlatillo(${JSON.stringify(item)})' class="btn btn-sm btn-outline-primary rounded-3" title="Modificar">
                    <i class="bi bi-pencil-fill"></i>
                </button>
                <button onclick="eliminarPlatilloAdmin(${item.id})" class="btn btn-sm btn-outline-danger rounded-3" title="Eliminar">
                    <i class="bi bi-trash-fill"></i>
                </button>
            </div>
        </div>
    `).join("");
}

function abrirModalEditarPlatillo(item) {
    document.getElementById("editPlatilloId").value = item.id;
    document.getElementById("editNombrePlatillo").value = item.nombre;
    document.getElementById("editPrecioPlatillo").value = item.precio;
    document.getElementById("editCategoriaPlatillo").value = item.categoria;
    document.getElementById("editEmojiPlatillo").value = item.emoji || "";
    new bootstrap.Modal(document.getElementById("modalEditarPlatillo")).show();
}

async function guardarEdicionPlatillo(event) {
    event.preventDefault();
    const id = document.getElementById("editPlatilloId").value;

    const platilloActualizado = {
        id: Number(id),
        nombre: document.getElementById("editNombrePlatillo").value.trim(),
        precio: parseFloat(document.getElementById("editPrecioPlatillo").value),
        categoria: document.getElementById("editCategoriaPlatillo").value,
        emoji: document.getElementById("editEmojiPlatillo").value.trim() || "🍽️"
    };

    try {
        const response = await fetch(`${API_PLATILLOS}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(platilloActualizado)
        });

        if (!response.ok) {
            alert("No se pudo actualizar el platillo.");
            return;
        }

        bootstrap.Modal.getInstance(document.getElementById("modalEditarPlatillo")).hide();
        await consultarMenuAdmin();
    } catch (error) {
        console.error("Error al actualizar:", error);
        alert("Error de conexión con Spring Boot.");
    }
}

async function eliminarPlatilloAdmin(idPlatillo) {
    if (!confirm("¿Deseas eliminar este platillo de la base de datos?")) return;

    try {
        const response = await fetch(`${API_PLATILLOS}/${idPlatillo}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            alert("No se pudo eliminar el platillo.");
            return;
        }

        await consultarMenuAdmin();
    } catch (error) {
        console.error("Error al eliminar:", error);
        alert("Error de conexión con Spring Boot.");
    }
}

// ============================================
// RESERVACIONES Y USUARIOS CONECTADOS A MYSQL
// ============================================

async function obtenerReservaciones() {
    try {
        const response = await fetch(API_RESERVACIONES);
        if (!response.ok) throw new Error("Error al consultar reservaciones");
        return await response.json();
    } catch (error) {
        console.error("Error obteniendo reservaciones:", error);
        return [];
    }
}

async function confirmarReservacion(event) {
    event.preventDefault();

    const nombre = document.getElementById("nombreReserva").value.trim();
    const correo = document.getElementById("correoReserva").value.trim();
    const fecha = document.getElementById("fechaReserva").value;
    const hora = document.getElementById("horaReserva").value;
    const personas = parseInt(document.getElementById("personasReserva").value, 10);
    const comentarios = document.getElementById("comentariosReserva").value.trim();

    try {
        const response = await fetch(API_RESERVACIONES, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nombre,
                correo,
                fecha,
                hora,
                personas,
                comentarios,
                estado: "Pendiente"
            })
        });

        if (!response.ok) {
            alert("No se pudo guardar la reservación en la base de datos.");
            return;
        }

        const mensaje = document.getElementById("mensajeReserva");
        if (mensaje) {
            mensaje.innerHTML = `
                <div class="alert alert-success text-center rounded-4">
                    <strong>¡Reservación enviada!</strong><br>
                    Tu solicitud fue registrada en la base de datos.
                </div>
            `;
        }
        event.target.reset();
    } catch (error) {
        console.error("Error al crear reservación:", error);
        alert("No se pudo conectar con Spring Boot.");
    }
}

async function cambiarEstadoReserva(idReserva, nuevoEstado) {
    try {
        const response = await fetch(`${API_RESERVACIONES}/${idReserva}/estado`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (!response.ok) {
            alert("No se pudo actualizar el estado de la reservación.");
            return;
        }

        await cargarPanelAdmin();
    } catch (error) {
        console.error("Error actualizando estado:", error);
    }
}

async function eliminarReservacionAdmin(idReserva) {
    if (!confirm("¿Estás seguro de eliminar esta reservación de la base de datos?")) return;

    try {
        const response = await fetch(`${API_RESERVACIONES}/${idReserva}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            alert("No se pudo eliminar la reservación.");
            return;
        }

        await cargarPanelAdmin();
    } catch (error) {
        console.error("Error eliminando reservación:", error);
    }
}

async function eliminarUsuario(idUsuario) {
    if (!confirm("¿Estás seguro de que deseas eliminar este usuario de la base de datos?")) return;

    try {
        const response = await fetch(`${API_USUARIOS}/${idUsuario}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            alert("No se pudo eliminar el usuario.");
            return;
        }

        alert("Usuario eliminado correctamente.");
        await cargarPanelAdmin();
    } catch (error) {
        console.error("Error eliminando usuario:", error);
    }
}

async function editarClienteAdmin(idUsuario, nombreActual, telefonoActual) {
    const nuevoNombre = prompt("Modificar nombre del cliente:", nombreActual || "");
    if (nuevoNombre === null) return;

    const nuevoTelefono = prompt("Modificar teléfono del cliente:", telefonoActual || "");
    if (nuevoTelefono === null) return;

    try {
        const response = await fetch(`${API_USUARIOS}/${idUsuario}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nombre: nuevoNombre.trim() || nombreActual,
                telefono: nuevoTelefono.trim() || telefonoActual
            })
        });

        if (!response.ok) {
            alert("No se pudo actualizar el usuario.");
            return;
        }

        alert("¡Datos del cliente actualizados en MySQL!");
        await cargarPanelAdmin();
    } catch (error) {
        console.error("Error editando usuario:", error);
    }
}

function restablecerSistemaAdmin() {
    localStorage.removeItem("usuario");
    localStorage.removeItem("listaReservaciones");
    cargarPanelAdmin();
}

async function cargarPanelAdmin() {
    await consultarMenuAdmin();
    await cargarSuscripcionesAdmin();
    await cargarCalificacionesAdmin();

    const contenedorUsuario = document.getElementById("adminListaUsuarios");
    if (contenedorUsuario) {
        try {
            const respUsuarios = await fetch(API_USUARIOS);
            const usuarios = respUsuarios.ok ? await respUsuarios.json() : [];

            if (usuarios.length > 0) {
                contenedorUsuario.innerHTML = `
                    <div class="table-responsive">
                        <table class="table table-hover align-middle">
                            <thead class="table-light">
                                <tr><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Acciones</th></tr>
                            </thead>
                            <tbody>
                                ${usuarios.map(usr => `
                                    <tr>
                                        <td class="fw-bold">${usr.nombre}</td>
                                        <td>${usr.correo}</td>
                                        <td>${usr.telefono || "-"}</td>
                                        <td>
                                            <button onclick='editarClienteAdmin(${usr.id}, ${JSON.stringify(usr.nombre || "")}, ${JSON.stringify(usr.telefono || "")})' class="btn btn-sm btn-outline-primary rounded-pill me-1">
                                                <i class="bi bi-pencil-square"></i>
                                            </button>
                                            <button onclick="eliminarUsuario(${usr.id})" class="btn btn-sm btn-outline-danger rounded-pill">
                                                <i class="bi bi-trash-fill"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                `;
            } else {
                contenedorUsuario.innerHTML = `<p class="text-muted small">No hay clientes registrados en la base de datos.</p>`;
            }
        } catch (error) {
            contenedorUsuario.innerHTML = `<p class="text-danger small">Error al cargar usuarios desde la API.</p>`;
        }
    }

    const contenedorReservas = document.getElementById("adminListaReservaciones");
    if (contenedorReservas) {
        const reservaciones = await obtenerReservaciones();

        if (reservaciones.length > 0) {
            contenedorReservas.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr><th>Cliente</th><th>Fecha/Hora</th><th>Personas</th><th>Estado</th><th>Acciones</th></tr>
                        </thead>
                        <tbody>
                            ${reservaciones.map(res => {
                const badgeColor = res.estado === 'Confirmada'
                    ? 'bg-success'
                    : (res.estado === 'Rechazada' ? 'bg-danger' : 'bg-warning text-dark');
                return `
                                    <tr>
                                        <td><strong>${res.nombre}</strong><br><small class="text-muted">${res.correo}</small></td>
                                        <td>${res.fecha} - ${res.hora} hrs</td>
                                        <td>${res.personas} pers.</td>
                                        <td><span class="badge ${badgeColor}">${res.estado}</span></td>
                                        <td>
                                            <button onclick="cambiarEstadoReserva(${res.id}, 'Confirmada')" class="btn btn-sm btn-success me-1"><i class="bi bi-check-lg"></i></button>
                                            <button onclick="cambiarEstadoReserva(${res.id}, 'Rechazada')" class="btn btn-sm btn-warning me-1"><i class="bi bi-x-lg"></i></button>
                                            <button onclick="eliminarReservacionAdmin(${res.id})" class="btn btn-sm btn-danger"><i class="bi bi-trash-fill"></i></button>
                                        </td>
                                    </tr>
                                `;
            }).join("")}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            contenedorReservas.innerHTML = `<p class="text-muted small">No hay reservaciones registradas en la base de datos.</p>`;
        }
    }
}

// ============================================
// VISTA CLIENTE: MENÚ DESDE BASE DE DATOS
// ============================================

function renderizarMenuCliente() {
    const contenedorMenu = document.getElementById("contenedorMenuCliente");
    if (!contenedorMenu) return;

    const filtrados = menuCacheCliente.filter(item => {
        const coincideCat = categoriaActivaCliente === "Todos" || item.categoria === categoriaActivaCliente;
        const coincideTexto = !textoBusquedaCliente ||
            (item.nombre || "").toLowerCase().includes(textoBusquedaCliente) ||
            (item.categoria || "").toLowerCase().includes(textoBusquedaCliente);
        return coincideCat && coincideTexto;
    });

    if (filtrados.length === 0) {
        contenedorMenu.innerHTML = `<p class="text-muted text-center w-100 py-4">No hay platillos disponibles para este filtro.</p>`;
        return;
    }

    contenedorMenu.innerHTML = filtrados.map(item => `
        <div class="col-md-4">
            <div class="product-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                    <div class="product-image-container text-center mb-4">
                        <span class="display-1">${item.emoji || "🍽️"}</span>
                        <span class="position-absolute top-0 end-0 m-3 badge bg-white text-dark shadow-sm fw-bold">
                            ★ 5.0
                        </span>
                    </div>
                    <h4 class="fw-bold text-dark mb-2">${item.nombre}</h4>
                    <p class="text-muted small mb-3">
                        Categoría: ${item.categoria}. Preparado al momento con ingredientes de calidad.
                    </p>
                </div>
                <div>
                    <div class="d-flex align-items-center justify-content-between mb-3">
                        <span class="text-muted small fw-bold">Precio</span>
                        <h3 class="fw-extrabold m-0" style="color: var(--primary-orange);">$${Number(item.precio).toFixed(2)}</h3>
                    </div>
                    <button onclick="requiereSesion('reservacion.html')" class="btn btn-primary-orange w-100 text-white">
                        <i class="bi bi-cart-plus me-1"></i> Agregar al pedido
                    </button>
                </div>
            </div>
        </div>
    `).join("");
}

async function cargarMenuCliente() {
    const contenedorMenu = document.getElementById("contenedorMenuCliente");
    if (!contenedorMenu) return;

    menuCacheCliente = await obtenerMenu();
    renderizarMenuCliente();
}

function filtrarCategoriaCliente(categoria, elemento) {
    categoriaActivaCliente = categoria;
    document.querySelectorAll(".category-pill").forEach(pill => pill.classList.remove("active"));
    if (elemento) elemento.classList.add("active");
    renderizarMenuCliente();
}