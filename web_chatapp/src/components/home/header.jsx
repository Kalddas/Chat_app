import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MessageCircle, Menu, X } from "lucide-react";
import { useState } from "react";

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full px-4 border-b border-amber-200 bg-amber-50/95 backdrop-blur supports-[backdrop-filter]:bg-amber-50/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex-row flex items-center gap-2">
                        <div className="relative">
                            <MessageCircle className="h-8 w-8 text-indigo-600" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full"></div>
                        </div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">LiveFlow</h1>
                    </div>

                    {/* Navigation - Desktop */}
                    <nav className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-8">
                            <a href="#" className="text-indigo-900 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors">
                                Home
                            </a>
                            <a href="#features" className="text-indigo-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors">
                                Features
                            </a>
                            <a href="#footer" className="text-indigo-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors">
                                Contact
                            </a>
                        </div>
                    </nav>

                    {/* Sign Up Button */}
                    <div className="hidden md:flex items-center">
                        <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2 rounded-full text-sm font-medium shadow-md shadow-indigo-500/20 hover:shadow-indigo-600/30 transition-all">
                            <Link to="/register">
                                Sign Up
                            </Link>
                        </Button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-indigo-700 hover:text-indigo-600"
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 border-t border-indigo-100">
                        <div className="flex flex-col space-y-3">
                            <a href="#" className="text-indigo-900 hover:text-indigo-600 px-3 py-2 text-sm font-medium">
                                Home
                            </a>
                            <a href="#features" className="text-indigo-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium">
                                Features
                            </a>
                            <a href="#footer" className="text-indigo-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium">
                                Contact
                            </a>
                            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium mt-2">
                                <Link to="/register" className="w-full text-center">
                                    Sign Up
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;