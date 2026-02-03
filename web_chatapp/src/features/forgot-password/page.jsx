import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Loader2, MessageCircle, CheckCircle } from "lucide-react";
import { useForgotPasswordMutation } from "../../services/authService";
import { useTranslation } from "react-i18next";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const navigate = useNavigate();

  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError(t("errors.validationFailed"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t("errors.validationFailed"));
      return;
    }

    try {
      const response = await forgotPassword(email).unwrap();
      setTemporaryPassword(response?.data?.temporary_password || "");
      setIsSuccess(true);
    } catch (err) {
      // RTK Query error structure: err.data contains the response body
      const errorData = err?.data || {};
      const errorMessage = errorData?.message 
        || errorData?.error 
        || err?.message 
        || (errorData?.errors && typeof errorData.errors === 'object' && errorData.errors.email?.[0])
        || t("errors.failedToSend");
      
      console.error('Forgot password error:', err);
      setError(errorMessage);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-background">
        <Card className="max-w-md w-full shadow-xl bg-white dark:bg-card border border-indigo-100 dark:border-white/30">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-gray-900 dark:text-foreground">{t("auth.temporaryPasswordGenerated")}</CardTitle>
            <CardDescription className="text-gray-600 dark:text-muted-foreground mt-2">
              {t("auth.temporaryPasswordGeneratedMessage")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="default" className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800">
                <strong>{t("auth.checkEmailTemporaryPassword")}</strong>
              </AlertDescription>
            </Alert>
            
            {temporaryPassword && (
              <>
                <Alert variant="default" className="bg-yellow-50 border-yellow-200">
                  <AlertDescription className="text-yellow-800">
                    <strong>{t("auth.emailSendFailedUseThisPassword")}</strong>
                  </AlertDescription>
                </Alert>
                
                <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300">
                  <Label className="text-sm text-gray-600">{t("auth.temporaryPasswordLabel")}</Label>
                  <div className="mt-2 flex items-center justify-between bg-white dark:bg-card px-3 py-2 rounded border border-gray-300 dark:border-white/20">
                    <code className="text-lg font-mono font-semibold text-gray-900 select-all">{temporaryPassword}</code>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(temporaryPassword);
                      }}
                      >
                      {t("auth.copy")}
                    </Button>
                  </div>
                </div>
              </>
            )}
            
            <div className="text-center text-sm text-gray-500">
              <p>{temporaryPassword ? t("auth.useThisPasswordToLogin") : t("auth.checkEmailForTemporaryPassword")}</p>
            </div>
            <Button className="w-full" size="lg" onClick={() => navigate("/login")}>
              {t("auth.goToLogin")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-background">
      <div className="w-full max-w-md">
        <Card className="shadow-xl bg-white dark:bg-card border border-indigo-100 dark:border-white/30">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <MessageCircle className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl text-gray-900 dark:text-foreground">{t("auth.forgotPassword")}</CardTitle>
            <CardDescription className="text-gray-600 dark:text-muted-foreground">
              {t("auth.loginSubtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-foreground">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 border-border dark:border-white/30 dark:bg-input dark:text-foreground"
                />
              </div>

              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    {t("auth.sendingResetLink")}
                  </>
                ) : (
                  t("auth.sendResetLink")
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {t("auth.rememberPasswordPrompt")}{" "}
                  <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                    {t("auth.loginTitle")}
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
