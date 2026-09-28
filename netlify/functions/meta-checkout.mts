const PRICE_MAP: Record<string, string> = {
  'SS-SCRUB-7': 'price_1UEK4YQjUAwLUc01EP59yvqx',
  'SS-SCRUB-11': 'price_1UEK4fQjUAwLUc01j0kuNrdd',
  'SS-SECOND-6': 'price_1UEK4mQjUAwLUc01Eer8aH7D',
  'SS-SECOND-10': 'price_1UEKm1QjUAwLUc01E4Mmpz6b',
  'SS-LIQSAT-2': 'price_1UEKqVQjUAwLUc01VARuqzz2',
  'bee70m5mum': 'price_1UEKqVQjUAwLUc01VARuqzz2',
  'SS-BALM-1': 'price_1UEKqbQjUAwLUc01KNqmI3PL',
  'SS-GIFT-COMPLETE': 'price_1UEKtyQjUAwLUc016LNBoIHs',
  'SS-SOAP-3': 'price_1UEK4sQjUAwLUc01Eelqf3Zc',
  'SS-SOAP-5': 'price_1UEK4sQjUAwLUc01Eelqf3Zc',
  'SS-LIPSEAL-6': 'price_1UKUv8QjUAwLUc01lm2mI0Az',
  'SS-BLISS-4': 'price_1UEK4yQjUAwLUc01Ehl0m6v4',
  'SS-FIRM-6': 'price_1UEK54QjUAwLUc01ImpK8t09',
  'SS-FIRM-10': 'price_1UEK5AQjUAwLUc01x88cg4AN',
};

const PRODUCT_NAMES: Record<string, string> = {
  'SS-SCRUB-7': '7 oz Foaming Body Scrub',
  'SS-SCRUB-11': '11 oz Foaming Body Scrub',
  'SS-SECOND-6': '6 oz Second Skin Moisturizer',
  'SS-SECOND-10': '10 oz Second Skin Moisturizer',
  'SS-BALM-1': '1 oz Dessert Balm Glide Stick',
  'SS-GIFT-COMPLETE': 'Complete SkinSessed Gift Set',
  'SS-SOAP-3': '3 Palm-Size Goat Milk Soap Bars',
  'SS-SOAP-5': '5 Palm-Size Goat Milk Soap Bars',
  'SS-BLISS-4': '4 Sculpted Bliss Massage Bars',
  'SS-LIPSEAL-6': '6 Lip Seals Lip Balm Collection',
  'SS-LIPSEAL-6': '6 Lip Seals Lip Balm Collection',
};

const SCENTED_IDS = new Set([
  'SS-SCRUB-7', 'SS-SCRUB-11', 'SS-SECOND-6', 'SS-SECOND-10', 'SS-BALM-1',
  'SS-GIFT-COMPLETE', 'SS-SOAP-3', 'SS-SOAP-5', 'SS-BLISS-4', 'SS-LIPSEAL-6',
]);

const SCENT_OPTIONS = [
  'Birthday Cake',
  'Black Cherry Merlot',
  'Blueberry Pound Cake',
  'Caramel Nut Muffin',
  'Cherry Vanilla Swirl',
  'Cucumber Melon',
  'Fresh Clean Linen',
  'Frosted Eucalyptus Mint',
  'Kiwi Watermelon',
  'Lemon Meringue Pie',
  'Malibu Rum Cupcakes',
  'Maple Pecan',
  'Oatmeal Milk & Honey',
  'Orange Chiffon Cake',
  'Peaches & Cream',
  'Raspberry Mimosa',
];

const GIFT_SCENT_OPTIONS = [
  'Cucumber Melon',
  'Oatmeal Milk & Honey',
  'Peaches & Cream',
  'Blueberry Pound Cake',
];

type CartItem = { id: string; qty: number };
type ScentSpec = { key: string; label: string; required: boolean; options: string[] };

function parseProducts(raw: string): CartItem[] {
  return raw.split(',').map((entry) => {
    const [rawId, rawQty = '1'] = entry.split(':');
    const id = decodeURIComponent((rawId || '').trim());
    const qty = Math.max(1, Math.min(99, Number.parseInt(rawQty, 10) || 1));
    return { id, qty };
  }).filter((item) => PRICE_MAP[item.id]);
}

