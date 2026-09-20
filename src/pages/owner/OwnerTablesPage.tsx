import React,{useState}from'react';
import{QRCodeSVG}from'qrcode.react';
import{Plus,RefreshCw,Copy,CheckCircle2}from'lucide-react';
import{useData}from'../../context/DataContext';
import{api}from'../../services/api';

export function OwnerTablesPage(){
  const{getCurrentHotel,getHotelTables,addTable,refresh}=useData();
  const hotel=getCurrentHotel();
  const tables=hotel?getHotelTables(hotel.id):[];
  const[num,setNum]=useState('');
  const[cap,setCap]=useState('4');
  const[error,setError]=useState('');
  const[message,setMessage]=useState('');
  const[saving,setSaving]=useState(false);
  const[busyId,setBusyId]=useState('');

  const add=async()=>{
    if(!hotel)return;
    const tableNumber=Number(num);
    const capacity=Number(cap);
    if(!Number.isInteger(tableNumber)||tableNumber<1){
      setError('Enter a valid table number.');
      return;
    }
    if(!Number.isInteger(capacity)||capacity<1||capacity>50){
      setError('Capacity must be between 1 and 50.');
      return;
    }
    setSaving(true);setError('');setMessage('');
    const result=await addTable(hotel.id,{
      hotel_id:hotel.id,
      table_number:tableNumber,
      capacity,
      qr_token:'',
      status:'AVAILABLE'
    }as any);
    setSaving(false);
    if(result.success){
      setNum('');
      setMessage('Table '+tableNumber+' added successfully.');
    }else{
      setError(result.error||'Failed to add table.');
    }
  };

  const rotate=async(id:string)=>{
    setBusyId(id);setError('');setMessage('');
    try{
      await api('/tables/'+id+'/rotate-qr',{method:'POST'});
      await refresh();
      setMessage('QR code rotated successfully.');
    }catch(e:any){setError(e.message)}
    finally{setBusyId('')}
  };

  const copy=async(url:string)=>{
    try{
      await navigator.clipboard.writeText(url);
      setMessage('Customer QR link copied.');
      setError('');
    }catch{
      setError('Could not copy the link. Please copy it manually.');
    }
  };

  return <div className="space-y-5">
    <div><h1 className="text-2xl font-bold">Tables & QR Codes</h1><p className="text-sm text-gray-500">Add tables and generate secure customer ordering QR codes.</p></div>

    {error&&<div className="p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>}
    {message&&<div className="p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2"><CheckCircle2 size={17}/>{message}</div>}

    <div className="bg-white border rounded-xl p-4 flex flex-wrap gap-3 items-end">
      <label className="text-sm">Table number<input className="block border rounded-lg p-2.5 mt-1" type="number" min="1" value={num} onChange={e=>setNum(e.target.value)} placeholder="e.g. 1"/></label>
      <label className="text-sm">Capacity<input className="block border rounded-lg p-2.5 mt-1" type="number" min="1" max="50" value={cap} onChange={e=>setCap(e.target.value)}/></label>
      <button onClick={add} disabled={saving} className="bg-amber-500 text-white px-4 py-2.5 rounded-lg flex gap-2 items-center disabled:opacity-50"><Plus size={18}/>{saving?'Adding...':'Add Table'}</button>
      <span className="text-xs text-gray-500 ml-auto">{tables.length}/{hotel?.max_tables||0} tables used</span>
    </div>

    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {tables.map(table=>{
        const url=window.location.origin+'/#/customer/'+table.hotel_id+'?table='+encodeURIComponent(table.id)+'&token='+encodeURIComponent(table.qr_token);
        return <div key={table.id} className="bg-white border rounded-xl p-5">
          <div className="flex justify-between gap-3">
            <div><h3 className="font-bold">Table {table.table_number}</h3><p className="text-sm text-gray-500">{table.capacity} seats • {table.status}</p></div>
            <button disabled={busyId===table.id} onClick={()=>rotate(table.id)} className="p-2 rounded-lg hover:bg-gray-100" title="Rotate QR token"><RefreshCw size={18} className={busyId===table.id?'animate-spin':''}/></button>
          </div>
          <div className="flex justify-center my-4"><QRCodeSVG value={url} size={180}/></div>
          <p className="text-xs text-gray-400 break-all">{url}</p>
          <button onClick={()=>copy(url)} className="mt-3 w-full border rounded-lg py-2 text-sm flex items-center justify-center gap-2 hover:bg-gray-50"><Copy size={15}/>Copy Customer Link</button>
        </div>
      })}
    </div>

    {!tables.length&&<div className="bg-white border rounded-xl p-10 text-center text-gray-500">No tables yet. Add your first table above.</div>}
  </div>
}
