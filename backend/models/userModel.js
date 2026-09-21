const crypto = require("crypto");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },

    // Stored as "salt:hash" (scrypt). select: false keeps it out of normal
    // queries; use .select("+password") when it's needed (login).
    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Hash a plain-text password for storage. Static so it can be used before
// a document exists (e.g. on signup).
userSchema.statics.hashPassword = function (password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

// Compare a plain-text password against this user's stored hash.
userSchema.methods.verifyPassword = function (password) {
  const [salt, hash] = this.password.split(":");
  if (!salt || !hash) return false;

  const check = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, "hex");

  return (
    stored.length === check.length && crypto.timingSafeEqual(stored, check)
  );
};

const User = mongoose.model("User", userSchema);

module.exports = User;
