export const groupData=[
 ['QD1','Q1',32,'Спальня / балкон',[['Сплит спальни',16],['Розетки балкона',16],['Розетки спальни',16]]],
 ['QD2','Q2',40,'Детская / кухня',[['Розетки детской',16],['Розетки кухни',16],['Измельчитель',16],['СВЧ',16]]],
 ['QD3','Q3',32,'Тёплые полы',[['ТП балкона',16],['ТП кухни',16],['ТП санузлов',16]]],
 ['QD4','Q4',25,'Постоянные',[['Нептун',16],['Роутер',16],['Холодильник',10]]],
 ['QD5','Q5',40,'Освещение',[['Свет коридора',10],['Свет детской',10],['Свет большого с/у',10],['Свет кухни',10],['Свет малого с/у',10],['Свет спальни',10]]]
];
export function buildModel({pmm=true,towels=0,control=false}={}){
 const devices=[],edges=[],used=[0,0,0];
 function add(row,id,name,rating,width,kind,group='direct',circuit='',status='По эскизу; проверить на месте'){
  const d={row,id,name,rating,width,kind,group,circuit,status,slot:used[row]};used[row]+=width;devices.push(d);return d;
 }
 add(0,'QF1','Ввод','C50',2,'MCB');add(0,'KV1','Реле напряжения','? А',2,'KV');
 [['Варочная панель','C32'],['Водонагреватель','C40'],['Духовой шкаф','C16'],['Розетки большого с/у','C16']].forEach(([n,r],i)=>add(0,'QFD'+(i+1),n,r,2,'RCBO','direct','L0'+(i+1),'Старый АВДТ: IΔn, тип и фактическую ширину проверить'));
 if(pmm)add(0,'QFD5','Посудомойка','C16 · 30мА',2,'RCBO','direct','L24','Дополнение: первичная схема, линия №3. Реальное исполнение не проверено; тип нового аппарата согласовать');
 add(0,'X1','Кросс-модуль','L / N',4,'BLOCK');
 let breaker=2,circuit=5;
 groupData.forEach(([id,old,amp,name,loads],i)=>{const row=i<3?1:2;add(row,id,'УЗО '+name,amp+'А',2,'RCD',id,'',id==='QD4'?'Старое УЗО: тип, IΔn и исправность проверить':'30 мА по заданию; номинал и тип подлежат согласованию');loads.forEach(([n,a])=>add(row,'QF'+breaker++,n,'C'+a,1,'MCB',id,'L'+String(circuit++).padStart(2,'0')));});
 add(2,'KM1','Контактор света','? А',2,'KM','QD5','','Исполнительный аппарат для существующей клавиши; модель и схема управления неизвестны');
 for(let i=0;i<towels;i++)add(1,'RES'+(i+1),'Полотенцесушитель?','Резерв',1,'RES','pending','','Условное место; группа и число линий не установлены');
 if(control)add(2,'RESC','Защита управления?','Резерв',1,'RES','pending','','Один модуль зарезервирован, номинал не назначен');
 const edge=(from,to,type,group,note='Функциональная связь; клеммы уточнить')=>edges.push({from,to,type,group,note});
 edge('IN.L','QF1.inL','L','direct');edge('IN.N','QF1.inN','N','direct');edge('QF1.outL','KV1.inL','L','direct');edge('QF1.outN','PRE.N','N','direct');edge('PRE.N','X1.N0','N','direct');edge('KV1.outL','X1.L0','L','direct');edge('PRE.N','KV1.N','N','direct','Дополнительный узел N перед X1; способ разветвления и размещение требуют проверки');
 edge('X1.L6','BUS.L','L','direct','Общее питание АВДТ через совместимую распределительную систему');edge('X1.N6','BUS.N','N','direct');
 for(const d of devices.filter(d=>d.kind==='RCBO')){edge('BUS.L',d.id+'.inL','L','direct');edge('BUS.N',d.id+'.inN','N','direct');edge(d.id+'.outL',d.circuit+'.L','L','direct');edge(d.id+'.outN',d.circuit+'.N','N','direct');edge('XPE1',d.circuit+'.PE','PE','direct');}
 groupData.forEach(([id],i)=>{edge('X1.L'+(i+1),id+'.inL','L',id);edge('X1.N'+(i+1),id+'.inN','N',id);edge(id+'.outN','XN'+(i+1),'N',id);
  if(id==='QD5')edge('QD5.outL','KM1.inL','L',id,'Предлагаемый силовой путь; подтвердить контактор и схему');
  devices.filter(d=>d.group===id&&d.circuit).forEach(d=>{edge(id==='QD5'?'KM1.outL':id+'.outL',d.id+'.inL','L',id,'Распределение группы, совместимая гребёнка / перемычки');edge(d.id+'.outL',d.circuit+'.L','L',id);edge('XN'+(i+1),d.circuit+'.N','N',id);edge('XPE1',d.circuit+'.PE','PE',id);});
 });
 edge('PE.IN','XPE1','PE','direct');edge('SA1','KM1.control','CTL','QD5','Команда, а не электрическая цепь. Питание и возврат катушки требуют отдельной схемы');
 return {devices,edges,used,total:used.reduce((a,b)=>a+b,0)};
}
