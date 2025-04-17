# SPC Analysis App

## CORS Issues Fix for Web Platform

If you're experiencing CORS issues when running the app on the web platform (material loading working on mobile but not on web), here are the solutions:

### Solution 1: Use a development proxy

1. Install the http-proxy-middleware package:
```bash
npm install --save-dev http-proxy-middleware
```

2. Configure Expo to use the proxy middleware:
   - For Expo development server, you can use the `proxy-middleware.js` file included in this repository.
   - Add this to your package.json scripts:
   ```json
   "dev:web": "EXPO_NO_TELEMETRY=1 expo start --web"
   ```

3. Start your development server with the proxy enabled:
```bash
npm run dev:web
```

### Solution 2: Configure the backend server

If you have access to the backend server (http://10.10.1.7:8304/api), add proper CORS headers:

```
Access-Control-Allow-Origin: *  # Or your specific domain
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization
```

### Solution 3: Use a browser extension

For testing purposes, you can use a browser extension like "CORS Unblock" or "Allow CORS" to temporarily disable CORS restrictions in your browser.

### Technical Details of the Issue

The issue occurs because:

1. Web browsers enforce Same-Origin Policy which mobile apps don't
2. The API server at http://10.10.1.7:8304/api does not include proper CORS headers in its responses
3. Our axios request configuration works on mobile but needs adjustments for web browsers

The fixes implemented in the code modify the headers based on the platform and add better error handling specifically for web requests. 