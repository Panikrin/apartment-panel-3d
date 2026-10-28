// R03: presentation geometry only. Electrical topology belongs exclusively to model.js.
// No terminal coordinates, dimensions or bend radii here are manufacturer data.
const C={L:'#242a30',N:'#137ac0',PE:'#38994f',CTL:'#9566a9'};
export function drawPanel(canvas,S){
 const {model,selected,yaw,pitch,zoom,focus,transparent,related,labels,cabinet,wires}=S;
 const ctx=canvas.getContext('2d'),W=canvas.clientWidth,H=canvas.clientHeight;
 const dpr=Math.min(devicePixelRatio||1,2),scale=Math.min(W/480,H/760)*zoom,hit=[];
 canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
 function p(x,y,z=0){if(focus){x-=focus[0];y-=focus[1];}let xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=-x*Math.sin(yaw)+z*Math.cos(yaw);return[W/2+xx*scale,H/2+(y*Math.cos(pitch)-zz*Math.sin(pitch))*scale];}
 function polygon(pts,fill,stroke=null,width=.35){const q=pts.map(a=>p(...a));ctx.beginPath();q.forEach((a,i)=>i?ctx.lineTo(...a):ctx.moveTo(...a));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width*scale;ctx.stroke();}return q;}
 function rect(x,y,z,w,h,fill,stroke=null){return polygon([[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z]],fill,stroke);}
 function box(x,y,z,w,h,d,fill='#f8f7f2',side='#cbd0cc'){
  polygon([[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z]],side);
  polygon([[x,y,z],[x,y,z+d],[x,y+h,z+d],[x,y+h,z]],side,'#9ba6a2');
  polygon([[x+w,y,z],[x+w,y,z+d],[x+w,y+h,z+d],[x+w,y+h,z]],'#b3bdb8','#9ba6a2');
  polygon([[x,y,z],[x+w,y,z],[x+w,y,z+d],[x,y,z+d]],'#fffefa','#adb7b1');
  return rect(x,y,z+d,w,h,fill,'#a9b2ad');
 }
 function line(pts,color,width=.5,dash=[]){const q=pts.map(a=>p(...a));ctx.beginPath();q.forEach((a,i)=>i?ctx.lineTo(...a):ctx.moveTo(...a));ctx.strokeStyle=color;ctx.lineWidth=width*scale;ctx.setLineDash(dash.map(v=>v*scale));ctx.stroke();ctx.setLineDash([]);}
 function text(t,x,y,z=40,size=5,color='#273841',align='center',max=200){const a=p(x,y,z);ctx.font=`${size>7?500:400} ${size*scale}px Arial,sans-serif`;ctx.textBaseline='middle';ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(t,...a,max*scale);}
 function circle(x,y,z,r,fill,stroke){const a=p(x,y,z);ctx.beginPath();ctx.ellipse(...a,r*scale,Math.max(.5,r*Math.cos(pitch))*scale,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.35*scale;ctx.stroke();}}
 function screw(x,y,z,r=2.35){circle(x,y,z,r,'#a6afaf','#707d7c');circle(x-.25,y-.25,z,r*.77,'#dce2df');line([[x-r*.65,y,z+.1],[x+r*.65,y,z+.1]],'#576564',.6);line([[x,y-r*.65,z+.1],[x,y+r*.65,z+.1]],'#687675',.55);}
 const pos=d=>[-162+d.slot*18,-226+d.row*163];
 const byId=new Map(model.devices.map(d=>[d.id,d]));
 const circuits=model.devices.filter(d=>d.circuit);
 function pin(key){const [id,port]=key.split('.');
  if(id==='IN')return[port==='L'?-192:-180,-306,5];
  if(key==='PE.IN')return[-168,-306,5];
  if(id==='BUS')return[-174,port==='L'?-258:-248,9];
  if(key==='PRE.N')return[-180,-278,14];
  if(id==='SA1')return[0,347,8];
  if(id==='XPE1')return[-163,299,13];
  if(/^XN\d$/.test(id))return[-163+(+id.slice(2)-1)*66,267,14];
  const load=circuits.find(d=>d.circuit===id);
  if(load){const[x,y]=pos(load);return[x+load.width*9+({L:-4,N:0,PE:4}[port]||0),y-21,22];}
  const d=byId.get(id);if(!d)return[0,0,0];const[x,y]=pos(d),w=d.width*18-1.2;
  if(d.kind==='BLOCK')return[x+7+(+port.slice(1))*8.1,y+(port[0]==='L'?23:59),34];
  if(port==='control')return[x+w/2,y+62,38];
  const n=(port||'').endsWith('N')||port==='N';
  return[x+(n?w-8:8),y+((port||'').startsWith('out')?76:6),29];
 }
 function pathFor(e,i){let a=pin(e.from),b=pin(e.to),target=circuits.find(d=>e.to.startsWith(d.circuit+'.'));
  if(e.from.startsWith('XN')&&target){const siblings=circuits.filter(d=>d.group===target.group);a[0]+=7*(siblings.indexOf(target)+1);}
  if(e.from==='XPE1'&&target)a[0]+=11.4*circuits.indexOf(target);
  if(e.type==='CTL')return[a,[205,a[1],12],[205,b[1]+19,12],[b[0],b[1]+19,12],b];
  if(e.from.startsWith('BUS'))return[a,[b[0],a[1],9],b];
  if(e.from.startsWith('XN')||e.from==='XPE1'){
   const lane=(e.type==='PE'?-207:187)+(i%6)*1.8,level=b[1]-14-(i%3)*2.2;
   return[a,[lane,a[1],8],[lane,level,8],[b[0],level,18],b];
  }
  if(e.from.startsWith('QD')&&e.to.startsWith('QF'))return[a,[a[0],a[1]+12,12],[b[0],a[1]+12,12],b];
  if(e.to.startsWith('L')){
   const lane=176+(i%6)*2.5,level=b[1]-9-(i%3)*2;
   return[a,[a[0],a[1]+10+(i%3)*2,10],[lane,a[1]+10+(i%3)*2,10],[lane,level,10],[b[0],level,20],b];
  }
  if(e.from.startsWith('X1')){
   const n=+e.from.slice(-1),lane=-189+(n-1)*3+(e.type==='N'?1.3:0),level=b[1]-18+(e.type==='N'?5:0),exit=pos(byId.get('X1'))[1]+(e.type==='N'?91:-12);
   return[a,[a[0],exit,34],[lane,exit,10],[lane,level,10],[b[0],level,15],b];
  }
  if(e.to==='X1.N0'){const exit=pos(byId.get('X1'))[1]+91;return[a,[210,a[1],10],[210,exit,10],[b[0],exit,34],b];}
  if(e.to.startsWith('XN'))return[a,[a[0],a[1]+9,10],[171+(i%3)*3,a[1]+9,10],[171+(i%3)*3,b[1]-11,10],[b[0],b[1]-11,10],b];
  return[a,[a[0],Math.min(a[1],b[1])-14,10],[b[0],Math.min(a[1],b[1])-14,10],b];
 }
 function rounded(points,color,width,dash=[]){const a=points.map(v=>p(...v));ctx.beginPath();ctx.moveTo(...a[0]);for(let i=1;i<a.length-1;i++){const prev=a[i-1],q=a[i],next=a[i+1],u=Math.hypot(q[0]-prev[0],q[1]-prev[1]),v=Math.hypot(q[0]-next[0],q[1]-next[1]);if(u<.01||v<.01)continue;const r=Math.min(5*scale,u/2,v/2);ctx.lineTo(q[0]+(prev[0]-q[0])*r/u,q[1]+(prev[1]-q[1])*r/u);ctx.quadraticCurveTo(...q,q[0]+(next[0]-q[0])*r/v,q[1]+(next[1]-q[1])*r/v);}ctx.lineTo(...a.at(-1));ctx.strokeStyle=color;ctx.lineWidth=width*scale;ctx.lineCap='round';ctx.lineJoin='round';ctx.setLineDash(dash.map(v=>v*scale));ctx.stroke();ctx.setLineDash([]);}
 function cable(e,i){const path=pathFor(e,i),active=related(e),width=e.from.startsWith('IN')?2.7:e.from.startsWith('X1')?1.7:1.25;
  ctx.globalAlpha=selected?(active?1:.065):.94;
  rounded(path,'#ffffff',width+1.05);
  rounded(path,e.type==='L'?'#14191d':C[e.type],width,e.type==='CTL'?[3,3]:[]);
  if(e.type==='PE')rounded(path,'#f7da39',.55,[2.3,1.9]);
  else if(e.type!=='CTL')rounded(path,e.type==='N'?'#78c6e2':'#777e82',.25);
  ctx.globalAlpha=1;
 }
 function marker(x,y,z,id,color){rect(x-2.3,y-3.2,z,4.6,6.4,'#fffcec','#69777e');rect(x-2.3,y-3.2,z+.1,4.6,1.2,color);text(id,x,y+.3,z+.2,2.6,'#192f3a','center',4.2);}
 function ferrule(x,y,z,color,top,id){const sy=top?-1:1;box(x-1.15,y+sy*4-2,z,2.3,4,1.5,'#a9b8bd');box(x-1.8,y+sy*8-2,z,3.6,4,2,color,'#8e9697');if(labels)marker(x,y+sy*14,z+2,id,color);}
 // Soft drafting paper, no image or texture network dependencies.
 ctx.fillStyle='#fbfcfc';ctx.fillRect(0,0,W,H);
 if(cabinet){box(-222,-321,-44,444,650,8,'#d9e1e0','#b2c0c1');
  for(const x of[-222,212])box(x,-321,-44,10,650,65,'#f7f7f2');
  box(-222,-321,-44,444,10,65);box(-222,319,-44,444,10,65);
  for(const x of[-207,207])for(const y of[-306,310]){circle(x,y,-30,5,'#c1cdce');screw(x,y,-29,3.1);}
 }
 if(!focus){text('ЩР-01  /  54 МОДУЛЯ',-207,-337,0,7,'#435c68','left');text('R03 · ВИЗУАЛЬНАЯ КОМПОНОВКА',207,-337,0,5,'#70828b','right');}
 for(let r=0;r<3;r++){const y=-226+r*163;box(-182,y+31,-17,364,27,3,'#b7c2c4');rect(-182,y+32,-13,364,3,'#eef3f4');rect(-182,y+53,-13,364,3,'#87969c');
  for(let x=-176;x<180;x+=18)rect(x,y+41,-13,8,3,'#819399','#d7dfe0');
  for(const x of[-179,177]){box(x-3,y+26,-11,6,37,8,'#899696');screw(x,y+31,-2,1.7);screw(x,y+58,-2,1.7);}
  text(String(r+1).padStart(2,'0'),-198,y+42,-10,7,'#78909a');
 }
 // Five physically separate neutral bars; PE continuous. Coordinates are illustrative.
 for(let g=0;g<5;g++){const x=-174+g*66;box(x,257,-4,57,20,11,'#116fac','#0b4f82');box(x+3,261,7,51,11,5,'#c5ad73','#9b834c');
  for(let j=0;j<7;j++){circle(x+11+j*7,267,12,2.7,'#64583f');screw(x+11+j*7,267,14,2);}
  text('XN'+(g+1)+' / QD'+(g+1),x+28,283,14,5.2,'#236389');
 }
 box(-174,290,-4,330,18,10,'#5f9d65');box(-170,294,6,322,10,5,'#cab173');for(let j=0;j<28;j++)screw(-163+j*11.4,299,13,2);
 text('XPE1  /  PE — ОБЩАЯ ЗАЩИТНАЯ ШИНА',-174,315,10,5.1,'#3b7445','left');
 box(-187,-284,0,14,12,9,'#4393bb');screw(-180,-278,14,2.2);text('N*',-180,-289,14,4.5);
 // Paths are painted behind equipment. Final short entries and ferrules are on top.
 model.edges.forEach((e,i)=>{if(wires[e.type])cable(e,i);});
 function apparatus(d){const[x,y]=pos(d),w=d.width*18-1.2,active=selected?.id===d.id;
  ctx.globalAlpha=transparent?.35:1;
  box(x,y,0,w,82,14,'#e8ece7','#b5bfba');
  for(let j=0;j<d.width;j++){
   const xx=x+j*18;box(xx+1,y+1,14,15,13,9,'#e5e9e5');box(xx+1,y+68,14,15,13,9,'#e5e9e5');
   for(let k=0;k<3;k++){rect(xx+2+k*4.1,y+13,23,2.3,3,'#c4cec9');rect(xx+2+k*4.1,y+66,23,2.3,3,'#c4cec9');}
  }
  const poly=box(x,y+17,14,w,48,22,active?'#fff1da':d.kind==='RES'?'#e2e8e5':'#fffefa');hit.push({d,poly});
  if(d.kind==='BLOCK'){
   box(x+2,y+3,24,w-4,77,5,'#2874a0','#215575');
   for(const[yy,t]of[[y+23,'L'],[y+59,'N']]){box(x+4,yy-7,29,w-8,14,3,'#c3a46b','#8c7448');
    for(let j=0;j<7;j++){circle(x+7+j*8.1,yy,33,3.2,'#716442');screw(x+7+j*8.1,yy,34,2.6);if(labels)text(j,x+7+j*8.1,yy+10,35,3.8);}
    text(t,x+w-5,yy-11,35,5.4,'#fff');
   }
   rect(x+2,y+3,36,w-4,77,'#70b4d326','#447d9655');
   rect(x+10,y+36,37,w-20,10,'#f9fcfb');text('X1 · 2 × 7',x+w/2,y+41,38,6);
   for(const yy of[y+8,y+74])screw(x+4,yy,38,1.3);
  }else if(d.kind==='KV'){
   box(x+2,y+21,36,w-4,31,2,'#253c44');rect(x+4,y+23,39,w-8,17,'#182c32');
   text('230',x+w/2,y+32,40,12,'#ef583a');text('V',x+w-6,y+45,40,4,'#99aaa9');
   for(let j=0;j<3;j++)circle(x+7+j*9,y+59,38,2.2,'#616e70','#2c3d40');
  }else if(d.kind==='RES'){
   for(let yy=y+23;yy<y+60;yy+=4)line([[x+3,yy,37],[x+w-3,yy,37]],'#c2cdc7',.45);
   text('РЕЗЕРВ',x+w/2,y+40,38,3.7,'#73827e');
  }else{
   rect(x+1,y+19,37,w-2,3.4,'#d73737');text(d.kind==='KM'?'КОНТАКТОР':'DEKraft',x+w/2,y+20.8,38,3.3,'#fff','center',w-2);
   text(d.kind==='RCD'?'УЗО-03':d.kind==='RCBO'?'АВДТ*':d.kind==='KM'?'KM1':'ВА-101',x+2,y+26,38,3,'#45575d','left',w-4);
   text(d.rating.split(' · ')[0],x+2,y+32,38,5.1,'#202f36','left',w-4);
   if(d.kind==='RCD')text(d.id==='QD4'?'IΔn / тип ?':'30 mA  /  AC*',x+2,y+38,38,3.5,'#45575d','left',w-4);
   else if(d.kind!=='KM')text('230 V~',x+2,y+38,38,2.8,'#45575d','left');
   const leverColor=d.kind==='RCD'?'#1689bb':d.kind==='RCBO'?'#21526a':'#253238';
   box(x+2,y+43,36,w-4,13,2,'#7c8b89');box(x+3,y+44,38,w-6,8,6,leverColor,'#172e3b');
   for(let k=0;k<3;k++)line([[x+4,y+46+k*1.5,45],[x+w-4,y+46+k*1.5,45]],d.kind==='RCD'?'#6dc7e6':'#58676c',.35);
   rect(x+3,y+57,37,3.5,2.5,'#d24536');text('I-ON',x+w/2,y+58.5,38,2.8);
   if(['RCD','RCBO'].includes(d.kind)){box(x+w-8,y+58,37,5,5,2,'#b8bfc0');text('T',x+w-5.5,y+60.5,40,3.2);}
   line([[x+3,y+62,38],[x+3,y+64,38],[x+6,y+64,38],[x+9,y+61,38]],'#718189',.35);
  }
  if(!['BLOCK','RES'].includes(d.kind))for(let j=0;j<d.width;j++){
   const xx=x+8+j*18;circle(xx,y+6,25,3.5,'#6b7874');screw(xx,y+6,29,2.5);circle(xx,y+76,25,3.5,'#6b7874');screw(xx,y+76,29,2.5);
   if(labels){text(j===1?'N':'1',xx+5,y+7,29,3.5);text(j===1?'N':'2',xx+5,y+76,29,3.5);}
  }
  ctx.globalAlpha=1;
  if(labels){const yy=y+95;rect(x,yy,25,w,25,'#fffefa','#c7d3d1');rect(x,yy,26,w,7,active?'#bd7b2e':'#e2e9e7');text(d.id,x+w/2,yy+3.5,27,4.4,'#253d48');
   const short=d.name.replace('Розетки','Роз.').replace('большого','бол.').replace('малого','мал.').replace('Водонагреватель','Водо- нагрев.').replace('Холодильник','Холод.').replace('Полотенцесушитель?','Полот. суш.?').replace('Кросс-модуль','Кросс- модуль').replace('Контактор','Конт.');
   const lines=[''];for(const word of short.split(' ')){const last=lines.length-1;if((lines[last]+' '+word).trim().length>Math.floor(w/2)&&lines[last])lines.push(word);else lines[last]+=(lines[last]?' ':'')+word;}
   lines.slice(0,3).forEach((s,i)=>text(s,x+w/2,yy+11+i*4.6,27,3.7,'#324a55','center',w-1.3));
  }
  if(d.circuit){const cx=x+d.width*9;box(cx-7,y-32,13,14,15,5,'#e8e8e1');for(const[off,t]of[[-4,'L'],[0,'N'],[4,'PE']]){rect(cx+off-1,y-31,19,2,13,C[t]);screw(cx+off,y-21,22,1.2);}if(labels)text(d.circuit,cx,y-37,23,4.7);}
 }
 model.devices.slice().sort((a,b)=>pos(b)[0]*Math.sin(yaw)-pos(a)[0]*Math.sin(yaw)).forEach(apparatus);
 // Distinct ferrules/markers at endpoints. Aggregate supply branches share a conceptual terminal.
 const seen=new Set();model.edges.forEach((e,i)=>{if(!wires[e.type])return;ctx.globalAlpha=selected&&!related(e)?.09:1;
  for(const endpoint of[e.from,e.to]){const d=byId.get(endpoint.split('.')[0]);if(!d||e.type==='CTL')continue;const key=endpoint+e.type;if(seen.has(key))continue;seen.add(key);const a=pin(endpoint),top=d.kind==='BLOCK'?e.type==='L':!endpoint.includes('.out');
   line([[a[0],a[1]+(top?-10:10),a[2]],[a[0],a[1],a[2]]],C[e.type],1.25);
   ferrule(...a,e.type==='N'?'#2789bd':'#cb753a',top,e.type);
  }ctx.globalAlpha=1;
 });
 if(selected||transparent)model.edges.forEach((e,i)=>{if(wires[e.type]&&related(e))cable(e,i);});
 model.used.forEach((n,r)=>{for(let j=n;j<18;j++){const x=-162+j*18,y=-226+r*163;box(x,y+17,0,16.8,48,16,'#e8eeea');for(let k=0;k<6;k++)line([[x+2,y+23+k*6,17],[x+14,y+23+k*6,17]],'#c9d3cd',.5);if(labels)text('—',x+8,y+42,18,5,'#9ba9a2');}});
 for(let r=0;r<3;r++){const y=-226+r*163;for(let j=0;j<18;j++)text(String(j+1).padStart(2,'0'),-153+j*18,y+144,0,3.8,'#96a4a9');}
 box(-20,342,0,40,25,7,'#f9f8f1');box(-11,346,7,22,16,3,'#e1e8e4');text('SA1 · КЛАВИША В КВАРТИРЕ',0,378,10,5.5);
 if(!focus)text('ТРАССЫ И ГЕОМЕТРИЯ УСЛОВНЫЕ · НЕ ДЛЯ МОНТАЖА',0,-321,22,5.3,'#7b888b');
 return hit;
}
