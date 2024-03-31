const User = require("../model/user");
const CustomError = require("../errors");
const { StatusCodes } = require("http-status-codes");
const { createTokenUser, attachCookiesToResponse } = require("../utils");

require("dotenv").config();
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};
const deleteuser = async (req, res) => {
  try {
    const { id } = req.params;
    const finduser = await User.findByIdAndDelete({ _id: id });
    if (!finduser) {
      return res.status(400).json({ error: "no such user found" });
    }
    return res.status(200).json({ message: "deleted sucessfully" });
  } catch (error) {
    res.status(500).json({ error: "something went wrong" });
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    let updatedUser = await User.findById(userId);

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update name, bio, and username if available
    if (req.body.name) updatedUser.name = req.body.name;  
    if (req.body.bio) updatedUser.bio = req.body.bio;
    if (req.body.username) updatedUser.username = req.body.username;

    // Update email if available and validate format
    if (req.body.email) {
      const emailAlreadyExists = await User.findOne({ email: req.body.email });
      if (emailAlreadyExists) {
        return res.status(400).json({ error: "Email already exists" });
      }
      updatedUser.email = req.body.email;
    }

    // Update password if available
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      updatedUser.password = await bcrypt.hash(req.body.password, salt);
    }

    // Handle pictures update if available
    if (req.files && req.files.length > 0) {
      const newPictures = req.files.map(
        (file) => `http://sarada.canvacodes.com:4500/uploads/profile/${file.filename}`
      );
      updatedUser.pictures = newPictures;
    }

    await updatedUser.save();

    // Respond with updated user data (excluding password)
    res.status(200).json({
      message: "User updated successfully",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        username: updatedUser.username,
        bio: updatedUser.bio,
        pictures: updatedUser.pictures
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateUserPassword = async (req, res) => {
  const userId = req.params.id;
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new CustomError.BadRequestError("Please provide both values");
  }
  const user = await User.findById(userId);

  const isPasswordCorrect = await user.comparePassword(oldPassword);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }
  user.password = newPassword;

  await user.save();
  res.status(StatusCodes.OK).json({ msg: "Success! Password Updated." });
};


const followUnFollowUser = async (req, res) => {
  try {
    const { userId } = req.body; // Assuming userId is passed in the request body

    // Check if userId is provided
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const { id } = req.params;
    const userToModify = await User.findById(id);
    
    // Check if userToModify exists
    if (!userToModify) {
      return res.status(404).json({ error: "User to modify not found" });
    }

    const currentUser = await User.findById(userId);

    // Check if currentUser exists
    if (!currentUser) {
      return res.status(404).json({ error: "Current user not found" });
    }

    // Check if the user is trying to follow/unfollow themselves
    if (id === userId.toString()) {
      return res.status(400).json({ error: "You cannot follow/unfollow yourself" });
    }

    // Check if the current user is already following the userToModify
    const isFollowing = currentUser.following && currentUser.following.includes(id);

    if (isFollowing) {
      // Unfollow user
      await User.findByIdAndUpdate(id, { $pull: { followers: userId } });
      await User.findByIdAndUpdate(userId, { $pull: { following: id } });
      return res.status(200).json({ message: "User unfollowed successfully" });
    } else {
      // Follow user
      await User.findByIdAndUpdate(id, { $push: { followers: userId } });
      await User.findByIdAndUpdate(userId, { $push: { following: id } });
      return res.status(200).json({ message: "User followed successfully" });
    }
  } catch (err) {
    console.error("Error in followUnFollowUser: ", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const showCurrentUser = async (req, res) => {
  res.status(StatusCodes.OK).json({ user: req.user });
};




// const updateUseremailandPassword = async (req, res) => {
//   const { email, oldPassword, newPassword } = req.body;

//   if (!email || !oldPassword || !newPassword) {
//     throw new CustomError.BadRequestError(
//       "Please provide email, oldPassword, and newPassword"
//     );
//   }

//   const user = await User.findOne({ email });

//   if (!user) {
//     throw new CustomError.NotFoundError("User not found");
//   }

//   const isPasswordCorrect = await user.comparePassword(oldPassword);
//   if (!isPasswordCorrect) {
//     throw new CustomError.UnauthenticatedError("Invalid Credentials");
//   }

//   user.password = newPassword;

//   await user.save();
//   res.status(StatusCodes.OK).json({ msg: "Success! Password Updated." });
// };


// const deleteAllUsers = async (req, res) => {
//   try {
//     console.log("Before deleting all users");
//     const result = await User.deleteMany({});
//     console.log("After deleting all users", result);

//     res.status(200).json({ message: "All users deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting all users:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// //addition to handle caals and videos
// exports.  startAudioCall = catchAsync(async (req, res, next) => {
//   const from = req.user._id;
//   const to = req.body.id;

//   const from_user = await User.findById(from);
//   const to_user = await User.findById(to);

//   // create a new call audioCall Doc and send required data to client
//   const new_audio_call = await AudioCall.create({
//     participants: [from, to],
//     from,
//     to,
//     status: "Ongoing",
//   });

//   res.status(200).json({
//     data: {
//       from: to_user,
//       roomID: new_audio_call._id,
//       streamID: to,
//       userID: from,
//       userName: from,
//     },
//   });
// });

// exports.startVideoCall = catchAsync(async (req, res, next) => {
//   const from = req.user._id;
//   const to = req.body.id;

//   const from_user = await User.findById(from);
//   const to_user = await User.findById(to);

//   // create a new call videoCall Doc and send required data to client
//   const new_video_call = await VideoCall.create({
//     participants: [from, to],
//     from,
//     to,
//     status: "Ongoing",
//   });

//   res.status(200).json({
//     data: {
//       from: to_user,
//       roomID: new_video_call._id,
//       streamID: to,
//       userID: from,
//       userName: from,
//     },
//   });
// });

// exports.getCallLogs = catchAsync(async (req, res, next) => {
//   const user_id = req.user._id;

//   const call_logs = [];

//   const audio_calls = await AudioCall.find({
//     participants: { $all: [user_id] },
//   }).populate("from to");

//   const video_calls = await VideoCall.find({
//     participants: { $all: [user_id] },
//   }).populate("from to");

//   console.log(audio_calls, video_calls);

//   for (let elm of audio_calls) {
//     const missed = elm.verdict !== "Accepted";
//     if (elm.from._id.toString() === user_id.toString()) {
//       const other_user = elm.to;

//       // outgoing
//       call_logs.push({
//         id: elm._id,
//         img: other_user.avatar,
//         name: other_user.firstName,
//         online: true,
//         incoming: false,
//         missed,
//       });
//     } else {
//       // incoming
//       const other_user = elm.from;

//       // outgoing
//       call_logs.push({
//         id: elm._id,
//         img: other_user.avatar,
//         name: other_user.firstName,
//         online: true,
//         incoming: false,
//         missed,
//       });
//     }
//   }

//   for (let element of video_calls) {
//     const missed = element.verdict !== "Accepted";
//     if (element.from._id.toString() === user_id.toString()) {
//       const other_user = element.to;

//       // outgoing
//       call_logs.push({
//         id: element._id,
//         img: other_user.avatar,
//         name: other_user.firstName,
//         online: true,
//         incoming: false,
//         missed,
//       });
//     } else {
//       // incoming
//       const other_user = element.from;

//       // outgoing
//       call_logs.push({
//         id: element._id,
//         img: other_user.avatar,
//         name: other_user.firstName,
//         online: true,
//         incoming: false,
//         missed,
//       });
//     }
//   }

//   res.status(200).json({
//     status: "success",
//     message: "Call Logs Found successfully!",
//     data: call_logs,
//   });
// });

module.exports = {
  getAllUsers,
  getUserById,
  deleteuser,
  updateUser,
  // deleteAllUsers,
  updateUserPassword,
  followUnFollowUser, 
  showCurrentUser,
};
