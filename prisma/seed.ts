/**
 * Seed script — popula o banco com projetos de demo e configura os settings iniciais.
 * Uso: npm run seed
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("TURSO_DATABASE_URL não definido. Configure o .env.local");
  process.exit(1);
}

const adapter = new PrismaLibSql({ url, authToken });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ---------------------------------------------------------------------------
// Dados de demo — Ganancias (proyectos concluidos)
// ---------------------------------------------------------------------------

const COMPLETED_PROJECTS = [
  // Noviembre
  {
    platform: "upwork",
    externalId: "demo-done-upw-001",
    title: "React Dashboard for Analytics SaaS",
    description: "Built an analytics dashboard with real-time charts, filters and CSV export. React 18 + TypeScript + Recharts.",
    url: "https://www.upwork.com/jobs/done-001",
    tags: JSON.stringify(["react", "typescript", "dashboard", "recharts"]),
    matchScore: 88,
    scoreReason: "Stack React + TypeScript totalmente alineado.",
    proposalStatus: "concluida",
    proposalValue: 1800,
    statusUpdatedAt: new Date("2025-11-12"),
    postedAt: new Date("2025-11-01"),
  },
  {
    platform: "remoteok",
    externalId: "demo-done-rok-001",
    title: "Node.js API Integration — Stripe + Webhooks",
    description: "Implemented Stripe subscription billing and webhook handling for a B2B SaaS product.",
    url: "https://remoteok.com/jobs/done-001",
    tags: JSON.stringify(["node.js", "stripe", "api", "typescript"]),
    matchScore: 82,
    scoreReason: "Backend Node.js + integrações de pagamento.",
    proposalStatus: "concluida",
    proposalValue: 950,
    statusUpdatedAt: new Date("2025-11-28"),
    postedAt: new Date("2025-11-15"),
  },
  // Diciembre
  {
    platform: "trampos",
    externalId: "demo-done-trm-001",
    title: "MVP de Aplicativo Web — Next.js + Prisma",
    description: "Desenvolveu MVP completo de plataforma de agendamento com autenticação, painel admin e integração com calendário.",
    url: "https://trampos.co/done-001",
    tags: JSON.stringify(["next.js", "prisma", "typescript", "mvp"]),
    matchScore: 91,
    scoreReason: "Stack idêntico ao perfil principal. Projeto bem definido.",
    proposalStatus: "concluida",
    proposalValue: 3200,
    statusUpdatedAt: new Date("2025-12-15"),
    postedAt: new Date("2025-12-01"),
  },
  {
    platform: "freelancer",
    externalId: "demo-done-frl-001",
    title: "WhatsApp Bot + OpenAI Integration",
    description: "Built automated customer support bot using WhatsApp Business API and OpenAI for a retail client.",
    url: "https://www.freelancer.com/done-001",
    tags: JSON.stringify(["whatsapp", "openai", "node.js", "api"]),
    matchScore: 76,
    scoreReason: "Integração de IA + messaging. Entregue dentro do prazo.",
    proposalStatus: "concluida",
    proposalValue: 720,
    statusUpdatedAt: new Date("2025-12-22"),
    postedAt: new Date("2025-12-10"),
  },
  // Enero
  {
    platform: "upwork",
    externalId: "demo-done-upw-002",
    title: "TypeScript Refactor — Legacy Codebase Migration",
    description: "Migrated a 15k LOC JavaScript codebase to TypeScript with strict mode. Set up ESLint, Prettier and pre-commit hooks.",
    url: "https://www.upwork.com/jobs/done-002",
    tags: JSON.stringify(["typescript", "refactoring", "eslint", "node.js"]),
    matchScore: 85,
    scoreReason: "TypeScript + qualidade de código são diferenciais do perfil.",
    proposalStatus: "concluida",
    proposalValue: 2400,
    statusUpdatedAt: new Date("2026-01-18"),
    postedAt: new Date("2026-01-05"),
  },
  {
    platform: "torre",
    externalId: "demo-done-tor-001",
    title: "Frontend Engineer — Design System Implementation",
    description: "Built a component library from scratch using React + Tailwind + Storybook for a fintech startup.",
    url: "https://torre.ai/done-001",
    tags: JSON.stringify(["react", "tailwind", "storybook", "design system"]),
    matchScore: 89,
    scoreReason: "Design system + React + Tailwind — combinação exata do perfil.",
    proposalStatus: "concluida",
    proposalValue: 1650,
    statusUpdatedAt: new Date("2026-01-30"),
    postedAt: new Date("2026-01-15"),
  },
  // Febrero
  {
    platform: "remotive",
    externalId: "demo-done-rem-001",
    title: "AI Feature Integration — Claude API + Next.js",
    description: "Integrated Claude API into an existing Next.js SaaS to power smart text suggestions and document summarization.",
    url: "https://remotive.com/done-001",
    tags: JSON.stringify(["claude", "ai", "next.js", "typescript"]),
    matchScore: 94,
    scoreReason: "Claude API + Next.js — match perfeito com stack atual.",
    proposalStatus: "concluida",
    proposalValue: 2800,
    statusUpdatedAt: new Date("2026-02-14"),
    postedAt: new Date("2026-02-01"),
  },
  {
    platform: "guru",
    externalId: "demo-done-gur-001",
    title: "Client Portal — React + Firebase Auth",
    description: "Delivered a secure client portal with role-based access, file uploads and real-time notifications.",
    url: "https://www.guru.com/done-001",
    tags: JSON.stringify(["react", "firebase", "typescript", "portal"]),
    matchScore: 74,
    scoreReason: "React + auth — área de domínio, Firebase é adjacente.",
    proposalStatus: "concluida",
    proposalValue: 1100,
    statusUpdatedAt: new Date("2026-02-27"),
    postedAt: new Date("2026-02-10"),
  },
  // Marzo
  {
    platform: "upwork",
    externalId: "demo-done-upw-003",
    title: "E-commerce Checkout Optimization — Next.js",
    description: "Rebuilt checkout flow reducing cart abandonment by 23%. Implemented SSR, optimistic UI and Stripe Elements.",
    url: "https://www.upwork.com/jobs/done-003",
    tags: JSON.stringify(["next.js", "stripe", "e-commerce", "performance"]),
    matchScore: 86,
    scoreReason: "Next.js + Stripe + performance. Impacto mensurável no negócio.",
    proposalStatus: "concluida",
    proposalValue: 3500,
    statusUpdatedAt: new Date("2026-03-20"),
    postedAt: new Date("2026-03-03"),
  },
  {
    platform: "trampos",
    externalId: "demo-done-trm-002",
    title: "Painel Administrativo — React + API REST",
    description: "Construiu painel de gestão de pedidos com tabelas, filtros avançados, exportação e gráficos em tempo real.",
    url: "https://trampos.co/done-002",
    tags: JSON.stringify(["react", "typescript", "dashboard", "api"]),
    matchScore: 83,
    scoreReason: "CRUD + dashboard React. Projeto bem delimitado.",
    proposalStatus: "concluida",
    proposalValue: 1900,
    statusUpdatedAt: new Date("2026-03-31"),
    postedAt: new Date("2026-03-15"),
  },
] as const;

// ---------------------------------------------------------------------------
// Dados de demo — Projetos ativos
// ---------------------------------------------------------------------------

const DEMO_PROJECTS = [
  // --- RemoteOK ---
  {
    platform: "remoteok",
    externalId: "demo-rok-001",
    title: "Senior Full-Stack Developer (React + Node.js)",
    description:
      "We're looking for an experienced full-stack developer to join our remote team. You'll build features for our SaaS platform used by 10,000+ businesses. Stack: React 18, TypeScript, Node.js, PostgreSQL, AWS. Must have 4+ years experience and strong communication skills.",
    url: "https://remoteok.com/jobs/demo-001",
    budget: "$80–120/hr",
    tags: JSON.stringify(["react", "node.js", "typescript", "postgresql", "aws"]),
    matchScore: 91,
    scoreReason: "Perfil técnico alineado: React + TypeScript + Node.js. Rango de pago muy atractivo.",
    postedAt: daysAgo(1),
  },
  {
    platform: "remoteok",
    externalId: "demo-rok-002",
    title: "Backend Engineer – Python / FastAPI",
    description:
      "Join a fintech startup building payment infrastructure for Latin America. You'll design REST APIs, integrate with payment gateways and work closely with the product team. Python, FastAPI, PostgreSQL, Redis, Docker.",
    url: "https://remoteok.com/jobs/demo-002",
    budget: "$60–80/hr",
    tags: JSON.stringify(["python", "fastapi", "postgresql", "redis", "docker"]),
    matchScore: 72,
    scoreReason: "Backend sólido pero stack Python no es el principal. Contexto LatAm relevante.",
    postedAt: daysAgo(2),
  },
  // --- WeWorkRemotely ---
  {
    platform: "weworkremotely",
    externalId: "demo-wwr-001",
    title: "React Native Developer for Mobile App Rebuild",
    description:
      "Our app has 50k users and needs a full rebuild with React Native. You'll work directly with the CTO on architecture decisions. We value clean code, good tests, and clear communication. 6-month contract with possibility of extension.",
    url: "https://weworkremotely.com/jobs/demo-001",
    budget: "$6,500/month",
    tags: JSON.stringify(["react native", "mobile", "typescript", "ios", "android"]),
    matchScore: 84,
    scoreReason: "React Native com TypeScript está alinhado. Contrato de 6 meses — boa estabilidade.",
    postedAt: daysAgo(1),
  },
  {
    platform: "weworkremotely",
    externalId: "demo-wwr-002",
    title: "DevOps / Platform Engineer",
    description:
      "Looking for a DevOps engineer to help us scale our infrastructure from 100 to 1,000 tenants. Kubernetes, Terraform, GCP. You'll own the deployment pipeline and observability stack.",
    url: "https://weworkremotely.com/jobs/demo-002",
    budget: "$90–110/hr",
    tags: JSON.stringify(["devops", "kubernetes", "terraform", "gcp", "observability"]),
    matchScore: 55,
    scoreReason: "Área adjacente, não é o foco principal do perfil. Pode valer para diversificação.",
    postedAt: daysAgo(3),
  },
  // --- Remotive ---
  {
    platform: "remotive",
    externalId: "demo-rem-001",
    title: "Frontend Developer – Next.js & Tailwind",
    description:
      "We're a design-forward SaaS company looking for a frontend specialist. You'll own the UI layer: component library, performance, accessibility. Next.js 14, Tailwind CSS, Radix UI, Figma handoff. Design system experience is a plus.",
    url: "https://remotive.com/jobs/demo-001",
    budget: "$5,000–7,000/month",
    tags: JSON.stringify(["next.js", "tailwind", "react", "typescript", "figma"]),
    matchScore: 95,
    scoreReason: "Combinação exata: Next.js + Tailwind + TypeScript. Match altíssimo com o perfil.",
    postedAt: daysAgo(0),
  },
  {
    platform: "remotive",
    externalId: "demo-rem-002",
    title: "AI Product Engineer – Claude / OpenAI Integration",
    description:
      "We're building AI-powered features for our productivity platform. You'll implement LLM integrations (Claude, OpenAI), design prompt workflows and build the backend that powers them. TypeScript, Prisma, Vercel.",
    url: "https://remotive.com/jobs/demo-002",
    budget: "$70–100/hr",
    tags: JSON.stringify(["ai", "llm", "claude", "typescript", "prisma", "vercel"]),
    matchScore: 89,
    scoreReason: "Stack idêntico ao deste projeto. Experiência com Claude API é diferencial direto.",
    postedAt: daysAgo(1),
  },
  {
    platform: "remotive",
    externalId: "demo-rem-003",
    title: "WordPress Developer – WooCommerce Expert",
    description:
      "We need help migrating our e-commerce store from Magento to WooCommerce. Must have 3+ years WooCommerce experience, custom theme development and payment gateway integration.",
    url: "https://remotive.com/jobs/demo-003",
    budget: "$30–45/hr",
    tags: JSON.stringify(["wordpress", "woocommerce", "php", "magento"]),
    matchScore: 18,
    scoreReason: "WordPress/PHP fora do perfil. Baixa compatibilidade técnica.",
    postedAt: daysAgo(4),
  },
  // --- Upwork ---
  {
    platform: "upwork",
    externalId: "demo-upw-001",
    title: "TypeScript / Prisma API Developer – Long Term",
    description:
      "We have a growing SaaS platform built on Node.js, TypeScript and Prisma. Looking for a developer to join on a long-term basis (20hrs/week minimum). You'll work on new API endpoints, database migrations and performance optimization. Excellent English required.",
    url: "https://www.upwork.com/jobs/demo-001",
    budget: "$55/hr",
    tags: JSON.stringify(["typescript", "prisma", "node.js", "api", "postgresql"]),
    matchScore: 88,
    scoreReason: "Stack muito próximo. Longo prazo com 20h/semana — boa previsibilidade de renda.",
    postedAt: daysAgo(2),
  },
  {
    platform: "upwork",
    externalId: "demo-upw-002",
    title: "Next.js Developer for Landing Page Optimization",
    description:
      "Short project (2–3 weeks): optimize our marketing landing page built in Next.js. Core Web Vitals are failing. Need someone who understands SSR, image optimization, bundle splitting and A/B testing setup.",
    url: "https://www.upwork.com/jobs/demo-002",
    budget: "$1,200–1,800 (fixed)",
    tags: JSON.stringify(["next.js", "performance", "core web vitals", "seo"]),
    matchScore: 77,
    scoreReason: "Projeto curto mas bem definido. Next.js + performance é área de domínio.",
    postedAt: daysAgo(1),
  },
  {
    platform: "upwork",
    externalId: "demo-upw-003",
    title: "Data Entry Specialist – Excel & Google Sheets",
    description:
      "We need someone to manually enter and clean product data across 500 SKUs. Must be detail-oriented and fast. No special technical skills required beyond Excel proficiency.",
    url: "https://www.upwork.com/jobs/demo-003",
    budget: "$5/hr",
    tags: JSON.stringify(["excel", "data entry", "google sheets"]),
    matchScore: 4,
    scoreReason: "Não é área de atuação. Ignorar.",
    isDiscarded: true,
    postedAt: daysAgo(5),
  },
  // --- Trampos ---
  {
    platform: "trampos",
    externalId: "demo-trm-001",
    title: "Desenvolvedor Front-end Sênior – React",
    description:
      "Startup de edtech busca desenvolvedor front-end sênior para liderar a evolução da plataforma de aprendizado. Stack: React, TypeScript, Next.js, Storybook. Time completamente remoto, cultura horizontal, equity disponível.",
    url: "https://trampos.co/oportunidades/demo-001",
    budget: "R$ 12.000–16.000/mês",
    tags: JSON.stringify(["react", "typescript", "next.js", "storybook", "edtech"]),
    matchScore: 86,
    scoreReason: "Stack alinhado. Equity e cultura remota são bons indicadores de empresa saudável.",
    postedAt: daysAgo(2),
  },
  {
    platform: "trampos",
    externalId: "demo-trm-002",
    title: "Freelancer Full-Stack – Projeto de 3 Meses",
    description:
      "Empresa de logística busca desenvolvedor full-stack para construir painel administrativo do zero. Node.js backend + React frontend, integração com APIs de rastreamento. Prazo: 90 dias, pagamento quinzenal.",
    url: "https://trampos.co/oportunidades/demo-002",
    budget: "R$ 8.000/mês",
    tags: JSON.stringify(["node.js", "react", "api", "logística", "full-stack"]),
    matchScore: 80,
    scoreReason: "Projeto bem definido com prazo claro. Stack familiar. Boa oportunidade.",
    postedAt: daysAgo(3),
  },
  // --- Torre ---
  {
    platform: "torre",
    externalId: "demo-tor-001",
    title: "Senior Software Engineer – LatAm Remote",
    description:
      "We're a Series B company building infrastructure for e-commerce in Latin America. Looking for a senior engineer with strong JavaScript/TypeScript skills to work on our core platform. Compensation in USD.",
    url: "https://torre.ai/jobs/demo-001",
    budget: "$4,500–6,500/month USD",
    tags: JSON.stringify(["javascript", "typescript", "node.js", "react", "e-commerce"]),
    matchScore: 83,
    scoreReason: "Compensação em USD + contexto LatAm. Stack sólido e match técnico alto.",
    postedAt: daysAgo(1),
  },
  // --- Guru ---
  {
    platform: "guru",
    externalId: "demo-gur-001",
    title: "Web App Developer – React + Firebase",
    description:
      "Looking for a React developer to build a client portal for our consulting firm. Features: authentication, dashboard, file uploads, notifications. Firebase backend. Estimated 80–100 hours of work.",
    url: "https://www.guru.com/jobs/demo-001",
    budget: "$50/hr",
    tags: JSON.stringify(["react", "firebase", "typescript", "dashboard"]),
    matchScore: 74,
    scoreReason: "Projeto scoped e bem descrito. Firebase é adjacente ao stack, curva de aprendizado baixa.",
    postedAt: daysAgo(4),
  },
  {
    platform: "guru",
    externalId: "demo-gur-002",
    title: "Logo & Brand Identity Designer",
    description:
      "We need a complete brand identity package for our new startup: logo, color palette, typography, business cards, social media templates. AI-generated designs are not accepted.",
    url: "https://www.guru.com/jobs/demo-002",
    budget: "$300–600 (fixed)",
    tags: JSON.stringify(["design", "logo", "brand identity", "illustrator"]),
    matchScore: 9,
    scoreReason: "Design gráfico fora do perfil de desenvolvimento.",
    isDiscarded: true,
    postedAt: daysAgo(6),
  },
  // --- Freelancer.com ---
  {
    platform: "freelancer",
    externalId: "demo-frl-001",
    title: "Chatbot Integration Developer – WhatsApp + OpenAI",
    description:
      "We need a developer to integrate a WhatsApp chatbot with our CRM. The bot should use OpenAI API to answer customer questions automatically. Node.js or Python backend. Budget is negotiable for the right person.",
    url: "https://www.freelancer.com/projects/demo-001",
    budget: "$500–800",
    tags: JSON.stringify(["chatbot", "whatsapp", "openai", "node.js", "api"]),
    matchScore: 79,
    scoreReason: "Integração de IA + WhatsApp é área crescente. Orçamento baixo mas escopo definido.",
    postedAt: daysAgo(2),
  },
  // Projeto favorito com proposta
  {
    platform: "remotive",
    externalId: "demo-rem-fav-001",
    title: "Staff Engineer – Platform & Developer Experience",
    description:
      "We're a remote-first company of 80 engineers looking for a Staff Engineer to own our internal developer platform. You'll improve CI/CD, define coding standards and mentor mid-level engineers. TypeScript/Node.js stack, AWS infrastructure.",
    url: "https://remotive.com/jobs/demo-fav-001",
    budget: "$160,000–200,000/year",
    tags: JSON.stringify(["staff engineer", "platform", "typescript", "node.js", "aws", "mentoring"]),
    matchScore: 92,
    scoreReason: "Posição de liderança técnica. Salário excelente, empresa madura. Alta prioridade.",
    isFavorite: true,
    proposalStatus: "em_negociacao",
    proposalText:
      "Hi! I'm excited about this Staff Engineer role. Over the past 5 years I've built and maintained developer platforms for distributed teams, with a focus on TypeScript/Node.js stacks and AWS infrastructure.\n\nI've led initiatives that reduced CI/CD pipeline times by 60% and established coding standards adopted across 3 product teams. I genuinely enjoy the mentorship side of staff roles — helping engineers grow is as satisfying as shipping great infrastructure.\n\nI'd love to learn more about your current developer experience pain points and how this role interfaces with the broader engineering org. Available for a call this week.",
    statusUpdatedAt: daysAgo(2),
    postedAt: daysAgo(3),
  },
] as const;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱 Iniciando seed...\n");

  // 1. Configurar Settings — desabilitar conectores com Playwright e os instáveis
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {
      activeIndeed: false,
      activeSoyFreelancer: false,
      activeProgramathor: false,
      activeWorkana: false,    // scraping instável
      active99Freelas: false,  // scraping instável
    },
    create: {
      id: 1,
      activeRemoteOK: true,
      activeWeWorkRemotely: true,
      activeRemotive: true,
      activeTrampos: true,
      activeTorre: true,
      activeGuru: true,
      activeWorkana: false,
      active99Freelas: false,
      activeIndeed: false,
      activeSoyFreelancer: false,
      activeProgramathor: false,
    },
  });

  console.log("✓ Settings configurados (conectores Playwright desativados)\n");

  // 2. Inserir projetos concluídos (Ganancias)
  let inserted = 0;
  let skipped = 0;

  for (const project of COMPLETED_PROJECTS) {
    const existing = await prisma.project.findUnique({
      where: { platform_externalId: { platform: project.platform, externalId: project.externalId } },
    });
    if (existing) { skipped++; continue; }

    await prisma.project.create({
      data: {
        platform: project.platform,
        externalId: project.externalId,
        title: project.title,
        description: project.description,
        url: project.url,
        tags: project.tags,
        matchScore: project.matchScore,
        scoreReason: project.scoreReason,
        proposalStatus: project.proposalStatus,
        proposalValue: project.proposalValue,
        statusUpdatedAt: project.statusUpdatedAt,
        postedAt: project.postedAt,
        collectedAt: project.postedAt,
      },
    });
    inserted++;
    console.log(`  ✓ [concluido][${project.platform}] ${project.title.slice(0, 55)}...`);
  }

  // 3. Inserir projetos ativos (dashboard)
  for (const project of DEMO_PROJECTS) {
    const { isDiscarded = false, isFavorite = false, proposalStatus, proposalText, statusUpdatedAt, ...rest } = project as typeof project & {
      isDiscarded?: boolean;
      isFavorite?: boolean;
      proposalStatus?: string;
      proposalText?: string;
      statusUpdatedAt?: Date;
    };

    const existing = await prisma.project.findUnique({
      where: { platform_externalId: { platform: rest.platform, externalId: rest.externalId } },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.project.create({
      data: {
        ...rest,
        isDiscarded,
        isFavorite,
        proposalStatus: proposalStatus ?? null,
        proposalText: proposalText ?? null,
        statusUpdatedAt: statusUpdatedAt ?? null,
        collectedAt: rest.postedAt ?? new Date(),
      },
    });

    inserted++;
    console.log(`  ✓ [${rest.platform}] ${rest.title.slice(0, 60)}...`);
  }

  console.log(`\n✅ Seed concluído: ${inserted} projetos inseridos, ${skipped} já existiam.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed falhou:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
