import { FormEvent, useContext, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { post } from "src/api/requests";
import { FirebaseContext } from "src/utils/FirebaseProvider";

export function AddProduct() {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const MAX_IMAGE_DIMENSION = 1600;
  const JPEG_QUALITY = 0.82;

  const productName = useRef<HTMLInputElement>(null);
  const productPrice = useRef<HTMLInputElement>(null);
  const productDescription = useRef<HTMLTextAreaElement>(null);
  const productYear = useRef<HTMLSelectElement>(null);
  const productCategory = useRef<HTMLSelectElement>(null);
  const productCondition = useRef<HTMLSelectElement>(null);
  const productImages = useRef<HTMLInputElement>(null);

  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1950 }, (_, i) => currentYear - i);


  const categories = [
  'Electronics',
  'School Supplies',
  'Dorm Essentials',
  'Furniture',
  'Clothes',
  'Miscellaneous'];

  const conditions = ["New", "Used"];

  const { user } = useContext(FirebaseContext);
  const [error, setError] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOptimizingImages, setIsOptimizingImages] = useState(false);
  const navigate = useNavigate();

  const compressImage = async (file: File) => {
    if (!file.type.startsWith("image/")) return { file, previewUrl: URL.createObjectURL(file) };

    // If the file is already small, avoid work and keep original.
    if (file.size <= 900 * 1024) {
      return { file, previewUrl: URL.createObjectURL(file) };
    }

    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const targetW = Math.max(1, Math.round(bitmap.width * scale));
    const targetH = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext("2d");
    if (!ctx) return { file, previewUrl: URL.createObjectURL(file) };

    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );

    if (!blob) return { file, previewUrl: URL.createObjectURL(file) };

    const optimized = new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });

    // If compression didn't help, keep original.
    const finalFile = optimized.size < file.size ? optimized : file;
    return { file: finalFile, previewUrl: URL.createObjectURL(finalFile) };
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const remainingSlots = Math.max(0, 10 - newFiles.length);
    const incoming = files.slice(0, remainingSlots);

    const oversized = incoming.filter((f) => f.size > MAX_FILE_SIZE);
    const valid = incoming.filter((f) => f.size <= MAX_FILE_SIZE);

    if (oversized.length > 0) {
      setFileError("Files larger than 5 MB were skipped.");
    } else {
      setFileError(null);
    }

    setIsOptimizingImages(true);
    try {
      const results = await Promise.all(valid.map(compressImage));
      setNewFiles((prev) => [...prev, ...results.map((r) => r.file)]);
      setNewPreviews((prev) => [...prev, ...results.map((r) => r.previewUrl)]);
    } finally {
      setIsOptimizingImages(false);
    }

    if (productImages.current) productImages.current.value = "";
  };

  const removePreview = (idx: number) => {
    setNewPreviews((p) => {
      const url = p[idx];
      if (url) URL.revokeObjectURL(url);
      return p.filter((_, i) => i !== idx);
    });
    setNewFiles((f) => f.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: FormEvent) => {
    if (isSubmitting || isOptimizingImages) return;
    setIsSubmitting(true);
    e.preventDefault();
    try {
      if (productName.current && productPrice.current && productDescription.current && productYear.current && productCategory.current && productCondition.current && user) {
        const body = new FormData();
        body.append("name", productName.current.value);
        body.append("price", productPrice.current.value);
        body.append("description", productDescription.current.value);
        body.append("year", productYear.current.value);
        body.append("category", productCategory.current.value);
        body.append("condition", productCondition.current.value);
        if (user.email) body.append("userEmail", user.email);

        newFiles.forEach((file) => body.append("images", file));

        const res = await post("/api/products", body);
        if (res.ok) {
          setError(false);
          window.location.href = "/products";
        } else throw Error();
      } else throw Error();
    } catch {
      setError(true);
    }
  };

  return (
    <>
      <Helmet>
        <title>Low-Price Center Marketplace</title>
      </Helmet>
      <main className="bg-[#F5F7FA] min-h-screen py-10">
        <div className="max-w-5xl mx-auto px-4">
          <form className="pb-10" onSubmit={handleSubmit}>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 space-y-8">
              <section className="pb-4 border-b border-gray-200">
                <p className="text-2xl md:text-xl font-rubic font-medium text-black-900">
                  List an item
                </p>
                <p className="mt-2 text-sm text-gray-600 font-inter">
                  Add photos and details so buyers can easily understand what you&apos;re selling.
                </p>
              </section>

              {/* Photos */}
              <section>
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                  <div>
                    <h2 className="font-rubic text-sm font-semibold uppercase tracking-wide text-black-900">
                      Photos
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                      Add up to 10 photos (max 5MB each)
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {Array.from({ length: newPreviews.length >= 8 ? 10 : 8 }).map((_, idx) => {
                    const src = newPreviews[idx];
                    const isFilled = Boolean(src);
                    const canAddMore = newPreviews.length < 10;
                    const isFirstEmpty = !isFilled && idx === newPreviews.length;

                    if (isFilled) {
                      return (
                        <div key={`preview-${idx}`} className="relative w-full aspect-square">
                          <img
                            src={src}
                            className="w-full h-full object-cover rounded-md border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removePreview(idx)}
                            className="absolute top-1 right-1 bg-black/70 text-white rounded-full text-xs w-6 h-6 flex items-center justify-center"
                            aria-label="Remove image"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={`slot-${idx}`}
                        type="button"
                        disabled={!canAddMore}
                        onClick={() => productImages.current?.click()}
                        className={`flex flex-col items-center justify-center w-full aspect-square rounded-md border-2 border-dashed transition-colors ${
                          canAddMore
                            ? "border-[#CBD6E3] bg-[#F5F7FA] hover:border-[#00629B] hover:bg-[#EDF4FB]"
                            : "border-[#CBD6E3] bg-[#F5F7FA] opacity-50 cursor-not-allowed"
                        }`}
                        aria-label={canAddMore ? "Add photo" : "Maximum photos reached"}
                      >
                        <span className="text-3xl leading-none text-[#9AA5B8]">+</span>
                        {isFirstEmpty && (
                          <span className="mt-1 text-[11px] font-inter text-gray-600">
                            Add photos
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <input
                  name="images"
                  id="productImages"
                  type="file"
                  multiple
                  accept="image/png, image/jpeg"
                  onChange={handleImageChange}
                  ref={productImages}
                  className="hidden"
                />

                {fileError && <p className="text-sm text-red-800 mt-3">{fileError}</p>}
                {isOptimizingImages && (
                  <p className="text-xs text-gray-500 mt-2 font-inter">Optimizing photos…</p>
                )}
              </section>

              {/* Name */}
              <section>
                <h2 className="font-inter text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Name
                </h2>
                <p className="mt-1 text-xs text-gray-500">Give your listing a clear, descriptive title.</p>
                <div className="mt-3">
                  <input
                    id="productName"
                    type="text"
                    ref={productName}
                    className="border border-gray-300 text-black text-sm rounded-md w-full p-2.5 focus:outline-none focus:ring-2 focus:ring-[#00629B] focus:border-transparent"
                    placeholder="Item name"
                    required
                  />
                </div>
              </section>

              {/* Description */}
              <section>
                <h2 className="font-inter text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Description
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Describe the item
                </p>
                <div className="mt-3">
                  <textarea
                    id="productDescription"
                    rows={8}
                    ref={productDescription}
                    className="border border-gray-300 text-black text-sm rounded-md w-full p-3 focus:outline-none focus:ring-2 focus:ring-[#00629B] focus:border-transparent"
                    placeholder="Describe the item..."
                  />
                </div>
              </section>

              {/* Info */}
              <section>
                <h2 className="font-inter text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Info
                </h2>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="productCategory"
                      className="block mb-1 text-xs font-medium font-inter text-gray-700 uppercase tracking-wide"
                    >
                      Category
                    </label>
                    <select
                      id="productCategory"
                      ref={productCategory}
                      className="border border-gray-300 text-black text-sm rounded-md w-full p-2.5 focus:outline-none focus:ring-2 focus:ring-[#00629B] focus:border-transparent"
                      required
                    >
                      <option value="">Select</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="productYear"
                      className="block mb-1 text-xs font-medium font-inter text-gray-700 uppercase tracking-wide"
                    >
                      Year
                    </label>
                    <select
                      id="productYear"
                      ref={productYear}
                      className="border border-gray-300 text-black text-sm rounded-md w-full p-2.5 focus:outline-none focus:ring-2 focus:ring-[#00629B] focus:border-transparent"
                      required
                    >
                      <option value="">Select</option>
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="productCondition"
                      className="block mb-1 text-xs font-medium font-inter text-gray-700 uppercase tracking-wide"
                    >
                      Condition
                    </label>
                    <select
                      id="productCondition"
                      ref={productCondition}
                      className="border border-gray-300 text-black text-sm rounded-md w-full p-2.5 focus:outline-none focus:ring-2 focus:ring-[#00629B] focus:border-transparent"
                      required
                    >
                      <option value="">Select</option>
                      {conditions.map((condition) => (
                        <option key={condition} value={condition}>
                          {condition}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {/* Item Price */}
              <section>
                <h2 className="font-inter text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Item Price
                </h2>
                <div className="mt-3 max-w-xs">
                  <label
                    htmlFor="productPrice"
                    className="block mb-1 text-xs font-medium font-inter text-gray-700 uppercase tracking-wide"
                  >
                    Price
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-sm">
                      USD
                    </span>
                    <input
                      id="productPrice"
                      type="number"
                      min={0}
                      max={1000000000}
                      step={0.01}
                      ref={productPrice}
                      className="border border-gray-300 text-black text-sm rounded-md w-full pl-12 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#00629B] focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              </section>

              {/* Actions */}
              <section>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/products`)}
                    className="order-2 sm:order-1 bg-white text-[#00629B] border border-[#00629B] font-semibold font-inter py-2.5 px-6 rounded-md shadow-sm hover:bg-[#00629B] hover:text-white transition-colors"
                  >
                    Save as draft
                  </button>
                  <button
                    type="submit"
                    disabled={isOptimizingImages || isSubmitting}
                    className={`order-1 sm:order-2 bg-[#FFCD00] text-black font-semibold font-inter py-2.5 px-8 rounded-md shadow-md transition-transform ${
                      isOptimizingImages || isSubmitting
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:brightness-95 hover:translate-y-[0.5px]"
                    }`}
                  >
                    {isOptimizingImages ? "Preparing photos..." : "Post"}
                  </button>
                </div>

                {error && (
                  <p className="text-sm text-red-800 text-center mt-4">
                    Error adding product. Try again.
                  </p>
                )}
              </section>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
