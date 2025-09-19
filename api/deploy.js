
const fs   = require('fs');
const path = require('path');
const os   = require('os');
const axios= require('axios');
const archiver=require('archiver');
const busboy=require('busboy');
const { v4:uuid }=require('uuid');

const PASTEBIN_RAW='https://pastebin.com/raw/NXsRYLWu';   
const VERCEL_TEAM ='';                                  

module.exports=async(req,res)=>{
  if(req.method!=='POST') return res.status(405).send('Method Not Allowed');

  try{
    const {data:token}=await axios.get(PASTEBIN_RAW,{timeout:5000});
    if(!token||token.length<20) throw new Error('token invalid');

    const bb=busboy({headers:req.headers});
    let project=''; let fileBuf=null;

    bb.on('field',(n,v)=>{if(n==='projectName') project=v.trim();});
    bb.on('file',(fld,stream,info)=>{
      const chunks=[];
      stream.on('data',c=>chunks.push(c));
      stream.on('end',()=>{fileBuf=Buffer.concat(chunks);});
    });
    bb.on('finish',async()=>{
      try{
        if(!project) throw new Error('Nama project kosong');
        if(!fileBuf) throw new Error('File tidak diterima');

        const tmp=path.join(os.tmpdir(),uuid());
        fs.mkdirSync(tmp,{recursive:true});
        fs.writeFileSync(path.join(tmp,'index.html'),fileBuf);
        fs.writeFileSync(path.join(tmp,'vercel.json'),JSON.stringify({
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
