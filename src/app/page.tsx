import Head from "next/head";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <Head>
        {/* SEO Básico */}
        <title>Aluminio San Francisco - Calidad y Prestigio desde 1990</title>
        <meta
          name="description"
          content="AluminiosSan Francisco: Fabricante líder de puertas de aluminio, ventanas, cancelería, manejo de vidrio, cancelería de vidrio, domos y más. Calidad y prestigio desde 1990 en San Francisco del Rincón."
        />
        <meta
          name="keywords"
          content="Aluminio San Francisco, puertas de aluminio, ventanas, cancelería, vidrio, domos, aluminio residencial, aluminio arquitectónico"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" /> {/* Ruta al favicon */}
        <meta property="og:title" content="Aluminio San Francisco" />
        <meta
          property="og:description"
          content="Aluminio San Francisco: Fabricante líder de puertas de aluminio, ventanas, cancelería, manejo de vidrio, cancelería de vidrio, domos y más. Calidad y prestigio desde 1990 en San Francisco del Rincón."
        />

      </Head>

      {/* Header */}
      <header className="bg-blue-600 text-white">
        <div className="container mx-auto flex items-center justify-between py-4 px-6">
          <div className="flex items-center">
            <Image
              src="/aluminios.svg"
              alt="Logo de Aluminios San Francisco"
              width={200}
              height={614}
              className="w-16 h-16"
            />
            <h1 className="ml-4 text-xl font-bold">Aluminios San Francisco</h1>
          </div>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <a href="#servicios" className="hover:underline">
                  Servicios
                </a>
              </li>
              <li>
                <a href="#nosotros" className="hover:underline">
                  Nosotros
                </a>
              </li>
              <li>
                <a href="#contacto" className="hover:underline">
                  Contacto
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main>
        {/* Hero Section */}
        <section className="bg-blue-500 text-white text-center py-20">
          <h1 className="text-4xl font-bold">Bienvenidos a Aluminios San Francisco</h1>
          <p className="mt-4 text-lg">
            Calidad y prestigio en cada proyecto desde 1990
          </p>
        </section>

        {/* Servicios Section */}
        {/* Servicios Section */}
<section id="servicios" className="py-16 bg-gray-100">
  <div className="container mx-auto text-center">
    <h2 className="text-3xl font-bold mb-8 text-black">Nuestros Servicios</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <div className="bg-white shadow-md p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4 text-black">Puertas de Aluminio</h3>
        <p className="text-black">Soluciones modernas y duraderas para tu hogar y oficina.</p>
      </div>
      <div className="bg-white shadow-md p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4 text-black">Ventanas y Cancelería</h3>
        <p className="text-black">Diseños elegantes y funcionales para una óptima iluminación.</p>
      </div>
      <div className="bg-white shadow-md p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4 text-black">Vidrio y Cancelería de Vidrio</h3>
        <p className="text-black">Instalación profesional y materiales de alta calidad.</p>
      </div>
      <div className="bg-white shadow-md p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4 text-black">Domos Arquitectónicos</h3>
        <p className="text-black">Innovación y estilo en cada proyecto arquitectónico.</p>
      </div>
    </div>
  </div>
</section>

{/* Nosotros Section */}
<section id="nosotros" className="py-16 bg-white">
  <div className="container mx-auto text-center">
    <h2 className="text-3xl font-bold mb-8 text-black">Sobre Nosotros</h2>
    <p className="text-lg text-black">
      Desde 1990, Aluminios San Francisco se ha destacado por ofrecer productos de alta calidad y prestigio en San Francisco del Rincón.
      Nuestro compromiso es brindar soluciones en aluminio residencial y arquitectónico que cumplan con los más altos estándares.
    </p>
  </div>
</section>

{/* Contacto Section */}
<section id="contacto" className="py-16 bg-gray-100">
  <div className="container mx-auto text-center">
    <h2 className="text-3xl font-bold mb-8 text-black">Contacto</h2>
    <p className="text-lg mb-8 text-black">
      ¿Interesado en nuestros productos? Contáctanos para más información.
    </p>
    <form className="max-w-lg mx-auto space-y-4">
      <input
        type="text"
        name="nombre"
        placeholder="Nombre"
        required
        className="w-full p-3 border border-gray-300 rounded-lg text-black"
      />
      <input
        type="email"
        name="email"
        placeholder="Correo Electrónico"
        required
        className="w-full p-3 border border-gray-300 rounded-lg text-black"
      />
      <textarea
        name="mensaje"
        placeholder="Tu mensaje"
        required
        className="w-full p-3 border border-gray-300 rounded-lg text-black"
      ></textarea>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
      >
        Enviar
      </button>
    </form>
  </div>
</section>
      </main>

      {/* Footer */}
      <footer className="bg-blue-600 text-white py-6">
        <div className="container mx-auto text-center">
          <p>&copy; {new Date().getFullYear()} Aluminios San Francisco. Todos los derechos reservados.</p>
        </div>
      </footer>
    </>
  );
}