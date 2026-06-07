import {saveFileToCloudinary} from "../utils/saveFileToCloudinary.js";
import createHttpError from "http-errors";
import {User} from "../models/user.js";

export const updateUserAvatar = async (req, res) => {
    console.log(req.file)

    if(!req.file){
        throw createHttpError(400, 'No file')
    }

    await saveFileToCloudinary(req.file.buffer, req.user._id)
    await User.updateOne({_id: user._id}, {avatar: res.body.avatar.secure_url})

    res.status(200).json({url: res.body.avatar.secure_url})
}