function getScentCount(id: string): number {
  if (id === 'SS-SOAP-5') return 5;
  if (id === 'SS-LIPSEAL-6') return 6;
  return 1;
}

function getScentSpecs(items: CartItem[]): ScentSpec[] {
  const specs: ScentSpec[] = [];
  items.forEach((item, itemIndex) => {
    if (!SCENTED_IDS.has(item.id)) return;
    const perUnit = getScentCount(item.id);
    const options = item.id === 'SS-GIFT-COMPLETE' ? GIFT_SCENT_OPTIONS : SCENT_OPTIONS;
    for (let unit = 1; unit <= item.qty; unit += 1) {
      for (let slot = 1; slot <= perUnit; slot += 1) {
        let detail = '';
        if (item.id === 'SS-SOAP-5') detail = ', bar ' + slot;
        if (item.id === 'SS-LIPSEAL-6') detail = ', Lip Seal ' + slot;
        specs.push({
          key: 'scent-' + itemIndex + '-' + unit + '-' + slot,
          label: (PRODUCT_NAMES[item.id] || item.id) + ' #' + unit + detail,
          required: item.id !== 'SS-LIPSEAL-6' || slot === 1,
          options,
        });
      }
    }
  });
  return specs;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char] || char);
}

function buildScentPage(rawProducts: string, items: CartItem[]): string {
  const config = items.map((item) => ({
    id: item.id,
    qty: item.qty,
    name: PRODUCT_NAMES[item.id] || item.id,
    scentCount: SCENTED_IDS.has(item.id) ? getScentCount(item.id) : 0,
    options: item.id === 'SS-GIFT-COMPLETE' ? GIFT_SCENT_OPTIONS : SCENT_OPTIONS,
    optionalAfterFirst: item.id === 'SS-LIPSEAL-6',
  }));
  const json = JSON.stringify(config).replace(/</g, '\\u003c');
  const paragraphs = items.map((item) => {
    const title = escapeHtml(PRODUCT_NAMES[item.id] || item.id);
    return '<li>' + title + ' · Qty ' + item.qty + '</li>';
  }).join('');

  return '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Choose Your Scents | SkinSessed</title>' +
    '<style>' +
    ':root{--cream:#fff8ef;--cream2:#f7eadb;--deep:#2a1d17;--berry:#a9284d;--gold:#c6943f}' +
    '*{box-sizing:border-box}body{margin:0;padding:24px 16px;background:linear-gradient(180deg,var(--cream),var(--cream2));color:var(--deep);font-family:Georgia,serif}' +
    '.wrap{max-width:720px;margin:0 auto}.brand{text-align:center;color:var(--berry);font-size:30px;font-weight:bold;margin:20px 0 28px}' +
    '.card{background:#fff;border:1px solid rgba(198,148,63,.45);border-radius:22px;padding:26px;box-shadow:0 14px 38px rgba(42,29,23,.1)}' +
    'h1{font-size:clamp(28px,7vw,40px);line-height:1.1;margin:0 0 12px;text-align:center}.intro{font-size:18px;line-height:1.45;color:#59473e;text-align:center}' +
    '.order{padding:14px 18px;margin:22px 0;background:#fff9f2;border-radius:14px;line-height:1.7}.row{padding:17px 0;border-top:1px solid #eee0cc}' +
    '.row h2{font-size:20px;margin:0 0 9px}.unit{margin:12px 0;padding:12px;background:#fffaf5;border-radius:12px}.unit label,.qty label{display:block;font-size:16px;font-weight:bold;margin-bottom:7px}' +
    'select,input{width:100%;min-height:48px;padding:10px 12px;border:1px solid #cdb98f;border-radius:10px;background:#fff;color:#2a1d17;font-size:16px}' +
    '.qty{max-width:170px;margin:14px 0}.hint{color:#67584f;line-height:1.45}.button{width:100%;border:0;border-radius:999px;background:linear-gradient(100deg,#a9284d,#c44b67);color:white;padding:16px;font-size:18px;font-weight:bold;margin-top:20px}' +
    '.button:disabled{opacity:.55}.error{color:#9e173c;font-weight:bold}.back{display:block;text-align:center;margin:20px;color:var(--berry);font-weight:bold}' +
    '</style></head><body><main class="wrap"><div class="brand">SkinSessed</div><section class="card">' +
    '<h1>Choose a scent for each item</h1>' +
    '<p class="intro">If you order more than one, choose each item’s scent separately. Your choices will be saved with your order before secure Stripe payment.</p>' +
    '<ul class="order">' + paragraphs + '</ul>' +
    '<form id="scent-form"><div id="items"></div><p id="form-error" class="error" role="alert"></p>' +
    '<p class="hint">Lip Seal sets: choose at least one scent; add up to six different choices.</p>' +
    '<button class="button" type="submit">Continue to secure payment</button></form></section>' +
    '<a class="back" href="https://skinsessed.com/shop.html">Return to SkinSessed Shop</a>' +
    '<script id="checkout-data" type="application/json">' + json + '</script>' +
    '<script>(function(){' +
    'const config=JSON.parse(document.getElementById("checkout-data").textContent);' +
    'const form=document.getElementById("scent-form");const host=document.getElementById("items");const error=document.getElementById("form-error");' +
    'function render(){const prior=Object.fromEntries(new FormData(form));host.innerHTML="";let count=0;' +
    'config.forEach(function(item,itemIndex){const row=document.createElement("section");row.className="row";' +
    'const title=document.createElement("h2");title.textContent=item.name;row.appendChild(title);' +
    'if(item.scentCount>0){const qtyWrap=document.createElement("div");qtyWrap.className="qty";const qtyLabel=document.createElement("label");qtyLabel.textContent="Quantity";qtyLabel.htmlFor="qty-"+itemIndex;qtyWrap.appendChild(qtyLabel);' +
    'const qty=document.createElement("input");qty.type="number";qty.min="1";qty.max="99";qty.step="1";qty.id="qty-"+itemIndex;qty.name="qty-"+itemIndex;qty.value=String(item.qty);qtyWrap.appendChild(qty);row.appendChild(qtyWrap);' +
    'qty.addEventListener("input",function(){const saved=Object.fromEntries(new FormData(form));item.qty=Math.max(1,Math.min(99,parseInt(qty.value,10)||1));render();Object.keys(saved).forEach(function(key){const el=form.elements.namedItem(key);if(el)el.value=saved[key];});});' +
    'for(let unit=1;unit<=item.qty;unit++){for(let slot=1;slot<=item.scentCount;slot++){count++;const key="scent-"+itemIndex+"-"+unit+"-"+slot;const box=document.createElement("div");box.className="unit";const label=document.createElement("label");label.htmlFor=key;' +
    'let suffix=item.scentCount>1?(item.id==="SS-SOAP-5"?" · Bar "+slot:" · Lip Seal "+slot):"";label.textContent=item.name+" #"+unit+suffix+" — choose scent";box.appendChild(label);' +
    'const select=document.createElement("select");select.id=key;select.name=key;const optional=item.optionalAfterFirst&&slot>1;select.required=!optional;' +
    'const blank=document.createElement("option");blank.value="";blank.textContent=optional?"No additional scent":"Select a scent";select.appendChild(blank);' +
    'item.options.forEach(function(option){const opt=document.createElement("option");opt.value=option;opt.textContent=option;select.appendChild(opt);});' +
    'if(prior[key])select.value=prior[key];box.appendChild(select);row.appendChild(box);}}}host.appendChild(row);});' +
    'if(count>48){error.textContent="This order has more than 48 scent selections. Please split it into two checkouts.";form.querySelector("button").disabled=true;}else{error.textContent="";form.querySelector("button").disabled=false;}}' +
    'render();form.addEventListener("submit",async function(event){event.preventDefault();error.textContent="";const button=form.querySelector("button");button.disabled=true;button.textContent="Preparing secure checkout…";' +
    'const selections={};form.querySelectorAll("select").forEach(function(select){selections[select.name]=select.value;});' +
    'const rawProducts=config.map(function(item,index){return item.id+":"+item.qty;}).join(",");' +
    'try{const response=await fetch(window.location.pathname,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({rawProducts:rawProducts,selections:selections})});' +
    'const data=await response.json();if(!response.ok||!data.url)throw new Error(data.error||"Unable to prepare checkout.");window.location.assign(data.url);' +
    '}catch(err){error.textContent=err.message||"Unable to prepare checkout. Please try again.";button.disabled=false;button.textContent="Continue to secure payment";}});' +
    '})();</script></main></body></html>';
}

