import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  Lock,
  Send,
  UserPlus,
  MessageSquare,
  ArrowLeft,
  Sun,
  Moon,
  ShieldCheck,
  Users,
  User,
  Loader2,
  AlertCircle,
  Plus,
  Search,
  LogOut,
  Sparkles,
  ChevronLeft,
  Paperclip,
  Image as ImageIcon,
  CheckCircle,
  Camera,
  Copy,
  Trash2,
  Smile,
  Info,
  X,
  Key,
  Heart
} from "lucide-react";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "SHS Messenger — Highly Encrypted E2EE Chat" },
      {
        name: "description",
        content:
          "End-to-End Encrypted private messaging system using AES-GCM and ECDH key agreement. Secure and anonymous.",
      },
    ],
  }),
  component: E2eeMessengerPage,
});

// Types
interface ChatUser {
  username: string;
  publicKey: string; // JWK string
  salt: string;
}

interface DBMessage {
  id: string;
  sender: string;
  recipient: string;
  encryptedContent: string;
  iv: string;
  timestamp: string;
}

interface DecryptedMessage extends DBMessage {
  plaintext: string;
  decryptionFailed?: boolean;
}

interface FeedComment {
  id: string;
  username: string;
  text: string;
  timestamp: string;
}

interface FeedPost {
  id: string;
  username: string;
  content: string;
  mediaUrl: string;
  timestamp: string;
  likes: string[];
  comments: FeedComment[];
}

interface MaikoMessage {
  id: string;
  sender: "user" | "maiko";
  plaintext: string;
  timestamp: string;
}

// Verified Account Checkmark Component matching user example
const VerifiedTick = () => (
  <span className="inline-flex items-center justify-center size-3.5 bg-[#4cd0e0] text-white rounded-full flex-shrink-0 ml-1 shadow-sm" title="Verified Account">
    <svg viewBox="0 0 24 24" className="size-2.5 stroke-white fill-none stroke-[4.5]" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  </span>
);

