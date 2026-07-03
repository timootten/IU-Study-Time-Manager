import nodemailer from "nodemailer";
import { env } from "#/env";

let _transport: nodemailer.Transporter | null = null;

export function getSmtpTransport(): nodemailer.Transporter {
	if (!_transport) {
		_transport = nodemailer.createTransport({
			host: env.SMTP_HOST,
			port: env.SMTP_PORT,
			secure: env.SMTP_PORT === 465,
			auth: {
				user: env.SMTP_USER,
				pass: env.SMTP_PASS,
			},
		});
	}
	return _transport;
}
