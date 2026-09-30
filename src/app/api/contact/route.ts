import { NextRequest, NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { rateLimit } from '../../../lib/rateLimit';
import { normalizeMxPhone, whatsappUrl } from '../../../lib/phone';

export async function POST(request: NextRequest) {
  try {
    // Obtener las variables de entorno
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    // Verificar que las variables de entorno estén configuradas
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('❌ Variables de entorno de Telegram no configuradas');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Error de configuración del servidor' 
        },
        { status: 500 }
      );
    }

    // Obtener los datos del formulario
    const body = await request.json();
    const { name, email, phone, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: "Todos los campos obligatorios deben ser completados" },
        { status: 400 }
      );
    }

    const cleanName = String(name).trim().slice(0, 80);
    const cleanEmail = String(email).trim().slice(0, 120);
    const cleanMessage = String(message).trim().slice(0, 1000);
    const cleanPhone = String(phone || "").trim().slice(0, 20);

    if (cleanName.length < 2 || cleanMessage.length < 5 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, message: "Revisa el nombre, el correo y el mensaje." },
        { status: 400 }
      );
    }

    const ip = (request.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
    const limit = rateLimit(`contact:${ip}`, 5, 10 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { success: false, message: "Espera unos minutos antes de enviar otro mensaje." },
        { status: 429 }
      );
    }

    const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
    const localPhone = normalizeMxPhone(cleanPhone);
    const telegramMessage = [
      "Nuevo mensaje de contacto",
      "",
      `Nombre: ${cleanName}`,
      `Email: ${cleanEmail}`,
      `Teléfono: ${localPhone || "No proporcionado"}`,
      "",
      "Mensaje:",
      cleanMessage,
      "",
      `Fecha: ${new Date().toLocaleString("es-MX", {
        timeZone: "America/Mexico_City",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
    ].join("\n");

    const whatsappMessage = `Hola ${cleanName}, vi que te contactaste a través de nuestra página web. ¿En qué te puedo ayudar?`;
    const replyUrl = whatsappUrl(cleanPhone, whatsappMessage);

    await bot.sendMessage(TELEGRAM_CHAT_ID, telegramMessage, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: localPhone.length === 10
                ? `Responder a ${cleanName} (${localPhone})`
                : `Responder por WhatsApp a ${cleanName}`,
              url: replyUrl,
            },
          ],
        ],
      },
    });

    console.log('✅ Mensaje enviado exitosamente a Telegram');

    return NextResponse.json(
      { 
        success: true, 
        message: 'Mensaje enviado correctamente' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error al enviar mensaje:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}
