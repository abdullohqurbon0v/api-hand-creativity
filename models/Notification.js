const { Schema, model } = require('mongoose')

const commentSchema = new Schema({
     comment: { type: String, required: true },
     user: { type: Schema.Types.ObjectId, ref: "User" },
     product: { type: Schema.Types.ObjectId, ref: "Product" },
})


module.exports = model('Comment', commentSchema)