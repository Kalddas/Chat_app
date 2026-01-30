// File: src/pages/Register.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useRegisterMutation,
  useGetTagsQuery,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useGetMatchesQuery,
} from "../../services/authService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, CheckCircle, MessageCircle, Sparkles, ArrowLeft, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "react-toastify";
import { useSendChatRequestMutation } from "../../services/chatService"
import { useAuth } from "../../contexts/AuthContext";

export default function RegisterPage() {
  const [step, setStep] = useState("info");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    bio: "",
  });
  const [selectedTags, setSelectedTags] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(600);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const [sendChatRequest] = useSendChatRequestMutation()

  // Pagination states
  const [currentTagPage, setCurrentTagPage] = useState(1);
  const [currentMatchPage, setCurrentMatchPage] = useState(1);
  const itemsPerPage = 8;

  // API hooks
  const { data: tagsData } = useGetTagsQuery();
  const [register, { isLoading: isRegistering }] = useRegisterMutation();
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();
  const { data: matchesData, isLoading: isLoadingMatches } = useGetMatchesQuery(1, {
    skip: step !== "success",
  });
  const tags = tagsData?.data || [];

  const [sentRequests, setSentRequests] = useState([])

  // Calculate paginated tags
  const totalTagPages = Math.ceil(tags.length / itemsPerPage);
  const startTagIndex = (currentTagPage - 1) * itemsPerPage;
  const paginatedTags = tags.slice(startTagIndex, startTagIndex + itemsPerPage);

  // Calculate paginated matches
  const matches = matchesData?.data || [];
  const totalMatchPages = Math.ceil(matches.length / itemsPerPage);
  const startMatchIndex = (currentMatchPage - 1) * itemsPerPage;
  const paginatedMatches = matches.slice(startMatchIndex, startMatchIndex + itemsPerPage);

  const handleSendRequest = async (userId) => {
    try {
      await sendChatRequest({
        receiver_id: userId, // Backend uses authenticated user as sender
      }).unwrap()
      setSentRequests([...sentRequests, userId])
      toast.success("Connection request sent successfully!");
    } catch (err) {
      console.error("Failed to send request:", err)
      const backendMessage =
        err?.data?.message ||
        err?.data?.error ||
        "Failed to send connection request";
      toast.error(backendMessage);
    }
  }

  // OTP timer
  useEffect(() => {
    if (step === "otp" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, step]);

  // Handlers
  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleTagToggle = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all required fields");
      toast.error("Please fill in all required fields");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      toast.error("Passwords do not match");
      return;
    }
    setError("");
    setStep("interests");
  };

  const handleBack = () => {
    setStep("info");
  };

  // FIXED: Pagination handlers that prevent form submission
  const handleNextTagPage = (e) => {
    if (e) e.preventDefault();
    setCurrentTagPage(prev => Math.min(prev + 1, totalTagPages));
  };

  const handlePrevTagPage = (e) => {
    if (e) e.preventDefault();
    setCurrentTagPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextMatchPage = (e) => {
    if (e) e.preventDefault();
    setCurrentMatchPage(prev => Math.min(prev + 1, totalMatchPages));
  };

  const handlePrevMatchPage = (e) => {
    if (e) e.preventDefault();
    setCurrentMatchPage(prev => Math.max(prev - 1, 1));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await register({
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
        first_name: formData.firstName,
        last_name: formData.lastName,
        user_name: formData.username,
        phone: formData.phone,
        bio: formData.bio || "",
        tags: selectedTags,
      }).unwrap();
      setStep("otp");
      setTimeLeft(600);
      toast.success("Registration successful! Check your email for OTP.");
    }
    catch (err) {
      if (err?.data?.errors) {
        const errors = err.data.errors;

        if (errors.phone) {
          console.error("Phone error:", errors.phone[0]);
          toast.error(errors.phone[0]);
        }
        if (errors.tags) {
          console.error("Tags error:", errors.tags[0]);
          toast.error(errors.tags[0]);
        }
      } else {
        console.error("Unexpected error:", err);
        setError(err.data?.message || "Registration failed");
        toast.error(err.data?.message || "Registration failed");
      }
    }
  };

  const handleOtpChange = (i, val) => {
    if (val.length > 1) return;
    const newOtp = [...otp];
    newOtp[i] = val;
    setOtp(newOtp);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleOtpSubmit = async () => {
    try {
      const otpString = otp.join("");
      const data = await verifyOtp({ email: formData.email, otp: otpString }).unwrap();

      localStorage.setItem("token", data.token);
      setStep("success");
      toast.success("Account verified successfully!");

      const from = data.user.role === "admin" ? "/admin" : "/chat";
      navigate(from, { replace: true });

      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (err) {
      setError(err.data?.message || "OTP verification failed");
      toast.error(err.data?.message || "OTP verification failed");
    }
  };

  const handleResendOtp = async () => {
    try {
      await resendOtp(formData.email).unwrap();
      setTimeLeft(600);
      toast.info("OTP has been resent to your email");
    } catch (err) {
      setError(err.data?.message || "Failed to resend OTP");
      toast.error(err.data?.message || "Failed to resend OTP");
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-card p-6 rounded-2xl ">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 ">
            <div className="relative">
              <MessageCircle className="h-8 w-8 text-indigo-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full"></div>
            </div>
            <h1 className="text-3xl font-bold text-gradient">
              Live Flow
            </h1>
          </div>
        </div>

        {(step === "info" || step === "interests") && (
          <>
            <Card className="border-0 rounded-2xl overflow-hidden shadow-none">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl text-card-foreground">Sign Up</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {step === "info" ? "Enter your details" : "Choose at least one interest"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={step === "info" ? handleNext : handleRegister} className="space-y-4">
                  {step === "info" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          name="firstName"
                          placeholder="First Name"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          className="rounded-lg border-border focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <Input
                          name="lastName"
                          placeholder="Last Name"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          className="rounded-lg border-border focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <Input
                        name="username"
                        placeholder="User name"
                        value={formData.username}
                        onChange={handleInputChange}
                        required
                        autoComplete="username"
                        className="rounded-lg border-border focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <Input
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        autoComplete="email"
                        className="rounded-lg border-border focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <Input
                        name="phone"
                        placeholder="Phone Number"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="rounded-lg border-border focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <Input
                        name="bio"
                        placeholder="Bio (Optional)"
                        value={formData.bio}
                        onChange={handleInputChange}
                        autoComplete="additional-name"
                        className="rounded-lg border-border focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <div className="relative">
                        <Input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                          autoComplete="new-password"
                          className="rounded-lg border-border focus:border-indigo-500 focus:ring-indigo-500 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </Button>
                      </div>
                      <div className="relative">
                        <Input
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm Password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          required
                          autoComplete="new-password"
                          className="rounded-lg border-border focus:border-indigo-500 focus:ring-indigo-500 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </Button>
                      </div>
                    </>
                  )}

                  {step === "interests" && (
                    <div>
                      <div className="grid grid-cols-2 gap-3">
                        {paginatedTags.map((tag) => (
                          <div
                            key={tag.id}
                            className={`flex items-center space-x-2 rounded-lg p-3 border transition-all ${selectedTags.includes(tag.id)
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-border hover:border-indigo-300"
                              }`}
                          >
                            <Checkbox
                              id={`tag-${tag.id}`}
                              checked={selectedTags.includes(tag.id)}
                              onCheckedChange={() => handleTagToggle(tag.id)}
                              className="border-border rounded-sm bg-white dark:bg-card data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                            />
                            <Label
                              htmlFor={`tag-${tag.id}`}
                              className="text-sm font-medium cursor-pointer flex-1"
                            >
                              {tag.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {error && (
                    <Alert variant="destructive" className="rounded-lg">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-between items-center">
                    {step === "interests" && (
                      <button
                        type="button"
                        onClick={handleBack}
                        className="cursor-pointer flex items-center gap-1 bg-gradient-indigo-purple text-white px-3 py-2 rounded-sm text-sm hover:opacity-90 transition-opacity"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </button>
                    )}

                    <button
                      type="submit"
                      className="cursor-pointer flex items-center gap-1 bg-gradient-indigo-purple text-white px-4 py-2 rounded-sm hover:opacity-90 transition-opacity"
                    >
                      {step === "info" ? (
                        "Next"
                      ) : isRegistering ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4 mr-1" />
                          Registering...
                        </>
                      ) : (
                        "Register"
                      )}
                    </button>
                  </div>
                </form>

                {step === "interests" && totalTagPages > 1 && (
                  <div className="flex justify-center items-center mt-4 space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevTagPage}
                      disabled={currentTagPage === 1}
                      className="h-8 w-8 p-0 border-indigo-600 bg-white dark:bg-card hover:bg-indigo-50 dark:hover:bg-accent"
                    >
                      <ChevronLeft className="h-4 w-4 text-indigo-600" />
                    </Button>

                    <span className="text-sm text-muted-foreground">
                      Page {currentTagPage} of {totalTagPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextTagPage}
                      disabled={currentTagPage === totalTagPages}
                      className="h-8 w-8 p-0 border-indigo-600 bg-white dark:bg-card hover:bg-indigo-50 dark:hover:bg-accent"
                    >
                      <ChevronRight className="h-4 w-4 text-indigo-600" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline transition-colors"
                >
                  Login
                </Link>
              </p>
            </div>
          </>
        )}

        {/* OTP Step */}
        {step === "otp" && (
          <Card className=" border-0 rounded-2xl overflow-hidden">
            {/* <div className="bg-gradient-indigo-purple h-2 w-full"></div> */}
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl text-card-foreground">Enter OTP</CardTitle>
              <CardDescription className="text-muted-foreground">
                We've sent a 6-digit code to {formData.email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center gap-3 mb-6">
                {otp.map((digit, idx) => (
                  <Input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-14 h-14 text-center text-xl font-semibold rounded-lg border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                ))}
              </div>
              {error && (
                <Alert variant="destructive" className="rounded-lg mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button
                onClick={handleOtpSubmit}
                className="w-full py-5 rounded-lg bg-gradient-indigo-purple hover:bg-gradient-indigo-purple-dark text-[#3b82f6] font-medium dark:text-[#3b82f6] shadow-md hover:shadow-lg transition-all duration-200 mb-3"
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Verifying...
                  </>
                ) : (
                  "Verify OTP"
                )}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Time left: {formatTime(timeLeft)}{" "}
                <Button
                  variant="link"
                  onClick={handleResendOtp}
                  disabled={isResending || timeLeft > 540}
                  className="text-indigo-600 hover:text-indigo-800 p-0 ml-1 h-auto"
                >
                  {isResending ? "Resending..." : "Resend"}
                </Button>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Success Step */}
        {step === "success" && (
          <Dialog open >
            <DialogContent className="sm:max-w-md rounded-2xl bg-white dark:bg-card">
              <DialogHeader>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <DialogTitle className="text-center text-2xl text-foreground">
                  Welcome to the Community!
                </DialogTitle>
                <DialogDescription className="text-center text-muted-foreground">
                  Your account has been successfully verified!
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <h3 className="font-medium text-sm text-muted-foreground mb-3">
                  People you might want to connect with:
                </h3>
                {isLoadingMatches ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {paginatedMatches.map((match) => {
                        const isRequestSent = sentRequests.includes(match.user.id);

                        return (
                          <div
                            key={match.id}
                            className="flex items-center p-3 border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-sm bg-indigo-200 text-indigo-700">
                                  {match.user.first_name?.charAt(0).toUpperCase()}
                                  {match.user.last_name?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {match.user.first_name} {match.user.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                Match score: {Math.round(match.score * 100)}%
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendRequest(match.user.id)}
                              disabled={isRequestSent}
                              className="ml-2 bg-white dark:bg-card border-indigo-300 dark:border-border text-indigo-700 dark:text-foreground hover:bg-indigo-50 dark:hover:bg-accent"
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              {isRequestSent ? "Request Sent" : "Connect"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination for matches */}
                    {totalMatchPages > 1 && (
                      <div className="flex justify-center items-center mt-4 space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePrevMatchPage}
                          disabled={currentMatchPage === 1}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <span className="text-sm text-muted-foreground">
                          Page {currentMatchPage} of {totalMatchPages}
                        </span>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextMatchPage}
                          disabled={currentMatchPage === totalMatchPages}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1 py-3 rounded-lg bg-gradient-indigo-purple hover:bg-gradient-indigo-purple-dark text-[#3b82f6] font-medium dark:text-[#3b82f6] shadow-md hover:shadow-lg transition-all duration-200"
                  onClick={() => navigate("/chat")}
                >
                  Start Chatting
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}