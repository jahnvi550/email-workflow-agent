"""
Rich Email Simulation Presets for Business, Academic, and Technical Workflows.
Includes user-requested scenarios and deterministic fixtures.
"""

from typing import List, Dict, Any

SIMULATION_PRESETS: List[Dict[str, Any]] = [
    {
        "id": "urgent-server-down",
        "title": "🚨 URGENT: Server Down - Production Fix Needed by 2 PM",
        "category": "Urgent Escalation",
        "priority": "URGENT",
        "sender": "marcus.vance@paymentcorp.io",
        "recipient": "devops-leads@organization.com",
        "subject": "URGENT: Server Down - Production Fix Needed by 2 PM",
        "body": """Team,

Our primary payment gateway and authentication clusters in US-East-1 are experiencing critical 502 bad gateway timeouts. Over 1,400 active customer transactions failed in the last 15 minutes.

Immediate Actions Required by 2:00 PM:
1. Roll back the v2.14.0 billing-service deployment immediately.
2. Verify Redis cluster connection pool limits and switch traffic to us-west-2 backup cluster.
3. Coordinate an emergency on-call bridge with DevOps, SRE, and Database Leads.
4. Notify affected enterprise clients with an incident status update.

Please acknowledge receipt and confirm when rollback starts.

Marcus Vance
Director of Reliability Engineering | PaymentCorp"""
    },
    {
        "id": "client-q3-strategy",
        "title": "📊 Client Q3 Strategy Review Meeting Request",
        "category": "Meeting Request",
        "priority": "HIGH",
        "sender": "eleanor.vance@sequoiapartners.vc",
        "recipient": "exec-team@organization.com",
        "subject": "Client Q3 Strategy Review Meeting Request",
        "body": """Hi Team,

Hope you are having a productive quarter. As we finalize our portfolio performance numbers, we would love to conduct our formal Client Q3 Strategy Review session.

Could we schedule a 45-minute sync tomorrow at 2:00 PM UTC via Google Meet?

Please ensure the following deliverables are ready prior to the meeting:
- Updated MRR, ARR, and net customer retention metrics spreadsheet
- The revised 18-month agentic product roadmap deck
- Headcount expansion plan for AI/ML engineering teams

Looking forward to our conversation.

Warm regards,
Eleanor Vance
General Partner | Sequoia Growth"""
    },
    {
        "id": "final-project-report",
        "title": "🎓 Submit Final Project Report by Friday 5 PM",
        "category": "Academic Request",
        "priority": "HIGH",
        "sender": "prof.alan.turing@cs.university.edu",
        "recipient": "candidate.alex@cs.university.edu",
        "subject": "Submit Final Project Report by Friday 5 PM",
        "body": """Dear Project Team,

The departmental examination committee has reviewed your intermediate thesis submission titled 'An LLM-Based Agent for Intelligent Email-to-Workflow Automation and Task Orchestration (Batch-05)'.

Please adhere to the following mandatory submission milestones:
1. Submit your final comprehensive project report and committee sign-off document by this Friday 5:00 PM.
2. The formal project defense and live software demonstration is scheduled for next Monday at 10:00 AM over Google Meet.
3. Ensure the benchmark latency comparisons for Groq vs OpenAI vs Smart Mock are fully updated in Chapter 4.

Please reply to confirm receipt and slide availability.

Sincerely,
Prof. Alan Turing
Chair, Graduate Studies in Computer Science & Engineering"""
    },
    {
        "id": "vendor-sow",
        "title": "⚖️ Enterprise SOW Negotiation & Legal Redline",
        "category": "Contract Review",
        "priority": "HIGH",
        "sender": "sarah.jenkins@lexingtonlegal.com",
        "recipient": "legal-ops@organization.com",
        "subject": "Statement of Work (SOW-2026-44B) - Cloud Infrastructure Services",
        "body": """Hello Team,

Attached is the updated Statement of Work (SOW-2026-44B) between Enterprise Systems Inc. and Apex Cloud Solutions.

Key items requiring your legal & security team's sign-off:
- Clause 14.2: Indemnification cap adjusted to $2,000,000.
- Clause 9.1: GDPR & CCPA Data Processing Addendum (DPA) annexes.
- Payment milestone schedule: Net 30 days upon quarterly deliverable acceptance.

Please review the redlines and have your authorized signatory execute the document by Wednesday EOD so we can commence on-boarding.

Best regards,
Sarah Jenkins, Esq.
Senior Counsel | Lexington Legal Group"""
    },
    {
        "id": "bug-triage",
        "title": "🐛 Frontend Bug: LangGraph State Sync & Memory Leak",
        "category": "Bug Report",
        "priority": "HIGH",
        "sender": "david.kim@qa-eng.tech",
        "recipient": "frontend-devs@organization.com",
        "subject": "Bug #8921: Canvas memory leak and StateGraph UI freeze on WebKit",
        "body": """Hi Dev Team,

During regression testing on build v2.4.1-rc3, QA discovered a critical memory leak when rendering complex LangGraph visual workflow nodes on Safari/WebKit engines.

Steps to Reproduce:
1. Open Workflow Pipeline inspector with more than 6 active state nodes.
2. Rapidly trigger Step execution simulation.
3. Observe browser RAM escalating from 120MB to >1.8GB before tab crash.

Expected: Smooth 60fps framerate with clean garbage collection on unmounted canvas elements.
Actual: DOM event listeners and WebSocket subscriptions are not dereferencing properly.

Please triage and release a patch before the Friday production rollout.

Thanks,
David Kim | QA Lead"""
    },
    {
        "id": "interview-loop",
        "title": "💼 Candidate Final Loop: Lead AI Engineer Technical Presentation",
        "category": "Interview Coordination",
        "priority": "MEDIUM",
        "sender": "recruiting@talent-accelerate.io",
        "recipient": "hiring-panel@organization.com",
        "subject": "Interview Coordination: Maya Lin (Lead AI Engineer Candidate)",
        "body": """Hi Panel,

Candidate Maya Lin has completed the technical take-home assessment with outstanding scores. We are now ready to schedule her final 60-minute technical presentation.

Candidate Availability:
- Tomorrow at 3:00 PM UTC
- Next Tuesday at 11:00 AM UTC

Agenda:
1. 20 min: System Architecture presentation on Distributed LangGraph Agents
2. 25 min: Live System Design & Failure-Tolerance Q&A
3. 15 min: Culture & Leadership conversation

Please confirm your preferred time slot so we can issue the calendar invitation and send Maya the Google Meet link.

Cheers,
Jessica Taylor | Tech Talent Partner"""
    },
    {
        "id": "finops-cost-spike",
        "title": "💰 FinOps Alert: 340% AWS Bedrock & Vector DB Cost Spike",
        "category": "Billing/FinOps",
        "priority": "HIGH",
        "sender": "aws-cost-monitor@cloudfinops.ai",
        "recipient": "finance-eng@organization.com",
        "subject": "ANOMALY DETECTED: Daily LLM Token Ingestion Exceeded Budget by $4,250",
        "body": """Automated Cost Anomaly Detected:

Service: Amazon Bedrock (Anthropic Claude 3.5 Sonnet / Llama 3) & Pinecone Vector Indexes
Timestamp: August 25, 2026 - 18:00 UTC
Observed Spend: $5,820.40 (Budget Threshold: $1,500.00 / day)
Root Driver: Uncapped recursive retry loops detected in background document embedding workers.

Recommended Remediations:
1. Cap batch worker concurrency to 10 parallel processes.
2. Implement semantic caching on redundant vector similarity queries.
3. Audit top 5 highest token-consuming tenant API keys.

Please initiate an internal FinOps review and acknowledge this alert.

Cloud FinOps Automation System"""
    },
    {
        "id": "product-feedback",
        "title": "💡 Enterprise Feature Request: Slack Real-Time HITL Alerts",
        "category": "Task Assignment",
        "priority": "MEDIUM",
        "sender": "rachel.adams@globalcorp.net",
        "recipient": "product-managers@organization.com",
        "subject": "Feature Request: Slack Real-Time Notifications for HITL Approval Queues",
        "body": """Hi Product Team,

Our organization has been using the Email-to-Workflow agent for 3 months with remarkable productivity gains.

One feature our executive team would love to see is native Slack & MS Teams webhook notifications whenever an email is routed to the 'Human Approval Gate'. Right now our managers need to keep the dashboard tab open.

Could you add this to the upcoming Q4 product roadmap? We'd be happy to participate in a beta testing program.

Best,
Rachel Adams
VP of Operations | GlobalCorp"""
    },
    {
        "id": "conference-keynote",
        "title": "🎤 Keynote Speaker Invitation: Global AI Summit 2026",
        "category": "Meeting Request",
        "priority": "MEDIUM",
        "sender": "organizers@agenticsummit.org",
        "recipient": "speaker-bureau@organization.com",
        "subject": "Invitation to Deliver Keynote: 'The Future of Agentic Email Automation'",
        "body": """Dear Speaker,

On behalf of the Steering Committee for the Global AI & Agentic Systems Summit 2026, we are thrilled to invite you as a Featured Keynote Speaker.

Event Details:
- Date: November 12-14, 2026
- Format: Hybrid (Main Stage in San Francisco + Global Live Broadcast)
- Session: 35-minute Keynote + 10-minute Audience Q&A

Please let us know if you can schedule a brief 20-minute prep call next Wednesday at 4:00 PM UTC to discuss the topic and travel arrangements.

Warm regards,
Dr. Maya Sterling
Program Chair | Agentic Systems 2026"""
    },
    {
        "id": "newsletter-digest",
        "title": "📰 Weekly Tech Digest: LangGraph 2.0 & LLM Orchestration",
        "category": "General Inquiry",
        "priority": "LOW",
        "sender": "editor@agenticweekly.dev",
        "recipient": "subscriber@organization.com",
        "subject": "Agentic Weekly #84: LangGraph 2.0, DeepSeek R1 Reasoning & Open-Source LLMs",
        "body": """Hey Builders!

Welcome to this week's edition of Agentic Weekly. Here are the top stories shaping AI engineering:

1. How LangGraph is changing stateful AI agent orchestration for enterprise backends.
2. Benchmarking Llama 3.3 70B vs GPT-4o for structured JSON extraction.
3. Implementing deterministic fallback layers for mission-critical reliability.

Read the full articles on our community hub. To manage email subscriptions, visit your profile preferences.

Happy Coding,
The Agentic Weekly Team"""
    }
]


class SimulatorService:
    @staticmethod
    def get_presets() -> List[Dict[str, Any]]:
        return SIMULATION_PRESETS

    @staticmethod
    def get_preset_by_id(preset_id: str) -> Dict[str, Any]:
        for p in SIMULATION_PRESETS:
            if p["id"] == preset_id:
                return p
        return SIMULATION_PRESETS[0]
