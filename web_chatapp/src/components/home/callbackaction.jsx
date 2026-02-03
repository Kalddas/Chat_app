import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

const CallToAction = () => {
    const { t } = useTranslation();
    return (
        <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full"></div>
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/5 rounded-full"></div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium backdrop-blur-sm mb-6">
                        <Sparkles className="w-4 h-4 mr-2" />
                        {t("home.ctaBadge")}
                    </div>

                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                        {t("home.ctaTitle")}
                    </h2>

                    <p className="text-indigo-100 text-lg max-w-2xl mx-auto mb-8">
                        {t("home.ctaSubtitle")}
                    </p>

                    <Button
                        size="lg"
                        className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-3 text-base font-semibold rounded-full shadow-lg shadow-indigo-900/30 hover:shadow-indigo-900/40 transition-all duration-300 group"
                    >
                        <Link to='/register' className="flex items-center">
                            {t("home.ctaButton")}
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                </motion.div>
            </div>
        </section>
    );
};

export default CallToAction;