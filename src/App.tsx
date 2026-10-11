// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { 
  Calculator, Sparkles, LayoutGrid, Plus, Folder, CheckCircle, DollarSign, Clock, 
  Trash2, Copy, FileText, PlayCircle, PlusCircle, ArrowRight, X, Cpu, LogIn, ShieldCheck, 
  Sun, Moon, Settings, BarChart3, ListChecks, Layers, Sliders, AlertTriangle, ChevronRight, 
  Download, RefreshCw, Layers3, Users, HelpCircle, Check, ArrowUpRight, TrendingUp, Filter,
  ShieldAlert, Target, Lightbulb, Zap, Server, Database, Globe, Search, ArrowDownRight, Edit3, Menu, ChevronDown, Home
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, RadialLinearScale } from 'chart.js';
import { Bar, Radar, Doughnut } from 'react-chartjs-2';
import ReactMarkdown from 'react-markdown';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, RadialLinearScale);
ChartJS.defaults.font.family = "'Nunito Sans', ui-sans-serif, system-ui, sans-serif";

// ==========================================
// 1. CONSTANTS & INITIAL DATA
// ==========================================

type ProjectAssumptions = {
  budget?: number;
  targetTimeline?: number;
  teamSize?: number;
  devMonthlyRate?: number;
  productPrice?: number;
  expectedCustomers?: number;
  cloudBudget?: number;
  apiBudget?: number;
  marketingBudget?: number;
  [key: string]: any;
};

type ProjectRecord = {
  name?: string;
  type?: string;
  description?: string;
  targetUsers?: string;
  expectedUsers?: number;
  businessModel?: string;
  requirements?: any[];
  features?: any[];
  assumptions?: ProjectAssumptions;
  techStack?: any[];
  [key: string]: any;
};

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

const DEFAULT_ASSUMPTIONS = {
  budget: 750000,
  targetTimeline: 4,
  teamSize: 3,
  devMonthlyRate: 85000,
  productPrice: 499,
  expectedCustomers: 350,
  cloudBudget: 10000,
  apiBudget: 5000,
  marketingBudget: 250000
};

// ==========================================
// CURRENCY HELPERS
// ==========================================

const formatINR = (value) => {
  const amount = Number(value) || 0;
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
};

