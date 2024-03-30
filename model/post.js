const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      maxlength: [50, "Name can not be more than 50 characters"],
    },

    description: {
      type: [String],
    
    },
    images: {
      type: [String],
      default: [],
   
  },

  location:{
    type: [String],
    
  },
  		replies: [
			{
				userId: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
					required: true,
				},
				text: {
					type: String,
					required: true,
				},
				userProfilePic: {
					type: String,
				},
				username: {
					type: String,
				},
			},
		],

    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);



ProductSchema.virtual("likes", {
  ref: "Like",
  localField: "_id",
  foreignField: "product",
  justOne: false,
});





module.exports = mongoose.model("Product", ProductSchema);


