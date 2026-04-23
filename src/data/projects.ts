export interface ProjectSection {
  type: "text" | "quote" | "stats" | "images" | "image-text" | "video";
  heading?: string;
  sectionNumber?: string;
  sectionLabel?: string;
  body?: string[];
  quote?: string;
  stats?: { number: number; suffix: string; label: string }[];
  images?: { label: string; dark?: boolean; height?: number; src?: string; objectPosition?: string }[];
  imagePosition?: "left" | "right";
  layout?: "phone-gallery" | "desktop-showcase" | "photo-grid";
  videoSrc?: string;
  videoLabel?: string;
  videoControls?: boolean;
  videoPoster?: string;
}

export interface Project {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  color: string;
  featured?: boolean;
  thumbnail?: string;
  thumbnailVideo?: string;
  heroImage?: string;
  heroObjectPosition?: string;
  meta: { label: string; value: string }[];
  sections: ProjectSection[];
  outcome: {
    heading: string;
    body: string[];
    contributions: string[];
    collaborators: string[];
    tools: string[];
  };
  nextProject: { slug: string; title: string; subtitle: string };
}

export const PROJECTS: Project[] = [
  {
    slug: "clarvos",
    title: "Clarvos",
    subtitle: "Agents for Advertising",
    description:
      "Designed the product vision for an agentic AI platform — from initial MVP through a strategic pivot I proposed, to a rebrand and launch out of stealth.",
    tags: ["AI / Agents", "SaaS", "Video Editor", "Campaign Management"],
    color: "#6366f1",
    featured: true,
    thumbnail: "/images/clarvos/Homepage-AI-Optimized-Agentic.png",
    thumbnailVideo: "/images/clarvos/full-flow-no-cursor.mp4",
    heroImage: "/images/clarvos/Clarvos hero Image.png",
    heroObjectPosition: "top",
    meta: [
      { label: "Client", value: "Clarvos" },
      { label: "Role", value: "Lead Product Designer" },
      { label: "Duration", value: "2024 – Present" },
      { label: "Platform", value: "Web SaaS" },
    ],
    sections: [
      // ── Phase 1: The Starting Point ──────────────────────────
      {
        type: "text",
        sectionNumber: "01",
        sectionLabel: "The Starting Point",
        heading:
          "The company started in data science. The product needed to start with people.",
        body: [
          "Clarvos began as a data science company, recently acquired and spun out of a parent organization. The starting hypothesis was to surface societal trends by analyzing large volumes of posts and documents online — and give marketers the tools to act on them.",
          "From that vantage point, I designed the first end-to-end product: a metrics-oriented platform with parallel feeds of granular posts, daily trend briefings, audience analytics, and a strategy builder. It was functional, comprehensive, and entirely manual — closer to Wix or HubSpot than what the product would eventually become.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "V1 — Audience Discovery & Strategy Builder",
            src: "/images/clarvos/v1/homepage.png",
          },
          {
            label: "V1 — Content Feed with Trend Highlights",
            src: "/images/clarvos/v1/feed.png",
          },
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "V1 — Analytics Dashboard",
            src: "/images/clarvos/v1/analytics.png",
          },
          {
            label: "V1 — Onboarding Setup Guide",
            src: "/images/clarvos/v1/setup-guide.png",
          },
        ],
      },
      {
        type: "text",
        body: [
          "This first version shipped and gave us a working product — but as the company pivoted from data science to an AI-native orientation, the product needed to evolve with it. Data science moved under the product organization, an AI/ML team stood up, and our target market came into focus: small business owners who needed to compete for market share but didn’t have sophisticated marketing experience.",
        ],
      },
      // ── Phase 2: The Pivot ───────────────────────────────────
      {
        type: "text",
        sectionNumber: "02",
        sectionLabel: "The Pivot",
        heading:
          "I proposed that the user shouldn’t have to do anything at all.",
        body: [
          "The exec team asked for a complete product rethink — and it had to happen fast. They flew me down for a two-day private brainstorm retreat: me, the CEO, CTO, and CPO. Four people, two days.",
          "I had been studying the opportunity space for agentic AI and arrived with a core design principle: non-action, non-doing. The user should never have to take actions that the system could handle autonomously. I proposed an architecture where AI agents would surface social trends, generate campaign plans, create micro-targeted creatives, and package everything up — so that from the user’s perspective, a Pinterest-style feed of ready-to-run campaigns would appear each morning, powered by ongoing social listening and a behind-the-scenes orchestration layer.",
          "I mocked up the full end-to-end vision in two days using Claude Code and Figma. The CEO’s response: \"This is it.\"",
        ],
      },
      {
        type: "quote",
        quote:
          "The scariest part was that a seamless agentic experience meant orchestrating everything from day one. It was like starting with a driverless car — typically a wave-three vision, not an MVP.",
      },
      {
        type: "text",
        body: [
          "We also ran moderated user research at the workshop. The signal was clear — participants didn’t ask \"how does it work\" or \"what does the algorithm do.\" They asked, \"How do I sign up?\"",
          "We flew back with an end-to-end prototype, executive alignment, and a clear path forward. From there, we scaled the engineering team and built it out.",
        ],
      },
      {
        type: "video",
        videoSrc: "/images/clarvos/clarvos-core-flow.mp4",
        videoLabel: "V2 — Agentic Platform Flow",
      },
      {
        type: "stats",
        stats: [
          {
            number: 6,
            suffix: "+",
            label: "Autonomous agent steps in the pipeline",
          },
          {
            number: 3,
            suffix: "",
            label: "Social platforms managed simultaneously",
          },
          {
            number: 80,
            suffix: "%",
            label: "Reduction in campaign setup time",
          },
          {
            number: 12,
            suffix: "x",
            label: "More creative variants tested per cycle",
          },
        ],
      },
      // ── Phase 2: The Agentic Experience ──────────────────────
      {
        type: "text",
        sectionNumber: "03",
        sectionLabel: "The Agentic Experience",
        heading:
          "Designing trust in a system that makes decisions for you",
        body: [
          "The hardest design problem in agentic AI isn’t the interface — it’s calibrating how much autonomy the system should take, and how to communicate its reasoning. Users needed to understand what the AI was doing, why, and feel confident handing over creative and financial decisions to an autonomous agent.",
          "I led product discovery, interaction design, prototyping, and design system creation. Working closely with product managers, engineers, and the AI/ML team, I shaped both the user experience and the product strategy — defining not just how the system looks, but how it thinks and communicates its decisions.",
        ],
      },
      {
        type: "text",
        heading: "Campaigns that start with what’s already working",
        body: [
          "Rather than guessing what content will resonate, Clarvos surfaces trending topics across social platforms in real time. The discover view ranks trends by volume, velocity, and audience alignment — then lets marketers launch a campaign directly from any trend with one click.",
          "I designed two complementary views: a data-driven rankings table for analytical users, and a visual mood board for creatives who think in imagery. Both paths lead to the same outcome — a pre-populated campaign brief built on real audience signals.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Trend Rankings — Topic Analysis & Campaign Actions",
            src: "/images/clarvos/tiktok-trends.png",
          },
          {
            label: "Visual Trends — Social Content Mood Board",
            src: "/images/clarvos/Homepage-Trends@2x.png",
          },
        ],
      },
      {
        type: "text",
        heading: "AI-generated creatives that actually look good",
        body: [
          "The platform generates on-brand ad creatives — images and video — by understanding a brand’s visual identity, tone, and audience. Rather than outputting generic AI slop, the system produces polished, production-quality assets that feel intentionally designed.",
          "I designed the creative library as a command center where marketers can organize, review, and curate AI-generated variants. Every asset surfaces a hybrid quality score that combines AI analysis with human judgment — evaluating intent, style, composition, and emotional valence.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Creative Library — Organizing AI-Generated Assets",
            src: "/images/clarvos/Creatives-Library.png",
          },
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Hybrid Scoring — AI Quality Analysis & Style Controls",
            src: "/images/clarvos/Hybrid Score + Insights.png",
          },
          {
            label: "AI Image Editor — Prompt-Driven Variant Generation",
            src: "/images/clarvos/AI Edit Image.png",
          },
        ],
      },
      {
        type: "text",
        heading: "Building agents behind the interface",
        body: [
          "The creative intelligence users see is the output of a crew of specialized AI agents working in coordination. I worked cross-functionally with two AI modeling engineers, an advertising creative, and a PM to build and iterate on the dynamic creatives agent that generates editable images and text layers.",
          "My role extended beyond interface design into the agent system itself. The team architected the structure together. I wrote the initial YAML configurations, contributed the photographic aesthetics encoded in the markdown spec files, and pair-programmed with engineers on the copywriting standards and art director heuristics that shape the image generation agent. The result is a system that produces work for real brands, including Dunkin', purely elizabeth, and PCG, rather than generic AI outputs.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Clarvos Agents — Internal Admin for Shipping Agent Crews",
            src: "/images/clarvos/agents-1.png",
          },
          {
            label: "Dynamic Creatives Agent — Real Brand Output (Dunkin', purely elizabeth, PCG)",
            src: "/images/clarvos/agents-2.png",
          },
        ],
      },
      {
        type: "text",
        heading: "From blank slate to live campaign in minutes",
        body: [
          "The campaign builder surfaces an AI-generated plan with budget allocation, ROAS predictions, and audience targeting already filled in. Marketers can accept the defaults, adjust any parameter, or override the AI entirely. The system explains why it made each recommendation, building trust through transparency.",
          "Before anything goes live, every placement runs through a review and approval flow. Creatives are shown in their actual platform context — Instagram feed, TikTok story, Reddit post — so marketers approve what their audience will actually see, not an abstracted preview.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Campaign Plan — AI-Generated Strategy & Budget",
            src: "/images/clarvos/Clarvos-Campaign-Plan.png",
          },
          {
            label: "Review & Approve — Platform-Specific Placements",
            src: "/images/clarvos/Review-Approve-Placements.png",
          },
        ],
      },
      {
        type: "text",
        heading: "Prompt-driven video editing for non-editors",
        body: [
          "One of the most technically ambitious features: a scene-based video editor that lets marketers describe what they want in natural language. I designed it around a timeline metaphor familiar to anyone who’s used iMovie or Premiere, but replaced the complexity with AI-powered controls. Users compose scenes by describing them, preview variations, and assemble final videos — no editing skills required.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Canvas Studio — Scene Timeline & Media Tracks",
            src: "/images/clarvos/Canvas-Studio-Editor.png",
          },
        ],
      },
      {
        type: "video",
        videoSrc: "/images/clarvos/clarvos-feed-hd-wide.mp4",
        videoLabel: "V2 — AI Campaign Feed",
      },
      // ── Phase 3: Rebrand & Launch ────────────────────────────
      {
        type: "text",
        sectionNumber: "04",
        sectionLabel: "Rebrand & Launch",
        heading:
          "Three weeks from rebrand to launch out of stealth",
        body: [
          "The company initiated a full rebrand, and since the redesign touched every surface end-to-end, it became an opportunity to improve the information architecture — not just reskin it.",
          "From additional user testing, we learned that marketers with existing campaign assets wanted manual flows alongside the agentic ones. I designed a modular architecture where users could take the AI-optimized campaigns ready to run, but also use individual tools independently — just generate creatives, just run the customer simulator, or build a campaign manually from scratch. Maximum flexibility without compromising the core autonomous experience.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "V3 — Redesigned Dashboard with Discover, Create & Test, Campaign",
            src: "/images/clarvos/v3/dashboard.png",
          },
        ],
      },
      {
        type: "text",
        heading: "Synthetic focus groups that test creative before it goes live",
        body: [
          "I designed the synthetic focus group system: LLM swarms of 50 personas modeled on specific consumer segments, providing qualitative feedback with variance smoothing. Rather than one model representing an entire segment, groups of 50 bring the modeling closer to empirical observation — a feature rooted in the company’s data science DNA, expressed through an agentic AI interface.",
          "The \"Why This Plan Works\" explainer followed a principle from behavioral science: even users who say \"just handle everything\" gain credibility from knowing an explanation is one click away. The paradigm remained non-action, but with transparency always available.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Optimize Creative — Customer Signal Scoring & Persona Feedback",
            src: "/images/clarvos/v3/synthetic-feedback.png",
          },
          {
            label: "AI Agents Annotating Creative in Real Time",
            src: "/images/clarvos/v3/test-learn-agents-active.png",
          },
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Synthetic Focus Group — Member Quotes, Score Factors & Transcript",
            src: "/images/clarvos/v3/trend-sensitive-shoppers.png",
          },
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Campaign Plan — BrandMatch Score & \"Why This Plan Works\"",
            src: "/images/clarvos/v3/campaign-plan.png",
          },
          {
            label: "Trending Topics — Match Scoring & Spark Lines",
            src: "/images/clarvos/v3/trending-topics.png",
          },
        ],
      },
      {
        type: "text",
        body: [
          "I folded all of this into the v3 redesign — branding, design system, UI styling, and reworked product flows — in three weeks. I used Codex and Figma MCP to accelerate initial designs, then refined visual designs in Figma including all design system components. I also coordinated with the branding agency and GTM team to deploy the new UI on the landing page and in the press release.",
          "This led to a successful launch out of stealth on April 7, 2026, covered by BusinessWire, SiliconANGLE, and MarTech Series. Our first beta customers are already in the platform, and we’re gathering voice-of-customer insights to inform further iteration.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "V3 — Performance Dashboard with Campaign Plans",
            src: "/images/clarvos/v3/campaign-plans-view.png",
          },
          {
            label: "V3 — Ad Type Selection & Creative Direction",
            src: "/images/clarvos/v3/test-learn-ad-type.png",
          },
        ],
      },
    ],
    outcome: {
      heading: "From data science startup to agentic AI platform",
      body: [
        "Over 18 months, I led the product design through three complete iterations — from a metrics dashboard to an agentic platform to a rebranded launch product. The work spanned product strategy, interaction design, design systems, user research, and cross-functional coordination with engineering, AI/ML, branding, and GTM.",
        "The core design principle — non-action, non-doing — survived from the two-day brainstorm through to the shipped product. That’s rare, and it means the initial insight was right and the execution held up.",
      ],
      contributions: [
        "Product Strategy",
        "Product Discovery",
        "Interaction Design",
        "Design System",
        "Prototyping",
        "User Research",
      ],
      collaborators: [
        "CEO, CTO & CPO",
        "AI/ML Engineers",
        "Full-Stack Engineers",
        "Branding Agency",
        "GTM Team",
      ],
      tools: ["Figma", "Figma MCP", "Figjam", "Claude Code", "Codex", "Cursor", "Notion"],
    },
    nextProject: {
      slug: "gator",
      title: "Gator",
      subtitle: "AI Tech Support Chatbot",
    },
  },
  {
    slug: "ai-training",
    title: "AI Model Training",
    subtitle: "Evaluating Frontier LLMs",
    description:
      "Improved frontier model behavior through multi-axis LLM evaluation for OpenAI, Google, and others.",
    tags: ["AI / LLMs", "RLHF", "SFT", "Evaluation"],
    color: "#10b981",
    featured: true,
    thumbnail: "/images/prompt-evals/mountains-oai.png",
    heroImage: "/images/prompt-evals/mountains-oai.png",
    meta: [
      { label: "Client", value: "Google, OpenAI & Others (via DataAnnotation)" },
      { label: "Role", value: "AI Training Specialist / Evaluator" },
      { label: "Duration", value: "2024" },
      { label: "Platform", value: "Web-based evaluation tools" },
    ],
    sections: [
      {
        type: "text",
        sectionNumber: "01",
        sectionLabel: "Overview",
        heading: "Shaping the next generation of AI models",
        body: [
          "Contributed to the training and evaluation of frontier large language models through structured human feedback. The work involved multi-axis rating systems used for supervised fine-tuning (SFT) and reinforcement learning from human feedback (RLHF).",
          "Each response was evaluated across dimensions including groundedness, truthfulness, instruction-following, safety, and factual accuracy. This work directly shaped model behavior for products used by hundreds of millions of people.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            src: "/images/prompt-evals/prompt evals.png",
            label: "Multi-turn evaluation interface — conversation rating workflow",
          },
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            src: "/images/prompt-evals/prompt-kernel.png",
            label: "Multi-axis response rating — instruction following, completeness, factuality",
          },
        ],
      },
      {
        type: "text",
        sectionNumber: "02",
        sectionLabel: "OpenAI — ChatGPT",
        heading: "Contributing to the next version of ChatGPT",
        body: [
          "Evaluated and rated outputs for a new version of ChatGPT, applying a rigorous multi-axis assessment framework. The work focused on improving the model’s conversational quality, factual reliability, and alignment with user intent.",
        ],
      },
      {
        type: "text",
        sectionNumber: "03",
        sectionLabel: "Additional Annotations",
        heading: "Evaluation work for Google, Anthropic, and other frontier model providers",
        body: [
          "Worked on evaluation tasks for Google’s Gemini Copilot, rating model outputs across multiple quality axes. The project involved assessing the model’s ability to follow complex instructions, provide grounded and factually accurate responses, and maintain safety guardrails.",
          "Beyond direct evaluation, also served in a quality assurance capacity — reviewing other evaluators’ ratings for consistency, accuracy, and adherence to rubric standards. This meta-review role helped maintain the integrity of the training data pipeline.",
        ],
      },
    ],
    outcome: {
      heading: "Contributing to models used by billions",
      body: [
        "This work sits at the intersection of AI development and human judgment — a critical but often invisible layer in how frontier models learn to be helpful, harmless, and honest. The evaluations contributed directly to model versions that shipped to hundreds of millions of users worldwide.",
      ],
      contributions: [
        "Multi-axis LLM Evaluation",
        "SFT & RLHF Rating",
        "Quality Assurance",
        "Rubric Interpretation",
        "Cross-model Evaluation",
      ],
      collaborators: [
        "DataAnnotation",
        "Google AI",
        "OpenAI",
      ],
      tools: ["DataAnnotation Platform", "Custom Evaluation Tools"],
    },
    nextProject: {
      slug: "miami",
      title: "My Wellness Research — University of Miami",
      subtitle: "Clinical Cancer Research Platform",
    },
  },
  {
    slug: "gator",
    title: "Gator",
    subtitle: "AI Tech Support Chatbot",
    description:
      "Worked directly with a founder to design a multimodal AI support app for HVAC technicians — concept to MVP in 6 weeks, shipped with zero changes.",
    tags: ["Mobile", "Conversational AI", "QR/Vision", "Field Service"],
    color: "#2d5a3d",
    thumbnail: "/images/gator/gator-cover-new.png",
    heroImage: "/images/gator/Gator First Image.png",
    meta: [
      { label: "Client", value: "Gator (Startup)" },
      { label: "Role", value: "Sole Product Designer" },
      { label: "Duration", value: "6 Weeks" },
      { label: "Platform", value: "iOS Native" },
    ],
    sections: [
      {
        type: "text",
        sectionNumber: "01",
        sectionLabel: "The Problem",
        heading:
          "A technician is standing in front of a broken air conditioner. They need an answer in 30 seconds, not 30 minutes.",
        body: [
          "I worked directly with Gator's founder as the sole product designer, taking the product from concept to a complete MVP in six weeks. I ran 1:1 discovery sessions with him to understand the problem space, created a storyboard narrative of the happy path, and designed the full end-to-end flow for his first product vision.",
          "HVAC technicians work alone, often in unfamiliar buildings, diagnosing equipment they may have never seen before. When they get stuck, the current options are bad: call a senior tech (who might not answer), dig through a 400-page PDF manual on a phone screen, or guess and risk making it worse. Gator reimagines field support as a conversation — point your phone at the unit, scan the barcode, and start talking.",
        ],
      },
      {
        type: "quote",
        quote:
          "The best interface for a technician with a flashlight is voice mode.",
      },
      {
        type: "text",
        sectionNumber: "02",
        sectionLabel: "Onboarding",
        heading: "Get technicians in, not through a tutorial",
        body: [
          "I designed the complete mobile experience — from onboarding through diagnosis to guided repair flows. The design challenge was creating an interface that feels as simple as texting a knowledgeable friend, while handling the complexity of thousands of equipment models and diagnostic pathways underneath.",
          "The onboarding is ruthlessly minimal: phone number verification, one permission prompt for the camera, and they’re in. No account creation form. No feature tour. The first thing they see is Gator introducing itself and asking what they need help with.",
        ],
      },
      {
        type: "images",
        layout: "phone-gallery",
        images: [
          { label: "Gator Splash Screen", src: "/images/gator/Gator-Splash.png" },
          { label: "Welcome — Hey, it’s Gator", src: "/images/gator/Diagnose-0.png" },
        ],
      },
      {
        type: "text",
        sectionNumber: "03",
        sectionLabel: "Equipment Recognition",
        heading: "The camera is the search bar",
        body: [
          "Every HVAC unit has a barcode or serial number plate. Gator’s scanner reads it instantly, pulling the exact make, model, and specs from its product database. No scrolling through menus, no typing model numbers on a tiny keyboard with cold fingers.",
          "For units where the label is damaged or missing, there’s a manual fallback: type the serial number or describe the unit. The AI can often identify equipment from a description of its appearance and the symptoms alone.",
        ],
      },
      {
        type: "images",
        layout: "phone-gallery",
        images: [
          { label: "QR Scanner — Camera View", src: "/images/gator/QR-scan.png" },
          { label: "Searching Database", src: "/images/gator/Diagnose-4.png" },
          { label: "Product Identified", src: "/images/gator/Diagnose-2.png" },
        ],
      },
      {
        type: "text",
        sectionNumber: "04",
        sectionLabel: "The Conversation",
        heading:
          "Designing a chat that feels like talking to a senior tech",
        body: [
          "The diagnostic conversation is Gator’s core experience. The AI doesn’t just answer questions — it asks the right ones. Each question narrows down the problem, just like an experienced technician would think through it.",
          "I designed the chat to feel warm and confident without being patronizing. Gator has a personality — it’s knowledgeable but approachable, like a coworker who’s been doing this for 20 years and genuinely wants to help. The tone was as important as the UI.",
        ],
      },
      {
        type: "images",
        layout: "phone-gallery",
        images: [
          { label: "AI Diagnostic Conversation", src: "/images/gator/Diagnose-1.png" },
          { label: "Follow-up Question", src: "/images/gator/Diagnose-3.png" },
          { label: "Conversation History", src: "/images/gator/Diagnose.png" },
        ],
      },
      {
        type: "text",
        sectionNumber: "05",
        sectionLabel: "Guided Repair",
        heading: "One step at a time, never lost",
        body: [
          "When the AI has enough information, the conversation mode shifts to a structured repair flow. Each step is a discrete card with clear instructions, the ability to ask follow-up questions, and two options: \"Problem solved\" or \"Next step.\"",
          "This transition from open conversation to guided steps was a critical design decision. Diagnosis is exploratory — it needs the flexibility of chat. But repair is procedural — it needs structure and confidence. The interface adapts its personality to match.",
        ],
      },
      {
        type: "images",
        layout: "phone-gallery",
        images: [
          { label: "Step 1 — Check the Thermostat", src: "/images/gator/Repair.png" },
          { label: "Step 2 — Check Compressor", src: "/images/gator/Repair-1.png" },
          { label: "Problem Solved", src: "/images/gator/Repair-2.png" },
        ],
      },
      {
        type: "quote",
        quote:
          "Multimodal diagnosis democratizes expertise. Structured guidance from a deep context layer makes the delivery scalable. The art is to bring next-gen AI to working class folks in a way that fits into their normal lives.",
      },
      {
        type: "text",
        sectionNumber: "06",
        sectionLabel: "Voice Mode",
        heading: "Hands free when it matters",
        body: [
          "Technicians often can’t hold a phone while working. Voice mode lets them speak naturally to Gator while keeping both hands on the equipment. The interface strips away to just the mascot, a mic button, and a camera option for sending photos mid-repair.",
          "The voice interaction needed to feel like a real conversation, not a voice command interface. Gator listens, confirms understanding, and responds in the same warm tone as the text chat — just spoken aloud.",
        ],
      },
      {
        type: "images",
        layout: "phone-gallery",
        images: [
          { label: "Voice Repair — Listening", src: "/images/gator/Gator speaks.png" },
          { label: "Voice Chat Ended", src: "/images/gator/Voice ended.png" },
        ],
      },
    ],
    outcome: {
      heading: "From concept to MVP in six weeks",
      body: [
        "I delivered the complete product vision in six weeks: 30+ unique screens, a full click-through prototype, and all states documented. The founder saw no need for changes and took the designs directly into iOS development.",
        "What mattered most was making advanced AI feel useful in the real conditions of field work: fast context gathering, voice-first interaction when hands are busy, and structured guidance when a technician needs the next right step.",
      ],
      contributions: [
        "Sole Product Designer",
        "Discovery & Storyboarding",
        "Interaction Design",
        "Prototyping",
        "Design System",
      ],
      collaborators: [
        "Founder (Direct)",
        "iOS Developer",
      ],
      tools: ["Figma", "Figma Prototyping", "FigJam"],
    },
    nextProject: {
      slug: "respond-ai",
      title: "Respond AI",
      subtitle: "Supply-Chain Logistics with LLM",
    },
  },
  {
    slug: "respond-ai",
    title: "Respond AI",
    subtitle: "LLM for Logistics",
    description:
      "Cut carrier response latency by designing an LLM dispatch workflow.",
    tags: ["AI / LLM", "Enterprise", "Human-in-the-Loop"],
    color: "#7c3aed",
    thumbnail: "/images/respond-ai/Respond Cover.png",
    heroImage: "/images/respond-ai/Respond-new-hero.png",
    heroObjectPosition: "top",
    meta: [
      { label: "Client", value: "McLeod Software" },
      { label: "Role", value: "Lead Product Designer" },
      { label: "Scope", value: "Product Design & Discovery" },
      { label: "Platform", value: "Web / Desktop" },
    ],
    sections: [
      {
        type: "text",
        sectionNumber: "01",
        sectionLabel: "Overview",
        heading:
          "Respond AI helps specialists guide long-distance carriers to their next pick-up and drop-off locations.",
        body: [
          "With an onboard LLM accessing data in nearly real-time, operators now begin with responses pre-populated. They perform a review check, and can focus on adding the human contact that drivers value for the long haul.",
          "Shipping is decentralized, with many different companies running call centers to keep drivers up to date. It takes people time to query data tables and provide the most up to date information. Meanwhile, more messages from drivers keep coming in, leading to costly delays.",
        ],
      },
      {
        type: "text",
        sectionNumber: "02",
        sectionLabel: "The Business Case",
        heading: "Every 30 minutes a fleet is delayed translates to $1.37 million in lost revenue.",
        body: [
          "Call centers route drivers dynamically to keep everything rolling. But it takes time for human operators to figure it out. What if an LLM could minimize delays?",
          "In designing Respond AI, I created an agnostic solution that can integrate with existing data streams to pre-draft helpful responses. Making this human-in-the-loop keeps operators in the center, with the ability to make edits and add their human insight.",
          "Doing so also provides a runway for operators to rate and annotate model outputs, improving the quality and accuracy of responses.",
        ],
      },
      {
        type: "quote",
        quote:
          "Human-in-the-loop isn’t a compromise — it’s a feature. Operators stay in control while the AI handles the heavy lifting.",
      },
      {
        type: "video",
        layout: "desktop-showcase",
        videoSrc: "/images/respond-ai/Email.mov",
        videoLabel: "Email Interface — AI-assisted Carrier Communication",
      },
      {
        type: "text",
        sectionNumber: "03",
        sectionLabel: "Command Center",
        heading: "A central dashboard that helps operators get oriented for the day\u2019s work",
        body: [
          "Each operator begins their day with a prioritized action list, real-time message and email queues, and a quality score tracking AI response accuracy. The command center surfaces what matters most so operators can focus on high-value conversations.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Respond AI — Operator Command Center",
            src: "/images/respond-ai/Refined Navigation Home.png",
          },
        ],
      },
      {
        type: "text",
        sectionNumber: "04",
        sectionLabel: "Reporting",
        heading: "Measuring progress against daily and quarterly goals",
        body: [
          "The reporting dashboard gives team leads visibility into emails per day, response times, and quote volumes across teams. Operators set daily goals and track trends over time, creating a feedback loop that drives continuous improvement.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Respond AI — Reporting Dashboard",
            src: "/images/respond-ai/reporting.png",
          },
        ],
      },
      {
        type: "text",
        sectionNumber: "05",
        sectionLabel: "Messaging",
        heading: "AI pre-drafts responses so operators can review, edit, and send",
        body: [
          "The messaging interface gives operators a queue of driver conversations on the left and a threaded view on the right. The LLM pre-drafts each response using real-time data \u2014 operators simply review, make edits if needed, and accept. This same pattern extends to mobile follow-ups, where drivers get quick, contextual answers on the road.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Messaging Interface — AI Pre-drafted Responses",
            src: "/images/respond-ai/respond-messaging-2x.png",
          },
        ],
      },
      {
        type: "images",
        layout: "photo-grid",
        images: [
          {
            label: "Driver Follow-up — Mobile Conversation View",
            src: "/images/respond-ai/driver-followup-2.png",
            height: 600,
          },
        ],
      },
      {
        type: "text",
        sectionNumber: "06",
        sectionLabel: "Templates",
        heading: "Templates that steer model outputs and ensure quality",
        body: [
          "To guide the AI\u2019s responses, I designed a template system built around variables. Operators create reusable templates with dynamic fields \u2014 shipper, date, route, weather \u2014 that inform the mega-prompts and multi-shot prompting behind each response, ensuring consistency and accuracy.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Template Builder — Variable-based Response Templates",
            src: "/images/respond-ai/templates.png",
          },
        ],
      },
      {
        type: "text",
        sectionNumber: "07",
        sectionLabel: "Testing & Feedback",
        heading: "Overwhelmingly positive response from active customers",
        body: [
          "Using click-through prototypes, several rounds of tests were run with active customers who use the current product. I wrote a conversation guide to structure the interviews, as well as set up a hypothesis board. I educated the team about research methods.",
          "The feedback was overwhelmingly positive, so much so that the company president asked me to look at their other software applications and find opportunities.",
        ],
      },
    ],
    outcome: {
      heading: "From prototype to production",
      body: [
        "Respond AI moved from concept through user testing to development handoff. The human-in-the-loop design pattern established a framework for integrating AI into existing operator workflows without disrupting the trust and personal touch that drivers rely on.",
        "The project demonstrated that AI in logistics doesn’t need to replace human operators — it needs to give them superpowers.",
      ],
      contributions: [
        "Product Design",
        "Product Discovery",
        "Prototyping",
        "Design Systems",
        "User Research",
      ],
      collaborators: [
        "Van Carlisle (Product Manager)",
        "Sujit Kunwor (Data Scientist)",
        "Engineering Team",
      ],
      tools: ["Figma", "FigJam", "Miro", "Notion"],
    },
    nextProject: {
      slug: "ai-training",
      title: "AI Model Training",
      subtitle: "Evaluating Frontier LLMs for Google, OpenAI & More",
    },
  },
  {
    slug: "miami",
    title: "My Wellness Research — University of Miami",
    subtitle: "Clinical Cancer Research",
    description:
      "Sole designer of a multi-sided clinical research platform — patient mobile app, health coach dashboard, and research ops system — now used in NIH-funded trials and published in peer-reviewed journals.",
    tags: ["Health Tech", "Research", "Mobile"],
    color: "#f97316",
    thumbnail: "/images/miami/University-Miami-cover.png",
    heroImage: "/images/miami/University-Miami-cover.png",
    meta: [
      { label: "Client", value: "University of Miami" },
      { label: "Role", value: "Sole Product Designer" },
      { label: "Duration", value: "9 Months" },
      { label: "Platform", value: "Mobile & Web" },
    ],
    sections: [
      // ── 01: The Brief ───────────────────────────────────────
      {
        type: "text",
        sectionNumber: "01",
        sectionLabel: "The Brief",
        heading:
          "Translating cancer research from paper forms to a living data platform",
        body: [
          "I was brought in as the sole product designer to build My Wellness Research, a HIPAA-compliant remote monitoring platform at the Sylvester Comprehensive Cancer Center, part of the University of Miami Miller School of Medicine. I worked directly with Dr. Tracy Crane and Grey Freylersythe at Sylvester to translate their research vision into a multi-sided digital product.",
          "The starting brief was electronic patient-reported outcomes (ePRO) in oncology — replacing paper-based symptom reporting with real-time digital collection. I knew from Dr. Ethan Basche's foundational work that this transition reduces recall bias and provides richer data for clinicians. But the team wanted to go further: alongside standard ePRO reporting, they needed dietary tracking, behavioral coaching, and wearable device integration — a full lifestyle data platform embedded in active clinical trials.",
        ],
      },
      {
        type: "video",
        layout: "desktop-showcase",
        videoSrc: "/images/miami/mwr-sizzle-reel-oct-2023.mp4",
        videoLabel: "My Wellness Research — Product Overview",
        videoControls: true,
        videoPoster: "/images/miami/cover-image-mwr.png",
      },
      {
        type: "images",
        layout: "photo-grid",
        images: [
          {
            label: "Storyboard — Patient Journey from Check-in to Doctor Review",
            src: "/images/miami/Storyboard.jpg",
          },
          {
            label: "Wireframes — Video Recording & Symptom Capture Flows",
            src: "/images/miami/Wireframes.jpg",
          },
        ],
      },
      // ── 02: Three Audiences ─────────────────────────────────
      {
        type: "text",
        sectionNumber: "02",
        sectionLabel: "Three Audiences, One Platform",
        heading:
          "A consumer app for patients, a clinical tool for coaches, a research engine for scientists",
        body: [
          "I designed experiences for three distinct user groups with fundamentally different needs, contexts, and technical comfort levels — all working within the same data ecosystem.",
          "For patients, I designed a mobile experience that feels consumer-grade — closer to Noom than a clinical tool. Patients going through chemotherapy often have tingling hands and numbness, so every interaction needed to be simple, forgiving, and supportive. The app includes daily check-ins, wearable device syncing, dietary logging, and trend visualization.",
        ],
      },
      {
        type: "images",
        layout: "phone-gallery",
        images: [
          {
            label: "Patient Mobile — Home Dashboard with Device Sync & Trends",
            src: "/images/miami/patient-mobile-input.png",
          },
        ],
      },
      {
        type: "text",
        body: [
          "For health coaches, I designed a web dashboard for managing participant care — video calls, messaging, scheduling, and a kanban-style task board for tracking each patient's goals and progress. Coaches needed to see a participant's full context at a glance during live sessions, so I designed a split-screen layout that surfaces the patient profile, active goals, and guided module input alongside the video call.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Participant Profile — Kanban Goals, Video Call & Guided Module Input",
            src: "/images/miami/ppt-full-profile-video.png",
          },
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "MyWellness Dashboard — Patient Health Data & Symptom Trends",
            src: "/images/miami/my-wellness-dashboard.png",
          },
          {
            label: "Scheduling — Appointment Calendar with Clinic Visit Details",
            src: "/images/miami/scheduling.png",
          },
        ],
      },
      {
        type: "text",
        body: [
          "For researchers, I designed a super-admin layer with cohort-level views, study arm configuration, and a modular ePRO library where admins can fully define and configure their own assessment instruments, targets, triggers, and scoring logic.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Study Configuration — Interventions, Assessments & Data Collection",
            src: "/images/miami/participant-profile-modules.png",
          },
          {
            label: "ePRO Module Library — Physical Wellbeing with Study Associations",
            src: "/images/miami/module-setup.png",
          },
        ],
      },
      // ── 03: Coaching Experience ─────────────────────────────
      {
        type: "text",
        sectionNumber: "03",
        sectionLabel: "The Coaching Experience",
        heading:
          "Video calls that capture data while delivering empathy",
        body: [
          "The video coaching integration was more than a communication tool — it was a data capture system. Every coaching session transcript was captured and processed through machine learning and NLP analysis. In the LIVES study (Lifestyle Intervention for oVarian Cancer Enhanced Survival), the research team analyzed 17,000 hours of health coaching calls to predict diet and exercise changes among ovarian cancer survivors.",
          "This data source used to be thrown out entirely — there was simply no way to process it at scale. The platform I designed made it capturable, structured, and analyzable. I designed the recording interface with a \"Record Touchpoint\" toggle, internal notes field, and patient goals sidebar so that coaches could focus on the human interaction while the system handled data collection.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Video Coaching — Face-to-Face Session with Patient Goals & Notes",
            src: "/images/miami/video-with-ppt.png",
          },
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Messaging Inbox — Multi-Channel Patient Communication",
            src: "/images/miami/messaging-inbox.png",
          },
          {
            label: "Messaging Thread — Patient Chat with Shared Files",
            src: "/images/miami/messaging-thread.png",
          },
        ],
      },
      // ── 04: Research Ops ─────────────────────────────────────
      {
        type: "text",
        sectionNumber: "04",
        sectionLabel: "Research Ops & Study Design",
        heading:
          "Configuring thousands of parallel studies from a single admin panel",
        body: [
          "The study design configuration became the most technically complex part of the platform. As partnerships expanded, we needed to support studies at every phase — from animal studies to dose escalation trials to large-scale behavioral interventions with ePRO data and coaching.",
          "I designed an ePRO library where admins can fully define assessment instruments with configurable targets, triggers, and automation logic. The system includes SMS integrations with rule-based messaging, event listeners that monitor for shifts in reported outcomes in real time, and predictive models that combine multiple outcome signals to alert clinicians before negative health effects occur — enabling them to hold a dose or bring a participant in for consultation.",
          "In Dr. Crane's words, this architecture enables thousands of studies to run in parallel, each with its own configuration of interventions, data collection instruments, and automation rules.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Study Module Editor — Configurable Questionnaires & Automation",
            src: "/images/miami/my-wellness-study-design-control.png",
          },
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Randomized Controlled Trial Design — Intervention vs. Control",
            src: "/images/miami/miami-average-treatment-effect.png",
          },
        ],
      },
      // ── 05: Published Outcomes ──────────────────────────────
      {
        type: "text",
        sectionNumber: "05",
        sectionLabel: "Published Outcomes",
        heading:
          "Peer-reviewed trials showed measurable recovery benefits",
        body: [
          "A randomized trial of 293 cancer surgery patients, published in npj Digital Medicine, found that patients monitored through the platform showed a 6% greater functional recovery rate by day 14 post-surgery and significantly fewer major complications compared to standard care.",
          "A feasibility study published in JCO Oncology Practice documented the platform's use across a racially and ethnically diverse patient population, including the first large-scale deployment of validated Spanish-language patient-reported outcomes screening embedded in electronic health records.",
          "The platform now supports multiple active clinical trials at Sylvester, including a $3.5 million NIH-funded collaboration with Yale University and NRG Oncology studying at-home symptom management for patients on oral anti-cancer medications. A pediatric sarcoma trial launched in 2026 uses the platform alongside 3D biomechanical software and wearable activity monitors.",
        ],
      },
      {
        type: "stats",
        stats: [
          { number: 293, suffix: "", label: "Patients in randomized cancer surgery trial" },
          {
            number: 17,
            suffix: "K",
            label: "Hours of coaching calls analyzed via NLP",
          },
          {
            number: 3.5,
            suffix: "M",
            label: "NIH grant funding for expanded trials",
          },
          {
            number: 6,
            suffix: "%",
            label: "Greater functional recovery by day 14",
          },
        ],
      },
    ],
    outcome: {
      heading: "Product design with measurable clinical impact",
      body: [
        "Over 9 months as the sole product designer, I translated executive research vision into a multi-sided platform that now supports active clinical trials, published peer-reviewed research, and an expanding data ecosystem at one of the country's leading cancer centers.",
        "The work sits at the intersection of product design and clinical research — where information architecture decisions directly affect what data researchers can collect, and interaction design decisions directly affect whether patients going through cancer treatment will actually use the tool.",
      ],
      contributions: [
        "Sole Product Designer",
        "User Research",
        "Information Architecture",
        "Prototyping",
        "Visual Design",
        "Research Ops Design",
      ],
      collaborators: [
        "Dr. Tracy Crane's Lab",
        "Grey Freylersythe",
        "Sylvester Cancer Center",
        "Yale University / NCI",
        "Engineering Team",
      ],
      tools: ["Figma", "Sketch", "InVision", "Miro"],
    },
    nextProject: {
      slug: "astrazeneca",
      title: "AstraZeneca",
      subtitle: "Clinical Trial Platform",
    },
  },
  {
    slug: "astrazeneca",
    title: "AstraZeneca Care",
    subtitle: "Remote Patient Monitoring",
    description:
      "Enabled remote oncology monitoring through leading research and product design for patient and clinician tools.",
    tags: ["Health Tech", "Clinical Trials", "Design Leadership"],
    color: "#0ea5e9",
    thumbnail: "/images/astrazeneca/CARE-patient-reported-outcomes.png",
    heroImage: "/images/astrazeneca/CARE-patient-reported-outcomes.png",
    meta: [
      { label: "Client", value: "AstraZeneca" },
      { label: "Role", value: "Product Discovery & Design Lead" },
      { label: "Duration", value: "3 Months" },
      { label: "Platform", value: "Mobile & Web" },
    ],
    sections: [
      {
        type: "text",
        sectionNumber: "01",
        sectionLabel: "Overview",
        heading:
          "A digital platform to enable remote patient monitoring in the context of clinical research.",
        body: [
          "As a product design and discovery lead at AstraZeneca, I worked on cancer research platforms in the digital health oncology division. I designed a digital platform to enable remote patient monitoring in the context of patient-reported outcomes (PRO) clinical measures.",
          "In addition to regular doctor visits, patients used the platform to keep track of their symptoms and treatment side effects on a daily basis. Studies have shown that doing so tends to have a very significant benefit to long-term health outcomes, as well as longevity and patient quality of life.",
          "I interviewed dozens of patients, doctors, RNs, and research staff to inform this work. As a team lead, I directed bi-weekly design sprints, each of which had specific hypotheses under consideration, always with user testing via prototype.",
        ],
      },
      {
        type: "text",
        sectionNumber: "02",
        sectionLabel: "Voice Symptom Tracking",
        heading:
          "Patients can track their symptoms just by speaking in plain language.",
        body: [
          "The system uses an LLM to extract and normalize keywords from a one-minute voice recording. PPG technology is also used to gather health metrics by reading the bloodflow through the patient’s skin while they speak.",
        ],
      },
      {
        type: "text",
        sectionNumber: "03",
        sectionLabel: "Quick Check-in",
        heading: "Two core user journeys for different moments",
        body: [
          "Some patients would want to do an ad-hoc check in to capture a health update. This needed to take less than one minute. At other key points, patients would need to sit down and do a guided check-in, more comprehensively, which would take up to 10 minutes.",
          "Designing for both ensured rich data capture while giving patients a mechanism for low-impact participation during little pockets of time, fitting with their actual lived experience.",
        ],
      },
      {
        type: "video",
        layout: "desktop-showcase",
        videoSrc: "/images/astrazeneca/Reflect-Demo.mov",
        videoLabel: "Reflect — Patient Video Check-in Demo",
      },
      {
        type: "images",
        layout: "photo-grid",
        images: [
          {
            label: "User Flow — Patient & Clinician Interaction Paths",
            src: "/images/astrazeneca/User-Flow.png",
          },
          {
            label: "Annotated Screens — Video Check-in Functional Specifications",
            src: "/images/astrazeneca/Annotations.png",
          },
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Patient-Reported Outcomes — Weekly Insight & Pain Tracking",
            src: "/images/astrazeneca/CARE-patient-reported-outcomes.png",
          },
        ],
      },
      {
        type: "text",
        sectionNumber: "04",
        sectionLabel: "Concept Exploration",
        heading: "Iterating on data visualization through rapid concept testing",
        body: [
          "Based on research insights, I led ideation through sketching and collaborative workshops with stakeholders. Multiple concept variations were developed to explore how patients could best understand their symptom data — from weekly insights and community comparisons to actionable pain management articles.",
          "Each concept was tested with real patients to understand which data presentations felt most useful and least overwhelming. This iterative process helped us converge on a design that balanced clinical rigor with genuine patient empathy.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Concept Testing — Symptom Data Visualization Explorations",
            src: "/images/astrazeneca/Concepts-Testing.png",
          },
          {
            label: "Design Variations — Pain Tracking Interface Iterations",
            src: "/images/astrazeneca/Variations.png",
          },
        ],
      },
    ],
    outcome: {
      heading: "Impact on clinical research",
      body: [
        "Through the iterative process, I led the team in designing an experience that patients loved, and that delivered rich data for the cancer research team. The platform demonstrated that thoughtful design can make clinical research more humane while simultaneously producing better data.",
      ],
      contributions: [
        "Product Discovery",
        "Design Leadership",
        "Interaction Design",
        "User Research",
        "Design Sprints",
      ],
      collaborators: [
        "Clinical Research Team",
        "Patients & Oncologists",
        "Engineering",
        "Product Management",
      ],
      tools: ["Figma", "FigJam", "Miro", "Sketch"],
    },
    nextProject: {
      slug: "wild-brains",
      title: "Wild Brains",
      subtitle: "Brain Wearable & Optimization App",
    },
  },
  {
    slug: "wild-brains",
    title: "Wild Brains",
    subtitle: "Brain Wearable + App",
    description:
      "Helped secure continued investment through end-to-end design of a brain training wearable app.",
    tags: ["Consumer Health", "Wearable", "Mobile", "Biofeedback"],
    color: "#a855f7",
    thumbnail: "/images/wb/upscale.png",
    heroImage: "/images/wb/upscale.png",
    heroObjectPosition: "top",
    meta: [
      { label: "Client", value: "Wild Brains" },
      { label: "Role", value: "Product Designer" },
      { label: "Stage", value: "Seed Round" },
      { label: "Platform", value: "iOS" },
    ],
    sections: [
      {
        type: "text",
        sectionNumber: "01",
        sectionLabel: "Overview",
        heading:
          "A wearable that reads your brain \u2014 and an app that trains it",
        body: [
          "Wild Brains is a direct-to-consumer brain optimization platform built around a lightweight EEG headband. The device measures neural activity in real time while the companion app translates that data into personalized training programs \u2014 creative exercises, focus sessions, and behavioral tracks designed to improve how users think, feel, and perform.",
          "I joined as the sole product designer during the company\u2019s seed round, working directly with the founder and a small engineering team. The challenge was twofold: make neuroscience accessible to a mainstream consumer audience, and create an experience compelling enough to drive daily engagement with a novel device category.",
        ],
      },
      {
        type: "quote",
        quote:
          "The hardest part wasn\u2019t visualizing brain data \u2014 it was making people feel something when they saw it.",
      },
      {
        type: "stats",
        stats: [
          { number: 33, suffix: "+", label: "Screens designed end-to-end" },
          {
            number: 4,
            suffix: "",
            label: "Brain metric dimensions tracked",
          },
          { number: 12, suffix: "+", label: "Personalization questions" },
          { number: 1, suffix: "", label: "Seed round secured" },
        ],
      },
      {
        type: "text",
        sectionNumber: "02",
        sectionLabel: "Onboarding",
        heading: "First touch \u2014 goals and basic profiling",
        body: [
          "The app opens with a brand moment, then immediately gets to work. Users set their primary goal and enter basic demographics \u2014 just enough to start generating a personalized plan. No account creation friction, no feature tours.",
        ],
      },
      {
        type: "images",
        layout: "phone-gallery",
        images: [
          {
            src: "/images/wb/new exports/Introduction.png",
            label: "Brand introduction",
          },
          {
            src: "/images/wb/new exports/Initial assessment-3.png",
            label: "Primary goal selection",
          },
          {
            src: "/images/wb/new exports/Initial assessment-1.png",
            label: "Age input",
          },
          {
            src: "/images/wb/new exports/Initial assessment-2.png",
            label: "Age confirmed",
          },
        ],
      },
      {
        type: "text",
        sectionNumber: "03",
        sectionLabel: "Assessment",
        heading: "Building a behavioral and psychological profile",
        body: [
          "The deeper assessment unfolds across eight questions \u2014 moving from binary personality dimensions to multi-select grids and analog sliders. Each interaction type is calibrated to the data it captures: chronotype, personality, self-perception, goals, focus capacity, and activity preferences.",
          "This data seeds the recommendation engine. By the time the assessment completes, the app has enough signal to generate a personalized 2-week training program.",
        ],
      },
      {
        type: "images",
        layout: "phone-gallery",
        images: [
          {
            src: "/images/wb/new exports/Initial assessment-4.png",
            label: "Chronotype",
          },
          {
            src: "/images/wb/new exports/Initial assessment-10.png",
            label: "Self-description",
          },
          {
            src: "/images/wb/new exports/Initial assessment-9.png",
            label: "Goals",
          },
          {
            src: "/images/wb/new exports/Initial assessment-11.png",
            label: "Activity preferences",
          },
        ],
      },
      {
        type: "images",
        layout: "phone-gallery",
        images: [
          {
            src: "/images/wb/new exports/Guidance-1.png",
            label: "Generating personalized plan",
          },
          {
            src: "/images/wb/new exports/Guidance-2.png",
            label: "Ready to begin",
          },
        ],
      },
      {
        type: "text",
        sectionNumber: "04",
        sectionLabel: "Your Brain",
        heading: "Turning neural signals into something you can feel",
        body: [
          "This was the core design challenge: how do you make EEG data legible to someone who isn\u2019t a neuroscientist? We explored multiple visualization approaches \u2014 from radar charts mapping four cognitive dimensions, to 3D brain renderings with activity hotspots, to simple bar breakdowns.",
          "Each approach served a different context. The radar chart works for at-a-glance brain profiles, the 3D rendering creates an emotional connection to the data, and the bar charts support comparison across sessions.",
        ],
      },
      {
        type: "images",
        layout: "phone-gallery",
        images: [
          {
            src: "/images/wb/new exports/Aggregate data-1.png",
            label: "3D brain activity map",
          },
          {
            src: "/images/wb/new exports/Aggregate data.png",
            label: "Session benchmark \u2014 76%",
          },
        ],
      },
      {
        type: "images",
        layout: "phone-gallery",
        images: [
          {
            src: "/images/wb/new exports/Feed Option 1.png",
            label: "Radar chart",
          },
          {
            src: "/images/wb/new exports/Feed Option 2.png",
            label: "Radar with insight panel",
          },
          {
            src: "/images/wb/new exports/Feed Option 3.png",
            label: "3D brain with breakdown",
          },
        ],
      },
      {
        type: "text",
        sectionNumber: "05",
        sectionLabel: "Activities",
        heading: "Structured brain training through creative exercises",
        body: [
          "Training programs are the core engagement loop \u2014 structured 2-week curricula of daily activities calibrated to the user\u2019s brain profile. The headband captures EEG data during each exercise, then reveals what the brain was doing afterward \u2014 creating a feedback loop between effort and neural response.",
        ],
      },
      {
        type: "images",
        layout: "phone-gallery",
        images: [
          {
            src: "/images/wb/new exports/Workout Plan Detail.png",
            label: "Program overview",
          },
          {
            src: "/images/wb/new exports/Workout Plan Detail-1.png",
            label: "Daily activity detail",
          },
        ],
      },
      {
        type: "images",
        layout: "phone-gallery",
        images: [
          {
            src: "/images/wb/new exports/Video.png",
            label: "Drawing activity",
          },
          {
            src: "/images/wb/new exports/Video-1.png",
            label: "Activity in progress",
          },
        ],
      },
      {
        type: "images",
        layout: "phone-gallery",
        images: [
          {
            src: "/images/wb/new exports/Guidance-3.png",
            label: "See inside your head",
          },
          {
            src: "/images/wb/new exports/Aggregate data-2.png",
            label: "Your brain on creativity",
          },
        ],
      },
      {
        type: "text",
        sectionNumber: "06",
        sectionLabel: "Walking the Path",
        heading: "A daily loop that makes progress visible",
        body: [
          "The home screen anchors the daily experience \u2014 surfacing the active training track, brain insight score, and weekly progress. The progress view maps the user\u2019s journey across four dimensions \u2014 Focus, Creativity, Anxiety, and Sleep \u2014 turning abstract cognitive improvement into a visible trajectory.",
        ],
      },
      {
        type: "images",
        layout: "phone-gallery",
        images: [
          {
            src: "/images/wb/new exports/Home.png",
            label: "Daily dashboard",
          },
          {
            src: "/images/wb/new exports/User Progress.png",
            label: "Multi-dimension progress",
          },
        ],
      },
    ],
    outcome: {
      heading: "From prototype to funded product",
      body: [
        "The design work I delivered became the foundation of Wild Brains\u2019 product vision during their seed round. The comprehensive screen designs, data visualization system, and personalization framework demonstrated a clear, compelling product experience that helped the company secure continued investment and the opportunity to scale.",
        "By borrowing engagement patterns from fitness and wellness apps, we made brain training feel approachable. By investing in data visualization, we made the science feel real. The combination gave investors confidence that this wasn\u2019t just a device \u2014 it was a daily habit.",
      ],
      contributions: [
        "Product Design",
        "UX Research",
        "Data Visualization",
        "Interaction Design",
      ],
      collaborators: ["Founder", "Engineering Team"],
      tools: ["Figma"],
    },
    nextProject: {
      slug: "content-studio",
      title: "Content Studio",
      subtitle: "Enterprise Content Platform",
    },
  },
  {
    slug: "content-studio",
    title: "Content Studio",
    subtitle: "Cyber Security Lab",
    description:
      "Accelerated cyber training authoring with a modular lab and learning platform.",
    tags: ["Defense", "Enterprise", "Canvas UI", "Design Systems"],
    color: "#06b6d4",
    thumbnail: "/images/content-studio/content-studio-cyber-training.png",
    heroImage: "/images/content-studio/content-studio-cyber-training.png",
    meta: [
      { label: "Client", value: "Ultimate Knowledge Inst. / CYBERCOM" },
      { label: "Role", value: "Lead Product Designer" },
      { label: "Duration", value: "2 Months" },
      { label: "Platform", value: "Web / Windows" },
    ],
    sections: [
      {
        type: "text",
        sectionNumber: "01",
        sectionLabel: "Background",
        heading:
          "An enterprise LMS with an integrated, highly configurable virtual lab environment.",
        body: [
          "As cyber threats continue to evolve, there is an increasing need for hands-on, realistic training environments for cybersecurity professionals. Traditional learning methods often fall short in providing practical experience with complex network topologies and diverse operating systems.",
          "The challenge was to design and implement an enterprise-level Learning Management System with an integrated, highly configurable virtual lab environment for cybersecurity staff to test and enhance their competencies.",
        ],
      },
      {
        type: "text",
        sectionNumber: "02",
        sectionLabel: "Canvas Environment",
        heading:
          "A modular Miro-style canvas for content authors to create training labs.",
        body: [
          "I designed a content authoring environment for educators and trainers to create competency-based assessments, as well as to design hands-on exercises. These tools serve the purpose of teaching new skills to existing staff (upskilling), as well as verifying competencies for new joiners.",
          "Users needed the ability to create custom palettes of containers and virtual machines, define network topology maps using subnet masks, routers, and connections, and inspect details like CPU cores and memory management. Crucially, the canvas supports creating intentionally broken scenarios — since diagnosing and fixing network issues is part of the skillset being taught.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Network Topology Canvas — Virtual Lab Designer",
            src: "/images/content-studio/content-studio-cyber-training.png",
          },
        ],
      },
      {
        type: "text",
        sectionNumber: "03",
        sectionLabel: "Content Authoring",
        heading: "A page workbench for building courses and interactive exercises",
        body: [
          "Beyond the virtual lab canvas, Content Studio includes a rich page editor for authoring course content. Educators can build structured curricula with rich text, embedded media, and interactive exercise blocks — including multiple-choice questions with automated grading and detailed explanations.",
          "The workbench supports courses ranging from introductory social engineering awareness to hands-on router configuration, all within a consistent authoring experience.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Page Workbench — Course Content Editor",
            src: "/images/content-studio/Page-Workbench-1.png",
          },
          {
            label: "Exercise Builder — Interactive Assessment Creation",
            src: "/images/content-studio/Create-New-Block.png",
          },
        ],
      },
    ],
    outcome: {
      heading: "Shipped within Sprint Zero",
      body: [
        "The Content Studio design was completed within the Sprint Zero phase and handed off for development. The design system and canvas-based authoring environment established a scalable foundation for the training platform.",
      ],
      contributions: [
        "Lead Product Design",
        "Design System Creation",
        "Canvas UI Design",
        "Enterprise UX",
      ],
      collaborators: [
        "Development Team",
        "Cybersecurity SMEs",
        "Training Specialists",
      ],
      tools: ["Figma", "FigJam", "Miro"],
    },
    nextProject: {
      slug: "collab-match",
      title: "CollabMatch",
      subtitle: "Collaborative Matching Platform",
    },
  },
  {
    slug: "collab-match",
    title: "CollabMatch",
    subtitle: "Networking",
    description:
      "A platform that matches doctors and pharmacists to facilitate collaboration, improving patient outcomes through better coordination between prescribers and dispensers.",
    tags: ["Healthcare", "Platform", "Matching", "Collaboration"],
    color: "#0ea5e9",
    thumbnail: "/images/collabmatch/Collab Match Cover.png",
    heroImage: "/images/collabmatch/collab-match-illustrative.png",
    meta: [
      { label: "Client", value: "CollabMatch (Startup)" },
      { label: "Role", value: "Product Designer" },
      { label: "Duration", value: "TBD" },
      { label: "Platform", value: "Web + Mobile" },
    ],
    sections: [
      {
        type: "text",
        sectionNumber: "01",
        sectionLabel: "Overview",
        heading: "Connecting doctors and pharmacists for better patient care",
        body: [
          "CollabMatch is a platform designed to bridge the gap between doctors and pharmacists, enabling them to find and collaborate with each other more effectively. The goal was to improve patient outcomes by making it easier for prescribers and dispensers to coordinate on treatment plans.",
          "Worked directly with the founder to understand the problem space — the lack of structured communication channels between doctors and pharmacists leads to medication errors, missed interactions, and suboptimal patient care. The platform needed to make matching intuitive and collaboration frictionless.",
        ],
      },
      {
        type: "text",
        sectionNumber: "02",
        sectionLabel: "Profile & Discovery",
        heading: "Making the right match",
        body: [
          "The core of the platform is a provider profile system — practitioners create detailed profiles with their collaboration preferences, specialties, location, and credentials. A review and rating system helps build trust between potential collaborators. The search and discovery experience lets providers filter by field of practice, location, and availability to find the right match.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            src: "/images/collabmatch/View Profile-desktop.png",
            label: "Provider profile with reviews and active connections",
          },
        ],
      },
      {
        type: "text",
        sectionNumber: "03",
        sectionLabel: "Messaging",
        heading: "From discovery to collaboration",
        body: [
          "Once matched, providers communicate through a built-in messaging system. The mobile-first messaging experience supports the real-world workflow — physicians and pharmacists coordinating on the go between appointments and consultations. Connection slots and a freemium upgrade path drive the business model.",
        ],
      },
      {
        type: "images",
        layout: "phone-gallery",
        images: [
          {
            src: "/images/collabmatch/Messages-mobile-2.png",
            label: "Search Physicians",
          },
          {
            src: "/images/collabmatch/Profile-mobile.png",
            label: "Provider profile",
          },
          {
            src: "/images/collabmatch/Messages-mobile.png",
            label: "Messages inbox",
          },
          {
            src: "/images/collabmatch/Chat-mobile.png",
            label: "Chat thread",
          },
        ],
      },
    ],
    outcome: {
      heading: "Enabling healthcare collaboration",
      body: [
        "Designed the end-to-end experience from profile creation to active collaboration, working directly with the founder to validate the matching model and messaging flows with practicing healthcare professionals.",
      ],
      contributions: [
        "Product Design",
        "UX Research",
        "Interaction Design",
        "Prototyping",
      ],
      collaborators: ["Founder"],
      tools: ["Figma"],
    },
    nextProject: {
      slug: "uscis",
      title: "USCIS",
      subtitle: "U.S. Citizenship & Immigration Services",
    },
  },
  {
    slug: "uscis",
    title: "USCIS",
    subtitle: "U.S. Citizenship & Immigration",
    description:
      "Streamlined identity verification for 5,000+ adjudicators by redesigning USCIS core identity platform.",
    tags: ["GovTech", "DHS", "Enterprise", "Identity & Access"],
    color: "#1e3a5f",
    heroImage: "/images/uscis/cis-1.webp",
    thumbnail: "/images/uscis/cis-7.webp",
    meta: [
      { label: "Client", value: "USCIS / DHS" },
      { label: "Role", value: "Craft Lead, Interaction Design" },
      { label: "Duration", value: "2 years" },
      { label: "Scope", value: "Field Research, Identity & Case-Management UX, RBAC/ABAC, Delivery" },
    ],
    sections: [
      {
        type: "text",
        sectionNumber: "01",
        sectionLabel: "Context",
        heading: "Redesigning the backbone of DHS identity services",
        body: [
          "CIS 2 is the main identity system used by USCIS adjudicators to verify applicant qualifications and check historical encounters. Originally designed in the 1970s, it had become the backbone for DHS identity services that downstream platforms depend on — but it was showing its age.",
          "How might we drive person-centric identity and case-management UX — A-number search, cross-record timelines, audit/lineage, RBAC/ABAC, and error-handling — at a scale of 5,000+ users processing ~35k applications per day?",
        ],
      },
      {
        type: "text",
        sectionNumber: "02",
        sectionLabel: "My Role",
        heading: "Leading design across four work streams",
        body: [
          "Craft Lead for interaction design, managing a team of 6 designers across 4 work streams. I was hands-on with design while also leading teams as the face of the work to external stakeholders across USCIS, ICE, and CBP.",
        ],
      },
      {
        type: "stats",
        stats: [
          { number: 5, suffix: "k+", label: "Users" },
          { number: 35, suffix: "k", label: "Apps / day" },
          { number: 100, suffix: "+", label: "User interviews" },
          { number: 16, suffix: "", label: "Design sprint weeks" },
        ],
      },
      {
        type: "text",
        sectionNumber: "03",
        sectionLabel: "Field Research",
        heading: "Starting with the people doing the work",
        body: [
          "We conducted contextual research at ports of entry along the U.S.–Mexico border and at service centers across the country — shadowing adjudicators, observing intake processes, and conducting over 100 user interviews to understand how the system was actually being used.",
        ],
      },
      {
        type: "images",
        layout: "photo-grid",
        images: [
          { src: "/images/uscis/cis-2.webp", label: "Field research at the border", height: 640 },
        ],
      },
      {
        type: "text",
        sectionNumber: "04",
        sectionLabel: "Observations",
        heading: "A paper-heavy reality",
        body: [
          "What we found was a heavily paper-based system. Case files were physically bundled, routed, and tracked by hand. Adjudicators toggled between dozens of fragmented digital systems — none of which they fully trusted — to verify a single applicant’s identity.",
        ],
      },
      {
        type: "images",
        layout: "photo-grid",
        images: [
          { src: "/images/uscis/cis-3.webp", label: "Paper-based case files observed during field research", height: 640 },
        ],
      },
      {
        type: "text",
        sectionNumber: "05",
        sectionLabel: "Site Visits",
        heading: "Understanding how systems overlapped",
        body: [
          "We focused on two things: people’s working relationships and the data they need. We visited sites across the country — California, Texas, Florida, Missouri, Vermont, Virginia, and more.",
          "At the end, we understood how systems overlapped. Some were being used for just one data point, presenting a clear opportunity to simplify.",
        ],
      },
      {
        type: "images",
        layout: "photo-grid",
        images: [
          { src: "/images/uscis/cis-4.webp", label: "Site visit locations across the United States", height: 640 },
        ],
      },
      {
        type: "text",
        sectionNumber: "06",
        sectionLabel: "Systems Analysis",
        heading: "Mapping 25+ platforms across four agencies",
        body: [
          "We mapped every system touching the adjudication process — 25+ platforms spanning USCIS, ICE, CBP, and external agencies. The system usage matrix revealed massive overlap: some systems existed solely for a single data point.",
          "We also mapped the human side — the web of relationships around each adjudicator — to understand how information actually flowed between roles.",
        ],
      },
      {
        type: "images",
        layout: "photo-grid",
        images: [
          { src: "/images/uscis/cis-5.webp", label: "System usage matrix by agency", height: 640 },
        ],
      },
      {
        type: "images",
        layout: "photo-grid",
        images: [
          { src: "/images/uscis/cis-6.webp", label: "Stakeholder relationship map", height: 640 },
        ],
      },
      {
        type: "text",
        sectionNumber: "07",
        sectionLabel: "Design Sprints",
        heading: "16 sprint weeks of discovery and testing",
        body: [
          "We ran 16 design sprint weeks, each focused on a theme surfaced during research, to discover and validate product features. We tested with users at least twice per week, iterating rapidly between rounds.",
        ],
      },
      {
        type: "text",
        sectionNumber: "08",
        sectionLabel: "Solution",
        heading: "One cohesive interface — like a Google search",
        body: [
          "The core idea — “make it feel like a Google search” — survived every iteration. CIS 2 became a person-centric interface: a single A-number search surfaces cross-record timelines, biographic data, encounter history, and potential identity matches — all in one view.",
          "Granular RBAC/ABAC controls ensure each role sees exactly what they need, with full audit lineage. The system now serves 5,000+ users processing approximately 35,000 applications per day.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          { src: "/images/uscis/cis-7.webp", label: "CIS 2 — Identity resolution interface" },
        ],
      },
    ],
    outcome: {
      heading: "The backbone of DHS identity services",
      body: [
        "By consolidating disparate systems into a unified, person-centric platform, adjudicators gained a single source of truth for applicant identity — with cross-record timelines, granular RBAC/ABAC controls, and full audit lineage. CIS 2 now serves as the foundation that downstream platforms depend on.",
      ],
      contributions: [
        "Design Leadership",
        "Field Research",
        "Co-creation Workshops",
        "Identity & Case-Management UX",
        "RBAC / ABAC Design",
        "Interaction Design",
        "Iterative Prototyping",
        "Delivery",
      ],
      collaborators: [
        "1 Design Lead",
        "4 IxD",
        "1 VizD",
        "1 Business Designer",
      ],
      tools: ["Figma", "Prototyping"],
    },
    nextProject: {
      slug: "vulcan",
      title: "Vulcan",
      subtitle: "DoD Innovation Platform",
    },
  },
  {
    slug: "vulcan",
    title: "Vulcan",
    subtitle: "DoD Innovation Platform",
    description:
      "An innovation management platform where government agencies issue calls for entries and commercial-sector innovators submit proposals and technical demos. Part of the deep tech pipeline modernizing how SOCOM conducts BAAs and acquires new capabilities.",
    tags: ["Defense", "GovTech", "Innovation", "Enterprise"],
    color: "#475569",
    thumbnail: "/images/vulcan/vulcan.png",
    heroImage: "/images/vulcan/vulcan.png",
    heroObjectPosition: "top",
    meta: [
      { label: "Client", value: "Cylitix / DoD (SOCOM)" },
      { label: "Role", value: "Product Designer" },
      { label: "Duration", value: "2 Months" },
      { label: "Platform", value: "Web" },
    ],
    sections: [
      {
        type: "text",
        sectionNumber: "01",
        sectionLabel: "Overview",
        heading: "Modernizing how the Department of Defense discovers innovation",
        body: [
          "Vulcan is an innovation platform built for Cylitix with sponsorship from the Department of Defense. It modernizes the Broad Agency Announcement (BAA) process — how agencies like SOCOM issue calls for capabilities and how commercial-sector innovators respond with proposals and technical demonstrations.",
          "The platform sits at the center of the deep tech pipeline, connecting government needs with commercial innovation in a structured, searchable, and evaluable way.",
        ],
      },
      {
        type: "text",
        sectionNumber: "02",
        sectionLabel: "Call Authoring",
        heading: "Building structured calls for innovation",
        body: [
          "Government program managers create calls through a multi-step authoring flow. The form builder supports conditional logic, branching, and custom question types — from technical focus areas to cost estimates and milestone timelines. Skip logic lets authors create adaptive submission forms that route innovators through relevant sections based on their domain.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            src: "/images/vulcan/form-skip-logic.png",
            label: "Form builder with conditional skip logic",
          },
        ],
      },
      {
        type: "text",
        sectionNumber: "03",
        sectionLabel: "Question Types",
        heading: "Flexible data collection for complex submissions",
        body: [
          "The platform supports a range of question types tailored to defense innovation evaluation — from ROM cost estimates and milestone timelines to technical capability assessments. Each question type is configurable with validation rules, optional fields, and rich text context.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            src: "/images/vulcan/8.png",
            label: "ROM Cost Estimate question type",
          },
          {
            src: "/images/vulcan/11.png",
            label: "Milestone timeline configuration",
          },
        ],
      },
      {
        type: "text",
        sectionNumber: "04",
        sectionLabel: "Access Controls",
        heading: "Managing collaboration across agencies",
        body: [
          "Calls involve multiple stakeholders across different government organizations. The access control system lets program managers invite editors, set visibility permissions, and manage who can view and modify call details — supporting the complex organizational dynamics of defense procurement.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            src: "/images/vulcan/Add an Editor and Set Visibility.png",
            label: "Editor management and visibility controls",
          },
        ],
      },
      {
        type: "quote",
        quote: "Note: project content is illustrative.",
      },
    ],
    outcome: {
      heading: "Enabling the deep tech pipeline",
      body: [
        "The platform supports SOCOM’s modernized approach to capability acquisition, streamlining the path from government need to commercial innovation through structured authoring, evaluation, and collaboration tools.",
      ],
      contributions: [
        "Product Design",
        "Search UX",
        "Information Architecture",
        "Design System",
      ],
      collaborators: ["Cylitix Team", "DoD Stakeholders"],
      tools: ["Figma"],
    },
    nextProject: {
      slug: "t-rowe-price",
      title: "T. Rowe Price",
      subtitle: "Retirement Investment Platform",
    },
  },
  {
    slug: "t-rowe-price",
    title: "T. Rowe Price",
    subtitle: "Retail Investment 401(k)",
    description:
      "Reduced support calls by 40% by redesigning 401(k) self-serve and guidance flows.",
    tags: ["Finance", "Enterprise", "Design Leadership"],
    color: "#0891b2",
    thumbnail: "/images/trowe-price/Landing-page-401k-overview.jpg",
    heroImage: "/images/trowe-price/Landing-page-401k-overview.jpg",
    meta: [
      { label: "Client", value: "T. Rowe Price" },
      { label: "Role", value: "Senior Manager, UX Design Lead" },
      { label: "Scope", value: "Product Design & Strategy" },
      { label: "Platform", value: "Web & Mobile" },
    ],
    sections: [
      {
        type: "text",
        sectionNumber: "01",
        sectionLabel: "Overview",
        heading:
          "Empowering retail investors to manage their 401(k) with confidence.",
        body: [
          "T. Rowe Price’s 401(k) service for retail investors relied heavily on support calls for account management, including distributions. Investors often felt guilty or discouraged when making withdrawals, and the process lacked financial wellness support.",
          "The goal was to create a self-service platform that empowered investors to manage their 401(k) accounts while providing guidance and support to minimize the negative impact of withdrawals.",
        ],
      },
      {
        type: "text",
        sectionNumber: "02",
        sectionLabel: "Design Sprint",
        heading: "A two-day product design workshop bringing together customers and stakeholders",
        body: [
          "I led a comprehensive two-day product design workshop, based on a modified form of the Google Ventures design sprint. We co-created with a diverse range of customers, designers, engineers, stakeholders, SMEs, and product managers.",
          "Teams mapped the end-to-end investor journey — from evaluating options through finalizing a withdrawal — using Jobs-to-be-Done frameworks to uncover the functional, emotional, and social dimensions of each decision point.",
        ],
      },
      {
        type: "images",
        layout: "photo-grid",
        images: [
          {
            label: "Design Sprint — Journey Mapping & Jobs-to-be-Done Workshop",
            src: "/images/trowe-price/Workshop-UXR.jpg",
          },
          {
            label: "Collaborative Workshop — Team Mapping Session",
            src: "/images/trowe-price/workshop-yellow-1.jpeg",
          },
        ],
      },
      {
        type: "text",
        sectionNumber: "03",
        sectionLabel: "Prototyping",
        heading: "Educational content and tools to understand the impact of withdrawals",
        body: [
          "Key concepts included a self-service platform for managing 401(k) accounts including distributions, educational content and tools to help investors understand the impact of withdrawals and explore alternatives, personalized financial wellness support and goal-setting features, and emotionally supportive language and design elements.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "401(k) Platform — Account Overview & Withdrawal Options",
            src: "/images/trowe-price/Landing-page-401k-overview.jpg",
          },
        ],
      },
      {
        type: "stats",
        stats: [
          {
            number: 40,
            suffix: "%",
            label: "Reduction in support calls related to distributions",
          },
          {
            number: 30,
            suffix: "%",
            label: "Increase in investor engagement with educational content",
          },
          {
            number: 20,
            suffix: "%",
            label: "Reduction in average amount withdrawn per distribution",
          },
        ],
      },
      {
        type: "text",
        sectionNumber: "04",
        sectionLabel: "Iterative Testing",
        heading: "Discovering and fixing discoverability issues in real time",
        body: [
          "Regular tests were run to confirm or falsify hypotheses under consideration. In one instance, the team realized that users may not even have known where to look for the starting point of the flow.",
          "Based on that learning, they quickly pivoted to address discoverability issues, restructured some of the IA on the sitewide nav, and changed terminology to be less jargon-laden — such as changing ‘take a distribution’ to ‘take a withdrawal.’",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Usability Testing — Task Success Rates & Navigation Analysis",
            src: "/images/trowe-price/03-Testing-UXR.png",
          },
        ],
      },
      {
        type: "text",
        sectionNumber: "05",
        sectionLabel: "Design System",
        heading:
          "Contributing to the company-wide enterprise design system",
        body: [
          "Because I served as both a UX design lead and a Senior Manager, I played an active role in contributing to the company-wide enterprise design system. My team met with several of the other design chapters across the innovation lab on a weekly basis, coordinating to ensure that every innovation could benefit the whole group.",
        ],
      },
    ],
    outcome: {
      heading: "Measurable business impact",
      body: [
        "The 401(k) self-service platform and financial wellness support features were launched to retail investors, resulting in a 40% reduction in support calls, 30% increase in educational engagement, and 20% reduction in withdrawal amounts. The project demonstrated that empathetic, well-researched design can directly improve both business metrics and human outcomes.",
      ],
      contributions: [
        "UX Design Lead",
        "Design Sprint Facilitation",
        "User Research",
        "Design System",
        "Product Strategy",
      ],
      collaborators: [
        "Product Managers",
        "Engineers",
        "Customer Support",
        "Subject Matter Experts",
      ],
      tools: ["Sketch", "InVision", "Miro", "Jira"],
    },
    nextProject: {
      slug: "benchling",
      title: "Benchling",
      subtitle: "Life Sciences Marketing Site & Component System",
    },
  },
  {
    slug: "benchling",
    title: "Benchling",
    subtitle: "Life Sciences Marketing",
    description:
      "Redesigned the marketing site for a $6B life sciences R&D platform — structuring content strategy, zone diagrams, and a scalable component system built for CMS.",
    tags: ["SaaS", "Biotech", "Component System", "Marketing"],
    color: "#1652f0",
    thumbnail: "/images/benchling/homepage.png",
    heroImage: "/images/benchling/homepage.png",
    meta: [
      { label: "Client", value: "Benchling (via Code & Theory)" },
      { label: "Role", value: "Product Designer" },
      { label: "Duration", value: "3 Months" },
      { label: "Platform", value: "Web" },
    ],
    sections: [
      {
        type: "video",
        layout: "desktop-showcase",
        videoSrc: "/images/benchling/area.mp4",
        videoLabel: "Benchling — Live Site",
      },
      {
        type: "text",
        sectionNumber: "01",
        sectionLabel: "The Brief",
        heading:
          "A $6B biotech platform needed a marketing site that could scale with the product",
        body: [
          "Benchling is a life sciences R&D cloud platform used by over 200,000 scientists at companies like Moderna, Regeneron, and Gilead. Their existing marketing site hadn't kept pace with the product — it lacked a high-end visual style, wasn't structured systematically, and couldn't scale as the company added new product lines, use cases, and content.",
          "Working with Code & Theory, I was part of a three-person design team — myself, a UX designer, and a visual designer. We collaboratively tackled the content strategy, zone diagrams, visual look and feel, and component architecture for a comprehensive redesign of the product and company marketing site.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Homepage — The Life Sciences R&D Cloud",
            src: "/images/benchling/homepage.png",
          },
          {
            label: "Homepage — Alternate Direction",
            src: "/images/benchling/homepage-alt.png",
          },
        ],
      },
      {
        type: "text",
        sectionNumber: "02",
        sectionLabel: "Systematic Design",
        heading:
          "Zone diagrams and components that tell stories in a repeatable way",
        body: [
          "The core challenge wasn't just making it look better — it was making it scalable. Every page needed to be built from reusable zones and components that could be assembled and maintained through a CMS. I focused on standardizing and componentizing everything so that as Benchling added product pages, use cases, and landing pages, the team could build them consistently without starting from scratch each time.",
          "We designed zone diagrams that structured content into repeatable narrative patterns — hero sections, product feature breakdowns, customer proof points, CTAs — and delivered a comprehensive template guide covering desktop and mobile specifications for every component.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Notebook Product Page — Feature Breakdown & Social Proof",
            src: "/images/benchling/notebook-product.png",
          },
          {
            label: "Validated Cloud — Enterprise Compliance & Security",
            src: "/images/benchling/validated-cloud.png",
          },
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Benchling for Startups — Onboarding & Pricing",
            src: "/images/benchling/startups.png",
          },
          {
            label: "Careers — Mission & Culture",
            src: "/images/benchling/careers.png",
          },
        ],
      },
      {
        type: "text",
        sectionNumber: "03",
        sectionLabel: "Component System",
        heading:
          "A template guide that made the system buildable and maintainable",
        body: [
          "The template guide documented every component across desktop and mobile — specifying layout, spacing, content requirements, and responsive behavior. This wasn't a design system in the traditional sense — it was a production blueprint that gave the engineering and content teams everything they needed to build and extend the site independently.",
        ],
      },
      {
        type: "images",
        images: [
          {
            label: "Template Guide — Full Component Inventory (Desktop & Mobile)",
            src: "/images/benchling/template-guide.jpg",
            height: 600,
          },
        ],
      },
    ],
    outcome: {
      heading: "A scalable foundation still in use today",
      body: [
        "The site shipped and Benchling continues to use the structural and strategic foundation we designed. They've extended and improved it since, but the zone-based architecture and component approach remain in place — exactly the kind of longevity you want from a systematic design engagement.",
      ],
      contributions: [
        "Component Architecture",
        "Content Strategy",
        "Zone Diagrams (UX)",
        "Visual Design",
        "Responsive Design",
      ],
      collaborators: [
        "Code & Theory",
        "UX Designer",
        "Visual Designer",
        "Benchling Marketing Team",
      ],
      tools: ["Figma", "Sketch"],
    },
    nextProject: {
      slug: "goldman-sachs",
      title: "Goldman Sachs",
      subtitle: "Equities & Fixed Income Advisory Platform",
    },
  },
  {
    slug: "goldman-sachs",
    title: "Goldman Sachs",
    subtitle: "Equities + Fixed Income",
    description:
      "Replaced a homegrown spreadsheet system with a scalable strategy advisory platform used by Goldman Sachs financial advisors and registered franchise partners.",
    tags: ["Finance", "Enterprise", "Internal Tools"],
    color: "#1e3a5f",
    thumbnail: "/images/goldman-sachs/dashboard-fixed-income.jpg",
    heroImage: "/images/goldman-sachs/dashboard-fixed-income.jpg",
    heroObjectPosition: "top",
    meta: [
      { label: "Client", value: "Goldman Sachs" },
      { label: "Role", value: "Product Designer" },
      { label: "Duration", value: "1 Month" },
      { label: "Platform", value: "Web App" },
    ],
    sections: [
      {
        type: "text",
        sectionNumber: "01",
        sectionLabel: "The Problem",
        heading:
          "Financial advisors were running portfolio strategy on spreadsheets",
        body: [
          "Goldman Sachs Asset Management needed to scale a critical internal workflow. An advisor inside the firm had developed a homegrown set of spreadsheets for evaluating and recommending investment strategies to clients. It worked for her — but it didn't scale across the firm or to the registered advisors who use the GS franchise.",
          "The firm made her the product owner for turning it into a real product. I worked with her, another UX designer, and a visual designer to design a web-based strategy advisory platform — under the constraint that everything had to speak Goldman Sachs's existing visual language.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Advisor Dashboard — Portfolio Overview & Strategy Exploration",
            src: "/images/goldman-sachs/dashboard-fixed-income.jpg",
          },
        ],
      },
      {
        type: "text",
        sectionNumber: "02",
        sectionLabel: "Strategy Selection",
        heading:
          "Helping advisors find the right strategy in minutes, not hours",
        body: [
          "The core flow lets advisors enter a few basic account criteria — investment amount, time horizon, risk profile — and quickly narrow down which fixed income or equity strategies to recommend. The platform surfaces strategy descriptions, available offerings, and key metrics like yield and duration, then lets advisors run a transition analysis or generate a client-ready report.",
          "I designed the strategy selection experience with progressive disclosure: advisors start with a clean, scannable overview, then drill into strategy details only when they need depth. Filtering by themes, tax status, and asset class lets them narrow options without losing context on what's available.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Choose a Strategy — Account Criteria & Offering Comparison",
            src: "/images/goldman-sachs/choose-strategy.png",
          },
          {
            label: "Strategy Filters — Theme-Based Exploration",
            src: "/images/goldman-sachs/strategy-filter-themes.png",
          },
        ],
      },
      {
        type: "text",
        sectionNumber: "03",
        sectionLabel: "Strategy Detail",
        heading:
          "From overview to recommendation with full context",
        body: [
          "Each strategy detail page gives advisors everything they need to make a recommendation: a strategy snapshot with risk and return characteristics, available offerings with yield and duration comparisons, and a learning center with relevant research and fact sheets. Advisors can request a transition analysis directly from the detail page — replacing a process that previously required back-and-forth emails with the internal team.",
        ],
      },
      {
        type: "images",
        layout: "desktop-showcase",
        images: [
          {
            label: "Municipal Fixed Income — Strategy Detail & Transition Analysis",
            src: "/images/goldman-sachs/municipal-fixed-income-detail.png",
          },
        ],
      },
    ],
    outcome: {
      heading: "From spreadsheets to scalable product",
      body: [
        "The firm transitioned away from the spreadsheet-based workflow and into a scalable advisory platform — usable not only by internal advisors but also by registered advisors across the Goldman Sachs franchise for portfolio transition recommendations.",
        "The project demonstrated how to take an expert's homegrown workflow and turn it into a product that preserves her domain expertise while making it accessible to hundreds of advisors across the firm.",
      ],
      contributions: [
        "Product Design",
        "Information Architecture",
        "Interaction Design",
      ],
      collaborators: [
        "Product Owner (Internal Advisor)",
        "UX Designer",
        "Visual Designer",
        "Engineering Team",
      ],
      tools: ["Figma"],
    },
    nextProject: {
      slug: "clarvos",
      title: "Clarvos",
      subtitle: "Agentic AI Ad Platform",
    },
  },
];

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return PROJECTS.map((p) => p.slug);
}
