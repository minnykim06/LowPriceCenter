import { FormEvent, useContext, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

import { post } from "src/api/requests";
import PickupLocationField from "src/components/PickupLocationField";
import { FirebaseContext } from "src/utils/FirebaseProvider";
import { hasGoogleMapsApiKey } from "src/utils/googleMaps";
import type { PickupLocation } from "src/utils/pickupLocation";

export function AddProduct() {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

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
    "Electronics",
    "School Supplies",
    "Dorm Essentials",
    "Furniture",
    "Clothes",
    "Miscellaneous",
  ];

  const conditions = ["New", "Used"];

  const { user } = useContext(FirebaseContext);
  const [error, setError] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickupLocation, setPickupLocation] = useState<PickupLocation | null>(null);
  const [pickupLocationError, setPickupLocationError] = useState<string | null>(null);
  const [hasPendingPickupSelection, setHasPendingPickupSelection] = useState(false);
  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const validFiles: File[] = [];
    const previews: string[] = [];

    files.forEach((file) => {
      if (file.size <= MAX_FILE_SIZE) {
        validFiles.push(file);
        previews.push(URL.createObjectURL(file));
      }
    });

    if (validFiles.length < files.length) {
      setFileError("Files larger than 5 MB were skipped.");
    } else {
      setFileError(null);
    }

    setNewFiles((prev) => [...prev, ...validFiles]);
    setNewPreviews((prev) => [...prev, ...previews]);

    if (productImages.current) productImages.current.value = "";
  };

  const removePreview = (idx: number) => {
    setNewFiles((f) => f.filter((_, i) => i !== idx));
    setNewPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (
        productName.current &&
        productPrice.current &&
        productDescription.current &&
        productYear.current &&
        productCategory.current &&
        productCondition.current &&
        user
      ) {
        if (hasGoogleMapsApiKey && hasPendingPickupSelection) {
          setPickupLocationError("Select a Google suggestion or clear the pickup address field.");
          return;
        }

        const body = new FormData();
        body.append("name", productName.current.value);
        body.append("price", productPrice.current.value);
        body.append("description", productDescription.current.value);
        body.append("year", productYear.current.value);
        body.append("category", productCategory.current.value);
        body.append("condition", productCondition.current.value);
        if (user.email) body.append("userEmail", user.email);

        if (productImages.current && productImages.current.files) {
          Array.from(productImages.current.files).forEach((file) => {
            body.append("images", file);
          });
        }

        newFiles.forEach((file) => body.append("images", file));

        if (pickupLocation) {
          body.append("pickupAddress", pickupLocation.address);
          body.append("pickupPlaceId", pickupLocation.placeId);
          body.append("pickupLat", pickupLocation.lat.toString());
          body.append("pickupLng", pickupLocation.lng.toString());
        }

        const res = await post("/api/products", body);
        if (res.ok) {
          setError(false);
          window.location.href = "/products";
        } else throw Error();
      } else throw Error();
    } catch {
      setError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "border border-gray-200 text-black text-sm rounded-lg w-full p-2.5 focus:ring-2 focus:ring-ucsd-blue focus:border-ucsd-blue outline-none";
  const labelClass = "block mb-2 font-semibold font-inter text-[#182B49]";

  return (
    <>
      <Helmet>
        <title>Sell - Low Price Center</title>
      </Helmet>
      <main className="w-[80%] max-w-screen-2xl mx-auto mt-20 mb-6">
        <h1 className="font-jetbrains font-bold text-2xl text-[#182B49] mb-4">Create Listing</h1>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="flex flex-col md:flex-row">

              {/* Left — Images */}
              <section className="w-full md:w-[40%] p-6 bg-[#F8F8F8] border-r border-gray-100">
                <label className={labelClass}>Images</label>
                <p className="text-sm text-gray-500 mb-3">Upload up to 10 photos</p>

                {newPreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {newPreviews.map((src, idx) => (
                      <div key={idx} className="relative w-24 h-24">
                        <img
                          src={src}
                          alt={`Product preview ${idx + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePreview(idx)}
                          aria-label={`Remove product preview ${idx + 1}`}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label
                  htmlFor="productImages"
                  className="flex flex-col items-center justify-center w-full h-36 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className="sr-only">Upload product images</span>
                  <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <p className="mb-1 text-sm text-gray-500 font-semibold">Click to upload</p>
                  <p className="text-xs text-gray-400">PNG or JPG (MAX. 5MB per image)</p>
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
                </label>
                {fileError && <p className="text-sm text-red-600 mt-2">{fileError}</p>}
              </section>

              {/* Right — Details */}
              <section className="w-full md:w-[60%] p-6">
                <div className="mb-5">
                  <label htmlFor="productName" className={labelClass}>Name</label>
                  <input id="productName" type="text" ref={productName} className={inputClass} placeholder="Product Name" required />
                </div>

                <div className="mb-5">
                  <label htmlFor="productPrice" className={labelClass}>Price</label>
                  <input id="productPrice" type="number" min={0} step="any" ref={productPrice} className={inputClass + " [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"} placeholder="0.00" required />
                </div>

                <div className="mb-5">
                  <label htmlFor="productDescription" className={labelClass}>Description</label>
                  <textarea id="productDescription" rows={3} ref={productDescription} className={inputClass} placeholder="Tell us more about this product..." />
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div>
                    <label htmlFor="productYear" className={labelClass}>Year</label>
                    <select id="productYear" ref={productYear} className={inputClass} required>
                      <option value="">Select</option>
                      {years.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="productCategory" className={labelClass}>Category</label>
                    <select id="productCategory" ref={productCategory} className={inputClass} required>
                      <option value="">Select</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="productCondition" className={labelClass}>Condition</label>
                    <select id="productCondition" ref={productCondition} className={inputClass} required>
                      <option value="">Select</option>
                      {conditions.map((condition) => (
                        <option key={condition} value={condition}>{condition}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <PickupLocationField
                  value={pickupLocation}
                  error={pickupLocationError}
                  onChange={(nextValue) => {
                    setPickupLocation(nextValue);
                    setPickupLocationError(null);
                  }}
                  onSelectionStatusChange={(hasPendingSelection) => {
                    setHasPendingPickupSelection(hasPendingSelection);
                    if (!hasPendingSelection) {
                      setPickupLocationError(null);
                    }
                  }}
                />

                <div className="h-px w-full bg-gray-100 my-6" />

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/products")}
                    className="font-inter text-sm font-semibold px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="font-inter text-sm font-semibold px-6 py-2.5 rounded-lg bg-ucsd-blue text-white hover:brightness-90 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : "List Product"}
                  </button>
                </div>

                {error && (
                  <p className="text-sm text-red-600 text-center mt-4">Error adding product. Try again.</p>
                )}
              </section>

            </div>
          </div>
        </form>
      </main>
    </>
  );
}
