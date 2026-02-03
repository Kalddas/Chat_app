import { MessageSquare, Users, Settings, Zap, BarChart3, HeadphonesIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const Features = () => {
    const { t } = useTranslation();
    const features = [
        {
            icon: Users,
            titleKey: "home.features.smartMatchingTitle",
            descKey: "home.features.smartMatchingDesc",
        },
        {
            icon: MessageSquare,
            titleKey: "home.features.liveDiscussionsTitle",
            descKey: "home.features.liveDiscussionsDesc",
        },
        {
            icon: Settings,
            titleKey: "home.features.easyCustomizationTitle",
            descKey: "home.features.easyCustomizationDesc",
        },
        {
            icon: Zap,
            titleKey: "home.features.seamlessMessagingTitle",
            descKey: "home.features.seamlessMessagingDesc",
        },
        {
            icon: BarChart3,
            titleKey: "home.features.bestDashboardTitle",
            descKey: "home.features.bestDashboardDesc",
        },
        {
            icon: HeadphonesIcon,
            titleKey: "home.features.fastSupportTitle",
            descKey: "home.features.fastSupportDesc",
        }
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <section id="features" className="py-20 bg-gradient-to-b from-white to-indigo-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl lg:text-4xl font-bold text-indigo-900 mb-4"
                    >
                        {t("home.featuresTitle")}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-lg text-indigo-700 max-w-2xl mx-auto"
                    >
                        {t("home.featuresSubtitle")}
                    </motion.p>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {features.map((feature, index) => {
                        const IconComponent = feature.icon;
                        return (
                            <motion.div
                                key={index}
                                variants={item}
                                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-indigo-100 hover:border-indigo-200 group"
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <IconComponent className="w-7 h-7 text-indigo-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-indigo-900 mb-2">
                                    {t(feature.titleKey)}
                                </h3>
                                <p className="text-indigo-700">
                                    {t(feature.descKey)}
                                </p>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
};

export default Features;