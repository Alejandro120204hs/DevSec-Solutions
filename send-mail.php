<?php
require __DIR__ . '/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json');

function respond(bool $success, string $message): void {
    http_response_code($success ? 200 : 400);
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}

function logLine(string $line): void {
    $stamp = date('Y-m-d H:i:s');
    file_put_contents(__DIR__ . '/mail-log.txt', "[{$stamp}] {$line}\n", FILE_APPEND);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Método no permitido.');
}

$data = json_decode(file_get_contents('php://input'), true) ?? [];

$nombre = trim($data['nombre'] ?? '');
$email = trim($data['email'] ?? '');
$pais = trim($data['pais'] ?? '');
$telefono = trim($data['telefono'] ?? '');
$mensaje = trim($data['mensaje'] ?? '');

if ($nombre === '' || $email === '' || $pais === '' || $telefono === '' || $mensaje === '') {
    respond(false, 'Completa todos los campos.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'El email no es válido.');
}

$config = require __DIR__ . '/mail-config.php';

$mail = new PHPMailer(true);

$nombreSafe = htmlspecialchars($nombre, ENT_QUOTES, 'UTF-8');
$emailSafe = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
$paisSafe = htmlspecialchars($pais, ENT_QUOTES, 'UTF-8');
$telefonoSafe = htmlspecialchars($telefono, ENT_QUOTES, 'UTF-8');
$telefonoDigits = preg_replace('/\D+/', '', $telefono);
$mensajeSafe = nl2br(htmlspecialchars($mensaje, ENT_QUOTES, 'UTF-8'));

$htmlBody = <<<HTML
<!doctype html>
<html>
<body style="margin:0; padding:0; background:#f6f7f5; font-family:Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f5; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%; background:#ffffff; border-radius:20px; overflow:hidden; border:1px solid rgba(13,34,44,0.1);">
          <tr>
            <td style="background:#0a1c2a; padding:28px 32px;">
              <span style="color:#c5ff4a; font-size:20px; font-weight:bold;">{</span><span style="color:#f5f7f2; font-size:20px; font-weight:bold;">DevSec Solutions</span><span style="color:#c5ff4a; font-size:20px; font-weight:bold;">}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 24px; font-size:24px; color:#0d222c;">Nuevo mensaje de contacto recibido</h1>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px; background:#f6f7f5; border-radius:12px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0 0 2px; font-size:12px; font-weight:bold; color:#4c6066;">NOMBRE</p>
                    <p style="margin:0; font-size:16px; color:#0d222c;">{$nombreSafe}</p>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px; background:#f6f7f5; border-radius:12px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0 0 2px; font-size:12px; font-weight:bold; color:#4c6066;">EMAIL</p>
                    <p style="margin:0; font-size:16px; color:#0d222c;"><a href="mailto:{$emailSafe}" style="color:#0d222c; text-decoration:none;">{$emailSafe}</a></p>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px; background:#f6f7f5; border-radius:12px;">
                <tr>
                  <td style="padding:14px 18px; width:50%;">
                    <p style="margin:0 0 2px; font-size:12px; font-weight:bold; color:#4c6066;">PAÍS</p>
                    <p style="margin:0; font-size:16px; color:#0d222c;">{$paisSafe}</p>
                  </td>
                  <td style="padding:14px 18px; width:50%;">
                    <p style="margin:0 0 2px; font-size:12px; font-weight:bold; color:#4c6066;">TELÉFONO</p>
                    <p style="margin:0; font-size:16px; color:#0d222c;"><a href="https://wa.me/{$telefonoDigits}" style="color:#0d222c; text-decoration:none;">{$telefonoSafe}</a></p>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px; background:#f6f7f5; border-radius:12px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0 0 2px; font-size:12px; font-weight:bold; color:#4c6066;">MENSAJE</p>
                    <p style="margin:0; font-size:16px; line-height:1.6; color:#0d222c;">{$mensajeSafe}</p>
                  </td>
                </tr>
              </table>

              <a href="mailto:{$emailSafe}" style="display:inline-block; background:#c5ff4a; color:#050e15; font-weight:bold; font-size:14px; padding:14px 22px; border-radius:999px; text-decoration:none;">Responder a {$nombreSafe} &rarr;</a>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px; background:#f6f7f5; border-top:1px solid rgba(13,34,44,0.08);">
              <p style="margin:0; font-size:12px; color:#4c6066;">Este mensaje se generó automáticamente desde el formulario de contacto de tu sitio web.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;

try {
    $mail->isSMTP();
    $mail->Host = $config['smtp_host'];
    $mail->SMTPAuth = true;
    $mail->Username = $config['smtp_user'];
    $mail->Password = $config['smtp_pass'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = $config['smtp_port'];
    $mail->CharSet = 'UTF-8';

    $mail->setFrom($config['smtp_user'], 'DevSec Solutions - Sitio Web');
    $mail->addAddress($config['to_email'], $config['to_name']);
    $mail->addReplyTo($email, $nombre);

    $mail->Subject = "Nuevo mensaje de contacto - {$nombre}";
    $mail->isHTML(true);
    $mail->Body = $htmlBody;
    $mail->AltBody = "Nombre: {$nombre}\nEmail: {$email}\n\nMensaje:\n{$mensaje}";

    $mail->send();
    logLine("OK enviado a {$config['to_email']} | de: {$nombre} <{$email}>");
    respond(true, 'Mensaje enviado correctamente.');
} catch (Exception $e) {
    logLine("FALLO: {$mail->ErrorInfo}");
    respond(false, 'No se pudo enviar el mensaje. Intenta de nuevo más tarde.');
}
