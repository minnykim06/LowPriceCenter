import { FormEvent, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { get, post, patch, DELETE } from "src/api/requests";
import { FirebaseContext } from "src/utils/FirebaseProvider";
import { STUDENT_ORG_CHANGED_EVENT } from "src/utils/studentOrgEvents";
import { getToken } from "src/utils/User";
import { faStar } from "@fortawesome/free-regular-svg-icons";
import { faStar as faStarSolid } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface StudentOrganization {
  _id: string;
  organizationName: string;
  profilePicture: string;
  bio: string;
  location: string;
  contactInfo: {
    email: string;
    instagram: string;
    website: string;
    other: string;
  };
  merchLocation: string;
  firebaseUid: string;
}

interface MerchItem {
  _id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  studentOrganizationId: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function StudentOrgProfile() {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB limit

  const { user } = useContext(FirebaseContext);
  const [organization, setOrganization] = useState<StudentOrganization | null>(null);
  const [canAccessMyOrg, setCanAccessMyOrg] = useState<boolean | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"selling" | "likes" | "saves">("selling");

  const organizationNameRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const instagramRef = useRef<HTMLInputElement>(null);
  const websiteRef = useRef<HTMLInputElement>(null);
  const otherContactRef = useRef<HTMLInputElement>(null);
  const merchLocationRef = useRef<HTMLInputElement>(null);
  const profilePictureRef = useRef<HTMLInputElement>(null);

  const [profilePicturePreview, setProfilePicturePreview] = useState<string>("");
  const [newProfilePicture, setNewProfilePicture] = useState<File | null>(null);

  // Merch management state
  const [merchItems, setMerchItems] = useState<MerchItem[]>([]);
  const [isAddingMerch, setIsAddingMerch] = useState(false);
  const [editingMerchId, setEditingMerchId] = useState<string | null>(null);
  const [merchError, setMerchError] = useState<string>("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const merchNameRef = useRef<HTMLInputElement>(null);
  const merchPriceRef = useRef<HTMLInputElement>(null);
  const merchDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const merchImageRef = useRef<HTMLInputElement>(null);
  const [merchImagePreview, setMerchImagePreview] = useState<string>("");
  const [newMerchImage, setNewMerchImage] = useState<File | null>(null);

  const loadOrgProfile = useCallback(async () => {
    if (!user?.uid || !API_BASE_URL) {
      setCanAccessMyOrg(false);
      setOrganization(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) headers["token"] = token;

      const accessRes = await fetch(`${API_BASE_URL}/api/student-organizations/can-access`, {
        headers,
      });
      if (!accessRes.ok) {
        setCanAccessMyOrg(false);
        setOrganization(null);
        return;
      }
      const accessData = (await accessRes.json()) as { canAccess?: boolean };
      if (!accessData.canAccess) {
        setCanAccessMyOrg(false);
        setOrganization(null);
        return;
      }
      setCanAccessMyOrg(true);

      const res = await fetch(
        `${API_BASE_URL}/api/student-organizations/firebase/${user.uid}`,
        { headers },
      );
      if (res.ok) {
        const data = await res.json();
        setOrganization(data);
        setProfilePicturePreview(data.profilePicture || "");
      } else if (res.status === 404) {
        setOrganization(null);
        setProfilePicturePreview("");
      } else {
        setError("Failed to load organization profile");
      }
    } catch {
      setCanAccessMyOrg(false);
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadOrgProfile();
  }, [loadOrgProfile]);

  useEffect(() => {
    const onOrgChanged = () => void loadOrgProfile();
    window.addEventListener(STUDENT_ORG_CHANGED_EVENT, onOrgChanged);
    return () => window.removeEventListener(STUDENT_ORG_CHANGED_EVENT, onOrgChanged);
  }, [loadOrgProfile]);

  useEffect(() => {
    const fetchMerch = async () => {
      if (!organization) {
        setMerchItems([]);
        return;
      }

      try {
        const res = await get("/api/merch/my-organization");
        if (res.ok) {
          const data = await res.json();
          setMerchItems(data);
        }
      } catch (err) {
        console.error("Failed to fetch merch items:", err);
      }
    };

    fetchMerch();
  }, [organization]);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    if (file.size > MAX_FILE_SIZE) {
      setFileError("File size must be less than 5 MB");
      return;
    }

    setFileError(null);
    setNewProfilePicture(file);
    setProfilePicturePreview(URL.createObjectURL(file));
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");

    try {
      if (!organizationNameRef.current?.value || !user?.uid) {
        setError("Organization name is required");
        setIsSubmitting(false);
        return;
      }

      const body = new FormData();
      body.append("organizationName", organizationNameRef.current.value);
      body.append("bio", bioRef.current?.value || "");
      body.append("location", locationRef.current?.value || "");

      const contactInfo = {
        email: emailRef.current?.value || "",
        instagram: instagramRef.current?.value || "",
        website: websiteRef.current?.value || "",
        other: otherContactRef.current?.value || "",
      };
      body.append("contactInfo", JSON.stringify(contactInfo));
      body.append("merchLocation", merchLocationRef.current?.value || "");

      if (newProfilePicture) {
        body.append("profilePicture", newProfilePicture);
      }

      const res = await post("/api/student-organizations", body);
      if (res.ok) {
        const data = await res.json();
        setOrganization(data);
        setIsEditing(false);
        setShowCreateForm(false);
        setError("");
        window.dispatchEvent(new CustomEvent(STUDENT_ORG_CHANGED_EVENT));
      } else {
        const errorData = await res.json();
        setError(errorData.message || "Failed to create organization profile");
      }
    } catch (err) {
      setError("Failed to create organization profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");

    try {
      if (!organizationNameRef.current?.value || !user?.uid) {
        setError("Organization name is required");
        setIsSubmitting(false);
        return;
      }

      const body = new FormData();
      body.append("organizationName", organizationNameRef.current.value);
      body.append("bio", bioRef.current?.value || "");
      body.append("location", locationRef.current?.value || "");

      const contactInfo = {
        email: emailRef.current?.value || "",
        instagram: instagramRef.current?.value || "",
        website: websiteRef.current?.value || "",
        other: otherContactRef.current?.value || "",
      };
      body.append("contactInfo", JSON.stringify(contactInfo));
      body.append("merchLocation", merchLocationRef.current?.value || "");

      if (newProfilePicture) {
        body.append("profilePicture", newProfilePicture);
      } else if (organization?.profilePicture) {
        body.append("existingProfilePicture", organization.profilePicture);
      }

      const res = await patch("/api/student-organizations", body);
      if (res.ok) {
        const data = await res.json();
        setOrganization(data.organization);
        setIsEditing(false);
        setShowEditModal(false);
        setError("");
        setNewProfilePicture(null);
      } else {
        const errorData = await res.json();
        setError(errorData.message || "Failed to update organization profile");
      }
    } catch (err) {
      setError("Failed to update organization profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setShowEditModal(false);
    setNewProfilePicture(null);
    setProfilePicturePreview(organization?.profilePicture || "");
    setFileError(null);
  };

  const handleBackFromCreate = () => {
    setShowCreateForm(false);
    setNewProfilePicture(null);
    setProfilePicturePreview("");
    setFileError(null);
    setError("");
    if (profilePictureRef.current) profilePictureRef.current.value = "";
  };

  // Merch management functions
  const handleMerchImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    if (file.size > MAX_FILE_SIZE) {
      setMerchError("File size must be less than 5 MB");
      return;
    }

    setMerchError("");
    setNewMerchImage(file);
    setMerchImagePreview(URL.createObjectURL(file));
  };

  const handleAddMerch = async (e: FormEvent) => {
    e.preventDefault();
    setMerchError("");

    try {
      if (!merchNameRef.current?.value || !merchPriceRef.current?.value) {
        setMerchError("Name and price are required");
        return;
      }

      const body = new FormData();
      body.append("name", merchNameRef.current.value);
      body.append("price", merchPriceRef.current.value);
      body.append("description", merchDescriptionRef.current?.value || "");

      if (newMerchImage) {
        body.append("image", newMerchImage);
      }

      const res = await post("/api/merch", body);
      if (res.ok) {
        const data = await res.json();
        setMerchItems([...merchItems, data]);
        setIsAddingMerch(false);
        setNewMerchImage(null);
        setMerchImagePreview("");
        if (merchNameRef.current) merchNameRef.current.value = "";
        if (merchPriceRef.current) merchPriceRef.current.value = "";
        if (merchDescriptionRef.current) merchDescriptionRef.current.value = "";
        if (merchImageRef.current) merchImageRef.current.value = "";
      } else {
        const errorData = await res.json();
        setMerchError(errorData.message || "Failed to add merch item");
      }
    } catch (err) {
      setMerchError("Failed to add merch item. Please try again.");
    }
  };

  const handleUpdateMerch = async (e: FormEvent, merchId: string) => {
    e.preventDefault();
    setMerchError("");

    try {
      const merch = merchItems.find((m) => m._id === merchId);
      if (!merch) return;

      const body = new FormData();
      body.append("name", merchNameRef.current?.value || merch.name);
      body.append("price", merchPriceRef.current?.value || merch.price.toString());
      body.append("description", merchDescriptionRef.current?.value || merch.description);

      if (newMerchImage) {
        body.append("image", newMerchImage);
      } else {
        body.append("existingImage", merch.image);
      }

      const res = await patch(`/api/merch/${merchId}`, body);
      if (res.ok) {
        const data = await res.json();
        setMerchItems(merchItems.map((m) => (m._id === merchId ? data.merch : m)));
        setEditingMerchId(null);
        setNewMerchImage(null);
        setMerchImagePreview("");
      } else {
        const errorData = await res.json();
        setMerchError(errorData.message || "Failed to update merch item");
      }
    } catch (err) {
      setMerchError("Failed to update merch item. Please try again.");
    }
  };

  const handleDeleteMerch = async (merchId: string) => {
    if (!confirm("Are you sure you want to delete this merch item?")) return;

    try {
      const res = await DELETE(`/api/merch/${merchId}`);
      if (res.ok) {
        setMerchItems(merchItems.filter((m) => m._id !== merchId));
      } else {
        setMerchError("Failed to delete merch item");
      }
    } catch (err) {
      setMerchError("Failed to delete merch item. Please try again.");
    }
  };

  const startEditingMerch = (merch: MerchItem) => {
    setEditingMerchId(merch._id);
    setNewMerchImage(null);
    setMerchImagePreview(merch.image);
    if (merchNameRef.current) merchNameRef.current.value = merch.name;
    if (merchPriceRef.current) merchPriceRef.current.value = merch.price.toString();
    if (merchDescriptionRef.current) merchDescriptionRef.current.value = merch.description;
  };

  const cancelMerchEdit = () => {
    setEditingMerchId(null);
    setIsAddingMerch(false);
    setNewMerchImage(null);
    setMerchImagePreview("");
    setMerchError("");
  };

  // Star Rating Component
  const StarRating = ({ rating = 0 }: { rating?: number }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FontAwesomeIcon
            key={star}
            icon={star <= rating ? faStarSolid : faStar}
            className={star <= rating ? "text-yellow-400" : "text-gray-300"}
            size="sm"
          />
        ))}
        <span className="ml-1 text-gray-600 font-inter">({rating})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Student Organization Profile - Low-Price Center</title>
        </Helmet>
        <div className="min-h-screen bg-gray-50 pt-24 pb-10 px-4 flex justify-center items-start">
          <p className="text-center font-inter text-gray-600">Loading…</p>
        </div>
      </>
    );
  }

  if (canAccessMyOrg === false) {
    return (
      <>
        <Helmet>
          <title>Access denied - Low-Price Center</title>
        </Helmet>
        <div className="min-h-screen bg-gray-50 pt-24 pb-10 px-4">
          <div className="max-w-xl mx-auto bg-white shadow-md rounded-lg p-8 text-center">
            <p className="font-inter text-gray-700">
              You don&apos;t have access to My Organization. Only approved organization accounts can create and manage a profile.
            </p>
          </div>
        </div>
      </>
    );
  }

  const isCreating = !organization;
  const showOrgForm =
    (!organization && showCreateForm) || (!!organization && (isEditing || showEditModal));

  if (!organization && !showOrgForm) {
    return (
      <>
        <Helmet>
          <title>My organization - Low-Price Center</title>
        </Helmet>
        <div className="min-h-screen bg-gray-50 pt-24 pb-10 px-4">
          <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
            <div className="h-28 bg-ucsd-blue" />
            <div className="px-6 pb-8 pt-6 text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 font-jetbrains">
                My student organization
              </h1>
              <p className="mt-3 text-gray-600 font-inter max-w-md mx-auto">
                You haven&apos;t created an organization profile yet. Add your group&apos;s details and merch so students can find you on{" "}
                <a href="/student-organizations" className="text-ucsd-blue hover:underline font-medium">
                  Student Organizations
                </a>
                .
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="bg-ucsd-blue text-white font-semibold font-inter py-2.5 px-6 rounded-lg shadow hover:brightness-95 transition"
                >
                  Create organization
                </button>
                <a
                  href="/student-organizations"
                  className="inline-flex items-center justify-center border border-gray-200 text-gray-700 font-inter font-semibold py-2.5 px-6 rounded-lg hover:bg-gray-50 transition"
                >
                  Browse organizations
                </a>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Render create/edit form
  if (showOrgForm) {
    return (
      <>
        <Helmet>
          <title>
            {isCreating ? "Create organization" : "Edit organization"} · Low-Price Center
          </title>
        </Helmet>
        <div className="min-h-screen bg-gray-50 pt-24 pb-10 px-4">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl md:text-3xl text-center font-jetbrains font-semibold text-gray-800 mb-2">
              {isCreating ? "Create your organization" : "Edit organization"}
            </h1>
            <p className="text-center text-gray-600 font-inter text-sm mb-6">
              {isCreating
                ? "Name is required; other fields help students discover your group."
                : "Update how your organization appears on the site."}
            </p>

            <form
              onSubmit={isCreating ? handleCreate : handleUpdate}
              className="bg-white rounded-lg shadow-md border border-gray-100 p-6 md:p-8"
            >
              {/* Profile Picture */}
              <div className="mb-6">
                <label className="block mb-2 font-medium font-inter text-black">
                  Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  {profilePicturePreview && (
                    <img
                      src={profilePicturePreview}
                      alt="Profile preview"
                      className="w-32 h-32 object-cover rounded-full border-2 border-gray-300"
                    />
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={handleProfilePictureChange}
                      ref={profilePictureRef}
                      className="border border-gray-300 text-black text-sm rounded-md w-full p-2.5"
                    />
                    {fileError && <p className="text-sm text-red-600 mt-1">{fileError}</p>}
                  </div>
                </div>
              </div>

              {/* Organization Name */}
              <div className="mb-5">
                <label htmlFor="organizationName" className="block mb-2 font-medium font-inter text-black">
                  Organization Name *
                </label>
                <input
                  id="organizationName"
                  type="text"
                  ref={organizationNameRef}
                  defaultValue={organization?.organizationName || ""}
                  className="border border-gray-300 text-black text-sm rounded-md w-full p-2.5"
                  placeholder="Organization Name"
                  required
                />
              </div>

              {/* Bio */}
              <div className="mb-5">
                <label htmlFor="bio" className="block mb-2 font-medium font-inter text-black">
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows={5}
                  ref={bioRef}
                  defaultValue={organization?.bio || ""}
                  className="border border-gray-300 text-black text-sm rounded-md w-full p-2.5"
                  placeholder="Tell us about your organization..."
                />
              </div>

              {/* Location */}
              <div className="mb-5">
                <label htmlFor="location" className="block mb-2 font-medium font-inter text-black">
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  ref={locationRef}
                  defaultValue={organization?.location || ""}
                  className="border border-gray-300 text-black text-sm rounded-md w-full p-2.5"
                  placeholder="e.g., UCSD Campus"
                />
              </div>

              {/* Contact Information */}
              <div className="mb-5">
                <label className="block mb-2 font-medium font-inter text-black">Contact Information</label>
                <div className="space-y-3">
                  <input
                    type="email"
                    ref={emailRef}
                    defaultValue={organization?.contactInfo?.email || ""}
                    className="border border-gray-300 text-black text-sm rounded-md w-full p-2.5"
                    placeholder="Email"
                  />
                  <input
                    type="text"
                    ref={instagramRef}
                    defaultValue={organization?.contactInfo?.instagram || ""}
                    className="border border-gray-300 text-black text-sm rounded-md w-full p-2.5"
                    placeholder="Instagram handle"
                  />
                  <input
                    type="url"
                    ref={websiteRef}
                    defaultValue={organization?.contactInfo?.website || ""}
                    className="border border-gray-300 text-black text-sm rounded-md w-full p-2.5"
                    placeholder="Website URL"
                  />
                  <input
                    type="text"
                    ref={otherContactRef}
                    defaultValue={organization?.contactInfo?.other || ""}
                    className="border border-gray-300 text-black text-sm rounded-md w-full p-2.5"
                    placeholder="Other contact information"
                  />
                </div>
              </div>

              {/* Merch Location */}
              <div className="mb-5">
                <label htmlFor="merchLocation" className="block mb-2 font-medium font-inter text-black">
                  Merch Location
                </label>
                <input
                  id="merchLocation"
                  type="text"
                  ref={merchLocationRef}
                  defaultValue={organization?.merchLocation || ""}
                  className="border border-gray-300 text-black text-sm rounded-md w-full p-2.5"
                  placeholder="e.g., Library Walk, Price Center"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Where can students find your merch? (e.g., Library Walk, Price Center)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-between gap-3 mt-8">
                {isCreating ? (
                  <button
                    type="button"
                    onClick={handleBackFromCreate}
                    className="bg-gray-500 text-white font-semibold font-inter py-2 px-4 rounded-lg hover:brightness-95 transition"
                  >
                    Back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-gray-500 text-white font-semibold font-inter py-2 px-4 rounded-lg hover:brightness-95 transition"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-ucsd-blue text-white font-semibold font-inter py-2 px-6 rounded-lg shadow hover:brightness-95 transition ml-auto disabled:opacity-60"
                >
                  {isSubmitting ? "Saving…" : isCreating ? "Create profile" : "Save changes"}
                </button>
              </div>

              {error && <p className="text-sm text-red-600 text-center mt-4">{error}</p>}
            </form>
          </div>
        </div>
      </>
    );
  }

  // Main profile view
  return (
    <>
      <Helmet>
        <title>{organization?.organizationName || "My organization"} · Low-Price Center</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="h-32 md:h-36 bg-ucsd-blue" />

          <div className="relative px-6 md:px-8 pb-4 border-b border-gray-100">
            <div className="absolute -top-14 md:-top-16 left-6 md:left-8">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden">
                {organization?.profilePicture ? (
                  <img
                    src={organization.profilePicture}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setShowEditModal(true);
                }}
                className="bg-ucsd-blue text-white font-inter font-semibold px-4 py-2 rounded-lg hover:brightness-95 transition text-sm shadow-sm"
              >
                Edit profile
              </button>
            </div>

            <div className="pt-12 md:pt-14">
              <h1 className="font-inter font-bold text-2xl md:text-3xl text-gray-900">
                {organization?.organizationName}
              </h1>
              {organization?.location ? (
                <p className="text-sm text-gray-600 font-inter mt-1">{organization.location}</p>
              ) : null}
            </div>
          </div>

          <div className="px-6 md:px-8 pt-2 pb-4 border-b border-gray-100">
            <StarRating rating={0} />
            <div className="mt-4 space-y-2 text-sm md:text-base text-gray-600 font-inter">
              {organization?.bio ? <p className="whitespace-pre-wrap">{organization.bio}</p> : null}
              {organization?.contactInfo?.email ? <p>{organization.contactInfo.email}</p> : null}
              {organization?.contactInfo?.instagram ? (
                <p className="text-ucsd-blue">@{organization.contactInfo.instagram.replace(/^@/, "")}</p>
              ) : null}
              {organization?.merchLocation ? (
                <p>
                  <span className="font-medium text-gray-800">Merch: </span>
                  {organization.merchLocation}
                </p>
              ) : null}
            </div>
            <p className="mt-4 text-xs text-gray-500 font-inter">
              To remove your organization entirely, use{" "}
              <span className="font-medium text-gray-700">Delete organization</span> in the profile menu (avatar).
            </p>
          </div>

          <div className="px-6 md:px-8 py-4 border-b border-gray-100">
            <div className="flex gap-6 md:gap-8 flex-wrap">
              {(["selling", "likes", "saves"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={[
                    "font-inter text-base md:text-lg font-semibold pb-1 border-b-2 transition-colors capitalize",
                    activeTab === tab
                      ? "text-ucsd-blue border-ucsd-blue"
                      : "text-gray-400 border-transparent hover:text-gray-600",
                  ].join(" ")}
                >
                  {tab === "selling" ? "Merch" : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 md:px-8 py-8">
            {activeTab !== "selling" ? (
              <div className="py-12 text-center text-gray-500 font-inter text-sm">Nothing to show yet.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {merchItems.map((merch) => (
                  <div key={merch._id} className="relative group">
                    <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden border border-gray-100">
                      {merch.image ? (
                        <img src={merch.image} alt={merch.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100" />
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2 gap-2">
                      <div className="font-inter font-semibold text-sm text-gray-900 truncate">{merch.name}</div>
                      <div className="font-inter font-semibold text-sm text-ucsd-blue shrink-0">
                        ${merch.price.toFixed(0)}
                      </div>
                    </div>

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEditingMerch(merch)}
                        className="bg-ucsd-blue text-white p-2 rounded-full shadow-md hover:brightness-95 transition"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMerch(merch._id)}
                        className="bg-gray-800 text-white p-2 rounded-full shadow-md hover:brightness-95 transition"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setIsAddingMerch(true)}
                  className="aspect-square rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center border-2 border-dashed border-gray-200"
                  aria-label="Add merch"
                >
                  <span className="text-5xl text-gray-300 font-light leading-none">+</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Add Merch Form Modal */}
        {isAddingMerch && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-jetbrains font-medium">Add New Product</h2>
                        <button
                          onClick={cancelMerchEdit}
                          className="text-gray-500 hover:text-gray-700 text-2xl"
                        >
                          ×
                        </button>
                      </div>
                      <form onSubmit={handleAddMerch} className="space-y-4">
                        <div>
                          <label className="block mb-2 font-medium font-inter text-black">Name *</label>
                          <input
                            type="text"
                            ref={merchNameRef}
                            className="border border-gray-300 text-black text-sm rounded-md w-full p-2.5"
                            placeholder="Product name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block mb-2 font-medium font-inter text-black">Price *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            ref={merchPriceRef}
                            className="border border-gray-300 text-black text-sm rounded-md w-full p-2.5"
                            placeholder="0.00"
                            required
                          />
                        </div>
                        <div>
                          <label className="block mb-2 font-medium font-inter text-black">Description</label>
                          <textarea
                            ref={merchDescriptionRef}
                            rows={3}
                            className="border border-gray-300 text-black text-sm rounded-md w-full p-2.5"
                            placeholder="Describe your product..."
                          />
                        </div>
                        <div>
                          <label className="block mb-2 font-medium font-inter text-black">Image</label>
                          {merchImagePreview && (
                            <img
                              src={merchImagePreview}
                              alt="Product preview"
                              className="w-32 h-32 object-cover rounded-md mb-2 border-2 border-gray-300"
                            />
                          )}
                          <input
                            type="file"
                            accept="image/png, image/jpeg"
                            onChange={handleMerchImageChange}
                            ref={merchImageRef}
                            className="border border-gray-300 text-black text-sm rounded-md w-full p-2.5"
                          />
                        </div>
                        <div className="flex gap-3 pt-4">
                          <button
                            type="button"
                            onClick={cancelMerchEdit}
                            className="bg-gray-500 text-white font-semibold font-inter py-2 px-4 shadow-lg hover:brightness-90 transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="bg-ucsd-blue text-white font-semibold font-inter py-2 px-4 rounded-lg hover:brightness-95 transition"
                          >
                            Add product
                          </button>
                        </div>
                      </form>
                      {merchError && <p className="text-sm text-red-600 mt-4">{merchError}</p>}
                    </div>
                  </div>
        )}

        {/* Edit Merch Modal */}
        {editingMerchId && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-jetbrains font-medium">Edit Product</h2>
                        <button
                          onClick={cancelMerchEdit}
                          className="text-gray-500 hover:text-gray-700 text-2xl"
                        >
                          ×
                        </button>
                      </div>
                      {merchItems
                        .filter((m) => m._id === editingMerchId)
                        .map((merch) => (
                          <form
                            key={merch._id}
                            onSubmit={(e) => handleUpdateMerch(e, merch._id)}
                            className="space-y-4"
                          >
                            <div>
                              <label className="block mb-2 font-medium font-inter text-black">Name *</label>
                              <input
                                type="text"
                                ref={merchNameRef}
                                defaultValue={merch.name}
                                className="border border-gray-300 text-black text-sm rounded-md w-full p-2.5"
                                required
                              />
                            </div>
                            <div>
                              <label className="block mb-2 font-medium font-inter text-black">Price *</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                ref={merchPriceRef}
                                defaultValue={merch.price}
                                className="border border-gray-300 text-black text-sm rounded-md w-full p-2.5"
                                required
                              />
                            </div>
                            <div>
                              <label className="block mb-2 font-medium font-inter text-black">
                                Description
                              </label>
                              <textarea
                                ref={merchDescriptionRef}
                                rows={3}
                                defaultValue={merch.description}
                                className="border border-gray-300 text-black text-sm rounded-md w-full p-2.5"
                              />
                            </div>
                            <div>
                              <label className="block mb-2 font-medium font-inter text-black">Image</label>
                              {merchImagePreview && (
                                <img
                                  src={merchImagePreview}
                                  alt="Preview"
                                  className="w-32 h-32 object-cover rounded-md mb-2 border border-gray-300"
                                />
                              )}
                              <input
                                type="file"
                                accept="image/png, image/jpeg"
                                onChange={handleMerchImageChange}
                                className="border border-gray-300 text-black text-sm rounded-md w-full p-2.5"
                              />
                            </div>
                            <div className="flex gap-3 pt-4">
                              <button
                                type="button"
                                onClick={cancelMerchEdit}
                                className="bg-gray-500 text-white font-semibold font-inter py-2 px-4 shadow-lg hover:brightness-90 transition-all"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="bg-ucsd-blue text-white font-semibold font-inter py-2 px-4 rounded-lg hover:brightness-95 transition"
                              >
                                Save changes
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMerch(merch._id)}
                                className="bg-red-600 text-white font-semibold font-inter py-2 px-4 shadow-lg hover:brightness-90 transition-all"
                              >
                                Delete
                              </button>
                            </div>
                          </form>
                        ))}
                      {merchError && <p className="text-sm text-red-600 mt-4">{merchError}</p>}
                    </div>
                  </div>
        )}
      </div>
    </>
  );
}

