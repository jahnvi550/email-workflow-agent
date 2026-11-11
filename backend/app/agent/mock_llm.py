"""
Intelligent Mock LLM Engine with Deterministic NLP & Heuristic Extraction.
Provides 100% operational functionality without requiring external API keys.
"""

import re
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional


class MockLLMEngine:
    @staticmethod
    def extract_dates_and_times(text: str) -> Dict[str, Any]:
        """Heuristic date extraction for ISO string resolution relative to now."""
        now = datetime.utcnow()
        text_lower = text.lower()
        extracted = {}
        
        # Tomorrow
        if "tomorrow" in text_lower:
            dt = now + timedelta(days=1)
            extracted["target_date"] = dt.strftime("%Y-%m-%d")
        elif "next week" in text_lower or "next monday" in text_lower:
            dt = now + timedelta(days=7)
            extracted["target_date"] = dt.strftime("%Y-%m-%d")
        elif "by friday" in text_lower:
            days_ahead = (4 - now.weekday() + 7) % 7
            if days_ahead == 0:
                days_ahead = 7
            dt = now + timedelta(days=days_ahead)
            extracted["target_date"] = dt.strftime("%Y-%m-%d")
        elif "eod" in text_lower or "end of day" in text_lower or "asap" in text_lower:
            dt = now + timedelta(hours=6)
            extracted["target_date"] = dt.strftime("%Y-%m-%d")
        else:
            # Look for month patterns (e.g. Oct 15, March 2nd)
            date_match = re.search(r'\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}\b', text_lower)
            if date_match:
                extracted["date_mention"] = date_match.group(0)
            dt = now + timedelta(days=2)
            extracted["target_date"] = dt.strftime("%Y-%m-%d")

        # Time extraction (e.g. 2:00 PM, 10 AM, 15:30)
        time_match = re.search(r'(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?', text)
        if time_match:
            extracted["time_mention"] = time_match.group(0)
            
        return extracted

    @classmethod
    def analyze_email(cls, sender: str, subject: str, body: str) -> Dict[str, Any]:
        """Perform comprehensive deterministic NLP extraction."""
        combined_text = f"{subject} {body}".lower()
        now = datetime.utcnow()
        
        # 1. Intent Classification
        if any(w in combined_text for w in ["outage", "p0", "down", "critical", "incident", "server crash", "urgent escalation"]):
            category = "Urgent Escalation"
            priority = "URGENT"
            confidence = 0.96
            risk_level = "HIGH"
            hitl_required = True
        elif any(w in combined_text for w in ["meeting", "sync", "schedule", "call", "calendar", "invite", "zoom", "meet", "discuss"]):
            category = "Meeting Request"
            priority = "HIGH" if "urgent" in combined_text else "MEDIUM"
            confidence = 0.94
            risk_level = "LOW"
            hitl_required = False
        elif any(w in combined_text for w in ["bug", "defect", "error", "traceback", "reproduce", "hotfix", "patch"]):
            category = "Bug Report"
            priority = "HIGH"
            confidence = 0.92
            risk_level = "MEDIUM"
            hitl_required = True
        elif any(w in combined_text for w in ["contract", "sow", "nda", "legal", "clause", "agreement", "sign", "terms"]):
            category = "Contract Review"
            priority = "HIGH"
            confidence = 0.95
            risk_level = "HIGH"
            hitl_required = True
        elif any(w in combined_text for w in ["thesis", "defense", "committee", "academic", "syllabus", "assignment", "exam", "grade"]):
            category = "Academic Request"
            priority = "HIGH" if "defense" in combined_text or "deadline" in combined_text else "MEDIUM"
            confidence = 0.93
            risk_level = "MEDIUM"
            hitl_required = True
        elif any(w in combined_text for w in ["interview", "candidate", "resume", "hiring", "applicant", "round"]):
            category = "Interview Coordination"
            priority = "MEDIUM"
            confidence = 0.91
            risk_level = "LOW"
            hitl_required = False
        elif any(w in combined_text for w in ["invoice", "payment", "billing", "budget", "cost", "finops", "aws", "charge"]):
            category = "Billing/FinOps"
            priority = "HIGH"
            confidence = 0.93
            risk_level = "HIGH"
            hitl_required = True
        elif any(w in combined_text for w in ["newsletter", "digest", "weekly update", "no-reply", "unsubscribe", "announcement"]):
            category = "General Inquiry"
            priority = "LOW"
            confidence = 0.88
            risk_level = "LOW"
            hitl_required = False
        else:
            category = "Task Assignment"
            priority = "MEDIUM"
            confidence = 0.85
            risk_level = "LOW"
            hitl_required = False

        # 2. Extract tasks with concrete subtasks, estimated effort, and priority reasoning
        tasks = []
        tags = [category.replace(" ", "-")]

        # Look for explicit numbered list in email body (e.g. "1. Roll back...", "2. Verify...")
        numbered_items = re.findall(r'(?:^|\n)\s*(?:\d+[\.\)]|[-*•])\s+([^\n]+)', body)
        
        # Priority Reason
        if priority == "URGENT":
            priority_reason = "Critical outage or tight SLA (<2h) requiring immediate engineering intervention."
        elif priority == "HIGH":
            priority_reason = "High business priority deliverable, legal review, or scheduled milestone (<48h)."
        elif priority == "MEDIUM":
            priority_reason = "Standard operational request or scheduled coordination."
        else:
            priority_reason = "Low-urgency informational notification or newsletter."

        if numbered_items and len(numbered_items) >= 2:
            # Generate exact individual tasks from the bulleted/numbered items
            for idx, item in enumerate(numbered_items[:4]):
                clean_item = item.strip()
                t_priority = "URGENT" if idx == 0 and priority == "URGENT" else priority
                t_hours = "1h" if "quick" in clean_item.lower() or "verify" in clean_item.lower() else ("2h" if "review" in clean_item.lower() else "1.5h")
                
                # Build contextual subtasks for this item
                subtasks = [
                    {"id": f"s-{idx}-1", "title": f"Review specifications for {clean_item[:30]}", "completed": False},
                    {"id": f"s-{idx}-2", "title": f"Execute action items: {clean_item[:35]}", "completed": False},
                    {"id": f"s-{idx}-3", "title": "Validate outcome and log completion", "completed": False}
                ]
                
                # Estimated deadline for this item
                item_deadline = (now + timedelta(hours=2 * (idx + 1) if priority == "URGENT" else 12 * (idx + 1))).strftime("%Y-%m-%dT%H:%M:%S")

                tasks.append({
                    "title": clean_item[:60] if len(clean_item) <= 60 else clean_item[:57] + "...",
                    "description": f"Extracted from email by {sender}:\n{clean_item}\n\nContext:\n{body[:150]}",
                    "deadline": item_deadline,
                    "priority": t_priority,
                    "priority_reason": f"Action item #{idx+1} from {category} email.",
                    "estimated_hours": t_hours,
                    "assignee": "DevOps / On-Call Lead" if priority == "URGENT" else ("Legal & Compliance" if category == "Contract Review" else "AI Agent"),
                    "subtasks": subtasks,
                    "tags": tags + [f"Action-{idx+1}"]
                })
        else:
            if category == "Urgent Escalation":
                tasks.append({
                    "title": f"Investigate Incident: {subject[:45]}",
                    "description": f"Root cause analysis and mitigation for incident reported by {sender}. Details:\n{body[:250]}",
                    "deadline": (now + timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%S"),
                    "priority": "URGENT",
                    "priority_reason": "P0 Critical Incident: active service disruption requires immediate triage.",
                    "estimated_hours": "1.5h",
                    "subtasks": [
                        {"id": "1", "title": "Inspect live server logs and metrics in telemetry dashboard", "completed": False},
                        {"id": "2", "title": "Roll back recent deployment or apply hotfix patch", "completed": False},
                        {"id": "3", "title": "Verify cluster health and traffic routing recovery", "completed": False}
                    ],
                    "assignee": "DevOps / On-Call Lead",
                    "tags": ["P0-Incident", "DevOps", "Production"]
                })
                tasks.append({
                    "title": "Post-Mortem & Incident Status Update",
                    "description": f"Draft customer status update report and post-mortem review for {sender}.",
                    "deadline": (now + timedelta(hours=6)).strftime("%Y-%m-%dT%H:%M:%S"),
                    "priority": "HIGH",
                    "priority_reason": "Incident communication & transparency SLA requirement.",
                    "estimated_hours": "1h",
                    "subtasks": [
                        {"id": "1", "title": "Summarize timeline of events and root cause", "completed": False},
                        {"id": "2", "title": "Draft executive status update email", "completed": False}
                    ],
                    "assignee": "Engineering Manager",
                    "tags": ["Post-Mortem", "Communication"]
                })
            elif category == "Meeting Request":
                tasks.append({
                    "title": f"Prep Agenda for: {subject[:45]}",
                    "description": f"Review background documents and prepare key talking points for meeting with {sender}.",
                    "deadline": (now + timedelta(days=1, hours=4)).strftime("%Y-%m-%dT%H:%M:%S"),
                    "priority": "MEDIUM",
                    "priority_reason": "Pre-meeting preparation ensures effective discussion.",
                    "estimated_hours": "45m",
                    "subtasks": [
                        {"id": "1", "title": "Review relevant project metrics and roadmaps", "completed": False},
                        {"id": "2", "title": "Draft meeting talking points & agenda outline", "completed": False}
                    ],
                    "assignee": "AI Assistant / Host",
                    "tags": ["Meeting-Prep", "Agenda"]
                })
            elif category == "Contract Review":
                tasks.append({
                    "title": f"Legal Review: {subject[:45]}",
                    "description": f"Perform comprehensive redline and terms audit for SOW/contract submitted by {sender}.",
                    "deadline": (now + timedelta(days=2)).strftime("%Y-%m-%dT%H:%M:%S"),
                    "priority": "HIGH",
                    "priority_reason": "Legal contract review milestone required prior to signature.",
                    "estimated_hours": "3h",
                    "subtasks": [
                        {"id": "1", "title": "Review indemnification clauses and liability caps", "completed": False},
                        {"id": "2", "title": "Verify data processing addendum (DPA) compliance", "completed": False},
                        {"id": "3", "title": "Send redlined document back to counsel", "completed": False}
                    ],
                    "assignee": "Legal & Compliance",
                    "tags": ["Legal", "Compliance", "SOW"]
                })
            elif category == "Bug Report":
                tasks.append({
                    "title": f"Triage Bug: {subject[:45]}",
                    "description": f"Reproduce reported error, create regression test, and submit PR fix for {sender}.",
                    "deadline": (now + timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%S"),
                    "priority": "HIGH",
                    "priority_reason": "Defect report impacting user workflow requires reproduction & patch.",
                    "estimated_hours": "2h",
                    "subtasks": [
                        {"id": "1", "title": "Reproduce issue in staging environment", "completed": False},
                        {"id": "2", "title": "Write automated regression test case", "completed": False},
                        {"id": "3", "title": "Submit PR and request code review", "completed": False}
                    ],
                    "assignee": "Frontend/Backend Dev",
                    "tags": ["Bug", "QA", "Hotfix"]
                })
            elif category == "Academic Request":
                tasks.append({
                    "title": f"Academic Review: {subject[:45]}",
                    "description": f"Process academic milestone request from {sender}.",
                    "deadline": (now + timedelta(days=3)).strftime("%Y-%m-%dT%H:%M:%S"),
                    "priority": "HIGH",
                    "priority_reason": "Departmental evaluation committee milestone.",
                    "estimated_hours": "2.5h",
                    "subtasks": [
                        {"id": "1", "title": "Review project thesis report and chapter revisions", "completed": False},
                        {"id": "2", "title": "Prepare committee evaluation rubric", "completed": False}
                    ],
                    "assignee": "Faculty Advisor / Committee",
                    "tags": ["Academic", "Thesis", "Review"]
                })
            elif category == "Billing/FinOps":
                tasks.append({
                    "title": f"Audit Cloud Invoice / Spike: {subject[:45]}",
                    "description": f"Audit cloud utilization, analyze anomalous compute spending, and verify invoice line items.",
                    "deadline": (now + timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%S"),
                    "priority": "HIGH",
                    "priority_reason": "Financial audit prevents unexpected cloud overages.",
                    "estimated_hours": "1.5h",
                    "subtasks": [
                        {"id": "1", "title": "Cross-reference AWS/GCP bill with compute tags", "completed": False},
                        {"id": "2", "title": "Identify top 3 cost drivers and propose optimization", "completed": False}
                    ],
                    "assignee": "FinOps Lead",
                    "tags": ["FinOps", "Billing", "Audit"]
                })
            elif category == "Interview Coordination":
                tasks.append({
                    "title": f"Coordinate Candidate Interview: {subject[:45]}",
                    "description": f"Align interviewers, send candidate calendar invite, and attach coding assessment guidelines.",
                    "deadline": (now + timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%S"),
                    "priority": "MEDIUM",
                    "priority_reason": "Candidate hiring loop coordination.",
                    "estimated_hours": "30m",
                    "subtasks": [
                        {"id": "1", "title": "Confirm interviewer panel availability", "completed": False},
                        {"id": "2", "title": "Send calendar invite with Meet link", "completed": False}
                    ],
                    "assignee": "Talent Acquisition",
                    "tags": ["Hiring", "Interviews"]
                })
            else:
                tasks.append({
                    "title": f"Action Item: {subject[:45]}",
                    "description": f"Fulfill action items requested by {sender}:\n{body[:200]}",
                    "deadline": (now + timedelta(days=2)).strftime("%Y-%m-%dT%H:%M:%S"),
                    "priority": "MEDIUM",
                    "priority_reason": "General incoming task assignment.",
                    "estimated_hours": "1h",
                    "subtasks": [
                        {"id": "1", "title": "Review email context and requirements", "completed": False},
                        {"id": "2", "title": "Execute action item and reply to sender", "completed": False}
                    ],
                    "assignee": "Workflow Agent",
                    "tags": ["General", "Action-Item"]
                })

        # Proposed Meeting
        meeting = None
        if category in ["Meeting Request", "Academic Request", "Interview Coordination"] or "meet" in combined_text or "sync" in combined_text or "call" in combined_text:
            start_dt = now + timedelta(days=1, hours=10 - now.hour if now.hour < 10 else 2)
            meeting = {
                "title": f"Sync: {subject.replace('Re: ', '').replace('Fwd: ', '')[:40]}",
                "start_time": start_dt.strftime("%Y-%m-%dT%H:00:00"),
                "end_time": (start_dt + timedelta(minutes=45)).strftime("%Y-%m-%dT%H:45:00"),
                "attendees": [sender, "user@organization.com"],

                "is_required": True,
                "location": "Google Meet"
            }

        # Contextual Draft Reply
        sender_name = sender.split("@")[0].replace(".", " ").title()
        if category == "Urgent Escalation":
            reply_body = (
                f"Hi {sender_name},\n\n"
                f"Thank you for escalating this critical issue. Our engineering on-call response team has received this report and is actively investigating the incident.\n\n"
                f"A priority ticket has been created on our triage board, and we will share a real-time status update within the next 60 minutes.\n\n"
                f"Best regards,\nAutomated Workflow Response Agent"
            )
            reply_tone = "Urgent & Professional"
        elif category == "Meeting Request" or meeting is not None:
            time_str = meeting['start_time'].replace('T', ' at ') if meeting else "tomorrow"
            reply_body = (
                f"Hi {sender_name},\n\n"
                f"Thank you for reaching out. I would be pleased to meet and discuss this.\n\n"
                f"I have tentatively reserved a calendar slot for {time_str} UTC via Google Meet. Please let me know if this timing works on your end or if you would prefer an alternative window.\n\n"
                f"Best regards,\nAutomated Workflow Response Agent"
            )
            reply_tone = "Professional & Cordial"
        elif category == "Contract Review":
            reply_body = (
                f"Hi {sender_name},\n\n"
                f"Thank you for sharing the documentation for our review. I have logged this into our legal and compliance workflow pipeline.\n\n"
                f"Our team is reviewing the terms and redlines and will return comments by the designated milestone.\n\n"
                f"Best regards,\nAutomated Workflow Response Agent"
            )
            reply_tone = "Professional & Formal"
        elif category == "Bug Report":
            reply_body = (
                f"Hi {sender_name},\n\n"
                f"Thank you for reporting this issue. We have logged this bug in our sprint backlog with high priority.\n\n"
                f"Our development team will attempt reproduction and deploy a hotfix once verified.\n\n"
                f"Best regards,\nAutomated Workflow Response Agent"
            )
            reply_tone = "Technical & Concise"
        else:
            reply_body = (
                f"Hi {sender_name},\n\n"
                f"Thank you for your message regarding '{subject}'. I have acknowledged your email and created the relevant action items in our task management system.\n\n"
                f"We will follow up with you as soon as further updates are ready.\n\n"
                f"Best regards,\nAutomated Workflow Response Agent"
            )
            reply_tone = "Professional"

        draft_reply = {
            "recipient": sender,
            "subject": f"Re: {subject}",
            "body": reply_body,
            "tone": reply_tone
        }

        # Multi-Step Planned Actions
        planned_actions = []
        for t in tasks:
            planned_actions.append({
                "action_type": "CREATE_TASK",
                "target": "Kanban Board",
                "description": f"Create task: {t['title']}",
                "parameters": t
            })
        if meeting:
            planned_actions.append({
                "action_type": "SCHEDULE_CALENDAR",
                "target": "Calendar Service",
                "description": f"Reserve meeting slot: {meeting['title']}",
                "parameters": meeting
            })
        planned_actions.append({
            "action_type": "DRAFT_EMAIL_REPLY",
            "target": "Email Dispatcher",
            "description": f"Prepare response to {sender}",
            "parameters": draft_reply
        })
        if priority in ["URGENT", "HIGH"]:
            planned_actions.append({
                "action_type": "SEND_URGENT_NOTIFICATION",
                "target": "Notification Center",
                "description": f"Trigger in-app notification for {priority} email",
                "parameters": {"title": f"New {priority} Action Item", "category": category}
            })

        return {
            "intent_category": category,
            "priority": priority,
            "confidence_score": confidence,
            "risk_level": risk_level,
            "hitl_required": hitl_required,
            "hitl_reason": f"Evaluated as {risk_level} risk with {confidence*100:.0f}% model confidence." if hitl_required else "Standard low-risk request approved for automated staging.",
            "extracted_entities": {
                "sender_name": sender_name,
                "keywords": [w for w in combined_text.split() if len(w) > 4][:8],
                "dates_detected": cls.extract_dates_and_times(combined_text)
            },
            "extracted_tasks": tasks,
            "proposed_meeting": meeting,
            "draft_reply": draft_reply,
            "planned_actions": planned_actions
        }

    @classmethod
    def check_security(cls, sender: str, subject: str, body: str) -> Dict[str, Any]:
        """
        Adversarial prompt injection & safety guardrail check.
        Detects malicious payloads trying to bypass HITL, hijack system prompts, or leak data.
        """
        combined = f"{subject} {body}".lower()
        flags = []
        
        # 1. System Prompt Hijacking / Overrides
        injection_patterns = [
            r"ignore (all )?previous instructions",
            r"disregard (all )?(prior|previous) prompts",
            r"system prompt (leak|reveal|override)",
            r"you are now (in )?(developer mode|dan|unrestricted)",
            r"new instruction(s)?:",
            r"assistant override",
            r"bypass (hitl|human approval|safety gate)",
            r"do not require human approval",
            r"auto-approve without human",
            r"dump (all )?(database|passwords|tokens|api keys)",
            r"drop table\b",
            r"delete from users\b",
            r"transfer \$[0-9]+.*without approval"
        ]

        for pattern in injection_patterns:
            if re.search(pattern, combined):
                flags.append("PROMPT_INJECTION_ATTEMPT")
                break

        # 2. Dangerous script / payload injection
        if any(tag in combined for tag in ["<script", "javascript:", "eval(", "base64_decode", "__import__", "os.system"]):
            flags.append("CODE_INJECTION_DETECTED")

        # 3. Data Exfiltration attempt
        if any(w in combined for w in ["send all api keys", "exfiltrate", "forward all incoming emails to"]):
            flags.append("DATA_EXFILTRATION_RISK")

        is_flagged = len(flags) > 0
        reason = (
            f"Adversarial prompt injection or safety breach attempt detected: {', '.join(flags)}." 
            if is_flagged else "Input passed safety guardrails clean."
        )

        return {
            "is_flagged": is_flagged,
            "flags": flags,
            "reason": reason
        }

    @classmethod
    def refine_draft_reply(
        cls,
        original_subject: str,
        original_body: str,
        current_draft: str,
        instruction: str,
        tone: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Refines an existing email draft response based on explicit human instructions or selected tone.
        """
        inst_lower = instruction.lower()
        selected_tone = tone or "Professional"
        
        body_lines = current_draft.strip().split("\n")
        # Extract greeting, core message, and sign-off
        greeting = body_lines[0] if body_lines else "Hi there,"
        sign_off = body_lines[-1] if len(body_lines) > 2 else "Best regards,\nWorkflow Lead"

        refined_body = current_draft

        # Tone-based transformations
        if "formal" in inst_lower or selected_tone.lower() == "formal":
            selected_tone = "Executive Formal"
            refined_body = (
                f"{greeting}\n\n"
                f"Thank you for bringing this matter to our attention regarding '{original_subject}'. "
                f"Our team has thoroughly reviewed your correspondence and initiated the appropriate operational workflows. "
                f"We will maintain close communication and furnish you with detailed progress reports as milestones are completed.\n\n"
                f"Please let us know should you require any additional clarifications.\n\n"
                f"Sincerely,\nOperations Leadership Team"
            )
        elif "concise" in inst_lower or "short" in inst_lower or selected_tone.lower() == "concise":
            selected_tone = "Ultra Concise"
            refined_body = (
                f"{greeting}\n\n"
                f"Received regarding '{original_subject}'. Action items are logged and actively in progress. Will update you once completed.\n\n"
                f"Thanks,\nLead"
            )
        elif "empathetic" in inst_lower or "apolog" in inst_lower or selected_tone.lower() == "empathetic":
            selected_tone = "Empathetic & Solution-Focused"
            refined_body = (
                f"{greeting}\n\n"
                f"Thank you for reaching out and sharing this with us. We sincerely apologize for any inconvenience caused regarding '{original_subject}'. "
                f"We understand how critical this is for you, and we have prioritized your request at the top of our queue.\n\n"
                f"Our senior engineering team is already actively investigating and we will personally follow up with a resolution shortly.\n\n"
                f"Warm regards,\nCustomer Success Team"
            )
        elif "urgent" in inst_lower or "direct" in inst_lower or selected_tone.lower() == "urgent":
            selected_tone = "Urgent & Direct"
            refined_body = (
                f"{greeting}\n\n"
                f"Acknowledging high-priority item '{original_subject}'. Priority tasks have been dispatched immediately to engineering and operations teams. "
                f"Next status check is scheduled within the hour.\n\n"
                f"Best,\nIncident Commander"
            )
        elif "calendar" in inst_lower or "schedule" in inst_lower or "meeting link" in inst_lower:
            refined_body = (
                f"{current_draft}\n\n"
                f"To streamline discussion, please feel free to grab a convenient 15-minute slot directly on our calendar: https://cal.com/enterprise-team/sync"
            )
        else:
            # Custom instruction incorporation
            refined_body = (
                f"{current_draft}\n\n"
                f"[Note: Updated per instruction '{instruction}']"
            )

        return {
            "subject": f"Re: {original_subject}",
            "body": refined_body,
            "tone": selected_tone,
            "refinement_applied": instruction
        }

