const mongoose = require('mongoose');

const codeBlockSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
});

const codeBlock = mongoose.model('CodeBlock', codeBlockSchema);

module.exports = codeBlock;