async function createCheckoutSession(rawProducts: string, items: CartItem[], scents: Record<string, string> = {}): Promise<Response> {
  const secret = Netlify.env.get('STRIPE_SECRET_KEY');
  if (!secret) return new Response('Checkout configuration is incomplete.', { status: 500 });

  const body = new URLSearchParams();
  body.set('mode', 'payment');
  body.set('success_url', 'https://skinsessed.com/success.html?session_id={CHECKOUT_SESSION_ID}');
  body.set('cancel_url', 'https://skinsessed.com/shop.html');
  body.set('allow_promotion_codes', 'true');
  body.set('shipping_address_collection[allowed_countries][0]', 'US');
  body.set('metadata[source]', 'meta_shop');
  body.set('payment_intent_data[metadata][source]', 'skinsessed_checkout');
  body.set('metadata[meta_products]', rawProducts.slice(0, 500));

  items.forEach((item, index) => {
    body.set('line_items[' + index + '][price]', PRICE_MAP[item.id]);
    body.set('line_items[' + index + '][quantity]', String(item.qty));
  });

  const specs = getScentSpecs(items);
  let scentIndex = 0;
  for (const spec of specs) {
    const choice = scents[spec.key] || '';
    if (spec.required && !choice) {
      return Response.json({ error: 'Choose a scent for every item before continuing.' }, { status: 400 });
    }
    if (choice && !spec.options.includes(choice)) {
      return Response.json({ error: 'One of the scent choices is invalid. Please choose again.' }, { status: 400 });
    }
    if (choice) {
      scentIndex += 1;
      const selection = spec.label + ': ' + choice;
      body.set('metadata[scent_' + scentIndex + ']', selection);
      body.set('payment_intent_data[metadata][scent_' + scentIndex + ']', selection);
    }
  }

  const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + secret,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const data = await stripeResponse.json() as { url?: string; error?: { message?: string } };
  if (!stripeResponse.ok || !data.url) {
    console.error('Stripe Checkout Session error:', data.error?.message || data);
    return new Response('Unable to create secure checkout.', { status: 502 });
  }

  return Response.json({ url: data.url });
}

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    if (req.method === 'GET') {
      const rawProducts = (url.searchParams.get('products') || '').trim();
      if (!rawProducts) return Response.redirect('https://skinsessed.com/shop.html', 302);
      const items = parseProducts(rawProducts);
      if (!items.length) return new Response('No valid SkinSessed products were supplied.', { status: 400 });
      if (items.some((item) => SCENTED_IDS.has(item.id))) {
        return new Response(buildScentPage(rawProducts, items), {
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
        });
      }
      const checkout = await createCheckoutSession(rawProducts, items);
      if (!checkout.ok) return checkout;
      const data = await checkout.json() as { url?: string };
      if (!data.url) return new Response('Unable to create secure checkout.', { status: 502 });
      return Response.redirect(data.url, 303);
    }

    if (req.method === 'POST') {
      const input = await req.json() as { rawProducts?: string; selections?: Record<string, string> };
      const rawProducts = (input.rawProducts || '').trim();
      const items = parseProducts(rawProducts);
      if (!items.length) return Response.json({ error: 'No valid SkinSessed products were supplied.' }, { status: 400 });
      const expected = getScentSpecs(items);
      const supplied = input.selections || {};
      if (Object.keys(supplied).length !== expected.length) {
        return Response.json({ error: 'Choose a scent for every item before continuing.' }, { status: 400 });
      }
      if (expected.length > 48) {
        return Response.json({ error: 'This order has more than 48 scent selections. Please split it into two checkouts.' }, { status: 400 });
      }
      return createCheckoutSession(rawProducts, items, supplied);
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    console.error('Checkout function error:', error);
    return new Response('Unable to create secure checkout.', { status: 500 });
  }
};

export const config = {
  path: '/checkout',
};
