<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password Request</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #EEF2FF 0%, #F3E8FF 100%);
        }
        .email-container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #6366F1 0%, #A855F7 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 10px;
        }
        .logo-icon {
            width: 48px;
            height: 48px;
            background: white;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        .logo-icon::before {
            content: "💬";
            font-size: 28px;
        }
        .logo-icon::after {
            content: "";
            position: absolute;
            top: -4px;
            right: -4px;
            width: 12px;
            height: 12px;
            background: #6366F1;
            border-radius: 50%;
            border: 2px solid white;
        }
        .logo-text {
            font-size: 32px;
            font-weight: bold;
            color: white;
        }
        .header-subtitle {
            color: rgba(255, 255, 255, 0.9);
            font-size: 16px;
            margin-top: 8px;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 24px;
            font-weight: 600;
            color: #1F2937;
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            color: #6B7280;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #6366F1 0%, #A855F7 100%);
            color: white;
            text-decoration: none;
            padding: 16px 40px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s;
        }
        .button:hover {
            transform: translateY(-2px);
        }
        .info-box {
            background: #F3F4F6;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
        }
        .info-text {
            font-size: 14px;
            color: #6B7280;
            margin: 0;
        }
        .footer {
            background: #F9FAFB;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #E5E7EB;
        }
        .footer-text {
            font-size: 14px;
            color: #6B7280;
            margin-bottom: 10px;
        }
        .footer-link {
            color: #6366F1;
            text-decoration: none;
        }
        .divider {
            height: 1px;
            background: #E5E7EB;
            margin: 30px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">
                <div class="logo-icon"></div>
                <div class="logo-text">Live Flow</div>
            </div>
            <div class="header-subtitle">Build Meaningful Connections</div>
        </div>
        
        <div class="content">
            <div class="greeting">🔐 Password Reset Request</div>
            
            <div class="message">
                Hello,<br><br>
                We received a request to reset your password for your Live Flow account. Click the button below to create a new password:
            </div>
            
            <div class="button-container">
                <a href="{{ $resetUrl }}" class="button">Reset My Password</a>
            </div>
            
            <div class="info-box">
                <p class="info-text">
                    <strong>⏱ This link will expire in 60 minutes</strong> for security reasons. If you need a new link, please request another password reset.
                </p>
            </div>
            
            <div class="message">
                If the button above doesn't work, copy and paste this link into your browser:
            </div>
            
            <div class="info-box">
                <p class="info-text" style="word-break: break-all;">
                    {{ $resetUrl }}
                </p>
            </div>
            
            <div class="divider"></div>
            
            <div class="message" style="font-size: 14px; color: #9CA3AF;">
                <strong>Didn't request this?</strong><br>
                If you did not request a password reset, please ignore this email. Your password will remain unchanged and your account is secure.
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text">
                © 2024 Live Flow. All rights reserved.
            </div>
            <div class="footer-text">
                <a href="{{ config('app.url') }}" class="footer-link">Visit Our Website</a>
            </div>
        </div>
    </div>
</body>
</html>
