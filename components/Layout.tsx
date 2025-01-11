import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/services/api';
import { supabase } from '@/lib/supabase';
import { User, UserCircle, LogOut, ChevronDown, LayoutDashboard } from 'lucide-react';
/*
*   Starting Layout Component Wrapper, used to wrap all pages that requires a LOGO + NAVIGATION + SIGN IN/OUT + FOOTER
*/
const Layout = ({ children }) => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        // Check if user is logged in
        const checkUser = async () => {
            const session = await supabase.auth.getSession();
            setUser(session?.data?.session?.user || null);
        };

        checkUser();

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        return () => subscription?.unsubscribe();
    }, []);

    const handleSignOut = async () => {
        try {
            await auth.logout();
            router.push('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const UserMenu = () => {
        const closeTimeout = React.useRef(null);

        const handleMouseEnter = () => {
            if (closeTimeout.current) {
                clearTimeout(closeTimeout.current);
            }
            setIsDropdownOpen(true);
        };

        const handleMouseLeave = () => {
            closeTimeout.current = setTimeout(() => {
                setIsDropdownOpen(false);
            }, 300);
        };

        return (
            <div
                className="relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{user?.email?.split('@')[0]}</span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                </button>

                {isDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                        <div className="py-1" role="menu" aria-orientation="vertical">
                            <div className="px-4 py-2 text-sm text-gray-600 border-b">
                                {user?.email}
                            </div>

                            <Link
                                href="/profile"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                Profile Settings
                            </Link>

                            <button
                                onClick={handleSignOut}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };
    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdownOpen && !event.target.closest('.relative')) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isDropdownOpen]);

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo/Home link */}
                        <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-gray-700">
                            CadenceNotes
                        </Link>

                        {/* Navigation */}
                        <nav className="flex items-center space-x-4">
                            {user ? (
                                <>
                                    <Link
                                        href="/dashboard"
                                        className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                                    >
                                        <LayoutDashboard className="h-4 w-4" />
                                        Dashboard
                                    </Link>
                                    <UserMenu />
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href="/signup"
                                        className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        Sign up
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-grow bg-gray-50">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-500 text-sm">
                            © 2025 CadenceNotes. All rights reserved.
                        </p>
                        <div className="flex space-x-6">
                            <a href="#" className="text-gray-500 hover:text-gray-900 text-sm">
                                Privacy Policy
                            </a>
                            <a href="#" className="text-gray-500 hover:text-gray-900 text-sm">
                                Terms of Service
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;