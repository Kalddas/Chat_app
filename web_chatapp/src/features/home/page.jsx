import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import Header from "../../components/home/header";
import Hero from "../../components/home/hero";
import CallToAction from "../../components/home/callbackaction";
import Features from "../../components/home/feature";
import Footer from "../../components/home/footer";

const Home = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            alert("Thank you for your interest! We'll notify you when ChatApp launches.");
            setEmail("");
        }, 1000);
    };

    const features = [
        {
            title: "Smart Matching",
            description: "Our algorithm connects you with people who share your passions from your favorite communities.",
            icon: "🧠",
        },
        {
            title: "Cross-Platform",
            description: "Seamlessly switch between devices - your conversations sync across iOS, Android, and Web.",
            icon: "📱",
        },
        {
            title: "End-to-End Encryption",
            description: "Your private conversations stay private with advanced encryption technology.",
            icon: "🔒",
        },
        {
            title: "Real-Time Interaction",
            description: "Experience live typing indicators, read receipts, and instant message delivery.",
            icon: "⚡",
        },
        {
            title: "Fully Customizable",
            description: "Personalize your chat experience with themes and notification preferences.",
            icon: "🎨",
        },
        {
            title: "Your Control",
            description: "Manage your privacy with controls over who can find you and see your activity.",
            icon: "🛡️",
        },
    ];

    return (
        <div>
            <Header />
            <Hero />
            <Features />
            <CallToAction />
            <Footer />
        </div>
    );
};

export default Home;