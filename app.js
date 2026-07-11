'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const els={input:$('#photoInput'),empty:$('#emptyState'),editor:$('#editor'),canvas:$('#preview'),wrap:$('#previewWrap'),reset:$('#resetBtn'),save:$('#saveBtn'),compare:$('#compareBtn'),rendering:$('#rendering'),toast:$('#toast'),intensity:$('#intensity'),intensityOut:$('#intensityOut'),presetList:$('#presetList')};
const ctx=els.canvas.getContext('2d',{alpha:false});
const presets=[
 {id:'clean',name:'Clean',note:'Natural',v:{}},
 {id:'classic',name:'Classic 400',note:'Fuji-inspired',v:{contrast:12,saturation:-7,warmth:4,fade:5,grain:10}},
 {id:'velvia',name:'Vivid Chrome',note:'Fuji-inspired',v:{contrast:16,saturation:24,vibrance:18,warmth:3,highlights:-8,shadows:-6,grain:5}},
 {id:'eterna',name:'Cinema Soft',note:'Fuji-inspired',v:{contrast:-12,saturation:-16,warmth:-2,fade:12,highlights:-18,shadows:14,grain:8}},
 {id:'acros',name:'Mono Grain',note:'B&W-inspired',v:{mono:100,contrast:22,shadows:-8,grain:22}},
 {id:'positive',name:'Positive Film',note:'Ricoh-inspired',v:{contrast:18,saturation:8,warmth:7,highlights:-12,shadows:-10,grain:9}},
 {id:'negative',name:'Negative Film',note:'Ricoh-inspired',v:{contrast:-3,saturation:-8,warmth:12,fade:9,highlights:-18,shadows:16,grain:13}}
];
const controls={
 light:[['exposure','แสง','-100','100'],['brightness','ความสว่าง','-100','100'],['contrast','ความเปรียบต่าง','-100','100'],['highlights','ส่วนสว่าง','-100','100'],['shadows','เงา','-100','100']],
 color:[['saturation','ความอิ่มสี','-100','100'],['vibrance','ความสดใส','-100','100'],['warmth','อุณหภูมิสี','-100','100'],['tint','Tint','-100','100']],
 effects:[['sharpness','ความคมชัด','0','100'],['fade','Fade','0','100'],['vignette','ขอบมืด','0','100'],['grain','เกรนฟิล์ม','0','100']]
};
let image=null,sourceURL='',activePreset='classic',state={},timer=0,compare=false,working=false;
const defaults=()=>Object.fromEntries(Object.values(controls).flat().map(([k])=>[k,0]));
function buildUI(){
 els.presetList.innerHTML=presets.map(p=>`<button class="preset ${p.id===activePreset?'active':''}" data-preset="${p.id}">${p.name}<small>${p.note}</small></button>`).join('');
 for(const [tab,items] of Object.entries(controls)) $('#'+tab).innerHTML=items.map(([k,label,min,max])=>`<div class="slider-row"><label><span>${label}</span><output id="${k}Out">0</output></label><input data-control="${k}" type="range" min="${min}" max="${max}" value="0"></div>`).join('');
}
buildUI(); state=defaults();
function toast(msg){els.toast.textContent=msg;els.toast.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>els.toast.classList.remove('show'),2200)}
function readFile(file){if(!file)return;if(!file.type.startsWith('image/'))return toast('กรุณาเลือกไฟล์ภาพ');if(sourceURL)URL.revokeObjectURL(sourceURL);sourceURL=URL.createObjectURL(file);const im=new Image();im.onload=()=>{image=im;els.empty.hidden=true;els.editor.hidden=false;els.reset.disabled=false;resetAll(false);fitPreview();toast('โหลดภาพแล้ว')};im.onerror=()=>toast('ไม่สามารถเปิดภาพนี้ได้');im.src=sourceURL}
els.input.addEventListener('change',e=>readFile(e.target.files[0]));
function fitPreview(){if(!image)return;const dpr=Math.min(devicePixelRatio||1,2);const maxW=els.wrap.clientWidth*dpr,maxH=els.wrap.clientHeight*dpr;const scale=Math.min(maxW/image.naturalWidth,maxH/image.naturalHeight,1);els.canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));els.canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));render(els.canvas,ctx,false)}
addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(fitPreview,150)});
function combined(){const p=presets.find(x=>x.id===activePreset).v,m=+els.intensity.value/100,out={...state};for(const [k,v] of Object.entries(p))out[k]=(out[k]||0)+v*m;return out}
function render(canvas,c,full){if(!image)return;const v=compare?defaults():combined(),w=canvas.width,h=canvas.height;c.save();c.clearRect(0,0,w,h);const bright=100+(v.brightness||0)+(v.exposure||0)*.72,cont=100+(v.contrast||0),sat=100+(v.saturation||0)+(v.vibrance||0)*.55,sepia=Math.max(0,v.warmth||0)*.22,hue=(v.tint||0)*.18;c.filter=`brightness(${Math.max(5,bright)}%) contrast(${Math.max(5,cont)}%) saturate(${Math.max(0,sat)}%) sepia(${sepia}%) hue-rotate(${hue}deg) grayscale(${v.mono||0}%)`;c.drawImage(image,0,0,w,h);c.filter='none';
 if(v.highlights||v.shadows){c.globalCompositeOperation=v.highlights>0||v.shadows>0?'screen':'multiply';c.globalAlpha=Math.min(.24,(Math.abs(v.highlights||0)+Math.abs(v.shadows||0))/700);c.fillStyle=v.highlights>0||v.shadows>0?'#fff':'#000';c.fillRect(0,0,w,h);c.globalCompositeOperation='source-over'}
 if(v.fade>0){c.globalAlpha=v.fade/500;c.fillStyle='#d9cdb8';c.fillRect(0,0,w,h)}
 if(v.vignette>0){const g=c.createRadialGradient(w/2,h/2,Math.min(w,h)*.18,w/2,h/2,Math.max(w,h)*.7);g.addColorStop(0,'transparent');g.addColorStop(1,`rgba(0,0,0,${Math.min(.75,v.vignette/130)})`);c.globalAlpha=1;c.fillStyle=g;c.fillRect(0,0,w,h)}
 if(v.grain>0){const amount=Math.round((full?Math.min(w*h,2200000):w*h)*Math.min(.045,v.grain/1400));const seed=(w*31+h*17)%2147483647;let n=seed;const id=c.getImageData(0,0,w,h),d=id.data;for(let i=0;i<amount;i++){n=n*16807%2147483647;const px=(n%(w*h))*4;n=n*16807%2147483647;const noise=((n%33)-16)*(v.grain/100);d[px]+=noise;d[px+1]+=noise;d[px+2]+=noise}c.putImageData(id,0,0)}
 c.globalAlpha=1;c.restore()}
