import { Facebook, Instagram, Twitter, Heart, MessageCircle } from "lucide-react";

const Footer = () => {
    return (
        <footer id="footer" className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Logo and Description */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <MessageCircle className="h-8 w-8 text-indigo-300" />
                            <h3 className="text-xl font-semibold text-white">LiveFlow</h3>
                        </div>
                        <p className="text-sm text-indigo-200">
                            Connect with like-minded people through shared passions and interests. Build meaningful relationships that last.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Quick Links</h4>
                        <ul className="space-y-2 text-sm text-indigo-200">
                            <li><a href="#" className="hover:text-indigo-100 transition-colors">Home</a></li>
                            <li><a href="#features" className="hover:text-indigo-100 transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-indigo-100 transition-colors">Testimonials</a></li>
                            <li><a href="#footer" className="hover:text-indigo-100 transition-colors">Contact</a></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Support</h4>
                        <ul className="space-y-2 text-sm text-indigo-200">
                            <li><a href="#" className="hover:text-indigo-100 transition-colors">Help Center</a></li>
                            <li><a href="#" className="hover:text-indigo-100 transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-indigo-100 transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-indigo-100 transition-colors">Contact Support</a></li>
                            <li>
                                <a href="mailto:admin@liveflow.com" className="hover:text-indigo-100 transition-colors">
                                    admin@liveflow.com
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Social */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Follow Us</h4>
                        <div className="flex space-x-4">
                            <a href="#" className="w-10 h-10 bg-indigo-800 hover:bg-indigo-700 rounded-full flex items-center justify-center transition-colors">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 bg-indigo-800 hover:bg-indigo-700 rounded-full flex items-center justify-center transition-colors">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 bg-indigo-800 hover:bg-indigo-700 rounded-full flex items-center justify-center transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-indigo-800 text-center flex flex-col md:flex-row justify-between items-center">
                    <p className="text-sm text-indigo-400">
                        © 2024 LiveFlow. All rights reserved.
                    </p>
                    <div className="flex items-center mt-4 md:mt-0 text-sm text-indigo-400">
                        
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;