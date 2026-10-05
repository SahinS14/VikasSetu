/**
 * backend/src/rag/knowledgeBase.ts
 *
 * Plain in-memory knowledge base for Career Sahayak (cooperative-sector RAG).
 * No database, no embeddings. Each snippet covers one focused topic.
 *
 * To extend: add more KnowledgeSnippet objects to the KNOWLEDGE_BASE array.
 * To upgrade: replace retrieve.ts with an embedding-based retriever — this
 * file and the chatController are unaffected.
 */

export interface KnowledgeSnippet {
  id: string;
  topic: string;
  content: string;
}

export const KNOWLEDGE_BASE: KnowledgeSnippet[] = [
  {
    id: 'kb-001',
    topic: 'PMEGP scheme eligibility and loan amount',
    content:
      'PMEGP (Prime Minister\'s Employment Generation Programme) is a central government credit-linked subsidy scheme for non-farm micro enterprises. Any individual above 18 years with a minimum Class 8 pass certificate is eligible for projects costing up to ₹50 lakh in manufacturing and ₹20 lakh in service sectors. The subsidy ranges from 15–35% of the project cost depending on category and location; the beneficiary must contribute 5–10% as margin money.',
  },
  {
    id: 'kb-002',
    topic: 'PMEGP application process and nodal agencies',
    content:
      'PMEGP applications are submitted online through the KVIC portal (kviconline.gov.in). Nodal agencies implementing the scheme are KVIC at the national level, State Khadi & Village Industries Boards (KVIB), and District Industries Centres (DIC). After sanction, banks disburse the loan and the subsidy is credited directly to the borrower\'s account after a lock-in period of three years.',
  },
  {
    id: 'kb-003',
    topic: 'PM SVANidhi micro-loan for street vendors',
    content:
      'PM SVANidhi (PM Street Vendor\'s AtmaNirbhar Nidhi) offers collateral-free working capital loans of ₹10,000 (Tier-1), ₹20,000 (Tier-2), and ₹50,000 (Tier-3) to urban street vendors. Timely repayment earns a 7% annual interest subsidy credited directly to the beneficiary\'s bank account. Digital transactions are encouraged and earn cashback incentives through the SVANidhi se Samridhi program.',
  },
  {
    id: 'kb-004',
    topic: 'Mudra loan — Shishu Kishore Tarun categories',
    content:
      'Pradhan Mantri Mudra Yojana (PMMY) provides loans to non-corporate, non-farm small/micro enterprises through three tiers: Shishu (up to ₹50,000), Kishore (₹50,001–₹5 lakh), and Tarun (₹5 lakh–₹10 lakh). Loans are collateral-free and available from scheduled commercial banks, MFIs, and NBFCs. Mudra cards are issued for working capital limits, enabling cashless business transactions.',
  },
  {
    id: 'kb-005',
    topic: 'NCS portal — National Career Service registration and job search',
    content:
      'The National Career Service (NCS) portal (ncs.gov.in) is operated by the Ministry of Labour & Employment and provides free job matching, career counselling, and skill development services. Job seekers must register with Aadhaar-based KYC to access the full portal. Employers can post vacancies at no cost, and Employment Exchanges across India are integrated with the portal for government job notifications.',
  },
  {
    id: 'kb-006',
    topic: 'PACS Computerization — ERP operator and accountant roles',
    content:
      'Under the PACS Computerization Programme, Primary Agricultural Credit Societies are being migrated to a national common ERP developed by NABARD. Two key roles created by this initiative are the PACS ERP Operator (data entry, KCC loan processing, member management) and the PACS Accountant (balance sheet preparation, daily ledger reconciliation, AMCS integration). NCCT-certified candidates for these roles are preferred by District Cooperative Banks during recruitment drives.',
  },
  {
    id: 'kb-007',
    topic: 'KCC — Kisan Credit Card for cooperative bank staff',
    content:
      'Kisan Credit Card (KCC) loans are short-term crop loans processed through PACS and District Cooperative Banks. Staff handling KCC must verify land records, calculate drawable credit limits, and input data into the AMCS/ERP system. The KCC interest rate is 4% per annum for timely repayment (2% interest subvention + 3% prompt repayment incentive reduces the effective rate). The revolving credit limit is reassessed annually.',
  },
  {
    id: 'kb-008',
    topic: 'AMCS — Agricultural Management and Credit Software integration',
    content:
      'AMCS (Agricultural Management and Credit Software) is the legacy core-banking module used by many State Cooperative Banks. It handles member accounts, loan origination, interest calculation, and linkage to NABARD refinance. ERP operators trained under NCCT learn to migrate AMCS data to the new national PACS ERP, reconcile outstanding KCC balances, and generate MIS reports required by the Registrar of Cooperative Societies.',
  },
  {
    id: 'kb-009',
    topic: 'Cooperative sector careers — District Cooperative Bank clerk and officer',
    content:
      'District Cooperative Banks (DCBs) recruit Junior Clerks, Data Entry Operators, and Field Officers through state-level cooperative recruitment boards. Eligibility typically requires a graduate degree plus a cooperative banking diploma or NCCT certificate. Roles involve branch operations, loan sanction support, deposit mobilization, and rural camp outreach. Salaries range from ₹18,000–₹32,000 per month at entry level depending on the state.',
  },
  {
    id: 'kb-010',
    topic: 'NCCT certification — how it helps cooperative sector placement',
    content:
      'NCCT (National Centre for Cooperative Training) issues skill certificates recognized by NABARD, NCDC, and state cooperative departments. Certified trainees are listed on the NCCT National Registry, which cooperative employers access directly through the VikasSetu employer portal to source candidates. Completing the PACS ERP Operations or Rural Credit Management course significantly improves placement in PACS, DCBs, and cooperative housing societies.',
  },
];
