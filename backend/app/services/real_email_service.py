"""
Real Email / IMAP Ingestion Service.
Connects to live IMAP servers (Gmail, Outlook, Yahoo, Custom IMAP)
to fetch real incoming emails and ingest them into the LangGraph pipeline.
"""

import imaplib
import email
from email.header import decode_header
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.app.models.email import EmailMessage
from backend.app.models.user import User
from backend.app.services.workflow_service import WorkflowService


class RealEmailService:

    @staticmethod
    def _decode_str(header_val: Any) -> str:
        """Decodes MIME encoded email headers into clean unicode strings."""
        if not header_val:
            return ""
        decoded_fragments = decode_header(header_val)
        res = []
        for content, encoding in decoded_fragments:
            if isinstance(content, bytes):
                try:
                    res.append(content.decode(encoding or "utf-8", errors="replace"))
                except Exception:
                    res.append(content.decode("latin-1", errors="replace"))
            else:
                res.append(str(content))
        return "".join(res)

    @staticmethod
    def _extract_body(msg: email.message.Message) -> str:
        """Extracts plain text body from multipart or singlepart email message."""
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition"))
                if content_type == "text/plain" and "attachment" not in content_disposition:
                    payload = part.get_payload(decode=True)
                    if payload:
                        charset = part.get_content_charset() or "utf-8"
                        body += payload.decode(charset, errors="replace") + "\n"
                elif content_type == "text/html" and not body and "attachment" not in content_disposition:
                    # Fallback to stripped html if no text/plain found
                    payload = part.get_payload(decode=True)
                    if payload:
                        charset = part.get_content_charset() or "utf-8"
                        html_text = payload.decode(charset, errors="replace")
                        # Basic tag stripping
                        import re
                        body = re.sub(r"<[^>]+>", " ", html_text)
        else:
            payload = msg.get_payload(decode=True)
            if payload:
                charset = msg.get_content_charset() or "utf-8"
                body = payload.decode(charset, errors="replace")

        return body.strip()

    @classmethod
    def test_connection(
        cls,
        email_address: str,
        password: str,
        imap_server: str = "imap.gmail.com",
        imap_port: int = 993
    ) -> Dict[str, Any]:
        """Tests live IMAP credentials and returns connection status."""
        try:
            mail = imaplib.IMAP4_SSL(imap_server, imap_port)
            mail.login(email_address.strip(), password.strip())
            mail.select("INBOX")
            status, count_data = mail.search(None, "ALL")
            total_count = len(count_data[0].split()) if count_data and count_data[0] else 0
            mail.logout()
            return {
                "success": True,
                "message": f"Successfully connected to {imap_server}. Inbox contains {total_count} messages.",
                "total_messages": total_count
            }
        except imaplib.IMAP4.error as err:
            return {
                "success": False,
                "message": f"Authentication failed: {str(err)}. If using Gmail, make sure you use an 'App Password' (not standard password)."
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Connection error: {str(e)}"
            }

    @classmethod
    def fetch_and_ingest_live_emails(
        cls,
        db: Session,
        email_address: str,
        password: str,
        imap_server: str = "imap.gmail.com",
        imap_port: int = 993,
        limit: int = 5,
        only_unread: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Fetches latest messages from the live IMAP mailbox and creates
        EmailMessage database records, then triggers the LangGraph agent for each.
        """
        ingested_records = []

        try:
            mail = imaplib.IMAP4_SSL(imap_server, imap_port)
            mail.login(email_address.strip(), password.strip())
            mail.select("INBOX")

            search_criterion = "UNSEEN" if only_unread else "ALL"
            status, response = mail.search(None, search_criterion)

            if status != "OK" or not response or not response[0]:
                mail.logout()
                return []

            email_ids = response[0].split()
            # Fetch the most recent 'limit' emails
            recent_ids = email_ids[-limit:] if len(email_ids) > limit else email_ids
            # Process in reverse chronological order (newest first)
            recent_ids.reverse()

            for eid in recent_ids:
                try:
                    res_stat, msg_data = mail.fetch(eid, "(RFC822)")
                    if res_stat != "OK" or not msg_data:
                        continue

                    raw_email_bytes = msg_data[0][1]
                    msg = email.message_from_bytes(raw_email_bytes)

                    # Extract metadata
                    subject = cls._decode_str(msg.get("Subject")) or "(No Subject)"
                    sender = cls._decode_str(msg.get("From")) or email_address
                    recipient = cls._decode_str(msg.get("To")) or email_address
                    date_str = msg.get("Date")

                    # Parse body
                    body = cls._extract_body(msg)
                    if not body:
                        body = "(Empty email body or HTML-only message)"

                    # Check if email with identical sender, subject, and body already exists to avoid duplicates
                    existing = db.query(EmailMessage).filter(
                        EmailMessage.sender == sender,
                        EmailMessage.subject == subject,
                        EmailMessage.body == body[:200]
                    ).first()

                    if existing:
                        continue

                    # Create new EmailMessage in DB
                    new_email = EmailMessage(
                        sender=sender,
                        recipient=recipient,
                        subject=subject,
                        body=body,
                        status="UNPROCESSED",
                        priority="MEDIUM",
                        received_at=datetime.utcnow()
                    )
                    db.add(new_email)
                    db.commit()
                    db.refresh(new_email)

                    # Trigger LangGraph multi-agent orchestrator immediately
                    try:
                        wf = WorkflowService.execute_workflow(db, new_email.id, auto_run=True)
                        ingested_records.append({
                            "email_id": new_email.id,
                            "subject": new_email.subject,
                            "sender": new_email.sender,
                            "workflow_id": wf.id,
                            "workflow_state": wf.state
                        })
                        print(f"[RealEmailService] Live email ingested & orchestrated: '{subject}' -> Workflow: {wf.id} ({wf.state})")
                    except Exception as wf_err:
                        print(f"[RealEmailService] LangGraph trigger warning for email {new_email.id}: {wf_err}")
                        ingested_records.append({
                            "email_id": new_email.id,
                            "subject": new_email.subject,
                            "sender": new_email.sender,
                            "workflow_id": None,
                            "workflow_state": "UNPROCESSED"
                        })

                except Exception as parse_err:
                    print(f"[RealEmailService] Error parsing email ID {eid}: {parse_err}")
                    continue

            mail.logout()

        except Exception as conn_err:
            print(f"[RealEmailService] IMAP connection failed: {conn_err}")
            raise conn_err

        return ingested_records

    @classmethod
    def parse_and_ingest_raw_email(
        cls,
        db: Session,
        raw_text: str,
        sender: Optional[str] = None,
        subject: Optional[str] = None,
        recipient: Optional[str] = None,
        auto_process: bool = True
    ) -> Dict[str, Any]:
        """
        Parses raw text (RFC822 / .EML format or simple plain text) and creates
        an EmailMessage, then optionally triggers the LangGraph agent immediately.
        """
        parsed_sender = sender
        parsed_recipient = recipient
        parsed_subject = subject
        body_text = raw_text

        # Try parsing as standard RFC822 / MIME format
        if "from:" in raw_text.lower() or "subject:" in raw_text.lower():
            try:
                msg = email.message_from_string(raw_text)
                if msg.get("From") and not parsed_sender:
                    parsed_sender = cls._decode_str(msg.get("From"))
                if msg.get("Subject") and not parsed_subject:
                    parsed_subject = cls._decode_str(msg.get("Subject"))
                if msg.get("To") and not parsed_recipient:
                    parsed_recipient = cls._decode_str(msg.get("To"))

                extracted_body = cls._extract_body(msg)
                if extracted_body:
                    body_text = extracted_body
            except Exception as parse_err:
                print(f"[RealEmailService] MIME fallback: {parse_err}")

        # Fallbacks for empty values
        final_sender = parsed_sender or "sender@external-client.com"
        final_recipient = parsed_recipient or "user@organization.com"
        final_subject = parsed_subject or (body_text.strip().split("\n")[0][:60] if body_text.strip() else "Direct Ingested Email")

        new_email = EmailMessage(
            sender=final_sender,
            recipient=final_recipient,
            subject=final_subject,
            body=body_text,
            status="UNPROCESSED",
            priority="MEDIUM",
            received_at=datetime.utcnow()
        )
        db.add(new_email)
        db.commit()
        db.refresh(new_email)

        wf_run = None
        if auto_process:
            try:
                wf_run = WorkflowService.execute_workflow(db, new_email.id, auto_run=True)
            except Exception as wf_err:
                print(f"[RealEmailService] Workflow trigger warning: {wf_err}")

        return {
            "success": True,
            "message": f"Successfully ingested email '{new_email.subject}'",
            "email_id": new_email.id,
            "email": {
                "id": new_email.id,
                "sender": new_email.sender,
                "recipient": new_email.recipient,
                "subject": new_email.subject,
                "body": new_email.body,
                "status": new_email.status,
                "priority": new_email.priority,
                "received_at": new_email.received_at.isoformat()
            },
            "workflow_id": wf_run.id if wf_run else None,
            "workflow_state": wf_run.state if wf_run else "UNPROCESSED"
        }

