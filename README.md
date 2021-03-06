# node-ucwa
Setup a Http(s) server to proxy requests to UCWA via Node

# Purpose
UCWA exposes a frame-based mechanism for cross-domain communication for JavaScript which requires support for HTML5's [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage).  The iframe acts as a proxy between your application and UCWA and it will inject a header, **X-Ms-Origin**, which is checked against a cross-domain authorization list which is managed on the Lync Server.  In cases where the devleoper does not have easy access to make changes to the Lync Server there aren't many options on how to work through this restriction.

This solution intends to provide a way to proxy requests to UCWA without appending **X-Ms-Origin** which is the behavior seen in any language communicating with UCWA other than JavaScript.

# Version
- 1.0.4
  * Less restrictive Access-Control-Allow-Origin (*)
- 1.0.3
  * Fixed issue with Http server constructor not needing null as options parameter
  * Fixed issue with failing OPTIONS request missing CORS-related headers
  * Adding origin parameter to be used with Access-Control-Allow-Origin header
- 1.0.2
  * Fixed issue running node-ucwa from a script
  * Updating certificate for localhost
- 1.0.1
  * Removed dependency on express
  * Remove unused variables
  * Added redirects (307) when request isn't cased properly
  * Requests not to /proxy will fail 404
  * Non-POST requests to /proxy will result in 405
  * Code restructuring/cleanup
- 1.0.0
  * Initial Release

# How it Works
node> ucwa-proxy [--port --secure [--pfx --passphrase] --logging --origin]

- --port - port to host server on (default 4666)
- --secure - whether to host server as Http or Https (default true)
- --pfx - path to PKCS#12 certificate file (default ./certs/node-ucwa.pfx)
- --passphrase - optional certificate password (default '')
- --logging - logs the request object prior to proxying (default false)
- --origin - specify value for Access-Control-Allow-Origin header otherwise defaults to *

# Structuring Proxy Requests
The request format expected by /proxy is as follows:
```
{
  url - url to proxy
  method - Http verb (get, post, put, delete),
  headers - optional collection of headers to apply to proxied request,
  data - optional request body
}
```

Simple Get
```
{
  "url": "https://lyncdiscover.domain.com",
  "method": "get"
}
```

Simple Post
```
{
  "url": "https://lync.domain.com/ucwa/oauth/v1/applications",
  "method": "post",
  "headers": {
    "authorization": "Bearer cwt=..."
  },
  "data": {
    "userAgent": "node-ucwa",
    "endpointId": "node",
    "culture": "en-US"
  }
}
```

# Request Caveats
- If no **Content-Type** header is provided for the proxied request it is assumed that data refers to **application/json**.
- **Content-Length** does not need to be provided as it is calculated before sending based on the size of provided data object
- If the request fails and Node returns an error it is currently defaulting to responding as if a 404 occurred (probably not the most correct)

# Samples
Located in a **Samples** folder

Simple - Demonstration of proxying requests to UCWA including auto-discovery, authentication, application creation and deletion

# Dependencies
- [fs](https://nodejs.org/api/fs.html) - reading certificate files
- [minimist](https://www.npmjs.com/package/minimist) - commandline argument processing
- [http](https://nodejs.org/api/http.html)/[https](https://nodejs.org/api/https.html) - hosting proxy server and issuing requests/responses
- [url](https://nodejs.org/api/url.html) - url processing
