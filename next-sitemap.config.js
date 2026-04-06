/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://lfxorganizations.dev',
  generateRobotsTxt: true,
  outDir: './out',
};
