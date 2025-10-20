import React, { useState } from "react";
import { 
    FaCreativeCommonsBy, FaHome, FaCartPlus, 
    FaSignInAlt, FaUserPlus, FaSignOutAlt 
} from "react-icons/fa";
import { WiStars } from "react-icons/wi";

// Removed import for FaCaretDown

// NOTE: CategoriesBar and categories imports are removed/commented out
// since the category feature is being removed.
// import CategoriesBar from "../Components/CategoriesBar.jsx"; 
// import categories from "../Data/categories_data.jsx";

import SignInDialog from "../Essentaial/SignInDialog .jsx";

export default function Navbar({ handleProfile, isLoggedIn, handleLogin, handleLogout }) {
    const [isOpen, setIsOpen] = useState(false);
    // REMOVED: const [showCategory, setShowCategory] = useState(false);
    
    // State to control the visibility and initial tab of the Auth dialog
    const [showAuthDialog, setShowAuthDialog] = useState(null);

    // Function to handle successful authentication from the dialog
    const handleAuthSuccess = () => {
        setShowAuthDialog(null);
        if (handleLogin) {
            handleLogin(); 
        }
    }

    // REMOVED: toggleCategories function

    // Handler for Home button click (now only needs to ensure profile is hidden)
    const handleHomeClick = () => {
        if (handleProfile) handleProfile(false); 
        // REMOVED: setShowCategory(false);
        setIsOpen(false);
    }
    
    // Handler for Profile button click
    const handleProfileClick = () => {
        if (isLoggedIn && handleProfile) {
            handleProfile(true); 
            setIsOpen(false); 
        }
    }

    // Opens the SignInDialog with the 'signup' tab active
    const handleSignUp = () => {
        setShowAuthDialog('signup');
        setIsOpen(false);
    }
    
    // Opens the SignInDialog with the 'signin' tab active
    const handleOpenLogin = () => {
        setShowAuthDialog('signin');
        setIsOpen(false);
    }

    return (
        <nav className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between shadow-md relative z-50">
            <div className="text-2xl font-normal">Talk2Shop</div>

            {/* Desktop Menu */}
            <ul className="hidden md:flex space-x-8 items-center">
                <li>
                    <button className="flex items-center gap-2 hover:text-blue-400 transition text-xl" onClick={handleHomeClick}>
                        <FaHome className="w-4 h-4" />
                        Home
                    </button>
                </li>
                
                {/* REMOVED: Categories Link */}
                
                {/* Conditional Links: Logged In vs. Logged Out */}
                {isLoggedIn ? (
                    <>
                        {/* Logged In: AI and Cart */}
                        <li>
                            <button className="flex items-center gap-2 hover:text-blue-400 transition text-xl">
                                <WiStars className="w-8 h-8" />
                                AI
                            </button>
                        </li>
                        <li>
                            <button className="flex items-center gap-2 hover:text-blue-400 transition text-xl">
                                <FaCartPlus className="w-4 h-4" />
                                Cart
                            </button>
                        </li>
                        {/* Profile and Logout */}
                        <li>
                            <div className="flex space-x-4">
                                <button className="flex items-center gap-2 hover:text-blue-400 transition text-xl" onClick={handleProfileClick}>
                                    <FaCreativeCommonsBy className="w-6 h-6" />
                                    Profile
                                </button>
                                <button className="flex items-center gap-2 text-red-400 hover:text-red-500 transition text-xl" onClick={handleLogout}>
                                    <FaSignOutAlt className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        </li>
                    </>
                ) : (
                    // Logged Out: Login/Sign Up buttons
                    <li>
                        <div className="flex space-x-4">
                            <button className="flex items-center gap-2 hover:text-blue-400 transition text-xl" onClick={handleOpenLogin}>
                                <FaSignInAlt className="w-4 h-4" />
                                Login
                            </button>
                            <button className="flex items-center gap-2 hover:text-blue-400 transition text-xl" onClick={handleSignUp}>
                                <FaUserPlus className="w-4 h-4" />
                                Sign Up
                            </button>
                        </div>
                    </li>
                )}
            </ul>
            
            {/* Mobile Menu Button (Hamburger) */}
            <button
                className="md:hidden focus:outline-none"
                onClick={() => { setIsOpen(!isOpen); /* REMOVED: setShowCategory(false); */ }}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
            </button>

            {/* Mobile Menu Content */}
            {isOpen && (
                <ul className="absolute top-16 left-0 w-full bg-stone-800 flex flex-col items-center space-y-4 py-6 md:hidden z-40">
                    <li>
                        <button className="flex items-center gap-2 hover:text-blue-400 transition" onClick={handleHomeClick}>
                            <FaHome className="w-6 h-6" />
                            Home
                        </button>
                    </li>
                    
                    {/* REMOVED: Mobile Categories Link */}
                    
                    {/* Mobile: AI and Cart Links (Only visible if logged in) */}
                    {isLoggedIn && (
                        <>
                            <li>
                                <button className="flex items-center gap-2 hover:text-blue-400 transition" onClick={() => setIsOpen(false)}>
                                    <WiStars className="w-6 h-6" />
                                    AI
                                </button>
                            </li>
                            <li>
                                <button className="flex items-center gap-2 hover:text-blue-400 transition" onClick={() => setIsOpen(false)}>
                                    <FaCartPlus className="w-6 h-6" />
                                    Cart
                                </button>
                            </li>
                        </>
                    )}
                    
                    <hr className="w-1/2 border-stone-700 my-2" /> 

                    {/* Conditional Mobile Login/Profile/Logout */}
                    {isLoggedIn ? (
                        <>
                            <li>
                                <button className="flex items-center gap-2 hover:text-blue-400 transition" onClick={handleProfileClick}>
                                    <FaCreativeCommonsBy className="w-6 h-6" />
                                    Profile
                                </button>
                            </li>
                            <li>
                                <button className="flex items-center gap-2 text-red-400 hover:text-red-500 transition" onClick={handleLogout}>
                                    <FaSignOutAlt className="w-6 h-6" />
                                    Logout
                                </button>
                            </li>
                        </>
                    ) : (
                        // Pre-Login Links
                        <>
                            <li>
                                <button className="flex items-center gap-2 hover:text-blue-400 transition" onClick={handleOpenLogin}>
                                    <FaSignInAlt className="w-6 h-6" />
                                    Login
                                </button>
                            </li>
                            <li>
                                <button className="flex items-center gap-2 hover:text-blue-400 transition" onClick={handleSignUp}>
                                    <FaUserPlus className="w-6 h-6" />
                                    Sign Up
                                </button>
                            </li>
                        </>
                    )}
                </ul>
            )}

            {/* REMOVED: Categories Bar conditional rendering */}
            
            {/* RENDER THE SIGN IN / SIGN UP DIALOG */}
            {showAuthDialog && (
                <SignInDialog
                    onClose={() => setShowAuthDialog(null)}
                    onSuccess={handleAuthSuccess}
                    initialTab={showAuthDialog}
                />
            )}
        </nav>
    );
}