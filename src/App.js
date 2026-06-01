import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);
const ANTHROPIC_KEY = process.env.REACT_APP_ANTHROPIC_KEY;
const TEAL = "#1AAFBF";
const TEAL_LIGHT = "#e6f7f9";
const NAV_BG = "#2c3e50";
const CURRENCIES = ["USD","EUR","GBP","AED","NOK","SGD","AUD"];
const DEPARTMENTS = ["Engineering","Deck","Interior","Provisions","Safety","Maintenance","Other"];
const EQUIPMENT = ["","Main Engine (Port)","Main Engine (Starboard)","Generator 1","Generator 2","Gearbox (Port)","Gearbox (Starboard)","Bow Thruster","Stern Thruster","Air Conditioning","Watermaker","Fuel Transfer Pump","Bilge Pump System","Fire Suppression System","Anchor & Windlass","Stabilisers","Life Raft (Port)","Life Raft (Starboard)","Tender","Tender Engine","Navigation System","Radar","Autopilot","Hydraulic System","Fresh Water System","Waste Management System","Other / General"];
const ST = { Pending:{bg:"#FFF8E1",color:"#E65100",border:"#FFE082"}, Approved:{bg:"#E8F5E9",color:"#2E7D32",border:"#A5D6A7"}, Rejected:{bg:"#FFEBEE",color:"#C62828",border:"#EF9A9A"} };
const USERS = { ce:{pin:"1111",role:"CE",name:"Chief Engineer"}, captain:{pin:"2222",role:"Captain",name:"Captain"} };
const DCOL = [TEAL,"#26A69A","#00838F","#4DB6AC","#80CBC4","#006064","#00ACC1"];
const SCOL = [TEAL,"#00838F","#26A69A","#006064","#4DB6AC"];
const emptyForm = {supplier:"",invoiceNo:"",invoiceDate:"",dueDate:"",amount:"",currency:"EUR",department:"Engineering",equipment:"",jobRef:"",notes:"",fileName:"",budgetId:""};
const emptyBudget = {name:"",limit:"",currency:"EUR",startDate:"",endDate:"",recurring:false};
const fmt = (n) => parseFloat(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
const SS = {
  btnT:{padding:"8px 16px",fontSize:14,fontWeight:500,background:TEAL,color:"#fff",border:"1px solid "+TEAL,borderRadius:4,cursor:"pointer"},
  btnO:{padding:"8px 16px",fontSize:14,fontWeight:500,background:"#fff",color:TEAL,border:"1px solid "+TEAL,borderRadius:4,cursor:"pointer"},
  btnG:{padding:"8px 16px",fontSize:14,background:"#fff",color:"#555",border:"1px solid #ccc",borderRadius:4,cursor:"pointer"},
  btnTs:{padding:"5px 12px",fontSize:13,fontWeight:500,background:TEAL,color:"#fff",border:"1px solid "+TEAL,borderRadius:4,cursor:"pointer"},
  btnGs:{padding:"5px 12px",fontSize:13,background:"#fff",color:"#555",border:"1px solid #ccc",borderRadius:4,cursor:"pointer"},
  inp:{width:"100%",padding:"8px 11px",fontSize:14,border:"1px solid #ccc",borderRadius:4,outline:"none",fontFamily:"inherit",boxSizing:"border-box"},
  card:{background:"#fff",border:"1px solid #dde1e7",borderRadius:6,overflow:"hidden"}
};

function downloadInvoicePDF(inv, budgets) {
  const budget = budgets.find(b => b.id === (inv.budget_id || inv.budgetId));
  const html = `<html><head><style>body{font-family:Arial,sans-serif;padding:40px;color:#222;max-width:700px;margin:0 auto;}h1{color:#1AAFBF;}table{width:100%;border-collapse:collapse;margin-bottom:24px;}td{padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;}td:first-child{color:#666;width:180px;font-weight:500;}.badge{display:inline-block;padding:4px 12px;border-radius:4px;font-size:13px;font-weight:600;background:#E8F5E9;color:#2E7D32;}.sage{background:#f7f9fc;border:1px solid #dde1e7;border-radius:6px;padding:16px 20px;margin-top:24px;}.footer{margin-top:40px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#aaa;text-align:center;}</style></head><body><h1>Invoice Record</h1><p style="color:#888;font-size:13px;margin:0 0 32px">Generated ${new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</p><table><tr><td>Supplier</td><td><strong>${inv.supplier}</strong></td></tr><tr><td>Invoice No.</td><td>${inv.invoice_no||inv.invoiceNo||""}</td></tr><tr><td>Invoice date</td><td>${inv.invoice_date||inv.invoiceDate||""}</td></tr><tr><td>Due date</td><td>${inv.due_date||inv.dueDate||""}</td></tr><tr><td>Amount</td><td><strong>${inv.currency} ${fmt(inv.amount)}</strong></td></tr><tr><td>Department</td><td>${inv.department||""}</td></tr>${inv.equipment?'<tr><td>Equipment</td><td>'+inv.equipment+'</td></tr>':""}${(inv.job_ref||inv.jobRef)?'<tr><td>Job ref</td><td>'+(inv.job_ref||inv.jobRef)+'</td></tr>':""}${budget?'<tr><td>Budget</td><td>'+budget.name+'</td></tr>':""}${inv.notes?'<tr><td>Notes</td><td>'+inv.notes+'</td></tr>':""}<tr><td>Status</td><td><span class="badge">Approved</span></td></tr></table><div class="sage"><h3 style="margin:0 0 12px;font-size:14px;color:#444;">Sage import reference</h3><table><tr><td style="color:#666;width:160px">Supplier</td><td>${inv.supplier}</td></tr><tr><td style="color:#666">Invoice ref</td><td>${inv.invoice_no||inv.invoiceNo||""}</td></tr><tr><td style="color:#666">Invoice date</td><td>${inv.invoice_date||inv.invoiceDate||""}</td></tr><tr><td style="color:#666">Due date</td><td>${inv.due_date||inv.dueDate||""}</td></tr><tr><td style="color:#666">Net amount</td><td>${inv.currency} ${fmt(inv.amount)}</td></tr><tr><td style="color:#666">Nominal code</td><td>${inv.department||""}</td></tr></table></div><div class="footer">Invoice Platform · Approved by Captain · ${new Date().toLocaleDateString("en-GB")}</div></body></html>`;
  const blob = new Blob([html], {type:"text/html"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Invoice-"+(inv.invoice_no||inv.invoiceNo||"")+"-"+inv.supplier.replace(/\s+/g,"-")+".html";
  a.click();
  URL.revokeObjectURL(url);
}

async function extractInvoiceData(file) {
  const b64 = await new Promise((res,rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = rej; r.readAsDataURL(file); });
  const prompt = "Extract invoice data from this document. The SUPPLIER is the company that ISSUED the invoice (usually at the top, with the logo/letterhead) — NOT the bill-to / customer / shipping company. Read proforma invoices and reverse-charge (inversione contabile / non soggetto) documents too. For amount, use the final total payable (Total Due / Amount Due / Net Amount To Pay / Document Total). Detect currency from the symbol or code: GBP for \u00a3, EUR for \u20ac, USD for $. Return ONLY JSON, no markdown: {supplier, invoiceNo, invoiceDate (YYYY-MM-DD), dueDate (YYYY-MM-DD or empty), amount (number string, no thousands separators), currency (ISO 3-letter), notes (max 100 chars), language}. If you cannot read the document at all, return {\"error\":\"unreadable\"}.";
  const res = await fetch("https://api.anthropic.com/v1/messages", {method:"POST",headers:{"Content-Type":"application/json","x-api-key":ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:[{type:file.type.startsWith("image/")?"image":"document",source:{type:"base64",media_type:file.type,data:b64}},{type:"text",text:prompt}]}]})});
  if (!res.ok) { const t = await res.text(); throw new Error("API "+res.status+": "+t.slice(0,200)); }
  const data = await res.json();
  const text = (data.content && data.content.find(b => b.type==="text") || {}).text || "{}";
  const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
  if (parsed.error) throw new Error("Could not read document");
  return parsed;
}

