import Image from "next/image";
import ContactForm from './components/ContactForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Aluminio San Francisco - Vidrio y Aluminio en León, Guanajuato | Especialistas desde 1990",
  description: "🏆 Aluminio San Francisco: Líderes en vidrio y aluminio en León, Guanajuato. Ventanas, puertas, cancelería y domos residenciales. Más de 30 años de experiencia. ¡Cotización GRATUITA!",
  keywords: "aluminio san francisco, vidrio y aluminio león, ventanas león guanajuato, puertas aluminio león, cancelería león, servicio león, domos león, vidrio templado león",
};

export default function Home() {
  return (
    <>
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto flex items-center justify-between py-4 px-6">
          <div className="flex items-center">
            <Image
              src="/logo_aluminos.png"
              alt="Aluminio San Francisco - Especialistas en Vidrio y Aluminio León"
              width={60}
              height={60}
              className="w-14 h-14 rounded-lg"
            />
            <div className="ml-4">
              <h1 className="text-xl font-bold">Aluminio San Francisco</h1>
              <p className="text-blue-100 text-sm">León, Guanajuato</p>
            </div>
          </div>
          <nav className="hidden md:block">
            <ul className="flex space-x-8">
              <li>
                <a href="#servicios" className="hover:text-blue-200 transition-colors font-medium">
                  Servicios
                </a>
              </li>
              <li>
                <a href="#nosotros" className="hover:text-blue-200 transition-colors font-medium">
                  Nosotros
                </a>
              </li>
              <li>
                <a href="#contacto" className="hover:text-blue-200 transition-colors font-medium">
                  Contacto
                </a>
              </li>
            </ul>
          </nav>
          <a 
            href="#contacto" 
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            ¡Cotiza Ahora!
          </a>
        </div>
      </header>

      {/* Main */}
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white relative overflow-hidden">
          <div className="container mx-auto px-6 py-20 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Especialistas en <span className="text-yellow-400">Vidrio y Aluminio</span> en León
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                🏆 Más de 30 años creando soluciones de calidad para tu hogar
              </p>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-700 bg-opacity-50 p-4 rounded-lg">
                  <div className="text-3xl mb-2">🏠</div>
                  <h3 className="font-semibold mb-1">Residencial</h3>
                  <p className="text-blue-100 text-sm">Ventanas, puertas y más</p>
                </div>
                <div className="bg-blue-700 bg-opacity-50 p-4 rounded-lg">
                  <div className="text-3xl mb-2">⚡</div>
                  <h3 className="font-semibold mb-1">Respuesta Rápida</h3>
                  <p className="text-blue-100 text-sm">Cotización en 24 horas</p>
                </div>
                <div className="bg-blue-700 bg-opacity-50 p-4 rounded-lg">
                  <div className="text-3xl mb-2">✅</div>
                  <h3 className="font-semibold mb-1">Garantía Total</h3>
                  <p className="text-blue-100 text-sm">Calidad garantizada</p>
                </div>
              </div>
              <div className="space-y-4 md:space-y-0 md:space-x-4 md:flex justify-center">
                <a 
                  href="#contacto"
                  className="inline-block bg-yellow-500 text-blue-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-400 transition-colors shadow-lg"
                >
                  🎯 Solicitar Cotización Gratuita
                </a>
                <a 
                  href="#servicios"
                  className="inline-block bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Ver Nuestros Servicios
                </a>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full opacity-10 -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 rounded-full opacity-10 translate-y-24 -translate-x-24"></div>
        </section>

        {/* Servicios Section */}
        <section id="servicios" className="py-20 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Nuestros Servicios Especializados
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Ofrecemos soluciones integrales en vidrio y aluminio para León, Guanajuato y alrededores. 
                Cada proyecto con la más alta calidad y profesionalismo.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🚪</div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Puertas de Aluminio León</h3>
                <p className="text-gray-600 mb-4">
                  Puertas residenciales de aluminio con diseños modernos. Seguridad, durabilidad y estilo para tu hogar en León.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>✓ Puertas corredizas</li>
                  <li>✓ Puertas abatibles</li>
                  <li>✓ Puertas de seguridad</li>
                </ul>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🪟</div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Ventanas y Cancelería León</h3>
                <p className="text-gray-600 mb-4">
                  Ventanas de aluminio y cancelería para León. Mejora la iluminación y ventilación de tu hogar con nuestras soluciones.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>✓ Ventanas corredizas</li>
                  <li>✓ Ventanas proyectantes</li>
                  <li>✓ Cancelería integral</li>
                </ul>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🔷</div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Vidrio y Cristal León</h3>
                <p className="text-gray-600 mb-4">
                  Especialistas en vidrio templado, laminado y cancelería de vidrio en León. Instalación profesional garantizada.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>✓ Vidrio templado</li>
                  <li>✓ Vidrio laminado</li>
                  <li>✓ Cancelería de vidrio</li>
                </ul>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🏗️</div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Domos y Techos León</h3>
                <p className="text-gray-600 mb-4">
                  Domos arquitectónicos y techos de policarbonato en León. Soluciones modernas para iluminación natural.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>✓ Domos arquitectónicos</li>
                  <li>✓ Techos de policarbonato</li>
                  <li>✓ Claraboyas</li>
                </ul>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🏢</div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Fachadas Integrales</h3>
                <p className="text-gray-600 mb-4">
                  Fachadas de aluminio y vidrio para proyectos arquitectónicos en León. Diseño moderno y funcional.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>✓ Muro cortina</li>
                  <li>✓ Fachadas ventiladas</li>
                  <li>✓ Diseño arquitectónico</li>
                </ul>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🔧</div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Mantenimiento León</h3>
                <p className="text-gray-600 mb-4">
                  Servicio de mantenimiento y reparación de aluminio y vidrio en León. Conserva tus instalaciones en perfecto estado.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>✓ Reparaciones</li>
                  <li>✓ Mantenimiento preventivo</li>
                  <li>✓ Servicio técnico</li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <p className="text-lg text-gray-600 mb-6">
                ¿Necesitas un servicio específico? ¡Contáctanos para una solución personalizada!
              </p>
              <a 
                href="#contacto"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Solicitar Información
              </a>
            </div>
          </div>
        </section>

        {/* Nosotros Section */}
        <section id="nosotros" className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Aluminio San Francisco: Tradición y Calidad en León
                </h2>
                <p className="text-xl text-gray-600">
                  Más de 30 años siendo la empresa líder en vidrio y aluminio en León, Guanajuato
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Nuestra Historia en León, Guanajuato
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Desde <strong>1990</strong>, Aluminio San Francisco se ha posicionado como la empresa líder en 
                    <strong> vidrio y aluminio en León, Guanajuato</strong>. Iniciamos como un pequeño taller familiar 
                    y hoy somos reconocidos por la <strong>calidad excepcional</strong> de nuestros productos y servicios.
                  </p>
                  <p className="text-gray-600 mb-6">
                    Nuestro compromiso es brindar <strong>soluciones residenciales de aluminio</strong> que cumplan 
                    con los más altos estándares de calidad, siempre con el respaldo de décadas de experiencia 
                    sirviendo a las familias y empresas de <strong>León y sus alrededores</strong>.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">30+</div>
                      <div className="text-gray-600">Años de Experiencia</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">5000+</div>
                      <div className="text-gray-600">Proyectos Realizados</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">🎯 Nuestra Misión</h4>
                    <p className="text-gray-600">
                      Ser la empresa líder en <strong>vidrio y aluminio en León</strong>, ofreciendo productos y 
                      servicios de la más alta calidad que superen las expectativas de nuestros clientes.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">🌟 Nuestra Visión</h4>
                    <p className="text-gray-600">
                      Consolidarnos como la referencia en <strong>soluciones de aluminio residencial en León</strong>, 
                      expandiendo nuestros servicios mientras mantenemos la excelencia y cercanía con nuestros clientes.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">💎 Nuestros Valores</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li>✓ <strong>Calidad:</strong> Materiales y acabados superiores</li>
                      <li>✓ <strong>Confianza:</strong> Más de 30 años de respaldo</li>
                      <li>✓ <strong>Servicio:</strong> Atención personalizada en León</li>
                      <li>✓ <strong>Innovación:</strong> Soluciones modernas y funcionales</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center bg-blue-50 py-12 px-6 rounded-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  ¿Por qué elegir Aluminio San Francisco en León?
                </h3>
                <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                  <div>
                    <div className="text-3xl mb-2">🏆</div>
                    <h4 className="font-semibold text-gray-900">Experiencia Comprobada</h4>
                    <p className="text-sm text-gray-600">30+ años sirviendo a León</p>
                  </div>
                  <div>
                    <div className="text-3xl mb-2">🔒</div>
                    <h4 className="font-semibold text-gray-900">Garantía Total</h4>
                    <p className="text-sm text-gray-600">Respaldamos cada trabajo</p>
                  </div>
                  <div>
                    <div className="text-3xl mb-2">💡</div>
                    <h4 className="font-semibold text-gray-900">Diseños Modernos</h4>
                    <p className="text-sm text-gray-600">Tendencias actuales</p>
                  </div>
                  <div>
                    <div className="text-3xl mb-2">📍</div>
                    <h4 className="font-semibold text-gray-900">Servicio Local</h4>
                    <p className="text-sm text-gray-600">En León y alrededores</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contacto Section */}
        <ContactForm />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Información Principal */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <Image
                  src="/logo_aluminos.png"
                  alt="Aluminio San Francisco León"
                  width={50}
                  height={50}
                  className="w-12 h-12 rounded-lg"
                />
                <div className="ml-3">
                  <h3 className="text-xl font-bold">Aluminio San Francisco</h3>
                  <p className="text-gray-300 text-sm">Vidrio y Aluminio en León, Gto.</p>
                </div>
              </div>
              <p className="text-gray-300 mb-4">
                Líderes en <strong>vidrio y aluminio en León, Guanajuato</strong> desde 1990. 
                Especializados en ventanas, puertas, cancelería y domos residenciales. 
                Calidad garantizada y servicio profesional.
              </p>
              <div className="flex space-x-4">
                <span className="text-2xl">📍</span>
                <div>
                  <p className="font-medium">Servicio en León y Alrededores</p>
                  <p className="text-gray-300 text-sm">León, Guanajuato, México</p>
                </div>
              </div>
            </div>

            {/* Servicios Rápidos */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Nuestros Servicios</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#servicios" className="hover:text-white transition-colors">Ventanas de Aluminio</a></li>
                <li><a href="#servicios" className="hover:text-white transition-colors">Puertas de Aluminio</a></li>
                <li><a href="#servicios" className="hover:text-white transition-colors">Cancelería de Vidrio</a></li>
                <li><a href="#servicios" className="hover:text-white transition-colors">Domos y Techos</a></li>
                <li><a href="#servicios" className="hover:text-white transition-colors">Vidrio Templado</a></li>
              </ul>
            </div>

            {/* Enlaces Rápidos */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Enlaces Rápidos</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#servicios" className="hover:text-white transition-colors">Nuestros Servicios</a></li>
                <li><a href="#nosotros" className="hover:text-white transition-colors">Sobre Nosotros</a></li>
                <li><a href="#contacto" className="hover:text-white transition-colors">Contacto</a></li>
                <li><a href="#contacto" className="hover:text-white transition-colors">Cotización Gratuita</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p className="text-gray-300">
                  &copy; {new Date().getFullYear()} <strong>Aluminio San Francisco</strong> - Vidrio y Aluminio León, Guanajuato. 
                  Todos los derechos reservados.
                </p>
              </div>
              <div className="text-sm text-gray-400">
                <p>Especialistas en León • Servicio Profesional • Calidad Garantizada</p>
              </div>
            </div>
          </div>

          {/* Schema.org Structured Data for SEO */}
          <script 
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "LocalBusiness",
                "name": "Aluminio San Francisco",
                "description": "Especialistas en vidrio y aluminio en León, Guanajuato. Ventanas, puertas, cancelería y domos residenciales.",
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": "León",
                  "addressRegion": "Guanajuato",
                  "addressCountry": "MX"
                },
                "telephone": "477-XXX-XXXX",
                "url": "https://aluminiosanfrancisco.com",
                "image": "https://aluminiosanfrancisco.com/logo_aluminos.png",
                "priceRange": "$$",
                "serviceArea": {
                  "@type": "City",
                  "name": "León, Guanajuato"
                },
                "hasOfferCatalog": {
                  "@type": "OfferCatalog",
                  "name": "Servicios de Vidrio y Aluminio",
                  "itemListElement": [
                    {
                      "@type": "Offer",
                      "itemOffered": {
                        "@type": "Service",
                        "name": "Ventanas de Aluminio León"
                      }
                    },
                    {
                      "@type": "Offer",
                      "itemOffered": {
                        "@type": "Service",
                        "name": "Puertas de Aluminio León"
                      }
                    },
                    {
                      "@type": "Offer",
                      "itemOffered": {
                        "@type": "Service",
                        "name": "Cancelería de Vidrio León"
                      }
                    }
                  ]
                }
              })
            }}
          />
        </div>
      </footer>
    </>
  );
}