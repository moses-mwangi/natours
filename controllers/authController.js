const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");
const User = require("./../model/userModel");
const crypto = require("crypto");

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE_IN,
  });
};

const createSendToken = (user, staterCode, res) => {
  const token = signToken(user._id);

  ///// cookie
  const cookieOption = {
    expiresIn: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOption.secure = true;

  res.cookie("jwt", token, cookieOption);
  user.password = undefined;
  user.passwordChangedAt = undefined;
  //// cookie^

  res.status(staterCode).json({
    status: "success",
    token,
    data: {
      user: user,
    },
  });
};

////SIGNIN NEW USER AND LOGIN HIM USING jwt
exports.signup = catchAsync(async (req, res) => {
  const newUser = await User.create(req.body);

  createSendToken(newUser, 200, res);
});

///LOGING THE USER ALREADY  SIGNIN
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(
      new AppError("Please provide an email & password to logIn", 400)
    );
  }

  const user = await User.findOne({ email }).select("+password");

  // const correct = await user.correctPassword(password, user.password);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Invalid email or password", 401));
  }

  createSendToken(user, 200, res);
});

////////PROTECTING ROUTES
exports.protect = catchAsync(async (req, res, next) => {
  // 1) get token token and check if its actualy there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError("You are not login!.Please login to get an access", 401)
    );
  }

  // 2) verifying token if its valid
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);
  // 3) check if user still exist
  const currentUser = await User.findOne({ _id: decoded.id });
  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token does no longer exist", 401)
    );
  }

  // 4) check if user change password after jwt issues
  if (await currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        "The user recently changed password. Please try to login again!",
        401
      )
    );
  }

  req.user = currentUser;

  next();
});

//////////RESTRICTING  USERS FROM DELETEING TOURS ONLY {ADMIN & LEAD-GUIDE} CAN DO IT
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //  roles ["admin",'lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have a permission to perfom this role", 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get user base on posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError("There is no user with that email address.", 404));
  }

  // 2) Generate a random user token
  const resetToken = await user.generateResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // 3) send email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 min)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    // user.passwordResetToken = undefined;
    // user.passwordResetExpires = undefined;
    // await user.save({ validateBeforeSave: false });
    console.log("theirs is an error");
    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }

  // next();
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  /// 1) Get user base on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gte: Date.now() },
  });

  /// 2)if token not expired and theirs user find set the new password
  if (!user) {
    return next(new AppError("Token is invalid or expired", 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  /// 3) update change passwordAt property for the user
  /// 4) Log the user in jwt

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get user colleection
  const user = await User.findById(req.user.id).select("+password");

  /// 2) check if posted password is correct
  const correct = await user.correctPassword(
    req.body.passwordCurrent,
    user.password
  );
  if (!correct) {
    return next(
      new AppError(
        "Please enter the correct confirmation password so that you can procced",
        401
      )
    );
  }
  /// 3 if so update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  /// 4 log user in send jwt

  createSendToken(user, 201, res);

  // next();
});
