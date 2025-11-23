import React,{useState,useEffect} from 'react';import {ensureFile,readTasks,saveTasks} from './googleDrive.js';
export default function App(){const [token,setToken]=useState(null);const [fileId,setFileId]=useState(null);const [tasks,setTasks]=useState([]);const [title,setTitle]=useState('');const [deadline,setDeadline]=useState('');
 useEffect(()=>{google.accounts.id.initialize({client_id:'YOUR_CLIENT_ID',callback:(r)=>setToken(r.credential)});google.accounts.id.renderButton(document.getElementById('root'),{theme:'outline'});},[]);
 useEffect(()=>{if(!token)return; (async()=>{let fid=await ensureFile(token);setFileId(fid);let t=await readTasks(token,fid);setTasks(t.tasks||[]);})();},[token]);
 const add=async()=>{let t=[...tasks,{id:Date.now(),title,deadline,status:'pending',created:Date.now()}];setTasks(t);await saveTasks(token,fileId,{tasks:t});};
 const mark=async(id,status)=>{let t=tasks.map(x=>x.id===id?{...x,status}:x);setTasks(t);await saveTasks(token,fileId,{tasks:t});};
 const color=(d)=>{let now=Date.now();let dd=new Date(d).getTime();if(now>dd)return 'red';if(dd-now<86400000)return 'orange';return 'green';};
 if(!token)return <div></div>;
 return <div style={{padding:20,fontFamily:'sans-serif'}}><h2>Tasks</h2>
 <input placeholder="title" value={title} onChange={e=>setTitle(e.target.value)}/>
 <input type="datetime-local" value={deadline} onChange={e=>setDeadline(e.target.value)}/>
 <button onClick={add}>Add</button>
 {tasks.map(t=><div key={t.id} style={{border:'1px solid #ccc',margin:10,padding:10,background:color(t.deadline)}}>
   <b>{t.title}</b><br/>Created: {new Date(t.created).toLocaleString()}<br/>
   Deadline: {new Date(t.deadline).toLocaleString()}<br/>
   <button onClick={()=>mark(t.id,'done')}>Done</button>
   <button onClick={()=>mark(t.id,'suspend')}>Suspend</button>
   <button onClick={()=>mark(t.id,'cancel')}>Cancel</button>
 </div>)}
 </div>;}