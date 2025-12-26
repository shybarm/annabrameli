import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  showCTA?: boolean;
}

const initialMessages: Message[] = [
  {
    id: "1",
    text: "שלום! אני העוזר הדיגיטלי של ד״ר אנה ברמלי, מומחית באלרגיה ואימונולוגיה. אשמח לעזור לכם להבין האם כדאי לפנות לבדיקת אלרגיה. ספרו לי, מה מציק לכם?",
    sender: "bot",
    timestamp: new Date(),
  },
];

const quickReplies = [
  { label: "פריחה בעור", value: "יש לי פריחה בעור, האם זה יכול להיות אלרגיה?" },
  { label: "שיעול כרוני", value: "אני סובל/ת משיעול שלא עובר, האם זה קשור לאלרגיה?" },
  { label: "נפיחות", value: "יש לי נפיחות אחרי אכילה, האם זה יכול להיות אלרגיה למזון?" },
  { label: "עיניים דומעות", value: "העיניים שלי דומעות ומגרדות, מה הסיבה?" },
  { label: "תגובה לתרופה", value: "חשבתי שהייתה לי תגובה אלרגית לתרופה, מה לעשות?" },
];

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = [...messages, userMessage].map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      }));

      const { data, error } = await supabase.functions.invoke("chat-assistant", {
        body: { messages: conversationHistory },
      });

      if (error) {
        console.error("Chat error:", error);
        throw new Error(error.message || "שגיאה בתקשורת עם המערכת");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const newQuestionCount = questionCount + 1;
      setQuestionCount(newQuestionCount);

      // Show CTA after 2-3 exchanges
      const showCTA = newQuestionCount >= 2;

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.message,
        sender: "bot",
        timestamp: new Date(),
        showCTA,
      };

      setMessages((prev) => [...prev, botResponse]);

    } catch (error: any) {
      console.error("Error in chat:", error);
      
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו לעבד את הבקשה",
        variant: "destructive",
      });

      // Add fallback message
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "מצטער, נתקלנו בבעיה טכנית. לקביעת תור או שאלות נוספות, אנא צרו קשר עם המרפאה ישירות.",
        sender: "bot",
        timestamp: new Date(),
        showCTA: true,
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages(initialMessages);
    setQuestionCount(0);
  };

  return (
    <>
      {/* FAB Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 left-6 z-50 w-16 h-16 rounded-full gradient-teal shadow-teal flex items-center justify-center hover:scale-105 transition-transform"
            aria-label="פתח את העוזר הדיגיטלי"
          >
            <MessageCircle className="w-7 h-7 text-primary-foreground" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-6 z-50 w-[calc(100vw-3rem)] sm:w-96 h-[550px] max-h-[calc(100vh-6rem)] bg-card rounded-2xl shadow-xl border border-border flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border gradient-teal">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary-foreground">העוזר הדיגיטלי</h3>
                  <p className="text-xs text-primary-foreground/80">ד״ר אנה ברמלי - אלרגיה ואימונולוגיה</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-primary-foreground/20 transition-colors"
                aria-label="סגור"
              >
                <X className="w-5 h-5 text-primary-foreground" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Quick Reply Buttons - show only at start */}
              {messages.length === 1 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap gap-2 mb-2"
                >
                  {quickReplies.map((reply) => (
                    <button
                      key={reply.label}
                      onClick={() => {
                        setInputValue(reply.value);
                      }}
                      className="px-3 py-1.5 text-xs bg-accent text-primary rounded-full border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {reply.label}
                    </button>
                  ))}
                </motion.div>
              )}

              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${
                    message.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`flex items-start gap-3 ${
                      message.sender === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.sender === "user"
                          ? "bg-primary"
                          : "bg-accent"
                      }`}
                    >
                      {message.sender === "user" ? (
                        <User className="w-4 h-4 text-primary-foreground" />
                      ) : (
                        <Bot className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div
                      className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                        message.sender === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                  
                  {/* CTA Button after bot message */}
                  {message.sender === "bot" && message.showCTA && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-3 mr-11"
                    >
                      <Button
                        size="sm"
                        className="shadow-teal"
                        asChild
                      >
                        <Link to="/guest-booking">
                          <Calendar className="w-4 h-4 ml-2" />
                          קביעת תור לאבחון
                        </Link>
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted p-3 rounded-2xl rounded-bl-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="הקלידו את השאלה שלכם..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={!inputValue.trim() || isLoading}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  הכלי אינו מהווה ייעוץ רפואי
                </p>
                {messages.length > 1 && (
                  <button
                    onClick={handleReset}
                    className="text-xs text-primary hover:underline"
                  >
                    התחל מחדש
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
