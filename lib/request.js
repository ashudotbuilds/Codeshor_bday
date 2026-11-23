export class InputError extends Error {}

export function requestOrigin(request) {
  const url = new URL(request.url);
  const hosted = ['preview', 'production'].includes(process.env.VERCEL_ENV);
  const protocol = hosted ? 'https:' : url.protocol;
  // Next can reconstruct request.url with its internal hostname.
  return protocol + '//' + (request.headers.get('host') ?? url.host);
}

export function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function post(request, action, onError) {
  try {
    const fetchSite = request.headers.get('sec-fetch-site');
    if (request.headers.get('origin') !== requestOrigin(request) ||
        (fetchSite && fetchSite !== 'same-origin')) return json({ error: 'Open Birthday Adda directly and try again.' }, 403);
    return await action();
  } catch (error) {
    if (error instanceof InputError) return json({ error: error.message }, 400);
    if (onError) return onError(error);
    console.error('Birthday Adda request failed:', error.code || error.name);
    return json({ error: 'Couldn’t save this right now. Your message is still in the form. Please try again.' }, 503);
  }
}

export async function readJson(request) {
  if (Number(request.headers.get('content-length')) > 1000000) throw new InputError('Choose a smaller photo.');
  const reader = request.body?.getReader();
  if (!reader) throw new InputError('Complete the form and try again.');
  const decoder = new TextDecoder();
  let raw = '';
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 1000000) {
      await reader.cancel();
      throw new InputError('Choose a smaller photo.');
    }
    raw += decoder.decode(value, { stream: true });
  }
  try {
    const data = JSON.parse(raw + decoder.decode());
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error();
    return data;
  } catch {
    throw new InputError('We couldn’t read the form. Try again.');
  }
}

export function textField(value, label, max, optional = false) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text && !optional) throw new InputError('Enter ' + label + '.');
  if (text.length > max) throw new InputError('Use ' + max + ' characters or fewer for ' + label + '.');
  return text;
}

export function photoField(value) {
  if (!value) return null;
  if (typeof value !== 'string' || value.length > 850000 ||
      !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    throw new InputError('Choose a JPG, PNG, or WebP photo under 10 MB.');
  }
  return value;
}
