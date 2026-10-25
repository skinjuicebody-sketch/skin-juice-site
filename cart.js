(async()=>{
"use strict";
const checkoutEndpoint="https://skinsessed-public-checkout.netlify.app/.netlify/functions/create-cart-checkout";
const directCheckoutLinks={
"SS-MAHOGANY-TRIO":"https://buy.stripe.com/4gMdRbba97YKbW0cFv6sw0d",
"SS-SCRUB-7":"https://buy.stripe.com/9B6aEZ5PP3Iu5xCfRH6sw00",
"SS-SCRUB-11":"https://buy.stripe.com/00wbJ36TTfrc6BGeND6sw01",
"SS-SECOND-6":"https://buy.stripe.com/dRmeVf4LLgvg1hmdJz6sw02",
"SS-SECOND-10":"https://buy.stripe.com/4gM7sN7XX7YKgcgcFv6sw07",
"SS-LIQSAT-2":"https://buy.stripe.com/4gMdRb5PP7YKf8c34V6sw08",
"SS-BALM-1":"https://buy.stripe.com/7sYdRb4LL5QC4tyfRH6sw09",
"SS-GIFT-COMPLETE":"https://buy.stripe.com/7sY00l0vv7YK4ty48Z6sw0a",
"SS-SOAP-5":"https://buy.stripe.com/8x26oJ4LLdj42lq8pf6sw04",
"SS-BLISS-4":"https://buy.stripe.com/8x26oJ4LLdj42lq8pf6sw04",
"SS-FIRM-6":"https://buy.stripe.com/14AcN70vvdj4bW048Z6sw05",
"SS-FIRM-10":"https://buy.stripe.com/7sY00l4LL1Am9NS0WN6sw06",
"SS-LIPSEAL-6":"https://buy.stripe.com/00waEZguta6SaRW34V6sw0c",
"SS-SOAP-5":"https://buy.stripe.com/7sYbJ37XXgvggcg5d36sw03",
"SS-FEATURE-OATMEAL-3":"https://buy.stripe.com/7sYbJ37XXgvggcg5d36sw03",
"SS-FEATURE-CUCUMBER-3":"https://buy.stripe.com/7sYbJ37XXgvggcg5d36sw03",
"SS-FEATURE-LINEN-3":"https://buy.stripe.com/7sYbJ37XXgvggcg5d36sw03",
"SS-FEATURE-BIRTHDAY-3":"https://buy.stripe.com/7sYbJ37XXgvggcg5d36sw03"
};
// Cart must initialize independently; checkout errors are shown only when purchasing.
const catalog=[
["SS-MAHOGANY-TRIO","Mahogany Teakwood Body Care Trio",1795,"mahogany-teakwood-trio",0],
["SS-SCRUB-7","7 oz Foaming Body Scrub",1199,"foaming-body-scrub-7oz",1],
["SS-SCRUB-11","11 oz Foaming Body Scrub",1699,"foaming-body-scrub-11oz",1],
["SS-SECOND-6","6 oz Second Skin Moisturizer",1399,"second-skin-moisturizer-6oz",1],
["SS-SECOND-10","10 oz Second Skin Moisturizer",1899,"second-skin-moisturizer-10oz",1],
["SS-LIQSAT-2","2 oz Liquid Satin Face Primer",1899,"liquid-satin-2oz",0],
["SS-BALM-1","1 oz Dessert Balm Glide Stick",1099,"dessert-balm-glide-stick-1oz",1],
["SS-GIFT-COMPLETE","Complete SkinSessed Gift Set",3800,"complete-skinsessed-gift-set",1],
["SS-SOAP-5","5 Palm-Size Goat Milk Soap Bars",1599,"goat-milk-soap-3-bar-set",5],
["SS-BLISS-4","4 Sculpted Bliss Massage Bars",1599,"sculpted-bliss-4-pack",4],
["SS-FIRM-6","6 oz Firming Complex",1499,"firming-complex-6oz",0],
["SS-FIRM-10","10 oz Firming Complex",2199,"firming-complex-10oz",0],
["SS-LIPSEAL-6","6 Lip Seals Lip Balm Collection",1750,"lip-seal-6-pack",6]
].map(([sku,name,cents,slug,choices])=>({sku,name,cents,slug,choices}));
catalog.push({sku:"SS-FEATURE-OATMEAL-3",name:"3 Full-Size Oatmeal Milk & Honey Goat Milk Soap Bars",cents:1475,slug:"",choices:0},{sku:"SS-FEATURE-CUCUMBER-3",name:"3 Full-Size Cucumber Melon Goat Milk Soap Bars",cents:1475,slug:"",choices:0},{sku:"SS-FEATURE-LINEN-3",name:"3 Full-Size Fresh Clean Linen Goat Milk Soap Bars",cents:1475,slug:"",choices:0},{sku:"SS-FEATURE-BIRTHDAY-3",name:"3 Birthday Cake Jumbo Goat Milk Soap Bars",cents:1775,slug:"",choices:0});
const scents=["Birthday Cake","Banana Pudding","Black Cherry Merlot","Blueberry Pound Cake","Caramel Nut Muffin","Cherry Vanilla Swirl","Chocolate Crème Truffle","Cinnamon Apples","Cranberry Cheesecake","Cucumber Melon","Fresh Clean Linen","Frosted Eucalyptus Mint","Kiwi Watermelon","Lemon Meringue","Mahogany Teakwood","Malibu Rum Cupcakes","Maple Pecan","Oatmeal Milk & Honey","Orange Chiffon Cake","Peaches & Cream","Raspberry Mimosa"];
const money=n=>"$"+(n/100).toFixed(2);
const storage="skinsessed-cart-v1";
let cart=[];try{const saved=JSON.parse(localStorage.getItem(storage)||"[]");if(Array.isArray(saved))cart=saved.filter(x=>catalog.some(p=>p.sku===x.sku)&&Number.isInteger(x.quantity)&&x.quantity>0&&x.quantity<=20).slice(0,30)}catch{}
const save=()=>{localStorage.setItem(storage,JSON.stringify(cart));render()};
const css=document.createElement("style");css.textContent=`
.ss-cart-launch{position:fixed;z-index:9997;right:18px;bottom:18px;border:0;border-radius:50px;padding:15px 22px;background:#a9284d;color:white;font:700 15px Georgia,serif;box-shadow:0 5px 20px #0003;cursor:pointer}
.ss-cart-panel{position:fixed;z-index:9998;inset:0;background:#15101099;display:none;align-items:center;justify-content:center;padding:14px}
.ss-cart-panel.open{display:flex}.ss-cart-box{background:#fffaf5;border-radius:18px;padding:24px;max-width:660px;width:100%;max-height:92vh;overflow:auto;font:18px Georgia,serif;color:#2a1d17}
.ss-cart-box h2{margin:0 0 12px;font-size:30px}.ss-cart-item{border-bottom:1px solid #decbb8;padding:15px 0}.ss-cart-item strong{display:block}
.ss-cart-box button{cursor:pointer}.ss-cart-box input{width:72px;padding:8px;margin:8px}.ss-cart-box select{display:block;width:100%;padding:10px;margin:7px 0;border:1px solid #aa9181;background:white;border-radius:6px;font-size:15px}
.ss-cart-checkout{background:#a9284d;color:white;border:0;border-radius:10px;padding:14px;width:100%;font-weight:bold;font-size:18px}
.ss-cart-close{float:right;background:none;border:0;font-size:28px}.ss-cart-muted{font-size:15px;color:#715a50}.ss-cart-add{cursor:pointer}
`;document.head.append(css);
const panel=document.createElement("div");panel.className="ss-cart-panel";panel.setAttribute("role","dialog");panel.setAttribute("aria-label","SkinSessed shopping cart");
const box=document.createElement("div");box.className="ss-cart-box";panel.append(box);document.body.append(panel);
const launch=document.createElement("button");launch.className="ss-cart-launch";launch.type="button";document.body.append(launch);
launch.onclick=()=>{panel.classList.add("open");render()};panel.onclick=e=>{if(e.target===panel)panel.classList.remove("open")};
document.addEventListener("keydown",e=>{if(e.key==="Escape")panel.classList.remove("open")});
function add(product){const current=cart.find(x=>x.sku===product.sku);if(current){if(current.quantity<20)current.quantity++}else{cart.push({sku:product.sku,quantity:1,scents:Array(product.choices).fill("")})}save();panel.classList.add("open")}
function render(){
launch.textContent="View Cart ("+cart.reduce((n,x)=>n+x.quantity,0)+")";
box.replaceChildren();
const head=document.createElement("h2");head.textContent="Your SkinSessed Cart";const close=document.createElement("button");close.className="ss-cart-close";close.textContent="×";close.setAttribute("aria-label","Close cart");close.onclick=()=>panel.classList.remove("open");box.append(close,head);
const subtitle=document.createElement("p");subtitle.className="ss-cart-muted";subtitle.textContent="Choose your items, then check out together. Free U.S. shipping.";box.append(subtitle);
if(!cart.length){const p=document.createElement("p");p.textContent="Your cart is empty.";box.append(p);return}
cart.forEach((item,index)=>{
const p=catalog.find(x=>x.sku===item.sku);const wrap=document.createElement("div");wrap.className="ss-cart-item";
const title=document.createElement("strong");title.textContent=p.name+" — "+money(p.cents*item.quantity);wrap.append(title);
const label=document.createElement("label");label.textContent="Quantity: ";const qty=document.createElement("input");qty.type="number";qty.min=1;qty.max=20;qty.value=item.quantity;qty.setAttribute("aria-label","Quantity for "+p.name);qty.onchange=()=>{item.quantity=Math.max(1,Math.min(20,parseInt(qty.value,10)||1));save()};label.append(qty);wrap.append(label);
const remove=document.createElement("button");remove.textContent="Remove";remove.onclick=()=>{cart.splice(index,1);save()};wrap.append(remove);
if(p.choices){const note=document.createElement("p");note.className="ss-cart-muted";note.textContent=p.choices===1?"Choose a scent for this product:":"Choose "+p.choices+" scents (one per included item):";wrap.append(note);
if(!Array.isArray(item.scents))item.scents=[];for(let j=0;j<p.choices;j++){const sel=document.createElement("select");sel.setAttribute("aria-label","Scent "+(j+1)+" for "+p.name);const placeholder=document.createElement("option");placeholder.textContent="Select scent "+(j+1);placeholder.value="";sel.append(placeholder);scents.forEach(name=>{const opt=document.createElement("option");opt.value=name;opt.textContent=name;sel.append(opt)});sel.value=item.scents[j]||"";sel.onchange=()=>{item.scents[j]=sel.value;localStorage.setItem(storage,JSON.stringify(cart))};wrap.append(sel)}}
box.append(wrap)
});
const total=document.createElement("h2");total.textContent="Subtotal: "+money(cart.reduce((n,x)=>n+catalog.find(p=>p.sku===x.sku).cents*x.quantity,0));box.append(total);
const checkout=document.createElement("button");checkout.className="ss-cart-checkout";checkout.textContent="Secure Checkout — All Items";const status=document.createElement("p");status.className="ss-cart-muted";status.setAttribute("role","status");box.append(checkout,status);
checkout.textContent="Secure Checkout — All Items";
checkout.onclick=()=>{for(const item of cart){const p=catalog.find(x=>x.sku===item.sku);if(p.choices&&(!Array.isArray(item.scents)||item.scents.slice(0,p.choices).some(s=>!s)||item.scents.length<p.choices)){status.textContent="Please choose all required scents for "+p.name+".";return}}const form=document.createElement("form");form.method="POST";form.action=checkoutEndpoint;form.style.display="none";const input=document.createElement("input");input.name="cart";input.value=JSON.stringify({items:cart});form.append(input);document.body.append(form);status.textContent="Opening combined Stripe checkout…";form.submit();
};
}
const featured=document.querySelector('#featured-mahogany-trio .featured-soap-cta');
if(featured){const product=catalog.find(p=>p.sku==="SS-MAHOGANY-TRIO");const addButton=document.createElement("button");addButton.type="button";addButton.className=featured.className+" ss-cart-add";addButton.textContent="Add to Cart · $17.95";addButton.onclick=()=>add(product);featured.replaceWith(addButton)}
document.querySelectorAll(".ss-home-sampler-add").forEach(button=>{const product=catalog.find(p=>p.sku===button.dataset.cartSku);if(product)button.addEventListener("click",()=>add(product))});
document.querySelectorAll(".ss-featured-add").forEach(button=>{const product=catalog.find(p=>p.sku===button.dataset.cartSku);if(product)button.addEventListener("click",()=>add(product))});
const isShop=location.pathname.endsWith("/shop.html");
if(isShop){document.querySelectorAll("article.card").forEach(card=>{const link=card.querySelector('a[href*="products/"]');if(!link)return;const slug=(link.getAttribute("href").split("/").pop()||"").replace(/\.html$/,"");const p=catalog.find(x=>x.slug===slug);if(!p)return;const button=card.querySelector("a.btn.primary");if(!button)return;const b=document.createElement("button");b.type="button";b.className=button.className+" ss-cart-add";b.textContent="Add to Cart";b.onclick=()=>add(p);button.replaceWith(b)})}
else {const slug=(location.pathname.split("/").pop()||"").replace(/\.html$/,"");const p=catalog.find(x=>x.slug===slug);if(p){const button=document.querySelector(".product-copy a.btn.primary");if(button){const b=document.createElement("button");b.type="button";b.className=button.className+" ss-cart-add";b.textContent="Add to Cart";b.onclick=()=>add(p);button.replaceWith(b)}}}
render();
})();