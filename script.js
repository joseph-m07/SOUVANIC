
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("logingForm") || document.getElementById("loginForm");
    const alerta = document.getElementById("loginAlerta");
    const alertaTexto = document.getElementById("loginAlertaTexto");
    const btnSubmit = document.getElementById("btnLoginSubmit") || formulario?.querySelector("button[type='submit']");
    const inputPassword = document.getElementById("contraseña");
    const togglePasswordBtn = document.getElementById("togglePassword");
    const togglePasswordIcon = document.getElementById("togglePasswordIcon");

    function mostrarAlerta(mensaje) {
        if (alerta && alertaTexto) {
            alertaTexto.textContent = mensaje;
            alerta.hidden = false;
        } else {
            alert(mensaje);
        }
    }

    function ocultarAlerta() {
        if (alerta) {
            alerta.hidden = true;
        }
    }

    // Alternar visibilidad de la contraseña
    if (togglePasswordBtn && inputPassword) {
        togglePasswordBtn.addEventListener("click", () => {
            const esPassword = inputPassword.type === "password";
            inputPassword.type = esPassword ? "text" : "password";

            if (togglePasswordIcon) {
                togglePasswordIcon.className = esPassword ? "bi bi-eye-slash" : "bi bi-eye";
            }
        });
    }

    if (!formulario) return;

    formulario.addEventListener("submit", async function(event) {
        event.preventDefault();
        ocultarAlerta();

        const usuario = document.getElementById("usuario").value.trim();
        const contraseña = document.getElementById("contraseña").value;

        if (!usuario || !contraseña) {
            mostrarAlerta("Debe completar todos los campos.");
            return;
        }

        // Estado visual de carga
        const textoOriginalBtn = btnSubmit ? btnSubmit.innerHTML : "";
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `<span>Iniciando sesión...</span> <i class="bi bi-arrow-repeat spin"></i>`;
        }

        try {
            const respuesta = await fetch("http://localhost:3000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    usuario,
                    contraseña
                })
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                mostrarAlerta(datos.mensaje || "No se pudo iniciar sesión");
                return;
            }

            // Guardamos datos de sesión
            sessionStorage.setItem("token", datos.token);
            sessionStorage.setItem("usuario", JSON.stringify(datos.usuario));

            window.location.href = "dashboard.html";

        } catch (error) {
            console.error("Error de conexión:", error);
            mostrarAlerta("No se pudo conectar con el servidor. Verificá que el backend esté ejecutándose.");
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = textoOriginalBtn;
            }
        }
    });
});

