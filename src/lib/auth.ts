import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import nodemailer from "nodemailer";

import { db } from "#/db";
import { env } from "#/env";
import { logServerError } from "#/lib/server/logger";

const devTrustedOrigins = [
	"https://l3000.shadehost.eu",
	"http://laptop.devices.shadehost.eu:3000",
];

const trustedOrigins =
	process.env.NODE_ENV === "production" ? undefined : devTrustedOrigins;

const smtpTransport = nodemailer.createTransport({
	host: env.SMTP_HOST,
	port: env.SMTP_PORT,
	secure: env.SMTP_PORT === 465,
	auth: {
		user: env.SMTP_USER,
		pass: env.SMTP_PASS,
	},
});

async function sendPasswordResetEmail(to: string, resetUrl: string) {
	const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3eee2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:#0f8a8d;padding:32px 24px;text-align:center">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">Study Time Manager</h1>
    </div>
    <div style="padding:32px 24px">
      <h2 style="margin:0 0 12px;color:#1d3340;font-size:20px">Reset your password</h2>
      <p style="margin:0 0 24px;color:#4b606b;font-size:14px;line-height:1.6">
        We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.
      </p>
      <div style="text-align:center;margin:28px 0">
        <a href="${resetUrl}" style="display:inline-block;background:#0f8a8d;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:600">
          Reset Password
        </a>
      </div>
      <p style="margin:0 0 8px;color:#4b606b;font-size:12px;line-height:1.5">
        If the button doesn't work, copy and paste this URL into your browser:
      </p>
      <p style="margin:0 0 24px;color:#0f8a8d;font-size:12px;word-break:break-all">${resetUrl}</p>
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0">
      <p style="margin:0;color:#999;font-size:11px;text-align:center">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  </div>
</body>
</html>`.trim();

	await smtpTransport.sendMail({
		from: env.SMTP_FROM,
		to,
		subject: "Reset your password – Study Time Manager",
		html,
		text: `Reset your password\n\nWe received a request to reset your password. Visit the link below to choose a new one (expires in 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, ignore this email.`,
	});
}

export const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,
	trustedOrigins,
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	emailAndPassword: {
		enabled: true,
		sendResetPassword: async ({ user, url }) => {
			try {
				await sendPasswordResetEmail(user.email, url);
			} catch (error) {
				logServerError("Failed to send password reset email", error, {
					userId: user.id,
				});
				throw new Error("Unable to send reset email. Please try again later.");
			}
		},
	},
	plugins: [
		admin({
			bannedUserMessage:
				"Your account has been suspended. Please contact support if you believe this is an error.",
		}),
		tanstackStartCookies(),
	],
});