function LoginScreen({ onLogin }) {
  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [showPin, setShowPin] = useState(false);
  const tryLogin = () => {
    const user = Object.values(USERS).find(u => u.role.toLowerCase() === selected);
    if (!user) return;
    if (pin === user.pin) { onLogin(user.role, user.name); }
    else { setError("Incorrect PIN. Try again."); setPin(""); }
  };
  return (
    <div style={{minHeight:"100vh",background:"#f4f6f8",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <p style={{fontSize:28,fontWeight:700,color:TEAL,margin:"0 0 6px"}}>INVOICE PLATFORM</p>
      <p style={{fontSize:14,color:"#888",margin:"0 0 32px"}}>Vessel invoice management</p>
      {!selected && (
        <div style={{background:"#fff",border:"1px solid #dde1e7",borderRadius:8,padding:"32px 40px",width:"100%",maxWidth:380}}>
          <p style={{fontSize:16,fontWeight:600,color:"#222",margin:"0 0 24px",textAlign:"center"}}>Who are you?</p>
          {[{key:"ce",icon:"🔧",label:"Chief Engineer",sub:"Upload & manage invoices"},{key:"captain",icon:"⚓",label:"Captain",sub:"Review & approve invoices"}].map(u => (
            <button key={u.key} onClick={() => { setSelected(u.key); setPin(""); setError(""); }} style={{width:"100%",padding:"16px 20px",fontSize:15,fontWeight:500,background:"#fff",color:"#222",border:"2px solid #dde1e7",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:14,textAlign:"left",marginBottom:12}}>
              <span style={{fontSize:28}}>{u.icon}</span>
              <div><p style={{margin:"0 0 2px",fontWeight:600}}>{u.label}</p><p style={{margin:0,fontSize:12,color:"#888"}}>{u.sub}</p></div>
            </button>
          ))}
        </div>
      )}
      {selected && (
        <div style={{background:"#fff",border:"1px solid #dde1e7",borderRadius:8,padding:"32px 40px",width:"100%",maxWidth:340,textAlign:"center"}}>
          <p style={{fontSize:28,margin:"0 0 8px"}}>{selected==="ce"?"🔧":"⚓"}</p>
          <p style={{fontSize:16,fontWeight:600,color:"#222",margin:"0 0 4px"}}>{selected==="ce"?"Chief Engineer":"Captain"}</p>
          <p style={{fontSize:13,color:"#888",margin:"0 0 24px"}}>Enter your PIN</p>
          <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:8}}>
            {[0,1,2,3].map(i => <div key={i} style={{width:14,height:14,borderRadius:"50%",background:pin.length>i?TEAL:"#e0e0e0"}}/>)}
          </div>
          <div style={{position:"relative",marginBottom:16}}>
            <input type={showPin?"text":"password"} value={pin} maxLength={4} placeholder="4-digit PIN" autoFocus onChange={e => { setPin(e.target.value.replace(/\D/g,"").slice(0,4)); setError(""); }} onKeyDown={e => { if(e.key==="Enter") tryLogin(); }} style={{...SS.inp,textAlign:"center",fontSize:20,letterSpacing:8,borderColor:error?"#C62828":"#ccc",paddingRight:40}}/>
            <button onClick={() => setShowPin(v => !v)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#aaa"}}>{showPin?"🙈":"👁"}</button>
          </div>
          {error && <p style={{fontSize:13,color:"#C62828",margin:"0 0 12px"}}>{error}</p>}
          <button onClick={tryLogin} style={{...SS.btnT,width:"100%",marginBottom:12}}>Sign in</button>
          <button onClick={() => { setSelected(null); setPin(""); setError(""); }} style={{background:"none",border:"none",fontSize:13,color:"#888",cursor:"pointer"}}>← Back</button>
          <p style={{fontSize:11,color:"#ccc",margin:"20px 0 0"}}>CE: 1111 · Captain: 2222</p>
        </div>
      )}
    </div>
  );
}

function Badge({ status }) {
  const s = ST[status];
  return <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:4,fontSize:13,fontWeight:500,background:s.bg,color:s.color,border:"1px solid "+s.border,whiteSpace:"nowrap"}}>{status}</span>;
}
function Lbl({ children, required }) {
  return <label style={{display:"block",fontSize:13,fontWeight:500,color:"#444",marginBottom:5}}>{children}{required && <span style={{color:"#C62828",marginLeft:2}}>*</span>}</label>;
}
function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{background:"#fff",border:"1px solid #dde1e7",borderRadius:6,padding:"16px 20px",borderTop:"3px solid "+(accent||TEAL)}}>
      <p style={{fontSize:13,color:"#666",fontWeight:500,margin:"0 0 8px"}}>{label}</p>
      <p style={{fontSize:26,fontWeight:700,color:"#222",lineHeight:1,margin:0}}>{value}</p>
      {sub && <p style={{fontSize:12,color:"#888",margin:"4px 0 0"}}>{sub}</p>}
    </div>
  );
}
function MiniBar({ pct, color }) {
  return <div style={{height:6,borderRadius:3,background:"#e8e8e8",overflow:"hidden",marginTop:8}}><div style={{height:"100%",width:Math.min(pct,100)+"%",background:color,borderRadius:3}}/></div>;
}
function DropZone({ onFile, fileName, extracting }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef();
  const handle = f => { if(f && (f.type==="application/pdf" || f.type.startsWith("image/"))) onFile(f); };
  return (
    <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);handle(e.dataTransfer.files[0]);}} onClick={()=>{if(!extracting)ref.current.click();}} style={{border:"2px dashed "+(drag?TEAL:"#ccc"),borderRadius:6,padding:"32px 20px",cursor:extracting?"default":"pointer",textAlign:"center",background:drag?TEAL_LIGHT:"#fafafa"}}>
      <input ref={ref} type="file" accept=".pdf,image/*" style={{display:"none"}} onChange={e=>handle(e.target.files[0])}/>
      {extracting?<div><p style={{fontSize:14,fontWeight:500,color:"#333",margin:"0 0 4px"}}>Extracting...</p><p style={{fontSize:13,color:"#777",margin:0}}>EN / IT / FR</p></div>
      :fileName?<div><p style={{fontSize:14,fontWeight:500,color:"#333",margin:"0 0 4px"}}>✓ {fileName}</p><p style={{fontSize:13,color:"#777",margin:0}}>Click to replace</p></div>
      :<div><p style={{fontSize:22,margin:"0 0 8px"}}>📄</p><p style={{fontSize:14,fontWeight:500,color:"#444",margin:"0 0 4px"}}>Drop invoice PDF here</p><p style={{fontSize:13,color:"#888",margin:0}}>or click to browse · EN · IT · FR</p></div>}
    </div>
  );
}

