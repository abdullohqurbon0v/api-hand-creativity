const { Schema, model } = require('mongoose');

const productSchema = new Schema(
     {
          user: { type: Schema.Types.ObjectId, ref: "User" },
          title: { type: String, required: true },
          body: { type: String, required: true },
          rate: { type: Number, default: 0 },
          stock: { type: Number, default: 0 },
          size: { type: String },
          dimensions: { type: String },
          warranty: { type: String },
          materials: { type: String },
          category: { type: String, required: true },
          price: { type: Number, required: true },
          images: [{ type: String, required: true }],
     },
     {
          timestamps: true,
     }
);

module.exports = model('Product', productSchema);