const formatMonths = (months) => {
  const value = Number(months);
  if (!Number.isFinite(value) || value <= 0) return 'Not enough scope data';
  if (value < 1) {
    const weeks = Math.max(1, Math.round(value * 4.345));
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  }
  return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)} ${value === 1 ? 'month' : 'months'}`;
};

const formatRecoveryTime = (months) => {
  const value = Number(months);
  if (!Number.isFinite(value) || value <= 0) return 'Not recoverable under current assumptions';
  return formatMonths(value);
};

const normalizeText = (value = '') => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const SAMPLE_PROJECTS = [
  {
    id: 'proj-1',
    name: 'FinTech AI Micro-Lending Portal',
    description: 'Automated credit risk assessment and instant loan origination platform for small business loans with real-time bank account verification and automated scoring.',
    type: 'AI/ML Platform',
    targetUsers: 'Underbanked SMBs & Commercial Loan Officers',
    expectedUsers: 12000,
    businessModel: 'Usage-based',
    status: 'Analyzed',
    createdAt: '2026-03-01',
    requirements: [
      { id: 'r1', text: 'Real-time bank feed synchronization via Plaid API', type: 'Functional', source: 'User Provided', complexity: 'High', ambiguous: false, duplicate: false },
      { id: 'r2', text: 'ML Risk Scoring Model with 99.9% uptime requirement', type: 'Non-Functional', source: 'User Provided', complexity: 'High', ambiguous: false, duplicate: false },
      { id: 'r3', text: 'SOC2 Type II Compliance & AES-256 Data Encryption at rest', type: 'Non-Functional', source: 'AI Suggested', complexity: 'Critical', ambiguous: false, duplicate: false },
      { id: 'r4', text: 'Automated ACH payment disbursement upon approval', type: 'Functional', source: 'AI Suggested', complexity: 'Medium', ambiguous: false, duplicate: false }
    ],
    features: [
      { id: 'f1', name: 'User Authentication & KYC Verification', description: 'Biometric & ID document verification via Identity API', priority: 'High', complexity: 'Medium', dependencies: 'None', source: 'AI Suggested', accepted: true },
      { id: 'f2', name: 'AI Credit Risk Scoring Pipeline', description: 'Automated algorithm processing cashflow & credit bureau data', priority: 'High', complexity: 'Critical', dependencies: 'Plaid Sync', source: 'AI Suggested', accepted: true },
      { id: 'f3', name: 'Loan Application Portal', description: 'Applicant dashboard to upload documents and track disbursement', priority: 'High', complexity: 'Low', dependencies: 'Auth', source: 'Custom', accepted: true },
      { id: 'f4', name: 'ACH Automated Disbursement Engine', description: 'Payment gateway integration for automatic funding', priority: 'Medium', complexity: 'High', dependencies: 'KYC', source: 'Custom', accepted: true }
    ],
    assumptions: {
      budget: 900000,
      targetTimeline: 5,
      teamSize: 4,
      devMonthlyRate: 90000,
      productPrice: 120,
      expectedCustomers: 450,
      cloudBudget: 20000,
      apiBudget: 10000,
      marketingBudget: 25000
    },
    techStack: [
      { category: 'Frontend', current: 'React / Vite', recommended: 'Next.js App Router', reason: 'Better SEO for loan portals and faster server-side rendering of financial reports.', costDiff: 0, accepted: true },
      { category: 'Backend Framework', current: 'Express JS', recommended: 'FastAPI (Python)', reason: 'Native compatibility with pandas, scikit-learn, and async credit processing pipelines.', costDiff: -2500, accepted: true },
      { category: 'Database', current: 'PostgreSQL', recommended: 'Supabase PostgreSQL + PgVector', reason: 'Built-in RBAC, vector search for fraud detection, and instant REST/GraphQL endpoints.', costDiff: -1200, accepted: true }
    ]
  }
];

// ==========================================
// 2. DETERMINISTIC CALCULATION ENGINE
// ==========================================

const estimationEngine = {
  calculateHours: (features = []) => {
    let hours = 0;

    features.filter(f => f.accepted !== false).forEach(f => {
      switch (f.complexity) {
        case 'Low': hours += 30; break;
        case 'Medium': hours += 75; break;
        case 'High': hours += 150; break;
        case 'Critical': hours += 280; break;
        default: hours += 60;
      }
    });

    return hours || 200;
  },

  calculateEstimates: (features = [], assumptions: ProjectAssumptions = {}, acceptedTech = []) => {
    const totalHours = estimationEngine.calculateHours(features);
    const teamSize = Math.max(1, Number(assumptions.teamSize) || 3);
    const monthlyRate = Math.max(0, Number(assumptions.devMonthlyRate) || 85000);
    const targetTimeline = Math.max(1, Number(assumptions.targetTimeline) || 4);

    const techCostAdjustment = acceptedTech.reduce(
      (acc, t) => acc + (t.accepted ? (Number(t.costDiff) || 0) : 0),
      0
    );

    const baseDevCost = Math.round(
      (totalHours / 160) * monthlyRate * (teamSize > 4 ? 1.12 : 1)
    );
    const personnelCost = Math.round(baseDevCost * 0.28);
    const cloudCost = Math.round((Number(assumptions.cloudBudget) || 10000) * targetTimeline);
    const apiCost = Math.round((Number(assumptions.apiBudget) || 5000) * targetTimeline);
    const qaCost = Math.round(baseDevCost * 0.12);
    const contingency = Math.round(baseDevCost * 0.10);

    const totalCost = Math.max(10000,
      baseDevCost + personnelCost + cloudCost + apiCost + qaCost + contingency + techCostAdjustment
    );

    const timelineMonths = parseFloat(
      (totalHours / (teamSize * 120)).toFixed(1)
    );

    const expectedCustomers = Math.max(0, Number(assumptions.expectedCustomers) || 350);
    const price = Math.max(0, Number(assumptions.productPrice) || 499);
    const monthlyRevenue = expectedCustomers * price;
    const monthlyOperatingCost =
      (Number(assumptions.cloudBudget) || 10000) +
      (Number(assumptions.apiBudget) || 5000) +
      (Number(assumptions.marketingBudget) || 25000) +
      Math.round(monthlyRevenue * 0.08);

    const netMonthlyProfit = monthlyRevenue - monthlyOperatingCost;
    const profitMargin = monthlyRevenue > 0
      ? parseFloat(((netMonthlyProfit / monthlyRevenue) * 100).toFixed(1))
      : 0;
    const breakEvenMonths = netMonthlyProfit > 0
      ? parseFloat((totalCost / netMonthlyProfit).toFixed(1))
      : null;
    const roiPercentage = totalCost > 0
      ? Math.round(((netMonthlyProfit * 12) / totalCost) * 100)
      : 0;

    return {
      totalHours,
      totalCost,
      costRangeMin: Math.round(totalCost * 0.85),
      costRangeMax: Math.round(totalCost * 1.22),
      timelineMonths,
      breakdown: {
        dev: baseDevCost,
        personnel: personnelCost,
        cloud: cloudCost,
        api: apiCost,
        qa: qaCost,
        contingency
      },
      financials: {
        monthlyRevenue,
        monthlyOperatingCost,
        netMonthlyProfit,
        profitMargin,
        breakEvenMonths,
        roiPercentage,
        budgetVariance: Number(assumptions.budget) > 0 ? totalCost - Number(assumptions.budget) : null
      }
    };
  }
};

// ==========================================
// 3. DYNAMIC RISK & CONSTRAINT DETECTION ENGINES
// ==========================================

const constraintEngine = {
  analyze: (project, estimates) => {
    const constraints = [];
    const assumptions = project.assumptions || {};

    if (estimates.totalCost > assumptions.budget) {
      const diff = estimates.totalCost - assumptions.budget;
      constraints.push({
        constraint: 'Budget Limit Exceeded',
        currentValue: formatINR(estimates.totalCost),
        expectedValue: formatINR(assumptions.budget),
        severity: diff > 25000 ? 'Critical' : 'High',
        impact: `Estimated scope exceeds available funding budget by ${formatINR(diff)}. Risk of mid-development project collapse.`,
        solution: 'Reduce high/critical complexity features or increase seed capital budget by 20%.'
      });
    }

    if (estimates.timelineMonths > assumptions.targetTimeline) {
      constraints.push({
        constraint: 'Target Timeline Slippage',
        currentValue: `${estimates.timelineMonths} Months`,
        expectedValue: `${assumptions.targetTimeline} Months`,
        severity: (estimates.timelineMonths - assumptions.targetTimeline) > 2 ? 'High' : 'Medium',
        impact: 'Development estimated duration exceeds planned market launch window.',
        solution: 'Increase engineering team size by 1-2 full-time developers or simplify MVP scope.'
      });
    }

    if (assumptions.teamSize < 2 && estimates.totalHours > 400) {
      constraints.push({
        constraint: 'Single Developer Dependency',
        currentValue: `${assumptions.teamSize} Dev`,
        expectedValue: 'Min 2-3 Devs',
        severity: 'High',
        impact: 'Bus-factor risk is extremely high. Key-person dependency will stall project if illness or turnover occurs.',
        solution: 'Pair lead architect with at least one mid-level engineer or dedicated QA resource.'
      });
    }

    if (project.expectedUsers > 10000 && (assumptions.cloudBudget || 0) < 30000) {
      constraints.push({
        constraint: 'Underfunded Infrastructure Budget',
        currentValue: `${formatINR(assumptions.cloudBudget)}/month`,
        expectedValue: 'Recommended: ₹30,000+/month',
        severity: 'Medium',
        impact: 'Cloud database auto-scaling and CDN costs will exceed allocated cloud budget under peak traffic.',
        solution: 'Increase monthly infrastructure budget to handle automated database read-replicas and caching.'
      });
    }

    return constraints;
  }
};

const riskEngine = {
  analyze: (project, estimates) => {
    const risks = [];

    const features = project.features || [];
    const requirements = project.requirements || [];
    const assumptions = project.assumptions || {};

    const criticalCount = features.filter(f => f.complexity === 'Critical').length;

    if (criticalCount > 0) {
      risks.push({
        risk: 'High Technical Complexity',
        severity: criticalCount >= 3 ? 'Critical' : 'High',
        probability: criticalCount >= 3 ? 'Very High' : 'High',
        impact: `${criticalCount} critical feature(s) may require additional development, testing and integration effort.`,
        mitigation: 'Create proof-of-concepts for critical components before full development.'
      });
    }

    const budget = Number(assumptions.budget) || 0;
    if (budget > 0 && estimates.totalCost > budget) {
      const percentage = ((estimates.totalCost - budget) / budget) * 100;
      risks.push({
        risk: 'Budget Overrun Risk',
        severity: percentage > 25 ? 'Critical' : 'High',
        probability: percentage > 25 ? 'High' : 'Medium',
        impact: `The estimated cost is approximately ${percentage.toFixed(0)}% above the available budget.`,
        mitigation: 'Reduce scope, prioritize MVP features or increase the available budget.'
      });
    }

    const targetTimeline = Number(assumptions.targetTimeline) || 1;
    if (estimates.timelineMonths > targetTimeline) {
      risks.push({
        risk: 'Timeline Delay Risk',
        severity: estimates.timelineMonths > targetTimeline + 2 ? 'High' : 'Medium',
        probability: estimates.timelineMonths > targetTimeline + 2 ? 'High' : 'Medium',
        impact: `Estimated delivery is ${(estimates.timelineMonths - targetTimeline).toFixed(1)} months beyond the target.`,
        mitigation: 'Increase team capacity or move lower-priority features to a later release.'
      });
    }

    if (estimates.financials.breakEvenMonths === null || estimates.financials.breakEvenMonths > 12) {
      risks.push({
        risk: 'Slow Cost Recovery',
        severity: 'High',
        probability: 'Medium',
        impact: estimates.financials.breakEvenMonths === null
          ? 'The current pricing and operating-cost assumptions do not generate enough monthly profit to recover the initial project cost.'
          : `The project may require ${estimates.financials.breakEvenMonths} months to recover its initial cost.`,
        mitigation: 'Improve pricing, customer acquisition or reduce operating costs.'
      });
    }

    const securityRequirements = requirements.filter(r => r.type === 'Non-Functional');
    if (securityRequirements.length >= 2) {
      risks.push({
        risk: 'Security and Quality Overhead',
        severity: 'Medium',
        probability: 'Medium',
        impact: 'Multiple quality and security requirements may increase development and testing effort.',
        mitigation: 'Define measurable security and performance targets and test them throughout development.'
      });
    }

    const teamSize = Number(assumptions.teamSize) || 1;
    if (teamSize <= 1 && estimates.totalHours > 400) {
      risks.push({
        risk: 'Small Team Dependency',
        severity: 'High',
        probability: 'High',
        impact: 'A single developer may become a critical dependency for the entire project.',
        mitigation: 'Add another developer or reduce the initial project scope.'
      });
    }

    const hasDependencies = features.some(f => f.dependencies && f.dependencies !== 'None');
    if (hasDependencies) {
      risks.push({
        risk: 'Third-Party Dependency',
        severity: 'Medium',
        probability: 'Medium',
        impact: 'External APIs and services can change pricing, availability or technical limits.',
        mitigation: 'Use abstraction layers, caching and fallback mechanisms.'
      });
    }

    if (risks.length === 0) {
      risks.push({
        risk: 'Scope Change Risk',
        severity: 'Low',
        probability: 'Medium',
        impact: 'Additional requirements may increase project cost and delivery time.',
        mitigation: 'Freeze the MVP scope and review new requirements before implementation.'
      });
    }

    return risks;
  }
};

// ==========================================
// 4. FEASIBILITY SCORE COMPUTATION
// ==========================================

const feasibilityEngine = {
  calculate: (project, estimates, constraints, risks) => {
    const assumptions = project.assumptions || {};
    const features = project.features || [];
    const requirements = project.requirements || [];

    const criticalCount = features.filter(f => f.complexity === 'Critical').length;
    const highCount = features.filter(f => f.complexity === 'High').length;
    const ambiguousCount = requirements.filter(r => r.ambiguous).length;
    const duplicateCount = requirements.filter(r => r.duplicate).length;

    let technical = 100;
    technical -= criticalCount * 8;
    technical -= highCount * 3;
    technical -= ambiguousCount * 3;
    technical -= duplicateCount * 2;

    const budget = Number(assumptions.budget) || 0;
    const totalCost = Number(estimates.totalCost) || 0;
    const profit = Number(estimates.financials?.netMonthlyProfit) || 0;
    const recovery = Number(estimates.financials?.breakEvenMonths) || 999;

    let financial = 100;
    if (budget > 0) {
      const costRatio = totalCost / budget;
      if (costRatio > 1) financial -= Math.min(45, Math.round((costRatio - 1) * 100));
      else if (costRatio > 0.9) financial -= 12;
      else if (costRatio > 0.75) financial -= 6;
    }
    if (profit <= 0) financial -= 35;
    else if (recovery > 24) financial -= 25;
    else if (recovery > 12) financial -= 15;
    else if (recovery > 6) financial -= 6;

    const teamSize = Math.max(1, Number(assumptions.teamSize) || 1);
    const targetMonths = Math.max(1, Number(assumptions.targetTimeline) || 1);
    const requiredMonths = Number(estimates.timelineMonths) || 0;
    let resource = 100;
    if (teamSize === 1) resource -= 25;
    else if (teamSize === 2) resource -= 10;
    if (requiredMonths > targetMonths * 1.5) resource -= 20;

    let timeline = 100;
    const timelineRatio = requiredMonths / targetMonths;
    if (timelineRatio > 1) timeline -= Math.min(55, Math.round((timelineRatio - 1) * 60));
    else if (timelineRatio > 0.9) timeline -= 8;

    const customers = Math.max(0, Number(assumptions.expectedCustomers) || 0);
    const price = Math.max(0, Number(assumptions.productPrice) || 0);
    const revenue = Number(estimates.financials?.monthlyRevenue) || 0;
    let market = 100;
    if (customers < 100) market -= 25;
    else if (customers < 500) market -= 10;
    if (price <= 0) market -= 25;
    if (revenue <= 0) market -= 30;

    constraints.forEach(c => {
      if (c.severity === 'Critical') {
        financial -= 12;
        timeline -= 8;
      } else if (c.severity === 'High') {
        financial -= 6;
        timeline -= 4;
      }
    });

    risks.forEach(r => {
      if (r.severity === 'Critical') technical -= 10;
      else if (r.severity === 'High') technical -= 5;
    });

    technical = Math.max(0, Math.min(100, technical));
    financial = Math.max(0, Math.min(100, financial));
    resource = Math.max(0, Math.min(100, resource));
    timeline = Math.max(0, Math.min(100, timeline));
    market = Math.max(0, Math.min(100, market));

    const overallScore = Math.round(
      technical * 0.25 +
      financial * 0.25 +
      resource * 0.15 +
      timeline * 0.15 +
      market * 0.20
    );

    let rating = 'NOT RECOMMENDED';
    if (overallScore >= 80) rating = 'RECOMMENDED';
    else if (overallScore >= 65) rating = 'RECOMMENDED WITH CHANGES';
    else if (overallScore >= 50) rating = 'NEEDS MAJOR CHANGES';

    return {
      overallScore,
      rating,
      subScores: { technical, financial, resource, timeline, market },
      rationale: [
        `Technical feasibility: ${technical}/100 based on feature complexity and requirement quality.`,
        `Financial feasibility: ${financial}/100 based on project cost, available budget, profit and cost recovery time.`,
        `Resource feasibility: ${resource}/100 based on team capacity and estimated development effort.`,
        `Timeline feasibility: ${timeline}/100 based on estimated delivery time versus the target.`,
        `Market feasibility: ${market}/100 based on expected customers, pricing and estimated revenue.`,
        `The analysis identified ${constraints.length} constraint(s) and ${risks.length} risk(s).`
      ]
    };
  }
};


// ==========================================
// 5. PROJECT PLANNING INTELLIGENCE HELPERS
// ==========================================

const planningEngine = {
  estimateFeatures: (features = [], assumptions: ProjectAssumptions = {}) => {
    const teamSize = Math.max(1, Number(assumptions.teamSize) || 1);
    const monthlyRate = Math.max(0, Number(assumptions.devMonthlyRate) || 85000);
    const hourlyRate = monthlyRate / 160;
    return features.filter(f => f.accepted !== false).map((feature, index) => {
      const hours = ({ Low: 30, Medium: 75, High: 150, Critical: 280 }[feature.complexity] || 60);
      const engineeringCost = Math.round(hours * hourlyRate);
      const totalCost = Math.round(engineeringCost * 1.32);
      return {
        featureId: feature.id || `feature-${index}`,
        featureName: feature.name,
        complexity: feature.complexity || 'Medium',
        priority: feature.priority || 'Medium',
        dependencies: feature.dependencies || 'None',
        hours,
        engineeringCost,
        totalCost,
        estimatedWeeks: Math.max(1, Math.round((hours / (teamSize * 30)) * 10) / 10)
      };
    });
  },

  mapRequirementsToFeatures: (requirements = [], features = []) => {
    const featureRows = features.filter(f => f.accepted !== false);
    return requirements.map((req, index) => {
      const reqWords = new Set(normalizeText(req.text).split(/\s+/).filter(w => w.length >= 4));
      let best = null;
      let bestScore = 0;
      featureRows.forEach(feature => {
        const featureWords = new Set(normalizeText(`${feature.name} ${feature.description || ''}`).split(/\s+/).filter(w => w.length >= 4));
        let score = 0;
        reqWords.forEach(word => { if (featureWords.has(word)) score += 1; });
        const reqType = (req.type || '').toLowerCase();
        if (reqType === 'non-functional' && /security|performance|privacy|availability|scale|encrypt|uptime/.test(normalizeText(req.text))) score += 1;
        if (score > bestScore) { bestScore = score; best = feature; }
      });
      return {
        requirementId: req.id || `req-${index}`,
        requirement: req.text,
        type: req.type,
        complexity: req.complexity,
        feature: best ? best.name : 'Needs feature mapping',
        featureId: best?.id || null,
        confidence: bestScore >= 2 ? 'Strong' : bestScore === 1 ? 'Possible' : 'Needs review'
      };
    });
  },

  dependencyAnalysis: (features = []) => {
    const active = features.filter(f => f.accepted !== false);
    const names = new Map(active.map(f => [normalizeText(f.name), f.name]));
    const edges = [];
    const unresolved = [];
    active.forEach(feature => {
      const depText = String(feature.dependencies || '').trim();
      if (!depText || normalizeText(depText) === 'none') return;
      depText.split(/[,;]+/).map(s => s.trim()).filter(Boolean).forEach(dep => {
        const key = normalizeText(dep);
        const matched = names.get(key) || active.find(f => normalizeText(f.name).includes(key) || key.includes(normalizeText(f.name)))?.name;
        if (matched) edges.push({ from: feature.name, to: matched });
        else unresolved.push({ feature: feature.name, dependency: dep });
      });
    });
    const incoming = new Map(active.map(f => [f.name, 0]));
    edges.forEach(e => incoming.set(e.from, (incoming.get(e.from) || 0) + 1));
    const roots = active.filter(f => (incoming.get(f.name) || 0) === 0).map(f => f.name);
    const critical = edges.filter(e => active.find(f => f.name === e.from)?.complexity === 'Critical');
    return { edges, unresolved, roots, criticalCount: critical.length };
  },

  buildRoadmap: (features = [], assumptions: ProjectAssumptions = {}) => {
    const active = features.filter(f => f.accepted !== false);
    const ordered = [...active].sort((a, b) => {
      const p = { High: 0, Medium: 1, Low: 2 };
      return (p[a.priority] ?? 1) - (p[b.priority] ?? 1);
    });
    const phases = [
      { name: 'Discovery & Architecture', weeks: 0, items: [] },
      { name: 'Foundation & Core Workflow', weeks: 0, items: [] },
      { name: 'Supporting Features & Integrations', weeks: 0, items: [] },
      { name: 'QA, Security & Stabilization', weeks: 0, items: [] },
      { name: 'Deployment & Launch', weeks: 0, items: [] }
    ];
    ordered.forEach((feature, index) => {
      const target = index < Math.max(1, Math.ceil(ordered.length * 0.35)) ? phases[1] : phases[2];
      target.items.push(feature.name);
    });

    // Keep the roadmap duration consistent with the same deterministic estimate shown above.
    // Previously the roadmap independently summed feature weights, which could show 20+ weeks
    // while the main estimate showed ~1 month. One source of truth is much less confusing.
    const totalHours = estimationEngine.calculateHours(active);
    const teamSize = Math.max(1, Number(assumptions.teamSize) || 1);
    const totalWeeks = Math.max(1, totalHours / (teamSize * 120) * 4.345);
    const displayedTotalWeeks = Math.round(totalWeeks * 10) / 10;
    const phaseWeights = [0.15, 0.35, 0.25, 0.15, 0.10];

    // Allocate in 0.1-week units using a largest-remainder method. This guarantees
    // the visible phase durations add up EXACTLY to the visible roadmap total.
    const totalTenths = Math.max(1, Math.round(displayedTotalWeeks * 10));
    const rawTenths = phaseWeights.map(weight => totalTenths * weight);
    const phaseTenths = rawTenths.map(value => Math.floor(value));
    let remainingTenths = totalTenths - phaseTenths.reduce((sum, value) => sum + value, 0);
    const remainderOrder = rawTenths
      .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
      .sort((a, b) => b.remainder - a.remainder);
    let cursor = 0;
    while (remainingTenths > 0) {
      phaseTenths[remainderOrder[cursor % remainderOrder.length].index] += 1;
      remainingTenths -= 1;
      cursor += 1;
    }
    phases.forEach((phase, index) => {
      phase.weeks = phaseTenths[index] / 10;
    });

    return { phases, totalWeeks: displayedTotalWeeks, targetMonths: Number(assumptions.targetTimeline) || 1 };
  },

  buildResourcePlan: (project, estimates) => {
    const totalHours = Math.max(0, Math.round(Number(estimates?.totalHours) || 0));
    const profile = aiService.getDomainProfile(project?.type, project?.description, project?.name);

    const roles = [
      { role: 'Product / Project Lead', weight: 10, reason: 'Scope, requirements, priorities and delivery coordination.' },
      { role: 'Frontend Developer', weight: 25, reason: 'User workflows, responsive interface and client-side state.' },
      { role: 'Backend Developer', weight: 30, reason: 'APIs, business logic, data persistence and integrations.' },
      { role: 'QA / Test Engineer', weight: 15, reason: 'Functional, regression and acceptance testing.' },
      { role: 'UI/UX & Product Design', weight: 10, reason: 'User flow, usability and visual consistency.' },
      { role: 'DevOps / Deployment', weight: 10, reason: 'Environment, monitoring, deployment and reliability.' }
    ];

    // The allocation is intentionally project-aware rather than identical for every project.
    // It is still an effort allocation of the SAME totalHours used by the estimate; it is not
    // additional time added on top of the estimate.
    if (['commerce', 'food', 'travel', 'logistics', 'realestate'].includes(profile.key)) {
      roles.find(r => r.role === 'Frontend Developer').weight += 3;
      roles.find(r => r.role === 'Backend Developer').weight += 4;
      roles.find(r => r.role === 'QA / Test Engineer').weight += 2;
      roles.find(r => r.role === 'UI/UX & Product Design').weight += 1;
      roles.find(r => r.role === 'Product / Project Lead').weight -= 2;
      roles.find(r => r.role === 'DevOps / Deployment').weight -= 2;
    } else if (['fintech', 'healthcare'].includes(profile.key)) {
      roles.find(r => r.role === 'Backend Developer').weight += 4;
      roles.find(r => r.role === 'QA / Test Engineer').weight += 4;
      roles.find(r => r.role === 'DevOps / Deployment').weight += 2;
      roles.find(r => r.role === 'Frontend Developer').weight -= 3;
      roles.find(r => r.role === 'UI/UX & Product Design').weight -= 2;
      roles.find(r => r.role === 'Product / Project Lead').weight -= 5;
    } else if (profile.key === 'ai') {
      roles.splice(3, 0, { role: 'AI / ML Engineer', weight: 20, reason: 'Model, prompt, evaluation and AI pipeline work required by this project.' });
      roles.find(r => r.role === 'Backend Developer').weight += 2;
      roles.find(r => r.role === 'QA / Test Engineer').weight += 2;
      roles.find(r => r.role === 'Frontend Developer').weight -= 5;
      roles.find(r => r.role === 'UI/UX & Product Design').weight -= 4;
      roles.find(r => r.role === 'Product / Project Lead').weight -= 3;
    }

    // Feature complexity adds a small, deterministic adjustment so projects with more
    // critical/high complexity work do not receive the exact same role distribution.
    const features = project?.features || [];
    const critical = features.filter(f => f.accepted !== false && f.complexity === 'Critical').length;
    const high = features.filter(f => f.accepted !== false && f.complexity === 'High').length;
    if (critical + high > 0) {
      roles.find(r => r.role === 'QA / Test Engineer').weight += Math.min(critical * 2 + high, 8);
      roles.find(r => r.role === 'Backend Developer').weight += Math.min(critical + Math.floor(high / 2), 5);
    }

    const safeRoles = roles.filter(r => r.weight > 0);
    const totalWeight = safeRoles.reduce((sum, role) => sum + role.weight, 0) || 1;
    const rawHours = safeRoles.map(role => (totalHours * role.weight) / totalWeight);
    const assignedHours = rawHours.map(value => Math.floor(value));
    let remainingHours = totalHours - assignedHours.reduce((sum, value) => sum + value, 0);
    const remainderOrder = rawHours
      .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
      .sort((a, b) => b.remainder - a.remainder);
    let cursor = 0;
    while (remainingHours > 0 && remainderOrder.length > 0) {
      assignedHours[remainderOrder[cursor % remainderOrder.length].index] += 1;
      remainingHours -= 1;
      cursor += 1;
    }

    return {
      teamSize: Number(project?.assumptions?.teamSize) || 1,
      totalHours,
      roles: safeRoles.map((role, index) => ({ ...role, hours: assignedHours[index] }))
    };
  },

  compareScenarios: (project) => {
    const base = project.assumptions || {};
    const features = project.features || [];
    const make = (name, changes, note) => {
      const assumptions = { ...base, ...changes };
      const estimates = estimationEngine.calculateEstimates(features, assumptions, project.techStack || []);
      const constraints = constraintEngine.analyze({ ...project, assumptions }, estimates);
      const risks = riskEngine.analyze({ ...project, assumptions }, estimates);
      const feasibility = feasibilityEngine.calculate({ ...project, assumptions }, estimates, constraints, risks);
      return { name, note, assumptions, estimates, feasibility, constraints, risks };
    };
    const leanFeatures = features.filter(f => f.accepted !== false && f.priority !== 'Low');
    const leanProject = { ...project, features: leanFeatures };
    const lean = make('Lean MVP (Reduced Scope)', { teamSize: Math.max(1, (Number(base.teamSize) || 1) - 1) }, 'Removes low-priority features and uses one fewer developer where possible. Use this when the priority is reducing upfront cost.');
    const accelerated = make('Accelerated Delivery (Larger Team)', { teamSize: Math.min(10, (Number(base.teamSize) || 1) + 2) }, 'Adds delivery capacity with a larger team to reduce schedule pressure; the trade-off is higher personnel cost.');
    const baseEstimates = estimationEngine.calculateEstimates(features, base, project.techStack || []);
    const baseConstraints = constraintEngine.analyze(project, baseEstimates);
    const baseRisks = riskEngine.analyze(project, baseEstimates);
    const baseFeasibility = feasibilityEngine.calculate(project, baseEstimates, baseConstraints, baseRisks);
    // Recalculate Lean correctly using its reduced feature set.
    const leanEstimates = estimationEngine.calculateEstimates(leanFeatures, lean.assumptions, project.techStack || []);
    lean.estimates = leanEstimates;
    lean.constraints = constraintEngine.analyze(leanProject, leanEstimates);
    lean.risks = riskEngine.analyze(leanProject, leanEstimates);
    lean.feasibility = feasibilityEngine.calculate(leanProject, leanEstimates, lean.constraints, lean.risks);
    return [
      { name: 'Current Plan', note: 'Your entered scope and assumptions.', assumptions: base, estimates: baseEstimates, feasibility: baseFeasibility },
      lean,
      accelerated
    ];
  }
};

// ==========================================
// 5. CUSTOMER & COMPETITOR ANALYSIS ENGINES
// ==========================================

const marketIntelligenceEngine = {
  getCompetitors: (project) => aiService.getFallbackMarketResearch(project),

  getCustomerInsights: (project) => {
    const profile = aiService.getDomainProfile(project?.type, project?.description, project?.name);
    const users = aiService.getCustomerUserSegments(project);
    return {
      source: 'AI Customer Synthesis',
      segments: [
        { title: 'Primary users', description: users.primary },
        { title: 'Secondary users', description: users.secondary }
      ],
      needs: profile.customerPreferences,
      painPoints: profile.customerPreferences.map(p => `Users may leave if the product does not provide ${p}.`),
      buyingFactors: profile.customerPreferences.slice(0, 5),
      preferences: profile.customerPreferences,
      dislikes: ['Slow or unreliable core workflows.', 'Unclear pricing, status or next steps.', 'Repeated data entry that does not help complete the task.', 'Generic recommendations that ignore the user context.'],
      adoptionRisks: [
        { risk: 'Trust in the proposed solution', impact: `Users in ${profile.label.toLowerCase()} may compare the product with established alternatives.`, solution: 'Show clear reasons, transparent calculations and domain-specific benefits.' },
        { risk: 'Workflow fit', impact: 'Users may abandon the product if the core workflow does not match how they already complete the task.', solution: 'Validate the project-specific journey and prioritize the domain features identified by the AI analysis.' },
        { risk: 'Data or service reliability', impact: 'Failures can be especially damaging when the application manages important transactions, bookings, records or decisions.', solution: 'Add monitoring, recovery and appropriate audit/security controls for the domain.' }
      ]
    };
  }

};

// ==========================================
// 6. AI & AUTH SERVICES ARCHITECTURE
// ==========================================

const authService = {
  getUser: () => {
    const local = localStorage.getItem('estimateai_user');
    return local ? JSON.parse(local) : {
      name: '',
      email: '',
      isLoggedIn: false,
      provider: ''
    };
  },

  setUser: (u) => {
    localStorage.setItem('estimateai_user', JSON.stringify(u));
  }
};

const aiService = {
  getApiKey: () => {
    return import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('VITE_GEMINI_API_KEY') || 'server-side';
  },

  setApiKey: (key) => {
    localStorage.setItem('VITE_GEMINI_API_KEY', key);
  },

  parseJsonArray: (text) => {
    if (!text) return [];
    try {
      const cleanJsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonText = cleanJsonStr.includes('[')
        ? cleanJsonStr.substring(cleanJsonStr.indexOf('['), cleanJsonStr.lastIndexOf(']') + 1)
        : cleanJsonStr;
      const parsed = JSON.parse(jsonText);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  },

  uniqueItems: (items, existing, key = 'name') => {
    const existingNames = new Set((existing || []).map(item => normalizeText(item[key] || item.text || '')));
    const seen = new Set();
    return (items || []).filter(item => {
      const value = normalizeText(item[key] || item.text || '');
      if (!value || existingNames.has(value) || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  },

  getSuggestionTarget: (projectType = '', description = '') => {
    const type = projectType.toLowerCase();
    let target = 8;
    if (description.length > 140) target += 2;
    if (description.length > 260) target += 1;
    if (type.includes('ai') || type.includes('ml') || type.includes('e-commerce')) target += 1;
    return Math.min(12, target);
  },

  filterGenericSuggestions: (items, projectType = '', description = '', key = 'name') => {
    const profile = aiService.getDomainProfile(projectType, description, '');
    if (profile.key === 'generic') return items || [];
    const generic = /^(user\s+account|login|sign[- ]?in|authentication|dashboard|admin management|settings|notifications?|search,? filter|search and filter|reports?\s*&?\s*export|audit|backup|core workflow)/i;
    return (items || []).filter(item => !generic.test(String(item[key] || item.text || '').trim()));
  },

  getDomainProfile: (projectType = '', description = '', projectName = '') => {
    const text = `${projectType} ${description} ${projectName}`.toLowerCase();
    const has = (...words) => words.some(w => text.includes(w));
    if (has('e-commerce', 'ecommerce', 'online store', 'online shopping', 'marketplace', 'shopping cart')) return { key: 'commerce', label: 'E-commerce / Marketplace', competitors: ['Amazon', 'Shopify', 'WooCommerce', 'Flipkart'], customerPreferences: ['fast product discovery and accurate filters', 'transparent total price and delivery date', 'trusted reviews and seller information', 'simple checkout and multiple payment options', 'easy returns, refunds and order tracking'], features: [['Product Catalog & Smart Discovery', 'Browse products with categories, search, filters and recommendations.', 'High', 'High'], ['Cart & Checkout', 'Validate stock, price, address and payment before placing an order.', 'High', 'High'], ['Inventory & Stock Rules', 'Track stock, reservations, low-stock alerts and availability changes.', 'High', 'High'], ['Order Tracking & Returns', 'Show order status and guide users through cancellation, return and refund workflows.', 'High', 'High'], ['Seller / Admin Operations', 'Manage catalog, orders, pricing, inventory and marketplace policies.', 'High', 'Medium']], requirements: ['Product discovery should help customers find relevant items without excessive filtering effort.', 'Checkout should show the final price, delivery expectation and payment status clearly.', 'Inventory and order state must remain consistent when multiple customers act at once.', 'Returns, refunds and cancellations should have explicit status and audit history.'], tech: [['Frontend', 'React / Vite', 'Next.js', 'Commerce discovery benefits from fast pages, routing and SEO-friendly product content.'], ['Backend', 'Node.js', 'NestJS', 'Catalog, order and payment workflows benefit from modular APIs.'], ['Database', 'Application database', 'PostgreSQL', 'Products, orders, inventory and customers require transactional relational data.'], ['Search', 'Basic filtering', 'OpenSearch / Elasticsearch', 'Large catalogs need fast text, category and attribute search.'], ['Payments', 'Manual integration', 'Razorpay / Stripe', 'Checkout needs reliable payment authorization, webhooks and refunds.']] };
    if (has('mobile app', 'mobile application', 'android app', 'ios app', 'smartphone app')) return { key: 'mobile', label: 'Mobile Application', competitors: ['The relevant category leader', 'A specialist mobile alternative', 'Existing web/mobile workflow'], customerPreferences: ['fast startup and responsive touch interactions', 'clear offline/online state', 'useful push notifications without spam', 'privacy and device permission control', 'simple navigation focused on the main task'], features: [['Mobile-First Core Workflow', `Optimize the main ${projectType || 'mobile'} workflow for touch-first use and short sessions.`, 'High', 'High'], ['Offline & Sync Strategy', 'Cache essential state and reconcile changes safely after connectivity returns.', 'High', 'High'], ['Push Notification Center', 'Deliver actionable notifications with per-event preferences and deep links.', 'Medium', 'Medium'], ['Deep Links & App Routing', 'Open the correct screen from notifications, shared links and external actions.', 'Medium', 'Medium'], ['Crash & Performance Monitoring', 'Measure crashes, slow screens and device-specific failures.', 'High', 'Medium']], requirements: ['The primary mobile task should remain usable on common phone screen sizes.', 'Offline behavior should be explicit so users know whether changes are saved or pending.', 'Notifications should be relevant and controllable rather than frequent generic alerts.', 'Device permissions should be requested only when the related feature needs them.'], tech: [['Mobile', 'Web-only frontend', 'React Native', 'Native device access and reusable React concepts fit a mobile-first product.'], ['Backend', 'Node.js', 'NestJS', 'Mobile APIs benefit from modular authentication, sync and notification services.'], ['Database', 'Application database', 'PostgreSQL', 'Structured user and application data needs reliable persistence.'], ['Offline', 'No sync layer', 'SQLite / WatermelonDB', 'Local persistence supports useful offline experiences and safe synchronization.'], ['Monitoring', 'Basic logs', 'Sentry + performance monitoring', 'Mobile releases need visibility into crashes and slow devices.']] };
    if (has('food delivery', 'food-delivery', 'restaurant delivery', 'restaurant ordering', 'meal delivery')) return { key: 'food', label: 'Food Delivery / Restaurant', competitors: ['Swiggy', 'Zomato', 'Uber Eats'], customerPreferences: ['accurate delivery ETA and live order tracking', 'easy restaurant and cuisine discovery', 'clear delivery fees and offers', 'ratings, reviews and reliable support', 'fast digital payment and order history'], features: [['Live Order Tracking', 'Show restaurant preparation, rider location and changing delivery ETA.', 'High', 'High'], ['Restaurant Discovery & Filters', 'Filter by cuisine, distance, rating, delivery time and price.', 'Medium', 'High'], ['Delivery Partner Assignment', 'Assign orders to available delivery partners and track their status.', 'High', 'High'], ['Offers & Coupon Engine', 'Apply restaurant, platform and time-based promotions safely.', 'Medium', 'Medium'], ['Ratings & Issue Resolution', 'Capture food and delivery ratings and route complaints to support.', 'Medium', 'Medium']], requirements: ['Real-time order status should update from restaurant acceptance through delivery.', 'Delivery ETA should adapt to preparation time, rider assignment and route conditions.', 'Customers should be able to rate both food quality and delivery experience.', 'Payment, refund and cancellation states must remain consistent across the order lifecycle.'], tech: [['Frontend', 'React / Vite', 'Next.js', 'Fast mobile-first pages, routing and restaurant discovery benefit from strong performance and reusable UI.'], ['Backend', 'Node.js', 'NestJS', 'Order, restaurant and delivery workflows benefit from modular APIs and event-driven integrations.'], ['Database', 'Application database', 'PostgreSQL', 'Orders, menus, users and delivery states require transactional relational data.'], ['Real-time', 'Polling', 'WebSockets', 'Live order tracking and rider status need low-latency updates.'], ['Maps', 'Manual location', 'Google Maps / Mapbox', 'Routing, distance and ETA features depend on geospatial services.']] };
    if (has('travel', 'tourism', 'trip planner', 'travel planning', 'hotel booking', 'flight booking', 'tour booking')) return { key: 'travel', label: 'Travel / Booking', competitors: ['Booking.com', 'Airbnb', 'MakeMyTrip', 'Tripadvisor'], customerPreferences: ['fast search with dates, destination and budget filters', 'transparent total price before booking', 'trusted reviews and verified listings', 'flexible cancellation and refund information', 'itinerary and booking management in one place'], features: [['Destination & Availability Search', 'Search stays, activities or transport using dates, destination, budget and availability.', 'High', 'High'], ['Map & Location Discovery', 'Show nearby places, distance, neighborhood context and map-based exploration.', 'High', 'High'], ['Itinerary Builder', 'Combine selected bookings and activities into a practical trip plan.', 'High', 'High'], ['Price & Availability Alerts', 'Notify users when availability or price changes for saved options.', 'Medium', 'Medium'], ['Reviews & Trust Signals', 'Surface ratings, verified reviews and important property/service policies.', 'Medium', 'Medium']], requirements: ['Search results should reflect real availability and date constraints before checkout.', 'The booking flow should show taxes, fees, cancellation rules and final price clearly.', 'Users should be able to manage a complete itinerary rather than isolated bookings.', 'Location and review information should help users compare options before committing.'], tech: [['Frontend', 'React / Vite', 'Next.js', 'Travel discovery benefits from fast public pages, SEO-friendly routes and rich filtering.'], ['Backend', 'Node.js', 'NestJS', 'Booking and supplier integrations need modular APIs and reliable workflow handling.'], ['Database', 'Application database', 'PostgreSQL', 'Reservations, availability, users and itineraries require strong relational consistency.'], ['Caching', 'Basic memory cache', 'Redis', 'Availability and search results benefit from fast caching and short-lived sessions.'], ['Maps', 'Manual location', 'Google Maps / Mapbox', 'Maps, distance and place discovery are central to travel planning.']] };
    if (has('fintech', 'micro-lending', 'lending', 'loan', 'banking', 'payment', 'wallet', 'investment')) return { key: 'fintech', label: 'FinTech / Lending / Payments', competitors: ['Razorpay', 'Stripe', 'Lendingkart', 'KreditBee'], customerPreferences: ['strong security and privacy', 'transparent fees, rates and repayment terms', 'fast verification and decision feedback', 'clear transaction and repayment history', 'responsive support when money or identity is involved'], features: [['KYC / Identity Verification', 'Verify identity and required financial documents before regulated actions.', 'High', 'High'], ['Risk / Eligibility Assessment', 'Evaluate applicant or transaction signals using explicit scoring rules.', 'Critical', 'High'], ['Repayment / Transaction Ledger', 'Maintain an auditable history of disbursements, repayments, fees and balances.', 'Critical', 'High'], ['Fraud & Anomaly Monitoring', 'Flag unusual transactions, identity mismatches and suspicious behavior.', 'High', 'High'], ['Consent & Audit Trail', 'Record user consent and sensitive administrative actions for review.', 'High', 'High']], requirements: ['Sensitive financial and identity data must be encrypted and access-controlled.', 'Every financial state change should be traceable through an auditable ledger.', 'Risk decisions should expose understandable reasons without leaking sensitive model details.', 'Users should see fees, rates, repayment dates and transaction status before confirmation.'], tech: [['Frontend', 'React / Vite', 'Next.js + TypeScript', 'Typed financial workflows and secure server rendering improve consistency across sensitive forms and dashboards.'], ['Backend', 'Node.js', 'FastAPI', 'Financial scoring and document workflows benefit from Python data tooling and explicit APIs.'], ['Database', 'PostgreSQL', 'PostgreSQL + Row-Level Security', 'Transactional financial records require strong consistency and strict access boundaries.'], ['Risk / Data', 'Rule logic', 'Python scoring pipeline', 'Credit or fraud scoring can use auditable data-processing and model evaluation workflows.'], ['Security', 'Basic logging', 'Immutable audit logging', 'Sensitive financial actions need traceable administrative and user activity.']] };
    if (has('healthcare', 'hospital', 'clinic', 'medical', 'telemedicine', 'pharmacy', 'health')) return { key: 'healthcare', label: 'Healthcare / Medical', competitors: ['Practo', 'Tata 1mg', 'Apollo 24/7'], customerPreferences: ['easy appointment or service discovery', 'trusted medical information and verified professionals', 'privacy for health records', 'clear prescriptions, reports and reminders', 'fast access to support and emergency guidance'], features: [['Doctor / Service Discovery', 'Find relevant clinicians, services or facilities using specialty, location and availability.', 'High', 'High'], ['Appointment Scheduling', 'Book, reschedule and cancel appointments while respecting provider availability.', 'High', 'High'], ['Patient Records & Reports', 'Store and present health records, prescriptions and reports with controlled access.', 'Critical', 'High'], ['Medication & Reminder Workflow', 'Track prescriptions, dosage reminders and refill-related actions.', 'Medium', 'Medium'], ['Consent & Privacy Controls', 'Make health-data access and sharing explicit and auditable.', 'High', 'High']], requirements: ['Health records must be protected with strict role-based access and audit history.', 'Appointment availability must remain consistent when multiple users book the same slot.', 'Patients should understand what information is stored and who can access it.', 'Clinical content should distinguish informational guidance from professional medical decisions.'], tech: [['Frontend', 'React / Vite', 'Next.js + TypeScript', 'Accessible, responsive healthcare workflows benefit from typed forms and predictable rendering.'], ['Backend', 'Node.js', 'NestJS', 'Appointments, records and notifications benefit from modular service boundaries.'], ['Database', 'PostgreSQL', 'PostgreSQL + Row-Level Security', 'Patient and appointment records require relational consistency and access control.'], ['Notifications', 'Email only', 'Email + SMS/Push', 'Appointments, medication reminders and results benefit from reliable notifications.'], ['Security', 'Basic auth', 'RBAC + audit logging', 'Sensitive health data needs explicit permissions and traceability.']] };
    if (has('education', 'learning', 'lms', 'course platform', 'online course', 'school', 'college')) return { key: 'education', label: 'Education / Learning', competitors: ['Coursera', 'Udemy', 'Google Classroom', 'Moodle'], customerPreferences: ['clear course structure and progress', 'short practical lessons and assessments', 'search and filtering by skill or level', 'certificates or evidence of completion', 'fast feedback from instructors or the system'], features: [['Course & Curriculum Management', 'Organize modules, lessons, prerequisites and learning paths.', 'High', 'High'], ['Progress & Completion Tracking', 'Track lesson completion, streaks and course progress for learners.', 'Medium', 'High'], ['Assessment & Quiz Engine', 'Deliver quizzes, assignments and scored assessments with feedback.', 'High', 'High'], ['Learning Recommendations', 'Suggest the next lesson or course based on progress and goals.', 'High', 'Medium'], ['Certificate / Completion Records', 'Generate verifiable completion records for finished learning paths.', 'Medium', 'Medium']], requirements: ['Learners should always know what to study next and how much remains.', 'Assessments should save attempts, scores and feedback without losing progress.', 'Course access should respect enrollment, instructor and content permissions.', 'Recommendations should use learner progress and stated goals rather than generic content alone.'], tech: [['Frontend', 'React / Vite', 'Next.js', 'Content-heavy learning pages benefit from routing, performance and SEO.'], ['Backend', 'Node.js', 'NestJS', 'Course, enrollment and assessment workflows need modular APIs.'], ['Database', 'Application database', 'PostgreSQL', 'Courses, enrollments, attempts and progress require relational consistency.'], ['Search', 'Basic filtering', 'Elasticsearch / OpenSearch', 'Large course catalogs benefit from fast skill, topic and level search.'], ['Media', 'Direct files', 'Cloud storage + CDN', 'Lessons and learning assets need reliable delivery at scale.']] };
    if (has('real estate', 'property', 'housing', 'rental', 'rent')) return { key: 'realestate', label: 'Real Estate / Property', competitors: ['99acres', 'Housing.com', 'MagicBricks', 'Zillow'], customerPreferences: ['accurate filters for location, price and property type', 'map-based discovery', 'verified listings and photos', 'clear contact/visit scheduling', 'transparent fees and property details'], features: [['Property Search & Smart Filters', 'Filter by location, price, property type, size and important amenities.', 'High', 'High'], ['Map-Based Discovery', 'Explore properties geographically and compare nearby options.', 'High', 'High'], ['Listing Verification Workflow', 'Flag incomplete, duplicate or suspicious listings for review.', 'High', 'High'], ['Visit / Contact Scheduling', 'Let users request property visits or contact agents with availability tracking.', 'Medium', 'Medium'], ['Saved Search Alerts', 'Notify users when matching properties are added or changed.', 'Medium', 'Medium']], requirements: ['Search results should make location, price and key property facts easy to compare.', 'Listings should distinguish verified information from user-provided claims.', 'Users should be able to save criteria and receive relevant new-listing alerts.', 'Contact and visit requests should preserve a clear history.'], tech: [['Frontend', 'React / Vite', 'Next.js', 'Property discovery benefits from fast public pages, routing and SEO.'], ['Backend', 'Node.js', 'NestJS', 'Listings, agents, visits and alerts benefit from modular APIs.'], ['Database', 'Application database', 'PostgreSQL + PostGIS', 'Property search needs relational data plus geospatial queries.'], ['Search', 'Basic filtering', 'OpenSearch', 'Large property inventories need fast text and filter search.'], ['Media', 'Direct files', 'Object storage + CDN', 'Property photos and videos need reliable media delivery.']] };
    if (has('logistics', 'delivery management', 'fleet', 'shipping', 'shipment', 'courier')) return { key: 'logistics', label: 'Logistics / Delivery', competitors: ['Delhivery', 'Shiprocket', 'FedEx'], customerPreferences: ['accurate tracking and ETA', 'clear delivery status changes', 'proof of delivery', 'easy exception handling', 'transparent shipping cost'], features: [['Shipment Tracking', 'Track shipment status and location across the delivery lifecycle.', 'High', 'High'], ['Route & Dispatch Management', 'Assign jobs and optimize delivery sequences based on operational constraints.', 'High', 'High'], ['ETA & Exception Alerts', 'Notify users about delays, failed deliveries and changing ETAs.', 'High', 'High'], ['Proof of Delivery', 'Capture recipient confirmation, signature or delivery evidence.', 'Medium', 'Medium'], ['Fleet / Driver Console', 'Give drivers a focused workflow for assigned jobs and status updates.', 'High', 'Medium']], requirements: ['Shipment status should be consistent across customer, dispatcher and driver views.', 'ETA should adapt to route and operational exceptions.', 'Proof of delivery should remain associated with the correct shipment.', 'Dispatchers should be able to identify delays and reassign work when necessary.'], tech: [['Frontend', 'React / Vite', 'React + TypeScript', 'Operational dashboards need predictable, typed real-time workflows.'], ['Backend', 'Node.js', 'NestJS', 'Dispatch, tracking and integrations benefit from modular services.'], ['Database', 'PostgreSQL', 'PostgreSQL + PostGIS', 'Shipments, routes and locations require relational and geospatial data.'], ['Real-time', 'Polling', 'WebSockets', 'Tracking dashboards need low-latency status updates.'], ['Maps', 'Manual routing', 'Google Maps / Mapbox', 'Routes, ETA and dispatch depend on mapping services.']] };
    if (has('iot', 'smart home', 'home security', 'connected device', 'sensor', 'device monitoring')) return { key: 'iot', label: 'IoT / Smart Device', competitors: ['Google Nest', 'Ring', 'SimpliSafe'], customerPreferences: ['reliable live device status', 'instant security alerts', 'simple automation rules', 'privacy and local control', 'easy device setup and recovery'], features: [['Device Provisioning', 'Pair devices securely and show setup health and connectivity state.', 'High', 'High'], ['Live Device Telemetry', 'Display current sensor/device readings and last-seen status.', 'High', 'High'], ['Automation & Rules', 'Create conditions and actions for connected devices.', 'High', 'High'], ['Alert & Incident Workflow', 'Send actionable alerts for security or device anomalies.', 'High', 'High'], ['Device Health & Diagnostics', 'Surface battery, connectivity and firmware issues before failure.', 'Medium', 'Medium']], requirements: ['Device commands should confirm execution state rather than assuming success.', 'Connectivity loss should be visible and recoverable without corrupting device state.', 'Security alerts should be timely, actionable and privacy-conscious.', 'Users should be able to manage automation without unsafe rule conflicts.'], tech: [['Frontend', 'React / Vite', 'React Native / React', 'Device dashboards need responsive, real-time controls.'], ['Backend', 'Node.js', 'NestJS + MQTT', 'IoT workflows need reliable device messaging and modular APIs.'], ['Database', 'PostgreSQL', 'PostgreSQL + TimescaleDB', 'Device state and telemetry benefit from relational and time-series storage.'], ['Real-time', 'Polling', 'WebSockets', 'Live telemetry and device state require immediate UI updates.'], ['Messaging', 'HTTP only', 'MQTT', 'Lightweight device messaging is suited to connected sensors and home devices.']] };
    if (has('social', 'community', 'forum', 'social network', 'creator platform')) return { key: 'social', label: 'Social / Community', competitors: ['Instagram', 'Reddit', 'Discord'], customerPreferences: ['relevant feeds and discovery', 'fast media sharing', 'strong moderation and safety', 'notifications users can control', 'privacy and community controls'], features: [['Personalized Feed', 'Rank relevant posts or discussions based on user interests and activity.', 'High', 'High'], ['Content Creation & Media', 'Create posts with supported media, drafts and editing controls.', 'High', 'High'], ['Moderation & Reporting', 'Report harmful content and provide moderation queues and actions.', 'Critical', 'High'], ['Reactions & Discussion', 'Support comments, reactions and conversation threading.', 'Medium', 'High'], ['Community / Privacy Controls', 'Let users control visibility, membership and interaction permissions.', 'High', 'High']], requirements: ['Content visibility must respect privacy and community rules.', 'Moderation actions should be auditable and reversible where appropriate.', 'Feeds should avoid overwhelming users with irrelevant or repeated content.', 'Users should have clear controls for notifications, blocking and reporting.'], tech: [['Frontend', 'React / Vite', 'Next.js + React', 'Content-heavy social pages need fast rendering and reusable interactive components.'], ['Backend', 'Node.js', 'NestJS', 'Feeds, moderation and notifications benefit from modular services.'], ['Database', 'PostgreSQL', 'PostgreSQL + Redis', 'Relational user data plus fast feed/session access suit this workload.'], ['Media', 'Direct files', 'Object storage + CDN', 'User media needs scalable storage and delivery.'], ['Moderation', 'Manual review', 'AI-assisted moderation + queues', 'Large communities benefit from triage while retaining human review.']] };
    if (has('ai', 'machine learning', 'ml', 'generative ai', 'llm', 'chatbot')) return { key: 'ai', label: 'AI / Machine Learning', competitors: ['ChatGPT', 'Gemini', 'Claude'], customerPreferences: ['useful and accurate outputs', 'explanations and evidence where possible', 'fast responses', 'privacy controls', 'ability to correct or retry weak results'], features: [['AI Inference / Recommendation Engine', 'Generate outputs that directly support the project’s core user workflow.', 'Critical', 'High'], ['Evaluation & Quality Monitoring', 'Measure quality, latency and failure rates against representative test cases.', 'High', 'High'], ['Human Feedback Loop', 'Capture corrections and low-quality outputs to improve prompts or models.', 'Medium', 'Medium'], ['Prompt / Model Versioning', 'Track model and prompt versions so results remain reproducible.', 'High', 'Medium'], ['AI Privacy Controls', 'Control which user data is sent to external AI services and retain audit information.', 'High', 'High']], requirements: ['AI outputs should be evaluated against representative project-specific cases before release.', 'Users should understand important limitations and uncertainty in AI-generated results.', 'Sensitive inputs must be protected before being sent to external AI services.', 'Model or prompt changes should be traceable so regressions can be investigated.'], tech: [['AI / ML', 'Application logic', 'Python + FastAPI', 'Python provides a strong ML ecosystem and FastAPI keeps inference services modular.'], ['Frontend', 'React / Vite', 'React + TypeScript', 'Typed interactive AI states reduce UI/data contract errors.'], ['Data', 'Application database', 'PostgreSQL', 'Structured users, prompts, evaluations and results need reliable storage.'], ['Cache', 'Memory', 'Redis', 'Conversation state and repeated inference context benefit from fast caching.'], ['Observability', 'Basic logs', 'OpenTelemetry', 'AI latency, errors and usage need measurable operational telemetry.']] };
    if (has('project management', 'task management', 'project planning', 'cost planning', 'estimate', 'feasibility')) return { key: 'planning', label: 'Project Planning / Management', competitors: ['Jira', 'Asana', 'Monday.com', 'ClickUp'], customerPreferences: ['clear workload and progress visibility', 'simple estimates with assumptions', 'actionable risks and dependencies', 'easy reporting for stakeholders', 'fast what-if comparison'], features: [['Scope & Requirement Traceability', 'Connect requirements to features so missing scope is visible.', 'High', 'High'], ['Dependency & Risk Mapping', 'Show blockers, dependency chains and risk impact before execution.', 'High', 'High'], ['Estimate Scenario Builder', 'Compare scope, team and timeline assumptions before committing.', 'High', 'High'], ['Roadmap & Milestones', 'Turn selected features into phases and measurable delivery milestones.', 'Medium', 'High'], ['Stakeholder Reporting', 'Generate concise reports from the same underlying project analysis.', 'Medium', 'Medium']], requirements: ['Every important requirement should be traceable to planned delivery scope.', 'Users should understand how changes to team, scope or assumptions affect cost and time.', 'Risks and dependencies should be actionable rather than just listed.', 'Stakeholders should be able to download a complete decision-ready report.'], tech: [['Frontend', 'React / Vite', 'React + TypeScript', 'Interactive planning dashboards benefit from strong typing and reusable UI states.'], ['Backend', 'Node.js', 'NestJS', 'Project calculations and integrations benefit from modular APIs.'], ['Database', 'Application database', 'PostgreSQL', 'Projects, estimates, requirements and analysis results need structured storage.'], ['Analytics', 'Custom charts', 'Chart.js / ECharts', 'Scenario and cost analysis benefit from interactive visualizations.'], ['AI', 'Optional', 'Gemini API', 'Requirement suggestions and project-specific recommendations benefit from a capable generative model.']] };
    return { key: 'generic', label: projectType || 'Software Project', competitors: ['Established category leader', 'Modern specialist platform', 'Manual / internal alternative'], customerPreferences: ['fast completion of the core task', 'clear pricing and outcomes', 'reliable performance and support', 'simple onboarding', 'privacy and control over personal data'], features: [['Project-Specific Core Workflow', `Implement the primary outcome described by the project: ${description.slice(0, 180)}.`, 'High', 'High'], ['Advanced Search & Discovery', 'Help users find the most relevant records, services or content for this project.', 'Medium', 'Medium'], ['Notifications & Status', 'Keep users informed about important state changes and actions.', 'Medium', 'Medium'], ['Reporting & Insights', 'Turn project activity into useful summaries and decisions.', 'Medium', 'Medium'], ['Audit & Recovery', 'Preserve important activity history and provide recovery paths for failed operations.', 'High', 'Medium']], requirements: [`The main workflow should directly support the project purpose described as: ${description.slice(0, 180)}.`, 'Important user actions should provide clear validation, status and recovery feedback.', 'The product should make the most important project outcome measurable.', 'Sensitive or important project data should remain protected and recoverable.'], tech: [['Frontend', 'React / Vite', 'React + TypeScript', 'Typed interactive workflows are a practical foundation for this project.'], ['Backend', 'Node.js', 'NestJS', 'Modular APIs keep business rules and integrations maintainable.'], ['Database', 'Application database', 'PostgreSQL', 'Structured project data benefits from reliable relational storage.'], ['Search', 'Basic filtering', 'PostgreSQL full-text / OpenSearch', 'Discovery needs can scale beyond simple lists as project data grows.'], ['Observability', 'Basic logs', 'OpenTelemetry', 'Measuring errors and latency helps keep the core workflow reliable.']] };
  },

  getCustomerUserSegments: (project) => {
    const aiUsers = project?.aiAnalysis?.userSegments;
    if (aiUsers && typeof aiUsers === 'object') {
      const primary = String(aiUsers.primary || '').trim();
      const secondary = String(aiUsers.secondary || '').trim();
      if (primary && secondary) {
        return {
          primary,
          secondary,
          primarySource: aiUsers.primarySource || 'Gemini AI',
          secondarySource: aiUsers.secondarySource || 'Gemini AI',
          source: aiUsers.source || 'AI-inferred from the complete project context.',
          isSuggested: true
        };
      }
    }
    const profile = aiService.getDomainProfile(project?.type, project?.description, project?.name);
    const suppliedPrimary = String(project?.targetUsers || '').trim();
    const defaults = {
      commerce: { primary: 'Online shoppers and buyers', secondary: 'Sellers, merchants and store/marketplace operators' },
      mobile: { primary: suppliedPrimary || 'People using the mobile app to complete its main task', secondary: 'Support, operations and product administrators' },
      food: { primary: 'Food ordering customers / diners', secondary: 'Restaurant staff and delivery partners' },
      travel: { primary: 'Travelers / people making bookings or planning trips', secondary: 'Property, tour, booking or travel-service operators' },
      fintech: { primary: 'Borrowers, account holders or payment customers', secondary: 'Loan officers, risk/compliance teams and operations staff' },
      healthcare: { primary: 'Patients and people seeking healthcare services', secondary: 'Doctors, clinics and healthcare operations staff' },
      education: { primary: 'Students / learners', secondary: 'Instructors, course administrators and academic operations staff' },
      realestate: { primary: 'Property buyers, renters and property seekers', secondary: 'Agents, brokers and property/listing managers' },
      logistics: { primary: 'Shippers, receivers or customers tracking deliveries', secondary: 'Dispatchers, fleet managers and drivers' },
      iot: { primary: 'Device owners / people monitoring the connected devices', secondary: 'Household or business administrators and support/monitoring staff' },
      social: { primary: 'Community members / content consumers and creators', secondary: 'Moderators and community managers' },
      ai: { primary: suppliedPrimary || 'People using the AI capability to complete the project’s main task', secondary: 'AI evaluators, administrators or model/prompt operators' },
      planning: { primary: 'Project managers and delivery teams', secondary: 'Stakeholders, sponsors and project administrators' },
      generic: { primary: suppliedPrimary || 'People who directly complete the main workflow described in this project', secondary: 'People who operate, support, review or administer that workflow' }
    };
    const chosen = defaults[profile.key] || defaults.generic;
    return {
      primary: suppliedPrimary || chosen.primary,
      secondary: chosen.secondary,
      primarySource: suppliedPrimary ? 'From project input' : 'AI suggestion',
      secondarySource: 'AI suggestion',
      source: suppliedPrimary ? 'Primary user type comes from the target users entered for this project; secondary users are inferred from the project context.' : 'Both primary and secondary users are AI-inferred suggestions based on project type, name and description.',
      isSuggested: !suppliedPrimary
    };
  },

  getFallbackTechStack: (project) => {
    const profile = aiService.getDomainProfile(project?.type, project?.description, project?.name);
    return profile.tech.map(([category, current, recommended, reason], idx) => ({ category, current, recommended, reason, costDiff: 0, accepted: true, id: `fallback-tech-${idx}` }));
  },

  getFallbackMarketResearch: (project) => {
    const profile = aiService.getDomainProfile(project?.type, project?.description, project?.name);
    const proposed = project?.name || 'This product';
    return {
      source: 'EstimateAI Context Engine',
      live: false,
      competitors: profile.competitors.map((name, i) => ({ name, category: profile.label, whyRelevant: `${name} is a recognizable solution in the ${profile.label.toLowerCase()} category. Compare its core workflow, customer experience and positioning with ${proposed}.`, strengths: 'Established category presence and a defined user workflow.', weaknesses: 'May not match the exact scope, audience or workflow described in this project.', pricingNote: 'Verify current pricing before making a commercial decision.' })),
      marketGaps: profile.customerPreferences.slice(0, 4).map(p => `Customers in this category commonly value ${p}; use this as a comparison point when evaluating the proposed product.`),
      differentiation: `${proposed} should differentiate by serving the specific workflow in the project description rather than copying the category leader. The analysis should compare scope, user experience, trust, speed and the project-specific capabilities described by the user.`,
      customerSegments: (() => {
        const users = aiService.getCustomerUserSegments(project);
        return [
          { name: 'Primary users', need: users.primary },
          { name: 'Secondary users', need: users.secondary }
        ];
      })(),
      researchCaveat: 'This is a category-specific fallback synthesis. When Gemini AI is configured, the app asks it to analyze the supplied project and return project-specific market comparisons.'
    };
  },

  generateRequirements: async (projectName, projectType, description = '', existing = []) => {
    const target = aiService.getSuggestionTarget(projectType, description);
    const apiKey = aiService.getApiKey();
    const existingText = (existing || []).map(r => r.text).join(' | ');
    if (!apiKey) throw new Error('Gemini API key is missing. Add it in EstimateAI settings to use AI suggestions.');

    if (apiKey) {
      try {
        const promptText = `You are the requirements analyst inside EstimateAI. Generate up to ${target} NEW requirements for THIS EXACT PROJECT. Treat the project type as a hint, not a fixed domain. Infer the real product/domain, user journey, business problem and important workflows from the project name, project type, full description, and existing requirements. The project may be from ANY domain, including a domain you have never seen before. Do NOT force it into travel, e-commerce, mobile, fintech, healthcare or any predefined category. If the description says agriculture, generate agriculture requirements; if it says cybersecurity, generate cybersecurity requirements; if it describes a novel system, infer its needs from the description. Existing requirements that MUST NOT be repeated or paraphrased: "${existingText}". Make this response meaningfully different from earlier suggestions, not a rewording of the same ideas. Every suggestion must be traceably useful to the stated project purpose. Avoid generic filler such as login, dashboard, notifications, settings, reports or CRUD unless the project description specifically makes that capability important. Cover functional and non-functional needs when appropriate. If the project does not need more requirements, return an empty array. Return ONLY a raw JSON array. Each object must have: text, type (Functional or Non-Functional), complexity (Low, Medium, High, or Critical). PROJECT NAME: ${projectName}. PROJECT TYPE: ${projectType}. PROJECT DESCRIPTION: ${description}`;
        const response = await fetch(`/api/gemini`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }], generationConfig: { temperature: 0.85, topP: 0.92 } })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || `Gemini API request failed (${response.status}).`);
        const parsed = aiService.parseJsonArray(data.candidates?.[0]?.content?.parts?.[0]?.text);
        const unique = aiService.uniqueItems(parsed, existing, 'text');
        if (unique.length > 0) {
          return unique.slice(0, target).map((item, idx) => ({
            ...item,
            id: 'r-ai-' + Date.now() + '-' + idx,
            source: 'Gemini AI', ambiguous: false, duplicate: false
          }));
        }
      } catch (e) {
        console.error('Gemini requirements generation failed:', e);
        throw e;
      }
    }
    return [];
  },

  generateFeatures: async (projectName, projectType, description = '', existing = []) => {
    const target = aiService.getSuggestionTarget(projectType, description);
    const apiKey = aiService.getApiKey();
    const existingText = (existing || []).map(f => f.name).join(' | ');
    if (!apiKey) throw new Error('Gemini API key is missing. Add it in EstimateAI settings to use AI suggestions.');

    if (apiKey) {
      try {
        const promptText = `You are the product architect inside EstimateAI. Generate up to ${target} NEW, actionable features for THIS EXACT PROJECT. Treat the project type as a hint, not a fixed template. Infer the actual domain, target users, user journey, business problem, data/workflows and MVP capabilities from the project name, project type, full description and existing requirements/features. The project can be ANY domain, including an unfamiliar or novel domain. Do not assume that a mobile project needs generic mobile features, or that a web project needs generic web features. If the description is for agriculture, suggest agriculture capabilities; if it is for cybersecurity, suggest cybersecurity capabilities; if it is for an unusual technical/scientific system, derive features from the stated workflow. Existing features that MUST NOT be repeated or paraphrased: "${existingText}". Make this response meaningfully different from earlier suggestions, not a rewording of the same ideas. Suggest features that directly support the project's stated outcome. Do not add generic login, dashboard, notifications, settings, search or admin features unless the project description makes them materially necessary. Cover important MVP and domain-specific supporting capabilities. If no meaningful new feature remains, return an empty array. Return ONLY a raw JSON array. Each object must have: name, description, complexity (Low, Medium, High, Critical), priority (High, Medium, or Low), dependencies (None, Auth, or another feature name). PROJECT NAME: ${projectName}. PROJECT TYPE: ${projectType}. PROJECT DESCRIPTION: ${description}`;
        const response = await fetch(`/api/gemini`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }], generationConfig: { temperature: 0.95, topP: 0.95 } })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || `Gemini API request failed (${response.status}).`);
        const parsed = aiService.parseJsonArray(data.candidates?.[0]?.content?.parts?.[0]?.text);
        const unique = aiService.uniqueItems(parsed, existing, 'name');
        if (unique.length > 0) {
          return unique.slice(0, target).map((item, idx) => ({ ...item, id: 'f-ai-' + Date.now() + '-' + idx, source: 'Gemini AI', accepted: true }));
        }
      } catch (e) {
        console.error('Gemini feature generation failed:', e);
        throw e;
      }
    }
    return [];
  },

  generateMarketResearch: async (project) => {
    const apiKey = aiService.getApiKey();
    const fallback = aiService.getFallbackMarketResearch(project);
    if (!apiKey) return { ...fallback, source: 'EstimateAI Context Engine', live: false };
    try {
      const promptText = `Act as a product-specific market research analyst. Do NOT give a generic software/SaaS answer. First infer the exact project category and user problem from the project type, name, description, target users, business model, requirements and selected features. Then analyze 3-5 EXISTING solutions that actually serve that same category or customer job (for example, travel booking solutions for a travel app, food delivery solutions for food delivery, lending/payment solutions for fintech). For each competitor, explain what part of the user's proposed workflow it covers, where it is stronger, and where the proposed project could differ. Also explain what customers in THIS category usually prefer, including the practical features, trust factors, speed, price/fee expectations, convenience and service experience that matter. Do not invent company facts, pricing, users or market-share numbers. If a real competitor cannot be identified confidently, say that live verification is required instead of fabricating one. Return ONLY JSON with: competitors (array of {name, category, whyRelevant, strengths, weaknesses, pricingNote}), marketGaps (array), differentiation (string), customerSegments (array of {name, need}), customerPreferences (array of strings), researchCaveat (string). Project: ${JSON.stringify({name: project.name, type: project.type, description: project.description, targetUsers: project.targetUsers, businessModel: project.businessModel, requirements: project.requirements, features: project.features})}`;
      const response = await fetch(`/api/gemini`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] }) });
      const data = await response.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const start = clean.indexOf('{'); const end = clean.lastIndexOf('}');
      if (start >= 0 && end > start) {
        const parsed = JSON.parse(clean.slice(start, end + 1));
        if (parsed && Array.isArray(parsed.competitors)) {
          const aiCustomerSegments = Array.isArray(parsed.customerSegments) ? parsed.customerSegments.filter(s => s && s.name && s.need) : [];
          return {
            ...fallback,
            ...parsed,
            marketSegments: aiCustomerSegments,
            customerSegments: aiCustomerSegments.length > 0 ? aiCustomerSegments : fallback.customerSegments,
            source: 'Gemini AI Market Synthesis',
            live: false
          };
        }
      }
    } catch (e) { console.warn('Gemini market research fallback:', e); }
    return { ...fallback, source: 'EstimateAI Context Engine', live: false };
  },

  analyzeProject: async (project, estimates, constraints, risks) => {
    const projectName = project.name || 'Project';
    const projectType = project.type || 'Software Project';
    const description = project.description || '';
    const apiKey = aiService.getApiKey();

    if (apiKey) {
      try {
        const promptText = `You are the project-specific AI analysis layer of EstimateAI. Analyze THIS exact project, not a generic software template. Infer the actual domain and user journey from the project type, name, description, target users, business model, requirements and selected features. For almost every selected feature, explain or recommend supporting capabilities that are genuinely relevant to this domain. Do not repeat basic authentication/login/dashboard features unless they are materially important to this project. For technology recommendations, choose 4-6 technologies/components that fit THIS project's domain and workflow; do not return the same React/Node/PostgreSQL trio for unrelated projects. For each technology, explain the project-specific reason. Also identify domain-specific security, data, integration, performance or operational concerns. Do not replace or invent the supplied numeric calculations. Project: ${JSON.stringify({ name: projectName, type: projectType, description, targetUsers: project.targetUsers, expectedUsers: project.expectedUsers, businessModel: project.businessModel, requirements: project.requirements, features: project.features, assumptions: project.assumptions })}. Calculated estimates: ${JSON.stringify(estimates)}. Existing rule-based constraints: ${JSON.stringify(constraints)}. Existing rule-based risks: ${JSON.stringify(risks)}. Return ONLY JSON with: summary (string), recommendation {label, explanation}, userSegments {primary, secondary, primarySource, secondarySource, explanation}, constraints (array of objects with constraint,currentValue,expectedValue,severity,impact,solution), risks (array of objects with risk,severity,probability,impact,mitigation), techStack (array of 4-6 objects with category,current,recommended,reason,costDiff,accepted). The primary user must be the person/group that directly uses the product to accomplish the main outcome. The secondary user must be a distinct supporting/operator/admin/stakeholder group when one exists. Do not simply label them "customers" and "admins"; describe who they actually are for THIS project. Clearly mark these as AI suggestions unless they come directly from the supplied targetUsers. Recommendations must clearly explain why each technology fits THIS project and must not be generic defaults.`;
        const response = await fetch(`/api/gemini`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const jsonStart = clean.indexOf('{');
          const jsonEnd = clean.lastIndexOf('}');
          if (jsonStart >= 0 && jsonEnd > jsonStart) {
            const parsed = JSON.parse(clean.substring(jsonStart, jsonEnd + 1));
            if (parsed && typeof parsed === 'object') {
              const suppliedPrimary = String(project.targetUsers || '').trim();
              const rawUsers = parsed.userSegments && typeof parsed.userSegments === 'object' ? parsed.userSegments : {};
              const userSegments = {
                primary: suppliedPrimary || String(rawUsers.primary || '').trim() || 'The people who directly use this product to accomplish its main stated outcome',
                secondary: String(rawUsers.secondary || '').trim() || 'Supporting operators, administrators, reviewers or stakeholders identified from this project workflow',
                primarySource: suppliedPrimary ? 'From project input' : 'Gemini AI',
                secondarySource: 'Gemini AI',
                source: suppliedPrimary ? 'Primary user is based on the target users supplied by the user; secondary user is an AI suggestion from the complete project context.' : 'Both user groups are AI suggestions inferred from project type, name, description, requirements and features.',
                explanation: String(rawUsers.explanation || '').trim()
              };
              return {
                ...parsed,
                userSegments,
                source: 'Gemini AI',
                constraints: Array.isArray(parsed.constraints) ? parsed.constraints : constraints,
                risks: Array.isArray(parsed.risks) ? parsed.risks : risks,
                techStack: Array.isArray(parsed.techStack) && parsed.techStack.length > 0 ? parsed.techStack : []
              };
            }
          }
        }
      } catch (e) {
        console.warn('Gemini project analysis fallback:', e);
      }
    }

    const profile = aiService.getDomainProfile(projectType, description, projectName);
    const techStack = profile.tech.map(([category, current, recommended, reason], idx) => ({
      category, current, recommended, reason, costDiff: 0, accepted: true, id: `fallback-tech-${idx}`
    }));

    const summary = `${projectName} is analyzed from its ${project.features?.length || 0} selected feature(s), ${project.requirements?.length || 0} requirement(s), team size of ${project.assumptions?.teamSize || 0}, target timeline of ${project.assumptions?.targetTimeline || 0} month(s), and the supplied budget/revenue assumptions. The numeric cost, effort, timeline and score remain calculation-engine results.`;
    const recommendation = {
      label: constraints.some(c => c.severity === 'Critical') ? 'Needs scope or budget changes' : 'Proceed with the analyzed scope',
      explanation: constraints.length > 0
        ? `The recommendation is driven by ${constraints.length} detected project limit(s) and ${risks.length} identified risk(s). Review those items before committing to development.`
        : `The current assumptions do not trigger a hard project limit. Continue with the calculated scope, while reviewing the ${risks.length} identified risk(s) before development.`
    };

    return { source: 'EstimateAI Context Engine', summary, recommendation, constraints, risks, techStack: aiService.getFallbackTechStack(project) };
  }
};

