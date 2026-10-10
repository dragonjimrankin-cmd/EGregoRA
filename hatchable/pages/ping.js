/** GET /ping — a probe to learn what the platform routes. */
export const access = 'public';
export const methods = ['GET'];
export default async function (req, res) {
  res.setHeader('content-type', 'text/plain; charset=utf-8');
  return res.send('the pages router is alive — ' + new Date().toISOString());
}
