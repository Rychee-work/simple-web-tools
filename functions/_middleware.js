export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // pages.dev で来たアクセスだけを独自ドメインへ飛ばす
  if (url.hostname === "simple-web-tools.pages.dev") {
    return Response.redirect(
      "https://simple-web-tools.com" + url.pathname,
      301
    );
  }

  return next();
}
