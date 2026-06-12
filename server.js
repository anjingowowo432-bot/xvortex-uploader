const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
app.use(require('cors')());

const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const random = crypto.randomBytes(8).toString('hex');
    cb(null, random + path.extname(file.originalname));
  }
});

const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } });

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>X VORTEX Uploader</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial; background: #0f0f1a; padding: 20px; }
        .box { max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 12px; }
        input, button { width: 100%; padding: 12px; margin: 10px 0; }
        button { background: #4f46e5; color: white; border: none; border-radius: 8px; cursor: pointer; }
        #result { margin-top: 20px; }
        img, video { max-width: 100%; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="box">
        <h2>X VORTEX UPLOADER</h2>
        <input type="file" id="fileInput">
        <button onclick="uploadFile()">Upload</button>
        <div id="result"></div>
      </div>
      <script>
        async function uploadFile() {
          const file = document.getElementById('fileInput').files[0];
          if (!file) return alert('Pilih file');
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/upload', { method: 'POST', body: formData });
          const data = await res.json();
          if (data.success) {
            let preview = '';
            if (file.type.startsWith('image/')) preview = '<img src="'+data.url+'">';
            if (file.type.startsWith('video/')) preview = '<video controls src="'+data.url+'"></video>';
            document.getElementById('result').innerHTML = \`
              <p style="color:green;">Upload berhasil!</p>
              <a href="\${data.url}" target="_blank">\${data.url}</a>
              \${preview}
            \`;
          } else {
            document.getElementById('result').innerHTML = '<p style="color:red;">Error: '+data.error+'</p>';
          }
        }
      </script>
    </body>
    </html>
  `);
});

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const url = `${req.protocol}://${req.get('host')}/files/${req.file.filename}`;
  res.json({ success: true, url, filename: req.file.filename, size: req.file.size });
});

app.use('/files', express.static(uploadDir));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
