import {buildModel,groupData} from './model.js';
const $=s=>document.getElementById(s),canvas=$('scene'),ctx=canvas.getContext('2d');
let model,selected=null,yaw=-.22,pitch=.12,zoom=1,transparent=false,W=0,H=0,hit=[],drag=null,focus=null;
const colors={L:'#bd653f',N:'#208cbf',PE:'#3d9360',CTL:'#ac63ad'};
function p([x,y,z=0]){if(focus){x-=focus[0];y-=focus[1];}const xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=-x*Math.sin(yaw)+z*Math.cos(yaw),yy=y*Math.cos(pitch)-zz*Math.sin(pitch),depth=y*Math.sin(pitch)+zz*Math.cos(pitch),s=Math.min(W/485,H/735)*zoom*1100/(1100-depth);return [W/2+xx*s,H/2+yy*s,depth];}
function face(points,fill,stroke='#87969c55'){const a=points.map(p);ctx.beginPath();a.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=.7;ctx.strokeStyle=stroke;ctx.stroke();}return a;}
function box(x,y,z,w,h,depth,color,side='#aebcc1'){face([[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z]],side);face([[x,y,z],[x,y,z+depth],[x,y+h,z+depth],[x,y+h,z]],side);face([[x+w,y,z],[x+w,y,z+depth],[x+w,y+h,z+depth],[x+w,y+h,z]],side);face([[x,y,z],[x+w,y,z],[x+w,y,z+depth],[x,y,z+depth]],'#edf0ed');return face([[x,y,z+depth],[x+w,y,z+depth],[x+w,y+h,z+depth],[x,y+h,z+depth]],color);}
function label(s,x,y,z,size=8,color='#304855',max=200){const q=p([x,y,z]);ctx.font=`600 ${Math.max(5,size*Math.min(W/485,H/735)*zoom)}px -apple-system,sans-serif`;ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(s,q[0],q[1],max*Math.min(W/485,H/735)*zoom);}
function wire(points,color,width=1.8,dashed=false){const a=points.map(p),s=Math.min(W/485,H/735)*zoom;ctx.lineWidth=width*s;ctx.strokeStyle=color;ctx.lineJoin='round';ctx.lineCap='round';ctx.setLineDash(dashed?[4*s,4*s]:[]);ctx.beginPath();a.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();ctx.setLineDash([]);}
function screw(x,y,z,r=2.1){const q=p([x,y,z]),s=Math.min(W/485,H/735)*zoom;ctx.fillStyle='#b9a577';ctx.strokeStyle='#7e725b';ctx.lineWidth=.6;ctx.beginPath();ctx.arc(q[0],q[1],r*s,0,7);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(q[0]-r*s*.6,q[1]);ctx.lineTo(q[0]+r*s*.6,q[1]);ctx.moveTo(q[0],q[1]-r*s*.6);ctx.lineTo(q[0],q[1]+r*s*.6);ctx.stroke();}
function pos(d){return [-162+d.slot*18,-226+d.row*163,0];}
function pin(key){
 const [id,port]=key.split('.');
 if(id==='IN')return [port==='L'?-196:-184,-301,0];
 if(key==='PE.IN')return [-172,-301,0];
 if(id==='BUS')return [-177,port==='L'?-262:-252,5];
 if(key==='PRE.N')return [-182,-281,10];
 if(id==='SA1')return [0,346,10];
 if(id==='XPE1')return [-150,294,8];
 if(/^XN\d$/.test(id))return [-162+(+id.slice(2)-1)*66,265,13];
 const load=model.devices.find(d=>d.circuit===id);if(load){const [x,y]=pos(load);return [x+load.width*9+({L:-3,N:0,PE:3}[port]||0),y-34,22];}
 const d=model.devices.find(d=>d.id===id);if(!d)return [0,0,0];const [x,y]=pos(d),w=d.width*18-1;
 if(d.kind==='BLOCK')return [x+7+(+port.slice(1))*8.1,y+(port[0]==='L'?23:59),34];
 if(port==='control')return [x+w/2,y+61,39];
 return [x+((port||'').endsWith('N')||port==='N'?w-6:6),y+((port||'').startsWith('out')?75:5),39];
}
function related(e){if(!selected)return true;const id=selected.id;return e.from.startsWith(id+'.')||e.to.startsWith(id+'.')||e.from===id||e.to===id||(selected.circuit&&(e.from.startsWith(selected.circuit+'.')||e.to.startsWith(selected.circuit+'.')))||(selected.kind==='RCD'&&e.group===id)||(selected.kind==='BLOCK'&&(e.from.startsWith('X1.')||e.to.startsWith('X1.')));}
function route(e,i){const a=pin(e.from),b=pin(e.to);if(e.type==='CTL')return [a,[190,a[1],15],[190,b[1]+10,15],[b[0],b[1]+10,15],b];
 if(e.from.startsWith('BUS'))return [a,[b[0],a[1],a[2]],b];
 if(e.from.startsWith('XN')||e.from==='XPE1'){const lane=(e.type==='PE'?-199:189)+(i%5)*1.4;return [a,[lane,a[1],10],[lane,b[1]-8,10],[b[0],b[1]-8,10],b];}
 if(e.from.startsWith('QD')&&e.to.startsWith('QF'))return [a,[a[0],a[1]+11,16],[b[0],a[1]+11,16],b];
 if(e.to.startsWith('L')){const lane=184+(i%5)*1.6;return [a,[a[0],a[1]+8,16],[lane,a[1]+8,16],[lane,b[1],16],b];}
 if(e.from.startsWith('X1')&&e.to.startsWith('QD')){const lane=-185+(i%5)*1.5;return [a,[a[0],a[1]+10,12],[lane,a[1]+10,12],[lane,b[1]-14,12],[b[0],b[1]-14,12],b];}
 if(e.to.startsWith('XN'))return [a,[a[0],a[1]+9,11],[174+(i%3)*3,a[1]+9,11],[174+(i%3)*3,b[1]-10,11],[b[0],b[1]-10,11],b];
 return [a,[a[0],Math.min(a[1],b[1])-15,8],[b[0],Math.min(a[1],b[1])-15,8],b];}
