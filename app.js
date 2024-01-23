const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const path = require('path');
const fs = require('fs');
const socketIO = require('socket.io');
const codeBlockService = require('./codeBlockService');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

let caseFlags = {
  asyncCase: false,
  promiseHandling: false,
  eventHandling: false,
  ES6Features: false,
};

let mentorFlag = true;
let mentorId;
const codeBlockChangeStream = codeBlockService.CodeBlock.watch();

const dbURI = "mongodb+srv://itamarbrafman:8ooqF0HXTDpCdJsv@cluster0.xudn2yd.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => {
    console.log("Database-connected");
    server.listen(3000);
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
  });

app.set('view engine', 'ejs');
app.set('view options', { layout: false, pretty: false });
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  console.log("req made on" + req.url);
  res.render('index', { title: 'Home' });
});

app.get('/:caseType', (req, res) => {
  const { caseType } = req.params;
  console.log("req made on" + req.url);
  const solutionFilePath = path.join(__dirname, 'views', `${caseType}Solution.ejs`);
  const solutionContent = fs.readFileSync(solutionFilePath, 'utf-8');
  res.render('client', { title: caseType, studentFlag: caseFlags[caseType], contentTitle: `${capitalizeFirstLetter(caseType)} Case`, solutionContent });
  caseFlags[caseType] = true;
});

app.post('/save-edited-code/:caseType', (req, res) => {
  const { caseType } = req.params;
  const caseId = codeBlockService[`${caseType}Id`];
  codeBlockService.saveEditedCode(caseId, req, res);
});

codeBlockChangeStream.on('change', async (change) => {
  try {
    console.log('Change occurred in CodeBlock:');
    const result = await codeBlockService.CodeBlock.findById(change.documentKey);
    if (!result) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const codeFieldValue = result.code;
    const titleField = result.title;

    io.to(mentorId).emit('codeBlockChange', { code: codeFieldValue, title: titleField });
  } catch (error) {
    console.error('Error retrieving document:', error);
  }
});

io.on('connection', (socket) => {
  if (mentorFlag) {
    mentorId = socket.id;
  }
});

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
