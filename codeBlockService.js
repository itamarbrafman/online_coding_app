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
  caseType: {
    type: String,
    enum: ['asyncCase', 'promiseHandling', 'eventHandling', 'ES6Features'],
    required: true,
  },
});

const asyncCaseId = mongoose.Types.ObjectId();
const promiseHandlingId = mongoose.Types.ObjectId();
const eventHandlingId = mongoose.Types.ObjectId();
const ES6FeaturesId = mongoose.Types.ObjectId();

const CodeBlock = mongoose.model('CodeBlock', codeBlockSchema);

const saveEditedCode = async (_id, { body }, res) => {
  try {
    const { code, title, caseType } = body;

    const result = await CodeBlock.findOneAndUpdate(
      { _id },
      { code, title, caseType },
      { upsert: true, new: true }
    );

    res.json({ message: 'Code saved successfully' });
  } catch (error) {
    console.error('Error saving code:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
    CodeBlock,
  asyncCaseId,
  promiseHandlingId,
  eventHandlingId,
  ES6FeaturesId,
  saveEditedCode,
};
