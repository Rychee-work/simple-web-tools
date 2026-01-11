export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  const host = url.hostname;

  // pages.dev から独自ドメインへ強制
  if (host === "easy-web-tools.pages.dev") {
    url.hostname = "simple-web-tools.com";
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }

  // www → non-www もついでに強制
  if (host === "www.simple-web-tools.com") {
    url.hostname = "simple-web-tools.com";
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }

  return next();
}
