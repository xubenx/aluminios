const sitemapConfig = {
    siteUrl: 'https://aluminiosfr.vercel.app/', // Cambia esto por tu dominio
    generateRobotsTxt: true,
    exclude: ['/sistema/*','/sistema'], // Excluye todas las rutas bajo /sistema
    robotsTxtOptions: {
        policies: [
            { userAgent: '*', disallow: ['/sistema/*'] }, // Excluye /sistema del robots.txt
        ],
    },
};

export default sitemapConfig;