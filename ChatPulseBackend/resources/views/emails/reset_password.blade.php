<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reset Password Request</title>
    <style>
        .button {
            display: inline-block;
            padding: 10px 20px;
            font-size: 16px;
            color: #ffffff;
            background-color: #1a73e8;
            text-decoration: none;
            border-radius: 5px;
        }
        .container {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .footer {
            margin-top: 20px;
            font-size: 14px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <p>Hello!</p>
        <p>Please click the button below to reset your password.</p>
        <p>
            <a href="{{ $resetUrl }}" class="button">Reset Password</a>
        </p>
        <p>If you did not request a password reset, no further action is required.</p>
        <div class="footer">
            <p>Regards,</p>
            <p>Laravel</p>
        </div>
    </div>
</body>
</html>
