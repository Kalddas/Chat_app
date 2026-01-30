import { Button } from "@/components/ui/button";
import { hero } from "../Assets/assets";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Users, MessageCircle, ArrowRight } from "lucide-react";

const Hero = () => {
    return (
        <section className="relative bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] py-16 lg:py-24 overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left Column - Content */}
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-6"
                        >
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-white text-sm font-medium backdrop-blur-sm">
                                <Sparkles className="w-4 h-4 mr-1" />
                                Connect through shared passions
                            </div>

                            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
                                Build Meaningful
                                <br />
                                <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                                    Connections
                                </span>
                            </h1>
                            <p className="text-lg text-indigo-200 max-w-xl">
                                Discover like-minded individuals who share your interests and build meaningful connections that last. Join our community of passionate people ready to explore new horizons together.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="flex flex-col sm:flex-row items-start sm:items-center gap-6"
                        >
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 text-base font-semibold rounded-full shadow-lg shadow-indigo-500/30 hover:shadow-indigo-600/40 transition-all duration-300 group"
                            >
                                <Link to='/register' className="flex items-center">
                                    Get Started
                                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                            <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2">
                                <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-full">
                                    <Users className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-white">2.3M+</div>
                                    <div className="text-sm text-indigo-200">Active Users</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column - Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7 }}
                        className="relative"
                    >
                        <div className="relative w-full max-w-md mx-auto">
                            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl rotate-3 blur-xl opacity-30"></div>
                            <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-2 shadow-2xl shadow-indigo-500/10 border border-white/10">
                                <img
                                    src={hero}
                                    alt="People collaborating and connecting"
                                    className="w-full h-full object-cover rounded-2xl"
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Hero;