# GA4 Proxy Worker

This project is a Cloudflare Worker script designed to act as a proxy for Google Analytics 4 (GA4) data collection and provide additional features like modifying analytics script behavior. The script integrates and modifies the lightweight analytics script from the [Minimal Analytics](https://github.com/jahilldev/minimal-analytics) project to suit custom requirements.

## Features

1. **GA4 Proxy**: 
   - Proxies data to the GA4 collection endpoint, ensuring the `MEASUREMENT_ID` matches the one configured in the environment.

2. **Custom Analytics Script**: 
   - Fetches the analytics script from the [Minimal Analytics](https://github.com/jahilldev/minimal-analytics) project.
   - Modifies the script to replace the default GA4 endpoint with the worker’s proxy endpoint.
   - Adds a fallback mechanism for analytics data collection.

3. **CORS Support**: 
   - Handles cross-origin requests, including preflight OPTIONS requests.

4. **Flexible Data Handling**: 
   - Supports GET and POST requests for data collection.
   - Provides fallback methods for sending analytics data.

5. **Image Pixel Response**: 
   - Returns a transparent 1x1 image for successful GET requests, emulating traditional pixel tracking.

## Modifications to Original Script

This project integrates the analytics script from the Minimal Analytics project by [Jack Hill](https://github.com/jahilldev), which is licensed under the MIT License. Modifications include:
- Replacing the default Google Analytics endpoint with a custom proxy endpoint.
- Adding fallback logic for alternative methods of sending analytics data.

## Installation

1. **Setup Cloudflare Workers**:
   - Deploy the provided script using Cloudflare‘s dashboard or the Wrangler CLI.

2. **Environment Variables**:
   - Configure the following variable in your worker environment:
     - `MEASUREMENT_ID`: Your Google Analytics 4 measurement ID.

## Usage

### 1. Proxying Analytics Data
- Send GET or POST requests to the worker’s URL with query parameters required by GA4. The worker will forward the data to the GA4 endpoint.

### 2. Serving Modified Analytics Script
- Append the `?fallback=true` query parameter to the worker‘s URL to fetch the modified analytics script.

### Example Requests

#### Proxy Data Collection
```bash
curl -X POST https://<worker-url> \
  -H "Content-Type: application/json" \
  -d '{"tid":"G-XXXXXXX", "cid":"123456", "t":"event", "en":"test_event"}'
```

#### Fetch Modified Script
```bash
curl https://<worker-url>?fallback=true
```

## License

This project is licensed under the [MIT License](LICENSE).  
It integrates and modifies the analytics script from the Minimal Analytics project by [Jack Hill](https://github.com/jahilldev), which is also licensed under the [MIT License](LICENSE).
