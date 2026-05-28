import { describe, expect, it, vi } from "vitest";
import { sendAccessApproved, sendAccessRequest, sendMagicLink } from "./send";
import type { Transport } from "./transport";

type Msg = { to: string | string[]; subject: string; text: string; html: string };
type SendFn = (message: Msg) => Promise<void>;

function spyTransport(): {
  transport: Transport;
  send: ReturnType<typeof vi.fn<SendFn>>;
} {
  const send = vi.fn<SendFn>(async () => {});
  return { transport: { send }, send };
}

describe("send helpers", () => {
  it("sendMagicLink composes the magic-link message", async () => {
    const { transport, send } = spyTransport();
    await sendMagicLink(transport, { to: "a@x.com", url: "https://x/v" });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: "a@x.com" }));
    expect(send.mock.calls[0][0].html).toContain("https://x/v");
  });

  it("sendAccessRequest fans out to admins with both urls", async () => {
    const { transport, send } = spyTransport();
    await sendAccessRequest(transport, {
      to: ["x@x.com", "y@x.com"],
      requesterEmail: "r@x.com",
      approveUrl: "https://x/a",
      rejectUrl: "https://x/r",
    });
    const msg = send.mock.calls[0][0];
    expect(msg.to).toEqual(["x@x.com", "y@x.com"]);
    expect(msg.html).toContain("https://x/a");
    expect(msg.html).toContain("https://x/r");
  });

  it("sendAccessApproved passes the method through", async () => {
    const { transport, send } = spyTransport();
    await sendAccessApproved(transport, {
      to: "a@x.com",
      method: "oauth",
      signInUrl: "https://x/",
    });
    expect(send.mock.calls[0][0].text).toContain("Sign in again");
  });
});
