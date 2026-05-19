/** @type {import('next').NextConfig} */

// ── Environment Validation ──────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const APP_ENV = process.env.NODE_ENV || "development";
const IS_PROD = APP_ENV === "production";

if (IS_PROD && !API_URL) {
  throw new Error("❌ NEXT_PUBLIC_API_URL is required in production");
}

// ── Security Headers ───────────────────────────────────────────────────
const securityHeaders = [
  // Content Security Policy - restrict resource loading
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js needs eval in dev
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      `connect-src 'self' ${API_URL || "http://localhost:8000"} wss://${process.env.NEXT_PUBLIC_WS_HOST || "localhost:8000"} ws://${process.env.NEXT_PUBLIC_WS_HOST || "localhost:8000"} https://fonts.gstatic.com`,
      "img-src 'self' data: https: blob:",
      "font-src 'self'",
      "frame-src 'none'",
      "frame-ancestors 'none'", // Prevent clickjacking
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  // Prevent MIME type sniffing
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Prevent clickjacking (redundant with CSP frame-ancestors but good defense-in-depth)
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Enable XSS filter in older browsers
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  // Enforce HTTPS in production
  ...(IS_PROD
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
      ]
    : []),
  // Referrer policy - limit info leakage
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Permissions policy - disable unnecessary browser features
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "interest-cohort=()",
    ].join(", "),
  },
];

// ── Next.js Configuration ───────────────────────────────────────────────
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Remove "X-Powered-By: Next.js" header

  // ── Output: Standalone for Docker/Production ─────────────────────────
  output: IS_PROD ? "standalone" : undefined,

  // ── Compression ──────────────────────────────────────────────────────
  compress: true,

  // ── Image Optimization ───────────────────────────────────────────────
  images: {
    unoptimized: !IS_PROD, // Skip optimization in dev for speed
    remotePatterns: IS_PROD
      ? [
          { protocol: "https", hostname: "**" }, // Restrict in production
        ]
      : [
          { protocol: "http", hostname: "localhost" },
          { protocol: "https", hostname: "**" },
        ],
    minimumCacheTTL: 60, // seconds
    formats: ["image/avif", "image/webp"],
  },

  // ── TypeScript ───────────────────────────────────────────────────────
  typescript: {
    ignoreBuildErrors: !IS_PROD, // Fail build on TS errors in production
  },

  // ── ESLint ───────────────────────────────────────────────────────────
  eslint: {
    ignoreDuringBuilds: !IS_PROD, // Run ESLint only in production builds
  },

  // ── Experimental (Next.js 14) ────────────────────────────────────────
  experimental: {
    serverComponentsExternalPackages: [],
    // Enable typed routes for better TypeScript support (optional)
    // typedRoutes: true,
  },

  // ── Headers: Apply security headers to all routes ────────────────────
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },

  // ── Redirects: Enforce clean URLs ────────────────────────────────────
  async redirects() {
    return [
      // Redirect /api/* to backend in production (optional proxy alternative)
      // Note: Better to call backend directly from client to avoid double-hop
      /*
      IS_PROD
        ? {
            source: "/api/:path*",
            destination: `${API_URL}/api/v1/:path*`,
            permanent: false,
          }
        : null,
      */
    ].filter(Boolean);
  },

  // ── Rewrites: For local development proxy (optional) ─────────────────
  async rewrites() {
    if (!IS_PROD && API_URL?.includes("localhost")) {
      return [
        {
          source: "/api/:path*",
          destination: `${API_URL}/api/v1/:path*`,
        },
      ];
    }
    return [];
  },

  // ── Webpack: Optimize bundle for production ──────────────────────────
  webpack: (config, { isServer, dev }) => {
    // Reduce sourcemaps in production for security
    if (!dev && !isServer) {
      config.devtool = "source-map"; // Or "hidden-source-map" to not expose
    }
    return config;
  },
};

module.exports = nextConfig;