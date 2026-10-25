const prices={
"SS-MAHOGANY-TRIO":"price_1UUWj9QjUAwLUc01XF0WXuSU",
"SS-SCRUB-7":"price_1UEK4YQjUAwLUc01EP59yvqx",
"SS-SCRUB-11":"price_1UEK4fQjUAwLUc01j0kuNrdd",
"SS-SECOND-6":"price_1UEK4mQjUAwLUc01Eer8aH7D",
"SS-SECOND-10":"price_1UEKm1QjUAwLUc01E4Mmpz6b",
"SS-LIQSAT-2":"price_1UEKqVQjUAwLUc01VARuqzz2",
"SS-BALM-1":"price_1UEKqbQjUAwLUc01KNqmI3PL",
"SS-GIFT-COMPLETE":"price_1UEKtyQjUAwLUc016LNBoIHs",
"SS-SOAP-5":"price_1UEK4sQjUAwLUc01Eelqf3Zc",
"SS-BLISS-4":"price_1UEK4yQjUAwLUc01Ehl0m6v4",
"SS-FIRM-6":"price_1UEK54QjUAwLUc01ImpK8t09",
"SS-FIRM-10":"price_1UEK5AQjUAwLUc01x88cg4AN"
};
const corsOrigin="https://skinsessed.com";
const headers={"Content-Type":"application/json","Access-Control-Allow-Origin":corsOrigin,"Vary":"Origin","Cache-Control":"no-store"};
export default async function handler(req){
 if(req.method==="OPTIONS") return new Response(null,{status:204,headers:{...headers,"Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type"}});
 if(req.method==="GET")return new Response(JSON.stringify({ready:Boolean(Netlify.env.get("STRIPE_SECRET_KEY"))}),{status:200,headers});
 if(req.method!=="POST")return new Response(JSON.stringify({error:"Method not allowed"}),{status:405,headers});
 if(req.headers.get("origin")!==corsOrigin)return new Response(JSON.stringify({error:"Unrecognized origin"}),{status:403,headers});
 const key=Netlify.env.get("STRIPE_SECRET_KEY");
 if(!key)return new Response(JSON.stringify({error:"Secure checkout is not configured yet. Please contact SkinSessed."}),{status:503,headers});
 try {
  const body=await req.json();const items=body.items;
  if(!Array.isArray(items)||items.length<1||items.length>30)throw Error("Choose 1 to 30 cart items.");
  const params=new URLSearchParams();params.set("mode","payment");params.set("success_url","https://skinsessed.com/shop.html?checkout=success");params.set("cancel_url","https://skinsessed.com/shop.html?checkout=cancel");
  params.append("shipping_address_collection[allowed_countries][0]","US");
  params.append("shipping_options[0][shipping_rate_data][type]","fixed_amount");
  params.append("shipping_options[0][shipping_rate_data][fixed_amount][amount]","0");
  params.append("shipping_options[0][shipping_rate_data][fixed_amount][currency]","usd");
  params.append("shipping_options[0][shipping_rate_data][display_name]","Free U.S. shipping");
  let total=0;
  items.forEach((item,i)=>{
   if(!item||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>20)throw Error("Invalid quantity.");
   total+=item.quantity;if(total>30)throw Error("Maximum 30 items per order.");
   const sku=String(item.sku||"");const price=prices[sku];if(!price&&sku!=="SS-LIPSEAL-6")throw Error("Unknown product.");
   if(price)params.append(`line_items[${i}][price]`,price);
   else {
    params.append(`line_items[${i}][price_data][currency]`,"usd");
    params.append(`line_items[${i}][price_data][unit_amount]`,"1750");
    params.append(`line_items[${i}][price_data][product_data][name]`,"6 Lip Seals Lip Balm Collection");
   }
   params.append(`line_items[${i}][quantity]`,String(item.quantity));
   const choices=Array.isArray(item.scents)?item.scents:[];
   if(choices.length>12||choices.some(v=>typeof v!=="string"||v.length>80))throw Error("Invalid scent selections.");
   const note=sku+" x"+item.quantity+(choices.length?" — "+choices.join(", "):"");
   if(note.length>490)throw Error("Please shorten scent selections.");
   params.append(`metadata[item_${i+1}]`,note);
  });
  const result=await fetch("https://api.stripe.com/v1/checkout/sessions",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/x-www-form-urlencoded"},body:params.toString()});
  const data=await result.json();if(!result.ok||!data.url)throw Error("Stripe could not start checkout.");
  return new Response(JSON.stringify({url:data.url}),{status:200,headers});
 }catch(e){return new Response(JSON.stringify({error:e.message||"Checkout failed"}),{status:400,headers});}
}
