import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import {
  faCalendar,
  faTag,
  faCheckCircle,
  faMapMarkerAlt,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { get, post } from "src/api/requests";
import { FirebaseContext } from "src/utils/FirebaseProvider";
import EmblaCarousel from "src/components/EmblaCarousel";
import { EmblaOptionsType } from "embla-carousel";

export function IndividualProductPage() {
  const navigate = useNavigate();
  const { user } = useContext(FirebaseContext);
  const { id } = useParams();
  const [product, setProduct] = useState<{
    name: string;
    price: number;
    year: number;
    category: string;
    condition: string;
    location: string;
    images: string[];
    userEmail: string;
    description: string;
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
  const isCooling = Boolean(cooldownEnd && Date.now() < cooldownEnd);
  // const secondsLeft = isCooling ? Math.ceil((cooldownEnd! - Date.now()) / 1000) : 0;
  const msLeft = isCooling ? cooldownEnd! - Date.now() : 0;
  const totalMinutes = Math.ceil(msLeft / (1000 * 60)); // convert ms → minutes
  const hoursLeft = Math.floor(totalMinutes / 60);
  const minutesLeft = totalMinutes % 60;
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!isCooling) return;
    const iv = setInterval(() => setTick((t) => t + 1), 60_000); // 60 000 ms = 1 min
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
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const hasMultipleImages = Boolean(product?.images && product.images.length > 1);
  const goToPreviousImage = () => {
    if (!product?.images || product.images.length === 0) return;
    setCurrentIndex((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1,
    );
  };

  const goToNextImage = () => {
    if (!product?.images || product.images.length === 0) return;
    setCurrentIndex((prev) =>
      prev === product.images.length - 1 ? 0 : prev + 1,
    );
  };

  return (
    <>
      <Helmet>
        <title>{`${product?.name} - Low-Price Center`}</title>
      </Helmet>
      <main className="w-[80%] max-w-screen-2xl mx-auto m-12">
        {/* Edit Product button moved to dynamic section below */}
        {/* <div className="flex justify-end">
          {hasPermissions && (
            <button
              className="text-lg mb-4 font-inter hover:underline"
              onClick={() => navigate(`/edit-product/${id}`)}
            >
              Edit Product <FontAwesomeIcon icon={faPenToSquare} />
            </button>
          )}
        </div> */}
        {/* Error message if product not found */}
        {error && <p className="max-w-[80%] w-full px-3 text-red-800">{error}</p>}
        {/* Display product */}
        {!error && (
          <div className="flex flex-wrap flex-col md:flex-row mb-6 gap-12">
            {/* Image Section */}
            <section className="w-full flex-1 flex flex-col items-center space-y-12 md:h-auto">
              <button
                className="text-black font-inter text-lg hover:underline transition self-start"
                onClick={() => navigate(backPath)}
              >
                &larr; Return to {from === "saved" ? "Saved Products" : "Marketplace"}
              </button>
              <div className="w-full max-w-[40rem] rounded-2xl bg-[#F5F5F5] flex items-center justify-center p-4">
                <div className="max-h-[24rem] h-[24rem] w-full relative rounded-xl overflow-hidden bg-[#F5F5F5]">
                  <img
                    src={
                      product?.images && product.images.length > 0
                        ? product.images[currentIndex]
                        : "/productImages/product-placeholder.webp"
                    }
                    alt={`Image ${currentIndex + 1} of ${product?.name}`}
                    className="w-full h-full object-contain"
                  />
                  {hasMultipleImages && (
                    <>
                      <button
                        type="button"
                        onClick={goToPreviousImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 rounded-full w-8 h-8 flex items-center justify-center shadow-sm transition-colors"
                        aria-label="Previous image"
                      >
                        <FontAwesomeIcon icon={faChevronLeft} size="sm" />
                      </button>
                      <button
                        type="button"
                        onClick={goToNextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 rounded-full w-8 h-8 flex items-center justify-center shadow-sm transition-colors"
                        aria-label="Next image"
                      >
                        <FontAwesomeIcon icon={faChevronRight} size="sm" />
                      </button>
                    </>
                  )}
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
              <h1 className="pt-2 font-jetbrains-mono text-black font-bold text-3xl break-words mb-3">
                {product?.name}
              </h1>
              

              
              <div className="mb-6">
                {/* Price - Prominent Display */}
                <h2 className="font-rubik text-[#00629B] text-2xl font-extrabold">USD 
                  ${product?.price?.toFixed(2)}
                </h2>
              <div className="h-px w-full bg-[#FFCD00] mb-4" style={{ boxShadow: "0 1px 0px rgba(0, 0, 0, 0.15)" }} /> 

              {/* Description */}
              {product?.description && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-3 min-h-[240px]" style={{ boxShadow: "3px 3px 0px rgba(0, 98, 155, .75)" }}>
                  
                  <p className="font-inter text-black text-base md:text-lg leading-relaxed break-words whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
              )}

              </div>

              

              {/* Product Details Grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="border border-gray-200 rounded-lg p-4 min-h-[96px] bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-1">
                    <FontAwesomeIcon icon={faCalendar} className="text-[#00629B] text-sm" />
                    <span className="font-inter text-gray-500 text-[11px] uppercase tracking-wide">Year</span>
                  </div>
                  <p className="font-inter text-black text-base font-semibold">{product?.year}</p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 min-h-[96px] bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-1">
                    <FontAwesomeIcon icon={faTag} className="text-[#00629B] text-sm" />
                    <span className="font-inter text-gray-500 text-[11px] uppercase tracking-wide">Category</span>
                  </div>
                  <p className="font-inter text-black text-base font-semibold">{product?.category}</p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 min-h-[96px] bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-1">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-[#00629B] text-sm" />
                    <span className="font-inter text-gray-500 text-[11px] uppercase tracking-wide">Condition</span>
                  </div>
                  <p className="font-inter text-black text-base font-semibold">{product?.condition}</p>
                </div>

              </div>

              {/* Dynamic button section: Edit if owner, Interest Email if viewer */}
              <div className="flex justify-center mt-8">
                {hasPermissions ? (
                  <button
                    className="bg-ucsd-blue text-white font-inter text-lg md:text-xl px-8 py-3 rounded-lg hover:brightness-90 transition-all duration-200"
                    onClick={() => navigate(`/edit-product/${id}`)}
                  >
                    Edit Product <FontAwesomeIcon icon={faPenToSquare} />
                  </button>
                ) : (
                  <div
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    <button
                      onClick={!isCooling ? handleSendInterestEmail : undefined}
                      className={`
                        font-inter text-white
                        text-lg md:text-xl px-8 py-3 rounded-lg
                        bg-ucsd-blue
                        transition-all duration-200 ease-in-out
                        ${!isCooling ? "hover:brightness-90" : ""}
                        ${isCooling ? "opacity-50 cursor-not-allowed" : ""}
                        `}
                    >
                      {buttonLabel}
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </>
  );
}
