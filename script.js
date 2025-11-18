/*
 * Script de "Café Aroma"
 *
 * Funcionalidades:
 * 1. Manejo del carrito (Añadir, Guardar en localStorage).
 * 2. Gestión del carrito en la página 'carrito.html' (Sumar, Restar, Eliminar).
 * 3. Conexión con mi Backend PHP para procesar el pedido (api_carrito.php).
 * 4. Conexión con mi Backend PHP para el formulario de contacto (procesar_contacto.php).
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. MIS VARIABLES (Selecciono todos los elementos del HTML) ---
    
    const botonesAnadir = document.querySelectorAll('.add-to-cart');
    const listaCarritoUI = document.getElementById('lista-carrito');
    const totalCarritoUI = document.getElementById('total-precio');
    const vaciarCarritoBtn = document.getElementById('vaciar-carrito');
    const procesarPedidoBtn = document.getElementById('procesar-pedido');
    const formularioContacto = document.getElementById('contact-form');
    const mensajeEnvio = document.getElementById('mensaje-envio');

    // --- 2. ESTADO DEL CARRITO ---
    
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    // --- 3. FUNCIONES DEL CARRITO ---

    /**
     * Esta es la función para añadir productos desde el menú.
     * Ahora uso un SWITCH para coger el precio del sitio correcto.
     */
    function anadirProducto(evento) {
        const boton = evento.target;
        const productoDiv = boton.closest('.producto');
        const nombreBase = boton.getAttribute('data-nombre');
        
        let nombreProducto;
        let precioProducto;

        // --- ESTA ES LA LÓGICA  ---
        switch(nombreBase) {
            case 'Espresso':
            case 'Capuchino':
            case 'Café Latte':
                // Coge el precio del RADIO (Pequeño/Grande)
                const opcionSeleccionada = productoDiv.querySelector('input[name*="size"]:checked'); 
                if (opcionSeleccionada) {
                    precioProducto = parseFloat(opcionSeleccionada.dataset.precio);
                    nombreProducto = `${nombreBase} (${opcionSeleccionada.value})`;
                }
                break;
            
            case 'Té e Infusiones':
                // Coge el precio del SELECT (Té Verde, etc.)
                const selectTe = productoDiv.querySelector('#te-select');
                const opcionTe = selectTe.options[selectTe.selectedIndex];
                precioProducto = parseFloat(opcionTe.dataset.precio);
                nombreProducto = `${nombreBase} (${opcionTe.value})`;
                break;
            
            case 'Café de Origen':
                // Coge el precio del SELECT (Colombia, etc.)
                const selectNacionalidad = productoDiv.querySelector('.nacionalidad-select');
                const opcionNacionalidad = selectNacionalidad.options[selectNacionalidad.selectedIndex];
                precioProducto = parseFloat(opcionNacionalidad.dataset.precio); // Precio del select
                
                // Coge la opción del RADIO (Molido/Grano)
                const formatoSeleccionado = productoDiv.querySelector('input[name="grano-formato"]:checked');
                const formato = formatoSeleccionado ? formatoSeleccionado.value : 'En Grano';
                
                nombreProducto = `${nombreBase} (${opcionNacionalidad.value}, ${formato})`;
                break;
            
            case 'Tarta de Chocolate':
                // Coge el precio del botón
                precioProducto = parseFloat(boton.dataset.precio);
                nombreProducto = nombreBase;
                break;
            
            default:
                // Si no lo reconoce, no hace nada
                console.error("Producto desconocido:", nombreBase);
                return;
        }
        // --- FIN DE LA LÓGICA ---

        // Verifico que he conseguido un precio y un nombre
        if (!precioProducto || !nombreProducto) {
             alert("Hubo un error al seleccionar el producto. Inténtalo de nuevo.");
             console.error("Error al obtener precio o nombre:", nombreBase, precioProducto, nombreProducto);
             return;
        }

        // --- Lógica para sumar cantidad ---
        const existe = carrito.find(item => item.nombre === nombreProducto);
        
        if (existe) {
            // Si ya existe, solo suma a la cantidad
            existe.cantidad++;
        } else {
            // Si es nuevo, crea el objeto y lo mete en el array con cantidad 1
            const productoEnCarrito = {
                nombre: nombreProducto,
                precio: precioProducto,
                cantidad: 1
            };
            carrito.push(productoEnCarrito);
        }

        alert(`Has añadido "${nombreProducto}" al carrito.`);
        guardarEnLocalStorage(); 
    }

    /**
     * Esta función "dibuja" la lista del carrito en 'carrito.html'.
     */
    function actualizarCarrito() {
        if (listaCarritoUI) {
            listaCarritoUI.innerHTML = '';
        }
        
        let total = 0;

        carrito.forEach(producto => {
            if (listaCarritoUI) {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span class="nombre-producto">${producto.nombre}</span>
                    <div class="controles-cantidad">
                        <button class="btn-restar" data-nombre="${producto.nombre}">-</button>
                        <span class="cantidad-item">${producto.cantidad}</span>
                        <button class="btn-sumar" data-nombre="${producto.nombre}">+</button>
                    </div>
                    <span class="total-producto">Total: ${(producto.cantidad * producto.precio).toFixed(2)} €</span>
                    <button class="eliminar-item" data-nombre="${producto.nombre}">Eliminar</button>
                `;
                listaCarritoUI.appendChild(li);
            }
            // Aquí 'producto.precio' 
            total += producto.cantidad * producto.precio;
        });

        if (totalCarritoUI) {
            totalCarritoUI.textContent = total.toFixed(2);
        }

        guardarEnLocalStorage();
    }

    /**
     * Esta es la función que controla los botones '+', '-' y 'Eliminar'
     */
    function gestionarCarrito(evento) {
        const nombreProducto = evento.target.getAttribute('data-nombre');
        if (!nombreProducto) return;

        const producto = carrito.find(item => item.nombre === nombreProducto);
        if (!producto) return;

        if (evento.target.classList.contains('btn-sumar')) {
            producto.cantidad++;
        }

        if (evento.target.classList.contains('btn-restar')) {
            producto.cantidad--;
            if (producto.cantidad === 0) {
                carrito = carrito.filter(item => item.nombre !== nombreProducto);
            }
        }

        if (evento.target.classList.contains('eliminar-item')) {
            carrito = carrito.filter(item => item.nombre !== nombreProducto);
        }

        actualizarCarrito();
    }

    /**
     * Función para el botón "Vaciar Carrito"
     */
    function vaciarCarrito() {
        if (confirm("¿Estás seguro de que quieres vaciar el carrito?")) {
            carrito = [];
            actualizarCarrito();
        }
    }

    /**
     * Esta es mi función de guardado en localStorage.
     */
    function guardarEnLocalStorage() {
        localStorage.setItem('carrito', JSON.stringify(carrito));
    }
    
    // --- 4. FUNCIONES DE CONEXIÓN CON PHP (BACKEND) ---

    /**
     * Esta función se conecta con 'api_carrito.php'.
     */
    async function procesarPedido() {
        if (carrito.length === 0) {
            alert("Tu carrito está vacío.");
            return;
        }

        try {
            const respuesta = await fetch('api_carrito.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(carrito)
            });
            
            const resultado = await respuesta.json();

            if (resultado.success) {
                alert("¡Pedido procesado con éxito! Revisa tu correo.");
                carrito = [];
                actualizarCarrito();
            } else {
                alert("Hubo un error al procesar tu pedido: " + resultado.message);
            }
        } catch (error) {
            console.error("Error al conectar con el servidor:", error);
            alert("No se pudo conectar con el servidor. Por favor, inténtalo más tarde.");
        }
    }

    /**
     * Esta función se conecta con 'procesar_contacto.php'.
     */
    async function enviarFormularioContacto(evento) {
        evento.preventDefault(); 
        const formData = new FormData(formularioContacto);

        try {
            const respuesta = await fetch('procesar_contacto.php', {
                method: 'POST',
                body: formData
            });
            
            const resultado = await respuesta.json();

            if (resultado.success) {
                mensajeEnvio.textContent = '¡Gracias! Tu mensaje ha sido enviado.';
                mensajeEnvio.style.color = 'green';
                formularioContacto.reset();
            } else {
                mensajeEnvio.textContent = 'Error: ' + resultado.message;
                mensajeEnvio.style.color = 'red';
            }
        } catch (error) {
            console.error("Error al conectar con el servidor:", error);
            mensajeEnvio.textContent = 'No se pudo conectar con el servidor.';
            mensajeEnvio.style.color = 'red';
        }
    }


    // --- 5. ASIGNACIÓN DE EVENTOS (Poner todo en marcha) ---

    // 1. Para 'menu.html':
    botonesAnadir.forEach(boton => {
        boton.addEventListener('click', anadirProducto);
    });

    // 2. Para 'carrito.html':
    if (listaCarritoUI) {
        listaCarritoUI.addEventListener('click', gestionarCarrito);
    }
    
    // 3. Para 'carrito.html':
    if (vaciarCarritoBtn) {
        vaciarCarritoBtn.addEventListener('click', vaciarCarrito);
    }
    
    // 4. Para 'carrito.html':
    if (procesarPedidoBtn) {
        procesarPedidoBtn.addEventListener('click', procesarPedido);
    }

    // 5. Para 'contacto.html':
    if (formularioContacto) {
        formularioContacto.addEventListener('submit', enviarFormularioContacto);
    }

    // 6. Carga inicial
    actualizarCarrito();

}); // Fin del 'DOMContentLoaded'