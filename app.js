const express = require('express');
const mongoose = require('mongoose');
const codeBlock = require('./models/codeBlock'); // Import the CodeBlock model
const http = require('http');

const app = express(); // express app
const server = http.createServer(app); // Create an HTTP server for Express
const io = require('socket.io')(server);

let asyncCaseFlag = false;
let promiseHandlingFlag = false;
let eventHandlingFlag = false;
let ES6FeaturesFlag = false;

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
const promiseHandlingId = mongoose.Types.ObjectId();
const eventHandlingId = mongoose.Types.ObjectId();
const ES6FeaturesId = mongoose.Types.ObjectId();

// home routes
app.get('/', (req, res) => {
  console.log("req made on"+req.url);
  res.render('index',{title:'Home'});
});

// AsyncCase route
app.get('/asyncCase', (req, res) => {
  console.log("req made on" + req.url);
  res.render('client', { title: "asyncCase", studentFlag: asyncCaseFlag, contentTitle: 'Async Case' });
  asyncCaseFlag = true;
});

// PromiseHandling route
app.get('/promiseHandling', (req, res) => {
  console.log("req made on" + req.url);
  res.render('client', { title: "promiseHandling", studentFlag: promiseHandlingFlag, contentTitle: 'Promise Handling' });
  promiseHandlingFlag = true;
});

// EventHandling route
app.get('/eventHandling', (req, res) => {
  console.log("req made on" + req.url);
  res.render('client', { title: "eventHandling", studentFlag: eventHandlingFlag, contentTitle: 'Event Handling' });
  eventHandlingFlag = true;
});

// ES6Features route
app.get('/ES6Features', (req, res) => {
  console.log("req made on" + req.url);
  res.render('client', { title: "ES6Features", studentFlag: ES6FeaturesFlag, contentTitle: 'ES6 Features' });
  ES6FeaturesFlag = true;
});



// Function to save edited code
const saveEditedCode = async (_id, req, res) => {
  try {
    const { code, title } = req.body;

    const result = await codeBlock.findOneAndUpdate(
      { _id },
      { code, title },
      { upsert: true, new: true }
    );

    res.json({ message: 'Code saved successfully' });
  } catch (error) {
    console.error('Error saving code:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

app.post('/save-edited-code/asyncCase', async (req, res) => {
  await saveEditedCode(asyncCaseId, req, res);
});

app.post('/save-edited-code/promiseHandling', async (req, res) => {
  await saveEditedCode(promiseHandlingId, req, res);
});

app.post('/save-edited-code/eventHandling', async (req, res) => {
  await saveEditedCode(eventHandlingId, req, res);
});

app.post('/save-edited-code/ES6Features', async (req, res) => {
  await saveEditedCode(ES6FeaturesId, req, res);
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
    const titleField = result.title;
    console.log("titleField:", titleField);
    console.log("codeFieldValue:", codeFieldValue);

    // Emit the data to the mentor
    io.to(mentorId).emit('codeBlockChange', { code: codeFieldValue, title: titleField });    
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
  