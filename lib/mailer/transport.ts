import nodemailer from "nodemailer";
import { optionalEnv, requiredEnv } from "../env";

/** A way to actually deliver a message. Implementations below. */
export type Transport = {
  send(message: {
    to: string | string[];
    subject: string;
    text: string;
    html: string;
  }): Promise<void>;
};

/** Dev fallback: log the message (and any links) to the server console. */
export function consoleTransport(): Transport {
  return {
    async send(message): Promise<void> {
      const recipients = [message.to].flat().join(",");
      console.warn(
        `[mailer:console] to=${recipients} · ${message.subject}\n${message.text}`,
      );
    },
  };
}

export function resendTransport(apiKey: string, from: string): Transport {
  return {
    async send(message): Promise<void> {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, ...message }),
      });
      if (!res.ok) throw new Error(`Resend send failed: ${res.status}`);
    },
  };
}

export function smtpTransport(
  opts: { host: string; port: number; user: string; pass: string },
  from: string,
): Transport {
  const tx = nodemailer.createTransport({
    host: opts.host,
    port: opts.port,
    secure: opts.port === 465,
    auth: { user: opts.user, pass: opts.pass },
  });
  return {
    async send(message): Promise<void> {
      await tx.sendMail({ from, ...message });
    },
  };
}

/**
 * Pick a transport from the environment:
 *   RESEND_API_KEY → Resend · EMAIL_SERVER_HOST → SMTP · otherwise console.
 */
export function selectTransport(): Transport {
  const resendKey = optionalEnv("RESEND_API_KEY");
  if (resendKey) return resendTransport(resendKey, requiredEnv("EMAIL_FROM"));

  const smtpHost = optionalEnv("EMAIL_SERVER_HOST");
  if (smtpHost) {
    return smtpTransport(
      {
        host: smtpHost,
        port: Number(optionalEnv("EMAIL_SERVER_PORT") ?? "587"),
        user: requiredEnv("EMAIL_SERVER_USER"),
        pass: requiredEnv("EMAIL_SERVER_PASSWORD"),
      },
      requiredEnv("EMAIL_FROM"),
    );
  }
  return consoleTransport();
}