function InvoiceTable({ invoices, budgets, onStatus, showActions, onEdit }) {
  return (
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
      <thead><tr style={{background:"#f7f8fa"}}>{["Supplier","Invoice No.","Invoice Date","Amount","Status","Actions"].map(h => <th key={h} style={{padding:"11px 16px",textAlign:"left",fontWeight:600,color:"#555",fontSize:13,borderBottom:"2px solid #e0e0e0",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
      <tbody>
        {invoices.length===0 && <tr><td colSpan={6} style={{padding:"2.5rem",textAlign:"center",color:"#999"}}>No invoices found</td></tr>}
        {invoices.map((inv,i) => (
          <tr key={inv.id} style={{borderBottom:"1px solid #f0f0f0",background:i%2===0?"#fff":"#fafbfc"}}>
            <td style={{padding:"13px 16px",fontWeight:600,color:"#222"}}>{inv.supplier}</td>
            <td style={{padding:"13px 16px",color:"#555"}}>{inv.invoice_no||inv.invoiceNo}</td>
            <td style={{padding:"13px 16px",color:"#555"}}>{(function(d){if(!d)return "—";var p=String(d).split("-");return p.length===3?p[2]+"."+p[1]+"."+p[0]:d;})(inv.invoice_date||inv.invoiceDate)}</td>
            <td style={{padding:"13px 16px",fontWeight:600}}>{inv.currency} {fmt(inv.amount)}</td>
            <td style={{padding:"13px 16px"}}><Badge status={inv.status}/></td>
            <td style={{padding:"10px 16px"}}>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {showActions && inv.status==="Pending" && <><button style={SS.btnTs} onClick={()=>onStatus(inv.id,"Approved")}>✓ Approve</button><button style={{...SS.btnGs,color:"#C62828",borderColor:"#EF9A9A"}} onClick={()=>onStatus(inv.id,"Rejected")}>✕ Reject</button></>}
                {showActions && inv.status!=="Pending" && <button style={SS.btnGs} onClick={()=>onStatus(inv.id,"Pending")}>↺ Reset</button>}
                {onEdit && <button style={SS.btnGs} onClick={()=>onEdit(inv)}>✏️ Edit</button>}
                {inv.status==="Approved" && <button onClick={()=>downloadInvoicePDF(inv,budgets)} style={{...SS.btnGs,color:"#2E7D32",borderColor:"#A5D6A7",fontSize:12,padding:"4px 10px"}}>⬇ Sage</button>}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EditInvoiceModal({ inv, budgets, onSave, onClose }) {
  const [notes, setNotes] = useState(inv.notes || "");
  const [budgetId, setBudgetId] = useState(inv.budget_id || inv.budgetId || "");
  const [department, setDepartment] = useState(inv.department || "Engineering");
  const [equipment, setEquipment] = useState(inv.equipment || "");
  const [jobRef, setJobRef] = useState(inv.job_ref || inv.jobRef || "");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    await onSave(inv.id, {notes, budget_id:budgetId||null, department, equipment:equipment||null, job_ref:jobRef||null});
    setSaving(false);
    onClose();
  };
  const lockRow = (label, value) => (
    <div style={{display:"flex",justifyContent:"space-between",padding:"7px 0",fontSize:13,borderBottom:"1px solid #f3f3f3"}}>
      <span style={{color:"#888"}}>{label}</span><span style={{fontWeight:600,color:"#444"}}>{value}</span>
    </div>
  );
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:500,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"5vh 16px",overflowY:"auto"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:8,width:"100%",maxWidth:480,boxShadow:"0 12px 40px rgba(0,0,0,0.2)"}}>
        <div style={{padding:"18px 22px",borderBottom:"1px solid #eee",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <p style={{fontSize:17,fontWeight:700,color:"#222",margin:0}}>Edit invoice</p>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,color:"#aaa",cursor:"pointer",lineHeight:1}}>×</button>
        </div>
        <div style={{padding:"18px 22px"}}>
          <div style={{background:"#f7f9fc",border:"1px solid #e5e9ef",borderRadius:6,padding:"10px 14px",marginBottom:18}}>
            <p style={{fontSize:11,fontWeight:600,color:"#999",textTransform:"uppercase",letterSpacing:"0.05em",margin:"0 0 6px"}}>🔒 Figures locked (as approved for accounts)</p>
            {lockRow("Supplier", inv.supplier)}
            {lockRow("Invoice no.", inv.invoice_no||inv.invoiceNo||"—")}
            {lockRow("Invoice date", inv.invoice_date||inv.invoiceDate||"—")}
            {lockRow("Due date", inv.due_date||inv.dueDate||"—")}
            {lockRow("Amount", inv.currency+" "+fmt(inv.amount))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><Lbl>Department</Lbl><select value={department} onChange={e=>setDepartment(e.target.value)} style={SS.inp}>{DEPARTMENTS.map(d=><option key={d}>{d}</option>)}</select></div>
              <div><Lbl>Job reference</Lbl><input value={jobRef} placeholder="e.g. JR-001" onChange={e=>setJobRef(e.target.value)} style={SS.inp}/></div>
            </div>
            <div><Lbl>Equipment</Lbl><select value={equipment} onChange={e=>setEquipment(e.target.value)} style={SS.inp}><option value="">— None —</option>{EQUIPMENT.filter(e=>e).map(eq=><option key={eq}>{eq}</option>)}</select></div>
            <div><Lbl>Assign to budget</Lbl><select value={budgetId} onChange={e=>setBudgetId(e.target.value)} style={SS.inp}><option value="">— None —</option>{budgets.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
            <div><Lbl>Notes</Lbl><textarea value={notes} rows={3} placeholder="Additional details…" onChange={e=>setNotes(e.target.value)} style={{...SS.inp,resize:"vertical",lineHeight:1.5}}/></div>
          </div>
        </div>
        <div style={{padding:"16px 22px",borderTop:"1px solid #eee",display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button style={SS.btnG} onClick={onClose} disabled={saving}>Cancel</button>
          <button style={SS.btnT} onClick={save} disabled={saving}>{saving?"Saving…":"Save changes"}</button>
        </div>
      </div>
    </div>
  );
}

function BudgetList({ budgets, invoices, onSelect, onAdd, onEdit, onDelete }) {
  const [addB, setAddB] = useState(false);
  const [editB, setEditB] = useState(null);
  const [bForm, setBForm] = useState(emptyBudget);
  const [bErr, setBErr] = useState({});
  const bSpend = id => invoices.filter(i => (i.budget_id||i.budgetId)===id && i.status!=="Rejected").reduce((s,i) => s+parseFloat(i.amount||0), 0);
  const bCount = id => invoices.filter(i => (i.budget_id||i.budgetId)===id).length;
  const submit = async () => {
    const e = {};
    if (!bForm.name.trim()) e.name = true;
    if (!bForm.limit || isNaN(bForm.limit) || parseFloat(bForm.limit)<=0) e.limit = true;
    setBErr(e); if (Object.keys(e).length) return;
    if (editB) {
      await onEdit(editB.id, bForm);
      setEditB(null);
    } else {
      const res = await supabase.from("budgets").insert([{name:bForm.name,limit_amount:parseFloat(bForm.limit),currency:bForm.currency,start_date:bForm.startDate||null,end_date:bForm.endDate||null,recurring:bForm.recurring}]).select();
      if (res.data && res.data[0]) onAdd(res.data[0]);
    }
    setBForm(emptyBudget); setAddB(false); setBErr({});
  };
  const startEdit = (b) => {
    setEditB(b);
    setBForm({name:b.name,limit:b.limit_amount||b.limit||"",currency:b.currency,startDate:b.start_date||"",endDate:b.end_date||"",recurring:b.recurring||false});
    setAddB(true);
  };
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <p style={{fontSize:20,fontWeight:700,color:"#222",margin:0}}>Budgets</p>
        <button style={SS.btnT} onClick={()=>{setAddB(v=>!v);setEditB(null);setBForm(emptyBudget);}}>+ New budget</button>
      </div>
      {addB && (
        <div style={{...SS.card,padding:20,marginBottom:16}}>
          <p style={{fontSize:14,fontWeight:600,margin:"0 0 14px"}}>{editB?"Edit budget":"New budget"}</p>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:14,marginBottom:14}}>
            <div><Lbl required>Budget name</Lbl><input value={bForm.name} placeholder="e.g. Summer Season" onChange={e=>{const v=e.target.value;setBForm(p=>({...p,name:v}));}} style={{...SS.inp,borderColor:bErr.name?"#C62828":"#ccc"}}/>{bErr.name&&<p style={{fontSize:12,color:"#C62828",margin:"4px 0 0"}}>Required</p>}</div>
            <div><Lbl required>Limit</Lbl><input type="number" min="0" value={bForm.limit} placeholder="0.00" onChange={e=>{const v=e.target.value;setBForm(p=>({...p,limit:v}));}} style={{...SS.inp,borderColor:bErr.limit?"#C62828":"#ccc"}}/>{bErr.limit&&<p style={{fontSize:12,color:"#C62828",margin:"4px 0 0"}}>Required</p>}</div>
            <div><Lbl>Currency</Lbl><select value={bForm.currency} onChange={e=>{const v=e.target.value;setBForm(p=>({...p,currency:v}));}} style={SS.inp}>{CURRENCIES.map(c=><option key={c}>{c}</option>)}</select></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
            <div><Lbl>Start date</Lbl><input type="date" value={bForm.startDate} onChange={e=>{const v=e.target.value;setBForm(p=>({...p,startDate:v}));}} style={SS.inp}/></div>
            <div><Lbl>End date</Lbl><input type="date" value={bForm.endDate} onChange={e=>{const v=e.target.value;setBForm(p=>({...p,endDate:v}));}} style={SS.inp}/></div>
            <div style={{display:"flex",alignItems:"center",gap:8,paddingTop:22}}>
              <input type="checkbox" id="rec" checked={bForm.recurring} onChange={e=>{const v=e.target.checked;setBForm(p=>({...p,recurring:v}));}} style={{width:16,height:16,cursor:"pointer"}}/>
              <label htmlFor="rec" style={{fontSize:13,fontWeight:500,color:"#444",cursor:"pointer"}}>Monthly recurring</label>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button style={SS.btnTs} onClick={submit}>{editB?"Save changes":"Create"}</button>
            <button style={SS.btnGs} onClick={()=>{setAddB(false);setEditB(null);setBErr({});setBForm(emptyBudget);}}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {budgets.map(b => {
          const spend=bSpend(b.id), cnt=bCount(b.id), limit=parseFloat(b.limit_amount||b.limit||0);
          const pct=limit>0?(spend/limit)*100:0, over=pct>=100, warn=pct>=80;
          const barColor=over?"#F44336":warn?"#FF9800":"#4CAF50";
          return (
            <div key={b.id} style={{background:"#fff",border:"1px solid #dde1e7",borderRadius:6,padding:"16px 18px",borderTop:"3px solid "+TEAL}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <div style={{flex:1,cursor:"pointer"}} onClick={()=>onSelect(b.id)}>
                  <p style={{fontSize:15,fontWeight:600,color:"#222",margin:"0 0 6px"}}>{b.name}</p>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {b.recurring && <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:10,background:TEAL_LIGHT,color:TEAL,border:"1px solid "+TEAL}}>Monthly</span>}
                    {b.start_date && b.end_date && <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:"#f0f4f8",color:"#555",border:"1px solid #dde1e7"}}>{new Date(b.start_date).toLocaleDateString("en-GB",{month:"short",year:"numeric"})}–{new Date(b.end_date).toLocaleDateString("en-GB",{month:"short",year:"numeric"})}</span>}
                  </div>
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  <button onClick={e=>{e.stopPropagation();startEdit(b);}} style={{...SS.btnGs,padding:"3px 8px",fontSize:12}}>✏️ Edit</button>
                  <button onClick={e=>{e.stopPropagation();onDelete(b.id);}} style={{...SS.btnGs,padding:"3px 8px",fontSize:12,color:"#C62828",borderColor:"#EF9A9A"}}>✕</button>
                </div>
              </div>
              <p style={{fontSize:13,color:"#999",margin:"8px 0 10px",cursor:"pointer"}} onClick={()=>onSelect(b.id)}>{cnt} invoice{cnt!==1?"s":""}</p>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:2}}>
                <span style={{color:"#777"}}>Spent</span>
                <span style={{fontWeight:600}}>{b.currency} {fmt(spend)} <span style={{color:"#bbb",fontWeight:400}}>/ {fmt(limit)}</span></span>
              </div>
              <MiniBar pct={pct} color={barColor}/>
              <p style={{fontSize:12,margin:"6px 0 0",color:over?"#C62828":warn?"#E65100":"#888"}}>
                {over?"Over by "+b.currency+" "+fmt(spend-limit):b.currency+" "+fmt(limit-spend)+" remaining · "+Math.round(pct)+"% used"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BudgetDetail({ budget, invoices, budgets, onBack, onStatus }) {
  const limit = parseFloat(budget.limit_amount||budget.limit||0);
  const ci = invoices.filter(i => (i.budget_id||i.budgetId)===budget.id);
  const spend = ci.filter(i=>i.status!=="Rejected").reduce((s,i)=>s+parseFloat(i.amount||0),0);
  const rem = limit-spend, pct = limit>0?Math.round((spend/limit)*100):0;
  const byD = DEPARTMENTS.map(d=>({dept:d,total:ci.filter(i=>i.department===d&&i.status!=="Rejected").reduce((s,i)=>s+parseFloat(i.amount||0),0)})).filter(d=>d.total>0);
  const byS = [...new Set(ci.map(i=>i.supplier))].map(s=>({supplier:s,total:ci.filter(i=>i.supplier===s&&i.status!=="Rejected").reduce((s2,i)=>s2+parseFloat(i.amount||0),0)}));
  const cMax = Math.max(...byD.map(d=>d.total),...byS.map(s=>s.total),1);
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <button style={SS.btnGs} onClick={onBack}>← Budgets</button>
        <div><p style={{fontSize:20,fontWeight:700,color:"#222",margin:"0 0 2px"}}>{budget.name}</p><p style={{fontSize:13,color:"#888",margin:0}}>Limit: {budget.currency} {fmt(limit)}</p></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}>
        <StatCard label="Total spent" value={budget.currency+" "+fmt(spend)} accent={TEAL}/>
        <StatCard label="Remaining" value={budget.currency+" "+fmt(Math.max(0,rem))} accent="#4CAF50"/>
        <StatCard label="Budget used" value={pct+"%"} sub={ci.length+" invoice"+(ci.length!==1?"s":"")} accent="#FF9800"/>
      </div>
      {byD.length>0&&<div style={{...SS.card,padding:20,marginBottom:16}}><p style={{fontSize:13,fontWeight:600,color:"#555",textTransform:"uppercase",letterSpacing:"0.05em",margin:"0 0 16px"}}>Spend by department</p>{byD.sort((a,b)=>b.total-a.total).map((d,i)=><div key={d.dept} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",fontSize:14,marginBottom:5}}><span style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:10,height:10,borderRadius:2,background:DCOL[i%DCOL.length],display:"inline-block"}}/>{d.dept}</span><span style={{fontWeight:600}}>{budget.currency} {fmt(d.total)}</span></div><div style={{height:8,borderRadius:4,background:"#eee",overflow:"hidden"}}><div style={{height:"100%",width:((d.total/cMax)*100)+"%",background:DCOL[i%DCOL.length],borderRadius:4}}/></div></div>)}</div>}
      {byS.length>0&&<div style={{...SS.card,padding:20,marginBottom:16}}><p style={{fontSize:13,fontWeight:600,color:"#555",textTransform:"uppercase",letterSpacing:"0.05em",margin:"0 0 16px"}}>Spend by supplier</p>{byS.sort((a,b)=>b.total-a.total).map((s,i)=><div key={s.supplier} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",fontSize:14,marginBottom:5}}><span style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:10,height:10,borderRadius:2,background:SCOL[i%SCOL.length],display:"inline-block"}}/>{s.supplier}</span><span style={{fontWeight:600}}>{budget.currency} {fmt(s.total)}</span></div><div style={{height:8,borderRadius:4,background:"#eee",overflow:"hidden"}}><div style={{height:"100%",width:((s.total/cMax)*100)+"%",background:SCOL[i%SCOL.length],borderRadius:4}}/></div></div>)}</div>}
      <p style={{fontSize:13,fontWeight:600,color:"#555",textTransform:"uppercase",letterSpacing:"0.05em",margin:"0 0 10px"}}>Invoices</p>
      <div style={SS.card}><InvoiceTable invoices={ci} budgets={budgets} onStatus={onStatus} showActions={false}/></div>
    </div>
  );
}

function BulkUpload({ onBack, onSubmit }) {
  const [queue, setQueue] = useState([]);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef();
  const idRef = useRef(1000);
  const processOne = async (cur) => {
    const curId = cur.id;
    setQueue(q => q.map(x => x.id===curId?{...x,status:"extracting",error:null}:x));
    let lastErr = null;
    for (let attempt=0; attempt<2; attempt++) {
      try {
        const d = await extractInvoiceData(cur.file);
        if (!d.supplier && !d.amount && !d.invoiceNo) throw new Error("No fields found");
        let autoDue="";
        if(d.invoiceDate){const dt=new Date(d.invoiceDate);dt.setDate(dt.getDate()+30);autoDue=d.dueDate||dt.toISOString().split("T")[0];}
        const nd={supplier:d.supplier||"",invoiceNo:d.invoiceNo||"",invoiceDate:d.invoiceDate||"",dueDate:autoDue,amount:d.amount||"",currency:(d.currency&&CURRENCIES.includes(d.currency))?d.currency:"EUR",notes:d.notes||"",department:"Engineering",equipment:"",jobRef:"",budgetId:"",fileName:cur.file.name};
        setQueue(q => q.map(x => x.id===curId?{...x,status:"done",data:nd,error:null}:x));
        return;
      } catch(err) {
        lastErr = err;
        if (attempt===0) await new Promise(r=>setTimeout(r,1500));
      }
    }
    setQueue(q => q.map(x => x.id===curId?{...x,status:"error",error:(lastErr&&lastErr.message)||"Failed"}:x));
  };
  const handleFiles = async (files) => {
    const arr = Array.from(files).filter(f => f.type==="application/pdf" || f.type.startsWith("image/"));
    if (!arr.length) return;
    const items = arr.map(f => ({id:idRef.current++,file:f,fileName:f.name,status:"pending",error:null,data:{...emptyForm,fileName:f.name}}));
    setQueue(items);
    for (let i=0; i<items.length; i++) {
      await processOne(items[i]);
      if (i < items.length-1) await new Promise(r=>setTimeout(r,600));
    }
  };
  const retryItem = async (id) => {
    const item = queue.find(x=>x.id===id);
    if (item) await processOne(item);
  };
  const updateField=(id,field,value)=>setQueue(q=>q.map(x=>x.id===id?{...x,data:{...x.data,[field]:value}}:x));
  const removeItem=id=>setQueue(q=>q.filter(x=>x.id!==id));
  const done=queue.filter(x=>x.status==="done");
  const extr=queue.filter(x=>x.status==="extracting").length;
  const pct=queue.length>0?Math.round((done.length/queue.length)*100):0;
  const allDone=queue.length>0&&queue.every(x=>x.status==="done"||x.status==="error");
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
        <button style={SS.btnGs} onClick={onBack}>← Back</button>
        <div><p style={{fontSize:20,fontWeight:700,color:"#222",margin:"0 0 2px"}}>Bulk invoice upload</p><p style={{fontSize:13,color:"#888",margin:0}}>Select multiple PDFs — fields extracted automatically</p></div>
      </div>
      {queue.length===0&&<div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);handleFiles(e.dataTransfer.files);}} onClick={()=>fileRef.current.click()} style={{border:"2px dashed "+(drag?TEAL:"#ccc"),borderRadius:8,padding:"48px 20px",textAlign:"center",background:drag?TEAL_LIGHT:"#fafafa",cursor:"pointer"}}><input ref={fileRef} type="file" accept=".pdf,image/*" multiple style={{display:"none"}} onChange={e=>handleFiles(e.target.files)}/><p style={{fontSize:32,margin:"0 0 12px"}}>📂</p><p style={{fontSize:16,fontWeight:600,color:"#333",margin:"0 0 6px"}}>Drop invoices here or click to browse</p><p style={{fontSize:13,color:"#888",margin:0}}>Hold Ctrl or Cmd to select multiple</p></div>}
      {queue.length>0&&<div><div style={{...SS.card,padding:"14px 20px",marginBottom:16,display:"flex",alignItems:"center",gap:16}}><div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}><span style={{color:"#555"}}>{extr>0?"Extracting "+done.length+" of "+queue.length+"...":done.length+" of "+queue.length+" extracted"}</span><span style={{fontWeight:600,color:TEAL}}>{pct+"%"}</span></div><div style={{height:6,borderRadius:3,background:"#e8e8e8",overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:TEAL,borderRadius:3,transition:"width .3s"}}/></div></div><button style={SS.btnGs} onClick={()=>setQueue([])}>Clear all</button></div><div style={{...SS.card,marginBottom:16}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr style={{background:"#f7f8fa"}}>{["File","Supplier","Invoice No.","Date","Amount","Cur.","Status",""].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",fontWeight:600,color:"#555",fontSize:12,borderBottom:"2px solid #e0e0e0",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead><tbody>{queue.map((item,i)=><tr key={item.id} style={{borderBottom:"1px solid #f0f0f0",background:i%2===0?"#fff":"#fafbfc"}}><td style={{padding:"8px 12px",color:"#777",fontSize:12,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.fileName}</td><td style={{padding:"6px 8px"}}>{item.status==="done"?<input value={item.data.supplier} onChange={e=>{const v=e.target.value;updateField(item.id,"supplier",v);}} style={{...SS.inp,fontSize:13,padding:"4px 8px"}} placeholder="Supplier"/>:<span style={{color:"#aaa",fontSize:12}}>{item.status==="extracting"?"Extracting...":"Queued"}</span>}</td><td style={{padding:"6px 8px"}}>{item.status==="done"?<input value={item.data.invoiceNo} onChange={e=>{const v=e.target.value;updateField(item.id,"invoiceNo",v);}} style={{...SS.inp,fontSize:13,padding:"4px 8px"}} placeholder="INV-001"/>:<span style={{color:"#aaa",fontSize:12}}>—</span>}</td><td style={{padding:"6px 8px"}}>{item.status==="done"?<input type="date" value={item.data.invoiceDate} onChange={e=>{const d=e.target.value;let due="";if(d){const dt=new Date(d);dt.setDate(dt.getDate()+30);due=dt.toISOString().split("T")[0];}updateField(item.id,"invoiceDate",d);updateField(item.id,"dueDate",due);}} style={{...SS.inp,fontSize:13,padding:"4px 8px"}}/>:<span style={{color:"#aaa",fontSize:12}}>—</span>}</td><td style={{padding:"6px 8px"}}>{item.status==="done"?<input type="number" value={item.data.amount} onChange={e=>{const v=e.target.value;updateField(item.id,"amount",v);}} style={{...SS.inp,fontSize:13,padding:"4px 8px",width:80}} placeholder="0.00"/>:<span style={{color:"#aaa",fontSize:12}}>—</span>}</td><td style={{padding:"6px 8px"}}>{item.status==="done"?<select value={item.data.currency} onChange={e=>{const v=e.target.value;updateField(item.id,"currency",v);}} style={{...SS.inp,fontSize:13,padding:"4px 6px",width:72}}>{CURRENCIES.map(c=><option key={c}>{c}</option>)}</select>:<span style={{color:"#aaa",fontSize:12}}>—</span>}</td><td style={{padding:"10px 12px",whiteSpace:"nowrap"}}>{item.status==="extracting"&&<span style={{fontSize:12,color:TEAL}}>Extracting...</span>}{item.status==="pending"&&<span style={{fontSize:12,color:"#aaa"}}>Queued</span>}{item.status==="done"&&<span style={{fontSize:12,color:"#2E7D32",fontWeight:500}}>Ready</span>}{item.status==="error"&&<span style={{fontSize:12,color:"#C62828",display:"inline-flex",alignItems:"center",gap:6}} title={item.error||"Failed"}>Failed <button onClick={()=>retryItem(item.id)} style={{...SS.btnGs,padding:"2px 8px",fontSize:11}}>Retry</button></span>}</td><td style={{padding:"6px 8px"}}><button onClick={()=>removeItem(item.id)} style={{...SS.btnGs,padding:"3px 8px",fontSize:12,color:"#C62828",borderColor:"#EF9A9A"}}>✕</button></td></tr>)}</tbody></table></div>{allDone&&<div style={{display:"flex",alignItems:"center",gap:12}}><button style={SS.btnT} onClick={()=>onSubmit(done)}>Submit {done.length} invoice{done.length!==1?"s":""}</button><span style={{fontSize:13,color:"#888"}}>Review fields above before submitting</span></div>}</div>}
    </div>
  );
}

export default function App() {
  const [loggedIn,setLoggedIn]=useState(false);
  const [role,setRole]=useState(null);
  const [userName,setUserName]=useState("");
  const [page,setPage]=useState("invoices");
  const [view,setView]=useState("tracker");
  const [bulk,setBulk]=useState(false);
  const [invoices,setInv]=useState([]);
  const [budgets,setBudgets]=useState([]);
  const [selB,setSelB]=useState(null);
  const [form,setForm]=useState(emptyForm);
  const [err,setErr]=useState({});
  const [submitted,setSub]=useState(false);
  const [fStatus,setFS]=useState("All");
  const [search,setSearch]=useState("");
  const [extracting,setExtr]=useState(false);
  const [lang,setLang]=useState(null);
  const [notifs,setNotifs]=useState([]);
  const [showN,setShowN]=useState(false);
  const [loading,setLoading]=useState(false);
  const [editInv,setEditInv]=useState(null);
  const nRef=useRef();
  const nId=useRef(100);

  useEffect(()=>{const h=e=>{if(nRef.current&&!nRef.current.contains(e.target))setShowN(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  useEffect(()=>{if(loggedIn)loadData();},[loggedIn]);

  const loadData=async()=>{setLoading(true);const bRes=await supabase.from("budgets").select("*").order("created_at",{ascending:true});const iRes=await supabase.from("invoices").select("*").order("invoice_date",{ascending:true,nullsFirst:false});if(bRes.data)setBudgets(bRes.data);if(iRes.data)setInv(iRes.data);setLoading(false);};
  const handleLogin=(r,name)=>{setRole(r);setUserName(name);setLoggedIn(true);setView(r==="CE"?"tracker":"approvals");};
  const handleLogout=()=>{setLoggedIn(false);setRole(null);setUserName("");setPage("invoices");setView("tracker");setBulk(false);setSelB(null);};
  const myN=notifs.filter(n=>n.role===role);
  const unread=myN.filter(n=>!n.read).length;
  const push=(r,msg)=>setNotifs(p=>[...p,{id:nId.current++,role:r,msg,read:false}]);
  const markR=()=>setNotifs(p=>p.map(n=>n.role===role?{...n,read:true}:n));

  const updateStatus=async(id,status)=>{await supabase.from("invoices").update({status}).eq("id",id);await supabase.from("audit_log").insert([{invoice_id:id,action:status,performed_by:userName}]);setInv(p=>p.map(i=>i.id===id?{...i,status}:i));const inv=invoices.find(i=>i.id===id);if(inv)push("CE","Invoice "+(inv.invoice_no||inv.invoiceNo)+" has been "+status.toLowerCase());};

  const saveInvoiceEdit=async(id,fields)=>{const orig=invoices.find(i=>i.id===id)||{};const changed=Object.keys(fields).filter(k=>(fields[k]||"")!==((orig[k]!=null?orig[k]:"")||"")).join(", ");await supabase.from("invoices").update(fields).eq("id",id);await supabase.from("audit_log").insert([{invoice_id:id,action:"Edited"+(changed?": "+changed:""),performed_by:userName}]);setInv(p=>p.map(i=>i.id===id?{...i,...fields}:i));};

  const handleFile=async f=>{setExtr(true);setLang(null);try{const d=await extractInvoiceData(f);let autoDue="";if(d.invoiceDate){const dt=new Date(d.invoiceDate);dt.setDate(dt.getDate()+30);autoDue=d.dueDate||dt.toISOString().split("T")[0];}setForm(p=>({...p,fileName:f.name,supplier:d.supplier||p.supplier,invoiceNo:d.invoiceNo||p.invoiceNo,invoiceDate:d.invoiceDate||p.invoiceDate,dueDate:autoDue||p.dueDate,amount:d.amount||p.amount,currency:(d.currency&&CURRENCIES.includes(d.currency))?d.currency:p.currency,notes:d.notes||p.notes}));if(d.language)setLang(d.language);}catch(e){setForm(p=>({...p,fileName:f.name}));}setExtr(false);};

  const validate=()=>{const e={};if(!form.supplier.trim())e.supplier=true;if(!form.invoiceNo.trim())e.invoiceNo=true;if(!form.invoiceDate)e.invoiceDate=true;if(!form.dueDate)e.dueDate=true;if(!form.amount||isNaN(form.amount)||parseFloat(form.amount)<=0)e.amount=true;return e;};

  const submitInvoice=async()=>{const e=validate();setErr(e);if(Object.keys(e).length)return;const res=await supabase.from("invoices").insert([{supplier:form.supplier,invoice_no:form.invoiceNo,invoice_date:form.invoiceDate,due_date:form.dueDate,amount:parseFloat(form.amount),currency:form.currency,department:form.department,equipment:form.equipment||null,job_ref:form.jobRef||null,notes:form.notes||null,file_name:form.fileName||null,budget_id:form.budgetId||null,status:"Pending",created_by:userName}]).select();if(res.data&&res.data[0]){setInv(p=>[res.data[0],...p]);push("Captain","New invoice from "+form.supplier+" awaiting approval");setSub(true);}};

  const resetForm=()=>{setForm(emptyForm);setErr({});setSub(false);setLang(null);};

  const submitBulk=async(done)=>{const inserts=done.map(x=>({supplier:x.data.supplier,invoice_no:x.data.invoiceNo,invoice_date:x.data.invoiceDate||null,due_date:x.data.dueDate||null,amount:parseFloat(x.data.amount)||0,currency:x.data.currency,department:x.data.department,equipment:x.data.equipment||null,job_ref:x.data.jobRef||null,notes:x.data.notes||null,file_name:x.data.fileName||null,budget_id:x.data.budgetId||null,status:"Pending",created_by:userName}));const res=await supabase.from("invoices").insert(inserts).select();if(res.data)setInv(p=>[...res.data,...p]);push("Captain",done.length+" new invoice"+(done.length!==1?"s":"")+" awaiting approval");setBulk(false);setView("tracker");};

  const [sortOrder,setSortOrder]=useState("desc");
  const filtered=invoices.filter(i=>{const ms=fStatus==="All"||i.status===fStatus;const q=search.toLowerCase();return ms&&(!q||i.supplier.toLowerCase().includes(q)||(i.invoice_no||"").toLowerCase().includes(q)||(i.job_ref||"").toLowerCase().includes(q));}).sort((a,b)=>{const da=new Date(a.invoice_date||a.invoiceDate||0);const db=new Date(b.invoice_date||b.invoiceDate||0);return sortOrder==="desc"?db-da:da-db;});
  const pending=invoices.filter(i=>i.status==="Pending");
  const lF={English:"🇬🇧",Italian:"🇮🇹",French:"🇫🇷"};
  const F=(field,label,type="text",ph="",req=false)=>(<div><Lbl required={req}>{label}</Lbl><input type={type} value={form[field]} placeholder={ph} onChange={e=>{const v=e.target.value;setForm(p=>({...p,[field]:v}));}} style={{...SS.inp,borderColor:err[field]?"#C62828":"#ccc"}}/>{err[field]&&<p style={{fontSize:12,color:"#C62828",margin:"4px 0 0"}}>Required</p>}</div>);

  if(!loggedIn)return <LoginScreen onLogin={handleLogin}/>;
  if(loading)return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f4f6f8"}}><div style={{textAlign:"center"}}><p style={{fontSize:24,margin:"0 0 8px"}}>⏳</p><p style={{fontSize:14,color:"#888"}}>Loading...</p></div></div>;

  return (
    <div style={{fontFamily:"'Inter','Segoe UI',Arial,sans-serif",background:"#f4f6f8",minHeight:"100vh"}}>
      {editInv&&<EditInvoiceModal inv={editInv} budgets={budgets} onSave={saveInvoiceEdit} onClose={()=>setEditInv(null)}/>}
      <div style={{background:"#fff",borderBottom:"1px solid #dde1e7",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:54}}>
        <span style={{fontSize:18,fontWeight:700,color:TEAL}}>INVOICE PLATFORM</span>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:13,color:"#666"}}>{role==="CE"?"🔧":"⚓"} {userName}</span>
          <div style={{position:"relative"}} ref={nRef}>
            <button onClick={()=>{setShowN(v=>!v);if(!showN)markR();}} style={{...SS.btnGs,position:"relative"}}>🔔{unread>0&&<span style={{position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:"50%",background:"#F44336",color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{unread}</span>}</button>
            {showN&&<div style={{position:"absolute",right:0,top:"calc(100% + 6px)",width:300,background:"#fff",border:"1px solid #dde1e7",borderRadius:6,zIndex:300,boxShadow:"0 6px 20px rgba(0,0,0,.1)",overflow:"hidden"}}><p style={{padding:"12px 16px",fontSize:14,fontWeight:600,margin:0,borderBottom:"1px solid #f0f0f0"}}>Notifications</p>{myN.length===0&&<p style={{padding:"1rem 16px",fontSize:13,color:"#888",margin:0}}>Nothing yet</p>}{myN.slice().reverse().map(n=><div key={n.id} style={{padding:"11px 16px",borderBottom:"1px solid #f5f5f5",background:n.read?"#fff":"#f0fbfc",fontSize:13,color:"#333",lineHeight:1.5}}>{n.msg}</div>)}</div>}
          </div>
          <button onClick={handleLogout} style={{...SS.btnGs,fontSize:13}}>🚪 Sign out</button>
        </div>
      </div>
      <div style={{background:NAV_BG,padding:"0 24px",display:"flex"}}>
        {[{key:"invoices",label:"🧾 Invoices"},{key:"budgets",label:"📊 Budgets"}].map(n=><button key={n.key} onClick={()=>{setPage(n.key);setSelB(null);setBulk(false);}} style={{padding:"13px 20px",fontSize:13,fontWeight:page===n.key?600:400,color:page===n.key?"#fff":"rgba(255,255,255,0.65)",background:page===n.key?TEAL:"transparent",border:"none",cursor:"pointer",borderBottom:page===n.key?"3px solid #fff":"3px solid transparent",whiteSpace:"nowrap"}}>{n.label}</button>)}
      </div>
      {page==="invoices"&&!bulk&&<div style={{background:"#fff",borderBottom:"1px solid #dde1e7",padding:"0 24px",display:"flex"}}>{(role==="CE"?["tracker","upload"]:["approvals"]).map(v=><button key={v} onClick={()=>setView(v)} style={{padding:"12px 18px",fontSize:14,fontWeight:view===v?600:400,color:view===v?TEAL:"#555",background:"transparent",border:"none",borderBottom:view===v?"3px solid "+TEAL:"3px solid transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:7,marginBottom:-1}}>{v==="tracker"?"📋 Tracker":v==="upload"?"⬆️ Upload":"✅ Approvals"}{v==="approvals"&&pending.length>0&&<span style={{background:"#FF9800",color:"#fff",fontSize:11,fontWeight:700,padding:"1px 7px",borderRadius:10}}>{pending.length}</span>}</button>)}</div>}
      <div style={{padding:24}}>
        {page==="budgets"&&!selB&&<BudgetList budgets={budgets} invoices={invoices} onSelect={setSelB} onAdd={b=>setBudgets(p=>[...p,b])} onEdit={async(id,f)=>{await supabase.from("budgets").update({name:f.name,limit_amount:parseFloat(f.limit),currency:f.currency,start_date:f.startDate||null,end_date:f.endDate||null,recurring:f.recurring}).eq("id",id);setBudgets(p=>p.map(b=>b.id===id?{...b,name:f.name,limit_amount:parseFloat(f.limit),currency:f.currency,start_date:f.startDate||null,end_date:f.endDate||null,recurring:f.recurring}:b));}} onDelete={async(id)=>{if(!window.confirm("Delete this budget?"))return;await supabase.from("budgets").delete().eq("id",id);setBudgets(p=>p.filter(b=>b.id!==id));}}/>}
        {page==="budgets"&&selB&&<BudgetDetail budget={budgets.find(b=>b.id===selB)} invoices={invoices} budgets={budgets} onBack={()=>setSelB(null)} onStatus={updateStatus}/>}
        {page==="invoices"&&bulk&&<BulkUpload onBack={()=>setBulk(false)} onSubmit={submitBulk}/>}
        {page==="invoices"&&!bulk&&view==="tracker"&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div><p style={{fontSize:20,fontWeight:700,color:"#222",margin:"0 0 2px"}}>Invoice tracker</p><p style={{fontSize:13,color:"#888",margin:0}}>{role==="CE"?"Chief engineer":"Captain"}</p></div>
            {role==="CE"&&<div style={{display:"flex",gap:8}}><button style={SS.btnT} onClick={()=>setView("upload")}>+ New invoice</button><button style={SS.btnO} onClick={()=>setBulk(true)}>📂 Bulk upload</button></div>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:20}}>{["Pending","Approved","Rejected"].map((s,i)=>{const total=invoices.filter(x=>x.status===s).reduce((t,x)=>t+parseFloat(x.amount||0),0);return <StatCard key={s} label={s} value={invoices.filter(x=>x.status===s).length} sub={"EUR "+fmt(total)} accent={["#FF9800","#4CAF50","#F44336"][i]}/>;})}</div>
          <div style={SS.card}>
            <div style={{padding:"14px 16px",borderBottom:"1px solid #f0f0f0",display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
              <input placeholder="🔍 Search supplier, invoice no., job ref…" value={search} onChange={e=>setSearch(e.target.value)} style={{...SS.inp,flex:1,minWidth:180}}/>
              <div style={{display:"flex",gap:6}}>{["All","Pending","Approved","Rejected"].map(s=><button key={s} onClick={()=>setFS(s)} style={fStatus===s?SS.btnTs:SS.btnGs}>{s}</button>)}<button onClick={()=>setSortOrder(o=>o==="desc"?"asc":"desc")} style={{...SS.btnGs,fontSize:12}}>{sortOrder==="desc"?"📅 Newest first":"📅 Oldest first"}</button></div>
            </div>
            <InvoiceTable invoices={filtered} budgets={budgets} onStatus={updateStatus} showActions={true} onEdit={setEditInv}/>
            <div style={{padding:"10px 16px",borderTop:"1px solid #f0f0f0"}}><span style={{fontSize:13,color:"#888"}}>{filtered.length+" invoice"+(filtered.length!==1?"s":"")+" shown"}</span></div>
          </div>
        </div>}
        {page==="invoices"&&!bulk&&view==="upload"&&!submitted&&<div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}><button style={SS.btnGs} onClick={()=>setView("tracker")}>← Back</button><p style={{fontSize:20,fontWeight:700,color:"#222",margin:0}}>Upload invoice</p></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,maxWidth:860}}>
            <div style={{...SS.card,padding:20}}>
              <p style={{fontSize:15,fontWeight:600,color:"#222",margin:"0 0 14px",paddingBottom:10,borderBottom:"2px solid "+TEAL,display:"inline-block"}}>Attach document</p>
              <DropZone onFile={handleFile} fileName={form.fileName} extracting={extracting}/>
              {lang&&<div style={{marginTop:12,padding:"10px 14px",background:"#E8F5E9",borderRadius:4,border:"1px solid #A5D6A7",fontSize:13,color:"#2E7D32"}}>✨ Extracted from {lang} {lF[lang]||""} — review fields</div>}
            </div>
            <div style={{...SS.card,padding:20}}>
              <p style={{fontSize:15,fontWeight:600,color:"#222",margin:"0 0 14px",paddingBottom:10,borderBottom:"2px solid "+TEAL,display:"inline-block"}}>Invoice details</p>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {F("supplier","Supplier name","text","e.g. Seatech",true)}
                  {F("invoiceNo","Invoice number","text","e.g. INV-001",true)}
                  <div><Lbl required>Invoice date</Lbl><input type="date" value={form.invoiceDate} onChange={e=>{const d=e.target.value;let due="";if(d){const dt=new Date(d);dt.setDate(dt.getDate()+30);due=dt.toISOString().split("T")[0];}setForm(p=>({...p,invoiceDate:d,dueDate:due}));}} style={{...SS.inp,borderColor:err.invoiceDate?"#C62828":"#ccc"}}/>{err.invoiceDate&&<p style={{fontSize:12,color:"#C62828",margin:"4px 0 0"}}>Required</p>}</div>
                  <div><Lbl required>Due date <span style={{fontWeight:400,color:"#aaa",fontSize:11}}>auto +30 days</span></Lbl><input type="date" value={form.dueDate} onChange={e=>{const v=e.target.value;setForm(p=>({...p,dueDate:v}));}} style={{...SS.inp,borderColor:err.dueDate?"#C62828":"#ccc"}}/>{err.dueDate&&<p style={{fontSize:12,color:"#C62828",margin:"4px 0 0"}}>Required</p>}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12}}>
                  <div><Lbl required>Amount</Lbl><input type="number" min="0" step="0.01" value={form.amount} placeholder="0.00" onChange={e=>{const v=e.target.value;setForm(p=>({...p,amount:v}));}} style={{...SS.inp,borderColor:err.amount?"#C62828":"#ccc"}}/>{err.amount&&<p style={{fontSize:12,color:"#C62828",margin:"4px 0 0"}}>Required</p>}</div>
                  <div><Lbl>Currency</Lbl><select value={form.currency} onChange={e=>{const v=e.target.value;setForm(p=>({...p,currency:v}));}} style={SS.inp}>{CURRENCIES.map(c=><option key={c}>{c}</option>)}</select></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div><Lbl>Department</Lbl><select value={form.department} onChange={e=>{const v=e.target.value;setForm(p=>({...p,department:v}));}} style={SS.inp}>{DEPARTMENTS.map(d=><option key={d}>{d}</option>)}</select></div>
                  {F("jobRef","Job reference","text","e.g. JR-001")}
                </div>
                <div><Lbl>Equipment</Lbl><select value={form.equipment} onChange={e=>{const v=e.target.value;setForm(p=>({...p,equipment:v}));}} style={SS.inp}><option value="">— None —</option>{EQUIPMENT.filter(e=>e).map(eq=><option key={eq}>{eq}</option>)}</select></div>
                <div><Lbl>Assign to budget</Lbl><select value={form.budgetId} onChange={e=>{const v=e.target.value;setForm(p=>({...p,budgetId:v||""}));}} style={SS.inp}><option value="">— None —</option>{budgets.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                <div><Lbl>Notes</Lbl><textarea value={form.notes} rows={2} placeholder="Additional details…" onChange={e=>{const v=e.target.value;setForm(p=>({...p,notes:v}));}} style={{...SS.inp,resize:"vertical",lineHeight:1.5}}/></div>
                <div style={{display:"flex",gap:10}}><button style={SS.btnT} onClick={submitInvoice} disabled={extracting}>Submit invoice</button><button style={SS.btnG} onClick={resetForm}>Clear</button></div>
              </div>
            </div>
          </div>
        </div>}
        {page==="invoices"&&!bulk&&view==="upload"&&submitted&&<div style={{maxWidth:440,margin:"3rem auto",textAlign:"center"}}><div style={{width:60,height:60,borderRadius:"50%",background:"#E8F5E9",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:28}}>✓</div><p style={{fontSize:18,fontWeight:700,color:"#222",marginBottom:8}}>Invoice submitted</p><p style={{fontSize:14,color:"#666",marginBottom:24,lineHeight:1.6}}>{form.invoiceNo||"Invoice"} from <strong>{form.supplier}</strong> is pending. Captain notified.</p><div style={{display:"flex",gap:10,justifyContent:"center"}}><button style={SS.btnT} onClick={resetForm}>Submit another</button><button style={SS.btnO} onClick={()=>{setView("tracker");setSub(false);}}>View tracker</button></div></div>}
        {page==="invoices"&&!bulk&&view==="approvals"&&<div>
          <div style={{marginBottom:20}}><p style={{fontSize:20,fontWeight:700,color:"#222",margin:"0 0 2px"}}>Approvals</p><p style={{fontSize:13,color:"#888",margin:0}}>Captain</p></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}><StatCard label="Awaiting" value={pending.length} accent="#FF9800"/><StatCard label="Approved" value={invoices.filter(i=>i.status==="Approved").length} accent="#4CAF50"/><StatCard label="Rejected" value={invoices.filter(i=>i.status==="Rejected").length} accent="#F44336"/></div>
          {pending.length===0&&<div style={{...SS.card,padding:"3rem",textAlign:"center"}}><p style={{fontSize:32,margin:"0 0 12px"}}>✅</p><p style={{fontSize:16,fontWeight:600,color:"#333",margin:"0 0 4px"}}>All caught up</p><p style={{fontSize:14,color:"#999",margin:0}}>No invoices pending</p></div>}
          {pending.map(inv=>{const budget=budgets.find(b=>b.id===(inv.budget_id||inv.budgetId));return(
            <div key={inv.id} style={{...SS.card,marginBottom:12,borderLeft:"4px solid "+TEAL}}>
              <div style={{padding:"16px 20px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16}}>
                  <div><p style={{fontSize:16,fontWeight:600,color:"#222",margin:"0 0 4px"}}>{inv.supplier}</p><p style={{fontSize:13,color:"#777",margin:0}}>{(inv.invoice_no||inv.invoiceNo)+" · "+inv.department+(inv.equipment?" · "+inv.equipment:"")+" · "+(inv.invoice_date||inv.invoiceDate)+(inv.job_ref||inv.jobRef?" · Ref: "+(inv.job_ref||inv.jobRef):"")}</p></div>
                  <div style={{textAlign:"right",flexShrink:0}}><p style={{fontSize:20,fontWeight:700,color:"#222",margin:"0 0 3px"}}>{inv.currency+" "+fmt(inv.amount)}</p>{budget&&<p style={{fontSize:12,color:"#888",margin:0}}>{budget.name}</p>}</div>
                </div>
                {inv.notes&&<p style={{fontSize:13,color:"#555",padding:"9px 12px",background:"#f7f8fa",borderRadius:4,borderLeft:"3px solid #dde1e7",margin:"12px 0 0"}}>{inv.notes}</p>}
                <div style={{display:"flex",gap:8,marginTop:14}}><button style={SS.btnTs} onClick={()=>updateStatus(inv.id,"Approved")}>✓ Approve</button><button style={{...SS.btnGs,color:"#C62828",borderColor:"#EF9A9A"}} onClick={()=>updateStatus(inv.id,"Rejected")}>✕ Reject</button><button style={SS.btnGs} onClick={()=>setEditInv(inv)}>✏️ Edit</button></div>
              </div>
            </div>
          );})}
          {invoices.filter(i=>i.status==="Approved").length>0&&<div><p style={{fontSize:13,fontWeight:600,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",margin:"24px 0 10px"}}>Approved — ready for Sage</p><div style={SS.card}><InvoiceTable invoices={invoices.filter(i=>i.status==="Approved")} budgets={budgets} onStatus={updateStatus} showActions={false} onEdit={setEditInv}/></div></div>}
          {invoices.filter(i=>i.status==="Rejected").length>0&&<div><p style={{fontSize:13,fontWeight:600,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",margin:"20px 0 10px"}}>Rejected</p><div style={SS.card}><InvoiceTable invoices={invoices.filter(i=>i.status==="Rejected")} budgets={budgets} onStatus={updateStatus} showActions={true}/></div></div>}
        </div>}
      </div>
    </div>
  );
}
