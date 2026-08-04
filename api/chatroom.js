export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Channel name required' });
  
  const cleanName = name.toLowerCase().trim();
  
  try {
    // Try the main channels endpoint
    let response = await fetch(`https://kick.com/api/v2/channels/${cleanName}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://kick.com/',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    
    // If that fails, try the chatroom endpoint directly
    if (!response.ok) {
      response = await fetch(`https://kick.com/api/v2/channels/${cleanName}/chatroom`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://kick.com/',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
    }
    
    if (!response.ok) {
      return res.status(404).json({ 
        error: `Channel "${cleanName}" not found. Make sure the streamer is live or the username is correct.` 
      });
    }
    
    const data = await response.json();
    
    // The chatroom ID could be in different places depending on the endpoint
    let chatroomId = null;
    
    if (data.chatroom?.id) {
      chatroomId = data.chatroom.id;
    } else if (data.id) {
      chatroomId = data.id;
    } else if (data.data?.chatroom?.id) {
      chatroomId = data.data.chatroom.id;
    }
    
    if (!chatroomId) {
      return res.status(404).json({ 
        error: 'Could not find chatroom ID. The streamer may not be live yet.',
        debug: Object.keys(data)
      });
    }
    
    res.status(200).json({ 
      chatroomId, 
      channel: cleanName,
      message: 'Connected successfully' 
    });
    
  } catch (err) {
    res.status(500).json({ 
      error: 'Kick API error: ' + err.message,
      tip: 'Try entering the chatroom ID manually if this keeps failing'
    });
  }
}
