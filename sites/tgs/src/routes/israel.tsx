import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Play,
  Pause,
  BookOpen,
  Sparkles,
  Compass,
  History,
  Shield,
  Scroll,
  Calendar,
  Feather,
  FileText,
  ExternalLink,
  BookMarked,
  Download,
  Star,
  ListFilter,
  Crown,
  MapPin,
  Flame,
  Globe,
  Sun
} from "lucide-react";

export const Route = createFileRoute("/israel")({
  head: () => ({
    meta: [
      { title: "Way to Israel — Complete History, Sacred Scriptures & Jewish Heritage" },
      { name: "description", content: "Exhaustive history of Israel through Jewish experience, sacred Tanakh & Torah PDFs, culture, and heritage." },
    ],
  }),
  component: WayToIsraelPage,
});

function StarOfDavidIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="12,2.5 20.23,16.75 3.77,16.75" />
      <polygon points="12,21.5 20.23,7.25 3.77,7.25" />
    </svg>
  );
}

function WayToIsraelPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<"history" | "texts" | "culture">("history");
  const [historyViewMode, setHistoryViewMode] = useState<"interactive" | "full">("interactive");
  const [selectedPart, setSelectedPart] = useState<number | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const sacredTexts = [
    {
      title: "The Tanakh (Hebrew Bible)",
      subtitle: "Torah, Nevi'im (Prophets) & Ketuvim (Writings)",
      pdfUrl: "https://ferrusca.wordpress.com/wp-content/uploads/2016/11/thetanakh.pdf",
      desc: "The complete 24-book canon of the Hebrew Scriptures translated into English. Encompasses foundational law, historical chronicles of ancient Israel, poetic psalms, and prophetic literature.",
      category: "Canonical Scripture",
      badgeColor: "bg-blue-500/10 text-sky-400 border-blue-500/20"
    },
    {
      title: "The Torah (Five Books of Moses)",
      subtitle: "Genesis, Exodus, Leviticus, Numbers & Deuteronomy",
      pdfUrl: "https://www.betemunah.org/Torah.pdf",
      desc: "The sacred centerpiece of Jewish law and spiritual guidance, revealed at Mount Sinai. Contains the origins of creation, the patriarchs, the Exodus, and the 613 Mitzvot.",
      category: "Foundational Law",
      badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
    }
  ];

  const historyParts = [
    {
      part: "Part I",
      period: "c. 2000 BCE – 586 BCE",
      title: "The Biblical Foundations & First Temple Era",
      summary: "The patriarchal covenant with Abraham, enslavement in Egypt, the Exodus, Mount Sinai revelation, King David's kingdom in Jerusalem, King Solomon's First Temple, and the Babylonian Exile.",
      sections: [
        {
          heading: "The Patriarchal Age & The Divine Covenant (Brit)",
          content: "Jewish history begins nearly 4,000 years ago in the Fertile Crescent with Abraham, his son Isaac, and grandson Jacob. Summoned by God from Ur of the Chaldeans to Canaan, Abraham established ethical monotheism bound by an eternal Brit (covenant). Jacob was renamed Israel ('he who strives with God') and fathered twelve sons who became the Twelve Tribes of Israel."
        },
        {
          heading: "Slavery in Egypt, Exodus & Mount Sinai",
          content: "Seeking relief from famine, Jacob's family settled in Egypt. Over centuries, they grew into a nation and were enslaved by Pharaoh. Under Moses, God liberated the Children of Israel in the miraculous Exodus (Pesach). At Mount Sinai, the nation experienced divine revelation, receiving the Ten Commandments and the Torah—establishing their moral code."
        },
        {
          heading: "Conquest of Canaan, Joshua & Era of Judges",
          content: "Following 40 years of wilderness wandering, Joshua led the Israelites across the Jordan River to reclaim Canaan. For two centuries, the tribes governed under decentralized spiritual and military leaders known as Judges (Shofetim)—including Deborah, Gideon, and Samson."
        },
        {
          heading: "The United Monarchy: Saul, David & Solomon",
          content: "Facing Philistine threats, the tribes united under King Saul (c. 1020 BCE). King David (c. 1004 BCE) unified the tribes, captured Zion, and established Jerusalem as the eternal capital. His son, King Solomon (c. 965 BCE), constructed the First Temple on Mount Moriah, creating the spiritual heart of the Jewish people."
        },
        {
          heading: "Divided Kingdoms & Babylonian Exile (586 BCE)",
          content: "After Solomon's death, the kingdom divided into Israel (North) and Judah (South). Prophets like Elijah, Isaiah, and Jeremiah called for ethical purity. In 722 BCE, Assyria conquered the Northern Kingdom. In 586 BCE, Babylonian King Nebuchadnezzar destroyed Jerusalem and the First Temple, exiling the Jews to Babylon where synagogue worship and Talmudic study were born."
        }
      ]
    },
    {
      part: "Part II",
      period: "c. 538 BCE – 70 CE",
      title: "The Second Temple Period & Roman Siege",
      summary: "Return to Zion under Persian King Cyrus, rebuilding of the Temple, Maccabean Revolt (Hanukkah), Roman occupation, Great Jewish Revolt, and the destruction of 70 CE.",
      sections: [
        {
          heading: "Return to Zion & Cyrus the Great's Edict",
          content: "In 538 BCE, Cyrus the Great of Persia conquered Babylon and issued a royal decree permitting Jewish exiles to return to Eretz Yisrael. Under Zerubbabel, Ezra, and Nehemiah, the Jews rebuilt Jerusalem's walls and constructed the Second Temple, renewing covenantal life."
        },
        {
          heading: "Hellenistic Rule & The Maccabean Revolt (165 BCE)",
          content: "Alexander the Great brought Greek rule in 332 BCE. When Seleucid Emperor Antiochus IV Epiphanes outlawed Jewish practice and desecrated the Temple, Judah the Maccabee led the Hasmonean Revolt. In 165 BCE, the Maccabees liberated Jerusalem and rededicated the Temple—a victory celebrated annually on Hanukkah."
        },
        {
          heading: "Hasmonean Dynasty & Herod the Great",
          content: "The Maccabees established the sovereign Hasmonean Kingdom. In 63 BCE, Roman general Pompey intervened in Judean succession, subjecting the land to Roman vassalage. King Herod later expanded the Second Temple into an architectural wonder of the ancient world."
        },
        {
          heading: "The Great Jewish Revolt & Destruction of Jerusalem (70 CE)",
          content: "Heavy Roman taxation and religious suppression ignited the First Jewish-Roman War in 66 CE. Roman legions under Vespasian and Titus besieged Jerusalem. In the summer of 70 CE (9th of Av / Tisha B'Av), Roman troops breached the walls and burned the Second Temple to the ground."
        },
        {
          heading: "Bar Kokhba Revolt & The Great Dispersion (132–135 CE)",
          content: "Simon Bar Kokhba led a fierce second rebellion against Emperor Hadrian. Upon crushing it in 135 CE, Rome slaughtered hundreds of thousands of Jews, renamed Judea 'Syria Palaestina' to erase Jewish memory, and banned Jews from entering Jerusalem—initiating 1,900 years of global Diaspora."
        }
      ]
    },
    {
      part: "Part III",
      period: "70 CE – 19th Century",
      title: "The Long Exile & Rise of Modern Zionism",
      summary: "Shift to Rabbinic Judaism, Mishnah & Talmud compilation, Ashkenazi and Sephardic cultural centers, centuries of persecutions, and Theodor Herzl's Zionist movement.",
      sections: [
        {
          heading: "Yavneh & Rabbinic Transformation",
          content: "Before Jerusalem's fall, Rabbi Yochanan ben Zakkai established an academy at Yavneh, shifting Judaism from Temple sacrifices to synagogue prayer, deeds of lovingkindness (Chesed), and Torah study. Rabbi Judah the Prince compiled the Mishnah (c. 200 CE), forming the foundation of the Babylonian and Jerusalem Talmud."
        },
        {
          heading: "Ashkenazim & Sephardim Flourishing",
          content: "Jewish exile branched into distinct traditions: Sephardim in Islamic Spain & North Africa (enjoying a Golden Age under Maimonides / Rambam and Yehuda Halevi) and Ashkenazim in Franco-Germany & Eastern Europe (guided by commentators like Rashi)."
        },
        {
          heading: "Centuries of Persecution & Expulsions",
          content: "Jewish communities endured severe trials: Crusader massacres (1096), blood libels, expulsions from England (1290), France (1394), and Spain (1492), followed by 17th-century Chmielnicki pogroms and confinement to the Tsarist Pale of Settlement."
        },
        {
          heading: "Theodor Herzl & Political Zionism (1897)",
          content: "Confronted by relentless European antisemitism (highlighted by the Dreyfus Affair), Austrian journalist Theodor Herzl authored 'Der Judenstaat' (The Jewish State). In 1897, Herzl convened the First Zionist Congress in Basel, Switzerland, organizing the national movement to restore Jewish sovereignty in Eretz Yisrael."
        }
      ]
    },
    {
      part: "Part IV",
      period: "19th Century – 1948",
      title: "The Road to Statehood & The Holocaust",
      summary: "Waves of Aliyah pioneers, Hebrew language revival, Balfour Declaration (1917), British Mandate, the tragedy of the Holocaust (Shoah), UN Partition Plan, and May 14, 1948 Declaration of Independence.",
      sections: [
        {
          heading: "Aliyah Waves & Revival of Modern Hebrew",
          content: "Starting in 1882, Jewish idealists (Halutzim) returned in waves of Aliyah to drain malarial swamps, plant forests, and establish cooperative agricultural communes (Kibbutzim). Linguist Eliezer Ben-Yehuda accomplished the unprecedented feat of reviving biblical Hebrew into a modern spoken language."
        },
        {
          heading: "Balfour Declaration & British Mandate (1917–1947)",
          content: "On November 2, 1917, British Foreign Secretary Arthur Balfour issued the Balfour Declaration expressing official support for 'a national home for the Jewish people' in Palestine. The League of Nations formally assigned the British Mandate in 1922."
        },
        {
          heading: "The Holocaust / Shoah (1939–1945)",
          content: "During World War II, Nazi Germany systematically murdered six million European Jews—one third of world Jewry—in industrialized death camps. This unparalleled tragedy demonstrated with absolute finality the existential imperative for an independent Jewish state capable of defending Jewish lives."
        },
        {
          heading: "UN Resolution 181 & Declaration of Independence (1948)",
          content: "On November 29, 1947, the United Nations General Assembly adopted Resolution 181 partitioning Mandate Palestine into Jewish and Arab states. On May 14, 1948 (5 Iyar 5708), David Ben-Gurion read the Declaration of Independence in Tel Aviv, restoring Jewish sovereignty after 1,978 years."
        }
      ]
    },
    {
      part: "Part V",
      period: "1948 – Present",
      title: "The Modern State of Israel & High-Tech Nation",
      summary: "1948 War of Independence, ingathering of 850,000+ Middle Eastern Jewish refugees, 1967 Six-Day War & Jerusalem reunification, 1973 Yom Kippur War, peace treaties, and global innovation leader.",
      sections: [
        {
          heading: "War of Independence & Ingathering of Refugees",
          content: "Immediately following independence, five Arab armies invaded Israel. Israel survived the 1948 War of Independence and absorbed over 850,000 Mizrahi and Sephardi Jewish refugees expelled from Arab lands (Operation Magic Carpet, Operation Ezra & Nehemiah) alongside European survivors."
        },
        {
          heading: "1967 Six-Day War & Reunification of Jerusalem",
          content: "In June 1967, facing Egyptian, Syrian, and Jordanian mobilization, Israel launched a preemptive strike, liberating the Old City of Jerusalem, the Kotel (Western Wall), Judea, Samaria, Gaza, and the Golan Heights—reunifying the historic capital."
        },
        {
          heading: "Yom Kippur War (1973) & Historic Peace Treaties",
          content: "Attacked by surprise on Yom Kippur 1973, Israel repelled Egyptian and Syrian forces. Subsequent diplomacy yielded historic peace accords: the Camp David Accords with Egypt (1979), Israel-Jordan Peace Treaty (1994), and the Abraham Accords (2020) with the UAE, Bahrain, Morocco, and Sudan."
        },
        {
          heading: "Start-Up Nation & Modern Jewish Heritage",
          content: "Today Israel stands as a global superpower in technology, cyber security, medical research, agriculture, and defense ('Start-Up Nation') while remaining the vibrant, beating heart of Jewish spiritual life and democratic freedom."
        }
      ]
    }
  ];

  const culturalPillars = [
    {
      title: "Shabbat (Rest & Spiritual Renewal)",
      icon: Scroll,
      color: "from-blue-600/10 to-sky-500/10 border-blue-500/20",
      desc: "The weekly Sabbath from Friday sunset to Saturday night. A sacred sanctuary in time devoted to family, prayer, traditional meals (Challah, Kiddush), and spiritual reflection."
    },
    {
      title: "Hebrew Language Revival",
      icon: Feather,
      color: "from-cyan-600/10 to-blue-500/10 border-cyan-500/20",
      desc: "An unprecedented linguistic achievement: Eliezer Ben-Yehuda and modern pioneers revived biblical Hebrew into a spoken modern language spoken by millions today."
    },
    {
      title: "Kibbutz & Start-Up Nation",
      icon: Compass,
      color: "from-amber-600/10 to-yellow-500/10 border-amber-500/20",
      desc: "From early agricultural communes to the world's leading technology 'Start-Up Nation', Israel combines ancient pioneer spirit with high-tech innovation."
    },
    {
      title: "Festivals of Remembrance",
      icon: Calendar,
      color: "from-indigo-600/10 to-blue-500/10 border-indigo-500/20",
      desc: "High Holy Days (Rosh Hashanah, Yom Kippur), Passover (Pesach), Hanukkah (Festival of Lights), and Sukkot connect modern Israelis to thousands of years of heritage."
    }
  ];

  return (
    <main className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans relative overflow-x-hidden select-none pb-24">
      {/* Dark Ambient Lighting */}
      <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[750px] h-[750px] bg-blue-600/10 blur-[180px] pointer-events-none rounded-full" />
      <div className="absolute top-[40%] right-[-10%] w-[550px] h-[550px] bg-sky-500/5 blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[550px] h-[550px] bg-indigo-600/5 blur-[160px] pointer-events-none rounded-full" />

      {/* Navigation Header */}
      <header className="px-6 py-4 border-b border-white/10 backdrop-blur-3xl sticky top-0 z-40 bg-[#030712]/80 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="size-9.5 rounded-full bg-slate-900/80 border border-white/10 flex items-center justify-center hover:bg-slate-800/80 active:scale-95 transition-all text-white shadow-lg"
          >
            <ArrowLeft className="size-4.5" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="size-9.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <StarOfDavidIcon className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-[17px] font-black tracking-tight leading-none text-white">
                WAY TO ISRAEL
              </h1>
              <p className="text-[9.5px] text-slate-400 font-semibold tracking-wider mt-0.5">Heritage, Scriptures & Detailed History</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-sky-300 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md">
            <StarOfDavidIcon className="size-3.5 text-sky-400" />
            <span>Jewish Culture & Heritage</span>
          </span>
        </div>
      </header>

      {/* Main Container */}
      <section className="relative max-w-5xl mx-auto w-full px-4 sm:px-6 pt-6 space-y-8">

        {/* Clean Minimal Featured Video Section */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-slate-900/40 shadow-2xl backdrop-blur-xl group">
          <video
            ref={videoRef}
            src="https://files.catbox.moe/s6mzcv.mp4"
            className="w-full aspect-video object-cover"
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-between p-6 pointer-events-none">
            <div className="flex justify-end items-start pointer-events-auto">
              <button
                onClick={toggleMute}
                className="size-9 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-slate-800 transition-all active:scale-95 shadow-md"
              >
                {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
            </div>

            <div className="flex items-end justify-between pointer-events-auto">
              <div className="max-w-md space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-md">
                  עם ישראל חי — Am Yisrael Chai
                </h3>
                <p className="text-[12px] font-medium text-slate-300 drop-shadow-sm">
                  "The People of Israel Live" — Anthem of Jewish resilience, unity, and hope.
                </p>
              </div>

              <button
                onClick={togglePlay}
                className="size-12 rounded-full bg-white hover:bg-slate-100 text-slate-950 flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95 flex-shrink-0"
              >
                {isPlaying ? <Pause className="size-5 fill-slate-950" /> : <Play className="size-5 fill-slate-950 ml-0.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ISRAELI FLAG DISPLAY VIDEO CARD */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-slate-900/50 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Clean High Quality Wavy Flag Video Container */}
          <div className="md:col-span-5 flex justify-center py-1">
            <div className="relative w-full max-w-xs sm:max-w-sm aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-black group">
              <video
                src="https://d34w7g4gy10iej.cloudfront.net/video/2410/DOD_110644143/DOD_110644143.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover rounded-2xl scale-105 group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none" />
            </div>
          </div>

          {/* Flag Symbolism & History */}
          <div className="md:col-span-7 space-y-3.5">
            <div className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full">
              <StarOfDavidIcon className="size-3.5 text-sky-400" />
              <span>National Symbol</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              The Flag of Israel
            </h2>

            <p className="text-[13px] font-normal text-slate-300 leading-relaxed">
              Designed in 1891 and officially adopted in 1948, the flag features two horizontal blue stripes on a white field inspired by the traditional <strong>Tallit</strong> (Jewish prayer shawl). At its center rests the <strong>Magen David</strong> (Star of David), signifying divine protection and national identity.
            </p>

            <div className="flex flex-wrap gap-2.5 pt-1">
              <div className="flex items-center gap-2 bg-slate-800/60 border border-white/10 px-3 py-1.5 rounded-xl text-[11px] font-medium text-slate-200">
                <Scroll className="size-3.5 text-sky-400" />
                <span>Tallit Prayer Shawl Stripes</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/60 border border-white/10 px-3 py-1.5 rounded-xl text-[11px] font-medium text-slate-200">
                <StarOfDavidIcon className="size-3.5 text-amber-400" />
                <span>Magen David (Shield of David)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex justify-center border-b border-white/10 pb-1 pt-2">
          <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 max-w-md w-full backdrop-blur-xl">
            <button
              onClick={() => setActiveTab("history")}
              className={`py-2 rounded-xl text-[11.5px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "history"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <History className="size-3.5" />
              <span>Detailed History</span>
            </button>

            <button
              onClick={() => setActiveTab("texts")}
              className={`py-2 rounded-xl text-[11.5px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "texts"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BookMarked className="size-3.5" />
              <span>Scriptures</span>
            </button>

            <button
              onClick={() => setActiveTab("culture")}
              className={`py-2 rounded-xl text-[11.5px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "culture"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BookOpen className="size-3.5" />
              <span>Culture</span>
            </button>
          </div>
        </div>

        {/* TAB 1: EXHAUSTIVE HISTORY OF ISRAEL */}
        {activeTab === "history" && (
          <div className="space-y-6 select-text">
            {/* View Mode Switcher */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-900/50 p-3 rounded-2xl border border-white/10 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <BookOpen className="size-4 text-sky-400" />
                <span>Reading Format:</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setHistoryViewMode("interactive")}
                  className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                    historyViewMode === "interactive"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-white/5"
                  }`}
                >
                  <ListFilter className="size-3.5" />
                  <span>5-Part Timeline</span>
                </button>
                <button
                  onClick={() => setHistoryViewMode("full")}
                  className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                    historyViewMode === "full"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-white/5"
                  }`}
                >
                  <FileText className="size-3.5" />
                  <span>Full Article View</span>
                </button>
              </div>
            </div>

            {/* INTERACTIVE TIMELINE VIEW */}
            {historyViewMode === "interactive" && (
              <div className="space-y-6">
                <div className="text-center space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Comprehensive History of Israel
                  </h3>
                  <p className="text-[12.5px] font-medium text-slate-400 max-w-2xl mx-auto">
                    4,000 years of unbroken Jewish history, covenants, exiles, and national resurrection.
                  </p>
                </div>

                {/* Part Selector Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {historyParts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPart(selectedPart === idx ? null : idx)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        selectedPart === idx
                          ? "bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30 scale-[1.02]"
                          : "bg-slate-900/60 border-white/10 hover:bg-slate-800/60 text-slate-300"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300">{p.part}</span>
                      <span className="text-[12px] font-bold leading-tight line-clamp-1 mt-1">{p.title}</span>
                      <span className="text-[9px] text-slate-400 mt-1 block">{p.period}</span>
                    </button>
                  ))}
                </div>

                {/* Parts Display */}
                <div className="space-y-6 pt-2">
                  {historyParts.map((p, idx) => {
                    if (selectedPart !== null && selectedPart !== idx) return null;
                    return (
                      <div
                        key={idx}
                        className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl backdrop-blur-xl relative overflow-hidden"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-sky-400 text-[10.5px] font-bold">
                              {p.part}
                            </span>
                            <h4 className="text-xl font-black text-white">{p.title}</h4>
                          </div>
                          <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                            {p.period}
                          </span>
                        </div>

                        <p className="text-[13px] text-slate-300 italic leading-relaxed font-medium">
                          "{p.summary}"
                        </p>

                        <div className="space-y-4 pt-2">
                          {p.sections.map((sec, sIdx) => (
                            <div key={sIdx} className="bg-slate-950/50 border border-white/5 rounded-2xl p-5 space-y-2">
                              <h5 className="text-[14px] font-bold text-sky-300 flex items-center gap-2">
                                <StarOfDavidIcon className="size-3.5 text-blue-400 flex-shrink-0" />
                                <span>{sec.heading}</span>
                              </h5>
                              <p className="text-[12.5px] text-slate-300 leading-relaxed font-normal">
                                {sec.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FULL ARTICLE READER MODE */}
            {historyViewMode === "full" && (
              <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-10 space-y-10 shadow-2xl backdrop-blur-xl leading-relaxed text-slate-200">
                <div className="border-b border-white/10 pb-6 text-center space-y-3">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px] font-semibold">
                    <StarOfDavidIcon className="size-3.5 text-sky-400" />
                    <span>Complete Unabridged History</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                    A Complete History of Israel: Through Jewish Eyes
                  </h2>
                  <p className="text-[13.5px] text-slate-400 max-w-3xl mx-auto italic font-normal">
                    A vast and intricate tapestry woven over millennia—a spiritual, cultural, and national saga of a people, their land, and their enduring covenant.
                  </p>
                </div>

                {/* Part I */}
                <div className="space-y-4">
                  <h3 className="text-xl font-black text-sky-300 border-l-4 border-blue-500 pl-3">
                    Part I: The Biblical Foundations & First Temple Era (c. 2000 BCE – 586 BCE)
                  </h3>
                  <div className="space-y-4 text-[13px] font-normal text-slate-300">
                    <p>
                      <strong>The Patriarchal Age & Covenant:</strong> Jewish history begins nearly 4,000 years ago in Ur of the Chaldeans, where Abraham recognized single monotheism. Summoned to Canaan, Abraham established a divine covenant (Brit) promising Eretz Yisrael to his descendants. Isaac and Jacob continued this lineage; Jacob was renamed <strong>Israel</strong> ("he who strives with God") after wrestling with an angel, and fathered twelve sons who formed the Twelve Tribes.
                    </p>
                    <p>
                      <strong>Slavery & Exodus:</strong> Following famine, the Israelites settled in Egypt where they grew into a populous nation and were subsequently enslaved by Pharaoh. Under Moses, God delivered the Ten Plagues and redeemed Israel in the Exodus (Pesach). At Mount Sinai, the entire nation witnessed divine revelation, receiving the Ten Commandments and the Torah.
                    </p>
                    <p>
                      <strong>Kingdom of Israel & Solomon's Temple:</strong> Led by Joshua into Canaan, Israel was ruled by Judges for two centuries before establishing a monarchy. King David (c. 1004 BCE) unified the tribes, captured Zion, and established Jerusalem as the eternal capital. King Solomon built the magnificent First Temple on Mount Moriah, making Jerusalem the spiritual centerpiece of Jewish life.
                    </p>
                    <p>
                      <strong>Babylonian Exile (586 BCE):</strong> Following Solomon, the kingdom split into Israel and Judah. In 586 BCE, King Nebuchadnezzar of Babylon destroyed Jerusalem and burned the First Temple, marching the Jews into exile in Babylon. There, by the rivers of Babylon, Jewish identity was preserved through prayer and scripture.
                    </p>
                  </div>
                </div>

                {/* Part II */}
                <div className="space-y-4 pt-6 border-t border-white/10">
                  <h3 className="text-xl font-black text-sky-300 border-l-4 border-blue-500 pl-3">
                    Part II: The Second Temple Period & Roman Siege (c. 538 BCE – 70 CE)
                  </h3>
                  <div className="space-y-4 text-[13px] font-normal text-slate-300">
                    <p>
                      <strong>Cyrus's Edict & Rebuilding:</strong> In 538 BCE, Persian King Cyrus the Great permitted Jewish exiles to return to Jerusalem. Under Zerubbabel, Ezra, and Nehemiah, they rebuilt the Second Temple and restored Torah covenantal life.
                    </p>
                    <p>
                      <strong>The Maccabean Victory (Hanukkah):</strong> In 165 BCE, when Seleucid Greek Emperor Antiochus IV banned Torah study and desecrated the Temple, Judah the Maccabee led a guerrilla uprising. Reclaiming Jerusalem, the Maccabees rededicated the Temple, celebrated by the miracle of the oil on <strong>Hanukkah</strong>.
                    </p>
                    <p>
                      <strong>Destruction of Second Temple (70 CE):</strong> Rome conquered Judea in 63 BCE. Oppression sparked the Great Revolt (66 CE). In 70 CE, Roman general Titus breached Jerusalem's walls and burned the Second Temple on the 9th of Av (Tisha B'Av).
                    </p>
                    <p>
                      <strong>Bar Kokhba Revolt & Dispersion (135 CE):</strong> A second revolt led by Simon Bar Kokhba (132–135 CE) was crushed by Hadrian. Rome slaughtered hundreds of thousands of Jews, renamed Judea "Syria Palaestina", and banned Jews from Jerusalem, initiating nearly two millennia of global exile.
                    </p>
                  </div>
                </div>

                {/* Part III */}
                <div className="space-y-4 pt-6 border-t border-white/10">
                  <h3 className="text-xl font-black text-sky-300 border-l-4 border-blue-500 pl-3">
                    Part III: The Long Exile & Rise of Zionism (70 CE – 19th Century)
                  </h3>
                  <div className="space-y-4 text-[13px] font-normal text-slate-300">
                    <p>
                      <strong>Rabbinic Judaism & The Talmud:</strong> Deprived of the Temple, sages like Rabbi Yochanan ben Zakkai shifted Jewish life to prayer and study. Rabbi Judah the Prince compiled the Mishnah (c. 200 CE), forming the foundation of the Talmud.
                    </p>
                    <p>
                      <strong>Sephardic & Ashkenazic Heritage:</strong> Sephardim in Spain enjoyed a Golden Age of philosophy and poetry under Maimonides (Rambam), while Ashkenazim in Eastern Europe developed Yiddish culture and rabbinic commentaries under Rashi.
                    </p>
                    <p>
                      <strong>Theodor Herzl & Modern Zionism:</strong> Facing European pogroms and antisemitism, Theodor Herzl published <em>Der Judenstaat</em> and organized the First Zionist Congress in Basel (1897) to restore Jewish national independence in Eretz Yisrael.
                    </p>
                  </div>
                </div>

                {/* Part IV */}
                <div className="space-y-4 pt-6 border-t border-white/10">
                  <h3 className="text-xl font-black text-sky-300 border-l-4 border-blue-500 pl-3">
                    Part IV: The Road to Statehood & The Holocaust (19th Century – 1948)
                  </h3>
                  <div className="space-y-4 text-[13px] font-normal text-slate-300">
                    <p>
                      <strong>Aliyah & Modern Hebrew:</strong> Jewish pioneers built agricultural Kibbutzim, founded Tel Aviv (1909), and revived spoken Hebrew under Eliezer Ben-Yehuda. In 1917, Britain issued the Balfour Declaration supporting a Jewish national home.
                    </p>
                    <p>
                      <strong>The Holocaust (Shoah):</strong> Nazi Germany murdered six million European Jews in WWII, proving the urgent existential necessity of an independent Jewish state.
                    </p>
                    <p>
                      <strong>May 14, 1948 Declaration of Independence:</strong> Following the 1947 UN Partition Plan, David Ben-Gurion declared the establishment of the State of Israel in Tel Aviv on May 14, 1948.
                    </p>
                  </div>
                </div>

                {/* Part V */}
                <div className="space-y-4 pt-6 border-t border-white/10">
                  <h3 className="text-xl font-black text-sky-300 border-l-4 border-blue-500 pl-3">
                    Part V: The Modern State of Israel (1948 – Present)
                  </h3>
                  <div className="space-y-4 text-[13px] font-normal text-slate-300">
                    <p>
                      Israel survived invasion in 1948 and absorbed 850,000 Jewish refugees from Arab lands. In the 1967 Six-Day War, Israel reunited Jerusalem and restored access to the Western Wall (Kotel). Today, Israel flourishes as a democratic high-tech powerhouse and spiritual haven for world Jewry.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Sacred Scriptures (Tanakh & Torah PDFs) */}
        {activeTab === "texts" && (
          <div className="space-y-6 select-text">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-white tracking-tight">Sacred Jewish Scriptures</h3>
              <p className="text-[12.5px] text-slate-400 font-medium">Read official digital editions of Tanakh & Torah</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sacredTexts.map((doc, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl backdrop-blur-xl flex flex-col justify-between hover:border-white/20 transition-all relative overflow-hidden"
                >
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${doc.badgeColor}`}>
                        {doc.category}
                      </span>
                    </div>

                    <h4 className="text-xl font-black text-white">{doc.title}</h4>
                    <p className="text-[11.5px] font-semibold text-sky-400">{doc.subtitle}</p>
                    <p className="text-[12.5px] text-slate-300 leading-relaxed font-normal pt-1">
                      {doc.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex flex-wrap gap-2.5">
                    <a
                      href={doc.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[12px] font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                      <ExternalLink className="size-4" />
                      <span>Read Document</span>
                    </a>

                    <a
                      href={doc.pdfUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-11 px-4 rounded-xl bg-slate-800 border border-white/10 hover:bg-slate-700 text-slate-200 text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                      title="Download PDF"
                    >
                      <Download className="size-4" />
                      <span className="hidden sm:inline">Save</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Jewish Culture & Traditions */}
        {activeTab === "culture" && (
          <div className="space-y-6 select-text">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-white tracking-tight">Pillars of Jewish Culture</h3>
              <p className="text-[12.5px] text-slate-400 font-medium">Timeless traditions defining identity, community, and heritage</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {culturalPillars.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className={`bg-gradient-to-br ${item.color} border rounded-3xl p-6 space-y-3 backdrop-blur-xl shadow-xl hover:scale-[1.01] transition-transform`}
                  >
                    <div className="size-11 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-center text-sky-400">
                      <Icon className="size-5.5" />
                    </div>
                    <h4 className="text-lg font-black text-white">{item.title}</h4>
                    <p className="text-[12.5px] text-slate-300 leading-relaxed font-normal">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </section>
    </main>
  );
}
