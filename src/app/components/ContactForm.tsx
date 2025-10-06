'use client';

import { useState } from 'react';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  service: string;
}

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
    service: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          pageUrl: window.location.href,
          pageTitle: document.title,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitMessage('¡Gracias por contactarnos! Nos pondremos en contacto contigo muy pronto.');
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: '',
          service: '',
        });
      } else {
        setSubmitMessage('Hubo un error al enviar tu mensaje. Por favor intenta nuevamente.');
      }
    } catch {
      setSubmitMessage('Hubo un error al enviar tu mensaje. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contacto" className="py-16 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Solicita tu Cotización Gratuita
            </h2>
            <p className="text-lg text-gray-600 mb-2">
              ¡Especialistas en Aluminio y Vidrio en León, Guanajuato!
            </p>
            <p className="text-md text-gray-600">
              Más de 30 años creando soluciones de calidad para tu hogar y negocio
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Formulario */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-xl font-semibold mb-6 text-center">
                Contáctanos Ahora
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="477-123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">
                    Servicio de Interés
                  </label>
                  <select
                    id="service"
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecciona un servicio</option>
                    <option value="ventanas-aluminio">Ventanas de Aluminio</option>
                    <option value="puertas-aluminio">Puertas de Aluminio</option>
                    <option value="canceleria-vidrio">Cancelería de Vidrio</option>
                    <option value="domos">Domos y Techos</option>
                    <option value="fachadas">Fachadas Integrales</option>
                    <option value="mantenimiento">Mantenimiento y Reparación</option>
                    <option value="otro">Otro servicio</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Mensaje *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Cuéntanos sobre tu proyecto... ¿Qué tipo de trabajo necesitas? ¿En qué zona de León te encuentras?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                </button>

                {submitMessage && (
                  <div className={`mt-4 p-3 rounded-md text-center ${
                    submitMessage.includes('Gracias') 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {submitMessage}
                  </div>
                )}
              </form>
            </div>

            {/* Información de contacto */}
            <div className="space-y-8">
              <div className="bg-blue-600 text-white rounded-lg p-8">
                <h3 className="text-xl font-semibold mb-6">
                  Aluminio San Francisco
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-200">📍</span>
                    <div>
                      <p className="font-medium">Ubicación</p>
                      <p className="text-blue-100">León, Guanajuato y alrededores</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-200">🕒</span>
                    <div>
                      <p className="font-medium">Horarios de Atención</p>
                      <p className="text-blue-100">Lunes a Viernes: 8:00 AM - 6:00 PM</p>
                      <p className="text-blue-100">Sábados: 8:00 AM - 2:00 PM</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-200">⚡</span>
                    <div>
                      <p className="font-medium">Respuesta Rápida</p>
                      <p className="text-blue-100">Cotizaciones en menos de 24 horas</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <h4 className="text-lg font-semibold mb-4 text-gray-900">
                  ¿Por qué elegir Aluminio San Francisco?
                </h4>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Más de 30 años de experiencia en León</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Materiales de la más alta calidad</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Garantía en todos nuestros trabajos</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Servicio personalizado y profesional</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Cotizaciones sin compromiso</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}