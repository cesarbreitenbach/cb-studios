export function renderDocument(p: {
  appHtml: string; head: string; dataJson: string; clientSrc: string;
}): string {
  const dataScript =
    `<script>window.__STUDIO__=${p.dataJson.replace(/</g, '\\u003c')}</script>`;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>${p.head}</head>
<body>
<div id="root">${p.appHtml}</div>
${dataScript}
<script type="module" src="${p.clientSrc}"></script>
</body>
</html>`;
}
