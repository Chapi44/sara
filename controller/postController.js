const Product = require("../model/post");
const Like = require("../model/like");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const path = require("path");
const baseURL = `http://sarada.canvacodes.com:4500`;

const createposts = async (req, res) => {
  // const userId=req.user.userId;
  // console.log(userId);
  try {
    const { name, description ,userId , location} = req.body;

    // Construct image paths with base URL
    const pictures = req.files.map(file => baseURL + "/uploads/posts/" + file.filename);

    const newPost = await Product.create({
   name,
   description ,
   images: pictures,
      user:userId,
      location
    });

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    res.status(StatusCodes.CREATED).json({ post: newPost });
  } catch (error) {
    console.error('Error creating boat:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
};

const getAllposts = async (req, res) => {
  try {
    const products = await Product.find({})
      .populate({
        path: "user",
        select: "name username pictures" // Specify the fields you want to include
      })
      .populate({ path: "likes", select: "user" });

    const productsWithDetails = products.map((product) => {
      const likesDetails = product.likes.map((like) => ({
        _id: like._id,
        user: like.user,
        product: like.product,
      }));

      return {
        ...product.toObject(),
        likes: likesDetails,
      };
    });

    res
      .status(StatusCodes.OK)
      .json({ products: productsWithDetails, count: products.length });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

const getSinglepost = async (req, res) => {
  try {
    const { id: productId } = req.params;

    const product = await Product.findOne({ _id: productId })
      .populate({
        path: "user",
        select: "name username pictures" // Specify the fields you want to include
      })
      .populate({ path: "likes", select: "user" });

    if (!product) {
      throw new CustomError.NotFoundError(`No product with id : ${productId}`);
    }

    const likesDetails = product.likes.map((like) => ({
      _id: like._id,
      user: like.user,
      product: like.product,
    }));

    const response = {
      product: {
        ...product.toObject(),
        likes: likesDetails,
      },
    };

    res.status(StatusCodes.OK).json(response);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

const updatepostbyid = async (req, res) => {
  const { id: productId } = req.params;

  const product = await Product.findOneAndUpdate({ _id: productId }, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    throw new CustomError.NotFoundError(`No product with id : ${productId}`);
  }

  res.status(StatusCodes.OK).json({ product });
};
const deletepostbyid = async (req, res) => {
  const productId = req.params;
  console.log(productId);
  const result = await Product.deleteOne({ _id: productId.id });

  if (result.deletedCount === 0) {
    throw new CustomError.NotFoundError(`No product with id : ${productId}`);
  }

  res.status(StatusCodes.OK).json({ msg: "Success! Posts are removed." });
};



const likeProduct = async (req, res) => {
  try {
    const { id:  productId } = req.params;
    const { userId } = req.body;
    // const userId = req.user.userId;

    // Check if the user has already liked the product
    const existingLike = await Like.findOne({
      user: userId,
      product: productId,
    });

    if (existingLike) {
      // User has already liked the product, so unlike it
      await Like.deleteOne({
        user: userId,
        product: productId,
      });

      // Decrement the like count in the Product model
      const product = await Product.findByIdAndUpdate(
        productId,
        { $inc: { numOfLikes: -1 } },
        { new: true }
      );

      res
        .status(StatusCodes.OK)
        .json({ product, message: "Product unliked successfully" });
    } else {
      // User hasn't liked the product, so like it
      const like = new Like({ user: userId, product: productId });
      await like.save();

      // Increment the like count in the Product model
      const product = await Product.findByIdAndUpdate(
        productId,
        { $inc: { numOfLikes: 1 } },
        { new: true }
      );

      res
        .status(StatusCodes.OK)
        .json({ product, message: "Product liked successfully" });
    }
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
  }
};


module.exports = {
  createposts,
  getAllposts,
  getSinglepost,
  updatepostbyid,
  deletepostbyid,
  likeProduct,
};

