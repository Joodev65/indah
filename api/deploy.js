const fs = require('fs');
const axios = require('axios');
const archiver = require('archiver');
const { tmpdir } = require('os');
const { join } = require('path');
const { v4: uuid } = require('uuid');
const busboy = require('busboy');

// Pastebin raw URL untuk token Vercel
const PASTEBIN_RAW_URL = 'https://pastebin.com/raw/NXsRYLWu'; // Ganti dengan URL Pastebin raw kamu

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Ambil token dari Pastebin
    const { data: VERCEL_TOKEN } = await axios.get(PASTEBIN_RAW_URL);
    
    if (!VERCEL_TOKEN || VERCEL_TOKEN.trim() === '') {
      return res.status(500).json({ error: 'Token Vercel tidak ditemukan di Pastebin' });
    }

    const bb = busboy({ headers: req.headers });
    let projectName = '';
    let fileBuffer = null;
    let fileName = '';

    bb.on('field', (name, val) => { 
      if (name === 'projectName') projectName = val.trim(); 
    });
    
    bb.on('file', (name, stream, info) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
        fileName = info.filename;
      });
    });
    
    bb.on('finish', async () => {
      if (!fileName.endsWith('.html')) {
        return res.status(400).json({ error: 'File harus .html' });
      }
      
      if (!projectName) {
        return res.status(400).json({ error: 'Nama project diperlukan' });
      }

      const tmp = join(tmpdir(), uuid());
      fs.mkdirSync(tmp, { recursive: true });
      fs.writeFileSync(join(tmp, 'index.html'), fileBuffer);
      fs.writeFileSync(join(tmp, 'vercel.json'), JSON.stringify({
        version: 2,
        builds: [{ src: "index.html", use: "@vercel/static" }],
        routes: [{ src: "/(.*)", dest: "/index.html" }]
      }, null, 2));

      const zipPath = join(tmp, 'deploy.zip');
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      archive.directory(tmp, false);
      archive.pipe(output);
      archive.finalize();

      output.on('close', async () => {
        try {
          const zip = fs.readFileSync(zipPath);
          const { data } = await axios.post('https://api.vercel.com/v13/deployments', zip, {
            headers: {
              Authorization: `Bearer ${VERCEL_TOKEN.trim()}`,
              'Content-Type': 'application/zip',
            },
            params: {
              name: projectName,
              project: projectName,
            },
          });
          
          res.json({ url: `https://${data.url}` });
        } catch (err) {
          console.error('Deploy error:', err.response?.data || err.message);
          res.status(500).json({ error: 'Gagal deploy ke Vercel' });
        } finally {
          fs.rmSync(tmp, { recursive: true, force: true });
        }
      });
    });

    req.pipe(bb);
  } catch (err) {
    console.error('Token fetch error:', err.message);
    res.status(500).json({ error: 'Gagal mengambil token dari Pastebin' });
  }
};        fs.writeFileSync(path.join(tmp,'vercel.json'),JSON.stringify({
          version:2,
          builds:[{src:"index.html",use:"@vercel/static"}],
          routes:[{src:"/(.*)",dest:"/index.html"}]
       },null,2));

        const zipPath=path.join(tmp,'bundle.zip');
        const output=fs.createWriteStream(zipPath);
        const archive=archiver('zip',{zlib:{level:9}});
        archive.directory(tmp,false); archive.pipe(output);
        archive.finalize();

        output.on('close',async()=>{
          try{
            const zip=fs.readFileSync(zipPath);
            const {data:ver}=await axios.post(
              'https://api.vercel.com/v13/deployments',
              zip,
              { headers:{
                  Authorization:`Bearer ${token.trim()}`,
                  'Content-Type':'application/zip'
                },
                params:{ name:project, project, ...(VERCEL_TEAM&&{teamId:VERCEL_TEAM}) },
                maxContentLength:50*1024*1024
              }
            );
            res.json({url:`https://${ver.url}`});
          }finally{ fs.rmSync(tmp,{recursive:true,force:true}); }
        });
      }catch(e){ res.status(500).json({error:e.message}); }
    });
    req.pipe(bb);
  }catch(e){ res.status(500).json({error:'Gagal ambil token'}); }
};        fileName = info.filename;
      });
    });
    
    bb.on('finish', async () => {
      if (!fileName.endsWith('.html')) {
        return res.status(400).json({ error: 'File harus .html' });
      }
      
      if (!projectName) {
        return res.status(400).json({ error: 'Nama project diperlukan' });
      }

      const tmp = join(tmpdir(), uuid());
      fs.mkdirSync(tmp, { recursive: true });
      fs.writeFileSync(join(tmp, 'index.html'), fileBuffer);
      fs.writeFileSync(join(tmp, 'vercel.json'), JSON.stringify({
        version: 2,
        builds: [{ src: "index.html", use: "@vercel/static" }],
        routes: [{ src: "/(.*)", dest: "/index.html" }]
      }, null, 2));

      const zipPath = join(tmp, 'deploy.zip');
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      archive.directory(tmp, false);
      archive.pipe(output);
      archive.finalize();

      output.on('close', async () => {
        try {
          const zip = fs.readFileSync(zipPath);
          const { data } = await axios.post('https://api.vercel.com/v13/deployments', zip, {
            headers: {
              Authorization: `Bearer ${VERCEL_TOKEN.trim()}`,
              'Content-Type': 'application/zip',
            },
            params: {
              name: projectName,
              project: projectName,
            },
          });
          
          res.json({ url: `https://${data.url}` });
        } catch (err) {
          console.error('Deploy error:', err.response?.data || err.message);
          res.status(500).json({ error: 'Gagal deploy ke Vercel' });
        } finally {
          fs.rmSync(tmp, { recursive: true, force: true });
        }
      });
    });

    req.pipe(bb);
  } catch (err) {
    console.error('Token fetch error:', err.message);
    res.status(500).json({ error: 'Gagal mengambil token dari Pastebin' });
  }
};
