import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/search': ['./data/hts.normalized.json'],
    '/changelog': ['./CHANGELOG.md'],
  },
};

export default nextConfig;
