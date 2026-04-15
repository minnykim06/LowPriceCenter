<<<<<<< HEAD
import {
  faBars,
  faCartShopping,
  faUser,
  faXmark,
  faHeart,
  faUsers,
  faStore,
  faChevronDown,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useEffect, useRef, useState } from "react";
import { get } from "src/api/requests";
=======
import { faHeart } from "@fortawesome/free-regular-svg-icons";
import {
  faBars,
  faCartShopping,
  faMagnifyingGlass,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { HTMLAttributes, forwardRef, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
<<<<<<< Updated upstream
>>>>>>> upstream/dev
=======
import { DELETE } from "src/api/requests";
>>>>>>> Stashed changes
import { FirebaseContext } from "src/utils/FirebaseProvider";
import { STUDENT_ORG_CHANGED_EVENT } from "src/utils/studentOrgEvents";
import { getToken } from "src/utils/User";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface MiniSearchbarProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onSubmit: React.FormEventHandler;
}

const MiniSearchbar = forwardRef<HTMLFormElement, MiniSearchbarProps>(
  ({ open, onSubmit, ...props }, ref) => {
    return (
      <div
        className={`absolute mt-8 -translate-x-1/2 left-1/2 w-[40vh] p-4 bg-white shadow-ucsd-blue shadow-md
          flex flex-col gap-4 
          rounded-lg transform transition-all duration-150 ease-out 
          ${open ? "opacity-100 " : "opacity-0 pointer-events-none"} 
          `}
        {...props}
      >
        <p className="text-md">Search the marketplace</p>
        <form onSubmit={onSubmit} ref={ref}>
          <div className={`flex flex-row w-full rounded-full border-2 p-2 text-[16px]`}>
            <div className="items-center px-2 pointer-events-none">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                aria-label="faMagnifyingGlass"
                className="text-gray-400"
              />
            </div>
            <input
              name="query"
              className={`w-full focus:outline-none text-[16px]`}
              placeholder="Search UCSD"
            />
          </div>
        </form>
      </div>
    );
  },
);

MiniSearchbar.displayName = "MiniSearchbar";

export function Navbar() {
  const { user, signOutFromFirebase, openGoogleAuthentication } = useContext(FirebaseContext);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
<<<<<<< HEAD
  const [isStudentOrgDropdownOpen, setStudentOrgDropdownOpen] = useState(false);
  const [canAccessMyOrganization, setCanAccessMyOrganization] = useState(false);
  const menuRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setCanAccessMyOrganization(false);
      return;
    }
    get("/api/student-organizations/can-access")
      .then((res) => res.json())
      .then((data: { canAccess?: boolean }) => setCanAccessMyOrganization(data.canAccess === true))
      .catch(() => setCanAccessMyOrganization(false));
  }, [user]);
=======
  const [isSearchBarOpen, setSearchbarOpen] = useState<boolean>(false);
<<<<<<< Updated upstream
=======
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [studentOrgCanAccess, setStudentOrgCanAccess] = useState(false);
  const [hasStudentOrganization, setHasStudentOrganization] = useState(false);
  const [deleteOrgLoading, setDeleteOrgLoading] = useState(false);
>>>>>>> Stashed changes
  const menuRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();
