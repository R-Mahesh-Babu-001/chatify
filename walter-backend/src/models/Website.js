import mongoose from "mongoose";

const websiteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
    },
    viewMode: {
      type: String,
      enum: ["assistant", "website"],
      default: "website",
    },
  },
  { timestamps: true }
);

websiteSchema.index({ userId: 1, url: 1 }, { unique: true });

const Website = mongoose.model("Website", websiteSchema);

export default Website;