// ==========================================
// 7. MAIN APPLICATION COMPONENT
// ==========================================


const validateMeaningfulText = async (
  text: string,
  field: string
): Promise<boolean> => {
  const apiKey = aiService.getApiKey();

  if (!apiKey) {
    throw new Error('Gemini API key is missing. Please check your settings.');
  }

  const prompt = `
You are validating text for a project planning application.

Decide whether this input is meaningful in the context of "${field}".

Accept legitimate project names, descriptions, requirements, technical
terms, abbreviations, identifiers, and concise statements from any domain.

Reject random keyboard mashing, meaningless random character sequences,
and repeated nonsense.

Do not reject text just because it has no vowels, is short, or contains
technical terminology.

Return ONLY this JSON:
{"valid": true}
or
{"valid": false}

Input: ${JSON.stringify(text)}
`;

  const response = await fetch(
    `/api/gemini`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: 'application/json'
        }
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || 'Gemini validation failed. Please try again.'
    );
  }

  const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!resultText) {
    throw new Error('Gemini returned no validation result. Please try again.');
  }

  const result = JSON.parse(resultText);

  if (typeof result.valid !== 'boolean') {
    throw new Error('Gemini returned an invalid validation result.');
  }

  return result.valid;
};


export default function App() {
  const [route, setRoute] = useState('landing');
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [autoPrintReport, setAutoPrintReport] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [projects, setProjects] = useState([]);
  // UI-only state for the redesigned shell
  const [analysisPage, setAnalysisPage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [customFeatureModalOpen, setCustomFeatureModalOpen] = useState(false);

  const [user, setUser] = useState(authService.getUser());
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      const loggedInUser = {
        name: firebaseUser.displayName || 'Google User',
        email: firebaseUser.email || '',
        isLoggedIn: true,
        provider: 'Google'
      };

      authService.setUser(loggedInUser);
      setUser(loggedInUser);
    } else {
      const loggedOutUser = {
        name: '',
        email: '',
        isLoggedIn: false,
        provider: ''
      };

      authService.setUser(loggedOutUser);
      setUser(loggedOutUser);
    }
  });
  return unsubscribe;
}, []);
  useEffect(() => {
  if (!user.isLoggedIn) {
    setAuthModalOpen(true);
  }
}, [user.isLoggedIn]);

  // Interactive Simulator State
  const [simulator, setSimulator] = useState({
    devCount: 3,
    devRate: 85000,
    customers: 350,
    price: 499,
    cloud: 10000,
    api: 5000,
    timeline: 4
  });

  // Wizard Data State
  const [wizardStep, setWizardStep] = useState(1);
  const [step1Error, setStep1Error] = useState('');
  const [aiSuggestionMessage, setAiSuggestionMessage] = useState('');
  const [wizardData, setWizardData] = useState({
    id: null,
    name: '',
    description: '',
    type: 'SaaS Platform',
    targetUsers: 'SMB Teams & Operations Managers',
    expectedUsers: 3000,
    businessModel: 'Subscription',
    requirements: [
      { id: 'r1', text: 'Secure OAuth2 user login with multi-factor authentication', type: 'Functional', source: 'User Provided', complexity: 'Low', ambiguous: false, duplicate: false },
      { id: 'r2', text: 'Sub-second real-time dashboard analytics rendering', type: 'Non-Functional', source: 'User Provided', complexity: 'Medium', ambiguous: false, duplicate: false }
    ],
    features: [
      { id: 'f1', name: 'User Management & Auth Portal', description: 'Single sign-on, team member invites, and RBAC roles', priority: 'High', complexity: 'Low', dependencies: 'None', source: 'AI Suggested', accepted: true },
      { id: 'f2', name: 'Core Business Analytics Engine', description: 'Calculates key operational metrics and exports reports', priority: 'High', complexity: 'Medium', dependencies: 'Auth', source: 'AI Suggested', accepted: true }
    ],
    assumptions: { ...DEFAULT_ASSUMPTIONS },
    techStack: [
      { category: 'Frontend', current: 'React / Vite', recommended: 'Next.js App Router', reason: 'Better SSR performance and automatic routing.', costDiff: 0, accepted: true },
      { category: 'Backend', current: 'Express JS', recommended: 'FastAPI / Python', reason: 'Native ML/AI ecosystem compatibility.', costDiff: -1500, accepted: true }
    ]
  });

  // Load projects from localStorage
  useEffect(() => {
    const local = localStorage.getItem('estimateai_projects');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        setProjects(parsed.length > 0 ? parsed : SAMPLE_PROJECTS);
      } catch (e) {
        setProjects(SAMPLE_PROJECTS);
      }
    } else {
      setProjects(SAMPLE_PROJECTS);
      localStorage.setItem('estimateai_projects', JSON.stringify(SAMPLE_PROJECTS));
    }
  }, []);

  const saveProjects = (updated) => {
    setProjects(updated);
    localStorage.setItem('estimateai_projects', JSON.stringify(updated));
  };

  const activeProject = useMemo(() => {
    return projects.find(p => p.id === activeProjectId) || projects[0] || SAMPLE_PROJECTS[0];
  }, [projects, activeProjectId]);

  // Sync simulator controls when active project changes
  useEffect(() => {
    if (activeProject && activeProject.assumptions) {
      setSimulator({
        devCount: activeProject.assumptions.teamSize || 3,
        devRate: activeProject.assumptions.devMonthlyRate || 85000,
        customers: activeProject.assumptions.expectedCustomers || 350,
        price: activeProject.assumptions.productPrice || 499,
        cloud: activeProject.assumptions.cloudBudget || 10000,
        api: activeProject.assumptions.apiBudget || 5000,
        timeline: activeProject.assumptions.targetTimeline || 4
      });
    }
  }, [activeProjectId, activeProject]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const navigateTo = (r, projectId = null) => {
    setRoute(r);
    if (projectId) setActiveProjectId(projectId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const downloadProjectReport = (projectId) => {
    setActiveProjectId(projectId);
    setAutoPrintReport(true);
    setRoute('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startNewProject = () => {
    setWizardStep(1);
    setStep1Error('');
    setAiSuggestionMessage('');
    setWizardData({
      id: 'proj-' + Date.now(),
      name: '',
      description: '',
      type: 'SaaS Platform',
      targetUsers: 'SMB Business Owners',
      expectedUsers: 2500,
      businessModel: 'Subscription',
      requirements: [
        { id: 'r1', text: 'Secure multi-tenant data isolation', type: 'Functional', source: 'User Provided', complexity: 'Medium', ambiguous: false, duplicate: false }
      ],
      features: [
        { id: 'f1', name: 'User Auth & Role Management', description: 'SSO and team organization setup', priority: 'High', complexity: 'Low', dependencies: 'None', source: 'AI Suggested', accepted: true }
      ],
      assumptions: { ...DEFAULT_ASSUMPTIONS },
      techStack: [
        { category: 'Frontend', current: 'React', recommended: 'Next.js App Router', reason: 'Improved SEO and automated routing.', costDiff: 0, accepted: true },
        { category: 'Backend', current: 'Node.js', recommended: 'FastAPI (Python)', reason: 'Higher execution speed for async tasks.', costDiff: -1000, accepted: true }
      ]
    });
    navigateTo('wizard');
  };

  const handleNextStep = async () => {
    if (wizardStep === 1) {
      setStep1Error('');
      const cleanName = wizardData.name.trim();
      const cleanDesc = wizardData.description.trim();

      if (!cleanName || !cleanDesc) {
        setStep1Error('Please enter appropriate Project Name and Description.');
        return;
      }

      try {
        const nameIsValid = await validateMeaningfulText(
          cleanName,
          'Project Name'
        );

        if (!nameIsValid) {
          setStep1Error(
            'Your project name appears to be gibberish. Please enter a meaningful name.'
          );
          return;
        }

        const descriptionIsValid = await validateMeaningfulText(
          cleanDesc,
          'Project Description'
        );

        if (!descriptionIsValid) {
          setStep1Error(
            'Your project description appears to be gibberish. Please enter a meaningful description.'
          );
          return;
        }
      } catch (error) {
        setStep1Error(
          error instanceof Error
            ? error.message
            : 'Unable to validate your input. Please try again.'
        );
        return;
      }
    }

    if (wizardStep === 2) {
      // Automatically generate a broader, project-specific starting feature set.
      let generatedFeatures = [];
      let featureError = '';
      try {
        generatedFeatures = await aiService.generateFeatures(wizardData.name, wizardData.type, wizardData.description, []);
      } catch (err) {
        featureError = err?.message || 'Please check your API key and internet connection.';
      }
      setWizardData(prev => ({
        ...prev,
        features: generatedFeatures.length > 0 ? generatedFeatures : prev.features
      }));
      if (featureError) {
        setAiSuggestionMessage(`AI feature suggestions failed: ${featureError} You can add features manually or use "Ask AI Suggestions" again.`);
      } else if (generatedFeatures.length === 0) {
        setAiSuggestionMessage('Only the currently available suggestions fit this project. If you have your own ideas, add them or customise the existing features.');
      } else {
        setAiSuggestionMessage('AI generated a broader project-specific feature set. You can ask again to add more unique suggestions.');
      }
    }

    setWizardStep(wizardStep + 1);
  };

  const handleRunAnalysis = async () => {
    setWizardStep(5);

    const initialEstimates = estimationEngine.calculateEstimates(wizardData.features, wizardData.assumptions, wizardData.techStack);
    const initialConstraints = constraintEngine.analyze(wizardData, initialEstimates);
    const initialRisks = riskEngine.analyze(wizardData, initialEstimates);
    const aiAnalysis = await aiService.analyzeProject(wizardData, initialEstimates, initialConstraints, initialRisks);
    const finalTechStack = aiAnalysis.techStack?.length ? aiAnalysis.techStack : wizardData.techStack;

    // Recalculate the actual report after AI technology recommendations so any accepted technology cost differences are included.
    const estimates = estimationEngine.calculateEstimates(wizardData.features, wizardData.assumptions, finalTechStack);
    const constraints = constraintEngine.analyze({ ...wizardData, techStack: finalTechStack }, estimates);
    const risks = riskEngine.analyze({ ...wizardData, techStack: finalTechStack }, estimates);
    const feasibility = feasibilityEngine.calculate({ ...wizardData, techStack: finalTechStack }, estimates, constraints, risks);
    const competitors = marketIntelligenceEngine.getCompetitors(wizardData);
    const customerInsights = marketIntelligenceEngine.getCustomerInsights(wizardData);
    const marketResearch = await aiService.generateMarketResearch(wizardData);
    const featureEstimates = planningEngine.estimateFeatures(wizardData.features, wizardData.assumptions);
    const requirementFeatureMap = planningEngine.mapRequirementsToFeatures(wizardData.requirements, wizardData.features);
    const dependencyAnalysis = planningEngine.dependencyAnalysis(wizardData.features);
    const roadmap = planningEngine.buildRoadmap(wizardData.features, wizardData.assumptions);
    const resourcePlan = planningEngine.buildResourcePlan(wizardData, estimates);
    const scenarioComparison = planningEngine.compareScenarios(wizardData);

    // Keep a short preparation delay so the analysis screen is visible while the AI layer runs.
    await new Promise(resolve => setTimeout(resolve, 700));

    const newProj = {
      ...wizardData,
      techStack: finalTechStack,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Analyzed',
      estimates,
      constraints,
      risks,
      feasibility,
      competitors,
      customerInsights,
      marketResearch,
      featureEstimates,
      requirementFeatureMap,
      dependencyAnalysis,
      roadmap,
      resourcePlan,
      scenarioComparison,
      aiAnalysis
    };

    const updated = [newProj, ...projects];
    saveProjects(updated);
    setActiveProjectId(newProj.id);
    navigateTo('details', newProj.id);
  };

  const addWizardRequirement = async (text, type) => {
    const cleanText = text.trim();

    if (!cleanText) return { success: false, error: 'Requirement text cannot be empty.' };

    const validWordRegex =
      /^[a-zA-Z0-9\s.,:;'"!?%\-_/()&@+#=<>]+$/;

    if (!validWordRegex.test(cleanText)) {
      return {
        success: false,
        error: 'Please remove unsupported characters from the requirement.'
      };
    }

    try {
      const isMeaningful = await validateMeaningfulText(
        cleanText,
        'Project Requirement'
      );

      if (!isMeaningful) {
        return {
          success: false,
          error: 'This requirement appears to be gibberish. Please enter a meaningful requirement.'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : 'Unable to validate this requirement. Please try again.'
      };
    }

    const normalizedText = cleanText
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ');

    const isDuplicate = wizardData.requirements.some((r) => {
      const existingText = r.text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ');

      return (
        existingText === normalizedText ||
        existingText.includes(normalizedText) ||
        normalizedText.includes(existingText)
      );
    });

    const vagueWords = ['fast', 'easy', 'simple', 'good', 'better', 'secure', 'user friendly', 'high performance', 'quick', 'efficient'];
    const containsVagueWord = vagueWords.some(word => normalizedText.includes(word));

    const isAmbiguous = cleanText.length < 15 || containsVagueWord;

    let complexity = 'Medium';
    if (cleanText.length > 100) complexity = 'High';
    else if (cleanText.length < 35) complexity = 'Low';

    const newReq = {
      id: 'r-' + Date.now(),
      text: cleanText,
      type,
      source: 'User Provided',
      complexity,
      ambiguous: isAmbiguous,
      duplicate: isDuplicate
    };

    setWizardData({
      ...wizardData,
      requirements: [...wizardData.requirements, newReq]
    });

    return { success: true };
  };

  const removeWizardRequirement = (id) => {
    setWizardData({
      ...wizardData,
      requirements: wizardData.requirements.filter(r => r.id !== id)
    });
  };

  const addCustomFeature = (feature) => {
    const newFeature = {
      ...feature,
      id: 'f-' + Date.now(),
      source: 'Custom',
      accepted: true
    };
    setWizardData({ ...wizardData, features: [...wizardData.features, newFeature] });
    setCustomFeatureModalOpen(false);
  };

  const removeWizardFeature = (id) => {
    setWizardData({ ...wizardData, features: wizardData.features.filter(f => f.id !== id) });
  };

  const duplicateProject = (id) => {
    const target = projects.find(p => p.id === id);
    if (!target) return;
    const dup = {
      ...target,
      id: 'proj-' + Date.now(),
      name: target.name + ' (Copy)',
      createdAt: new Date().toISOString().split('T')[0]
    };
    const updated = [dup, ...projects];
    saveProjects(updated);
  };

  const deleteProject = (id) => {
    if (confirm('Are you sure you want to delete this project estimate?')) {
      const updated = projects.filter(p => p.id !== id);
      saveProjects(updated);
      if (activeProjectId === id) setActiveProjectId(updated[0]?.id || null);
    }
  };

  const handleUpdateTechRecommendation = (index, accepted) => {
    const shouldUseDomainFallback = activeProject?.aiAnalysis?.source !== 'Gemini AI';
    const baseTechStack = shouldUseDomainFallback
      ? aiService.getFallbackTechStack(activeProject)
      : (activeProject.techStack || []);
    const target = {
      ...activeProject,
      techStack: [...baseTechStack]
    };

    target.techStack[index] = {
      ...target.techStack[index],
      accepted
    };

    const estimates = estimationEngine.calculateEstimates(target.features, target.assumptions, target.techStack);
    const constraints = constraintEngine.analyze(target, estimates);
    const risks = riskEngine.analyze(target, estimates);
    const feasibility = feasibilityEngine.calculate(target, estimates, constraints, risks);

    target.estimates = estimates;
    target.constraints = constraints;
    target.risks = risks;
    target.feasibility = feasibility;

    const updated = projects.map(p => p.id === target.id ? target : p);
    saveProjects(updated);
  };

  // ---------- Redesign helpers (UI only; no business logic) ----------
  const activeProjectName = activeProject?.name || 'Select a project';
  const firstName = (user.isLoggedIn && user.name ? user.name.trim().split(/\s+/)[0] : '') || 'there';
  const avatarLetter = (user.isLoggedIn && user.name ? user.name.trim().charAt(0) : 'G').toUpperCase();

  const goTo = (r, projectId = null) => {
    setSidebarOpen(false);
    if (r === 'details') setAnalysisPage('overview');
    navigateTo(r, projectId);
  };

  const goToAnalysisPage = (pageId) => {
    setSidebarOpen(false);
    setAnalysisPage(pageId);
    navigateTo('details', activeProject?.id || null);
  };

  const startNewFromShell = () => {
    setSidebarOpen(false);
    startNewProject();
  };

  const NavButton = ({ active, icon: Icon, label, onClick, hint }) => (
    <button onClick={onClick} className={`ea-nav-item ${active ? 'active' : ''}`} title={hint || label}>
      <Icon className="w-[17px] h-[17px] shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );

  return (
    <div className={`estimateai-app ea-root ${darkMode ? 'dark' : ''}`}>
      <style>{THEME_CSS}</style>

      <div className="ea-shell">
        {sidebarOpen && <div className="ea-scrim" onClick={() => setSidebarOpen(false)} />}

        {/* ============ SIDEBAR ============ */}
        <aside className={`ea-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <button className="ea-sidebar-close lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X className="w-5 h-5" /></button>

          <div className="ea-logo-wrap" onClick={() => goTo('landing')} role="button" tabIndex={0}>
            <span className="ea-logo">EstimateAI</span>
            <span className="ea-logo-sub">Project Cost &amp; Planning</span>
          </div>

          <div className="ea-divider" />

          <button className="ea-profile" onClick={() => setAuthModalOpen(true)} title={user.isLoggedIn ? 'My Account' : 'Sign In'}>
            <span className="ea-avatar">{avatarLetter}</span>
            <span className="min-w-0 text-left">
              <span className="block text-[13px] font-bold ea-ink truncate">{user.isLoggedIn ? user.name : 'Guest'}</span>
              <span className="block text-[11px] ea-muted truncate">{user.isLoggedIn ? user.email : 'Sign in to your workspace'}</span>
            </span>
          </button>

          <div className="ea-divider" />

          <nav className="ea-nav">
            <NavButton active={route === 'landing'} icon={Home} label="Home" onClick={() => goTo('landing')} />
            <NavButton active={route === 'dashboard'} icon={LayoutGrid} label="Dashboard" onClick={() => goTo('dashboard')} />
            <NavButton active={route === 'wizard'} icon={PlusCircle} label="New Project" onClick={startNewFromShell} />

            {projects.length > 0 && (
              <>
                <div className="ea-nav-section">
                  <span>Analysis</span>
                  <span className="ea-nav-project" title={activeProjectName}>{activeProjectName}</span>
                </div>
                {ANALYSIS_PAGES.map(p => (
                  <NavButton
                    key={p.id}
                    active={route === 'details' && analysisPage === p.id}
                    icon={p.icon}
                    label={p.label}
                    onClick={() => goToAnalysisPage(p.id)}
                  />
                ))}
              </>
            )}
          </nav>

          <div className="ea-sidebar-bottom">
            <div className="ea-nav-section"><span>Workspace</span></div>
            <NavButton active={false} icon={Settings} label="AI Settings" onClick={() => { setSidebarOpen(false); setConfigModalOpen(true); }} hint="AI Service & API Key Settings" />
            <NavButton active={false} icon={ShieldCheck} label={user.isLoggedIn ? 'My Account' : 'Sign In'} onClick={() => { setSidebarOpen(false); setAuthModalOpen(true); }} />
            <NavButton active={false} icon={RefreshCw} label="Reset Demo Dataset" onClick={() => { localStorage.removeItem('estimateai_projects'); setProjects(SAMPLE_PROJECTS); alert('Demo dataset reset.'); }} />

            <button className="ea-theme-toggle" onClick={toggleDarkMode} title="Toggle Dark/Light Mode" role="switch" aria-checked={darkMode}>
              <span className="flex items-center gap-2 text-[12px] font-semibold">
                {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                {darkMode ? 'Dark mode' : 'Light mode'}
              </span>
              <span className={`ea-switch ${darkMode ? 'on' : ''}`}><span /></span>
            </button>
          </div>
        </aside>

        {/* ============ MAIN COLUMN ============ */}
        <div className="ea-main">
          <header className="ea-topbar">
            <button className="ea-icon-btn lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu className="w-5 h-5" /></button>
            <div className="ea-search">
              <Search className="w-[18px] h-[18px] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                aria-label="Search projects"
              />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="ea-search-clear" aria-label="Clear search"><X className="w-4 h-4" /></button>}
            </div>
            <div className="ea-greeting">
              <span className="hidden sm:inline">Hi {firstName}</span>
              <button className="ea-avatar ea-avatar-lg" onClick={() => setAuthModalOpen(true)} title={user.isLoggedIn ? 'My Account' : 'Sign In'}>{avatarLetter}</button>
            </div>
          </header>

          <main className="ea-content">
            {route === 'landing' && <LandingPageView navigateTo={goTo} startNewProject={startNewFromShell} />}
            {route === 'dashboard' && <DashboardView projects={projects} query={searchQuery} navigateTo={goTo} startNewProject={startNewFromShell} duplicateProject={duplicateProject} deleteProject={deleteProject} downloadProjectReport={downloadProjectReport} />}
            {route === 'wizard' && (
              <WizardView
                step={wizardStep}
                data={wizardData}
                setData={setWizardData}
                onNext={handleNextStep}
                onPrev={() => setWizardStep(wizardStep - 1)}
                onRun={handleRunAnalysis}
                addRequirement={addWizardRequirement}
                removeRequirement={removeWizardRequirement}
                openCustomFeatureModal={() => setCustomFeatureModalOpen(true)}
                removeFeature={removeWizardFeature}
                step1Error={step1Error}
                setStep1Error={setStep1Error}
                aiSuggestionMessage={aiSuggestionMessage}
                setAiSuggestionMessage={setAiSuggestionMessage}
              />
            )}
            {route === 'details' && (
              <ProjectAnalysisView
                project={activeProject}
                simulator={simulator}
                setSimulator={setSimulator}
                navigateTo={goTo}
                onUpdateTech={handleUpdateTechRecommendation}
                page={analysisPage}
                setPage={setAnalysisPage}
                autoPrintReport={autoPrintReport}
                onAutoPrintHandled={() => setAutoPrintReport(false)}
              />
            )}
          </main>

          <footer className="ea-footer">
            <span>&copy; 2026 EstimateAI. All rights reserved.</span>
            <span className="hidden sm:inline">Estimate before you invest. Validate before you build.</span>
          </footer>
        </div>
      </div>

      {/* MODALS */}
      {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} user={user} setUser={setUser} />}
      {configModalOpen && <ConfigModal onClose={() => setConfigModalOpen(false)} />}
      {customFeatureModalOpen && <CustomFeatureModal onClose={() => setCustomFeatureModalOpen(false)} onAdd={addCustomFeature} />}
    </div>
  );
}

// ==========================================
// 8. REDESIGN: SHARED UI PIECES & THEME
// ==========================================

const ANALYSIS_PAGES = [
  { id: 'overview', label: 'Overview', icon: Target, description: 'Score, recommendation & key numbers' },
  { id: 'cost', label: 'Cost & Simulator', icon: DollarSign, description: 'Cost breakdown, per-feature estimates & what-if' },
  { id: 'scope', label: 'Scope & Delivery', icon: ListChecks, description: 'Traceability, dependencies, roadmap & team' },
  { id: 'market', label: 'Market & Technology', icon: Globe, description: 'Competitors, users & recommended tech' },
  { id: 'risks', label: 'Limits & Risks', icon: ShieldAlert, description: 'Project limits, risks & scenarios' }
];

const filterProjects = (projects = [], query = '') => {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return projects;
  return projects.filter(p => `${p.name || ''} ${p.type || ''} ${p.description || ''}`.toLowerCase().includes(q));
};

function Card({ children, className = '', ...rest }) {
  return <section className={`ea-card ${className}`} {...rest}>{children}</section>;
}

function CardHeader({ icon: Icon, title, subtitle, right }) {
  return (
    <div className="ea-card-head">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && <span className="ea-icon-box"><Icon className="w-[18px] h-[18px]" /></span>}
        <div className="min-w-0">
          <h3 className="ea-card-title">{title}</h3>
          {subtitle && <p className="ea-card-sub">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

function PageHeading({ title, subtitle, actions }) {
  return (
    <div className="ea-page-head">
      <div className="min-w-0">
        <h2 className="ea-page-title">{title}</h2>
        {subtitle && <p className="ea-page-sub">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

const THEME_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700;800;900&display=swap');

.ea-root {
  --ea-bg: #f3f0ff;
  --ea-card: #ffffff;
  --ea-ink: #1b1646;
  --ea-text: #4a4868;
  --ea-muted: #6f6d90;
  --ea-line: #ebe7fb;
  --ea-soft: #f7f5ff;
  --ea-soft-2: #efe9ff;
  --ea-primary: #7b4ef0;
  --ea-primary-600: #6a3ee0;
  --ea-primary-700: #5a31c4;
  --ea-green: #12a26b;
  --ea-green-bg: #e3f7ee;
  --ea-amber: #b86e00;
  --ea-amber-bg: #fff3dc;
  --ea-red: #d42f4f;
  --ea-red-bg: #fde8ec;
  --ea-blue: #2d6bdc;
  --ea-blue-bg: #e6eefd;
  --ea-shadow: 0 6px 24px rgba(91, 60, 180, 0.08);
  --ea-shadow-hover: 0 10px 30px rgba(91, 60, 180, 0.14);
  font-family: 'Nunito Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  background: var(--ea-bg);
  color: var(--ea-text);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}
.ea-root.dark {
  --ea-bg: #120f26;
  --ea-card: #1b1735;
  --ea-ink: #f4f2ff;
  --ea-text: #cfcbe8;
  --ea-muted: #a29dc4;
  --ea-line: #2c2751;
  --ea-soft: #231e44;
  --ea-soft-2: #2e2758;
  --ea-primary: #9a78ff;
  --ea-primary-600: #8a66fb;
  --ea-primary-700: #7b55f0;
  --ea-green: #4fd8a0;
  --ea-green-bg: #12392c;
  --ea-amber: #ffc266;
  --ea-amber-bg: #3a2c10;
  --ea-red: #ff8aa0;
  --ea-red-bg: #3d1823;
  --ea-blue: #86aeff;
  --ea-blue-bg: #172a50;
  --ea-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
  --ea-shadow-hover: 0 10px 30px rgba(0, 0, 0, 0.5);
}
.ea-root *, .ea-root *::before, .ea-root *::after { box-sizing: border-box; }
.ea-root h1, .ea-root h2, .ea-root h3, .ea-root h4 { color: var(--ea-ink); letter-spacing: -0.01em; margin: 0; }
.ea-ink { color: var(--ea-ink); }
.ea-muted { color: var(--ea-muted); }
.ea-primary-text { color: var(--ea-primary); }
.ea-root button { font-family: inherit; cursor: pointer; }
.ea-root button:disabled { cursor: not-allowed; opacity: 0.6; }

/* ---------- shell ---------- */
.ea-shell { display: flex; gap: 20px; padding: 16px; min-height: 100vh; align-items: flex-start; }
.ea-main { flex: 1; min-width: 0; display: flex; flex-direction: column; min-height: calc(100vh - 32px); }
.ea-content { flex: 1; padding-top: 20px; width: 100%; max-width: 1360px; margin: 0 auto; }
.ea-topbar, .ea-footer { width: 100%; max-width: 1360px; margin-left: auto; margin-right: auto; }
.ea-footer { display: flex; justify-content: space-between; gap: 12px; font-size: 11px; color: var(--ea-muted); padding: 18px 6px 4px; }

.ea-sidebar {
  width: 252px; flex-shrink: 0; position: sticky; top: 16px; height: calc(100vh - 32px);
  background: var(--ea-card); border-radius: 20px; box-shadow: var(--ea-shadow);
  padding: 22px 14px 16px; display: flex; flex-direction: column; overflow-y: auto; z-index: 50;
}
.ea-sidebar::-webkit-scrollbar { width: 6px; }
.ea-sidebar::-webkit-scrollbar-thumb { background: var(--ea-line); border-radius: 6px; }
.ea-logo-wrap { text-align: center; cursor: pointer; padding: 2px 0 14px; outline: none; }
.ea-logo {
  display: inline-block; font-size: 25px; font-weight: 900; letter-spacing: -0.02em;
  background: linear-gradient(90deg, #ff3d81 0%, #ff8a2b 18%, #f2c200 34%, #2fc46a 50%, #19b3e6 66%, #7b4ef0 82%, #c13fe0 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent;
}
.ea-logo-sub { display: block; font-size: 10.5px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ea-muted); margin-top: 2px; }
.ea-divider { height: 1px; margin: 4px 6px; background: linear-gradient(90deg, transparent, #b49cf7, transparent); opacity: 0.7; }
.ea-profile { display: flex; align-items: center; gap: 10px; width: 100%; background: transparent; border: 0; padding: 12px 8px; border-radius: 12px; transition: background 150ms; }
.ea-profile:hover { background: var(--ea-soft); }
.ea-avatar {
  width: 36px; height: 36px; border-radius: 999px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #8f6bff, #5b34d6); color: #fff; font-weight: 800; font-size: 14px; border: 0;
}
.ea-avatar-lg { width: 38px; height: 38px; box-shadow: 0 0 0 3px var(--ea-soft-2); }
.ea-nav { display: flex; flex-direction: column; gap: 4px; margin-top: 12px; }
.ea-nav-item {
  display: flex; align-items: center; gap: 11px; width: 100%; text-align: left; border: 0; background: transparent;
  color: var(--ea-text); font-size: 13px; font-weight: 600; padding: 10px 14px; border-radius: 10px; transition: background 150ms, color 150ms, box-shadow 150ms;
}
.ea-nav-item:hover { background: var(--ea-soft); color: var(--ea-ink); }
.ea-nav-item.active { background: var(--ea-primary); color: #fff; box-shadow: 0 6px 14px rgba(123, 78, 240, 0.32); }
.ea-nav-section { display: flex; flex-direction: column; gap: 2px; padding: 16px 14px 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ea-ink); }
.ea-nav-project { font-size: 11px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--ea-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ea-sidebar-bottom { margin-top: auto; padding-top: 10px; display: flex; flex-direction: column; gap: 4px; }
.ea-theme-toggle { display: flex; align-items: center; justify-content: space-between; width: 100%; border: 0; background: var(--ea-soft); color: var(--ea-ink); padding: 10px 14px; border-radius: 12px; margin-top: 8px; }
.ea-switch { width: 36px; height: 20px; border-radius: 999px; background: #cfc6ee; position: relative; transition: background 150ms; flex-shrink: 0; }
.ea-switch span { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 999px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.25); transition: transform 150ms; }
.ea-switch.on { background: var(--ea-primary); }
.ea-switch.on span { transform: translateX(16px); }
.ea-sidebar-close { position: absolute; top: 12px; right: 12px; border: 0; background: var(--ea-soft); color: var(--ea-ink); width: 32px; height: 32px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; }
.ea-scrim { position: fixed; inset: 0; background: rgba(27, 22, 70, 0.45); backdrop-filter: blur(2px); z-index: 45; }

.ea-topbar { display: flex; align-items: center; gap: 14px; background: var(--ea-card); border-radius: 16px; box-shadow: var(--ea-shadow); padding: 12px 20px; min-height: 64px; position: sticky; top: 16px; z-index: 30; }
.ea-search { flex: 1; display: flex; align-items: center; gap: 10px; color: var(--ea-muted); border-bottom: 1px solid var(--ea-line); padding: 6px 2px; max-width: 520px; }
.ea-search input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; font-size: 14px; color: var(--ea-ink); font-family: inherit; }
.ea-search input::placeholder { color: var(--ea-muted); }
.ea-search:focus-within { border-bottom-color: var(--ea-primary); color: var(--ea-primary); }
.ea-search-clear { border: 0; background: transparent; color: var(--ea-muted); display: inline-flex; padding: 2px; }
.ea-greeting { margin-left: auto; display: flex; align-items: center; gap: 12px; font-size: 18px; font-weight: 800; color: var(--ea-ink); }
.ea-icon-btn { border: 0; background: var(--ea-soft); color: var(--ea-ink); width: 38px; height: 38px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; }

/* ---------- cards ---------- */
.ea-card { background: var(--ea-card); border-radius: 16px; box-shadow: var(--ea-shadow); padding: 22px 24px; border: 1px solid transparent; transition: box-shadow 160ms ease, transform 160ms ease; }
.ea-card.hoverable:hover { box-shadow: var(--ea-shadow-hover); transform: translateY(-2px); }
.ea-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.ea-card-title { font-size: 17px; font-weight: 800; color: var(--ea-ink); }
.ea-card-sub { font-size: 12.5px; color: var(--ea-muted); margin-top: 3px; line-height: 1.5; }
.ea-icon-box { width: 36px; height: 36px; border-radius: 10px; background: var(--ea-soft-2); color: var(--ea-primary); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ea-page-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.ea-page-title { font-size: 26px; font-weight: 900; color: var(--ea-ink); }
.ea-page-sub { font-size: 13.5px; color: var(--ea-muted); margin-top: 4px; }
.ea-stack { display: flex; flex-direction: column; gap: 20px; }
.ea-panel { background: var(--ea-soft); border-radius: 12px; padding: 12px 14px; font-size: 12.5px; color: var(--ea-text); }
.ea-panel-label { display: block; font-size: 11px; font-weight: 700; color: var(--ea-muted); margin-bottom: 2px; }
.ea-panel strong, .ea-panel b { color: var(--ea-ink); }
.ea-eyebrow { font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ea-primary); }

/* metric */
.ea-metric-title { font-size: 13px; font-weight: 600; color: var(--ea-text); }
.ea-metric-value { font-size: 28px; font-weight: 900; color: var(--ea-ink); letter-spacing: -0.02em; margin-top: 10px; line-height: 1.1; word-break: break-word; }
.ea-metric-sub { font-size: 11.5px; color: var(--ea-muted); margin-top: 8px; line-height: 1.45; }

/* ---------- buttons ---------- */
.ea-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid transparent; border-radius: 12px; padding: 10px 18px; font-size: 13px; font-weight: 700; transition: background 150ms, box-shadow 150ms, transform 120ms, border-color 150ms; white-space: nowrap; }
.ea-btn:active:not(:disabled) { transform: scale(0.98); }
.ea-btn-primary { background: var(--ea-primary); color: #fff; box-shadow: 0 6px 16px rgba(123, 78, 240, 0.3); }
.ea-btn-primary:hover:not(:disabled) { background: var(--ea-primary-600); box-shadow: 0 8px 20px rgba(123, 78, 240, 0.4); }
.ea-btn-soft { background: var(--ea-soft-2); color: var(--ea-primary-700); }
.ea-root.dark .ea-btn-soft { color: var(--ea-primary); }
.ea-btn-soft:hover:not(:disabled) { background: var(--ea-line); }
.ea-btn-outline { background: var(--ea-card); color: var(--ea-ink); border-color: var(--ea-line); }
.ea-btn-outline:hover:not(:disabled) { border-color: var(--ea-primary); color: var(--ea-primary); }
.ea-btn-sm { padding: 7px 12px; font-size: 12px; border-radius: 10px; }
.ea-btn-icon { border: 0; background: transparent; color: var(--ea-muted); padding: 7px; border-radius: 10px; display: inline-flex; transition: background 150ms, color 150ms; }
.ea-btn-icon:hover { background: var(--ea-soft); color: var(--ea-primary); }
.ea-btn-icon.danger:hover { background: var(--ea-red-bg); color: var(--ea-red); }

/* ---------- forms ---------- */
.ea-label { display: block; font-size: 13px; font-weight: 700; color: var(--ea-ink); margin-bottom: 6px; }
.ea-hint { font-size: 11.5px; color: var(--ea-muted); margin-top: 5px; }
.ea-input, .ea-root select.ea-input, .ea-root textarea.ea-input {
  width: 100%; background: var(--ea-soft); border: 1px solid var(--ea-line); color: var(--ea-ink); border-radius: 12px;
  padding: 11px 14px; font-size: 14px; font-family: inherit; outline: none; transition: border-color 150ms, box-shadow 150ms, background 150ms;
}
.ea-input::placeholder { color: var(--ea-muted); opacity: 0.85; }
.ea-input:focus { border-color: var(--ea-primary); background: var(--ea-card); box-shadow: 0 0 0 4px rgba(123, 78, 240, 0.14); }
.ea-input.invalid { border-color: var(--ea-red); box-shadow: 0 0 0 3px rgba(212, 47, 79, 0.12); }
.ea-root select.ea-input { appearance: none; cursor: pointer; padding-right: 38px;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%237b4ef0' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat: no-repeat; background-position: right 12px center; }
.ea-root option { color: #1b1646; background: #fff; }
.ea-root input[type='range'] { accent-color: var(--ea-primary); width: 100%; height: 4px; cursor: pointer; }

/* ---------- chips & alerts ---------- */
.ea-chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; line-height: 1.5; background: var(--ea-soft-2); color: var(--ea-primary-700); }
.ea-root.dark .ea-chip { color: var(--ea-primary); }
.ea-chip.green { background: var(--ea-green-bg); color: var(--ea-green); }
.ea-chip.amber { background: var(--ea-amber-bg); color: var(--ea-amber); }
.ea-chip.red { background: var(--ea-red-bg); color: var(--ea-red); }
.ea-chip.blue { background: var(--ea-blue-bg); color: var(--ea-blue); }
.ea-chip.gray { background: var(--ea-soft); color: var(--ea-muted); }
.ea-alert { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 12px; font-size: 12.5px; font-weight: 600; line-height: 1.5; }
.ea-alert.info { background: var(--ea-soft-2); color: var(--ea-primary-700); }
.ea-root.dark .ea-alert.info { color: var(--ea-text); }
.ea-alert.error { background: var(--ea-red-bg); color: var(--ea-red); border: 1px solid rgba(212, 47, 79, 0.25); }
.ea-alert.success { background: var(--ea-green-bg); color: var(--ea-green); }
.ea-alert.warn { background: var(--ea-amber-bg); color: var(--ea-amber); }

/* ---------- tabs, progress, tables ---------- */
.ea-tabs { display: flex; gap: 6px; padding: 6px; background: var(--ea-card); border-radius: 14px; box-shadow: var(--ea-shadow); overflow-x: auto; position: sticky; top: 92px; z-index: 20; }
.ea-tab { flex: 1; min-width: max-content; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 0; background: transparent; color: var(--ea-text); font-size: 13px; font-weight: 700; padding: 10px 16px; border-radius: 10px; transition: background 150ms, color 150ms; }
.ea-tab:hover { background: var(--ea-soft); color: var(--ea-ink); }
.ea-tab.active { background: var(--ea-primary); color: #fff; box-shadow: 0 6px 14px rgba(123, 78, 240, 0.3); }
.ea-progress { height: 8px; border-radius: 999px; background: var(--ea-soft-2); overflow: hidden; }
.ea-progress > div { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #a68bff, #7b4ef0); transition: width 300ms ease; }
.ea-table { width: 100%; font-size: 12.5px; border-collapse: separate; border-spacing: 0; }
.ea-table th { text-align: left; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: var(--ea-muted); padding: 10px 12px; border-bottom: 1px solid var(--ea-line); }
.ea-table td { padding: 12px; color: var(--ea-text); border-bottom: 1px solid var(--ea-line); vertical-align: top; }
.ea-table tr:last-child td { border-bottom: 0; }
.ea-table td.strong { color: var(--ea-ink); font-weight: 700; }
.ea-row { padding: 14px 16px; border-radius: 14px; background: var(--ea-soft); transition: background 150ms; }
.ea-list-row { padding: 16px 24px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px; border-bottom: 1px solid var(--ea-line); transition: background 150ms; }
.ea-list-row:last-child { border-bottom: 0; }
.ea-list-row:hover { background: var(--ea-soft); }
.ea-link { background: none; border: 0; padding: 0; font: inherit; color: var(--ea-ink); font-weight: 800; text-align: left; transition: color 150ms; }
.ea-link:hover { color: var(--ea-primary); }
.ea-score-ring { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; width: 78px; height: 78px; border-radius: 999px; background: conic-gradient(var(--ea-primary) calc(var(--v) * 1%), var(--ea-soft-2) 0); position: relative; }
.ea-score-ring::before { content: ''; position: absolute; inset: 7px; background: var(--ea-card); border-radius: 999px; }
.ea-score-ring span { position: relative; font-size: 22px; font-weight: 900; color: var(--ea-ink); line-height: 1; }
.ea-score-ring small { position: relative; font-size: 9px; font-weight: 700; color: var(--ea-muted); margin-top: 2px; }

/* ---------- modal ---------- */
.ea-modal-backdrop { position: fixed; inset: 0; background: rgba(27, 22, 70, 0.5); backdrop-filter: blur(4px); z-index: 80; display: flex; align-items: flex-start; justify-content: center; overflow-y: auto; padding: 24px 16px; }
.ea-modal { position: relative; background: var(--ea-card); border-radius: 20px; box-shadow: 0 24px 60px rgba(40, 20, 110, 0.3); width: 100%; margin: auto; padding: 28px; }
.ea-modal-close { position: absolute; top: 16px; right: 16px; border: 0; background: var(--ea-soft); color: var(--ea-muted); width: 34px; height: 34px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; transition: color 150ms; }
.ea-modal-close:hover { color: var(--ea-primary); }

/* ---------- hero (landing) ---------- */
.ea-hero { background: var(--ea-card); border-radius: 24px; box-shadow: var(--ea-shadow); padding: 56px 28px; text-align: center; position: relative; overflow: hidden; }
.ea-hero::before { content: ''; position: absolute; inset: -40% -10% auto -10%; height: 90%; background: radial-gradient(60% 60% at 50% 0%, rgba(123, 78, 240, 0.16), transparent 70%); pointer-events: none; }
.ea-hero > * { position: relative; }
.ea-hero h1 { font-size: clamp(2rem, 4.6vw, 3.4rem); font-weight: 900; line-height: 1.1; letter-spacing: -0.03em; }
.ea-grad-text { background: linear-gradient(90deg, #7b4ef0, #c13fe0); -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; }

/* ---------- responsive ---------- */
@media (max-width: 1023px) {
  .ea-shell { padding: 12px; gap: 0; }
  .ea-sidebar { position: fixed; top: 12px; left: 12px; bottom: 12px; height: auto; transform: translateX(calc(-100% - 24px)); transition: transform 220ms ease; width: min(86vw, 300px); }
  .ea-sidebar.open { transform: translateX(0); }
  .ea-topbar { top: 12px; padding: 10px 14px; }
  .ea-tabs { top: 82px; }
  .ea-main { min-height: calc(100vh - 24px); }
}
@media (max-width: 640px) {
  .ea-card { padding: 18px 16px; }
  .ea-page-title { font-size: 22px; }
  .ea-metric-value { font-size: 22px; }
  .ea-list-row { padding: 14px 16px; }
  .ea-greeting { font-size: 15px; }
}

/* ---------- print (full report) ---------- */
@media print {
  .ea-sidebar, .ea-topbar, .ea-footer, .ea-scrim { display: none !important; }
  .ea-root, .ea-shell { background: #fff !important; padding: 0 !important; display: block !important; }
  .ea-card { box-shadow: none !important; border: 1px solid #e5e1f7 !important; break-inside: avoid; }
}
`;

// ==========================================
// 9. SUB-VIEWS & PAGES
// ==========================================

function LandingPageView({ navigateTo, startNewProject }) {
  const steps = [
    { num: "01", title: "Enter Idea", desc: "Define project type, core scope & target audience.", icon: Lightbulb },
    { num: "02", title: "Project Needs", desc: "List what the software must do and how it should work.", icon: ListChecks },
    { num: "03", title: "Features", desc: "AI suggestions & weighted custom feature specs.", icon: Layers },
    { num: "04", title: "Budget & Plan", desc: "Set team size, developer cost, and pricing.", icon: Sliders },
    { num: "05", title: "Project Check", desc: "See cost, timeline, risks, and when you recover your cost.", icon: BarChart3 }
  ];
  return (
    <div className="ea-stack">
      <div className="ea-hero">
        <div className="ea-chip" style={{ padding: '6px 14px', fontSize: 12 }}>
          <Sparkles className="w-3.5 h-3.5" /> Smart Project Planning &amp; Risk Check
        </div>
        <h1 className="mt-5">
          Estimate before you invest.<br />
          <span className="ea-grad-text">Validate before you build.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed ea-muted">
          Check project cost, effort, team needs, risks, and expected returns before you start building.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <button onClick={startNewProject} className="ea-btn ea-btn-primary" style={{ padding: '13px 24px', fontSize: 14 }}>
            <PlusCircle className="w-5 h-5" /> Start New Project
          </button>
          <button onClick={() => navigateTo('details', 'proj-1')} className="ea-btn ea-btn-outline" style={{ padding: '13px 24px', fontSize: 14 }}>
            <PlayCircle className="w-5 h-5" style={{ color: 'var(--ea-primary)' }} /> Explore Demo Analysis
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
        {steps.map((item, idx) => (
          <Card key={idx} className="hoverable">
            <span className="ea-icon-box"><item.icon className="w-[18px] h-[18px]" /></span>
            <span className="ea-eyebrow block mt-4" style={{ color: 'var(--ea-muted)' }}>Step {item.num}</span>
            <h4 className="text-[15px] font-extrabold mt-1">{item.title}</h4>
            <p className="text-[12.5px] ea-muted mt-1.5 leading-relaxed">{item.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ query, onCreate }) {
  return (
    <div className="text-center py-14 px-6">
      <span className="ea-icon-box mx-auto" style={{ width: 52, height: 52, borderRadius: 16 }}><Folder className="w-6 h-6" /></span>
      <h4 className="text-[16px] font-extrabold mt-4">{query ? 'No projects match your search' : 'No projects yet'}</h4>
      <p className="text-[13px] ea-muted mt-1">{query ? 'Try a different name or clear the search box.' : 'Create your first project estimate to see it here.'}</p>
      {!query && <button onClick={onCreate} className="ea-btn ea-btn-primary mt-5"><Plus className="w-4 h-4" /> Create New Project</button>}
    </div>
  );
}

function DashboardView({ projects, query = '', navigateTo, startNewProject, duplicateProject, deleteProject, downloadProjectReport }) {
  const total = projects.length;
  const avgCost = total > 0 ? (projects.reduce((acc, p) => acc + (p.estimates?.totalCost || 0), 0) / total) : 0;
  const avgDuration = total > 0 ? (projects.reduce((acc, p) => acc + (p.estimates?.timelineMonths || 0), 0) / total) : 0;
  const list = filterProjects(projects, query);

  return (
    <div className="ea-stack">
      <PageHeading
        title="Project Cost & Business Dashboard"
        subtitle="Track project estimates, budget risks, and expected returns."
        actions={<button onClick={startNewProject} className="ea-btn ea-btn-primary"><Plus className="w-4 h-4" /> Create New Project</button>}
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        <MetricCard title="Total Projects" value={total} icon={Folder} sub="Saved estimates" />
        <MetricCard title="Projects Analyzed" value={total} icon={CheckCircle} sub="100% evaluated" />
        <MetricCard title="Avg. Estimated Cost" value={formatINR(avgCost)} icon={DollarSign} sub="Deterministic model" />
        <MetricCard title="Avg. Project Duration" value={`${avgDuration.toFixed(1)} months`} icon={Clock} sub="Time to MVP launch" />
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex items-center justify-between gap-3" style={{ padding: '20px 24px', borderBottom: '1px solid var(--ea-line)' }}>
          <h3 className="ea-card-title flex items-center gap-2.5"><span className="ea-icon-box"><LayoutGrid className="w-[18px] h-[18px]" /></span> Saved Project Estimates</h3>
          <span className="text-xs font-bold ea-muted">{list.length} project{list.length === 1 ? '' : 's'}</span>
        </div>
        <div>
          {list.length === 0 && <EmptyState query={query} onCreate={startNewProject} />}
          {list.map(p => (
            <div key={p.id} className="ea-list-row">
              <div className="min-w-0 flex-1" style={{ minWidth: 220 }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <button className="ea-link text-[15px]" onClick={() => navigateTo('details', p.id)}>{p.name}</button>
                  <span className={`ea-chip ${p.feasibility?.overallScore >= 80 ? 'green' : 'amber'}`}>{p.feasibility?.overallScore || 80}/100</span>
                </div>
                <p className="text-[12.5px] ea-muted mt-1 line-clamp-1 max-w-xl">{p.description}</p>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11.5px] ea-muted mt-2 font-semibold">
                  <span>Type: {p.type}</span>
                  <span>Est: {formatINR(p.estimates?.totalCost || 0)}</span>
                  <span>Timeline: {p.estimates?.timelineMonths || 0} months</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => navigateTo('details', p.id)} className="ea-btn ea-btn-primary ea-btn-sm"><FileText className="w-3.5 h-3.5" /> Open Analysis</button>
                <button onClick={() => downloadProjectReport(p.id)} className="ea-btn ea-btn-soft ea-btn-sm" title="Download complete report"><Download className="w-3.5 h-3.5" /> Download Report</button>
                <button onClick={() => duplicateProject(p.id)} className="ea-btn-icon" title="Duplicate"><Copy className="w-4 h-4" /></button>
                <button onClick={() => deleteProject(p.id)} className="ea-btn-icon danger" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, sub }) {
  return (
    <Card className="hoverable">
      <div className="flex items-center justify-between gap-3">
        <span className="ea-metric-title">{title}</span>
        <span className="ea-icon-box"><Icon className="w-[18px] h-[18px]" /></span>
      </div>
      <div className="ea-metric-value">{value}</div>
      <p className="ea-metric-sub">{sub}</p>
    </Card>
  );
}

function WizardView({ step, data, setData, onNext, onPrev, onRun, addRequirement, removeRequirement, openCustomFeatureModal, removeFeature, step1Error, setStep1Error, aiSuggestionMessage, setAiSuggestionMessage }) {
  const [reqInput, setReqInput] = useState('');
  const [reqType, setReqType] = useState('Functional');
  const [reqError, setReqError] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  const handleAddRequirement = async () => {
  setReqError('');

  const text = reqInput.trim();

  if (!text) {
    setReqError('Please enter at least one requirement.');
    return;
  }

  // Convert common copied formatting into normal readable text.
  const cleanedText = text
    .replace(/\$\\text\{([^}]+)\}\$/gi, '$1')
    .replace(/\\%/g, '%')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Detect whether the user pasted multiple requirements.
  const lines = cleanedText
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const sectionFunctional = /^#+\s*(functional requirements?|functional)$/i;
  const sectionNonFunctional = /^#+\s*(non[- ]functional requirements?|non[- ]functional)$/i;

  let currentType = reqType;
  let addedCount = 0;
  let lastError = '';

  for (const line of lines) {
    // Ignore section headings.
    if (sectionFunctional.test(line)) {
      currentType = 'Functional';
      continue;
    }

    if (sectionNonFunctional.test(line)) {
      currentType = 'Non-Functional';
      continue;
    }

    // Remove bullets / numbering from pasted requirements.
    const requirementText = line
      .replace(/^[-•*]\s*/, '')
      .replace(/^\d+[\.)]\s*/, '')
      .trim();

    if (!requirementText) continue;

    const result = await addRequirement(requirementText, currentType);

    if (result?.success) {
      addedCount++;
    } else if (result?.error) {
      lastError = result.error;
    }
  }

  if (addedCount > 0) {
    setReqInput('');

    if (lastError) {
      setReqError(
        `${addedCount} requirement(s) added. ${lastError}`
      );
    }
  } else {
    setReqError(
      lastError || 'No valid requirements were found in the pasted text.'
    );
  }
};

  // AI suggestion handlers (same logic as before, extracted from inline onClick)
  const handleAskRequirementSuggestions = async () => {
    setReqError('');
    setAiSuggestionMessage('');
    if (!data.name.trim() && !data.description.trim()) {
      setReqError('Please provide a project name or description in Step 1 to generate relevant AI suggestions.');
      return;
    }
    setLoadingAI(true);
    try {
      const suggested = await aiService.generateRequirements(data.name, data.type, data.description, data.requirements);
      if (suggested.length > 0) {
        setData({ ...data, requirements: [...data.requirements, ...suggested] });
        setAiSuggestionMessage(`Gemini AI added ${suggested.length} new requirements based on your project details.`);
      } else {
        setAiSuggestionMessage('Gemini AI found no additional unique requirements for this project.');
      }
    } catch (error) {
      setAiSuggestionMessage(`AI suggestions failed: ${error?.message || 'Please check your API key and internet connection.'}`);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleAskFeatureSuggestions = async () => {
    setAiSuggestionMessage('');
    setLoadingAI(true);
    try {
      const newAiFeatures = await aiService.generateFeatures(data.name, data.type, data.description, data.features);
      if (newAiFeatures.length > 0) {
        setData({ ...data, features: [...data.features, ...newAiFeatures] });
        setAiSuggestionMessage(`Gemini AI added ${newAiFeatures.length} new features based on your project details.`);
      } else {
        setAiSuggestionMessage('Gemini AI found no additional unique features for this project.');
      }
    } catch (error) {
      setAiSuggestionMessage(`AI suggestions failed: ${error?.message || 'Please check your API key and internet connection.'}`);
    } finally {
      setLoadingAI(false);
    }
  };

  const stepTitles = ['Project Idea', 'Project Needs', 'Features', 'Budget & Plan', 'Project Check'];
  const complexityChip = (c) => c === 'Critical' ? 'red' : c === 'High' ? 'amber' : c === 'Low' ? 'green' : 'blue';

  return (
    <div className="max-w-4xl mx-auto ea-stack">
      <PageHeading title="New Project Estimate" subtitle="Answer a few questions and get a complete cost, risk and feasibility analysis." />

      {/* Progress */}
      <Card>
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="ea-eyebrow">Step 0{step} of 05</span>
          <span className="text-[13px] font-extrabold ea-ink">{stepTitles[step - 1]}</span>
        </div>
        <div className="ea-progress"><div style={{ width: `${(step / 5) * 100}%` }} /></div>
        <div className="hidden sm:grid grid-cols-5 gap-2 mt-3">
          {stepTitles.map((t, i) => (
            <span key={t} className="text-[11px] font-bold text-center" style={{ color: i + 1 <= step ? 'var(--ea-primary)' : 'var(--ea-muted)' }}>{t}</span>
          ))}
        </div>
      </Card>

      <Card style={{ padding: '28px 30px' }}>
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-[20px] font-extrabold">Step 1: Project Idea &amp; Vision</h3>
              <p className="ea-card-sub">Tell us what you want to build.</p>
            </div>
            <div>
              <label className="ea-label">Project Name *</label>
              <input
                type="text"
                value={data.name}
                onChange={e => { setData({ ...data, name: e.target.value }); setStep1Error && setStep1Error(''); }}
                placeholder="e.g., AI Fleet Tracking Portal"
                className={`ea-input ${step1Error ? 'invalid' : ''}`}
              />
            </div>
            <div>
              <label className="ea-label">Project Description *</label>
              <textarea
                rows="4"
                value={data.description}
                onChange={e => { setData({ ...data, description: e.target.value }); setStep1Error && setStep1Error(''); }}
                placeholder="Describe key problems solved and primary goals..."
                className={`ea-input ${step1Error ? 'invalid' : ''}`}
                style={{ resize: 'vertical' }}
              ></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="ea-label">Project Type</label>
                <select value={data.type} onChange={e => setData({ ...data, type: e.target.value })} className="ea-input">
                  <option value="SaaS Platform">SaaS Platform</option>
                  <option value="Web Application">Web Application</option>
                  <option value="Mobile App">Mobile App</option>
                  <option value="Web + Mobile Application">Web + Mobile Application</option>
                  <option value="Desktop Application">Desktop Application</option>
                  <option value="E-Commerce">E-Commerce</option>
                  <option value="AI/ML Platform">AI/ML Platform</option>
                  <option value="Data Analytics / Business Intelligence">Data Analytics / Business Intelligence</option>
                  <option value="API / Backend Service">API / Backend Service</option>
                  <option value="Cybersecurity Application">Cybersecurity Application</option>
                  <option value="IoT / Smart Device System">IoT / Smart Device System</option>
                  <option value="Game">Game</option>
                  <option value="Blockchain / Web3">Blockchain / Web3</option>
                  <option value="AR/VR Application">AR/VR Application</option>
                  <option value="Automation / Workflow Tool">Automation / Workflow Tool</option>
                  <option value="Education / E-Learning">Education / E-Learning</option>
                  <option value="Healthcare Application">Healthcare Application</option>
                  <option value="Finance / FinTech Application">Finance / FinTech Application</option>
                  <option value="Logistics / Fleet Management">Logistics / Fleet Management</option>
                  <option value="Other / Custom Project">Other / Custom Project</option>
                </select>
              </div>
              <div>
                <label className="ea-label">Business Model</label>
                <select value={data.businessModel} onChange={e => setData({ ...data, businessModel: e.target.value })} className="ea-input">
                  <option>Subscription</option>
                  <option>Freemium</option>
                  <option>Usage-based</option>
                </select>
              </div>
            </div>

            {step1Error && (
              <div className="ea-alert error"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{step1Error}</span></div>
            )}

            <div className="pt-2 flex justify-end">
              <button onClick={onNext} className="ea-btn ea-btn-primary">Next: Project Needs <ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-[20px] font-extrabold">Step 2: Project Needs</h3>
                <p className="ea-card-sub">Separates user specs from AI suggestions and evaluates quality.</p>
              </div>
              <button onClick={handleAskRequirementSuggestions} disabled={loadingAI} className="ea-btn ea-btn-primary">
                <Sparkles className="w-4 h-4" /> {loadingAI ? 'Generating...' : 'Ask AI Suggestions'}
              </button>
            </div>

            {aiSuggestionMessage && step === 2 && <div className="ea-alert info"><Sparkles className="w-4 h-4 shrink-0 mt-0.5" /><span>{aiSuggestionMessage}</span></div>}

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-start">
                <textarea
                  value={reqInput}
                  onChange={e => { setReqInput(e.target.value); setReqError(''); }}
                  placeholder="Add a requirement, or paste multiple functional/non-functional requirements here..."
                  rows={4}
                  className={`ea-input ${reqError ? 'invalid' : ''}`}
                  style={{ resize: 'vertical' }}
                />
                <select value={reqType} onChange={e => setReqType(e.target.value)} className="ea-input" style={{ minWidth: 150 }}>
                  <option>Functional</option>
                  <option>Non-Functional</option>
                </select>
                <button onClick={handleAddRequirement} className="ea-btn ea-btn-primary" style={{ height: 46 }}><Plus className="w-4 h-4" /> Add</button>
              </div>
              {reqError && <div className="ea-alert error"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{reqError}</span></div>}
            </div>

            <div className="space-y-2.5 pt-1">
              {data.requirements.length === 0 && <div className="ea-panel text-center ea-muted" style={{ padding: 22 }}>No requirements yet. Add your own or ask AI for suggestions.</div>}
              {data.requirements.map(r => (
                <div key={r.id} className="ea-row flex items-start justify-between gap-3 text-[13px]">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className={`ea-chip ${r.type === 'Functional' ? 'blue' : ''}`}>{r.type}</span>
                    <span className="ea-ink font-semibold">{r.text}</span>
                    <span className="ea-chip gray">{r.source}</span>
                    {r.ambiguous && <span className="ea-chip amber">Ambiguous text</span>}
                    {r.duplicate && <span className="ea-chip red">Duplicate detected</span>}
                  </div>
                  <button onClick={() => removeRequirement(r.id)} className="ea-btn-icon danger shrink-0" title="Remove"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-between">
              <button onClick={onPrev} className="ea-btn ea-btn-outline">Back</button>
              <button onClick={onNext} className="ea-btn ea-btn-primary">Next: Features <ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-[20px] font-extrabold">Step 3: Features &amp; Complexity</h3>
                <p className="ea-card-sub">Feature complexity directly updates cost, timeline &amp; effort.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={handleAskFeatureSuggestions} disabled={loadingAI} className="ea-btn ea-btn-primary ea-btn-sm">
                  <Sparkles className="w-3.5 h-3.5" /> {loadingAI ? 'Generating...' : 'Ask AI Suggestions'}
                </button>
                <button onClick={openCustomFeatureModal} className="ea-btn ea-btn-soft ea-btn-sm">
                  <PlusCircle className="w-3.5 h-3.5" /> + Custom Feature
                </button>
              </div>
            </div>

            {aiSuggestionMessage && step === 3 && <div className="ea-alert info"><Sparkles className="w-4 h-4 shrink-0 mt-0.5" /><span>{aiSuggestionMessage}</span></div>}

            <div className="space-y-3">
              {data.features.length === 0 && <div className="ea-panel text-center ea-muted" style={{ padding: 22 }}>No features yet. Add a custom feature or ask AI for suggestions.</div>}
              {data.features.map(f => (
                <div key={f.id} className="ea-row">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <h4 className="text-[14px] font-extrabold">{f.name}</h4>
                      <span className={`ea-chip ${complexityChip(f.complexity)}`}>{f.complexity} Complexity</span>
                      <span className="ea-chip gray">{f.source}</span>
                    </div>
                    <button onClick={() => removeFeature(f.id)} className="ea-btn-icon danger shrink-0" title="Remove"><X className="w-4 h-4" /></button>
                  </div>
                  <p className="text-[12.5px] ea-muted mt-1.5 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-between">
              <button onClick={onPrev} className="ea-btn ea-btn-outline">Back</button>
              <button onClick={onNext} className="ea-btn ea-btn-primary">Next: Budget &amp; Plan <ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-7">
            <div>
              <h3 className="text-[20px] font-extrabold">Step 4: Budget &amp; Business Plan</h3>
              <p className="ea-card-sub">
                Enter your budget, development costs, pricing and expected business expenses. All financial values are in Indian Rupees (₹).
              </p>
            </div>

            <div>
              <h4 className="text-[14px] font-extrabold mb-3 flex items-center gap-2"><span className="ea-icon-box" style={{ width: 28, height: 28, borderRadius: 8 }}><Users className="w-4 h-4" /></span> Project Budget &amp; Team</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <NumberField data={data} setData={setData} label="Available Project Budget (₹)" field="budget" min="0" placeholder="e.g. 1500000" hint="Maximum amount you are prepared to spend on the project." />
                <NumberField data={data} setData={setData} label="Target Timeline (Months)" field="targetTimeline" min="1" step="0.5" placeholder="e.g. 6" hint="Your planned time to launch the project." />
                <NumberField data={data} setData={setData} label="Development Team Size" field="teamSize" min="1" step="1" placeholder="e.g. 5" hint="Number of developers working on the project." />
                <NumberField data={data} setData={setData} label="Developer Monthly Cost (₹ / developer)" field="devMonthlyRate" min="0" placeholder="e.g. 80000" hint="Average monthly cost for one developer." />
              </div>
            </div>

            <div>
              <h4 className="text-[14px] font-extrabold mb-3 flex items-center gap-2"><span className="ea-icon-box" style={{ width: 28, height: 28, borderRadius: 8 }}><TrendingUp className="w-4 h-4" /></span> Revenue &amp; Customers</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <NumberField data={data} setData={setData} label="Expected Customers" field="expectedCustomers" min="0" placeholder="e.g. 10000" hint="Expected number of paying customers." />
                <NumberField data={data} setData={setData} label="Average Customer Revenue / Month (₹)" field="productPrice" min="0" placeholder="e.g. 199" hint="Average amount earned from one customer each month." />
              </div>
            </div>

            <div>
              <h4 className="text-[14px] font-extrabold mb-3 flex items-center gap-2"><span className="ea-icon-box" style={{ width: 28, height: 28, borderRadius: 8 }}><Server className="w-4 h-4" /></span> Monthly Operating Costs</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <NumberField data={data} setData={setData} label="Cloud Cost / Month (₹)" field="cloudBudget" min="0" placeholder="e.g. 40000" />
                <NumberField data={data} setData={setData} label="API / Services Cost / Month (₹)" field="apiBudget" min="0" placeholder="e.g. 10000" />
                <NumberField data={data} setData={setData} label="Marketing Cost / Month (₹)" field="marketingBudget" min="0" placeholder="e.g. 30000" />
              </div>
            </div>

            <div className="ea-alert info" style={{ alignItems: 'center', padding: '14px 16px' }}>
              <span className="text-[20px] font-black leading-none">₹</span>
              <div>
                <p className="font-extrabold text-[13px]">Currency: Indian Rupee (INR)</p>
                <p className="text-[12px] font-semibold mt-0.5" style={{ opacity: 0.85 }}>All project costs, revenue, salaries, cloud costs and business calculations will be calculated in Indian Rupees.</p>
              </div>
            </div>

            <div className="pt-1 flex justify-between">
              <button onClick={onPrev} className="ea-btn ea-btn-outline">Back</button>
              <button onClick={onRun} className="ea-btn ea-btn-primary"><Cpu className="w-4 h-4" /> Run Project Analysis</button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="text-center py-14 space-y-5">
            <span className="ea-icon-box mx-auto" style={{ width: 68, height: 68, borderRadius: 999 }}>
              <Cpu className="w-8 h-8 animate-spin" />
            </span>
            <h3 className="text-[24px] font-extrabold">Preparing Project Analysis</h3>
            <p className="text-[13px] ea-muted">Checking scope, project limits, risks, competitors, and expected returns...</p>
            <div className="ea-progress max-w-xs mx-auto"><div style={{ width: '100%' }} className="animate-pulse" /></div>
          </div>
        )}
      </Card>
    </div>
  );
}

// Module-level so inputs keep focus while typing (a component declared inside WizardView would remount on every keystroke).
function NumberField({ data, setData, label, hint, field, min, step, placeholder }) {
  return (
    <div>
      <label className="ea-label">{label}</label>
      <input
        type="number"
        min={min}
        step={step}
        value={data.assumptions[field]}
        onChange={e => setData({ ...data, assumptions: { ...data.assumptions, [field]: parseFloat(e.target.value) || (min === '1' ? 1 : 0) } })}
        placeholder={placeholder}
        className="ea-input"
      />
      {hint && <p className="ea-hint">{hint}</p>}
    </div>
  );
}

function ProjectAnalysisView({ project, simulator, setSimulator, navigateTo, onUpdateTech, page = 'overview', setPage, autoPrintReport = false, onAutoPrintHandled }) {
  if (!project) return null;

  const simAssumptions = {
    ...project.assumptions,
    devMonthlyRate: simulator.devRate,
    teamSize: simulator.devCount,
    expectedCustomers: simulator.customers,
    productPrice: simulator.price,
    cloudBudget: simulator.cloud,
    apiBudget: simulator.api,
    targetTimeline: simulator.timeline
  };

  const currentEstimates = estimationEngine.calculateEstimates(project.features || [], simAssumptions, project.techStack || []);
  // Cost explanation context — uses the same live values as the estimator
const costExplanationContext = {
  totalCost: currentEstimates.totalCost,
  lowerEstimate: currentEstimates.costRangeMin,
  upperEstimate: currentEstimates.costRangeMax,
  totalHours: currentEstimates.totalHours,
  timelineMonths: currentEstimates.timelineMonths,

  assumptions: {
    teamSize: simAssumptions.teamSize,
    monthlyDeveloperRate: simAssumptions.devMonthlyRate,
    targetTimeline: simAssumptions.targetTimeline,
    monthlyCloudBudget: simAssumptions.cloudBudget,
    monthlyApiBudget: simAssumptions.apiBudget,
    acceptedFeatures: (project.features || []).filter(
      feature => feature.accepted !== false
    ).map(feature => ({
      name: feature.name,
      complexity: feature.complexity || 'Medium',
      priority: feature.priority || 'Medium'
    }))
  },

  breakdown: {
    engineering: currentEstimates.breakdown.dev,
    personnel: currentEstimates.breakdown.personnel,
    cloud: currentEstimates.breakdown.cloud,
    apis: currentEstimates.breakdown.api,
    testing: currentEstimates.breakdown.qa,
    contingency: currentEstimates.breakdown.contingency
  },

  rangeMethod: {
    lowerMultiplier: 0.85,
    upperMultiplier: 1.22,
    explanation:
      'The current application applies fixed multipliers to the calculated total. These are planning bounds, not statistically validated confidence intervals.'
  }
};
  const currentProject = { ...project, assumptions: simAssumptions };
  const currentConstraints = constraintEngine.analyze(currentProject, currentEstimates);
  const currentRisks = riskEngine.analyze(currentProject, currentEstimates);
  const currentFeasibility = feasibilityEngine.calculate(currentProject, currentEstimates, currentConstraints, currentRisks);
  const liveFeatureEstimates = planningEngine.estimateFeatures(currentProject.features || [], currentProject.assumptions || {});
  const reportConstraints = currentConstraints.length > 0 ? currentConstraints : (project.aiAnalysis?.constraints || []);
  const reportRisks = currentRisks.length > 0 ? currentRisks : (project.aiAnalysis?.risks || []);
  const fallbackMarket = aiService.getFallbackMarketResearch(currentProject);
  const marketData = project.marketResearch?.source === 'Gemini AI Market Synthesis' ? project.marketResearch : fallbackMarket;
  const customerUsers = aiService.getCustomerUserSegments(currentProject);
  const displayTechStack = project.aiAnalysis?.source === 'Gemini AI' && (project.techStack || []).length > 0
    ? project.techStack
    : aiService.getFallbackTechStack(currentProject);
  const liveRoadmap = planningEngine.buildRoadmap(currentProject.features || [], currentProject.assumptions || {});
  const liveResourcePlan = planningEngine.buildResourcePlan(currentProject, currentEstimates);
  const liveScenarioComparison = planningEngine.compareScenarios(currentProject);
  const featureHoursTotal = liveFeatureEstimates.reduce((sum, item) => sum + (Number(item.hours) || 0), 0);

  const [printAll, setPrintAll] = useState(false);
  const [costExplanation, setCostExplanation] = useState('');
  const [costExplanationLoading, setCostExplanationLoading] = useState(false);
  const [costExplanationError, setCostExplanationError] = useState('');

  
const handleGenerateCostExplanation = async () => {
  const apiKey = aiService.getApiKey();


  setCostExplanationLoading(true);
  setCostExplanationError('');
  setCostExplanation('');

  try {
    
    
const promptText = `
You are the analytical reasoning engine of EstimateAI.
Your purpose is to discover and explain insights that are NOT already
obvious from the project's Overview, Cost Breakdown, Recommendations,
or other analysis sections.

Do not produce a standard project summary.

ESTIMATOR RULES YOU MUST USE:
- Accepted feature hours: Low = 30, Medium = 75, High = 150,
  Critical = 280. If no accepted feature hours are available,
  the estimator defaults to 200 hours.
- Engineering cost = (total hours / 160) * monthly developer rate.
  If team size exceeds 4, engineering cost is multiplied by 1.12.
- Personnel = 28% of engineering cost.
- Testing = 12% of engineering cost.
- Contingency = 10% of engineering cost.
- Cloud cost = monthly cloud budget * target timeline.
- API cost = monthly API budget * target timeline.
- Total = engineering + personnel + cloud + APIs + testing +
  contingency + accepted technology cost adjustments, subject to
  a minimum total of 10,000.
- Timeline = total hours / (team size * 120), rounded to one decimal.
- Lower and upper estimates use fixed multipliers of 0.85 and 1.22.
  They are not statistically validated confidence intervals.

YOUR TASK:

1. Identify the most important cost insight.
Do not merely name the largest category. Explain WHY it is large
using the formulas and inputs. If the available information cannot
establish a reason beyond the formula, state that distinction.

2. Explain cost relationships.
Explain how engineering cost affects personnel, testing and contingency
because all three are calculated from engineering cost.
Explain how the timeline affects cloud and API spending.
Describe any important dependency that is not obvious from the totals.

3. Find a meaningful trade-off.
Identify one assumption that deserves attention and explain its
potential effect using the actual formulas.
Do not invent a new total or pretend you ran a simulation.
If the direction or magnitude cannot be established from the supplied
data, explain what would need to be recalculated.

4. Evaluate the estimate's limitations.
Identify which figures are formula-derived and which are user inputs.
Explain why fixed percentage-based costs and planning bounds do not
prove real-world accuracy.
Do not invent an accuracy score or statistical confidence.

5. Give one actionable validation step.
Suggest a specific piece of evidence the project team should collect
to validate a cost assumption, such as actual engineering hours,
actual cloud bills, or historical estimate-versus-actual costs.
Explain which part of the estimate that evidence would help validate.

STRICT OUTPUT RULES:
- Do NOT repeat the project feature list.
- Do NOT reproduce the existing analysis page's headings or generic
  recommendations.
- Do NOT list every cost value again unless a value is necessary
  to support a new insight.
- Do NOT claim you performed scenario testing or recalculation.
- Do NOT invent figures, formulas, data, market rates, or accuracy.
- Focus on causal relationships, dependencies, trade-offs, and
  limitations, not a description of the dashboard.
- Use at most 5 concise sections.
- Every section must contain an insight and explain WHY it matters.
- If there is insufficient evidence for a conclusion, say so honestly.

LIVE ESTIMATION CONTEXT:
${JSON.stringify(costExplanationContext, null, 2)}
`;



      const response = await fetch(
        
        '/api/gemini',

        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1400
            }
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message || `Gemini request failed (${response.status}).`
        );
      }

      const explanation =
        data.candidates?.[0]?.content?.parts
          ?.map(part => part.text || '')
          .join('')
          .trim();

      if (!explanation) {
        throw new Error('The AI returned an empty explanation. Please try again.');
      }

      setCostExplanation(explanation);
    } catch (error) {
      setCostExplanationError(
        error instanceof Error
          ? error.message
          : 'Could not generate the cost explanation. Please try again.'
      );
    } finally {
      setCostExplanationLoading(false);
    }
  };

   
  const handlePrintFullReport = () => {
    setPrintAll(true);
    setTimeout(() => window.print(), 120);
  };

  useEffect(() => {
    if (!printAll) return undefined;
    const handleAfterPrint = () => setPrintAll(false);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [printAll]);

  useEffect(() => {
    if (!autoPrintReport) return undefined;
    setPrintAll(true);
    const timer = setTimeout(() => window.print(), 450);
    if (onAutoPrintHandled) onAutoPrintHandled();
    return () => clearTimeout(timer);
  }, [autoPrintReport, onAutoPrintHandled]);

  // ---- Chart styling (data and values unchanged; only the look is redesigned) ----
  const tickColor = '#8a87a8';
  const gridColor = 'rgba(123, 78, 240, 0.10)';

  const costChartData = {
    labels: ['Engineering', 'Personnel', 'Cloud/Hosting', 'APIs/Services', 'QA/Testing', 'Contingency'],
    datasets: [{
      label: 'Estimated Cost (₹)',
      data: [
        currentEstimates.breakdown.dev,
        currentEstimates.breakdown.personnel,
        currentEstimates.breakdown.cloud,
        currentEstimates.breakdown.api,
        currentEstimates.breakdown.qa,
        currentEstimates.breakdown.contingency
      ],
      backgroundColor: (context) => {
        const { chart } = context;
        const { ctx, chartArea } = chart;
        if (!chartArea) return '#7b4ef0';
        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        gradient.addColorStop(0, 'rgba(123, 78, 240, 0.25)');
        gradient.addColorStop(1, 'rgba(123, 78, 240, 0.95)');
        return gradient;
      },
      hoverBackgroundColor: '#6a3ee0',
      borderRadius: 10,
      borderSkipped: false,
      maxBarThickness: 48
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: Math.max(1, window.devicePixelRatio || 1),
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#1b1646',
        bodyColor: '#4a4868',
        borderColor: '#ebe7fb',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 10,
        displayColors: false,
        bodyFont: { size: 11 },
        titleFont: { size: 11, weight: '700' },
        callbacks: { label: (ctx) => formatINR(ctx.parsed.y) }
      }
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10 }, color: tickColor, maxRotation: 0, minRotation: 0 } },
      y: { grid: { color: gridColor }, border: { display: false }, ticks: { font: { size: 10 }, color: tickColor, callback: value => formatINR(value) } }
    }
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: Math.max(1, window.devicePixelRatio || 1),
    animation: false,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        min: 0, max: 100,
        ticks: { font: { size: 9 }, stepSize: 20, color: tickColor, backdropColor: 'transparent' },
        grid: { color: gridColor },
        angleLines: { color: gridColor },
        pointLabels: { font: { size: 11, weight: '700' }, color: tickColor }
      }
    }
  };

  const radarData = {
    labels: ['Technical', 'Financial', 'Resource', 'Timeline', 'Market'],
    datasets: [{
      label: 'Project Score',
      data: [
        currentFeasibility.subScores.technical,
        currentFeasibility.subScores.financial,
        currentFeasibility.subScores.resource,
        currentFeasibility.subScores.timeline,
        currentFeasibility.subScores.market
      ],
      backgroundColor: 'rgba(123, 78, 240, 0.18)',
      borderColor: '#7b4ef0',
      borderWidth: 2,
      pointBackgroundColor: '#7b4ef0',
      pointBorderColor: '#ffffff'
    }]
  };

  const show = (pg) => printAll || page === pg;
  const ratingChip = currentFeasibility.overallScore >= 80 ? 'green' : currentFeasibility.overallScore >= 65 ? 'amber' : 'red';
  const severityChip = (s) => (s === 'Critical' || s === 'High') ? 'red' : s === 'Low' ? 'green' : 'amber';
  const confidenceChip = (c) => c === 'Strong' ? 'green' : c === 'Possible' ? 'amber' : 'red';
  const requirementMap = project.requirementFeatureMap || planningEngine.mapRequirementsToFeatures(project.requirements || [], project.features || []);
  const depAnalysis = project.dependencyAnalysis || planningEngine.dependencyAnalysis(project.features || []);

  return (
    <div className="analysis-report ea-stack">
      <style>{`
        .analysis-print-header { display: none; }
        @media print {
          .analysis-toolbar, .analysis-tabs, .analysis-screen-actions { display: none !important; }
          .analysis-print-header { display: block !important; }
          .analysis-section { break-before: page; page-break-before: always; }
          .analysis-section.analysis-first-print-section { break-before: auto; page-break-before: auto; }
          .analysis-report { background: #fff !important; color: #0f172a !important; }
          .analysis-report button { display: none !important; }
        }
      `}</style>

      <div className="analysis-print-header" style={{ borderBottom: '2px solid #e5e1f7', paddingBottom: 18, marginBottom: 20 }}>
        <div className="ea-eyebrow">EstimateAI Full Project Analysis</div>
        <h1 className="text-3xl font-black mt-1">{project.name}</h1>
        <p className="text-sm ea-muted mt-1">{project.description}</p>
        <div className="text-xs ea-muted mt-3">Complete report: cost, feasibility, scope, delivery, market, recommendations, limits, risks and scenarios.</div>
      </div>

      {/* Workspace header */}
      <Card className="analysis-toolbar">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 ea-eyebrow flex-wrap">
              <span>{project.type} Project</span><span style={{ opacity: 0.5 }}>•</span><span>Analysis Workspace</span>
            </div>
            <h1 className="text-[26px] sm:text-[30px] font-black mt-1.5 leading-tight">{project.name}</h1>
            <p className="text-[13px] ea-muted mt-1.5 max-w-3xl leading-relaxed">{project.description}</p>
          </div>
          <div className="analysis-screen-actions flex items-center gap-5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="ea-score-ring" style={{ '--v': Math.max(0, Math.min(100, currentFeasibility.overallScore)) }}>
                <span>{currentFeasibility.overallScore}</span>
                <small>/ 100</small>
              </div>
              <div>
                <div className="text-[11px] font-bold ea-muted uppercase tracking-wider">Project Score</div>
                <span className={`ea-chip ${ratingChip} mt-1`}>{currentFeasibility.rating}</span>
              </div>
            </div>
            <button onClick={handlePrintFullReport} className="ea-btn ea-btn-primary"><Download className="w-4 h-4" /> Download Full Report</button>
          </div>
        </div>
      </Card>

      {/* Page tabs */}
      <div className="analysis-tabs ea-tabs" role="tablist">
        {ANALYSIS_PAGES.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} role="tab" aria-selected={page === tab.id} onClick={() => setPage && setPage(tab.id)} className={`ea-tab ${page === tab.id ? 'active' : ''}`} title={tab.description}>
              <Icon className="w-4 h-4 shrink-0" /><span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= PAGE 1 · OVERVIEW ================= */}
      {show('overview') && (
        <div className="analysis-section analysis-first-print-section ea-stack">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
            <MetricCard title="Total Estimated Cost" value={formatINR(currentEstimates.totalCost)} icon={DollarSign} sub={`Range: ${formatINR(currentEstimates.costRangeMin)} - ${formatINR(currentEstimates.costRangeMax)}`} />
            <MetricCard title="Est. Duration" value={formatMonths(currentEstimates.timelineMonths)} icon={Clock} sub={`${currentEstimates.totalHours} Dev Hours • ${currentProject.assumptions.teamSize} developer(s)`} />
            <MetricCard title="Net Monthly Profit" value={formatINR(currentEstimates.financials.netMonthlyProfit)} icon={TrendingUp} sub={`Margin: ${currentEstimates.financials.profitMargin}% • Revenue ${formatINR(currentEstimates.financials.monthlyRevenue)}`} />
            <MetricCard title="Cost Recovery Time" value={formatRecoveryTime(currentEstimates.financials.breakEvenMonths)} icon={CheckCircle} sub={`ROI: ${currentEstimates.financials.roiPercentage}% • Based on current pricing and operating costs`} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 items-stretch">
            <Card className="xl:col-span-3 space-y-5">
              <CardHeader
                icon={Target}
                title="Project Score & Cost Recovery"
                subtitle="How the calculated numbers translate into an overall rating."
                right={<span className={`ea-chip ${ratingChip}`}>{currentFeasibility.rating}</span>}
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="ea-panel"><span className="ea-panel-label">Calculated Cost</span><strong>{formatINR(currentEstimates.totalCost)}</strong></div>
                <div className="ea-panel"><span className="ea-panel-label">Available Budget</span><strong>{formatINR(currentProject.assumptions.budget)}</strong></div>
                <div className="ea-panel"><span className="ea-panel-label">Monthly Profit</span><strong>{formatINR(currentEstimates.financials.netMonthlyProfit)}</strong></div>
                <div className="ea-panel"><span className="ea-panel-label">Recovery</span><strong>{formatRecoveryTime(currentEstimates.financials.breakEvenMonths)}</strong></div>
              </div>
              <div className="space-y-2.5 text-[12.5px]">
                <p className="flex items-start gap-2.5"><Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--ea-green)' }} /> Technical score: {currentFeasibility.subScores.technical}/100 from this project's feature complexity and requirement quality.</p>
                <p className="flex items-start gap-2.5"><Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--ea-green)' }} /> Financial score: {currentFeasibility.subScores.financial}/100 from the calculated cost, budget, profit and recovery time.</p>
                <p className="flex items-start gap-2.5"><Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--ea-green)' }} /> Timeline score: {currentFeasibility.subScores.timeline}/100 from {formatMonths(currentEstimates.timelineMonths)} estimated delivery versus the {formatMonths(currentProject.assumptions.targetTimeline)} target.</p>
                <p className="flex items-start gap-2.5"><Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--ea-green)' }} /> Market score: {currentFeasibility.subScores.market}/100 from the project's expected customers, pricing and calculated revenue.</p>
              </div>
              <div className="ea-panel" style={{ background: 'var(--ea-soft-2)', padding: 16 }}>
                <div className="flex items-center gap-2 ea-eyebrow"><Sparkles className="w-4 h-4" /> AI Project Recommendation</div>
                <p className="font-extrabold text-[14px] ea-ink mt-1.5">{project.aiAnalysis?.recommendation?.label || currentFeasibility.rating}</p>
                <p className="text-[12.5px] mt-1 leading-relaxed">{project.aiAnalysis?.recommendation?.explanation || `This recommendation is linked to the calculated score, ${currentConstraints.length} current project limit(s), and ${currentRisks.length} current risk(s).`}</p>
                {project.aiAnalysis?.summary && <p className="text-[12.5px] mt-3 pt-3 leading-relaxed" style={{ borderTop: '1px solid var(--ea-line)' }}><span className="font-extrabold ea-ink">AI project summary:</span> {project.aiAnalysis.summary}</p>}
              </div>
            </Card>

            <Card className="xl:col-span-2 flex flex-col">
              <CardHeader icon={Target} title="Project Score Breakdown" subtitle="How technical, financial, timeline and market factors contribute to the score." />
              <div className="flex-1 flex items-center justify-center" style={{ minHeight: 300 }}>
                <div style={{ width: '100%', height: 300 }}><Radar data={radarData} options={radarOptions} /></div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ================= PAGE 2 · COST & SIMULATOR ================= */}
      {show('cost') && (
        <div className="analysis-section ea-stack">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-stretch">
            <Card>
              <CardHeader
                icon={BarChart3}
                title="Cost Breakdown by Category"
                subtitle="The chart updates instantly as you change the scenario controls."
                right={<span className="ea-chip">Live</span>}
              />
              <div style={{ height: 340 }}><Bar data={costChartData} options={chartOptions} /></div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="ea-panel"><span className="ea-panel-label">Total Estimated Cost</span><strong className="text-[15px]">{formatINR(currentEstimates.totalCost)}</strong></div>
                <div className="ea-panel"><span className="ea-panel-label">Expected Range</span><strong className="text-[13px]">{formatINR(currentEstimates.costRangeMin)} - {formatINR(currentEstimates.costRangeMax)}</strong></div>
              </div>
            </Card>

            <Card>
              <CardHeader
                icon={Sliders}
                title="What-If Simulator"
                subtitle="Change a slider and watch the estimate and chart update immediately."
                right={<span className="ea-chip">Live</span>}
              />
              <div className="space-y-4">
                <SimSlider label="Developer Monthly Cost" display={formatINR(simulator.devRate)} min="40000" max="300000" step="5000" value={simulator.devRate} onChange={v => setSimulator({ ...simulator, devRate: v })} />
                <SimSlider label="Development Team Size" display={simulator.devCount} min="1" max="10" step="1" value={simulator.devCount} onChange={v => setSimulator({ ...simulator, devCount: v })} />
                <SimSlider label="Expected Customers / Year" display={simulator.customers} min="100" max="100000" step="100" value={simulator.customers} onChange={v => setSimulator({ ...simulator, customers: v })} />
                <SimSlider label="Monthly Customer Price" display={formatINR(simulator.price)} min="49" max="5000" step="50" value={simulator.price} onChange={v => setSimulator({ ...simulator, price: v })} />
                <SimSlider label="Monthly Cloud Cost" display={formatINR(simulator.cloud)} min="5000" max="100000" step="5000" value={simulator.cloud} onChange={v => setSimulator({ ...simulator, cloud: v })} />
                <SimSlider label="Monthly API Cost" display={formatINR(simulator.api)} min="0" max="50000" step="2500" value={simulator.api} onChange={v => setSimulator({ ...simulator, api: v })} />
                <SimSlider label="Target Timeline" display={formatMonths(simulator.timeline)} min="1" max="24" step="1" value={simulator.timeline} onChange={v => setSimulator({ ...simulator, timeline: v })} />
              </div>

              <div className="ea-panel mt-5" style={{ background: 'var(--ea-soft-2)', padding: 16 }}>
                <div className="ea-eyebrow">Live Estimate</div>
                <div className="text-[26px] font-black ea-ink mt-1 leading-tight">{formatINR(currentEstimates.totalCost)}</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-3">
                  <div><span className="ea-panel-label">Monthly Revenue</span><span className="font-extrabold" style={{ color: 'var(--ea-green)' }}>{formatINR(currentEstimates.financials.monthlyRevenue)}</span></div>
                  <div><span className="ea-panel-label">Net Monthly Profit</span><span className="font-extrabold ea-ink">{formatINR(currentEstimates.financials.netMonthlyProfit)}</span></div>
                  <div><span className="ea-panel-label">Recovery Time</span><span className="font-extrabold ea-primary-text">{formatRecoveryTime(currentEstimates.financials.breakEvenMonths)}</span></div>
                  <div><span className="ea-panel-label">Estimated Timeline</span><span className="font-extrabold ea-ink">{formatMonths(currentEstimates.timelineMonths)}</span></div>
                </div>
              </div>
            </Card>
          </div>

          
          <Card>
            <CardHeader
              icon={Sparkles}
              title="AI Cost Reasoning"
              subtitle="Understand why this estimate was produced, which assumptions influence it, and where uncertainty remains."
              right={<span className="ea-chip">AI-powered</span>}
            />

            <div className="ea-panel mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="ea-panel-label">Calculated total</span>
                  <div className="font-extrabold ea-ink mt-1">
                    {formatINR(currentEstimates.totalCost)}
                  </div>
                </div>

                <div>
                  <span className="ea-panel-label">Team size</span>
                  <div className="font-extrabold ea-ink mt-1">
                    {simAssumptions.teamSize} developers
                  </div>
                </div>

                <div>
                  <span className="ea-panel-label">Developer monthly rate</span>
                  <div className="font-extrabold ea-ink mt-1">
                    {formatINR(simAssumptions.devMonthlyRate)}
                  </div>
                </div>

                <div>
                  <span className="ea-panel-label">Estimated duration</span>
                  <div className="font-extrabold ea-ink mt-1">
                    {formatMonths(currentEstimates.timelineMonths)}
                  </div>
                </div>
              </div>
            </div>

            
            <button
              type="button"
              onClick={handleGenerateCostExplanation}
              disabled={costExplanationLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '12px 20px',
                borderRadius: 10,
                background: costExplanationLoading ? '#9b83ed' : '#7547f5',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 700,
                border: '1px solid #7547f5',
                boxShadow: '0 4px 12px rgba(117, 71, 245, 0.25)',
                cursor: costExplanationLoading ? 'wait' : 'pointer',
                transition: 'background 0.2s ease, transform 0.2s ease'
              }}
            >
              <Sparkles size={17} />
              {costExplanationLoading
                ? 'Analysing cost assumptions...'
                : costExplanation
                  ? 'Regenerate AI explanation'
                  : 'Explain this estimate with AI'}
            </button>


            {costExplanationError && (
              <div className="ea-panel mt-4" role="alert">
                <p className="text-sm">{costExplanationError}</p>
              </div>
            )}

            {costExplanationLoading && (
              <p className="ea-hint mt-3">
                Reviewing the current estimate, cost breakdown and assumptions...
              </p>
            )}

            {costExplanation && (
              <div
                className="ea-panel mt-4"
                style={{ padding: 18 }}
              >
                <div className="flex items-center gap-2 ea-eyebrow mb-3">
                  <Sparkles className="w-4 h-4" />
                  Explanation based on the current estimate
                </div>

                
                <div
                  className="text-sm leading-7"
                  style={{ overflowWrap: 'anywhere' }}
                >
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <h2 className="text-lg font-bold mt-5 mb-3">{children}</h2>
                      ),
                      h2: ({ children }) => (
                        <h3 className="text-base font-bold mt-5 mb-2">{children}</h3>
                      ),
                      h3: ({ children }) => (
                        <h4 className="font-bold mt-4 mb-2">{children}</h4>
                      ),
                      p: ({ children }) => (
                        <p className="mb-3 leading-7">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-5 mb-4 space-y-2">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-5 mb-4 space-y-2">{children}</ol>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-bold">{children}</strong>
                      )
                    }}
                  >
                    {costExplanation}
                  </ReactMarkdown>
                </div>


                <p className="ea-hint mt-4 pt-3"
                  style={{ borderTop: '1px solid var(--ea-line)' }}
                >
                  This is an AI-generated interpretation of the supplied
                  calculation, not independent proof that the estimate is accurate.
                </p>
              </div>
            )}
          </Card>


          <Card>
            <CardHeader
              icon={Calculator}
              title="Per-Feature Estimation"
              subtitle="The total estimate is explainable at feature level. Feature hours are included inside the project's total effort, not added on top."
            />
            <div className="ea-panel flex flex-wrap items-center justify-between gap-3 mb-3">
              <span>Feature effort <b>{featureHoursTotal}h</b> · Project estimate <b>{currentEstimates.totalHours}h</b></span>
              <span className={`ea-chip ${featureHoursTotal === currentEstimates.totalHours ? 'green' : 'amber'}`}>{featureHoursTotal === currentEstimates.totalHours ? 'Reconciled' : 'Includes baseline effort'}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="ea-table">
                <thead><tr><th>Feature</th><th>Complexity</th><th>Hours</th><th>Estimated Cost</th></tr></thead>
                <tbody>
                  {liveFeatureEstimates.map((f, i) => (
                    <tr key={i}>
                      <td className="strong">{f.featureName}</td>
                      <td><span className={`ea-chip ${f.complexity === 'Critical' ? 'red' : f.complexity === 'High' ? 'amber' : f.complexity === 'Low' ? 'green' : 'blue'}`}>{f.complexity}</span></td>
                      <td>{f.hours}</td>
                      <td className="strong">{formatINR(f.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ================= PAGE 3 · SCOPE & DELIVERY ================= */}
      {show('scope') && (
        <div className="analysis-section ea-stack">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
            <Card className="xl:col-span-3">
              <CardHeader icon={ListChecks} title="Requirement → Feature Traceability" subtitle="Every requirement is mapped to the closest selected feature so scope gaps are visible before development." />
              <div className="space-y-2.5 overflow-auto pr-1" style={{ maxHeight: 420 }}>
                {requirementMap.map((m, i) => (
                  <div key={i} className="ea-row text-[12.5px]">
                    <div className="font-bold ea-ink">{m.requirement}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="ea-muted font-semibold">→ {m.feature}</span>
                      <span className={`ea-chip ${confidenceChip(m.confidence)}`}>{m.confidence} match</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader icon={Layers} title="Dependency Analysis" subtitle="Shows which features depend on other features and flags unresolved dependencies." />
              <div className="space-y-2.5 text-[12.5px]">
                {depAnalysis.edges.map((e, i) => <div key={i} className="ea-panel">{e.from} <span className="font-extrabold ea-primary-text">depends on</span> {e.to}</div>)}
                {depAnalysis.unresolved.map((e, i) => <div key={'u' + i} className="ea-alert error">Unresolved: {e.feature} → {e.dependency}</div>)}
                {(depAnalysis.edges.length === 0 && depAnalysis.unresolved.length === 0) && <div className="ea-alert success">No explicit feature dependencies were found.</div>}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader icon={Clock} title="Development Roadmap & Milestones" subtitle="A practical sequence is generated from the same total development hours used by the estimate, then divided by the selected team capacity. The phase durations below add up exactly to the roadmap total." />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              {liveRoadmap.phases.map((phase, i) => (
                <div key={i} className="ea-row" style={{ borderTop: '3px solid var(--ea-primary)', borderRadius: 14 }}>
                  <div className="ea-eyebrow">Phase {i + 1}</div>
                  <div className="font-extrabold text-[14px] ea-ink mt-1 leading-snug">{phase.name}</div>
                  <div className="mt-1.5"><span className="ea-chip">{phase.weeks} weeks</span></div>
                  <ul className="mt-3 text-[12px] ea-muted list-disc pl-4 space-y-1">{phase.items.slice(0, 4).map((item, j) => <li key={j}>{item}</li>)}</ul>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader icon={Users} title="Resource Allocation" subtitle="Estimated effort is distributed across roles so team capacity is visible. These role hours are portions of the same total estimate — they are NOT added on top of the project timeline." />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="ea-panel"><span className="ea-panel-label">Total estimated effort</span><b className="text-[15px]">{currentEstimates.totalHours}h</b></div>
              <div className="ea-panel"><span className="ea-panel-label">Calendar delivery</span><b className="text-[15px]">{formatMonths(currentEstimates.timelineMonths)}</b></div>
              <div className="ea-panel"><span className="ea-panel-label">Team capacity</span><b className="text-[15px]">{Math.max(1, Number(currentProject.assumptions?.teamSize) || 1)} developer(s)</b></div>
            </div>
            <div className="ea-alert info mt-4" style={{ fontWeight: 600 }}>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3"><span><b>Total estimated effort</b> — these role hours are portions of the project estimate, not extra hours.</span><b>{currentEstimates.totalHours}h</b></div>
                <div className="mt-1" style={{ opacity: 0.85 }}>Role allocation reconciles to {liveResourcePlan.totalHours}h, so it cannot silently exceed the project's calculated effort.</div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
              {liveResourcePlan.roles.map((r, i) => (
                <div key={i} className="ea-row flex items-center justify-between gap-3 text-[12.5px]">
                  <div className="min-w-0"><div className="font-extrabold ea-ink">{r.role}</div><div className="ea-muted mt-0.5">{r.reason}</div></div>
                  <span className="ea-chip shrink-0" style={{ fontSize: 12 }}>{r.hours}h</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ================= PAGE 4 · MARKET & TECHNOLOGY ================= */}
      {show('market') && (
        <div className="analysis-section ea-stack">
          <Card>
            <CardHeader
              icon={Globe}
              title="Existing Solutions & Customer Preferences"
              subtitle="The analysis is tied to this project type: existing solutions, where they are strong, where the proposed project can differ, and what customers in this category usually value."
              right={<span className="ea-chip shrink-0">{marketData.source || 'EstimateAI Context Engine'}</span>}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-[12.5px]">
              <div>
                <h4 className="text-[13px] font-extrabold mb-2.5">Existing Solutions</h4>
                <div className="space-y-2.5">
                  {(marketData.competitors || []).slice(0, 5).map((c, i) => (
                    <div key={i} className="ea-row">
                      <b className="ea-ink">{c.name}</b>
                      <div className="ea-muted mt-1">{c.whyRelevant || c.features || ''}</div>
                      {c.strengths && <div className="mt-1.5" style={{ color: 'var(--ea-green)' }}><span className="font-extrabold">Strong at:</span> {c.strengths}</div>}
                      {c.weaknesses && <div className="mt-1" style={{ color: 'var(--ea-red)' }}><span className="font-extrabold">Potential difference:</span> {c.weaknesses}</div>}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[13px] font-extrabold mb-2.5">Where This Project Can Differ</h4>
                <ul className="ea-muted list-disc pl-4 space-y-2 leading-relaxed">{(marketData.marketGaps || []).slice(0, 6).map((x, i) => <li key={i}>{x}</li>)}</ul>
              </div>
              <div>
                <h4 className="text-[13px] font-extrabold mb-2.5">Who are the users?</h4>
                <div className="space-y-2.5">
                  <div className="ea-row">
                    <div className="flex items-center justify-between gap-2"><b className="ea-ink">Primary users</b><span className="ea-chip blue">{customerUsers.primarySource}</span></div>
                    <div className="ea-muted mt-1.5">{customerUsers.primary}</div>
                  </div>
                  <div className="ea-row">
                    <div className="flex items-center justify-between gap-2"><b className="ea-ink">Secondary users</b><span className="ea-chip amber">{customerUsers.secondarySource}</span></div>
                    <div className="ea-muted mt-1.5">{customerUsers.secondary}</div>
                  </div>
                </div>
                <div className="mt-2.5 text-[11px] ea-muted">{customerUsers.source}</div>
              </div>
            </div>

            <div className="ea-panel mt-5" style={{ padding: 16 }}>
              <b className="ea-ink">What customers usually prefer in this project category:</b>
              <div className="mt-3 flex flex-wrap gap-2">
                {(marketData.customerPreferences || []).slice(0, 6).map((item, i) => (
                  <span key={i} className="ea-chip" style={{ padding: '6px 14px', fontSize: 12.5, background: 'var(--ea-card)', border: '1px solid var(--ea-line)', color: 'var(--ea-ink)' }}>{item}</span>
                ))}
              </div>
            </div>
            <div className="ea-panel mt-3" style={{ background: 'var(--ea-soft-2)', padding: 16 }}><b className="ea-ink">Differentiation:</b> {marketData.differentiation || project.competitors?.differentiation}</div>
            {marketData.researchCaveat && <div className="mt-3 text-[11.5px] ea-muted">Research note: {marketData.researchCaveat}</div>}
          </Card>

          <Card>
            <CardHeader icon={Server} title="Recommended Technology" subtitle="Choose which recommendations to include in the estimate; accepted changes update cost and score." />
            <div className="space-y-3">
              {(displayTechStack || []).map((t, idx) => (
                <div key={idx} className="ea-row flex flex-col md:flex-row md:items-center justify-between gap-4 text-[12.5px]">
                  <div className="min-w-0">
                    <span className="ea-eyebrow" style={{ color: 'var(--ea-muted)' }}>{t.category}</span>
                    <h4 className="font-extrabold text-[14px] mt-0.5">{t.recommended} <span className="ea-muted font-semibold">(vs {t.current})</span></h4>
                    <p className="ea-muted mt-1 leading-relaxed"><span className="font-extrabold ea-ink">Why it fits this project:</span> {t.reason}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-extrabold" style={{ color: t.costDiff < 0 ? 'var(--ea-green)' : 'var(--ea-muted)' }}>
                      {t.costDiff < 0 ? `-${formatINR(Math.abs(t.costDiff))} budget savings` : 'No Cost Change'}
                    </span>
                    <button onClick={() => onUpdateTech(idx, !t.accepted)} className={`ea-btn ea-btn-sm ${t.accepted ? 'ea-btn-primary' : 'ea-btn-outline'}`}>
                      {t.accepted ? <><Check className="w-3.5 h-3.5" /> Selected</> : 'Use This'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ================= PAGE 5 · LIMITS & RISKS ================= */}
      {show('risks') && (
        <div className="analysis-section ea-stack">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
            <Card>
              <CardHeader icon={ShieldAlert} title="Project Limits" subtitle="Rule-based limits detected from your budget, timeline and team assumptions." />
              <div className="space-y-3">
                {reportConstraints.length > 0 ? reportConstraints.map((c, i) => (
                  <div key={i} className="ea-row text-[12.5px] space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-extrabold ea-ink">{c.constraint}</span>
                      <span className={`ea-chip ${severityChip(c.severity)}`}>{c.severity}</span>
                    </div>
                    <p className="ea-muted leading-relaxed">{c.currentValue && c.expectedValue ? `${c.currentValue} vs expected ${c.expectedValue}. ` : ''}{c.impact}</p>
                    <div className="font-bold pt-1" style={{ color: 'var(--ea-primary)' }}>Solution: {c.solution}</div>
                  </div>
                )) : (
                  <div className="ea-alert success" style={{ display: 'block', padding: 16 }}>
                    <p className="font-extrabold">No hard project limit detected under the current assumptions.</p>
                    <p className="mt-1" style={{ fontWeight: 600 }}>The calculated cost, team capacity and target timeline currently fit the rule-based limits. This does not mean there is zero risk; review the Technical Risks section.</p>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader icon={AlertTriangle} title="Technical Risks" subtitle="Risks identified from scope, cost, timeline and dependencies." />
              <div className="space-y-3">
                {(reportRisks.length > 0 ? reportRisks : [{ risk: 'No additional technical risk triggered', probability: 'Low', impact: 'The current project inputs do not trigger one of the configured high-priority risk rules.', mitigation: 'Keep the scope controlled and re-run the analysis whenever features, team size, budget or pricing change.' }]).map((r, i) => (
                  <div key={i} className="ea-row text-[12.5px] space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-extrabold ea-ink">{r.risk}</span>
                      <span className="ea-chip gray">Prob: {r.probability}</span>
                    </div>
                    <p className="ea-muted leading-relaxed">{r.impact}</p>
                    <div className="font-bold pt-1" style={{ color: 'var(--ea-primary)' }}>How to Reduce Risk: {r.mitigation}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader icon={BarChart3} title="Scenario Comparison" subtitle="These are decision scenarios, not separate projects: Current Plan keeps your scope, Lean MVP removes low-priority scope, and Accelerated Delivery adds team capacity. Cost and time are recalculated for each option." />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {liveScenarioComparison.map((s, i) => (
                <div key={i} className="ea-row" style={i === 0 ? { boxShadow: 'inset 0 0 0 2px var(--ea-primary)' } : undefined}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-extrabold text-[14px] ea-ink">{s.name}</span>
                    <span className="ea-chip shrink-0">Score {s.feasibility.overallScore}/100</span>
                  </div>
                  <p className="text-[12.5px] ea-muted mt-1.5 leading-relaxed">{s.note}</p>
                  <div className="grid grid-cols-1 gap-2 mt-3 text-[12.5px]">
                    <div className="flex justify-between"><span className="ea-muted">Cost</span><b className="ea-ink">{formatINR(s.estimates.totalCost)}</b></div>
                    <div className="flex justify-between"><span className="ea-muted">Time</span><b className="ea-ink">{formatMonths(s.estimates.timelineMonths)}</b></div>
                    <div className="flex justify-between gap-3"><span className="ea-muted">Recovery</span><b className="ea-ink text-right">{formatRecoveryTime(s.estimates.financials.breakEvenMonths)}</b></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// Range slider row for the What-If Simulator (module level so it never remounts mid-drag).
function SimSlider({ label, display, min, max, step, value, onChange }) {
  return (
    <div>
      <div className="flex justify-between gap-2 mb-2 text-[12.5px]">
        <label className="font-bold ea-ink">{label}</label>
        <span className="font-extrabold ea-primary-text">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} />
    </div>
  );
}

// ==========================================
// 10. MODAL UTILITIES
// ==========================================

function AuthModal({ onClose, user, setUser }) {
  return (
    <div className="ea-modal-backdrop">
      <div className="ea-modal text-center" style={{ maxWidth: 440, padding: '36px 32px' }}>
        <button onClick={onClose} className="ea-modal-close" aria-label="Close"><X className="w-4 h-4" /></button>

        <span className="ea-icon-box mx-auto" style={{ width: 60, height: 60, borderRadius: 18 }}>
          <ShieldCheck className="w-7 h-7" />
        </span>

        <h3 className="text-[24px] font-black mt-5">
          Welcome to <span className="ea-logo" style={{ fontSize: 'inherit' }}>EstimateAI</span>
        </h3>

        <p className="text-[13.5px] ea-muted mt-2 mb-7">
          Sign in to continue to your project workspace.
        </p>

        <button
          onClick={async () => {
            try {
              const result = await signInWithPopup(auth, googleProvider);
              const firebaseUser = result.user;

              const loggedInUser = {
                name: firebaseUser.displayName || 'Google User',
                email: firebaseUser.email || '',
                isLoggedIn: true,
                provider: 'Google'
              };

              authService.setUser(loggedInUser);
              setUser(loggedInUser);
              onClose();
            } catch (error) {
              console.error('Google sign-in error:', error);
              alert('Google sign-in failed. Please try again.');
            }
          }}
          className="ea-btn ea-btn-outline w-full"
          style={{ padding: '13px 16px', fontSize: 14 }}
        >
          <span className="text-[18px] font-black" style={{ color: 'var(--ea-primary)' }}>G</span>
          Continue with Google
        </button>

        <p className="text-[11.5px] ea-muted mt-5">
          Your account is securely authenticated with Google.
        </p>
      </div>
    </div>
  );
}

function ConfigModal({ onClose }) {
  const [apiKey, setApiKey] = useState(aiService.getApiKey());

  const handleSave = () => {
    aiService.setApiKey(apiKey);
    onClose();
  };

  return (
    <div className="ea-modal-backdrop">
      <div className="ea-modal space-y-5" style={{ maxWidth: 460 }}>
        <button onClick={onClose} className="ea-modal-close" aria-label="Close"><X className="w-4 h-4" /></button>
        <div className="flex items-center gap-3">
          <span className="ea-icon-box"><Settings className="w-[18px] h-[18px]" /></span>
          <h3 className="text-[19px] font-extrabold">AI Settings</h3>
        </div>
        <div>
          <label className="ea-label">Google Gemini API Key (Optional Override)</label>
          <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="AIzaSy..." className="ea-input" />
          <p className="ea-hint">If no API key is set, the app uses its built-in offline analysis.</p>
        </div>
        <button onClick={handleSave} className="ea-btn ea-btn-primary w-full" style={{ padding: '12px 18px' }}>Save Settings</button>
      </div>
    </div>
  );
}

function CustomFeatureModal({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [complexity, setComplexity] = useState('Medium');
  const [error, setError] = useState('');

  const validateFeatureText = (value, minLength) => {
    const clean = value.trim();
    const hasRepeatedChars = /(.)\1{3,}/.test(clean);
    const hasLetters = /[a-zA-Z]{2,}/.test(clean);
    const hasMeaningfulWord = clean.split(/\s+/).some(word => /[aeiouAEIOU]/.test(word) && word.length >= 2);
    return clean.length >= minLength && hasLetters && hasMeaningfulWord && !hasRepeatedChars;
  };

  return (
    <div className="ea-modal-backdrop">
      <div className="ea-modal" style={{ maxWidth: 560 }}>
        <button onClick={onClose} className="ea-modal-close" aria-label="Close"><X className="w-4 h-4" /></button>

        <div className="mb-6 flex items-start gap-3 pr-10">
          <span className="ea-icon-box"><PlusCircle className="w-[18px] h-[18px]" /></span>
          <div>
            <h3 className="text-[19px] font-extrabold">Add Custom Feature</h3>
            <p className="ea-card-sub">Add a project feature and choose how much development effort it requires.</p>
          </div>
        </div>

        <div className="space-y-5">
          {error && <div className="ea-alert error"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}

          <div>
            <label className="ea-label">Feature Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Restaurant Search and Discovery"
              className="ea-input"
            />
          </div>

          <div>
            <label className="ea-label">Description</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Describe what this feature should do."
              rows={4}
              className="ea-input"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div>
            <label className="ea-label">Complexity Level</label>
            <select value={complexity} onChange={e => setComplexity(e.target.value)} className="ea-input">
              <option value="Low">Low — Simple feature</option>
              <option value="Medium">Medium — Moderate effort</option>
              <option value="High">High — Significant effort</option>
              <option value="Critical">Critical — Very complex</option>
            </select>
            <p className="ea-hint">Higher complexity increases estimated development effort and project cost.</p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8">
          <button onClick={onClose} className="ea-btn ea-btn-outline">Cancel</button>
          <button
            onClick={() => {
              const cleanName = name.trim();
              const cleanDesc = desc.trim();
              if (!validateFeatureText(cleanName, 3)) {
                setError('Please enter a meaningful feature name. Gibberish or repeated characters are not accepted.');
                return;
              }
              if (!validateFeatureText(cleanDesc, 8)) {
                setError('Please enter a meaningful feature description so the estimate can understand what needs to be built.');
                return;
              }
              setError('');
              onAdd({
                name: cleanName,
                description: cleanDesc,
                complexity,
                priority: 'Medium'
              });
            }}
            className="ea-btn ea-btn-primary"
          >
            Add Feature &amp; Recalculate
          </button>
        </div>
      </div>
    </div>
  );
}
