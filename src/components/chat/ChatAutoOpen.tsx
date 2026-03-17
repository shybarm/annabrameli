import { useEffect } from "react";

declare global {
  interface Window {
    openChatWidget?: () => void;
    toggleChatWidget?: (open?: boolean) => void;
    chatbot?: {
      open?: () => void;
      show?: () => void;
      toggle?: () => void;
    };
    tidioChatApi?: {
      open?: () => void;
      display?: (open: boolean) => void;
    };
    Intercom?: (...args: any[]) => void;
    zE?: (...args: any[]) => void;
    $crisp?: any[];
    Voiceflow?: {
      chat?: {
        open?: () => void;
        interact?: (payload: unknown) => void;
      };
    };
  }
}

function tryOpenKnownBots() {
  try {
    if (typeof window.openChatWidget === "function") {
      window.openChatWidget();
      return true;
    }
    if (typeof window.toggleChatWidget === "function") {
      window.toggleChatWidget(true);
      return true;
    }
    if (window.chatbot?.open) {
      window.chatbot.open();
      return true;
    }
    if (window.chatbot?.show) {
      window.chatbot.show();
      return true;
    }
    if (window.chatbot?.toggle) {
      window.chatbot.toggle();
      return true;
    }
    if (window.tidioChatApi?.open) {
      window.tidioChatApi.open();
      return true;
    }
    if (window.tidioChatApi?.display) {
      window.tidioChatApi.display(true);
      return true;
    }
    if (typeof window.Intercom === "function") {
      window.Intercom("show");
      return true;
    }
    if (typeof window.zE === "function") {
      window.zE("messenger", "open");
      return true;
    }
    if (Array.isArray(window.$crisp)) {
      window.$crisp.push(["do", "chat:open"]);
      return true;
    }
    if (window.Voiceflow?.chat?.open) {
      window.Voiceflow.chat.open();
      return true;
    }

    const selectors = [
      '[data-chat-open="true"]',
      '[data-testid="chat-button"]',
      '[aria-label*="chat" i]',
      '[aria-label*="צ׳אט"]',
      '[aria-label*="צאט"]',
      '[aria-label*="הודעה"]',
      '[class*="chat-widget"] button',
      '[class*="chat-button"]',
      '[id*="chat-button"]',
      '[id*="chat-widget"] button',
      'button[title*="chat" i]',
      'button[title*="message" i]',
      'button[class*="intercom"]',
      'button[class*="crisp"]',
      'button[class*="tidio"]',
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (el) {
        el.click();
        return true;
      }
    }
  } catch (error) {
    console.error("Failed to auto-open chat:", error);
  }
  return false;
}

export default function ChatAutoOpen() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const shouldOpenChat = url.searchParams.get("openChat") === "1";
    if (!shouldOpenChat) return;

    let tries = 0;
    const maxTries = 20;

    const attempt = () => {
      tries += 1;
      const opened = tryOpenKnownBots();
      if (opened) {
        url.searchParams.delete("openChat");
        window.history.replaceState({}, "", url.toString());
        return;
      }
      if (tries < maxTries) {
        window.setTimeout(attempt, 400);
      }
    };

    window.setTimeout(attempt, 300);
  }, []);

  return null;
}
