import smtplib
import sys
import os

def send_email(to_email, otp, from_email, from_password):
    """
    Connects to the Gmail SMTP server and sends a one-time password.
    """
    try:
        # Create an SMTP session
        s = smtplib.SMTP('smtp.gmail.com', 587)
        s.starttls()  # Start TLS for security

        # Login to your email account using the app password
        s.login(from_email, from_password)

        # Prepare the message with the updated company name
        message = f"""From: Auth App <{from_email}>
To: {to_email}
Subject: Your One-Time Password (OTP) for Password Reset

Your OTP for password reset is: {otp}

This code will expire in 10 minutes.

If you didn't request this password reset, please ignore this email.

Best regards,
Auth App Team
"""

        # Send the email
        s.sendmail(from_email, to_email, message)
        print("Email sent successfully.") # This output can be seen by the Node.js server

    except smtplib.SMTPAuthenticationError:
        print("Authentication error: Check your GMAIL_USER and GMAIL_APP_PASS in the .env file.", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"An error occurred while sending email: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        s.quit()  # Always close the SMTP session

# This block runs when the script is executed directly from the command line
if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python send_otp_email.py <recipient_email> <otp>", file=sys.stderr)
        sys.exit(1)
        
    to_email = sys.argv[1]
    otp = sys.argv[2]
    
    # Get credentials securely from environment variables
    from_email = os.getenv('GMAIL_USER')
    from_password = os.getenv('GMAIL_APP_PASS')
    
    if not from_email or not from_password:
        print("Fatal: GMAIL_USER or GMAIL_APP_PASS are not set in environment variables.", file=sys.stderr)
        sys.exit(1)
        
    send_email(to_email, otp, from_email, from_password)
