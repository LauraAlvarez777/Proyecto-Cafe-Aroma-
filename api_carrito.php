<?php
/*
 * procesar_contacto.php
 * ¡Este es mi script para el formulario de contacto!
 * Aquí es donde recibo los datos del 'contacto.html' y me los envío a mi propio email.
 * Es la otra parte de mi Backend.
 */

// Le digo a PHP que mi respuesta va a ser un JSON, para que script.js me entienda.
header('Content-Type: application/json');

// 1. Recoger los datos que me manda el formulario (el 'name' de cada campo)
// '$_POST' es como PHP recoge los datos que 'script.js' le envió.
// El 'trim()' es para quitar espacios en blanco por si acaso.
$nombre = trim($_POST['nombre']);
$email = trim($_POST['email']);
$mensaje = trim($_POST['mensaje']);

// 2. Validación (¡Súper importante!)
// No quiero que me envíen un formulario vacío o un email que no sea válido.
if (empty($nombre) || empty($email) || empty($mensaje) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    // Si algo falla (vacío o email incorrecto), mando un error.
    echo json_encode([
        'success' => false,
        'message' => 'Por favor, rellena todos los campos con un email válido.'
    ]);
    exit; // Termino el script aquí, no sigo.
}

// 3. ¡Hora de montar el email que voy a recibir YO!

// ¿A qué email quiero que me lleguen los mensajes?
$mi_email = "tu_email_aqui@gmail.com"; // <-- ¡¡IMPORTANTE: AQUI TENGO QUE CAMBIAR POR EL email del cliente!!

// El asunto del email que recibirá ek cliente
$asunto = "Nuevo Mensaje de 'Café Aroma' de: $nombre";

// El cuerpo del mensaje (con formato)
$cuerpo_mensaje = "Has recibido un nuevo mensaje de tu web 'Café Aroma'.\n\n";
$cuerpo_mensaje .= "Nombre: $nombre\n";
$cuerpo_mensaje .= "Email: $email\n\n";
$cuerpo_mensaje .= "Mensaje:\n$mensaje\n";

// Las 'cabeceras' (headers) son necesarias para que el 'From' funcione
// y para que el email sepa quién lo envía.
$headers = "From: " . $email;

// 4. La función 'mail()' de PHP
// Esta es la función que intenta enviar el correo.
// Esto casi nunca funciona en 'localhost' (XAMPP) porque no está configurado
// como un servidor de correo. Pero funcionará cuando suba la web a un hosting real.

if (mail($mi_email, $asunto, $cuerpo_mensaje, $headers)) {
    // 5. ¡Éxito! Le contesto a mi script.js
    echo json_encode([
        'success' => true,
        'message' => '¡Mensaje enviado con éxito! Gracias por contactar.'
    ]);
} else {
    // 5b. ¡Fallo! Le digo a script.js que algo fue mal
    echo json_encode([
        'success' => false,
        'message' => 'Error: El mensaje no se pudo enviar. (Esto es normal si estás probando en XAMPP/localhost).'
    ]);
}

?>