// Constants
const GA_COLLECT_ENDPOINT = 'https://www.google-analytics.com/g/collect';
const ANALYTICS_SCRIPT_URL = 'https://unpkg.com/@minimal-analytics/ga4/dist/index.js';

// CORS headers helper
const getCorsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
});

// Forward necessary headers
const getForwardHeaders = (headers, isImage) => {
  const headersToForward = {
    'user-agent': headers.get('user-agent'),
    'referer': headers.get('referer'),
    'dnt': headers.get('dnt')
  };

  if (!isImage) {
    headersToForward['sec-ch-ua'] = headers.get('sec-ch-ua');
    headersToForward['sec-ch-ua-mobile'] = headers.get('sec-ch-ua-mobile');
    headersToForward['sec-ch-ua-platform'] = headers.get('sec-ch-ua-platform');
  }

  return Object.fromEntries(Object.entries(headersToForward).filter(([_, v]) => v != null));
};

// Handle JS file modifications
async function handleScriptProxy(request) {
  const url = new URL(request.url);
  const fallback = url.searchParams.get('fallback');
  
  const response = await fetch(ANALYTICS_SCRIPT_URL);
  let script = await response.text();
  
  // Replace GA endpoint with our proxy
  script = script.replace(
    /https:\/\/www\.google-analytics\.com\/g\/collect/g,
    url.origin + url.pathname
  );

  /*
  ((url, searchParams) => {
  const fullUrl = `${url}?${new URLSearchParams(searchParams)}`;

  const tryMethods = [
    () => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(true); 
      img.onerror = reject;
      img.src = fullUrl;
    }),
    () => fetch(fullUrl, {
      method: 'POST',
      body: JSON.stringify(searchParams),
      keepalive: true 
    }).then(res => res.ok ? Promise.resolve(true) : Promise.reject()),
    () => navigator.sendBeacon(fullUrl, new FormData()) ? Promise.resolve(true) : Promise.reject()
  ];

  tryMethods.reduce((p, method) => p.catch(() => method()), Promise.reject());
  })(url,searchParams)
  */

  if (fallback) script = script.replace(/navigator\.sendBeacon\(`\${([^}]+)}\?\${([^}]+)}`\)/g, (_, urlParam, pParam) => 
  `((url,searchParams)=>{const fullUrl=\`\${url}?\${new URLSearchParams(searchParams)}\`;const tryMethods=[()=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(true);img.onerror=reject;img.src=fullUrl}),()=>fetch(fullUrl,{method:'POST',body:JSON.stringify(searchParams),keepalive:!0}).then(res=>res.ok?Promise.resolve(true):Promise.reject()),()=>navigator.sendBeacon(fullUrl,new FormData())?Promise.resolve(true):Promise.reject()];tryMethods.reduce((p,method)=>p.catch(()=>method()),Promise.reject())})(${urlParam},${pParam})`);

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
      ...getCorsHeaders(request.headers.get('Origin')),
    },
  });
}

// Handle GA4 data collection
async function handleGA4Collection(request, env, queryParams) {
  const url = new URL(GA_COLLECT_ENDPOINT);
  // Validate measurement ID
  if (!queryParams.tid || queryParams.tid !== env.MEASUREMENT_ID) {
    throw new Error('Invalid measurement ID');
  }

  // Add query parameters
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      ...getForwardHeaders(request.headers, request.headers.get('accept')?.includes('image')),
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`GA4 responded with ${response.status}`);
  }

  return response;
}

// Main handler
async function handleRequest(request, env) {
  try {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    // Handle script proxy requests
    if (url.searchParams.has('fallback')) {
      return handleScriptProxy(request);
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: getCorsHeaders(origin) });
    }

    // Only allow GET and POST
    if (!['GET', 'POST'].includes(request.method)) {
      throw new Error('Method not allowed');
    }

    // Get query parameters
    const queryParams = Object.fromEntries(url.searchParams);

    // Handle GA4 collection
    const gaResponse = await handleGA4Collection(request, env, queryParams);

    if (request.method === 'GET' && gaResponse.ok) {
      const imageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/gn/mkQAAAAASUVORK5CYII=';
      const imageData = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
      return new Response(imageData, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-store',
        }
      })
    }

    return new Response(await gaResponse.text(), {
      status: gaResponse.status,
      headers: {
        ...getCorsHeaders(origin),
        'Content-Type': gaResponse.headers.get('content-type') || 'text/plain',
        'Cache-Control': gaResponse.headers.get('cache-control') || 'no-store'
      }
    });

  } catch (error) {
    console.error('GA4 proxy error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal Server Error',
        timestamp: new Date().toISOString()
      }), {
        status: error.message === 'Invalid measurement ID' ? 403 : 500,
        headers: {
          ...getCorsHeaders(request.headers.get('Origin')),
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

export default {
  fetch: handleRequest,
};