import mongoose, { Schema } from 'mongoose';

const AppSchema = new Schema({
  name: String,
  description: String,
  token: String,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

const App = mongoose.model('App', AppSchema);
export default App;
