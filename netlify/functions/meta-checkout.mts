const PRICE_MAP: Record<string, string> = {
  'SS-SCRUB-7': 'price_1UEK4YQjUAwLUc01EP59yvqx',
  'SS-SCRUB-11': 'price_1UEK4fQjUAwLUc01j0kuNrdd',
  'SS-SECOND-6': 'price_1UEK4mQjUAwLUc01Eer8aH7D',
  'SS-SECOND-10': 'price_1UEKm1QjUAwLUc01E4Mmpz6b',
  'SS-LIQSAT-2': 'price_1UEKqVQjUAwLUc01VARuqzz2',
  'SS-BALM-1': 'price_1UEKqbQjUAwLUc01KNqmI3PL',
  'SS-GIFT-COMPLETE': 'price_1UEKtyQjUAwLUc016LNBoIHs',
  'SS-SOAP-3': 'price_1UEK4sQjUAwLUc01Eelqf3Zc',
  'SS-SOAP-5': 'price_1UEK4sQjUAwLUc01Eelqf3Zc',
  'SS-BLISS-4': 'price_1UEK4yQjUAwLUc01Ehl0m6v4',
  'SS-FIRM-6': 'price_1UEK54QjUAwLUc01ImpK8t09',
  'SS-FIRM-10': 'price_1UEK5AQjUAwLUc01x88cg4AN',
};

const SCENTED_IDS = new Set([
  'SS-SCRUB-7','SS-SCRUB-11','SS-SECOND-6','SS-SECOND-10','SS-BALM-1',
  'SS-GIFT-COMPLETE','SS-SOAP-3','SS-SOAP-5','SS-BLISS-4'
]);

function parseProducts(raw: string) {
  return raw.split(',').map((entry) => {
    const [rawId, rawQty = '1'] = entry.split(':');
    const id = decodeURIComponent((rawId || '').trim());
    const qty = Math.max(1, Math.min(99, Number.parseInt(rawQty, 10) || 1));
    return { id, qty };
  }).filter((item) => PRICE_MAP[item.id]);
}

export default async (req: Request) => {
  try {
    if (req.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(req.url);
    const rawProducts = (url.searchParams.get('products') || '').trim();
    if (!rawProducts) {
      return Response.redirect('https://skinsessed.com/shop.html', 302);
    }

    const items = parseProducts(rawProducts);
    if (!items.length) {
      return new Response('No valid SkinSessed products were supplied.', { status: 400 });
    }

    const secret = Netlify.env.get('STRIPE_SECRET_KEY');
    if (!secret) {
      return new Response('Checkout configuration is incomplete.', { status: 500 });
    }

    const body = new URLSearchParams();
    body.set('mode', 'payment');
    body.set('success_url', 'https://skinsessed.com/success.html?session_id={CHECKOUT_SESSION_ID}');
    body.set('cancel_url', 'https://skinsessed.com/shop.html');
    body.set('allow_promotion_codes', 'true');
    body.set('shipping_address_collection[allowed_countries][0]', 'US');
    body.set('metadata[source]', 'meta_shop');
    body.set('metadata[meta_products]', rawProducts.slice(0, 500));

    items.forEach((item, index) => {
      body.set(`line_items[${index}][price]`, PRICE_MAP[item.id]);
      body.set(`line_items[${index}][quantity]`, String(item.qty));
    });

    if (items.some((item) => SCENTED_IDS.has(item.id))) {
      body.set('custom_fields[0][key]', 'scentchoices');
      body.set('custom_fields[0][label][type]', 'custom');
      body.set('custom_fields[0][label][custom]', 'Scent choice(s) for scented items');
      body.set('custom_fields[0][type]', 'text');
      body.set('custom_fields[0][optional]', 'false');
      body.set('custom_fields[0][text][minimum_length]', '2');
      body.set('custom_fields[0][text][maximum_length]', '255');
    }

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const data = await stripeResponse.json() as { url?: string; error?: { message?: string } };
    if (!stripeResponse.ok || !data.url) {
      console.error('Stripe Checkout Session error:', data.error?.message || data);
      return new Response('Unable to create secure checkout.', { status: 502 });
    }

    return Response.redirect(data.url, 303);
  } catch (error) {
    console.error('Checkout function error:', error);
    return new Response('Unable to create secure checkout.', { status: 500 });
  }
};

export const config = {
  path: '/checkout',
};
