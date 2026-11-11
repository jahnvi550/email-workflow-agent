"""
Email Tool for dispatching responses, live SMTP outbound delivery, and staging draft messages.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.audit_log import AuditLog
from backend.app.models.email import EmailMessage
from backend.app.models.user import User


class EmailTool:
    @staticmethod
    def _resolve_smtp_server(imap_server: Optional[str]) -> tuple:
        """Determines appropriate SMTP server and port based on IMAP host."""
        if not imap_server:
            return "smtp.gmail.com", 587
        server_lower = imap_server.lower()
        if "gmail" in server_lower:
            return "smtp.gmail.com", 587
        elif "outlook" in server_lower or "office365" in server_lower:
            return "smtp-mail.outlook.com", 587
        elif "yahoo" in server_lower:
            return "smtp.mail.yahoo.com", 587
        elif imap_server.startswith("imap."):
            return imap_server.replace("imap.", "smtp."), 587
        return imap_server, 587

    @classmethod
    def send_live_smtp(
        cls,
        sender_email: str,
        sender_password: str,
        recipient_email: str,
        subject: str,
        body_text: str,
        imap_server: Optional[str] = None
    ) -> Dict[str, Any]:
        """Dispatches an outbound email via live SMTP."""
        smtp_host, smtp_port = cls._resolve_smtp_server(imap_server)
        try:
            msg = MIMEMultipart()
            msg["From"] = sender_email
            msg["To"] = recipient_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body_text, "plain", "utf-8"))

            server = smtplib.SMTP(smtp_host, smtp_port, timeout=12)
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, [recipient_email], msg.as_string())
            server.quit()
            
            return {
                "success": True,
                "message": f"Live email successfully sent to {recipient_email} via {smtp_host}:{smtp_port}.",
                "smtp_host": smtp_host
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Live SMTP dispatch failed ({smtp_host}): {str(e)}",
                "smtp_host": smtp_host
            }

    @classmethod
    def send_reply(cls, db: Session, email_id: str, draft_data: Dict[str, Any], actor: str = "AI_AGENT") -> bool:
        """
        Dispatches an email response.
        If live user credentials exist, dispatches via real SMTP; otherwise executes staged simulation.
        """
        email = db.query(EmailMessage).filter(EmailMessage.id == email_id).first()
        if email:
            email.status = "PROCESSED"
            db.commit()

        recipient = draft_data.get("recipient") or (email.sender if email else "client@example.com")
        subject = draft_data.get("subject") or f"Re: {email.subject if email else 'Notification'}"
        body = draft_data.get("body", "")
        tone = draft_data.get("tone", "Professional")

        smtp_result = {"success": True, "message": "Simulated local sandbox dispatch."}
        
        # Check if live user account with credentials exists
        active_user = db.query(User).filter(User.imap_password.isnot(None)).first()
        if active_user and active_user.imap_password and active_user.email:
            smtp_result = cls.send_live_smtp(
                sender_email=active_user.email,
                sender_password=active_user.imap_password,
                recipient_email=recipient,
                subject=subject,
                body_text=body,
                imap_server=active_user.imap_server
            )

        audit = AuditLog(
            action="EMAIL_REPLY_SENT",
            actor=actor,
            entity_type="EMAIL",
            entity_id=email_id,
            details={
                "recipient": recipient,
                "subject": subject,
                "tone": tone,
                "body_preview": body[:140],
                "smtp_status": "LIVE_DELIVERED" if smtp_result.get("success") and active_user else "STAGED_SIMULATION",
                "delivery_details": smtp_result.get("message")
            }
        )
        db.add(audit)
        db.commit()
        return True

