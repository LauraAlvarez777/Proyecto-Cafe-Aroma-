/*
 * Mi lógica de JavaScript (script.js) - Café Aroma
 *
 * Este es mi script principal para toda la interactividad.
 * Aquí es donde hago el cambio de LocalStorage a Fetch para conectarme
 * con mi backend en PHP.
 */

// Espero a que toda la página (DOM) esté cargada antes de ejecutar nada.
document.addEventListener('DOMContentLoaded', () => {

    // --- MI FUNCIÓN DE NOTIFICACIÓN (para toda la web) ---

    /**
     * Esta es una función que hice para mostrar un mensaje temporal.
     * La uso para avisar al usuario cuando añade un producto.
     * @param {string} mensaje - El texto que quiero mostrar.
     */
    function mostrarNotificacion(mensaje) {
        // Creo un nuevo div para el mensaje
        const notificacion = document.createElement('div');
        notificacion.classList.add('notificacion-toast'); // Le pongo la clase CSS que definí
        notificacion.textContent = mensaje;
        document.body.appendChild(notificacion);

        // La hago aparecer (esto es para la animación de CSS)
        setTimeout(() => {
            notificacion.classList.add('visible');
        }, 10);

        // Después de 3 segundos, la oculto y la borro del DOM.
        setTimeout(() => {
            notificacion.classList.remove('visible');
            setTimeout(() => {
                document.body.removeChild(notificacion);
            }, 500); // Doy 0.5s para que la animación de salida termine
        }, 3000);
    }

    // --- LÓGICA DE MI PÁGINA DE MENÚ (menu.html) ---

    // Primero compruebo si estoy en la página del menú
    // Lo sé porque busco la sección con la clase ".productos"
    const seccionProductos = document.querySelector('.productos');
    if (seccionProductos) {
        
        // Uso delegación de eventos. Pongo un solo 'listener' en el contenedor
        // padre de todos los productos. ¡Es más eficiente!
        seccionProductos.addEventListener('click', (e) => {
            // Solo me interesa si el clic fue en un botón de "Añadir al carrito"
            if (e.target.classList.contains('add-to-cart')) {
                // Si fue así, llamo a mi función para manejarlo
                manejarAnadirAlCarrito(e.target);
            }
        });

        /**
         * Esta es mi función para recoger los datos del producto del HTML.
         * Es la parte más complicada porque cada producto (café, té, tarta)
         * tiene opciones diferentes (radios, selects, etc.).
         * @param {HTMLElement} boton - El botón que se presionó.
         */
        function manejarAnadirAlCarrito(boton) {
            const productoDiv = boton.closest('.producto'); // Busco el 'div' padre del producto
            const nombreBase = boton.dataset.nombre;
            let nombreFinal = nombreBase;
            let precio;

            // Caso 1: Cafés (Espresso, etc.). Miro qué radio está marcado.
            const radioSeleccionado = productoDiv.querySelector('input[type="radio"]:checked');
            if (radioSeleccionado) {
                precio = parseFloat(radioSeleccionado.dataset.precio);
                // Construyo el nombre completo, ej: "Espresso (Grande)"
                nombreFinal = `${nombreBase} (${radioSeleccionado.value})`;
            }

            // Caso 2: Tés (con el <select>)
            const selectTe = productoDiv.querySelector('select.te-select');
            if (selectTe) {
                const opcionSeleccionada = selectTe.options[selectTe.selectedIndex];
                precio = parseFloat(opcionSeleccionada.dataset.precio);
                nombreFinal = `${nombreBase} (${opcionSeleccionada.value})`;
            }

            // Caso 3: Productos simples (la Tarta). El precio está en el botón.
            if (!radioSeleccionado && !selectTe && boton.dataset.precio) {
                precio = parseFloat(boton.dataset.precio);
            }

            // Caso 4: Café de Origen (¡el más complejo, tiene <select> Y radios!)
            const selectNacionalidad = productoDiv.querySelector('select.nacionalidad-select');
            if (selectNacionalidad) {
                const opcionNacionalidad = selectNacionalidad.options[selectNacionalidad.selectedIndex];
                const formatoGrano = productoDiv.querySelector('input[name="grano-formato"]:checked').value;
                
                precio = parseFloat(opcionNacionalidad.dataset.precio);
                // Construyo el nombre completo, ej: "Café de Origen (Etiopía, Molido)"
                nombreFinal = `${nombreBase} (${opcionNacionalidad.value}, ${formatoGrano})`;
            }

            // Si tengo un nombre y un precio, creo el objeto 'item'
            if (nombreFinal && precio) {
                const item = {
                    nombre: nombreFinal,
                    precio: precio,
                    cantidad: 1 // Siempre añado 1, mi backend se encarga de sumar si ya existe
                };
                
                // ¡Llamo a mi función de Fetch para mandarlo al servidor!
                agregarProductoAlServidor(item);
            } else {
                // Por si acaso algo falla
                console.error('No pude determinar el producto o precio.');
            }
        }

        /**
         * Esta es mi función asíncrona (async/await) para enviar el producto al
         * servidor (api_carrito.php) usando Fetch.
         * @param {object} item - El objeto del producto que creé antes.
         */
        async function agregarProductoAlServidor(item) {
            // Uso FormData, es la forma más fácil de enviar datos por POST a PHP
            const datos = new FormData();
            datos.append('accion', 'agregar');
            datos.append('nombre', item.nombre);
            datos.append('precio', item.precio);
            datos.append('cantidad', item.cantidad);

            try {
                // Hago la llamada fetch a mi API
                const respuesta = await fetch('api_carrito.php', {
                    method: 'POST',
                    body: datos
                });

                // Convierto la respuesta (que es JSON) en un objeto JavaScript
                const resultado = await respuesta.json();

                if (resultado.status === 'success') {
                    // ¡Todo bien! Muestro mi notificación
                    mostrarNotificacion('¡Producto añadido al carrito!');
                } else {
                    // Si PHP me dice que hubo un error
                    mostrarNotificacion('Error al añadir el producto.');
                    console.error('Error del servidor:', resultado.message);
                }
            } catch (error) {
                // Si falla la conexión (ej. se cae el servidor o no hay internet)
                console.error('Error de conexión:', error);
                mostrarNotificacion('Error de conexión con el servidor.');
            }
        }
    } // Fin del if (seccionProductos)


    // --- LÓGICA DE MI PÁGINA DE CARRITO (carrito.html) ---

    // Compruebo si estoy en la página del carrito
    const listaCarrito = document.getElementById('lista-carrito');
    if (listaCarrito) {
        
        // 1. Apenas cargo la página, pido al servidor que me dé el carrito
        cargarCarrito();

        // 2. Pongo un 'listener' en la lista (delegación) para los botones de "Eliminar"
        listaCarrito.addEventListener('click', (e) => {
            if (e.target.classList.contains('eliminar-item')) {
                // Si se pulsa eliminar, cojo el ID (data-id) que guardé en el botón
                const idProducto = e.target.dataset.id;
                eliminarProducto(idProducto);
            }
        });

        // 3. El evento para el botón de "Vaciar Carrito"
        document.getElementById('vaciar-carrito').addEventListener('click', () => {
            // Pido confirmación antes de borrar todo
            if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
                vaciarCarrito();
            }
        });

        /**
         * Mi función para pedirle al servidor (api_carrito.php) el contenido
         * actual del carrito. Uso un GET.
         */
        async function cargarCarrito() {
            try {
                // Hago un Fetch GET a mi API. Le paso la acción por la URL.
                const respuesta = await fetch('api_carrito.php?accion=leer');
                const resultado = await respuesta.json();

                if (resultado.status === 'success') {
                    // Si todo va bien, llamo a mi función para pintar el HTML
                    actualizarVistaCarrito(resultado.carrito);
                } else {
                    // Si el carrito está vacío o hay un error, pinto un carrito vacío
                    actualizarVistaCarrito([]);
                }
            } catch (error) {
                console.error('Error de conexión:', error);
                actualizarVistaCarrito([]); // Por si falla, muestro el carrito vacío
            }
        }

        /**
         * Esta función se encarga de "dibujar" el HTML del carrito en la página
         * basándose en los datos que me da el servidor.
         * @param {Array} carrito - El array de productos.
         */
        function actualizarVistaCarrito(carrito) {
            const subtotalEl = document.getElementById('subtotal');
            let subtotal = 0;

            // Primero, limpio la lista (borro lo que hubiera antes)
            listaCarrito.innerHTML = '';

            if (carrito.length === 0) {
                // Si el array está vacío, pongo un mensaje
                listaCarrito.innerHTML = '<li>Tu carrito está vacío.</li>';
                subtotalEl.textContent = '0.00';
                return; // Termino la función
            }

            // Recorro el array del carrito y creo un <li> por cada producto
            carrito.forEach(item => {
                const li = document.createElement('li');
                const totalItem = (item.precio * item.cantidad).toFixed(2);
                subtotal += (item.precio * item.cantidad);

                // Aquí meto el HTML de cada fila del carrito
                // ¡Importante! Guardo el item.id en el data-id del botón
                li.innerHTML = `
                    <span>${item.nombre} (x${item.cantidad})</span>
                    <span>${totalItem} €</span>
                    <button class="eliminar-item" data-id="${item.id}">Eliminar</button>
                `;
                listaCarrito.appendChild(li);
            });

            // Finalmente, actualizo el subtotal total
            subtotalEl.textContent = subtotal.toFixed(2);
        }

        /**
         * Mi función para pedirle al servidor que elimine UN producto.
         * Le mando el ID del producto que quiero borrar.
         * @param {number} id - El ID del producto en mi base de datos.
         */
        async function eliminarProducto(id) {
            const datos = new FormData();
            datos.append('accion', 'eliminar');
            datos.append('id', id);

            try {
                const respuesta = await fetch('api_carrito.php', {
                    method: 'POST',
                    body: datos
                });
                const resultado = await respuesta.json();

                if (resultado.status === 'success') {
                    mostrarNotificacion('Producto eliminado.');
                    // Vuelvo a pintar el carrito con los datos actualizados que me devuelve PHP
                    actualizarVistaCarrito(resultado.carrito); 
                } else {
                    mostrarNotificacion('Error al eliminar.');
                }
            } catch (error) {
                console.error('Error de conexión:', error);
            }
        }

        /**
         * Mi función para pedirle al servidor que borre TODO el carrito.
         */
        async function vaciarCarrito() {
            const datos = new FormData();
            datos.append('accion', 'vaciar'); // Le digo a PHP que la acción es 'vaciar'

            try {
                const respuesta = await fetch('api_carrito.php', {
                    method: 'POST',
                    body: datos
                });
                const resultado = await respuesta.json();

                if (resultado.status === 'success') {
                    mostrarNotificacion('Carrito vaciado.');
                    actualizarVistaCarrito([]); // Pinto un carrito vacío
                } else {
                    mostrarNotificacion('Error al vaciar el carrito.');
                }
            } catch (error) {
                console.error('Error de conexión:', error);
            }
        }
    } // Fin del if (listaCarrito)


    // --- LÓGICA DE MI FORMULARIO DE CONTACTO (contacto.html) ---

    // Compruebo si estoy en la página de contacto
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        
        // Capturo el evento 'submit' del formulario
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // ¡Evito que la página se recargue!

            const mensajeEnvio = document.getElementById('mensaje-envio');
            const boton = contactForm.querySelector('button[type="submit"]');
            
            // FormData es genial, coge todos los campos del formulario automáticamente
            const datos = new FormData(contactForm);
            
            // Deshabilito el botón para que no le den clic mil veces
            boton.disabled = true;
            boton.textContent = 'Enviando...';
            mensajeEnvio.textContent = ''; // Limpio mensajes anteriores

            try {
                // Hago el fetch a mi script 'procesar_contacto.php'
                const respuesta = await fetch('procesar_contacto.php', {
                    method: 'POST',
                    body: datos
                });

                const resultado = await respuesta.json();

                if (resultado.status === 'success') {
                    // ¡Éxito! Muestro el mensaje de PHP y reseteo el formulario
                    mensajeEnvio.textContent = resultado.message;
                    mensajeEnvio.style.color = 'var(--color-marron-oscuro)';
                    contactForm.reset(); 
                } else {
                    // Si PHP me da un error (ej. email inválido)
                    mensajeEnvio.textContent = resultado.message;
                    mensajeEnvio.style.color = 'var(--color-rojo-eliminar)';
                }
            } catch (error) {
                // Si falla la conexión
                console.error('Error de conexión:', error);
                mensajeEnvio.textContent = 'Error de conexión. Inténtalo de nuevo más tarde.';
                mensajeEnvio.style.color = 'var(--color-rojo-eliminar)';
            } finally {
                // Pase lo que pase (éxito o error), vuelvo a habilitar el botón
                boton.disabled = false;
                boton.textContent = 'Enviar Mensaje';
            }
        });
    } // Fin del if (contactForm)

}); // Fin de todo mi script (DOMContentLoaded)

/*
 * NOTA: Para que mi notificación funcione, tengo que añadir este CSS a style.css.
 * Lo pongo aquí para acordarme.
 *
 * .notificacion-toast {
 * position: fixed;
 * bottom: 20px;
 * left: 50%;
 * transform: translateX(-50%) translateY(100px);
 * background-color: var(--color-marron-oscuro);
 * color: var(--color-blanco);
 * padding: 15px 25px;
 * border-radius: 5px;
 * box-shadow: 0 4px 10px rgba(0,0,0,0.2);
 * opacity: 0;
 * transition: opacity 0.4s ease, transform 0.4s ease;
 * z-index: 1000;
 * }
 * .notificacion-toast.visible {
 * opacity: 1;
 * transform: translateX(-50%) translateY(0);
 * }
 */