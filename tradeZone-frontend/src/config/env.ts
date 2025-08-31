export const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',
} as const;

// Debug log to check if environment variables are loaded
console.log('🔧 Environment Debug:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL ? 'FOUND' : 'MISSING',
  VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY ? 'FOUND' : 'MISSING',
  configApiKey: config.OPENAI_API_KEY ? 'FOUND' : 'MISSING'
});

export default config;
