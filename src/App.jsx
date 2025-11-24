import React, { useState, useEffect } from 'react';
import { ensureFile, readTasks, saveTasks } from './googleDrive.js';

// ================================
// ⚡ Web-ready App.jsx for GCalTasker Drive
// Instructions:
// 1. Replace 'YOUR_CLIENT_ID' below with your Google OAuth Client ID
// 2. Make sure your Google Cloud OAuth Origin includes your web domain
// 3. Build with 'npm run build' and deploy to any static web host
// ================================

export default function App() {
  const [token, setToken] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    // Initialize Google Identity Services (client-side OAuth)
    google.accounts.id.initialize({
      client_id: '993813890788-c8vu6skqleqbn7k7jb2jmco0meuu789r.apps.googleusercontent.com', // << Replace with your Client ID
      callback: handleCredentialResponse,
    });

    google.accounts.id.renderButton(document.getElementById('root'), {
      theme: 'outline',
      size: 'large'
    });
  }, []);

  const handleCredentialResponse = (response) => {
    setToken(response.credential);
  };

  useEffect(() => {
    if (!token) return;
    (async () => {
      let fid = await ensureFile(token);
      setFileId(fid);
      let t = await readTasks(token, fid);
      setTasks(t.tasks || []);
    })();
  }, [token]);

  const add = async () => {
    let t = [...tasks, { id: Date.now(), title, deadline, status: 'pending', created: Date.now() }];
    setTasks(t);
    await saveTasks(token, fileId, { tasks: t });
    setTitle('');
    setDeadline('');
  };

  const mark = async (id, status) => {
    let t = tasks.map(x => x.id === id ? { ...x, status } : x);
    setTasks(t);
    await saveTasks(token, fileId, { tasks: t });
  };

  const color = (d) => {
    let now = Date.now();
    let dd = new Date(d).getTime();
    if (now > dd) return 'red';
    if (dd - now < 86400000) return 'orange';
    return 'green';
  };

  if (!token) return <div></div>;

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h2>Tasks</h2>
      <input placeholder="title" value={title} onChange={e => setTitle(e.target.value)} />
      <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} />
      <button onClick={add}>Add</button>
      {tasks.map(t => (
        <div key={t.id} style={{ border: '1px solid #ccc', margin: 10, padding: 10, background: color(t.deadline) }}>
          <b>{t.title}</b><br />
          Created: {new Date(t.created).toLocaleString()}<br />
          Deadline: {new Date(t.deadline).toLocaleString()}<br />
          <button onClick={() => mark(t.id, 'done')}>Done</button>
          <button onClick={() => mark(t.id, 'suspend')}>Suspend</button>
          <button onClick={() => mark(t.id, 'cancel')}>Cancel</button>
        </div>
      ))}
    </div>
  );
}
