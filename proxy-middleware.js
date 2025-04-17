/**
 * Proxy middleware to bypass CORS issues during web development
 * To use this, you would need to install http-proxy-middleware:
 * npm install --save-dev http-proxy-middleware
 * 
 * Then add it to your webpack config or development server setup
 */

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://10.10.1.7:8304',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api', // Keep the path as is
      },
      onProxyRes: function(proxyRes, req, res) {
        // Remove CORS headers from the proxied response to avoid conflicts
        delete proxyRes.headers['access-control-allow-origin'];
        delete proxyRes.headers['access-control-allow-methods'];
        delete proxyRes.headers['access-control-allow-headers'];
        
        // Add our own CORS headers
        proxyRes.headers['access-control-allow-origin'] = '*';
        proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['access-control-allow-headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
      }
    })
  );
}; 