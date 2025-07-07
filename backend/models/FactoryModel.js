const mongoose = require("mongoose")
const { Schema } = mongoose

const factorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      default: "No description provided.",
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("Factory", factorySchema)
