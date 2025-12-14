// 1. Zaroori Modules Import Karein
const express = require('express');
const fs = require('fs'); // File System module
const path = require('path'); // Path module

const app = express();
const PORT = 3000; // Aap koi bhi port use kar sakte hain

// *Important:*
// Is code ko chalaane se pehle, "sample.mp4" naam ki ek video file 
// isi folder mein rakhein jahan aapki server.js file hai.

// 2. Default Route (HTML Page)
app.get('/', (req, res) => {
    // Ye ek simple HTML page serve karega jismein video player hoga
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 3. Video Streaming Route (The Core Logic)
app.get('/video', (req, res) => {
    const videoPath = 'sample.mp4'; // Apni video file ka naam yahan likhein
    
    // Video file ka size pata karna
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    
    // HTTP Range Header ko check karna
    const range = req.headers.range;

    if (range) {
        // Range requested: bytes=start-end (e.g., bytes=100-200)
        
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        
        // Agar end nahi diya gaya hai, toh hum apna chunk size decide karte hain
        const end = parts[1] 
            ? parseInt(parts[1], 10)
            : Math.min(start + 10 ** 6, fileSize - 1); // 1MB ka chunk, ya file ka end

        const chunksize = (end - start) + 1;
        
        // Headers set karna
        const headers = {
            'Content-Range': ` bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4', // Apni file format ke hisaab se badal sakte hain
        };

        // Browser ko batana ki yeh Partial Content (206) hai
        res.writeHead(206, headers);

        // Video file ka woh hissa (chunk) stream karna
        const videoStream = fs.createReadStream(videoPath, { start, end });
        videoStream.pipe(res);
    } else {
        // Agar browser ne Range header nahi bheja, toh poori file bhej denge (recommended nahi)
        const headers = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, headers);
        fs.createReadStream(videoPath).pipe(res);
    }
});

// 4. Server Start karna
app.listen(PORT, () => {
    console.log(` Server chalu hai: http://localhost:${PORT}`);
});