>>>>>>> upstream/dev

  useEffect(() => {
    let cancelled = false;

    const loadStudentOrgMenuState = async () => {
      if (!user?.uid || !API_BASE_URL) {
        setStudentOrgCanAccess(false);
        setHasStudentOrganization(false);
        return;
      }

      try {
        const token = await getToken();
        const headers: Record<string, string> = {};
        if (token) headers["token"] = token;

        const accessRes = await fetch(`${API_BASE_URL}/api/student-organizations/can-access`, {
          headers,
        });
        if (!accessRes.ok) {
          if (!cancelled) {
            setStudentOrgCanAccess(false);
            setHasStudentOrganization(false);
          }
          return;
        }
        if (cancelled) return;
        const accessJson = (await accessRes.json()) as { canAccess?: boolean };
        const canAccess = Boolean(accessJson.canAccess);
        setStudentOrgCanAccess(canAccess);
        if (!canAccess) {
          setHasStudentOrganization(false);
          return;
        }

        const orgRes = await fetch(
          `${API_BASE_URL}/api/student-organizations/firebase/${user.uid}`,
          { headers },
        );
        if (!cancelled) setHasStudentOrganization(orgRes.ok);
      } catch {
        if (!cancelled) {
          setStudentOrgCanAccess(false);
          setHasStudentOrganization(false);
        }
      }
    };

    void loadStudentOrgMenuState();

    const onOrgChanged = () => void loadStudentOrgMenuState();
    window.addEventListener(STUDENT_ORG_CHANGED_EVENT, onOrgChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(STUDENT_ORG_CHANGED_EVENT, onOrgChanged);
    };
  }, [user?.uid]);

  const handleDeleteStudentOrganization = async () => {
    if (
      !confirm(
        "Delete your student organization profile? This removes your org page and cannot be undone.",
      )
    ) {
      return;
    }
    setDeleteOrgLoading(true);
    try {
      await DELETE("/api/student-organizations");
      setHasStudentOrganization(false);
      window.dispatchEvent(new CustomEvent(STUDENT_ORG_CHANGED_EVENT));
      navigate("/student-org-profile");
    } catch {
      alert("Could not delete your organization. Try again.");
    } finally {
      setDeleteOrgLoading(false);
    }
  };

  const toggleMobileMenu = () => setMobileMenuOpen((o) => !o);
  const iconBtn =
    "w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-ucsd-blue hover:border-ucsd-blue transition";

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    if (!searchRef.current) return;
    e.preventDefault();
    const formData = new FormData(searchRef.current);
    const url = new URL("/products", window.location.origin);
    url.searchParams.set("query", formData.get("query") as string);
    navigate(url.pathname + url.search);
    return;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
<<<<<<< HEAD
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setStudentOrgDropdownOpen(false);
      }
    };
