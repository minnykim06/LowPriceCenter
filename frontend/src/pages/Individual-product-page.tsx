import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import {
  faArrowUp,
  faCalendar,
  faCheck,
  faCheckCircle,
  faHeart as faHeartSolid,
  faPenToSquare,
  faTag,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { EmblaOptionsType } from "embla-carousel";
import { Suspense, lazy, useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { get, patch, post } from "src/api/requests";
import EmblaCarousel from "src/components/EmblaCarousel";
import { ChatContext } from "src/utils/ChatProvider";
import { FirebaseContext } from "src/utils/FirebaseProvider";

import type { PickupLocation } from "src/utils/pickupLocation";

const ListingMap = lazy(() => import("src/components/ListingMap"));
const priceCenterCoordinates = {
  lat: 32.8793,
  lng: -117.2367,
};

export function IndividualProductPage() {
  const navigate = useNavigate();
  const { user } = useContext(FirebaseContext);
  const { fetchConversations, joinConversation } = useContext(ChatContext);
  const { id } = useParams();
  const [product, setProduct] = useState<{
    name: string;
    price: number;
    year: number;
    category: string;
    condition: string;
    images: string[];
    userEmail: string;
    description: string;
    isMarkedSold: boolean;
    tags: string[];
    pickupLocation?: PickupLocation;
  }>();
  const [error, setError] = useState<string>();
  const [hasPermissions, setHasPermissions] = useState<boolean>(false);
  const OPTIONS: EmblaOptionsType = {
    loop: false,
    align: "start",
    skipSnaps: false,
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [message, setMessage] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const COOLDOWN = 60 * 24 * 1000 * 60;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(t);
  }, [message]);

  const location = useLocation() as {
    state?: { from?: "saved" | "marketplace" };
  };

  const from = location.state?.from ?? "marketplace";
  const backPath = from === "saved" ? "/saved-products" : "/products";

  useEffect(() => {
    const fetchProduct = async () => {
      await get(`/api/products/${id}`)
        .then(async (res) => setProduct(await res.json()))
        .catch(() => setError("Product not found"));
    };
    fetchProduct();
  }, []);

  useEffect(() => {
    const findEditPermission = async () => {
      const uid = user?.uid;
      if (uid)
        await get(`/api/users/${uid}`).then(async (res) => {
          const ownedByUser = await res.json().then((data) => {
            return data.productList.includes(id);
          });
          setHasPermissions(ownedByUser);
        });
    };
    findEditPermission();
  }, []);

  useEffect(() => {
    const key = `interest-cooldown-${id}`;
    const stored = localStorage.getItem(key);
    if (!stored) return;

    const end = parseInt(stored, 10);
    if (Date.now() < end) {
      setCooldownEnd(end);
      const timer = setTimeout(() => {
        setCooldownEnd(null);
        localStorage.removeItem(key);
      }, end - Date.now());
      return () => clearTimeout(timer);
    } else {
      localStorage.removeItem(key);
    }
  }, [id]);
  const handleSendInterestEmail = async () => {
    if (cooldownEnd && Date.now() < cooldownEnd) {
      setMessage("Please wait before sending another interest email.");
      return;
    }
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await post("/api/interestEmail", { consumerId: user?.uid, productId: id });
      const result = await response.json();
      if (!response.ok) {
        setMessage(`Error: ${result.message}`);
        return;
      }

      setMessage("Interest email sent successfully!");
      const end = Date.now() + COOLDOWN;
      setCooldownEnd(end);
      const key = `interest-cooldown-${id}`;
      localStorage.setItem(key, end.toString());
      setTimeout(() => {
        setCooldownEnd(null);
        localStorage.removeItem(key);
      }, COOLDOWN);
    } catch {
      setMessage("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendSellerMessage = async () => {
    const receiver = product?.userEmail;
    if (!receiver) return;
    try {
      const res = await post("/api/conversations", { participantEmails: [receiver] });
      const data = await res.json();
      fetchConversations();
      joinConversation(data._id);

      navigate("/messages");
    } catch (err) {
      console.log(err);
    }
  };
  const handleMarkSold = async () => {
    if (!product) return;
    const body = new FormData();
    body.append("name", product.name);
    body.append("price", product.price.toString());
    body.append("description", product.description);
    body.append("userEmail", product.userEmail);
    body.append("existingImagesJson", JSON.stringify(product.images));
    body.append("isMarkedSold", String(!product.isMarkedSold));

    await patch(`/api/products/${id}`, body)
      .then(async (res) => {
        const response = await res.json();
        if (res.ok) {
          setProduct(response.updatedProduct);
          navigate(`/products/${id}`);
        } else {
          alert("Failed to update product");
          console.log(response);
        }
      })
      .catch((e) => {
        console.log(e);
      });
  };

  const isCooling = Boolean(cooldownEnd && Date.now() < cooldownEnd);
  // const secondsLeft = isCooling ? Math.ceil((cooldownEnd! - Date.now()) / 1000) : 0;
  const msLeft = isCooling ? cooldownEnd! - Date.now() : 0;
  const totalMinutes = Math.ceil(msLeft / (1000 * 60)); // convert ms → minutes
  const hoursLeft = Math.floor(totalMinutes / 60);
  const minutesLeft = totalMinutes % 60;
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isCooling) return;
    const iv = setInterval(() => setTick((t) => t + 1), 60_000); // 60,000 ms = 1 min
    return () => clearInterval(iv);
  }, [isCooling]);
  let buttonLabel = "Interested?";
  if (message) {
    buttonLabel = message;
  } else if (isCooling && isHovered) {
    buttonLabel = `Please wait ${hoursLeft}:${minutesLeft.toString().padStart(2, "0")} hours`;
  } else if (isCooling && !isHovered) {
    buttonLabel = "Interest email sent successfully!";
  } else if (!isCooling && isHovered) {
    buttonLabel = "Click to send interest email";
  }

  const toggleSave = async () => {
    if (!user?.uid) {
      navigate("/login");
      return;
    }

    try {
      setIsSaved((prev) => !prev);
      const response = await post(`/api/users/${user.uid}/saved-products`, { productId: id });
      if (!response.ok) {
        setIsSaved((prev) => !prev);
        throw new Error("Failed to update saved products");
      }
      const userRes = await get(`/api/users/${user.uid}`);
      const userData = await userRes.json();
      setIsSaved(userData.savedProducts.includes(id));
    } catch (caughtError) {
      console.error("Error saving product:", caughtError);
    }
  };

  const pickupLocation = product?.pickupLocation;
  const pickupMapCenter = pickupLocation
    ? { lat: pickupLocation.lat, lng: pickupLocation.lng }
    : priceCenterCoordinates;
  const pickupAddressLabel = pickupLocation?.address ?? "UCSD Price Center";

  return (
    <>
      <Helmet>
        <title>{`${product?.name} - Low-Price Center`}</title>
      </Helmet>
      <main className="w-[80%] max-w-screen-2xl mx-auto m-12">
        <div className="flex justify-between">
          <button
            className="text-lg mb-4 font-inter hover:underline"
            onClick={() => navigate(backPath)}
          >
            &larr; Return to {from === "saved" ? "Saved Products" : "Marketplace"}
          </button>

          {hasPermissions && (
            <button
              className="text-lg mb-4 font-inter hover:underline"
              onClick={() => navigate(`/edit-product/${id}`)}
            >
              Edit Product <FontAwesomeIcon icon={faPenToSquare} />
            </button>
          )}
        </div>
        {/* Error message if product not found */}
        {error && <p className="max-w-[80%] w-full px-3 text-red-800">{error}</p>}
        {/* Display product */}
        {!error && (
          <div className="flex flex-wrap flex-col md:flex-row mb-6 gap-12">
            {/* Image Section */}
            <section className="w-full flex-1 flex flex-col items-center space-y-12 md:h-auto">
              <div className="max-h-[24rem] h-[24rem] max-w-[32rem] w-[32rem] relative">
                <img
                  src={
                    product?.images && product.images.length > 0
                      ? product.images[currentIndex]
                      : "/productImages/product-placeholder.webp"
                  }
                  alt={`${product?.name} preview ${currentIndex + 1}`}
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={toggleSave}
                  className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                  <FontAwesomeIcon
                    icon={isSaved ? faHeartSolid : faHeartRegular}
                    size="lg"
                    className={isSaved ? "text-red-500" : "text-gray-700"}
                  />
                </button>
              </div>
              {product?.images && product.images.length > 1 && (
                <EmblaCarousel
                  slides={product.images}
                  options={OPTIONS}
                  onSelect={(idx) => setCurrentIndex(idx)}
                />
              )}
            </section>

            {/* Info Section */}
            <section className="max-w-[100%] md:max-w-[50%] flex-1 flex flex-col">
              <h1 className="pt-2 font-jetbrains text-[#182B49] font-bold text-2xl break-words">
                {product?.name}
              </h1>

              <hr className="my-4 w-full mx-auto border-gray-200" />

              {hasPermissions &&
                (product?.isMarkedSold ? (
                  <button
                    className="text-sm font-inter py-2.5 mb-4 font-semibold border border-ucsd-blue text-ucsd-blue rounded-lg w-full"
                    onClick={handleMarkSold}
                  >
                    Renew on Marketplace <FontAwesomeIcon icon={faArrowUp} />
                  </button>
                ) : (
                  <button
                    className="text-sm font-inter py-2.5 mb-4 font-semibold bg-ucsd-blue hover:bg-ucsd-darkblue text-white rounded-lg w-full transition-colors"
                    onClick={handleMarkSold}
                  >
                    Mark as Sold <FontAwesomeIcon icon={faCheck} />
                  </button>
                ))}

              <p className="font-inter text-[#182B49] text-lg font-semibold pb-4">
                USD ${product?.price?.toFixed(2)}
              </p>
              {product?.isMarkedSold && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="font-inter text-black text-sm break-words">
                    {hasPermissions
                      ? "This product has been marked as sold. It will not appear on the marketplace, but others can still find it under your profile."
                      : "This product is no longer available."}
                  </p>
                </div>
              )}
              {product?.description && (
                <div className="bg-[#F5F0E6] rounded-lg p-4 mb-4">
                  <p className="font-inter text-black text-sm break-words">
                    {product.description}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <FontAwesomeIcon icon={faCalendar} className="text-[#00629B] text-xs" />
                    <span className="font-inter text-gray-500 text-[10px] uppercase tracking-wide">Year</span>
                  </div>
                  <p className="font-inter text-black text-sm font-semibold">{product?.year}</p>
                </div>

                <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <FontAwesomeIcon icon={faTag} className="text-[#00629B] text-xs" />
                    <span className="font-inter text-gray-500 text-[10px] uppercase tracking-wide">Category</span>
                  </div>
                  <p className="font-inter text-black text-sm font-semibold">{product?.category}</p>
                </div>

                <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-[#00629B] text-xs" />
                    <span className="font-inter text-gray-500 text-[10px] uppercase tracking-wide">Condition</span>
                  </div>
                  <p className="font-inter text-black text-sm font-semibold">{product?.condition}</p>
                </div>
              </div>

              <section className="mt-2">
                <h2 className="font-inter text-sm font-semibold text-[#182B49]">Pickup Location</h2>
                <p className="mt-2 font-inter text-sm leading-6 text-[#4B5563]">
                  {pickupLocation?.address ??
                    "Older listings still default to UCSD Price Center until a pickup address is added."}
                </p>
                <Suspense
                  fallback={
                    <div
                      className="mt-4 h-64 animate-pulse rounded-2xl border border-gray-200 bg-[#F8F8F8]"
                      aria-label="Loading pickup map section"
                    />
                  }
                >
                  <ListingMap
                    center={pickupMapCenter}
                    className="mt-4"
                    label={pickupAddressLabel}
                    markerTitle={pickupAddressLabel}
                    placeId={pickupLocation?.placeId}
                  />
                </Suspense>
              </section>
              {!hasPermissions && (
                <div className="flex flex-col gap-2 ">
                  <div
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    <button
                      onClick={!isCooling ? handleSendInterestEmail : undefined}
                      className={`
                      font-inter text-[#00629B]
                      text-base md:text-xl font-light mt-6
                      bg-white border border-[#00629B]
                      px-4 py-2 rounded-lg
                      transition-colors duration-200 ease-in-out
                      ${!isCooling ? "hover:bg-blue-100" : ""}
                      ${isCooling ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                    >
                      {buttonLabel}
                    </button>
                  </div>
                  <button
                    onClick={handleSendSellerMessage}
                    className={`font-inter text-[#00629B]
                      text-base md:text-xl font-light mt-6
                      bg-white border border-[#00629B]
                      px-4 py-2 rounded-lg
                      transition-colors duration-200 ease-in-out
                      hover:bg-blue-100
                      `}
                  >
                    Send a message?
                  </button>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </>
  );
}
