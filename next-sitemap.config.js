// next-sitemap config — run via "npm run sitemap"
/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://neontiers-simple.vercel.app",
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [{ userAgent: "*", allow: "/" }],
  },
  changefreq: "weekly",
  priority: 0.7,
  outDir: "./public",
};
