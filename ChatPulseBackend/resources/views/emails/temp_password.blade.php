<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Your Temporary Password</title>
    <style>
        .container {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
        }
        .password-box {
            background: #ffffff;
            border: 2px solid #3b82f6;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }
        .password {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            letter-spacing: 2px;
            font-family: 'Courier New', monospace;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            font-size: 16px;
            color: #ffffff;
            background-color: #3b82f6;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
        }
        .alert {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
        }
        .footer {
            margin-top: 20px;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 Temporary Password</h1>
        </div>
        
        <div class="content">
            <p>Hello!</p>
            
            <p>We received a request to reset your password. Your temporary password is:</p>
            
            <div class="password-box">
                <div style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">Temporary Password:</div>
                <div class="password">{{ $temporaryPassword }}</div>
            </div>
            
            <div class="alert">
                <strong>⚠️ Important:</strong> Use this temporary password to login. You will be prompted to change your password immediately after login.
            </div>
            
            <p><strong>Next steps:</strong></p>
            <ol>
                <li>Copy the temporary password above</li>
                <li>Click the button below to go to the login page</li>
                <li>Enter your email and the temporary password</li>
                <li>Set your new password when prompted</li>
            </ol>
            
            <div style="text-align: center;">
                <a href="{{ $loginUrl }}" class="button">Go to Login</a>
            </div>
            
            <p style="margin-top: 30px;">
                <strong>Security Note:</strong> This temporary password will only work once. After you change your password, this temporary password will be invalid.
            </p>
            
            <div class="footer">
                <p>If you did not request this password reset, please ignore this email or contact support.</p>
                <p>This temporary password expires in 24 hours.</p>
            </div>
        </div>
    </div>
</body>
</html>

