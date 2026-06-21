import userModel from "../models/user.model.js";
import authRouter from "../routes/auth.routes.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
export const register = async (req, res) => {
  const { username, email, password } = req.body;

  const isAlreadyRegistered = await userModel.findOne({
    $or: [{ username }, { email }],
  });
       
  if (isAlreadyRegistered) {
    //.json for sending json response
    res.status(409).json({
      message: "Username or email already taken",
    });
  }
  const hashedPassword = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");

  const user = await userModel.create({
    username,
    email,
    password: hashedPassword,
  });

  //creating token
  const accessToken = jwt.sign(
    {
      id: user._id,
    },
    config.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );
  const refreshToken = jwt.sign(
    {
      id: user._id,
    },
    config.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    message: "User registered successfully",
    user: {
      username: user.username,
      email: user.email,
      accessToken,
    },
  });
};

export async function getMe(req, res) {
  console.log("🚀 The request hit getMe safely!");
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      message: "token not found",
    });
  }
  const decoded = jwt.verify(token, config.JWT_SECRET);
  console.log(decoded);
  const user = await userModel.findById(decoded.id);
  res.status(200).json({
    message: "user fetched successfully",
    user: {
      username: user.username,
      email: user.email,
    },
  });
}

export async function refreshToken(req, res) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({
      message: "Refresh token not found",
    });
  }
  const decoded = jwt.verify(refreshToken, config.JWT_SECRET);
  const user = await userModel.findById(decoded.id);
  const accessToken = jwt.sign(
    {
      id: user._id,
      email: user.email,
    },
    config.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );

  //Also creating new refresh token for extra layer of security

  newRefreshTokenefreshToken = jwt.sign(
    {
      id: user._id,
    },
    config.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.status(200).json({
    message: "Access Token created Successfully",
    accessToken,
  });
}
