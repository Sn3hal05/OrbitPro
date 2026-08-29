const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
},
  email: { 
    type: String, 
    required: true, 
    unique: true 
},
  password: { 
    type: String, 
    required: true 
},
  bio: { 
    type: String, 
    default: '' 
},
  skills: { 
    type: [String], 
    default: [] 
},
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
},
  embedding: { 
    type: [Number], 
    default: [] 
},
}, { 
    timestamps: true 
}
);

module.exports = mongoose.model('User', userSchema);