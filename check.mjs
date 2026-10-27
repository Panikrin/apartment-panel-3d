import assert from 'node:assert/strict';
import {buildModel,groupData} from './model.js';
for(const pmm of [false,true])for(const towels of [0,1,2])for(const control of [false,true]){
 const m=buildModel({pmm,towels,control});assert.equal(m.total,47+(pmm?2:0)+towels+(control?1:0));assert(m.used.every(n=>n<=18));assert.equal(m.devices.filter(d=>d.circuit).length,pmm?24:23);assert.equal(new Set(m.devices.map(d=>d.id)).size,m.devices.length);
 for(const d of m.devices.filter(d=>d.circuit)){const l=m.edges.filter(e=>e.to===d.circuit+'.L'),n=m.edges.filter(e=>e.to===d.circuit+'.N'),pe=m.edges.filter(e=>e.to===d.circuit+'.PE');assert.equal(l.length,1);assert.equal(n.length,1);assert.equal(pe.length,1);assert.equal(n[0].from,d.kind==='RCBO'?d.id+'.outN':'XN'+d.group.slice(2));assert.equal(pe[0].from,'XPE1');}
 assert(!m.edges.some(e=>e.from.startsWith('XN')&&e.to.startsWith('XN')));
 const outputs=m.edges.filter(e=>/^X1\.L[1-6]$/.test(e.from));assert.equal(outputs.length,6);assert.equal(new Set(outputs.map(e=>e.from)).size,6);
 for(const d of m.devices.filter(d=>d.kind==='RES'))assert(!m.edges.some(e=>e.from.startsWith(d.id)||e.to.startsWith(d.id)));
 assert.equal(m.edges.filter(e=>e.type==='CTL').length,1);
}
console.log('PASS: 12 variants; 23/24 circuits; unique IDs; isolated N groups; PE; 6 cross outputs; no reserve wiring; max row 18M; totals 47–52M.');
