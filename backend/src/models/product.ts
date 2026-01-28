import { HydratedDocument, InferSchemaType, Schema, model } from "mongoose";

const pickupLocationSchema = new Schema(
  {
    address: {
      type: String,
      required: true,
    },
    placeId: {
      type: String,
      required: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const productSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  year: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  condition: {
    type: String,
    required: true,
  },
  timeCreated: {
    type: Date,
    required: true,
  },
  timeUpdated: {
    type: Date,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  isMarkedSold: {
    type: Boolean,
    required: true,
    default: false,
  },
  tags: {
    type: [String],
    enum: [
      "Electronics",
      "School Supplies",
      "Dorm Essentials",
      "Furniture",
      "Clothes",
      "Miscellaneous",
    ],
    required: false,
  },
  condition: {
    type: String,
    enum: ["New", "Like New", "Used", "For Parts"],
    required: true,
  },
  images: [{ type: String }],
  pickupLocation: {
    type: pickupLocationSchema,
    required: false,
  },
});

export type Product = HydratedDocument<InferSchemaType<typeof productSchema>>;

export default model<Product>("Product", productSchema);
