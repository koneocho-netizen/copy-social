const CACHE="copy-social-v2";
const DB="copy-social-inbox";
const STORE="shared";
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(["./","./index.html","./manifest.webmanifest"]))));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));

function saveShared(payload){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB,1);
  req.onupgradeneeded=()=>req.result.createObjectStore(STORE);
  req.onerror=()=>reject(req.error);
  req.onsuccess=()=>{
   const db=req.result,tx=db.transaction(STORE,"readwrite");
   tx.objectStore(STORE).put(payload,"latest");
   tx.oncomplete=()=>{db.close();resolve()};
   tx.onerror=()=>reject(tx.error);
  };
 });
}
self.addEventListener("fetch",e=>{
 const u=new URL(e.request.url);
 if(e.request.method==="POST" && u.pathname.endsWith("/share-target")){
  e.respondWith((async()=>{
   try{
    const form=await e.request.formData();
    const images=form.getAll("images").filter(x=>x instanceof File && x.type.startsWith("image/"));
    const payload={
     title:String(form.get("title")||""),
     text:String(form.get("text")||""),
     url:String(form.get("url")||""),
     image:images[0]||null
    };
    await saveShared(payload);
    return Response.redirect(new URL("./?shared=1",self.registration.scope),303);
   }catch(err){
    return Response.redirect(new URL("./?share_error=1",self.registration.scope),303);
   }
  })());
  return;
 }
 if(e.request.method==="GET"){
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
 }
});