function schedule(){clearTimeout(timer);timer=setTimeout(()=>render(els.canvas,ctx,false),35)}
document.addEventListener('input',e=>{const k=e.target.dataset.control;if(k){state[k]=+e.target.value;$('#'+k+'Out').value=e.target.value;schedule()}if(e.target===els.intensity){els.intensityOut.value=e.target.value;schedule()}});
els.presetList.addEventListener('click',e=>{const b=e.target.closest('[data-preset]');if(!b)return;activePreset=b.dataset.preset;$$('.preset').forEach(x=>x.classList.toggle('active',x===b));schedule()});
$$('.tabs button').forEach(b=>b.onclick=()=>{$$('.tabs button').forEach(x=>x.classList.toggle('active',x===b));$$('.panel').forEach(x=>x.classList.toggle('active',x.id===b.dataset.tab))});
function resetAll(note=true){state=defaults();activePreset='classic';els.intensity.value=75;els.intensityOut.value=75;$$('[data-control]').forEach(x=>{x.value=0;$('#'+x.dataset.control+'Out').value=0});$$('.preset').forEach(x=>x.classList.toggle('active',x.dataset.preset===activePreset));schedule();if(note)toast('รีเซ็ตแล้ว')}
els.reset.onclick=()=>resetAll();
const showOriginal=on=>{compare=on;els.compare.querySelector('span').textContent=on?'กำลังดูต้นฉบับ':'กดดูต้นฉบับ';render(els.canvas,ctx,false)};
['pointerdown','touchstart'].forEach(ev=>els.compare.addEventListener(ev,e=>{e.preventDefault();showOriginal(true)},{passive:false}));['pointerup','pointercancel','pointerleave','touchend'].forEach(ev=>els.compare.addEventListener(ev,()=>showOriginal(false)));
async function save(){if(!image||working)return;working=true;els.rendering.hidden=false;try{const max=4096,scale=Math.min(1,max/Math.max(image.naturalWidth,image.naturalHeight)),out=document.createElement('canvas');out.width=Math.round(image.naturalWidth*scale);out.height=Math.round(image.naturalHeight*scale);render(out,out.getContext('2d',{alpha:false}),true);const blob=await new Promise(r=>out.toBlob(r,'image/jpeg',.94));const file=new File([blob],`FilmLab-${Date.now()}.jpg`,{type:'image/jpeg'});if(navigator.canShare&&navigator.canShare({files:[file]}))await navigator.share({files:[file],title:'FilmLab Photo'});else{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);toast('ดาวน์โหลดภาพแล้ว')}}catch(e){if(e.name!=='AbortError')toast('บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง')}finally{working=false;els.rendering.hidden=true}}
els.save.onclick=save;
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
