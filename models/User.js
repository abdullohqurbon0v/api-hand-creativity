const { Schema, model } = require('mongoose')


const userSchema = new Schema({
     username: { type: String, required: true },
     avatar: { type: String, },
     email: { type: String, required: true, unique: true },
     password: { type: String, required: true },
     role: { type: String, default: "User" },
     cart: [{ type: Schema.Types.ObjectId, ref: "Product" }],
     likes: [{ type: Schema.Types.ObjectId, red: "Product" }]
}, {
     timestamps: true
})

module.exports = model('User', userSchema)
