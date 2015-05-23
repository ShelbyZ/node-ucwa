# node-ucwa
Setup a Http(s) server to proxy requests to UCWA via Node

# Purpose
UCWA exposes a frame-based mechanism for cross-domain communication for JavaScript which requires support for HTML5's postMessage, https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage.  The iframe acts as a proxy between your application and UCWA and it will inject a header, X-Ms-Origin, which is checked against a cross-domain authorization list which is managed on the Lync Server.  In cases where the devleoper does not have easy access to make changes to the Lync Server there aren't many options on how to work through this restriction.

This solution intends to provide a way to proxy requests to UCWA without appending 'X-Ms-Origin' which is the behavior seen in any language communicating with UCWA other than JavaScript.

# How it Works
node> ucwa-proxy [--port --secure [--pfx --passphrase] --logging]

--port - port to host server on (default 4666)
-- secure - whether to host server as Http or Https (default true)
-- pfx - Path to PKCS#12 certificate file (default ./certs/node-ucwa.pfx)
-- passphrase - optional certificate password (default '')
-- logging - logs the request object prior to proxying (default false)

# Structuring Proxy Requests
The request format expected by /proxy is as follows:
{
  url - url to proxy
  method - Http verb (get, post, put, delete),
  headers - optional collection of headers to apply to proxied request,
  data - optional request body
}

Simple Get
{
  "url": "https://lyncdiscover.domain.com",
  "method": "get"
}

Simple Post
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

# Request Caveats
- If no 'Content-Type' header is provided for the proxied request it is assumed that data refers to 'application/json'.
- 'Content-Length' does not need to be provided as it is calculated before sending based on the size of provided data object
- If the request fails and Node returns an error it is currently defaulting to responding as if a 404 occurred (probably not the most correct)

# Samples
Located in a 'Samples' folder

Simple - Demonstration of proxying requests to UCWA including auto-discovery, authentication, application creation and deletion

# Dependencies
fs - reading certificate files
minimist - commandline argument processing
http/https - hosting proxy server and issuing requests/responses
express - route mapping
url - url processing
