import { afterEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.hoisted(() => vi.fn());
vi.mock("nodemailer", () => ({
  default: { createTransport: vi.fn(() => ({ sendMail })) },
}));

import {
  consoleTransport,
  resendTransport,
  selectTransport,
  smtpTransport,
} from "./transport";

const MSG = { to: "a@x.com", subject: "s", text: "t", html: "<p>t</p>" };
const ENV_VARS = [
  "RESEND_API_KEY",
  "EMAIL_SERVER_HOST",
  "EMAIL_SERVER_PORT",
  "EMAIL_SERVER_USER",
  "EMAIL_SERVER_PASSWORD",
  "EMAIL_FROM",
];

afterEach(() => {
  vi.restoreAllMocks();
  sendMail.mockReset();
  for (const v of ENV_VARS) delete process.env[v];
});

describe("consoleTransport", () => {
  it("logs without throwing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await consoleTransport().send({ ...MSG, to: ["a@x.com", "b@x.com"] });
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe("resendTransport", () => {
  it("POSTs to Resend with the from header", async () => {
    const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
      async () => new Response(null, { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await resendTransport("key", "from@x.com").send(MSG);
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.from).toBe("from@x.com");
  });

  it("throws on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 422 })),
    );
    await expect(resendTransport("key", "from@x.com").send(MSG)).rejects.toThrow(
      /Resend send failed: 422/,
    );
  });
});

describe("smtpTransport", () => {
  it("sends via nodemailer", async () => {
    await smtpTransport(
      { host: "smtp.x.com", port: 465, user: "u", pass: "p" },
      "from@x.com",
    ).send(MSG);
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: "from@x.com" }),
    );
  });
});

describe("selectTransport", () => {
  it("chooses Resend when the key is set", async () => {
    process.env.RESEND_API_KEY = "key";
    process.env.EMAIL_FROM = "from@x.com";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 200 })),
    );
    await selectTransport().send(MSG);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("chooses SMTP when host is set", async () => {
    process.env.EMAIL_SERVER_HOST = "smtp.x.com";
    process.env.EMAIL_SERVER_USER = "u";
    process.env.EMAIL_SERVER_PASSWORD = "p";
    process.env.EMAIL_FROM = "from@x.com";
    await selectTransport().send(MSG);
    expect(sendMail).toHaveBeenCalledOnce();
  });

  it("falls back to console when nothing is configured", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await selectTransport().send(MSG);
    expect(warn).toHaveBeenCalledOnce();
  });
});
