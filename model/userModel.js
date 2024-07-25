const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: [true, "All user should have name"],
  },
  email: {
    type: String,
    unique: true,
    require: [true, "User email is required"],
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  photo: {
    type: String,
  },
  password: {
    type: String,
    require: [true, "Please provide a password"],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    require: [true, "User password is required"],
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: "Password are not the same",
    },
  },
  passwordChangedAt: {
    type: Date,
    default: new Date(),
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

//// DOCUMENT MIDDLEWARE: happens the moment when we receve data and moment it persist to database
//// The pre(save) middleware happens btwn geting data and saving data to database
//// passconfirm will not persist to database but the communication btwn pass & confPass will still be there
userSchema.pre("save", async function (next) {
  //////// run this one if password is actually modified
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

////////LOGIN CONFIRM PASSWORD IF ITS  MATCH LOG IN (instance method is available to all to all user document)
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

/////////  QUERY MIDDLEWARE
userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });

  next();
});

/////////CHECKING IF THE USER HAS CHANGE HIS PASSWORD BEFORE LOGIN
userSchema.methods.changePasswordAfter = async function (JWTTimestamp) {
  const changeTimeStamp = parseInt(this.passwordChangedAt.getTime()) / 1000;

  if (this.passwordChangedAt) {
    return JWTTimestamp < changeTimeStamp;
  }
  //// false means not change
  return false;
};

userSchema.methods.generateResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  console.log({ resetToken }, this.passwordResetToken);

  return resetToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