=======
>>>>>>> upstream/dev

      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchbarOpen(false);
        setTimeout(() => {
          if (searchRef.current) searchRef.current.reset();
        }, 100);
      }
    };
    const handleResize = () => {
      if (window.matchMedia("(min-width: 768px)").matches) setMobileMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const tabStyling = "text-gray-400 hover:text-gray-800";
  const selectedTabStyling = "text-ucsd-blue";

  return (
    <>
<<<<<<< HEAD
      <nav className="w-full sticky top-0 z-50">
        <div className="px-4 pt-3">
          <div className="mx-auto max-w-6xl bg-white rounded-2xl shadow-md border border-gray-200">
            <div className="h-14 px-4 flex items-center justify-between">
              {/* Brand */}
              <button
                className="font-jetbrains text-xl tracking-tight"
                onClick={() => (window.location.href = "/products")}
                aria-label="Go to products"
              >
                <span className="text-ucsd-blue">Low</span>{" "}
                <span className="text-figma-orange">Price</span>{" "}
                <span className="text-ucsd-blue">Center</span>
              </button>

              {/* Center links (desktop) */}
              <div className="hidden md:flex items-center gap-6">
                <button
                  hidden={user === null}
                  onClick={() => (window.location.href = "/products")}
                  className="font-inter text-sm text-gray-400 hover:text-gray-700 transition-colors"
                >
                  Shop
=======
      <nav className="font-rubik shadow-md shadow-ucsd-blue bg-white c left-0 right-0 min-w-0 mx-12 rounded-b-lg h-12 max-h-12 px-6 py-10 flex items-center justify-between fixed top-0 z-50">
        {/* Desktop View */}
        <button
          className="text-lg font-semibold"
          onClick={() => (window.location.href = "/products")}
        >
          <span className="text-3xl text-ucsd-blue">Low </span>
          <span className="text-3xl text-ucsd-gold">Price Center</span>
        </button>
        <div
          className={`hidden ${!user && "opacity-0"} md:flex flex-row gap-3 items-center justify-center`}
        >
          {[
            { label: "Shop", path: "/products" },
            { label: "Sell", path: "/sell" },
            { label: "Student Organizations", path: "/organizations" },
          ].map((val) => (
            <button
              key={val.label}
              className={`${window.location.pathname === val.path ? selectedTabStyling : tabStyling}`}
              onClick={() => {
                window.location.href = val.path;
              }}
            >
              {val.label}
            </button>
          ))}
        </div>
        <div className="hidden md:flex items-center text-2xl space-x-4">
          <button
            onClick={() => (window.location.href = "/saved-products")}
            className={`${!user && "opacity-0"} w-12 h-12 text-xl flex items-center justify-center border-2 hover:bg-gray-300 rounded-full transition-colors`}
          >
            <FontAwesomeIcon icon={faHeart} aria-label="Heart Icon" />
          </button>

          <div className="relative">
            <button
              onClick={() => {
                setSearchbarOpen(true);
              }}
              className={`${!user && "opacity-0"} w-12 h-12 text-xl flex items-center justify-center border-2 hover:bg-gray-300 rounded-full transition-colors`}
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} aria-label="faMagnifyingGlass" />
            </button>
            <MiniSearchbar open={isSearchBarOpen} ref={searchRef} onSubmit={handleSearch} />
          </div>

          <button
            onClick={() => (window.location.href = "/products")}
            className={`${!user && "opacity-0"} w-12 h-12 text-xl flex items-center justify-center border-2 hover:bg-gray-300 rounded-full transition-colors`}
          >
            <FontAwesomeIcon icon={faCartShopping} aria-label="Shopping Cart" />
          </button>

          <button
            onClick={user ? signOutFromFirebase : openGoogleAuthentication}
            className="px-4 py-1 bg-transparent border-transparent rounded transition-colors"
          >
            {user ? "Log Out" : "Log In"}
          </button>
        </div>
        <li>
          <button
            onClick={() => (window.location.href = "/add-product")}
            className="hover:text-ucsd-blue transition-colors"
          >
            Sell
          </button>
        </li>
        <li>
          <button
            onClick={() => (window.location.href = "/student-organizations")}
            className="hover:text-ucsd-blue transition-colors"
          >
            Student Organizations
          </button>
        </li>

        {/* ── Desktop right icons ── */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Saved / Heart */}
          <button
            onClick={() => (window.location.href = "/saved-products")}
            title="Saved"
            className={iconBtn}
          >
            <svg
              className="w-[18px] h-[18px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>

          {/* Cart / Products */}
          <button
            onClick={() => (window.location.href = "/products")}
            title="Products"
            className={iconBtn}
          >
            <svg
              className="w-[18px] h-[18px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </button>

          {/* User avatar / Sign in */}
          {user ? (
            <button
              onClick={signOutFromFirebase}
              title="Sign Out"
              className="w-9 h-9 rounded-full bg-ucsd-blue text-white flex items-center justify-center font-jetbrains font-bold text-sm hover:brightness-90 transition"
            >
<<<<<<< Updated upstream
              {user.displayName?.[0]?.toUpperCase() ?? "U"}
            </button>
=======
              <button
                title="Profile"
                className="w-9 h-9 rounded-full bg-ucsd-blue text-white flex items-center justify-center font-jetbrains font-bold text-sm hover:brightness-90 transition"
              >
                {user.displayName?.[0]?.toUpperCase() ?? "U"}
              </button>
              {isProfileDropdownOpen && (
                <div className="absolute right-0 top-full min-w-[11rem] bg-white text-black shadow-lg rounded-lg py-2 z-[60]">
                  <a
                    href="/profile"
                    className="block w-full text-left px-4 py-2 text-sm font-inter hover:bg-gray-100 transition-colors"
                  >
                    My Profile
                  </a>
                  {studentOrgCanAccess && (
                    <a
                      href="/student-org-profile"
                      className="block w-full text-left px-4 py-2 text-sm font-inter hover:bg-gray-100 transition-colors text-ucsd-blue"
                    >
                      My Organization
                    </a>
                  )}
                  {studentOrgCanAccess && hasStudentOrganization && (
                    <button
                      type="button"
                      disabled={deleteOrgLoading}
                      onClick={() => void handleDeleteStudentOrganization()}
                      className="w-full text-left px-4 py-2 text-sm font-inter hover:bg-red-50 text-red-600 transition-colors disabled:opacity-50"
                    >
                      {deleteOrgLoading ? "Deleting…" : "Delete Organization"}
                    </button>
                  )}
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={signOutFromFirebase}
                    className="w-full text-left px-4 py-2 text-sm font-inter hover:bg-red-50 text-red-600 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
>>>>>>> Stashed changes
          ) : (
            <button
              onClick={openGoogleAuthentication}
              className="font-inter text-sm font-semibold text-ucsd-blue hover:underline px-1"
            >
              Sign In
            </button>
          )}
        </div>

        {/* ── Mobile hamburger ── */}
        <div className="md:hidden relative">
          <button
            ref={buttonRef}
            className="w-9 h-9 flex items-center justify-center rounded hover:bg-gray-100 transition text-gray-600"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <FontAwesomeIcon className="text-xl" icon={isMobileMenuOpen ? faXmark : faBars} />
          </button>

          <ul
            ref={menuRef}
            className={`absolute top-11 right-0 bg-white border border-gray-100 shadow-lg rounded-xl w-52 p-3 text-sm font-inter font-medium text-gray-700
              transition-all duration-200 ${isMobileMenuOpen ? "block" : "hidden"}`}
          >
            <li className="mb-1">
              <button
                onClick={() => (window.location.href = "/marketplace")}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-ucsd-blue font-semibold transition"
              >
                Shop
              </button>
            </li>
            <li className="mb-1">
              <button
                onClick={() => (window.location.href = "/add-product")}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Sell
              </button>
            </li>
            <li className="mb-1">
              <button
                onClick={() => (window.location.href = "/student-organizations")}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Student Organizations
              </button>
            </li>
            <li className="mb-1">
              <button
                onClick={() => (window.location.href = "/saved-products")}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Saved
              </button>
            </li>
            <li className="mb-1">
              <button
                onClick={() => (window.location.href = "/products")}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Products
              </button>
            </li>
            {user && (
              <>
                <li className="mb-1 border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/profile");
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition"
                  >
                    My Profile
                  </button>
                </li>
                {studentOrgCanAccess && (
                  <li className="mb-1">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate("/student-org-profile");
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition text-ucsd-blue font-semibold"
                    >
                      My Organization
                    </button>
                  </li>
                )}
                {studentOrgCanAccess && hasStudentOrganization && (
                  <li className="mb-1">
                    <button
                      type="button"
                      disabled={deleteOrgLoading}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        void handleDeleteStudentOrganization();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 transition text-red-600 disabled:opacity-50"
                    >
                      {deleteOrgLoading ? "Deleting…" : "Delete Organization"}
                    </button>
                  </li>
                )}
              </>
            )}
            <li className="border-t border-gray-100 mt-1 pt-1">
              {user ? (
                <button
                  onClick={signOutFromFirebase}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition text-red-500"
                >
                  Sign Out
>>>>>>> upstream/dev
                </button>
                <button
<<<<<<< HEAD
                  hidden={user === null}
                  onClick={() => (window.location.href = "/add-product")}
                  className="font-inter text-sm text-gray-400 hover:text-gray-700 transition-colors"
                >
                  Sell
=======
                  onClick={openGoogleAuthentication}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition text-ucsd-blue font-semibold"
                >
                  Sign In
>>>>>>> upstream/dev
                </button>
                <div className="relative" ref={dropdownRef}>
                  <button
                    hidden={user === null}
                    onClick={() => setStudentOrgDropdownOpen(!isStudentOrgDropdownOpen)}
                    className="font-inter text-sm text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-2"
                  >
                    Student Organizations
                    <FontAwesomeIcon className="text-xs" icon={faChevronDown} aria-label="Dropdown" />
                  </button>
                  {isStudentOrgDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 bg-white text-gray-800 rounded-xl shadow-lg border border-gray-200 min-w-[220px] overflow-hidden z-50">
                      {canAccessMyOrganization && (
                        <button
                          onClick={() => {
                            window.location.href = "/student-org-profile";
                            setStudentOrgDropdownOpen(false);
                          }}
                          className="font-inter w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3"
                        >
                          <FontAwesomeIcon className="text-sm text-gray-600" icon={faUsers} />
                          My Organization
                        </button>
                      )}
                      <button
                        onClick={() => {
                          window.location.href = "/student-organizations";
                          setStudentOrgDropdownOpen(false);
                        }}
                        className="font-inter w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <FontAwesomeIcon className="text-sm text-gray-600" icon={faStore} />
                        Browse Organizations
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right icons (desktop) */}
              <div className="hidden md:flex items-center gap-3">
                <button
                  hidden={user === null}
                  onClick={() => (window.location.href = "/saved-products")}
                  className="w-9 h-9 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center text-gray-700"
                  aria-label="Saved products"
                >
                  <FontAwesomeIcon icon={faHeart} />
                </button>
                <button
                  hidden={user === null}
                  onClick={() => {}}
                  className="w-9 h-9 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center text-gray-700"
                  aria-label="Search"
                >
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                </button>
                <button
                  hidden={user === null}
                  onClick={() => (window.location.href = "/products")}
                  className="w-9 h-9 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center text-gray-700"
                  aria-label="Cart"
                >
                  <FontAwesomeIcon icon={faCartShopping} />
                </button>

                {user ? (
                  <button
                    onClick={signOutFromFirebase}
                    className="w-9 h-9 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center text-gray-700"
                    aria-label="Sign out"
                  >
                    <FontAwesomeIcon icon={faUser} />
                  </button>
                ) : (
                  <button
                    onClick={openGoogleAuthentication}
                    className="px-4 h-9 rounded-full bg-figma-teal text-white font-inter text-sm hover:brightness-95 transition-all"
                    aria-label="Sign in"
                  >
                    Sign in
                  </button>
                )}
              </div>

              {/* Mobile */}
              <div className="md:hidden relative">
                <button
                  ref={buttonRef}
                  className="w-10 h-10 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center text-gray-700"
                  onClick={toggleMobileMenu}
                  aria-label="Toggle mobile menu"
                >
                  <FontAwesomeIcon className="text-lg" icon={isMobileMenuOpen ? faXmark : faBars} />
                </button>
                <ul
                  ref={menuRef}
                  className={`absolute top-12 right-0 bg-white text-gray-800 text-sm shadow-lg rounded-xl w-56 p-2 border border-gray-200 ${
                    isMobileMenuOpen ? "block" : "hidden"
                  }`}
                >
                  <li>
                    <button
                      hidden={user === null}
                      onClick={() => {
                        window.location.href = "/products";
                        setMobileMenuOpen(false);
                      }}
                      className="font-inter w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <FontAwesomeIcon className="text-gray-600" icon={faCartShopping} />
                      Shop
                    </button>
                  </li>
                  <li>
                    <button
                      hidden={user === null}
                      onClick={() => {
                        window.location.href = "/add-product";
                        setMobileMenuOpen(false);
                      }}
                      className="font-inter w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <FontAwesomeIcon className="text-gray-600" icon={faStore} />
                      Sell
                    </button>
                  </li>
                  <li>
                    <button
                      hidden={user === null}
                      onClick={() => {
                        window.location.href = "/saved-products";
                        setMobileMenuOpen(false);
                      }}
                      className="font-inter w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <FontAwesomeIcon className="text-gray-600" icon={faHeart} />
                      Saved
                    </button>
                  </li>
                  <li>
                    <button
                      hidden={user === null}
                      onClick={() => {
                        window.location.href = "/student-organizations";
                        setMobileMenuOpen(false);
                      }}
                      className="font-inter w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <FontAwesomeIcon className="text-gray-600" icon={faUsers} />
                      Student Organizations
                    </button>
                  </li>
                  {canAccessMyOrganization && (
                    <li>
                      <button
                        hidden={user === null}
                        onClick={() => {
                          window.location.href = "/student-org-profile";
                          setMobileMenuOpen(false);
                        }}
                        className="font-inter w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <FontAwesomeIcon className="text-gray-600" icon={faUsers} />
                        My Organization
                      </button>
                    </li>
                  )}
                  <li className="pt-1 border-t border-gray-100 mt-1">
                    {user ? (
                      <button
                        onClick={(e) => {
                          signOutFromFirebase(e);
                          setMobileMenuOpen(false);
                        }}
                        className="font-inter w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <FontAwesomeIcon className="text-gray-600" icon={faUser} />
                        Sign out
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          openGoogleAuthentication(e);
                          setMobileMenuOpen(false);
                        }}
                        className="font-inter w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <FontAwesomeIcon className="text-gray-600" icon={faUser} />
                        Sign in
                      </button>
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <button
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 cursor-default"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