function E2eeMessengerPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Auth State
  const [isRegistered, setIsRegistered] = useState<boolean>(true); // toggle login/register
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Logged-in session state
  const [loggedInUser, setLoggedInUser] = useState<string>("");
  const [myPrivateKey, setMyPrivateKey] = useState<CryptoKey | null>(null);
  const [myAuthHash, setMyAuthHash] = useState<string>("");
  const [myPfpUrl, setMyPfpUrl] = useState<string>("");

  // Responsive mobile view state: "list" (show sidebar of contacts) or "chat" (show active chat pane)
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  // Chat State
  const [contacts, setContacts] = useState<string[]>([]);
  const [activeContact, setActiveContact] = useState<string>("");
  const [newContactInput, setNewContactInput] = useState<string>("");
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactLoading, setContactLoading] = useState<boolean>(false);
  
  // Contacts search filter
  const [searchFilter, setSearchFilter] = useState<string>("");
  
  // Public keys & PFPs cache to avoid repeated network requests
  const [publicKeysCache, setPublicKeysCache] = useState<Record<string, CryptoKey>>({});
  const [pfpsCache, setPfpsCache] = useState<Record<string, string>>({});
  
  // Upload status states
  const [pfpUploading, setPfpUploading] = useState<boolean>(false);
  const [mediaUploading, setMediaUploading] = useState<boolean>(false);

  // Messages state
  const [rawMessages, setRawMessages] = useState<DBMessage[]>([]);
  const [decryptedMessages, setDecryptedMessages] = useState<DecryptedMessage[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [sendLoading, setSendLoading] = useState<boolean>(false);

  // Premium Chat App Features State
  const [msgSearchQuery, setMsgSearchQuery] = useState<string>("");
  const [showMsgSearch, setShowMsgSearch] = useState<boolean>(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [showInfoDrawer, setShowInfoDrawer] = useState<boolean>(false);
  const [localDeletedMsgs, setLocalDeletedMsgs] = useState<string[]>([]);
  const [fingerprintCache, setFingerprintCache] = useState<Record<string, string>>({});
  const [copiedFingerprint, setCopiedFingerprint] = useState<boolean>(false);
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);

  // Profile Feed/Stories States
  const [peerFeedPosts, setPeerFeedPosts] = useState<FeedPost[]>([]);
  const [feedLoading, setFeedLoading] = useState<boolean>(false);
  const [showMyFeedDrawer, setShowMyFeedDrawer] = useState<boolean>(false);
  const [myFeedPosts, setMyFeedPosts] = useState<FeedPost[]>([]);
  const [myFeedLoading, setMyFeedLoading] = useState<boolean>(false);
  const [newPostText, setNewPostText] = useState<string>("");
  const [newPostMediaUrl, setNewPostMediaUrl] = useState<string>("");
  const [postUploading, setPostUploading] = useState<boolean>(false);

  // E2EE Media Caption Modal states
  const [pendingMediaFile, setPendingMediaFile] = useState<File | null>(null);
  const [mediaCaptionInput, setMediaCaptionInput] = useState<string>("");

  // Like & Comment state arrays
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({});

  // Profile Info States (DOB and Religion)
  const [myDob, setMyDob] = useState<string>("");
  const [myReligion, setMyReligion] = useState<string>("");
  const [mySubReligion, setMySubReligion] = useState<string>("");
  const [editingProfile, setEditingProfile] = useState<boolean>(false);
  const [profileSaving, setProfileSaving] = useState<boolean>(false);

  // Cached profile details for peer contacts
  const [dobsCache, setDobsCache] = useState<Record<string, string>>({});
  const [religionsCache, setReligionsCache] = useState<Record<string, string>>({});
  const [bannedCache, setBannedCache] = useState<Record<string, boolean>>({});

  // Swipeable Religion Alert Pop-up states
  const [showReligionNote, setShowReligionNote] = useState<boolean>(false);
  const [noteSwipeOffset, setNoteSwipeOffset] = useState<number>(0);
  const [isSwipingNote, setIsSwipingNote] = useState<boolean>(false);
  const swipeStartXRef = useRef<number>(0);
  const noteTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Maiko AI Chat History State
  const [maikoMessages, setMaikoMessages] = useState<MaikoMessage[]>([]);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  
  // Refs
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const pfpInputRef = useRef<HTMLInputElement | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const feedMediaInputRef = useRef<HTMLInputElement | null>(null);

  // Sync theme
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    const t = saved || "dark";
    setTheme(t === "light" ? "light" : "dark");
    document.documentElement.classList.toggle("dark", t === "dark");

    // Try loading session from localStorage
    const savedUser = localStorage.getItem("e2ee_username");
    const savedAuthHash = localStorage.getItem("e2ee_auth_hash");
    const savedPrivKeyJwk = localStorage.getItem("e2ee_private_key_jwk");

    if (savedUser && savedAuthHash && savedPrivKeyJwk) {
      try {
        const parsedJwk = JSON.parse(savedPrivKeyJwk);
        importPrivateKeyFromJwk(parsedJwk).then((privKey) => {
          setLoggedInUser(savedUser);
          setMyAuthHash(savedAuthHash);
          setMyPrivateKey(privKey);

          // Fetch my PFP on mount
          fetch(`/api/messages/publickey?username=${encodeURIComponent(savedUser)}`)
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                if (data.pfpUrl) setMyPfpUrl(data.pfpUrl);
                if (data.dob) setMyDob(data.dob);
                if (data.religion) {
                  const match = data.religion.match(/^Christianity \(([^)]+)\)$/);
                  if (match) {
                    setMyReligion("Christianity");
                    setMySubReligion(match[1]);
                  } else {
                    setMyReligion(data.religion);
                    setMySubReligion("");
                  }
                }
                calculateFingerprint(savedUser, data.publicKey);
              }
            }).catch(console.error);

          // Load Maiko AI local chat history
          const savedMaikoMsgs = localStorage.getItem("maiko_ai_messages_" + savedUser);
          if (savedMaikoMsgs) {
            try {
              const parsed = JSON.parse(savedMaikoMsgs);
              if (Array.isArray(parsed)) {
                setMaikoMessages(parsed);
              } else {
                setMaikoMessages([]);
              }
            } catch (e) {
              console.error("Failed to parse Maiko AI messages:", e);
              setMaikoMessages([]);
            }
          } else {
            setMaikoMessages([]);
          }

        }).catch(err => {
          console.error("Failed to restore E2EE private key:", err);
          clearSession();
        });
      } catch (err) {
        console.error("Failed to parse saved private key JWK:", err);
        clearSession();
      }
    }

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (noteTimerRef.current) clearTimeout(noteTimerRef.current);
    };
  }, []);

  // Poll for messages once logged in
  useEffect(() => {
    if (loggedInUser && myAuthHash) {
      fetchMessages();
      pollingIntervalRef.current = setInterval(fetchMessages, 2000);
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [loggedInUser, myAuthHash]);

  // Decrypt messages when rawMessages or keys cache update
  useEffect(() => {
    decryptAllMessages();
  }, [rawMessages, myPrivateKey, publicKeysCache]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [decryptedMessages, maikoMessages, activeContact]);

  // Fetch peer feed when drawer opens or peer changes
  useEffect(() => {
    if (activeContact && showInfoDrawer && activeContact !== "Maiko AI") {
      fetchPeerFeed(activeContact);
    }
  }, [activeContact, showInfoDrawer]);

  // Fetch my feed when my feed drawer opens
  useEffect(() => {
    if (showMyFeedDrawer && loggedInUser) {
      fetchMyFeed();
    }
  }, [showMyFeedDrawer, loggedInUser]);

  // Sync Maiko AI chat history to localStorage
  useEffect(() => {
    if (loggedInUser && maikoMessages.length > 0) {
      localStorage.setItem("maiko_ai_messages_" + loggedInUser, JSON.stringify(maikoMessages));
    }
  }, [maikoMessages, loggedInUser]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const clearSession = () => {
    localStorage.removeItem("e2ee_username");
    localStorage.removeItem("e2ee_auth_hash");
    localStorage.removeItem("e2ee_private_key_jwk");
    setLoggedInUser("");
    setMyAuthHash("");
    setMyPrivateKey(null);
    setMyPfpUrl("");
    setMyDob("");
    setMyReligion("");
    setMySubReligion("");
    setRawMessages([]);
    setDecryptedMessages([]);
    setMaikoMessages([]);
    setActiveContact("");
    setContacts([]);
    setMobileView("list");
    setShowInfoDrawer(false);
    setShowMyFeedDrawer(false);
  };

  const handleContactSelect = (c: string) => {
    setActiveContact(c);
    setMobileView("chat");
    setMsgSearchQuery("");
    setShowMsgSearch(false);
    setShowEmojiPicker(false);
    setShowInfoDrawer(false);
  };

  // Avatar deterministic gradient colors based on username hash
  const getAvatarGradient = (name: string): string => {
    const colors = [
      "from-rose-500 to-red-600",
      "from-purple-600 to-indigo-700",
      "from-blue-500 to-sky-600",
      "from-emerald-500 to-teal-600",
      "from-amber-500 to-orange-600",
      "from-pink-500 to-rose-600",
      "from-violet-500 to-fuchsia-600",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Calculate E2EE Security key fingerprint from JWK public key
  const calculateFingerprint = async (username: string, publicKeyJwk: string) => {
    try {
      const encoder = new TextEncoder();
      const hash = await crypto.subtle.digest("SHA-256", encoder.encode(publicKeyJwk));
      const hashArray = Array.from(new Uint8Array(hash));
      const fingerprint = hashArray
        .slice(0, 16)
        .map(b => b.toString(16).toUpperCase().padStart(2, "0"))
        .join(" ");
      setFingerprintCache(prev => ({ ...prev, [username]: fingerprint }));
    } catch (e) {
      console.error("Fingerprint calculation error:", e);
    }
  };

  // --- CRYPTO HELPERS ---

  // Helper to hash password using SHA-256
  const sha256 = async (text: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hash = await window.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  };

  // Derive AES-GCM Key from password + salt using PBKDF2
  const deriveKeyFromPassword = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
    const encoder = new TextEncoder();
    const baseKey = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  };

  // Import Private Key from JWK format
  const importPrivateKeyFromJwk = async (jwk: JsonWebKey): Promise<CryptoKey> => {
    return window.crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      ["deriveKey"]
    );
  };

  // Import Public Key from JWK format
  const importPublicKeyFromJwk = async (jwk: JsonWebKey): Promise<CryptoKey> => {
    return window.crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "ECDH", namedCurve: "P-256" },
      true,
      []
    );
  };

  // Generate ECDH Keypair
  const generateEcdhKeyPair = async (): Promise<CryptoKeyPair> => {
    return window.crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey"]
    );
  };

  // Derive Shared AES key from my private key and other public key
  const deriveSharedAesKey = async (privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey> => {
    return window.crypto.subtle.deriveKey(
      {
        name: "ECDH",
        public: publicKey
      },
      privateKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  };

  // --- E2EE OPERATIONS ---

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser || !password) {
      setAuthError("Please fill in all fields.");
      setAuthLoading(false);
      return;
    }

    try {
      // 1. Generate auth hash (SHA-256 of username + password)
      const authHash = await sha256(cleanUser + password);
      
      // 2. Generate ECDH Key pair for message encryption
      const keyPair = await generateEcdhKeyPair();

      // 3. Export public key to JWK
      const pubKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);

      // 4. Derive symmetric key from password to encrypt private key
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const kdfKey = await deriveKeyFromPassword(password, salt);

      // 5. Encrypt private key JWK with password-derived key
      const privKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
      const privKeyBytes = new TextEncoder().encode(JSON.stringify(privKeyJwk));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      const encryptedPrivBytes = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        kdfKey,
        privKeyBytes
      );

      // Convert variables to hex/base64 for transport
      const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
      const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, "0")).join("");
      const encryptedPrivHex = Array.from(new Uint8Array(encryptedPrivBytes))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

      // 6. Register on backend
      const res = await fetch("/api/messages/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanUser,
          passwordHash: authHash,
          publicKey: JSON.stringify(pubKeyJwk),
          encryptedPrivateKey: JSON.stringify({ ciphertext: encryptedPrivHex, iv: ivHex }),
          salt: saltHex
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");

      // Set session
      setLoggedInUser(cleanUser);
      setMyAuthHash(authHash);
      setMyPrivateKey(keyPair.privateKey);
      calculateFingerprint(cleanUser, JSON.stringify(pubKeyJwk));

      // Save to localStorage
      localStorage.setItem("e2ee_username", cleanUser);
      localStorage.setItem("e2ee_auth_hash", authHash);
      localStorage.setItem("e2ee_private_key_jwk", JSON.stringify(privKeyJwk));

      setIsRegistered(true);
    } catch (err: any) {
      setAuthError(err.message || "An error occurred during registration.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser || !password) {
      setAuthError("Please fill in all fields.");
      setAuthLoading(false);
      return;
    }

    try {
      // 1. Fetch user public key and encrypted private key
      const res = await fetch(`/api/messages/publickey?username=${encodeURIComponent(cleanUser)}`);
      if (res.status === 404) throw new Error("Username does not exist.");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed.");

      let { encryptedPrivateKey, salt, pfpUrl } = data;

      if (typeof encryptedPrivateKey === "string") {
        try {
          encryptedPrivateKey = JSON.parse(encryptedPrivateKey);
        } catch (e) {
          console.error("Failed to parse encryptedPrivateKey:", e);
        }
      }

      // 2. Derive KDF key from password + salt
      const saltBytes = new Uint8Array(salt.match(/.{1,2}/g).map((byte: string) => parseInt(byte, 16)));
      const kdfKey = await deriveKeyFromPassword(password, saltBytes);

      // 3. Decrypt the private key JWK
      const ivBytes = new Uint8Array(encryptedPrivateKey.iv.match(/.{1,2}/g).map((byte: string) => parseInt(byte, 16)));
      const cipherBytes = new Uint8Array(encryptedPrivateKey.ciphertext.match(/.{1,2}/g).map((byte: string) => parseInt(byte, 16)));

      let decryptedPrivJwkBytes;
      try {
        decryptedPrivJwkBytes = await window.crypto.subtle.decrypt(
          { name: "AES-GCM", iv: ivBytes },
          kdfKey,
          cipherBytes
        );
      } catch {
        throw new Error("Incorrect password.");
      }

      const privKeyJwk = JSON.parse(new TextDecoder().decode(decryptedPrivJwkBytes));

      // 4. Import the private key
      const privKey = await importPrivateKeyFromJwk(privKeyJwk);

      // 5. Store session
      const authHash = await sha256(cleanUser + password);
      setLoggedInUser(cleanUser);
      setMyAuthHash(authHash);
      setMyPrivateKey(privKey);
      if (pfpUrl) setMyPfpUrl(pfpUrl);
      if (data.dob) setMyDob(data.dob);
      if (data.religion) {
        const match = data.religion.match(/^Christianity \(([^)]+)\)$/);
        if (match) {
          setMyReligion("Christianity");
          setMySubReligion(match[1]);
        } else {
          setMyReligion(data.religion);
          setMySubReligion("");
        }
      }
      calculateFingerprint(cleanUser, data.publicKey);

      // Load Maiko AI local chat history
      const savedMaikoMsgs = localStorage.getItem("maiko_ai_messages_" + cleanUser);
      if (savedMaikoMsgs) {
        try {
          const parsed = JSON.parse(savedMaikoMsgs);
          if (Array.isArray(parsed)) {
            setMaikoMessages(parsed);
          } else {
            setMaikoMessages([]);
          }
        } catch (e) {
          console.error("Failed to parse Maiko AI messages:", e);
          setMaikoMessages([]);
        }
      } else {
        setMaikoMessages([]);
      }

      // Save to local storage
      localStorage.setItem("e2ee_username", cleanUser);
      localStorage.setItem("e2ee_auth_hash", authHash);
      localStorage.setItem("e2ee_private_key_jwk", JSON.stringify(privKeyJwk));
    } catch (err: any) {
      setAuthError(err.message || "An error occurred during login.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Fetch all E2EE messages from backend
  const fetchMessages = async () => {
    if (!loggedInUser || !myAuthHash) return;

    try {
      const res = await fetch(`/api/messages/list?username=${encodeURIComponent(loggedInUser)}&authHash=${encodeURIComponent(myAuthHash)}`);
      if (res.ok) {
        const data = await res.json();
        setRawMessages(data.messages || []);
        
        // Extract unique contacts from messages (exclude myself)
        const participants = new Set<string>();
        data.messages.forEach((msg: DBMessage) => {
          if (msg.sender !== loggedInUser) participants.add(msg.sender);
          if (msg.recipient !== loggedInUser) participants.add(msg.recipient);
        });
        
        setContacts(prev => {
          const merged = new Set([...prev, ...participants]);
          return Array.from(merged);
        });
      }
    } catch (err) {
      console.error("Messages list fetch failed:", err);
    }
  };

  // Fetch or retrieve from cache user's ECDH public key & PFP
  const getPeerPublicKey = async (peerUsername: string): Promise<CryptoKey | null> => {
    if (publicKeysCache[peerUsername]) {
      return publicKeysCache[peerUsername];
    }

    try {
      const res = await fetch(`/api/messages/publickey?username=${encodeURIComponent(peerUsername)}`);
      if (!res.ok) return null;
      const data = await res.json();
      
      const pubKeyJwk = JSON.parse(data.publicKey);
      const pubKey = await importPublicKeyFromJwk(pubKeyJwk);
      
      setPublicKeysCache(prev => ({ ...prev, [peerUsername]: pubKey }));
      calculateFingerprint(peerUsername, data.publicKey);

      const peerPfp = data.pfpUrl || `https://raw.githubusercontent.com/nonxe/dbpfp/main/${peerUsername.toLowerCase()}.jpg`;
      setPfpsCache(prev => ({ ...prev, [peerUsername]: peerPfp }));
      if (data.dob) {
        setDobsCache(prev => ({ ...prev, [peerUsername]: data.dob }));
      }
      if (data.religion) {
        setReligionsCache(prev => ({ ...prev, [peerUsername]: data.religion }));
      }
      setBannedCache(prev => ({ ...prev, [peerUsername]: !!data.banned }));

      return pubKey;
    } catch (err) {
      console.error(`Failed to get public key for ${peerUsername}:`, err);
      return null;
    }
  };

  // Decrypt all messages locally using peer keys + my private key
  const decryptAllMessages = async () => {
    if (!myPrivateKey || rawMessages.length === 0) return;

    const list: DecryptedMessage[] = [];
    for (const msg of rawMessages) {
      try {
        if (!msg || !msg.encryptedContent) {
          list.push({ ...msg, plaintext: "[Secure Message — Malformed payload]", decryptionFailed: true });
          continue;
        }

        // Check if message payload is unencrypted media
        const isPlainMedia = msg.encryptedContent.startsWith("[IMAGE]:") || 
                             msg.encryptedContent.startsWith("[VIDEO]:") || 
                             msg.encryptedContent.startsWith("[FILE]:");

        if (isPlainMedia) {
          list.push({ ...msg, plaintext: msg.encryptedContent });
          continue;
        }

        const peer = msg.sender === loggedInUser ? msg.recipient : msg.sender;
        if (!peer) {
          list.push({ ...msg, plaintext: "[Secure Message — Unknown contact]", decryptionFailed: true });
          continue;
        }

        const peerPubKey = await getPeerPublicKey(peer);

        if (!peerPubKey) {
          list.push({ ...msg, plaintext: "[Secure Message — Waiting for peer key...]", decryptionFailed: true });
          continue;
        }

        // Derive shared AES key
        const sharedKey = await deriveSharedAesKey(myPrivateKey, peerPubKey);

        // Convert hex strings to byte arrays safely
        const ivMatches = msg.iv ? msg.iv.match(/.{1,2}/g) : null;
        const cipherMatches = msg.encryptedContent ? msg.encryptedContent.match(/.{1,2}/g) : null;

        if (!ivMatches || !cipherMatches) {
          list.push({ ...msg, plaintext: "[Decryption Failed — Invalid hex format]", decryptionFailed: true });
          continue;
        }

        const ivBytes = new Uint8Array(ivMatches.map((byte: string) => parseInt(byte, 16)));
        const cipherBytes = new Uint8Array(cipherMatches.map((byte: string) => parseInt(byte, 16)));

        // Decrypt
        const plaintextBuffer = await window.crypto.subtle.decrypt(
          { name: "AES-GCM", iv: ivBytes },
          sharedKey,
          cipherBytes
        );

        const plaintext = new TextDecoder().decode(plaintextBuffer);
        list.push({ ...msg, plaintext });
      } catch (err) {
        console.error("Decryption error for message:", msg?.id, err);
        list.push({ ...msg, plaintext: "[Decryption Failed — Key Mismatch]", decryptionFailed: true });
      }
    }
    setDecryptedMessages(list);
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);
    const target = newContactInput.trim().toLowerCase();

    if (!target) return;
    if (target === loggedInUser) {
      setContactError("You cannot chat with yourself.");
      return;
    }
    if (contacts.includes(target)) {
      handleContactSelect(target);
      setNewContactInput("");
      return;
    }

    setContactLoading(true);
    try {
      const pubKey = await getPeerPublicKey(target);
      if (!pubKey) {
        setContactError("User does not exist on SHS Network.");
      } else {
        setContacts(prev => [...prev, target]);
        handleContactSelect(target);
        setNewContactInput("");
      }
    } catch {
      setContactError("Error adding contact.");
    } finally {
      setContactLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeContact) return;

    // Route message to Maiko AI if it's the active contact
    if (activeContact === "Maiko AI") {
      await handleSendMaikoMessage(messageInput);
      return;
    }

    if (!myPrivateKey) return;

    setSendLoading(true);
    try {
      // 1. Fetch/Get Bob's public key
      const peerPubKey = await getPeerPublicKey(activeContact);
      if (!peerPubKey) throw new Error("Recipient public key not available.");

      // 2. Derive shared key
      const sharedKey = await deriveSharedAesKey(myPrivateKey, peerPubKey);

      // 3. Encrypt the plaintext message
      const plaintextBytes = new TextEncoder().encode(messageInput.trim());
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const cipherBytes = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        sharedKey,
        plaintextBytes
      );

      // Convert ciphertext and IV to hex strings
      const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, "0")).join("");
      const cipherHex = Array.from(new Uint8Array(cipherBytes))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

      // 4. Send to backend
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: loggedInUser,
          recipient: activeContact,
          encryptedContent: cipherHex,
          iv: ivHex,
          authHash: myAuthHash
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to transmit message.");
      }

      setMessageInput("");
      fetchMessages(); // Immediately fetch to update local list
    } catch (err: any) {
      alert(err.message || "Failed to encrypt/send message.");
    } finally {
      setSendLoading(false);
    }
  };

  // --- MAIKO AI CHAT HANDLER ---

  const handleSendMaikoMessage = async (text: string) => {
    if (!text.trim()) return;

    // 1. Add user message to local timeline
    const userMsg: MaikoMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      plaintext: text.trim(),
      timestamp: new Date().toISOString()
    };
    
    setMaikoMessages(prev => [...prev, userMsg]);
    setMessageInput("");
    setSendLoading(true);

    try {
      // 2. Query Maiko AI endpoint
      const res = await fetch(`https://tdoqjbentujzffjzxndo.supabase.co/functions/v1/ai?prompt=${encodeURIComponent(text.trim())}`);
      if (!res.ok) throw new Error("AI Service temporarily unavailable.");
      
      const data = await res.json();
      
      const aiMsg: MaikoMessage = {
        id: `maiko-${Date.now()}`,
        sender: "maiko",
        plaintext: data.reply || "No response received.",
        timestamp: new Date().toISOString()
      };
      
      setMaikoMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: MaikoMessage = {
        id: `maiko-err-${Date.now()}`,
        sender: "maiko",
        plaintext: `⚠️ Maiko AI: ${err.message || "Failed to contact AI service."}`,
        timestamp: new Date().toISOString()
      };
      setMaikoMessages(prev => [...prev, errorMsg]);
    } finally {
      setSendLoading(false);
    }
  };


  // --- OWNER ACTION HANDLERS ---
  const handleOwnerAction = async (action: "ban" | "unban" | "delete", targetUser: string) => {
    if (targetUser === "as" || targetUser === "Maiko AI") return;
    if (!confirm(`Are you sure you want to perform [${action.toUpperCase()}] on @${targetUser}?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/messages/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          targetUsername: targetUser,
          authHash: myAuthHash
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Action execution failed.");

      alert(data.message);
      if (action === "delete") {
        setContacts(prev => prev.filter(c => c !== targetUser));
        setActiveContact("");
        setShowInfoDrawer(false);
      } else {
        // Refresh contact metadata
        handleContactSelect(targetUser);
      }
    } catch (err: any) {
      alert(err.message || "Failed to execute owner action.");
    } finally {
      setActionLoading(false);
    }
  };

  // --- NEW MEDIA UPLOADING HANDLERS ---

  const handlePfpClick = () => {
    pfpInputRef.current?.click();
  };

  const handlePfpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPfpUploading(true);
    try {
      // Compress image to lightweight ~30KB JPEG
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const maxDim = 350;

            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL("image/jpeg", 0.85));
            } else {
              resolve(ev.target?.result as string);
            }
          };
          img.onerror = reject;
          img.src = ev.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload PFP to nonxe/dbpfp GitHub repo & link with nonxe/db
      const res = await fetch("/api/pfp/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loggedInUser,
          pfpBase64: base64Data,
          mimeType: "image/jpeg",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "PFP upload failed");

      const rawPfpUrl = data.pfpUrl || `https://raw.githubusercontent.com/nonxe/dbpfp/main/${loggedInUser.toLowerCase()}.png`;

      // Sync PFP URL to MongoDB e2ee_users collection as well
      await fetch("/api/messages/updatepfp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loggedInUser,
          authHash: myAuthHash,
          pfpUrl: rawPfpUrl,
        }),
      }).catch(() => {});

      setMyPfpUrl(rawPfpUrl);
    } catch (err: any) {
      alert(err.message || "Failed to upload profile picture.");
    } finally {
      setPfpUploading(false);
      if (pfpInputRef.current) pfpInputRef.current.value = "";
    }
  };

  const handleMediaClick = () => {
    mediaInputRef.current?.click();
  };

  // Open caption modal when file selected in chat instead of uploading immediately
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeContact) return;
    setPendingMediaFile(file);
    setMediaCaptionInput("");
  };

  // Triggered on clicking Send inside the Caption E2EE modal
  const confirmMediaUploadAndSend = async () => {
    if (!pendingMediaFile || !activeContact) return;

    setMediaUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", pendingMediaFile);

      // Upload media permanently to Catbox
      const res = await fetch("/api/public/upload", {
        method: "POST",
        body: formData,
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        if (res.status === 413) {
          throw new Error("Media file too large. Server rejected upload. (If self-hosting VPS, configure Nginx client_max_body_size)");
        }
        throw new Error(`Upload failed (${res.status}). Server returned non-JSON response.`);
      }
      if (!res.ok || !data.success) throw new Error(data.error || "Upload failed");

      const fileUrl = data.url;

      const fileType = pendingMediaFile.type;
      const fileName = pendingMediaFile.name;

      // Construct special unencrypted message prefix content
      let payload = "";
      if (fileType.startsWith("image/")) {
        payload = `[IMAGE]:${fileUrl}`;
      } else if (fileType.startsWith("video/")) {
        payload = `[VIDEO]:${fileUrl}`;
      } else {
        payload = `[FILE]:${fileName}|${fileUrl}`;
      }

      // Add optional caption if present
      if (mediaCaptionInput.trim()) {
        payload = `${payload}||${mediaCaptionInput.trim()}`;
      }

      // Send to MongoDB relay directly in plaintext
      const sendRes = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: loggedInUser,
          recipient: activeContact,
          encryptedContent: payload,
          iv: "000000000000000000000000",
          authHash: myAuthHash
        })
      });

      if (!sendRes.ok) {
        const sendData = await sendRes.json();
        throw new Error(sendData.error || "Failed to transmit message.");
      }

      setPendingMediaFile(null);
      setMediaCaptionInput("");
      fetchMessages();
    } catch (err: any) {
      alert(err.message || "Failed to upload and send media.");
    } finally {
      setMediaUploading(false);
      if (mediaInputRef.current) mediaInputRef.current.value = "";
    }
  };

  // --- PROFILE FEED HANDLERS ---

  const fetchPeerFeed = async (peerName: string) => {
    setFeedLoading(true);
    try {
      const res = await fetch(`/api/messages/feed?username=${encodeURIComponent(peerName)}`);
      if (res.ok) {
        const data = await res.json();
        setPeerFeedPosts(data.posts || []);
      }
    } catch (err) {
      console.error("Failed to fetch peer feed:", err);
    } finally {
      setFeedLoading(false);
    }
  };

  const fetchMyFeed = async () => {
    setMyFeedLoading(true);
    try {
      const res = await fetch(`/api/messages/feed?username=${encodeURIComponent(loggedInUser)}`);
      if (res.ok) {
        const data = await res.json();
        setMyFeedPosts(data.posts || []);
      }
    } catch (err) {
      console.error("Failed to fetch my feed:", err);
    } finally {
      setMyFeedLoading(false);
    }
  };

  const handleFeedMediaClick = () => {
    feedMediaInputRef.current?.click();
  };

  const handleFeedMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPostUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/public/upload", {
        method: "POST",
        body: formData,
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        if (res.status === 413) {
          throw new Error("Feed media too large. Server rejected upload. (If self-hosting VPS, configure Nginx client_max_body_size)");
        }
        throw new Error(`Upload failed (${res.status}). Server returned non-JSON response.`);
      }
      if (!res.ok || !data.success) throw new Error(data.error || "Upload failed");

      setNewPostMediaUrl(data.url);
    } catch (err: any) {
      alert(err.message || "Failed to upload feed media.");
    } finally {
      setPostUploading(false);
      if (feedMediaInputRef.current) feedMediaInputRef.current.value = "";
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim() && !newPostMediaUrl.trim()) return;

    setPostUploading(true);
    try {
      const res = await fetch("/api/messages/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loggedInUser,
          authHash: myAuthHash,
          content: newPostText.trim(),
          mediaUrl: newPostMediaUrl.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to post.");

      setNewPostText("");
      setNewPostMediaUrl("");
      fetchMyFeed();
    } catch (err: any) {
      alert(err.message || "Failed to create post.");
    } finally {
      setPostUploading(false);
    }
  };

  // --- LIKES & COMMENTS ACTIONS ---

  const handleLikeClick = async (postId: string, isMyFeed: boolean) => {
    try {
      const res = await fetch("/api/messages/feed/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loggedInUser,
          authHash: myAuthHash,
          postId
        })
      });

      if (res.ok) {
        if (isMyFeed) {
          fetchMyFeed();
        } else {
          fetchPeerFeed(activeContact);
        }
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const toggleComments = (postId: string) => {
    setCommentsOpen(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleCommentChange = (postId: string, value: string) => {
    setCommentInputs(prev => ({ ...prev, [postId]: value }));
  };

  const handleSendComment = async (e: React.FormEvent, postId: string, isMyFeed: boolean) => {
    e.preventDefault();
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;

    try {
      const res = await fetch("/api/messages/feed/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loggedInUser,
          authHash: myAuthHash,
          postId,
          text: commentText
        })
      });

      if (res.ok) {
        setCommentInputs(prev => ({ ...prev, [postId]: "" }));
        if (isMyFeed) {
          fetchMyFeed();
        } else {
          fetchPeerFeed(activeContact);
        }
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };

  // --- PROFILE UPDATE OPERATIONS ---

  const handleUpdateProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setProfileSaving(true);

    try {
      let religionStr = myReligion;
      if (myReligion === "Christianity" && mySubReligion) {
        religionStr = `Christianity (${mySubReligion})`;
      }

      const res = await fetch("/api/messages/updateprofile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loggedInUser,
          authHash: myAuthHash,
          dob: myDob || null,
          religion: religionStr || null
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update profile.");

      setEditingProfile(false);
      alert("Profile updated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleRemoveProfileField = async (field: "dob" | "religion") => {
    setProfileSaving(true);
    try {
      let nextDob = myDob;
      let nextReligion = myReligion;
      let nextSubReligion = mySubReligion;

      if (field === "dob") {
        nextDob = "";
        setMyDob("");
      } else {
        nextReligion = "";
        nextSubReligion = "";
        setMyReligion("");
        setMySubReligion("");
      }

      let religionStr = nextReligion;
      if (nextReligion === "Christianity" && nextSubReligion) {
        religionStr = `Christianity (${nextSubReligion})`;
      }

      const res = await fetch("/api/messages/updateprofile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loggedInUser,
          authHash: myAuthHash,
          dob: nextDob || null,
          religion: religionStr || null
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to clear field.");

      alert(`${field === "dob" ? "Date of Birth" : "Religious Identity"} removed.`);
    } catch (err: any) {
      alert(err.message || "Failed to clear field.");
    } finally {
      setProfileSaving(false);
    }
  };

  // Swipeable Pop-up Note System
  const triggerReligionNote = () => {
    setShowReligionNote(true);
    setNoteSwipeOffset(0);
    if (noteTimerRef.current) clearTimeout(noteTimerRef.current);
    noteTimerRef.current = setTimeout(() => {
      setShowReligionNote(false);
    }, 8000);
  };

  const handleNoteDragStart = (clientX: number) => {
    setIsSwipingNote(true);
    swipeStartXRef.current = clientX;
    if (noteTimerRef.current) {
      clearTimeout(noteTimerRef.current);
      noteTimerRef.current = null;
    }
  };

  const handleNoteDragMove = (clientX: number) => {
    if (!isSwipingNote) return;
    const deltaX = clientX - swipeStartXRef.current;
    setNoteSwipeOffset(deltaX);
  };

  const handleNoteDragEnd = () => {
    if (!isSwipingNote) return;
    setIsSwipingNote(false);
    if (Math.abs(noteSwipeOffset) > 100) {
      setShowReligionNote(false);
    } else {
      setNoteSwipeOffset(0);
      noteTimerRef.current = setTimeout(() => {
        setShowReligionNote(false);
      }, 8000);
    }
  };

  const copyToClipboard = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(msgId);
    setTimeout(() => setCopiedTextId(null), 2000);
  };

  const deleteMessageLocally = (msgId: string) => {
    setLocalDeletedMsgs(prev => [...prev, msgId]);
  };

  const copyPeerFingerprint = () => {
    const print = fingerprintCache[activeContact] || "";
    if (print) {
      navigator.clipboard.writeText(print);
      setCopiedFingerprint(true);
      setTimeout(() => setCopiedFingerprint(false), 2000);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const activeMessages = decryptedMessages.filter(
    msg => (msg.sender === activeContact && msg.recipient === loggedInUser) ||
           (msg.sender === loggedInUser && msg.recipient === activeContact)
  );

  const filteredContacts = contacts.filter(c => 
    c.toLowerCase().includes(searchFilter.trim().toLowerCase())
  );

  // Emojis list
  const emojiList = ["😀", "😂", "😍", "👍", "🔥", "🎉", "❤️", "👏", "🙌", "😮", "😢", "😎", "🚀", "🔒", "🤫", "👀", "💯"];

  // Render Maiko AI timeline
  const renderMaikoTimeline = () => {
    if (maikoMessages.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none animate-fade-in">
          <div className="size-16 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-600 p-0.5 shadow-lg mb-4">
            <div className="w-full h-full bg-[#0a0a0a] rounded-full flex items-center justify-center text-white">
              <Sparkles className="size-7 text-cyan-400" />
            </div>
          </div>
          <h3 className="text-[14px] font-black text-foreground flex items-center justify-center">
            Chat with Maiko AI
            <VerifiedTick />
          </h3>
          <p className="text-[11px] text-muted-foreground max-w-[280px] mx-auto mt-1 leading-normal font-bold">
            Ask Maiko anything! She can answer questions, summarize text, or assist with calculations.
          </p>
        </div>
      );
    }

    return maikoMessages.map((msg) => {
      const isMe = msg.sender === "user";
      const msgDate = new Date(msg.timestamp);
      
      return (
        <div key={msg.id} className="space-y-2 animate-fade-in">
          <div className={`flex ${isMe ? "justify-end" : "justify-start"} group relative`}>
            {/* AI Avatar prefix on the left for AI messages */}
            {!isMe && (
              <div className="size-7 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-600 p-0.5 mr-2 flex-shrink-0 shadow select-none self-end mb-0.5">
                <div className="w-full h-full bg-white dark:bg-[#0a0a0a] rounded-full flex items-center justify-center text-white">
                  <Sparkles className="size-3 text-cyan-400" />
                </div>
              </div>
            )}

            <div className={`max-w-[78%] relative shadow-sm rounded-[18px] select-text border msg-bubble ${
              isMe
                ? "bg-[#3390ec] border-[#3390ec]/20 text-white rounded-br-[3px]"
                : "bg-white dark:bg-[#1c1c1e] border-black/[0.05] dark:border-white/[0.04] shadow-[0_0_12px_rgba(34,211,238,0.03)] text-foreground dark:text-gray-100 rounded-bl-[3px]"
            }`}>
              <div className="pl-3.5 pr-13 pt-2 pb-2.5 min-w-[80px]">
                <p className="text-[13px] font-medium leading-relaxed break-words whitespace-pre-wrap select-text">
                  {msg.plaintext}
                </p>
                <span className={`absolute bottom-1 right-2 text-[8.5px] select-none font-semibold ${
                  isMe ? "text-white/60" : "text-muted-foreground/60"
                }`}>
                  {msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Quick Bubble Action overlay */}
            <div className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1.5 bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/[0.06] px-2.5 py-1 rounded-full shadow-lg z-10 select-none ${
              isMe ? "right-[80%] mr-2" : "left-[80%] ml-2"
            }`}>
              <button
                onClick={() => copyToClipboard(msg.plaintext, msg.id)}
                title={copiedTextId === msg.id ? "Copied!" : "Copy to clipboard"}
                className="text-[10px] text-muted-foreground hover:text-foreground font-bold flex items-center gap-0.5 transition-colors"
              >
                {copiedTextId === msg.id ? (
                  <CheckCircle className="size-3.5 text-emerald-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>

          </div>
        </div>
      );
    });
  };

  // Render group of messages with date separators & message search filtering
  const renderMessageTimeline = () => {
    if (activeContact === "Maiko AI") {
      return renderMaikoTimeline();
    }

    let lastDateStr = "";
    
    const chatFilteredMsgs = activeMessages.filter(msg => {
      if (localDeletedMsgs.includes(msg.id)) return false;
      if (!showMsgSearch || !msgSearchQuery.trim()) return true;
      return msg.plaintext.toLowerCase().includes(msgSearchQuery.toLowerCase());
    });

    if (chatFilteredMsgs.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none animate-fade-in">
          <div className="size-14 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 dark:border-emerald-500/20 flex items-center justify-center mb-3">
            <Lock className="size-6 text-emerald-500/40 animate-pulse" />
          </div>
          <p className="text-[13px] font-black text-foreground">
            {msgSearchQuery ? "No matching messages" : "Secure Channel Opened"}
          </p>
          <p className="text-[11px] text-muted-foreground max-w-[260px] mx-auto mt-0.5 leading-normal">
            {msgSearchQuery 
              ? "Try adjusting your search terms to locate messages." 
              : "Your messages are highly encrypted using local client key pairs. Nobody else can read them."}
          </p>
        </div>
      );
    }

    return chatFilteredMsgs.map((msg) => {
      const isMe = msg.sender === loggedInUser;
      const msgDate = new Date(msg.timestamp);
      
      // Date grouping logic
      const dateStr = msgDate.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
      const showHeader = dateStr !== lastDateStr;
      lastDateStr = dateStr;
      
      const parts = msg.plaintext.split("||");
      const mainPayload = parts[0];
      const captionText = parts.slice(1).join("||"); // join back in case caption had ||

      const isImage = mainPayload.startsWith("[IMAGE]:");
      const isVideo = mainPayload.startsWith("[VIDEO]:");
      const isFile = mainPayload.startsWith("[FILE]:");

      let messageContent = null;

      if (isImage) {
        const url = mainPayload.substring(8);
        messageContent = (
          <div className="space-y-1.5 max-w-[260px]">
            <a href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg hover:opacity-90 transition-opacity">
              <img src={url} alt="Media" className="w-full h-auto object-contain max-h-[350px] rounded-lg bg-black/5 dark:bg-black/20" />
            </a>
            {captionText && (
              <p className="text-[12.5px] font-medium leading-relaxed break-words text-foreground dark:text-gray-100 mt-1 select-text">
                {captionText}
              </p>
            )}
            <p className="text-[10px] opacity-60 underline text-right select-none">
              <a href={url} target="_blank" rel="noopener noreferrer" className={isMe ? "text-white/80" : "text-[#3390ec]"}>
                Open full image ↗
              </a>
            </p>
          </div>
        );
      } else if (isVideo) {
        const url = mainPayload.substring(8);
        messageContent = (
          <div className="space-y-1.5 max-w-[260px]">
            <video src={url} controls className="w-full h-auto rounded-lg max-h-[350px] bg-black/10" />
            {captionText && (
              <p className="text-[12.5px] font-medium leading-relaxed break-words text-foreground dark:text-gray-100 mt-1 select-text">
                {captionText}
              </p>
            )}
            <p className="text-[10px] opacity-60 underline text-right select-none">
              <a href={url} target="_blank" rel="noopener noreferrer" className={isMe ? "text-white/80" : "text-[#3390ec]"}>
                Open full video ↗
              </a>
            </p>
          </div>
        );
      } else if (isFile) {
        const fileParts = mainPayload.substring(7).split("|");
        const fileName = fileParts[0];
        const url = fileParts[1];
        messageContent = (
          <div className="space-y-1.5 max-w-[280px]">
            <div className="flex items-center gap-3 bg-black/10 dark:bg-black/20 p-3 rounded-xl">
              <div className="size-10 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-black truncate">{fileName}</p>
                <a href={url} target="_blank" rel="noopener noreferrer" className={`text-[10.5px] font-bold hover:underline ${
                  isMe ? "text-white/90" : "text-[#3390ec] dark:text-[#82b1ff]"
                }`}>
                  Download File ↗
                </a>
              </div>
            </div>
            {captionText && (
              <p className="text-[12.5px] font-medium leading-relaxed break-words text-foreground dark:text-gray-100 mt-1 select-text px-1">
                {captionText}
              </p>
            )}
          </div>
        );
      } else {
        messageContent = (
          <p className="text-[13px] font-medium leading-relaxed break-words whitespace-pre-wrap select-text">
            {msg.plaintext}
          </p>
        );
      }

      return (
        <div key={msg.id} className="space-y-2 animate-bubble-in">
          {showHeader && (
            <div className="flex justify-center my-3 select-none">
              <span className="bg-black/70 text-gray-300 text-[10.5px] font-bold px-3 py-1 rounded-full backdrop-blur-md shadow-sm">
                {dateStr}
              </span>
            </div>
          )}
          
          <div className={`flex ${isMe ? "justify-end" : "justify-start"} group relative`}>
            {/* Telegram-style message bubbles */}
            <div className={`max-w-[78%] relative shadow-sm rounded-[18px] select-text border msg-bubble ${
              isMe
                ? "bg-[#3390ec] border-[#3390ec]/20 text-white rounded-br-[3px]"
                : msg.decryptionFailed
                  ? "bg-rose-500/10 border-rose-500/25 text-rose-500 rounded-bl-[3px]"
                  : "bg-white dark:bg-[#1c1c1e] border-black/[0.05] dark:border-white/[0.04] text-foreground rounded-bl-[3px]"
            }`}>
              <div className="pl-3.5 pr-13 pt-2 pb-2.5 min-w-[80px]">
                {messageContent}
                
                {/* Bottom-right corner timestamp inside bubble */}
                <span className={`absolute bottom-1 right-2 text-[8.5px] select-none font-semibold ${
                  isMe ? "text-white/60" : "text-muted-foreground/60"
                }`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Quick Bubble Action overlay on Hover */}
            <div className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1.5 bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/[0.06] px-2.5 py-1 rounded-full shadow-lg z-10 select-none ${
              isMe ? "right-[80%] mr-2" : "left-[80%] ml-2"
            }`}>
              <button
                onClick={() => copyToClipboard(msg.plaintext, msg.id)}
                title={copiedTextId === msg.id ? "Copied!" : "Copy to clipboard"}
                className="text-[10px] text-muted-foreground hover:text-foreground font-bold flex items-center gap-0.5 transition-colors"
              >
                {copiedTextId === msg.id ? (
                  <CheckCircle className="size-3.5 text-emerald-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
              <span className="w-px h-3 bg-border/40 dark:bg-gray-600" />
              <button
                onClick={() => deleteMessageLocally(msg.id)}
                title="Hide message"
                className="text-muted-foreground hover:text-rose-500 transition-colors"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>

          </div>
        </div>
      );
    });
  };

  // Render a feed post inside drawers with Likes & Collapsible Comments Section
  const renderFeedPostItem = (post: FeedPost, isMyFeed: boolean) => {
    const isLikedByMe = post.likes?.includes(loggedInUser);
    const commentsList = post.comments || [];
    const isCommentsOpen = !!commentsOpen[post.id];

    return (
      <div key={post.id} className="bg-[#0d0d0d] border border-white/[0.04] rounded-2xl p-3.5 space-y-3 relative shadow-sm select-text">
        {/* Post timestamp */}
        <span className="absolute top-2.5 right-3 text-[9px] text-muted-foreground select-none">
          {new Date(post.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}
        </span>
        
        <p className="text-[12px] font-black text-emerald-500 select-none">@{post.username}</p>
        
        {/* Fully show media ratio: no crop, object-contain, flexible height */}
        {post.mediaUrl && (
          <div className="rounded-lg overflow-hidden max-h-[350px] bg-black/45 border border-white/[0.04] flex items-center justify-center select-none">
            {post.mediaUrl.match(/\.(mp4|webm|ogg)$/i) || post.mediaUrl.includes("video") ? (
              <video src={post.mediaUrl} controls className="w-full h-auto max-h-[350px] object-contain" />
            ) : (
              <img src={post.mediaUrl} alt="Post Media" className="w-full h-auto max-h-[350px] object-contain" />
            )}
          </div>
        )}

        {post.content && (
          <p className="text-[12px] font-medium leading-relaxed text-foreground whitespace-pre-wrap">{post.content}</p>
        )}

        {/* Action Panel: Like and Comments trigger */}
        <div className="flex items-center gap-4 pt-1 border-t border-white/[0.04] text-muted-foreground select-none text-[11px] font-bold">
          {/* Like button */}
          <button
            onClick={() => handleLikeClick(post.id, isMyFeed)}
            className={`flex items-center gap-1.5 transition-colors ${
              isLikedByMe ? "text-rose-500" : "hover:text-rose-500 text-muted-foreground/60"
            }`}
          >
            <Heart className={`size-4.5 ${isLikedByMe ? "fill-rose-500" : ""}`} />
            <span>{post.likes?.length || 0}</span>
          </button>

          {/* Comment trigger */}
          <button
            onClick={() => toggleComments(post.id)}
            className={`flex items-center gap-1.5 hover:text-[#3390ec] transition-colors ${
              isCommentsOpen ? "text-[#3390ec]" : "text-muted-foreground/60"
            }`}
          >
            <MessageSquare className="size-4.5" />
            <span>{commentsList.length}</span>
          </button>
        </div>

        {/* Collapsible Comments Section */}
        {isCommentsOpen && (
          <div className="pt-2.5 border-t border-white/[0.04] space-y-3 animate-slide-in">
            {/* Comments List */}
            {commentsList.length > 0 && (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {commentsList.map(comment => (
                  <div key={comment.id} className="flex gap-2.5 items-start text-[11px] bg-[#111111] border border-white/[0.02] p-2.5 rounded-xl">
                    {/* Small initials circle */}
                    <div className={`size-5 rounded-full bg-gradient-to-tr ${getAvatarGradient(comment.username)} text-white flex items-center justify-center font-black text-[8px] flex-shrink-0 mt-0.5`}>
                      {comment.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center select-none">
                        <span className="font-black text-emerald-500 truncate">@{comment.username}</span>
                        <span className="text-[8px] text-muted-foreground/60">
                          {new Date(comment.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <p className="text-foreground dark:text-gray-300 font-medium break-words leading-relaxed mt-0.5">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Comment Input Form */}
            <form onSubmit={(e) => handleSendComment(e, post.id, isMyFeed)} className="flex gap-2 items-center select-none">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentInputs[post.id] || ""}
                onChange={(e) => handleCommentChange(post.id, e.target.value)}
                className="flex-1 h-8 bg-[#111111] border border-white/[0.06] rounded-xl px-2.5 text-[11px] font-bold outline-none focus:border-emerald-500/40 msg-input-bar"
              />
              <button
                type="submit"
                disabled={!commentInputs[post.id]?.trim()}
                className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[10px] font-black transition-all flex items-center justify-center"
              >
                Reply
              </button>
            </form>
          </div>
        )}
      </div>
    );
  };

  const isMaiko = activeContact === "Maiko AI";

  return (
    <main className="min-h-screen bg-[#f0f0f2] dark:bg-black text-foreground font-sans flex flex-col overflow-hidden h-screen relative" style={{ WebkitFontSmoothing: 'antialiased' }}>
      
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={pfpInputRef}
        onChange={handlePfpUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={mediaInputRef}
        onChange={handleMediaUpload}
        className="hidden"
      />
      <input
        type="file"
        ref={feedMediaInputRef}
        onChange={handleFeedMediaUpload}
        accept="image/*,video/*"
        className="hidden"
      />

      {/* Header */}
      <header className="px-4 py-3.5 flex items-center justify-between border-b border-black/[0.05] dark:border-white/[0.04] backdrop-blur-xl sticky top-0 z-40 bg-white/80 dark:bg-black/90 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="size-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary active:scale-90 transition-all"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="size-8.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Lock className="size-4.5 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-[15.5px] font-black tracking-tight leading-none">SHS MESSENGER</h1>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
                AES E2EE Private Chat Space
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loggedInUser && (
            <button
              onClick={clearSession}
              title="Sign Out"
              className="size-9 rounded-full border border-rose-500/25 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <LogOut className="size-4" />
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="size-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-all active:scale-90"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </header>

      {/* Main UI Area */}
      {!loggedInUser ? (
        // Login & Register Form Container
        <div className="flex-1 flex items-center justify-center p-5 bg-[#f0f0f2] dark:bg-black overflow-y-auto select-text">
          <div className="w-full max-w-sm rounded-[24px] border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-[#0a0a0a] p-6 shadow-2xl relative overflow-hidden ios-glass ios-shadow animate-spring-scale">
            
            {/* Header branding */}
            <div className="text-center space-y-2 mb-6 select-none">
              <div className="size-12 rounded-[16px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto shadow-sm">
                <Lock className="size-6" />
              </div>
              <h2 className="text-[20px] font-black tracking-tight">
                {isRegistered ? "Access Secure Chat" : "Create E2EE Account"}
              </h2>
              <p className="text-[11.5px] text-muted-foreground leading-normal max-w-xs mx-auto">
                {isRegistered
                  ? "Enter your credentials to download and decrypt your private keys locally."
                  : "Private keys are generated client-side and encrypted with your password."}
              </p>
            </div>

            {authError && (
              <div className="mb-4 rounded-xl border border-destructive/25 bg-destructive/5 text-destructive text-[12px] font-bold p-3 flex items-center gap-2">
                <AlertCircle className="size-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={isRegistered ? handleLogin : handleRegister} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Username</label>
                <input
                  type="text"
                  placeholder="e.g. alice"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-11 bg-background border border-border/30 rounded-xl px-3.5 text-[13px] font-bold outline-none focus:border-emerald-500/40 transition-all lowercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 bg-background border border-border/30 rounded-xl px-3.5 text-[13px] font-bold outline-none focus:border-emerald-500/40 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[13px] disabled:opacity-40 transition-all flex items-center justify-center gap-2 select-none"
              >
                {authLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isRegistered ? (
                  "Login securely"
                ) : (
                  "Create E2EE Account"
                )}
              </button>
            </form>

            <div className="mt-5 text-center select-none">
              <button
                onClick={() => {
                  setIsRegistered(!isRegistered);
                  setAuthError(null);
                }}
                className="text-[12px] font-bold text-emerald-500 hover:underline"
              >
                {isRegistered
                  ? "Don't have an account? Sign Up"
                  : "Already registered? Sign In"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // E2EE Telegram-Style Chat Screen
        <div className="flex-1 flex min-h-0 select-text relative">
          
          {/* ───────────────── LEFT PANEL: CONTACTS SIDEBAR ───────────────── */}
          <div className={`w-full md:w-[350px] border-r border-black/[0.05] dark:border-white/[0.04] flex flex-col min-h-0 flex-shrink-0 bg-white dark:bg-[#0a0a0a] select-none ${
            mobileView === "chat" ? "hidden md:flex" : "flex"
          }`}>
            
            {/* Logged in User Bar (Clickable to open profile settings/feed drawer) */}
            <div 
              onClick={() => setShowMyFeedDrawer(true)}
              className="px-4 py-3 bg-[#f6f6f6] dark:bg-[#0d0d0d] border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between cursor-pointer hover:bg-[#efeff1] dark:hover:bg-[#141414] transition-colors duration-150"
            >
              <div className="flex items-center gap-2.5">
                {myPfpUrl ? (
                  <img src={myPfpUrl} className="size-9 rounded-full object-cover border border-border/20 shadow-sm animate-fade-in" />
                ) : (
                  <div className={`size-9 rounded-full bg-gradient-to-tr ${getAvatarGradient(loggedInUser)} text-white flex items-center justify-center text-[13px] font-black shadow-sm`}>
                    {loggedInUser.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <span className="text-[13px] font-black block text-foreground leading-none">{loggedInUser}</span>
                  <span className="text-[9.5px] font-semibold text-emerald-500 tracking-wide mt-0.5 block flex items-center gap-0.5">
                    <span className="size-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    My Channel & Profile
                  </span>
                </div>
              </div>

              {/* Add contact mini button */}
              <div className="flex items-center gap-1.5">
                <div className="text-[9.5px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  SHS Cloud
                </div>
              </div>
            </div>

            {/* Contact Discovery Form */}
            <div className="p-3.5 border-b border-black/[0.04] dark:border-white/[0.04] space-y-2">
              <form onSubmit={handleAddContact} className="relative">
                <input
                  type="text"
                  placeholder="Enter username to start E2EE chat..."
                  value={newContactInput}
                  onChange={(e) => setNewContactInput(e.target.value)}
                  className="w-full h-9 bg-[#f0f0f2] dark:bg-[#111111] border border-black/[0.06] dark:border-white/[0.06] rounded-full pl-3.5 pr-10 text-[12px] font-bold outline-none focus:border-emerald-500/40 transition-all duration-200 lowercase msg-input-bar"
                />
                <button
                  type="submit"
                  disabled={contactLoading || !newContactInput.trim()}
                  className="absolute right-1 top-1 size-7 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center hover:bg-emerald-500/20 active:scale-95 disabled:opacity-40 transition-all"
                >
                  {contactLoading ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-4" />}
                </button>
              </form>
              
              {contactError && (
                <p className="text-[10px] font-black text-rose-500 text-center">{contactError}</p>
              )}

              {/* Local Filter Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground/60" />
                <input
                  type="text"
                  placeholder="Filter chat list..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full h-8.5 bg-[#f0f0f2] dark:bg-[#111111] border border-transparent rounded-full pl-9 pr-4 text-[11px] font-bold outline-none focus:border-black/[0.08] dark:focus:border-white/[0.08] transition-all duration-200"
                />
              </div>
            </div>

            {/* Contacts list scroll */}
            <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-0.5 bg-white dark:bg-[#0a0a0a]">
              <div className="text-[9.5px] font-bold text-muted-foreground/60 uppercase tracking-wider px-3 py-1.5 flex items-center justify-between">
                <span>Direct Encrypted Channels</span>
                <span className="text-[8px] bg-[#3390ec]/20 text-[#3390ec] dark:text-[#82b1ff] px-1.5 py-0.5 rounded-full font-black">
                  {filteredContacts.length + (activeContact === "Maiko AI" || !searchFilter || "maiko ai".includes(searchFilter.trim().toLowerCase()) ? 1 : 0)}
                </span>
              </div>

              {/* Pinned Maiko AI Chat entry */}
              {(!searchFilter || "maiko ai".includes(searchFilter.trim().toLowerCase())) && (
                <div
                  onClick={() => handleContactSelect("Maiko AI")}
                  className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer border msg-contact-item ${
                    activeContact === "Maiko AI"
                      ? "bg-[#e3f2fd] dark:bg-[#1a1a2e] border-[#3390ec]/20 dark:border-[#2b5278]/40 text-foreground shadow-sm"
                      : "border-transparent hover:bg-[#f6f6f6] dark:hover:bg-[#111111] text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {/* Glowing neon AI ring avatar */}
                  <div className="size-10 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-600 p-0.5 mr-3 flex-shrink-0 shadow-md">
                    <div className="w-full h-full bg-[#17212b] rounded-full flex items-center justify-center text-white">
                      <Sparkles className="size-5 text-cyan-400" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-[12.5px] font-black text-foreground dark:text-gray-200 flex items-center">
                        Maiko AI
                        <VerifiedTick />
                      </span>
                      {maikoMessages.length > 0 && (
                        <span className="text-[9px] text-muted-foreground/60 select-none">
                          {new Date(maikoMessages[maikoMessages.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    {maikoMessages.length > 0 ? (
                      <p className="text-[11.5px] truncate text-muted-foreground dark:text-gray-400 mt-0.5 pr-4 leading-normal">
                        {maikoMessages[maikoMessages.length - 1].plaintext}
                      </p>
                    ) : (
                      <p className="text-[10px] text-cyan-500 font-bold mt-0.5">
                        Ask Maiko anything...
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {filteredContacts.length === 0 ? (
                <div className="text-center py-12 px-4 select-none">
                  <MessageSquare className="size-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-[11.5px] font-black text-muted-foreground/80 leading-normal">
                    {searchFilter ? "No matching contacts found." : "No active E2EE sessions.\nAdd a user above to begin."}
                  </p>
                </div>
              ) : (
                filteredContacts.map((c) => {
                  const isActive = activeContact === c;
                  const contactPfp = pfpsCache[c];
                  
                  // Get messages inside this specific chat thread
                  const threadMsgs = decryptedMessages.filter(
                    msg => (msg.sender === c && msg.recipient === loggedInUser) ||
                           (msg.sender === loggedInUser && msg.recipient === c)
                  );
                  const lastMsg = threadMsgs[threadMsgs.length - 1];

                  return (
                    <div
                      key={c}
                      onClick={() => handleContactSelect(c)}
                      className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer border msg-contact-item ${
                        isActive
                          ? "bg-[#e3f2fd] dark:bg-[#1a1a2e] border-[#3390ec]/20 dark:border-[#2b5278]/40 text-foreground shadow-sm"
                          : "border-transparent hover:bg-[#f6f6f6] dark:hover:bg-[#111111] text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {/* Avatar with deterministic gradient or permanent PFP */}
                      {contactPfp ? (
                        <img src={contactPfp} className="size-10 rounded-full object-cover shadow-sm flex-shrink-0 animate-fade-in" />
                      ) : (
                        <div className={`size-10 rounded-full bg-gradient-to-tr ${getAvatarGradient(c)} text-white flex items-center justify-center font-black text-[14px] shadow-sm flex-shrink-0`}>
                          {c.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="text-[12.5px] font-black truncate text-foreground dark:text-gray-200 flex items-center">
                            {c === "as" ? "AS" : c}
                            {c === "as" && <VerifiedTick />}
                          </span>
                          {lastMsg && (
                            <span className="text-[9px] text-muted-foreground/60 select-none">
                              {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        {lastMsg ? (
                          <p className="text-[11.5px] truncate text-muted-foreground dark:text-gray-400 mt-0.5 pr-4 leading-normal">
                            {lastMsg.plaintext.startsWith("[IMAGE]:") 
                              ? "📷 Image URL" 
                              : lastMsg.plaintext.startsWith("[VIDEO]:") 
                                ? "🎥 Video URL" 
                                : lastMsg.plaintext.startsWith("[FILE]:") 
                                  ? "📁 Document Attachment" 
                                  : lastMsg.plaintext}
                          </p>
                        ) : (
                          <p className="text-[10px] text-emerald-500 italic mt-0.5 flex items-center gap-0.5">
                            <Lock className="size-2.5" />
                            Session keys ready
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ───────────────── LEFT PANEL OVERLAY: MY PROFILE & FEED DRAWER ───────────────── */}
          {showMyFeedDrawer && (
            <div className="absolute inset-y-0 left-0 w-full md:w-[350px] bg-white dark:bg-[#0a0a0a] border-r border-black/[0.05] dark:border-white/[0.04] z-50 flex flex-col min-h-0 animate-slide-in-left select-none">
              {/* Header */}
              <div className="px-4 py-4 border-b border-black/[0.05] dark:border-white/[0.04] flex items-center justify-between bg-[#f6f6f6] dark:bg-[#0d0d0d]">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-emerald-500" />
                  <span className="text-[13px] font-black text-foreground uppercase tracking-wider">My Profile & Feed</span>
                </div>
                <button onClick={() => setShowMyFeedDrawer(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="size-4.5" />
                </button>
              </div>

              {/* Scrollable Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 select-text">
                {/* Profile Section */}
                <div className="text-center space-y-3">
                  <div className="relative group cursor-pointer w-24 h-24 mx-auto" onClick={handlePfpClick}>
                    {myPfpUrl ? (
                      <img src={myPfpUrl} className="size-24 rounded-full object-cover border-2 border-emerald-500/20 shadow-lg" />
                    ) : (
                      <div className={`size-24 rounded-full bg-gradient-to-tr ${getAvatarGradient(loggedInUser)} text-white flex items-center justify-center font-black text-[32px] shadow-lg`}>
                        {loggedInUser.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity select-none">
                      <Camera className="size-5" />
                    </div>
                    {pfpUploading && (
                      <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center text-white select-none">
                        <Loader2 className="size-5 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-[15px] font-black text-foreground leading-tight flex items-center justify-center">
                      {loggedInUser === "as" ? "AS" : loggedInUser}
                      {loggedInUser === "as" && <VerifiedTick />}
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5 select-none">Click photo to update avatar</p>
                  </div>
                </div>

                <hr className="border-border/10 dark:border-[#101921]" />

                {/* Profile Information (DOB & Religion) */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center select-none">
                    <h5 className="text-[11px] font-black text-muted-foreground uppercase tracking-wider">Profile Information</h5>
                    <button
                      onClick={() => {
                        setEditingProfile(!editingProfile);
                        if (!editingProfile && !myReligion) {
                          triggerReligionNote();
                        }
                      }}
                      className="text-[11.5px] font-black text-emerald-500 hover:underline"
                    >
                      {editingProfile ? "Cancel" : "Edit Details"}
                    </button>
                  </div>

                  {editingProfile ? (
                    <form onSubmit={handleUpdateProfile} className="space-y-4 bg-secondary/15 dark:bg-[#101921]/20 p-3.5 rounded-xl border border-border/30 dark:border-transparent">
                      {/* Date of Birth input */}
                      <div className="space-y-1 select-none">
                        <label className="text-[9.5px] font-black uppercase text-muted-foreground tracking-wider block">Date of Birth</label>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={myDob}
                            onChange={(e) => setMyDob(e.target.value)}
                            className="flex-1 h-9 bg-background border border-border/30 dark:border-[#101921] rounded-lg px-2.5 text-[12px] font-bold outline-none focus:border-emerald-500/40"
                          />
                          {myDob && (
                            <button
                              type="button"
                              onClick={() => handleRemoveProfileField("dob")}
                              className="h-9 px-2.5 rounded-lg border border-rose-500/25 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 text-[11px] font-black flex items-center justify-center"
                              title="Remove DOB"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Religion Select input */}
                      <div className="space-y-2 select-none">
                        <label className="text-[9.5px] font-black uppercase text-muted-foreground tracking-wider block">Religious Identity</label>
                        <div className="flex gap-2">
                          <select
                            value={myReligion}
                            onChange={(e) => {
                              setMyReligion(e.target.value);
                              if (e.target.value !== "Christianity") {
                                setMySubReligion("");
                              }
                              triggerReligionNote();
                            }}
                            className="flex-1 h-9 bg-background border border-border/30 dark:border-[#101921] rounded-lg px-2 text-[12px] font-bold outline-none focus:border-emerald-500/40"
                          >
                            <option value="">-- Choose Identity (Optional) --</option>
                            <option value="Atheism">Atheism</option>
                            <option value="Agnosticism">Agnosticism</option>
                            <option value="Christianity">Christianity</option>
                            <option value="Buddhism">Buddhism</option>
                            <option value="Judaism">Judaism</option>
                            <option value="Other">Other</option>
                          </select>

                          {myReligion && (
                            <button
                              type="button"
                              onClick={() => handleRemoveProfileField("religion")}
                              className="h-9 px-2.5 rounded-lg border border-rose-500/25 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 text-[11px] font-black flex items-center justify-center"
                              title="Remove Religion"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          )}
                        </div>

                        {/* Nested Christianity Select list */}
                        {myReligion === "Christianity" && (
                          <div className="pl-2 border-l-2 border-emerald-500/30 space-y-1 bg-background/40 p-2 rounded-r-lg">
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block">Denomination</span>
                            <select
                              value={mySubReligion}
                              onChange={(e) => setMySubReligion(e.target.value)}
                              required
                              className="w-full h-8 bg-background border border-border/30 dark:border-[#101921] rounded-lg px-2 text-[11px] font-bold outline-none focus:border-emerald-500/40"
                            >
                              <option value="">-- Choose Denomination --</option>
                              <option value="Catholicism">Catholicism</option>
                              <option value="Eastern Orthodoxy">Eastern Orthodoxy</option>
                              <option value="Oriental Orthodoxy">Oriental Orthodoxy</option>
                              <option value="Protestantism">Protestantism</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="w-full h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[12px] font-black transition-all flex items-center justify-center gap-1.5"
                      >
                        {profileSaving ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle className="size-3.5" />}
                        <span>Save Profile Details</span>
                      </button>
                    </form>
                  ) : (
                    // Display mode in My Profile Drawer
                    <div className="bg-secondary/15 dark:bg-[#101921]/10 p-3 rounded-xl border border-border/20 space-y-2.5 text-[12.5px] font-bold">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase text-muted-foreground font-black">Date of Birth</span>
                        <span className="text-foreground">
                          {myDob ? new Date(myDob).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" }) : "Not specified"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase text-muted-foreground font-black">Religion</span>
                        <span className="text-foreground">
                          {myReligion ? (mySubReligion ? `${myReligion} (${mySubReligion})` : myReligion) : "Not specified"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <hr className="border-border/10 dark:border-[#101921]" />

                {/* Create Feed Post Form */}
                <div className="space-y-3 select-none">
                  <h5 className="text-[11px] font-black text-muted-foreground uppercase tracking-wider">Post to my Profile Feed</h5>
                  <form onSubmit={handleCreatePost} className="space-y-3 bg-secondary/15 dark:bg-[#101921]/20 p-3 rounded-xl border border-border/30 dark:border-transparent">
                    <textarea
                      placeholder="Write what's on your mind... (optional if media attached)"
                      value={newPostText}
                      onChange={(e) => setNewPostText(e.target.value)}
                      className="w-full min-h-[60px] bg-background border border-border/30 dark:border-[#101921] rounded-lg p-2 text-[12px] font-bold outline-none focus:border-emerald-500/40 resize-none"
                    />

                    {newPostMediaUrl && (
                      <div className="relative rounded-lg overflow-hidden border border-border/30 max-h-[220px] bg-black/15 flex items-center justify-center">
                        {newPostMediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                          <video src={newPostMediaUrl} className="w-full h-auto max-h-[220px] object-contain" />
                        ) : (
                          <img src={newPostMediaUrl} alt="Attached Media" className="w-full h-auto max-h-[220px] object-contain" />
                        )}
                        <button
                          type="button"
                          onClick={() => setNewPostMediaUrl("")}
                          className="absolute top-1.5 right-1.5 size-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <button
                        type="button"
                        onClick={handleFeedMediaClick}
                        disabled={postUploading}
                        className="h-8 px-2.5 rounded-lg border border-border hover:bg-secondary dark:hover:bg-[#202b36] flex items-center gap-1 text-[11px] font-black"
                      >
                        <Paperclip className="size-3.5" />
                        <span>Add Media</span>
                      </button>

                      <button
                        type="submit"
                        disabled={postUploading || (!newPostText.trim() && !newPostMediaUrl.trim())}
                        className="h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[11px] font-black transition-all flex items-center gap-1"
                      >
                        {postUploading ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                        <span>Publish</span>
                      </button>
                    </div>
                  </form>
                </div>

                <hr className="border-border/10 dark:border-[#101921]" />

                {/* My Posts Timeline */}
                <div className="space-y-3">
                  <h5 className="text-[11px] font-black text-muted-foreground uppercase tracking-wider select-none">My Feed Timeline</h5>
                  {myFeedLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : myFeedPosts.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground italic text-center py-4 select-none">No posts published yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {myFeedPosts.map(post => renderFeedPostItem(post, true))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ───────────────── RIGHT PANEL: CHAT TIMELINE ───────────────── */}
          <div className={`flex-1 flex flex-col min-h-0 bg-[#e7ebf0] dark:bg-[#050505] relative ${
            mobileView === "list" ? "hidden md:flex" : "flex"
          }`}
          style={{
            backgroundImage: theme === "dark" 
              ? "radial-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px)"
              : "radial-gradient(rgba(0, 0, 0, 0.04) 1.2px, transparent 1.2px)",
            backgroundSize: "22px 22px"
          }}>
            {activeContact ? (
              <div className="flex-1 flex flex-col min-h-0 relative">
                
                {/* Chat window Header */}
                <div className="px-4 py-3.5 border-b border-black/[0.05] dark:border-white/[0.04] flex items-center justify-between bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl flex-shrink-0 select-none shadow-sm relative z-20">
                  <div className="flex items-center min-w-0 cursor-pointer" onClick={() => setShowInfoDrawer(!showInfoDrawer)}>
                    {/* Back Button for mobile view layout */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMobileView("list");
                      }}
                      className="md:hidden size-8.5 rounded-full hover:bg-secondary dark:hover:bg-[#202b36] flex items-center justify-center active:scale-95 transition-all mr-2 flex-shrink-0 text-foreground"
                    >
                      <ChevronLeft className="size-6" />
                    </button>
                    
                    {isMaiko ? (
                      <div className="size-10 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-600 p-0.5 mr-3 flex-shrink-0 shadow-md">
                        <div className="w-full h-full bg-[#17212b] rounded-full flex items-center justify-center text-white">
                          <Sparkles className="size-5 text-cyan-400" />
                        </div>
                      </div>
                    ) : pfpsCache[activeContact] ? (
                      <img src={pfpsCache[activeContact]} className="size-10 rounded-full object-cover shadow-sm flex-shrink-0 mr-3 hover:opacity-90 animate-fade-in" />
                    ) : (
                      <div className={`size-10 rounded-full bg-gradient-to-tr ${getAvatarGradient(activeContact)} text-white flex items-center justify-center font-black text-[14px] shadow-sm flex-shrink-0 mr-3 hover:opacity-90`}>
                        {activeContact ? activeContact.charAt(0).toUpperCase() : ""}
                      </div>
                    )}
                    
                    <div className="truncate">
                      <h3 className="text-[13.5px] font-black leading-tight text-foreground dark:text-gray-100 truncate flex items-center gap-1">
                        {isMaiko ? "Maiko AI" : activeContact === "as" ? "AS" : activeContact}
                        {isMaiko || activeContact === "as" ? <VerifiedTick /> : <Info className="size-3.5 text-muted-foreground opacity-60" />}
                      </h3>
                      <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-500 tracking-wide uppercase mt-1">
                        {isMaiko ? (
                          <>
                            <span className="size-1.5 rounded-full bg-cyan-500 inline-block animate-pulse" />
                            <span className="text-cyan-500">Verified AI Assistant</span>
                          </>
                        ) : activeContact === "as" ? (
                          <>
                            <span className="size-1.5 rounded-full bg-cyan-500 inline-block animate-pulse" />
                            <span className="text-cyan-500">Owner / Administrator</span>
                          </>
                        ) : (
                          <>
                            <span className="size-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                            <span>AES Secure Channel</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Search Messages Icon Toggle (Hidden for Maiko) */}
                    {!isMaiko && (
                      <button
                        onClick={() => setShowMsgSearch(!showMsgSearch)}
                        className={`size-9 rounded-full flex items-center justify-center active:scale-90 transition-all ${
                          showMsgSearch 
                            ? "bg-[#3390ec]/20 text-[#3390ec]" 
                            : "hover:bg-secondary dark:hover:bg-[#202b36] text-muted-foreground"
                        }`}
                        title="Search messages"
                      >
                        <Search className="size-4.5" />
                      </button>
                    )}

                    <div className="hidden sm:flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider select-none">
                      <ShieldCheck className="size-3.5" />
                      <span>Zero-Knowledge</span>
                    </div>
                    
                    {/* Secure badge indicator */}
                    <ShieldCheck className="size-5.5 text-emerald-500 flex-shrink-0 animate-pulse" />
                  </div>
                </div>

                {/* Inline Message Search Bar */}
                {showMsgSearch && !isMaiko && (
                  <div className="px-4 py-2 bg-white/95 dark:bg-[#0a0a0a]/95 border-b border-black/[0.05] dark:border-white/[0.04] flex items-center gap-2 select-none relative z-10 animate-slide-in">
                    <Search className="size-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search messages in this thread..."
                      value={msgSearchQuery}
                      onChange={(e) => setMsgSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent text-[12px] font-bold outline-none text-foreground"
                      autoFocus
                    />
                    {msgSearchQuery && (
                      <button onClick={() => setMsgSearchQuery("")} className="text-[10px] font-black text-muted-foreground hover:text-foreground">
                        Clear
                      </button>
                    )}
                  </div>
                )}

                {/* Chat Timeline Scroll container */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 min-h-0">
                  {renderMessageTimeline()}
                  <div ref={chatEndRef} />
                </div>

                {/* Floating Emoji Picker Popover overlay */}
                {showEmojiPicker && (
                  <div className="mx-4 p-3 bg-white dark:bg-[#0a0a0a] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl shadow-xl flex flex-wrap gap-2 select-none z-30 relative animate-spring-scale">
                    <div className="w-full flex justify-between items-center text-[10px] font-bold text-muted-foreground px-1 pb-1">
                      <span>Quick Emojis</span>
                      <button onClick={() => setShowEmojiPicker(false)}>
                        <X className="size-3.5" />
                      </button>
                    </div>
                    {emojiList.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-lg hover:scale-125 hover:bg-[#eaeaea] dark:hover:bg-[#1a1a1a] p-1.5 rounded-lg transition-transform duration-150"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Telegram-Style Floating message input bar */}
                <div className="p-3 sm:p-4 bg-white/90 dark:bg-[#0a0a0a]/90 border-t border-black/[0.05] dark:border-white/[0.04] backdrop-blur-xl flex-shrink-0 relative z-10">
                  <div className="max-w-4xl mx-auto flex items-center gap-2 relative">
                    
                    {/* Attach media button (Hidden for Maiko AI) */}
                    {!isMaiko && (
                      <button
                        type="button"
                        onClick={handleMediaClick}
                        disabled={mediaUploading}
                        title="Attach File (Cloud Storage)"
                        className="size-9.5 rounded-full hover:bg-secondary dark:hover:bg-[#202b36] text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors flex-shrink-0 active:scale-95 disabled:opacity-50"
                      >
                        {mediaUploading ? (
                          <Loader2 className="size-4.5 animate-spin" />
                        ) : (
                          <Paperclip className="size-5" />
                        )}
                      </button>
                    )}

                    {/* Emoji toggle icon */}
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`size-9.5 rounded-full flex items-center justify-center transition-colors flex-shrink-0 active:scale-95 ${
                        showEmojiPicker ? "bg-secondary dark:bg-[#202b36] text-[#3390ec]" : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Emojis Picker"
                    >
                      <Smile className="size-5.5" />
                    </button>

                    <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-2">
                      <div className="flex-1 bg-[#f0f0f2] dark:bg-[#111111] border border-black/[0.06] dark:border-white/[0.06] rounded-[22px] flex items-center py-1 pl-4 pr-1.5 msg-input-bar">
                        <input
                          type="text"
                          placeholder={isMaiko ? "Ask Maiko AI..." : "Write encrypted message..."}
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          className="flex-1 min-w-0 bg-transparent text-[13px] text-foreground font-bold outline-none py-1.5 focus:ring-0 placeholder:text-muted-foreground/60"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={sendLoading || !messageInput.trim()}
                        className="size-9.5 rounded-full bg-[#3390ec] dark:bg-[#2b5278] hover:scale-[1.05] active:scale-[0.95] disabled:opacity-40 text-white flex items-center justify-center shadow-md shadow-black/10 transition-all flex-shrink-0"
                      >
                        {sendLoading ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Send className="size-4.5" />
                        )}
                      </button>
                    </form>
                  </div>
                </div>

                {/* ───────────────── RIGHT PANEL: CONTACT INFORMATION DRAWER ───────────────── */}
                {showInfoDrawer && (
                  <div className="w-80 border-l border-black/[0.05] dark:border-white/[0.04] bg-white dark:bg-[#0a0a0a] flex flex-col h-full z-30 select-none absolute right-0 top-0 shadow-2xl animate-slide-in">
                    {/* Drawer Header */}
                    <div className="px-4 py-4 border-b border-black/[0.05] dark:border-white/[0.04] flex items-center justify-between">
                      <span className="text-[13px] font-black text-foreground uppercase tracking-wider">
                        {isMaiko ? "AI Profile" : "Contact Info"}
                      </span>
                      <button onClick={() => setShowInfoDrawer(false)} className="text-muted-foreground hover:text-foreground">
                        <X className="size-4.5" />
                      </button>
                    </div>

                    {/* Drawer Content */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-6">
                      
                      {isMaiko ? (
                        /* Maiko AI Profile Details Drawer */
                        <div className="space-y-6 select-text">
                          <div className="text-center space-y-3 select-none">
                            <div className="size-24 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-600 p-0.5 shadow-lg mx-auto animate-pulse">
                              <div className="w-full h-full bg-white dark:bg-[#0a0a0a] rounded-full flex items-center justify-center text-white">
                                <Sparkles className="size-10 text-cyan-400" />
                              </div>
                            </div>
                            <div>
                              <h4 className="text-[16px] font-black text-foreground leading-tight flex items-center justify-center">
                                Maiko AI
                                <VerifiedTick />
                              </h4>
                              <p className="text-[10px] text-cyan-500 font-bold uppercase tracking-wider mt-1">System Assistant</p>
                            </div>
                          </div>

                          <hr className="border-border/10 dark:border-[#101921]" />

                          <div className="bg-secondary/35 dark:bg-[#101921]/30 rounded-xl p-3.5 space-y-2.5 border border-border/10 text-[12.5px] font-bold">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] uppercase text-muted-foreground font-black">
                                Status
                              </span>
                              <span className="text-cyan-500 flex items-center gap-1">
                                <span className="size-1.5 rounded-full bg-cyan-500 inline-block animate-pulse" />
                                Online & Active
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] uppercase text-muted-foreground font-black">
                                Verified Level
                              </span>
                              <span className="text-foreground dark:text-gray-200">
                                Verified Account
                              </span>
                            </div>
                          </div>

                          <p className="text-[12px] font-medium leading-relaxed text-muted-foreground">
                            Maiko AI is a custom artificial intelligence companion integrated directly into the SHS messenger.
                            Your chats with Maiko AI are stored locally on your device.
                          </p>

                          <button
                            onClick={() => {
                              if (confirm("Are you sure you want to clear your conversation history with Maiko AI?")) {
                                setMaikoMessages([]);
                                localStorage.removeItem("maiko_ai_messages_" + loggedInUser);
                                setShowInfoDrawer(false);
                              }
                            }}
                            className="w-full h-9 rounded-lg border border-rose-500/25 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 text-[11px] font-black flex items-center justify-center gap-1.5 transition-colors select-none"
                          >
                            <Trash2 className="size-4" />
                            Clear Conversation
                          </button>
                        </div>
                      ) : (
                        /* Standard Peer Profile (DOB & Religion & Fingerprint & Feed) */
                        <div className="space-y-6 select-text">
                          <div className="text-center space-y-3">
                            {pfpsCache[activeContact] ? (
                              <img src={pfpsCache[activeContact]} className="size-24 rounded-full object-cover border-2 border-emerald-500/20 shadow-lg mx-auto" />
                            ) : (
                              <div className={`size-24 rounded-full bg-gradient-to-tr ${getAvatarGradient(activeContact)} text-white flex items-center justify-center font-black text-[32px] shadow-lg mx-auto`}>
                                {activeContact ? activeContact.charAt(0).toUpperCase() : ""}
                              </div>
                            )}
                            <div>
                              <h4 className="text-[16px] font-black text-foreground leading-tight flex items-center justify-center">
                                {activeContact === "as" ? "AS" : activeContact}
                                {activeContact === "as" && <VerifiedTick />}
                              </h4>
                              <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${bannedCache[activeContact] ? "text-rose-500" : "text-emerald-500"}`}>
                                {bannedCache[activeContact] ? "⚠️ Account Banned" : activeContact === "as" ? "Owner / Administrator" : "E2EE Verified Node"}
                              </p>
                            </div>
                          </div>

                          <hr className="border-border/10 dark:border-[#101921]" />

                          {/* Peer Details Panel (DOB & Religion) */}
                          {(dobsCache[activeContact] || religionsCache[activeContact]) && (
                            <div className="bg-secondary/35 dark:bg-[#101921]/30 rounded-xl p-3.5 space-y-2.5 border border-border/10 text-[12.5px] font-bold">
                              {dobsCache[activeContact] && (
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] uppercase text-muted-foreground font-black flex items-center gap-1">
                                    🎂 DOB
                                  </span>
                                  <span className="text-foreground dark:text-gray-200">
                                    {new Date(dobsCache[activeContact]).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })}
                                  </span>
                                </div>
                              )}
                              {religionsCache[activeContact] && (
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] uppercase text-muted-foreground font-black flex items-center gap-1">
                                    🕊️ Religion
                                  </span>
                                  <span className="text-foreground dark:text-gray-200 truncate max-w-[150px]" title={religionsCache[activeContact]}>
                                    {religionsCache[activeContact]}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          <hr className="border-border/10 dark:border-[#101921]" />

                          {/* E2EE Fingerprint Key */}
                          <div className="space-y-2">
                            <h5 className="text-[11px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                              <Key className="size-3.5 text-emerald-500" />
                              Security Fingerprint
                            </h5>
                            
                            {fingerprintCache[activeContact] ? (
                              <div className="bg-secondary/50 dark:bg-[#0e1621] border border-border/30 dark:border-[#101921] rounded-xl p-3.5 space-y-3 select-text">
                                <code className="text-[10.5px] font-black block text-center break-words font-mono leading-relaxed tracking-wider">
                                  {fingerprintCache[activeContact]}
                                </code>
                                <button
                                  onClick={copyPeerFingerprint}
                                  className="w-full h-8.5 rounded-lg border border-border hover:bg-secondary dark:hover:bg-[#202b36] flex items-center justify-center gap-1.5 text-[11px] font-black transition-all select-none"
                                >
                                  {copiedFingerprint ? (
                                    <>
                                      <CheckCircle className="size-3.5 text-emerald-500" />
                                      <span>Copied Fingerprint</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="size-3.5 text-muted-foreground" />
                                      <span>Copy Fingerprint</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            ) : (
                              <div className="text-[11px] text-muted-foreground py-2 italic">
                                Generating fingerprint...
                              </div>
                            )}
                            
                            <p className="text-[9.5px] text-muted-foreground leading-normal mt-1">
                              This numeric fingerprint represents a SHA-256 hash of {activeContact}'s ECDH P-256 public key.
                            </p>
                          </div>

                          <hr className="border-border/10 dark:border-[#101921]" />

                          {/* Peer Feed Section */}
                          <div className="space-y-3">
                            <h5 className="text-[11px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1 select-none">
                              <ImageIcon className="size-3.5 text-emerald-500" />
                              @{activeContact}'s Feed & Posts
                            </h5>

                            {feedLoading ? (
                              <div className="flex justify-center py-6 select-none">
                                <Loader2 className="size-5 animate-spin text-muted-foreground" />
                              </div>
                            ) : peerFeedPosts.length === 0 ? (
                              <p className="text-[11px] text-muted-foreground italic text-center py-4 select-none">
                                No posts shared on profile yet.
                              </p>
                            ) : (
                              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                                {peerFeedPosts.map(post => renderFeedPostItem(post, false))}
                              </div>
                            )}
                          </div>

                          {/* Owner Administration controls (Banning/Deleting Users) */}
                          {loggedInUser === "as" && activeContact !== "as" && (
                            <>
                              <hr className="border-border/10 dark:border-[#101921]" />
                              
                              <div className="space-y-3">
                                <h5 className="text-[11px] font-black text-rose-500 uppercase tracking-wider flex items-center gap-1 select-none">
                                  🛡️ Owner Administration
                                </h5>

                                <div className="space-y-2.5">
                                  {bannedCache[activeContact] ? (
                                    <button
                                      onClick={() => {
                                        handleOwnerAction("unban", activeContact).then(() => {
                                          setBannedCache(prev => ({ ...prev, [activeContact]: false }));
                                        });
                                      }}
                                      disabled={actionLoading}
                                      className="w-full h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[11px] font-black flex items-center justify-center gap-1.5 transition-all select-none shadow-sm"
                                    >
                                      {actionLoading ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                                      Unban Account
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        handleOwnerAction("ban", activeContact).then(() => {
                                          setBannedCache(prev => ({ ...prev, [activeContact]: true }));
                                        });
                                      }}
                                      disabled={actionLoading}
                                      className="w-full h-9 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-[11px] font-black flex items-center justify-center gap-1.5 transition-all select-none shadow-sm"
                                    >
                                      {actionLoading ? <Loader2 className="size-4 animate-spin" /> : <AlertCircle className="size-4" />}
                                      Ban User Account
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleOwnerAction("delete", activeContact)}
                                    disabled={actionLoading}
                                    className="w-full h-9 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-[11px] font-black flex items-center justify-center gap-1.5 transition-all select-none shadow-sm"
                                  >
                                    {actionLoading ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                                    Delete User Profile & Chats
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                )}

              </div>
            ) : (
              // Desktop empty state
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none space-y-3">
                <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center shadow-sm">
                  <MessageSquare className="size-7.5 text-emerald-500/40 animate-pulse" />
                </div>
                <div>
                  <p className="text-[14px] font-black text-foreground">Secure Chats Terminal</p>
                  <p className="text-[11px] text-muted-foreground max-w-[260px] mx-auto mt-0.5 leading-normal">
                    Select a secure session from the channels list on the left, or add a contact to start messaging.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Swipeable Note Pop-up */}
      {showReligionNote && (
        <div
          className="fixed top-6 left-4 right-4 md:left-0 md:right-0 mx-auto max-w-sm z-[200] select-none active:cursor-grabbing cursor-grab"
          style={{
            transform: `translateX(${noteSwipeOffset}px) rotate(${noteSwipeOffset * 0.03}deg)`,
            opacity: Math.max(0, 1 - Math.abs(noteSwipeOffset) / 200),
            transition: isSwipingNote ? "none" : "transform 0.3s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.3s ease"
          }}
          onTouchStart={(e) => handleNoteDragStart(e.touches[0].clientX)}
          onTouchMove={(e) => handleNoteDragMove(e.touches[0].clientX)}
          onTouchEnd={handleNoteDragEnd}
          onMouseDown={(e) => handleNoteDragStart(e.clientX)}
          onMouseMove={(e) => {
            if (e.buttons === 1) handleNoteDragMove(e.clientX);
          }}
          onMouseUp={handleNoteDragEnd}
          onMouseLeave={handleNoteDragEnd}
        >
          <div className="bg-[#0b0c0d] text-white rounded-2xl border border-zinc-800/80 p-4.5 shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-lg flex items-start gap-3.5">
            <div className="size-8.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 text-amber-500/90 shadow-inner">
              <Info className="size-4 animate-pulse" />
            </div>
            
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-1.5 select-none">
                <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800/60">
                  System Notice
                </span>
                <span className="text-[8.5px] text-zinc-500 font-bold select-none">• E2EE Secured</span>
              </div>
              
              <p className="text-[12px] font-medium leading-relaxed text-zinc-200 pr-1">
                We respect all the religions but recognize only a few of them.
              </p>
              
              <div className="flex items-center gap-1 text-[8.5px] font-semibold text-zinc-500 select-none pt-0.5">
                <span>← Swipe left or right to dismiss</span>
                <span>•</span>
                <span>Auto-hides in 8s →</span>
              </div>
            </div>

            <button
              onClick={() => setShowReligionNote(false)}
              className="text-zinc-500 hover:text-white transition-colors duration-150 flex-shrink-0 -mt-1 -mr-1 p-1 rounded-lg hover:bg-zinc-900"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Pending Media Caption Modal */}
      {pendingMediaFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-sm bg-[#0a0a0a] border border-white/[0.06] rounded-[24px] p-5 shadow-2xl flex flex-col space-y-4 animate-spring-scale select-text">
            <div className="flex justify-between items-center select-none">
              <span className="text-[13px] font-black uppercase text-muted-foreground tracking-wider">Send Media Attachment</span>
              <button onClick={() => { setPendingMediaFile(null); setMediaCaptionInput(""); }} className="text-muted-foreground hover:text-foreground">
                <X className="size-4.5" />
              </button>
            </div>

            {/* Media Preview */}
            <div className="rounded-xl overflow-hidden max-h-[200px] bg-black/10 flex items-center justify-center border border-border/20 select-none">
              {pendingMediaFile.type.startsWith("image/") ? (
                <img src={URL.createObjectURL(pendingMediaFile)} className="max-h-[200px] object-contain w-full h-auto" />
              ) : pendingMediaFile.type.startsWith("video/") ? (
                <video src={URL.createObjectURL(pendingMediaFile)} className="max-h-[200px] object-contain w-full h-auto" />
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Paperclip className="size-10 mx-auto mb-2 text-emerald-500/40" />
                  <p className="text-[12px] font-bold truncate max-w-[200px]">{pendingMediaFile.name}</p>
                </div>
              )}
            </div>

            {/* Caption Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block select-none">Add a Caption (Optional)</label>
              <textarea
                placeholder="Write an optional caption..."
                value={mediaCaptionInput}
                onChange={(e) => setMediaCaptionInput(e.target.value)}
                className="w-full h-16 bg-secondary/30 dark:bg-[#0e1621] border border-border/30 dark:border-transparent rounded-xl p-3 text-[12.5px] font-bold outline-none focus:border-emerald-500/40 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end select-none">
              <button
                onClick={() => { setPendingMediaFile(null); setMediaCaptionInput(""); }}
                className="h-10 px-4 rounded-xl border border-border hover:bg-secondary dark:hover:bg-[#202b36] text-[12px] font-black"
              >
                Cancel
              </button>
              <button
                onClick={confirmMediaUploadAndSend}
                disabled={mediaUploading}
                className="h-10 px-5 rounded-xl bg-[#3390ec] dark:bg-[#2b5278] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 text-white text-[12px] font-black transition-all flex items-center gap-1.5"
              >
                {mediaUploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Send className="size-3.5" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-10 bg-white dark:bg-[#050505] border-t border-black/[0.05] dark:border-white/[0.04] flex-shrink-0 flex items-center justify-between px-4 select-none z-10">
        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-muted-foreground truncate mr-2">
          <ShieldCheck className="size-3.5 text-emerald-500 flex-shrink-0" />
          <span className="truncate">ECDH P-256 Key Exchange • AES-GCM 256 Payload Encryption</span>
        </div>
        <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
          E2EE Live Node
        </span>
      </div>
    </main>
  );
}
