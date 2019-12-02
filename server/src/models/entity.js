import mongoose, { Schema } from 'mongoose';

export const entityStatuses = {
  pending: 'pending',
  inprogress: 'inprogress',
  success: 'success',
  error: 'error',
};

const EntitySchema = new Schema({
  name: String,
  appId: { type: Schema.Types.ObjectId, required: true },
  sourceUrl: String,
  playlistPath: String,
  description: String,
  duration: Number,
  status: {
    type: Schema.Types.String,
    enum: Object.values(entityStatuses),
    default: entityStatuses.pending,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

EntitySchema.virtual('app', {
  ref: 'App',
  localField: 'appId',
  foreignField: '_id',
});
EntitySchema.virtual('playlistUrl', function () {
  return this.playlistPath ? `http://rabita.vn/${this.playlistPath}` : null;
});

const Entity = mongoose.model('Entity', EntitySchema);
export default Entity;
