import raw from "../src/data/schedule-summer26.snapshot.json";
import { normalizeSchedule } from "../src/lib/schedule/normalize";
const d:any = (normalizeSchedule as any)(raw as any);
const m = new Map<string,number>();
for (const e of d.events) for (const c of e.categories) m.set(c,(m.get(c)??0)+1);
console.log([...m.entries()].sort((a,b)=>b[1]-a[1]));