function renderWires(onlySelected=false){model.edges.forEach((e,i)=>{if(!$('wire'+e.type).checked||(onlySelected&&!related(e)))return;ctx.globalAlpha=onlySelected?.95:!selected?.6:related(e)?.9:.055;const path=route(e,i);wire(path,colors[e.type],onlySelected?2.1:1.6,e.type==='CTL');if(e.type==='PE')wire(path,'#ead64d',.75,true);});ctx.globalAlpha=1;}
function sticker(d,x,y,w){const yy=y+85,h=44;const poly=face([[x,yy,42],[x+w,yy,42],[x+w,yy+h,42],[x,yy+h,42]],selected?.id===d.id?'#ffedca':'#fffdf4');hit.push({d,poly});face([[x,yy,43],[x+w,yy,43],[x+w,yy+10,43],[x,yy+10,43]],d.kind==='RES'?'#9d9e99':'#3a5b65');label(d.id,x+w/2,yy+7,44,6,'white',w-1);
 const o=p([x+w/2,yy+28,44]),a=p([x+w/2,yy+29,44]),b=p([x+w/2-1,yy+28,44]);ctx.save();ctx.transform(a[0]-o[0],a[1]-o[1],b[0]-o[0],b[1]-o[1],o[0],o[1]);ctx.fillStyle='#283f47';ctx.font='600 7px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(d.name,0,0,30);ctx.restore();}
function draw(){if(!model||!canvas.clientWidth)return;W=canvas.clientWidth;H=canvas.clientHeight;const dpr=devicePixelRatio||1;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);hit=[];
 box(-212,-310,-45,424,628,9,'#879a9e');for(const x of [-222,212])box(x,-320,-45,10,648,70,'#e5ece8');box(-222,-320,-45,444,10,70,'#f3f5f1');box(-222,318,-45,444,10,70,'#e1e9e4');
 for(let r=0;r<3;r++){const y=-226+r*163;box(-180,y+31,-19,360,25,5,'#c9d0d0');wire([[-180,y+36,-13],[180,y+36,-13]],'#f7f9f8',2);for(let j=0;j<18;j++)label(j+1,-153+j*18,y+146,-5,6,'#879b9e');}
 for(let i=0;i<5;i++){const x=-174+i*66;box(x,257,-5,55,17,14,'#4888aa');box(x+3,261,9,49,7,2,'#c4a76a');for(let j=0;j<7;j++)screw(x+6+j*7,264,13);label('XN'+(i+1),x+27,285,10,8);}
 box(-189,-286,0,14,10,11,'#5489a1');screw(-182,-281,12);label('N*',-182,-290,12,6);
 box(-174,290,-5,330,14,12,'#7d9860');box(-170,293,7,322,6,2,'#c4a76a');for(let j=0;j<28;j++)screw(-165+j*11.4,296,11,1.7);label('XPE1 · PE',0,313,10,8);
 renderWires();
 model.devices.slice().sort((a,b)=>p(pos(a))[2]-p(pos(b))[2]).forEach(d=>{const [x,y]=pos(d),w=d.width*18-1.2;ctx.globalAlpha=transparent?.25:1;const poly=box(x,y,0,w,82,35,d.kind==='RES'?'#cad0cb':selected?.id===d.id?'#ead4b4':'#f3f2e9');hit.push({d,poly});
 if(d.kind==='BLOCK'){box(x+2,y+9,35,w-4,63,3,'#d6e6efaa');for(const [yy,t] of [[y+23,'L'],[y+59,'N']]){box(x+3,yy-5,38,w-6,10,1,t==='L'?'#a68558':'#698f9d');for(let j=0;j<7;j++){screw(x+7+j*8.1,yy,40,2.7);label(j,x+7+j*8.1,yy+12,40,5);}label(t,x+5,yy-9,40,7);}label('X1 · 2 × 7',x+w/2,y+45,41,8);}
 else if(d.kind==='KV'){box(x+3,y+20,35,w-6,30,3,'#1f353e');label('230',x+w/2,y+41,40,12,'#bce8ca');label('KV1',x+w/2,y+63,39,7);}
 else if(d.kind==='RES'){label('?',x+w/2,y+42,38,15,'#7e8b87');}
 else{wire([[x+2,y+16,36],[x+w-2,y+16,36]],'#b5453e',1.5);label(d.kind==='KM'?'KM':'DEK',x+w/2,y+26,38,6);label(d.rating,x+w/2,y+37,38,8,'#304855',w-2);box(x+3,y+43,35,w-6,13,8,d.kind==='RCD'?'#537c9b':'#2c3c45');if(['RCBO','RCD'].includes(d.kind))box(x+w-8,y+61,35,5,5,2,'#7697a9');for(let j=0;j<d.width;j++){screw(x+8+j*18,y+6,38,2.4);screw(x+8+j*18,y+76,38,2.4);}}
 ctx.globalAlpha=1;sticker(d,x,y,w);
 if(d.circuit){for(const [off,color]of[[-3,colors.L],[0,colors.N],[3,colors.PE]]){box(x+w/2+off-1,y-38,17,2,9,3,color);}label(d.circuit,x+w/2,y-42,22,6);}
 });
 if(transparent||selected)renderWires(true);
 // Blank DIN positions are not counted as occupied devices.
 model.used.forEach((n,r)=>{for(let j=n;j<18;j++)box(-162+j*18,-226+r*163,0,17,82,10,'#e4eae6');});
 box(-26,337,0,52,31,12,'#f4f3ec');box(-15,341,12,30,19,4,'#dbe2db');label('SA1 · НА СТЕНЕ',0,378,16,8);label('НЕ ДЛЯ МОНТАЖА',0,-290,24,9,'#647c80');
}
function info(){const d=selected;if(!d){$('deviceTitle').textContent='Весь щит';$('deviceInfo').innerHTML='<p class="muted">Выберите аппарат, чтобы увидеть его связи. Серые резервные места не имеют электрических подключений.</p>';return;}$('deviceTitle').textContent=d.id+' · '+d.name;$('deviceSelect').value=d.id;$('deviceInfo').innerHTML=`<p><span class="badge">${d.rating}</span> <span class="badge">Ряд ${d.row+1} · ${d.slot+1}–${d.slot+d.width}</span></p><p>${d.status}</p><p class="muted">${d.circuit?d.circuit+' · ':''}${d.width} условных модулей. Габариты не обмерены.</p><p class="ports">${model.edges.filter(related).map(e=>`${e.type}: ${e.from} → ${e.to}`).join('<br>')}</p>`;}
function select(id){selected=model.devices.find(d=>d.id===id)||null;info();connections();draw();}
function connections(){$('connections').innerHTML=model.edges.filter(related).map(e=>`<tr><td>${e.type}</td><td>${e.from}</td><td>${e.to}</td><td>${e.note}</td></tr>`).join('');}
function rebuild(){model=buildModel({pmm:$('variant').value==='pmm',towels:+$('towels').value,control:$('controlReserve').checked});$('capacity').innerHTML=`<div class="big">${model.total}<small> / 54 М · свободно ${54-model.total}</small></div>`+model.used.map((n,i)=>`<div class="${n>18?'over':''}">Ряд ${i+1}: ${n}/18<div class="bar"><i style="width:${Math.min(n,18)/18*100}%"></i></div></div>`).join('');$('deviceSelect').innerHTML='<option value="">Весь щит</option>'+model.devices.map(d=>`<option value="${d.id}">${d.id} · ${d.name}</option>`).join('');$('scheduleBody').innerHTML=model.devices.map(d=>`<tr><td><button data-select="${d.id}">${d.id}</button></td><td>${d.circuit||'—'}</td><td>${d.name}</td><td>${d.rating}</td><td>${d.group}</td><td>${d.status}</td></tr>`).join('');document.querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>{document.querySelector('[data-tab="model"]').click();select(b.dataset.select);});selected=model.devices.find(d=>d.id===selected?.id)||null;info();connections();draw();}
$('crossDetail').innerHTML=['L','N'].map(t=>'<div class="cross-row"><strong>'+t+'</strong>'+['Ввод','QD1','QD2','QD3','QD4','QD5','АВДТ'].map((s,i)=>`<span>${i}<br>${s}</span>`).join('')+'</div>').join('');
$('crossDetail').insertAdjacentHTML('beforeend','<p class="notice">Для питания N реле KV1 показан отдельный узел N* перед X1. Он требует реального разрешённого соединения и места: два провода в один зажим без допуска производителя не предполагаются. У X1 нет запаса выходов; при дополнительных ответвлениях лучше рассмотреть более ёмкий распределитель.</p>');
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-tab]').forEach(a=>a.classList.toggle('active',a===b));document.querySelectorAll('.page').forEach(s=>s.classList.toggle('active',s.id===b.dataset.tab));draw();});
for(const id of ['variant','towels','controlReserve'])$(id).onchange=rebuild;
for(const id of ['wireL','wireN','wirePE','wireCTL'])$(id).onchange=draw;
$('deviceSelect').onchange=e=>select(e.target.value);
$('transparent').onchange=e=>{transparent=e.target.checked;draw();};
function view(a,b){yaw=a;pitch=b;focus=null;zoom=1;$('zoom').value=100;draw();}
$('front').onclick=()=>view(0,0);$('iso').onclick=()=>view(-.22,.12);$('reset').onclick=()=>{select('');view(-.22,.12);};
$('cross').onclick=()=>{select('X1');const d=selected,[x,y]=pos(d);focus=[x+36,y+50];yaw=-.15;pitch=.12;zoom=2.4;draw();};
$('zoom').oninput=e=>{zoom=+e.target.value/100;draw();};
canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);};
canvas.onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>2)drag.moved=true;yaw=Math.max(-.8,Math.min(.8,yaw+dx*.004));pitch=Math.max(-.5,Math.min(.5,pitch+dy*.004));drag.x=e.clientX;drag.y=e.clientY;draw();};
canvas.onpointerup=e=>{if(drag&&!drag.moved){const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;for(const h of hit.slice().reverse()){let inside=false;for(let i=0,j=h.poly.length-1;i<h.poly.length;j=i++){const a=h.poly[i],b=h.poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}if(inside){select(h.d.id);break;}}}drag=null;};canvas.onpointercancel=()=>drag=null;
canvas.onwheel=e=>{e.preventDefault();zoom=Math.max(.7,Math.min(2.5,zoom-e.deltaY*.001));$('zoom').value=zoom*100;draw();};
new ResizeObserver(draw).observe(canvas);rebuild();
