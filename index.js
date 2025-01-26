require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();
const userModel = require('./models/User.js');
const UserDto = require('./dtos/user.dto.js');
const Product = require('./models/Product.js');
const fileUpload = require('express-fileupload');
const ishastoken = require('./middlewares/ishastoken.js');
const FileUpload = require('./file.js')
const commentModel = require('./models/Comment.js')

app.use(
     cors({
          origin: '*',
          methods: ['GET', 'POST', 'PUT', 'DELETE']
     })
);

app.use(express.static('static'));
app.use(fileUpload({
     createParentPath: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 8000;
app.get('/', (req, res) => {
     res.json({
          message: 'success',
     });
});
app.post('/api/create-user', async (req, res) => {
     try {
          const { username, email, password, role } = req.body;
          if (!username || !email || !password) {
               return res.status(400).json({
                    error: true,
                    message: `All fields are required`,
               });
          }

          const existingUser = await userModel.findOne({ email });
          if (existingUser) {
               return res.status(400).json({
                    error: true,
                    message: 'Email already exists',
                    type: 'email'
               });
          }

          const newUser = new userModel({ username, email, password, role });
          await newUser.save();

          const userDto = new UserDto(newUser);
          console.log(userDto);

          const accessToken = jwt.sign({ user: userDto }, process.env.JWT_SECRET, {
               expiresIn: '30d',
          });

          return res.json({
               message: 'User added successfully',
               error: false,
               user: userDto,
               accessToken,
          });
     } catch (error) {
          console.error('Error creating user:', error);
          return res.status(500).json({
               error: true,
               message: 'An error occurred while creating the user',
          });
     }
});
app.post('/api/login', async (req, res) => {
     try {
          const { email, password } = req.body;
          if (!email || !password) {
               return res.status(400).json({
                    error: true,
                    message: `All fields are required`,
               });
          }

          const existingUser = await userModel.findOne({ email });
          if (!existingUser) {
               return res.status(400).json({
                    error: true,
                    message: 'User with this email not found',
               });
          }

          if (existingUser.password !== password) {
               return res.status(400).json({
                    message: "Incorrect password",
                    error: true,
                    type: 'password'
               })
          }
          const userDto = new UserDto(existingUser);
          const accessToken = jwt.sign({ user: userDto }, process.env.JWT_SECRET, {
               expiresIn: '30d',
          });

          return res.json({
               message: 'Login successfuly',
               error: false,
               user: userDto,
               accessToken,
          });
     } catch (error) {
          console.error('Error Login user:', error);
          return res.status(500).json({
               error: true,
               message: 'An error occurred while login user',
          });
     }
});


app.get('/api/get-user/:userId', async (req, res) => {
     try {
          const { userId } = req.params
          const foundedUser = await userModel.findById(userId)
          return res.status(200).json({
               message: "User found",
               foundedUser
          })
     } catch (error) {
          return res.status(500).json({
               message: "Server error"
          })
     }
})

app.post('/api/create-product', ishastoken, async (req, res) => {
     try {
          const { title, body, category, price, rate, stock, size, dimensions, warranty, materials } = req.body;
          const files = req.files;
          const { user } = req.user;
          if (!title || !body || !category || !price) {
               return res.status(400).json({
                    message: "Invalid request data. Please provide all required fields.",
                    error: true,
               });
          }
          if (!files || !files.images || files.images.length === 0) {
               return res.status(400).json({
                    message: "No images uploaded. Please provide at least one image.",
                    error: true,
               });
          }

          const uploadedImages = [];
          const images = Array.isArray(files.images) ? files.images : [files.images];

          for (const image of images) {
               if (!image.mimetype.startsWith('image/')) {
                    return res.status(400).json({
                         message: "Invalid file type. Only image files are allowed.",
                         error: true,
                    });
               }
               const savedFileName = FileUpload.save(image);
               uploadedImages.push(savedFileName);
          }

          const foundedUser = await userModel.findById(user.id);
          if (!foundedUser) {
               return res.status(401).json({
                    message: "Not authorized",
                    error: true,
               });
          }
          const createdProduct = await Product.create({
               title,
               body,
               category,
               price,
               rate: rate || 0,
               stock: stock || 0,
               size,
               dimensions,
               warranty,
               materials,
               images: uploadedImages,
               user: foundedUser._id,
          });

          return res.status(201).json({
               message: "Product created successfully",
               data: createdProduct,
               error: false,
          });
     } catch (error) {
          console.error("Error creating product:", error);
          return res.status(500).json({
               message: "Server error",
               error: true,
          });
     }
});
app.post('/api/add-to-cart/:productId', ishastoken, async (req, res) => {
     try {
          console.log(req.params)
          const { user } = req.user;
          const { productId } = req.params;
          if (!productId) {
               return res.status(400).json({
                    message: "Product ID is required",
                    error: true
               });
          }

          const product = await Product.findById(productId);

          if (!product) {
               return res.status(404).json({
                    message: "Product not found",
                    error: true
               });
          }
          const updatedUser = await userModel.findByIdAndUpdate(
               user.id,
               {
                    $addToSet: { cart: productId }
               },
               { new: true }
          );
          console.log(updatedUser)

          if (!updatedUser) {
               return res.status(500).json({
                    message: "Error updating user cart",
                    error: true
               });
          }

          return res.status(200).json({
               message: "Product added to cart successfully",
               data: updatedUser.cart,
               error: false
          });
     } catch (error) {
          console.error("Error adding product to cart:", error);
          return res.status(500).json({
               message: "Server error",
               error: true
          });
     }
});

app.put('/api/update-user', ishastoken, async (req, res) => {
     try {
          const { user } = req.user;
          if (!req.files || !req.files.avatar) {
               return res.status(400).json({ message: 'Avatar is required.' });
          }

          const avatar = req.files.avatar;

          const avatarFilename = FileUpload.save(avatar);

          const updatedUser = await userModel.updateOne(
               { _id: user._id },
               { avatar: avatarFilename }
          );

          if (updatedUser.nModified === 0) {
               return res.status(404).json({ message: 'User not found.' });
          }

          return res.status(200).json({ message: 'User updated successfully.' });

     } catch (error) {
          console.error(error);
          return res.status(500).json({ message: 'Server error', error });
     }
});



app.post('/api/like/:productId', ishastoken, async (req, res) => {
     try {
          const { user } = req.user;
          const { productId } = req.params;

          if (!productId) {
               return res.status(400).json({
                    message: "Product ID is required",
                    error: true
               });
          }

          const product = await Product.findById(productId);

          if (!product) {
               return res.status(404).json({
                    message: "Product not found",
                    error: true
               });
          }
          const updatedUser = await userModel.findByIdAndUpdate(
               user._id,
               {
                    $addToSet: { likes: productId }
               },
               { new: true }
          );

          if (!updatedUser) {
               return res.status(500).json({
                    message: "Error updating user cart",
                    error: true
               });
          }

          return res.status(200).json({
               message: "Product added to likes successfully",
               data: updatedUser.likes,
               error: false
          });
     } catch (error) {
          console.error("Error adding product to cart:", error);
          return res.status(500).json({
               message: "Server error",
               error: true
          });
     }
});


app.get('/get-product/:id', async (req, res) => {
     try {
          const id = req.params.id;

          if (!id) {
               return res.status(400).json({
                    message: "Product ID is required",
                    error: true,
               });
          }
          const product = await Product.findById(id).populate('user', 'name email');
          if (!product) {
               return res.status(404).json({
                    message: "Product not found",
                    error: true,
               });
          }
          return res.status(200).json({
               message: "Product fetched successfully",
               data: product,
               error: false,
          });
     } catch (error) {
          console.error("Error fetching product:", error);
          return res.status(500).json({
               message: "Server error",
               error: true,
          });
     }
});

app.put('/api/update-product/:id', async (req, res) => {
     try {
          const id = req.params.id;
          let { title, body, category, price, rate, stock, size, dimensions, warranty, materials } = req.body;

          if (!id) {
               return res.status(400).json({
                    message: "Product ID is required",
                    error: true,
               });
          }
          title = Array.isArray(title) ? title[0] : title;
          price = parseFloat(price);
          rate = parseFloat(rate);
          stock = parseInt(stock, 10);

          const updatedProduct = await Product.findByIdAndUpdate(
               id,
               { title, body, category, price, rate, stock, size, dimensions, warranty, materials },
               { new: true }
          );

          if (!updatedProduct) {
               return res.status(404).json({
                    message: "Product not found",
                    error: true,
               });
          }

          return res.status(200).json({
               message: "Product updated successfully",
               data: updatedProduct,
               error: false,
          });
     } catch (error) {
          console.error("Error updating product:", error);
          return res.status(500).json({
               message: "Server error",
               error: true,
          });
     }
});


app.delete('/remove-product/:id', async (req, res) => {
     try {
          const id = req.params.id;

          if (!id) {
               return res.status(400).json({
                    message: "Product ID is required",
                    error: true,
               });
          }

          const deletedProduct = await Product.findByIdAndDelete(id);

          if (!deletedProduct) {
               return res.status(404).json({
                    message: "Product not found",
                    error: true,
               });
          }

          return res.status(200).json({
               message: "Product deleted successfully",
               data: deletedProduct,
               error: false,
          });
     } catch (error) {
          console.error("Error deleting product:", error);
          return res.status(500).json({
               message: "Server error",
               error: true,
          });
     }
});

app.get('/api/get-product-with-category/:category', async (req, res) => {
     try {
          const { category } = req.params;

          if (!category) {
               return res.status(400).json({
                    message: "Category is required",
                    error: true
               });
          }

          const products = await Product.find({ category });

          if (!products || products.length === 0) {
               return res.status(404).json({
                    message: "No products found for this category",
                    error: true
               });
          }

          return res.status(200).json({
               message: "Products fetched successfully",
               data: products,
               error: false
          });
     } catch (error) {
          console.error("Error fetching products by category:", error);
          return res.status(500).json({
               message: "Server error",
               error: true
          });
     }
});

app.get('/api/all-users', async (req, res) => {
     try {
          const users = await userModel.find()

          res.status(200).json({
               message: "all users",
               users
          })
     } catch (error) {
          return res.status(500).json({
               message: "Server error"
          })
     }
})


app.get('/api/user-cart', ishastoken, async (req, res) => {
     try {
          const { user } = req.user
          const foundedUser = await userModel.findById(user.id)
          const products = []
          for (let i = 0; i < foundedUser.cart.length; i++) {
               products.push(await Product.findById(foundedUser.cart[i]))
          }

          return res.status(200).json({
               message: "Okay",
               products
          })

     } catch (error) {
          return res.status(500).json({
               message: "Server error"
          })
     }
})

app.delete('/api/remove-from-cart/:productId', ishastoken, async (req, res) => {
     try {
          const productId = req.params.productId
          await Product.findByIdAndDelete(productId)

          res.json({
               message: "Product demoved from cart"
          })
     } catch (error) {
          return res.status(500).json({
               message: "Errro"
          })
     }
})

app.get('/api/all-products', async (req, res) => {
     try {
          const products = await Product.find()

          res.status(200).json({
               message: "all users",
               products
          })
     } catch (error) {
          return res.status(500).json({
               message: "Server error"
          })
     }
})


app.get('/api/search/:query', async (req, res) => {
     try {
          const { query } = req.params;
          console.log(query)

          if (!query) {
               return res.status(400).json({
                    message: "Search query is required",
                    error: true
               });
          }
          const products = await Product.find({
               $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { body: { $regex: query, $options: 'i' } }
               ]
          });

          if (products.length === 0) {
               return res.status(404).json({
                    message: "No products found matching the search query",
                    error: true
               });
          }

          return res.status(200).json({
               message: "Products fetched successfully",
               data: products,
               error: false
          });

     } catch (error) {
          console.error("Error searching products:", error);
          return res.status(500).json({
               message: "Server error",
               error: true
          });
     }
});

app.post('/api/comment/:productId', ishastoken, async (req, res) => {
     try {
          const { comment } = req.body
          const { user } = req.user
          const product = req.params.productId

          const createdComment = await commentModel.create({ user: user.id, product, comment })

          return res.status(201).json({
               message: "Comment created successfuly",
               createdComment
          })

     } catch (error) {
          return res.status(500).json({
               message: "Server error"
          })
     }
})
app.delete('/api/comment/:commentId', ishastoken, async (req, res) => {
     try {
          console.log(req.params)
          const { commentId } = req.params

          await commentModel.findByIdAndDelete(commentId)

          res.status(200).json({
               message: "Comment deleted successfully"
          })
     } catch (error) {
          return res.status(500).json({
               message: "Server error"
          })
     }
})



app.listen(PORT, () => {
     try {
          mongoose
               .connect(
                    process.env.MONGO_URL
               )
               .then(() => {
                    console.log('DB connected');
               })
               .catch((err) => {
                    console.error('Error connecting to database:', err);
               });
     } catch (error) {
          console.log('Error while connectind data base', error);
     }
     console.log(`Server has been started on PORT: ${PORT}`);
});