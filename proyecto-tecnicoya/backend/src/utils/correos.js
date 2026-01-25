/**
 * Utilidades de Correos Electrónicos
 * TécnicoYa - Backend
 * Templates y funciones para envío de correos
 */

const transporter = require('../config/nodemailer');

/**
 * Genera el template HTML para los correos
 */
const getEmailTemplate = (title, message, buttonUrl = '', buttonText = '', footer = '') => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #3880ff 0%, #5a9cff 100%);
          padding: 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: white;
          text-decoration: none;
        }
        .logo-icon {
          font-size: 40px;
          margin-bottom: 10px;
        }
        .content {
          background: white;
          padding: 40px 30px;
          border-radius: 0 0 8px 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .title {
          color: #333;
          font-size: 24px;
          margin-bottom: 20px;
          text-align: center;
        }
        .message {
          color: #555;
          font-size: 16px;
          margin-bottom: 30px;
          text-align: center;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #3880ff 0%, #5a9cff 100%);
          color: white !important;
          padding: 15px 40px;
          text-decoration: none;
          border-radius: 30px;
          font-weight: bold;
          font-size: 16px;
          text-align: center;
          transition: transform 0.2s;
        }
        .button:hover {
          transform: scale(1.02);
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #888;
          font-size: 12px;
        }
        .footer a {
          color: #3880ff;
          text-decoration: none;
        }
        .divider {
          height: 1px;
          background: #eee;
          margin: 30px 0;
        }
        .info-box {
          background: #f8f9fa;
          border-left: 4px solid #3880ff;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .code {
          font-size: 32px;
          font-weight: bold;
          color: #3880ff;
          letter-spacing: 5px;
          text-align: center;
          padding: 20px;
          background: #f0f7ff;
          border-radius: 8px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-icon">🔧</div>
          <div class="logo">TécnicoYa</div>
        </div>
        <div class="content">
          <h1 class="title">${title}</h1>
          <div class="message">${message}</div>
          ${buttonUrl ? `
            <div class="button-container">
              <a href="${buttonUrl}" class="button">${buttonText}</a>
            </div>
          ` : ''}
        </div>
        <div class="footer">
          ${footer || 'Este correo fue enviado por TécnicoYa.<br>Si no solicitaste este correo, puedes ignorarlo.'}
          <br><br>
          © ${new Date().getFullYear()} TécnicoYa. Todos los derechos reservados.
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Envía correo de confirmación de registro
 */
const enviarCorreoRegistro = async (email, nombre, token) => {
  // URL para web
  const urlConfirmacionWeb = `${process.env.URL_FRONTEND}/confirmar-cuenta/${token}`;
  // URL para app móvil (deep link)
  const urlConfirmacionApp = `tecnicoya://app/confirmar-cuenta/${token}`;

  const htmlContent = getEmailTemplate(
    '¡Bienvenido a TécnicoYa!',
    `Hola <strong>${nombre}</strong>,<br><br>
    ¡Gracias por registrarte en TécnicoYa! Estamos emocionados de tenerte con nosotros.<br><br>
    Para activar tu cuenta y comenzar a disfrutar de nuestros servicios, por favor confirma tu correo electrónico haciendo clic en el botón de abajo.<br><br>
    <small>Si estás en la app móvil, <a href="${urlConfirmacionApp}">haz clic aquí</a></small>`,
    urlConfirmacionWeb,
    'Confirmar mi cuenta',
    'Si el botón no funciona, copia y pega este enlace en tu navegador:<br>' + urlConfirmacionWeb
  );

  const mailOptions = {
    from: `"TécnicoYa" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '¡Bienvenido a TécnicoYa! Confirma tu cuenta',
    html: htmlContent
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Correo de registro enviado a ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar correo de registro:', error.message);
    throw error;
  }
};

/**
 * Envía correo para recuperación de contraseña
 */
const enviarCorreoRecuperacion = async (email, nombre, token) => {
  // URL para web
  const urlRecuperacionWeb = `${process.env.URL_FRONTEND}/restablecer-contrasena/${token}`;
  // URL para app móvil (deep link)
  const urlRecuperacionApp = `tecnicoya://app/restablecer-contrasena/${token}`;

  const htmlContent = getEmailTemplate(
    'Recupera tu contraseña',
    `Hola <strong>${nombre}</strong>,<br><br>
    Recibimos una solicitud para restablecer la contraseña de tu cuenta en TécnicoYa.<br><br>
    Si no realizaste esta solicitud, puedes ignorar este correo. Tu contraseña permanecerá sin cambios.<br><br>
    Para crear una nueva contraseña, haz clic en el botón de abajo:<br><br>
    <small>Si estás en la app móvil, <a href="${urlRecuperacionApp}">haz clic aquí</a></small>`,
    urlRecuperacionWeb,
    'Restablecer contraseña',
    'Este enlace expirará en 1 hora por seguridad.<br>Si el botón no funciona, copia y pega este enlace en tu navegador:<br>' + urlRecuperacionWeb
  );

  const mailOptions = {
    from: `"TécnicoYa" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Restablece tu contraseña - TécnicoYa',
    html: htmlContent
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Correo de recuperación enviado a ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar correo de recuperación:', error.message);
    throw error;
  }
};

/**
 * Envía correo de notificación de cambio de contraseña
 */
const enviarCorreoCambioContrasena = async (email, nombre) => {
  const htmlContent = getEmailTemplate(
    'Tu contraseña ha sido cambiada',
    `Hola <strong>${nombre}</strong>,<br><br>
    Te informamos que la contraseña de tu cuenta en TécnicoYa ha sido cambiada exitosamente.<br><br>
    Si no realizaste este cambio, por favor contacta inmediatamente con nuestro equipo de soporte.`,
    '',
    '',
    'Este es un correo automático de seguridad. Si no realizaste este cambio, contacta a soporte@tecnicoya.com'
  );

  const mailOptions = {
    from: `"TécnicoYa" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Tu contraseña ha sido cambiada - TécnicoYa',
    html: htmlContent
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Correo de cambio de contraseña enviado a ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar correo de cambio:', error.message);
    throw error;
  }
};

/**
 * Envía correo de notificación de nuevo trabajo asignado (para técnicos)
 */
const enviarCorreoNuevoTrabajo = async (email, nombre, detallesTrabajo) => {
  const htmlContent = getEmailTemplate(
    '¡Tienes un nuevo trabajo!',
    `Hola <strong>${nombre}</strong>,<br><br>
    ¡Buenas noticias! Se te ha asignado un nuevo trabajo.<br><br>
    <div class="info-box">
      <strong>Servicio:</strong> ${detallesTrabajo.servicio}<br>
      <strong>Cliente:</strong> ${detallesTrabajo.cliente}<br>
      <strong>Fecha:</strong> ${detallesTrabajo.fecha}<br>
      <strong>Dirección:</strong> ${detallesTrabajo.direccion}
    </div>
    <br>
    Ingresa a la aplicación para ver todos los detalles y contactar al cliente.`,
    process.env.URL_FRONTEND,
    'Ver detalles del trabajo'
  );

  const mailOptions = {
    from: `"TécnicoYa" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '¡Nuevo trabajo asignado! - TécnicoYa',
    html: htmlContent
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Correo de nuevo trabajo enviado a ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar correo de nuevo trabajo:', error.message);
    throw error;
  }
};

/**
 * Envía correo de trabajo completado (para clientes)
 */
const enviarCorreoTrabajoCompletado = async (email, nombre, detallesTrabajo) => {
  const htmlContent = getEmailTemplate(
    'Tu servicio ha sido completado',
    `Hola <strong>${nombre}</strong>,<br><br>
    ¡Tu servicio ha sido marcado como completado!<br><br>
    <div class="info-box">
      <strong>Servicio:</strong> ${detallesTrabajo.servicio}<br>
      <strong>Técnico:</strong> ${detallesTrabajo.tecnico}<br>
      <strong>Monto:</strong> $${detallesTrabajo.monto}
    </div>
    <br>
    Por favor ingresa a la aplicación para aprobar el trabajo y dejar una reseña al técnico.`,
    process.env.URL_FRONTEND,
    'Aprobar y calificar'
  );

  const mailOptions = {
    from: `"TécnicoYa" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Tu servicio ha sido completado - TécnicoYa',
    html: htmlContent
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Correo de trabajo completado enviado a ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar correo de trabajo completado:', error.message);
    throw error;
  }
};

module.exports = {
  enviarCorreoRegistro,
  enviarCorreoRecuperacion,
  enviarCorreoCambioContrasena,
  enviarCorreoNuevoTrabajo,
  enviarCorreoTrabajoCompletado
};
