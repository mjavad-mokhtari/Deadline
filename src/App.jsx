/* global google */
import React, { useEffect, useRef, useState } from 'react'
import { ensureFile, readTasks, saveTasks } from './googleDrive.js'

const SCOPES = 'https://www.googleapis.com/auth/drive.file'
const CLIENT_ID_PLACEHOLDER = '470294266004-cat60baqb1rttj9s1sdfcdt2b2op3cpm.apps.googleusercontent.com' // <-- replace this

function formatDate(d){ try{ return new Date(d).toLocaleString() }catch(e){return '-'} }
function msToDHMS(ms){
  if(ms<=0) return '0s'
  const s = Math.floor(ms/1000)
  const days = Math.floor(s/86400)
  const hours = Math.floor((s%86400)/3600)
  const mins = Math.floor((s%3600)/60)
  if(days>0) return `${days}d ${hours}h`
  if(hours>0) return `${hours}h ${mins}m`
  return `${mins}m`
}

export default function App(){
  const [accessToken, setAccessToken] = useState(null)
  const [fileId, setFileId] = useState(null)
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const tokenClientRef = useRef(null)

  useEffect(() => {
    # init token client when GSI script ready
    const interval = setInterval(() => {
      if(window.google && window.google.accounts && window.google.accounts.oauth2){
        clearInterval(interval)
        tokenClientRef.current = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID_PLACEHOLDER,
          scope: SCOPES,
          callback: (resp) => {
            if(resp && resp.access_token){
              setAccessToken(resp.access_token)
            } else {
              console.error('Token response:', resp)
            }
          }
        })
      }
    }, 250)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if(!accessToken) return
    (async ()=>{
      try{
        setLoading(true)
        const fid = await ensureFile(accessToken)
        setFileId(fid)
        const data = await readTasks(accessToken, fid)
        setTasks(data.tasks || [])
      }catch(e){
        alert('Error loading tasks: ' + e.message)
      }finally{
        setLoading(false)
      }
    })()
  }, [accessToken])

  useEffect(() => {
    const t = setInterval(()=> setTasks(ts => [...ts]), 1000)
    return ()=>clearInterval(t)
  }, [])

  async function requestAccess(){
    if(!tokenClientRef.current) return alert('Google client not ready')
    tokenClientRef.current.requestAccessToken({ prompt: 'consent' })
  }

  async function addTask(){
    if(!title || !deadline) return alert('Enter title and deadline')
    const newTask = { id: Date.now(), title, created: Date.now(), deadline: new Date(deadline).toISOString(), state: 'active' }
    const updated = [...tasks, newTask]
    setTasks(updated)
    setTitle(''); setDeadline('')
    if(fileId && accessToken){
      try{ await saveTasks(accessToken, fileId, { tasks: updated }) }catch(e){ alert('Save error: '+e.message) }
    }
  }

  async function updateState(id, state){
    const updated = tasks.map(t => t.id===id?{...t, state}:t)
    setTasks(updated)
    if(fileId && accessToken){
      try{ await saveTasks(accessToken, fileId, { tasks: updated }) }catch(e){ alert('Save error: '+e.message) }
    }
  }

  async function removeTask(id){
    const updated = tasks.filter(t=>t.id!==id)
    setTasks(updated)
    if(fileId && accessToken){
      try{ await saveTasks(accessToken, fileId, { tasks: updated }) }catch(e){ alert('Save error: '+e.message) }
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>DeadlineT</h1>
        {!accessToken
          ? <div style={{display:'flex',gap:8}}><button className="btn" onClick={requestAccess}>Sign in with Google (Drive)</button></div>
          : <div className="small">Connected</div>
        }
      </div>

      <div className="card">
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input className="input" style={{flex:1}} placeholder="Task title" value={title} onChange={e=>setTitle(e.target.value)} />
          <input className="input-dt" type="datetime-local" value={deadline} onChange={e=>setDeadline(e.target.value)} />
          <button className="btn" onClick={addTask}>Add</button>
        </div>
        <div className="small" style={{marginTop:8}}>Tasks are stored inside your Google Drive file <b>DeadlineT.json</b>. No server — all client-side.</div>
      </div>

      <div>
        {loading && <div className="card small">Loading...</div>}
        {tasks.length===0 && !loading && <div className="card small">No tasks yet.</div>}
        {tasks.map(t=>{
          const dl = t.deadline ? new Date(t.deadline).getTime() : null
          const now = Date.now()
          const left = dl ? dl - now : null
          const bg = dl && left<0 ? '#ffecec' : dl && left<=86400000 ? '#fff5e6' : '#ecfff1'
          return (
            <div key={t.id} className="task card" style={{background:bg}}>
              <div>
                <div style={{fontWeight:700}}>{t.title}</div>
                <div className="small">Created: {formatDate(t.created)}</div>
                <div className="small">Deadline: {formatDate(t.deadline)}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontWeight:700}}>{left!=null?msToDHMS(left):'-'}</div>
                <div style={{display:'flex',gap:6,marginTop:8,justifyContent:'flex-end'}}>
                  {t.state!=='done' && <button className="btn ghost" onClick={()=>updateState(t.id,'done')}>Done</button>}
                  {t.state!=='suspended' && <button className="btn ghost" onClick={()=>updateState(t.id,'suspended')}>Suspend</button>}
                  <button className="btn ghost" onClick={()=>removeTask(t.id)}>Cancel</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <footer style={{marginTop:20,fontSize:12,color:'#6b7280'}}>Deploy: Vercel (https://vercel.com) — add the Vercel origin to Google Console. All data stays in your Drive file.</footer>
    </div>
  )
}
