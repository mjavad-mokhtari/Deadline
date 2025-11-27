/**
 * Minimal helpers for Google Drive file create/read/update using an access token.
 * - ensureFile(token): find or create 'DeadlineT.json' in user's Drive (app root)
 * - readTasks(token, fileId): returns JSON contents
 * - saveTasks(token, fileId, data): replaces file content
 */
export async function ensureFile(token){
  const headers = { Authorization: `Bearer ${token}` };
  // search for file named DeadlineT.json in user's drive (not trashed)
  const q = encodeURIComponent("name = 'DeadlineT.json' and trashed = false");
  let res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, { headers });
  if(!res.ok) throw new Error('Drive list failed: ' + await res.text());
  const j = await res.json();
  if(j.files && j.files.length) return j.files[0].id;
  // create metadata + simple initial content via multipart
  const metadata = { name: 'DeadlineT.json', mimeType: 'application/json' };
  const boundary = '-------314159265358979323846';
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    JSON.stringify({ tasks: [] }),
    `--${boundary}--`
  ].join('\r\n');
  const createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'multipart/related; boundary=' + boundary },
    body
  });
  if(!createRes.ok) throw new Error('Drive create failed: ' + await createRes.text());
  const cj = await createRes.json();
  return cj.id;
}

export async function readTasks(token, fileId){
  const headers = { Authorization: `Bearer ${token}` };
  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, { headers });
  if(!r.ok) throw new Error('Drive read failed: ' + await r.text());
  return r.json();
}

export async function saveTasks(token, fileId, data){
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const r = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data)
  });
  if(!r.ok) throw new Error('Drive save failed: ' + await r.text());
  return r.json();
}
