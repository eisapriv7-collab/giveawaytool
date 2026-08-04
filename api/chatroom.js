export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Channel name required' });
  
  try {
    const response = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(name)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) return res.status(404).json({ error: 'Channel not found' });
    
    const data = await response.json();
    const chatroomId = data.chatroom?.id;
    
    if (!chatroomId) return res.status(404).json({ error: 'No chatroom' });
    
    res.status(200).json({ chatroomId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
