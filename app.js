const express = require('express');
const mongoose = require('mongoose');
const codeBlock = require('./models/codeBlock'); // Import the CodeBlock model
const http = require('http');

const app = express(); // express app
const server = http.createServer(app); // Create an HTTP server for Express
const io = require('socket.io')(server);

let studentFlag = false;
let mentorFlag = true;
let mentorId;
const codeBlockChangeStream = codeBlock.watch();

// connect to mongodb & listen for requests
const dbURI = "mongodb+srv://itamarbrafman:8ooqF0HXTDpCdJsv@cluster0.xudn2yd.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => {
    console.log("Database-connected");
    server.listen(3000);
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
  });
  
  // register view engine
  app.set('view engine', 'ejs');
  
  // middleware & static files
  app.use(express.json());
  app.use(express.static('public')); //for style.css file

  const asyncCaseId = mongoose.Types.ObjectId();
  
  // home routes
  app.get('/', (req, res) => {
    console.log("req made on"+req.url);
    res.render('index',{title:'Home'});
  });

  //asyncCase route
  app.get('/asyncCase',(req,res)=>{
    console.log("req made on"+req.url);
    res.render('asyncCase',{title:'asyncCase', studentFlag: studentFlag});
    studentFlag = true;
  })

  // Create or update the document in DB
  app.post('/save-edited-code', async (req, res) => {
    try {
      
      const { code } = req.body;

      const result = await codeBlock.findOneAndUpdate(
        { _id: asyncCaseId },
        { code },
        { upsert: true, new: true }
      );
  
      res.json({ message: 'Code saved successfully' });
    } catch (error) {
      console.error('Error saving code:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  
  // Listen for changes in the CodeBlock collection
  codeBlockChangeStream.on('change', async (change) => {
    try {
      console.log('Change occurred in CodeBlock:');
      const result = await codeBlock.findById(change.documentKey);
      if (!result) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      const codeFieldValue = result.code;
      
      // Emit the data to the mentor
      io.to(mentorId).emit('codeBlockChange', { code: codeFieldValue });
      
    } catch (error) {
      console.error('Error retrieving document:', error);
    }
  });
  

  io.on('connection', (socket) => {
        
    if(mentorFlag){
      mentorId = socket.id; 
  }
});
  
// // Handle disconnect event
// socket.on('disconnect', () => {
//   console.log(`Client disconnected: ${clientId}`);
//   // Perform cleanup or additional logic if needed
// });
  