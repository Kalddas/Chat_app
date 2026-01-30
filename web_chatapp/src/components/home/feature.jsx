import { MessageSquare, Users, Settings, Zap, BarChart3, HeadphonesIcon } from "lucide-react";
import { motion } from "framer-motion";

const Features = () => {
    const features = [
        {
            icon: Users,
            title: "Smart matching",
            description: "Our advanced algorithm connects you with people who share your genuine interests and values."
        },
        {
            icon: MessageSquare,
            title: "Live guided discussions",
            description: "Join structured conversations led by community experts to deepen your connections."
        },
        {
            icon: Settings,
            title: "Easy Customization",
            description: "Personalize your profile and preferences to find exactly the right community for you."
        },
        {
            icon: Zap,
            title: "Seamless Messaging",
            description: "Connect instantly with built-in messaging that keeps conversations flowing naturally."
        },
        {
            icon: BarChart3,
            title: "Best Dashboard",
            description: "Track your connections, interests, and community engagement with comprehensive insights."
        },
        {
            icon: HeadphonesIcon,
            title: "Fast Support",
            description: "Get help when you need it with our responsive customer support team."
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
                        Features for a better experience
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-lg text-indigo-700 max-w-2xl mx-auto"
                    >
                        Discover all the tools you need to build meaningful connections with people who share your passions.
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
                                    {feature.title}
                                </h3>
                                <p className="text-indigo-700">
                                    {feature.description}
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