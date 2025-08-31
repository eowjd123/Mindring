import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // CJS 모듈 interop을 느슨하게 — __webpack_require__.n 이슈 완화
    esmExternals: 'loose',
    forceSwcTransforms: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  // TypeScript 및 ESLint 에러를 더 관대하게 처리
  typescript: {
    // 빌드 시 TypeScript 에러를 무시 (개발 중에만)
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  eslint: {
    // 빌드 시 ESLint 에러를 무시 (개발 중에만)
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
};

export default nextConfig;