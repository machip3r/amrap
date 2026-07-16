"use client";

import { useId, useState, type FormEvent } from "react";
import type { LandingDictionary } from "@/lib/i18n/landing-dictionaries";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  LIMITS,
  emailSchema,
  messageSchema,
  personNameSchema,
  sanitizeEmailInput,
  sanitizePersonNameInput,
} from "@/lib/validation/schemas";

type Props = {
  d: LandingDictionary;
};

function formspreeEndpoint() {
  const id = process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID?.trim();
  if (!id) return null;

  return `https://formspree.io/f/${id}`;
}

export function LandingContact({ d }: Props) {
  const c = d.contact;
  const nameId = useId();
  const emailId = useId();
  const messageId = useId();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const canSubmit =
    name.trim().length > 0 && email.trim().length > 0 && message.trim().length > 0;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nameParsed = personNameSchema.safeParse(name);
    const emailParsed = emailSchema.safeParse(email);
    const messageParsed = messageSchema.safeParse(message);

    const nextErrors: Record<string, string> = {};
    if (!nameParsed.success) nextErrors.name = c.errors.name;
    if (!emailParsed.success) nextErrors.email = c.errors.email;
    if (!messageParsed.success) nextErrors.message = c.errors.message;

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setStatus("error");
      return;
    }

    const endpoint = formspreeEndpoint();
    if (!endpoint) {
      setFieldErrors({});
      setStatus("error");
      return;
    }

    setFieldErrors({});
    setPending(true);
    setStatus("idle");

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: nameParsed.data,
          email: emailParsed.data,
          message: messageParsed.data,
          _replyto: emailParsed.data,
          _subject: `AMRAP contact — ${nameParsed.data}`,
        }),
      });

      if (!res.ok) {
        setStatus("error");
        return;
      }

      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
    } finally {
      setPending(false);
    }
  }

  return (
    <section id="contacto" className="landing-section landing-contact">
      <div className="landing-container">
        <div className="landing-contact-intro">
          <h2 className="font-title landing-section-title landing-contact-title">
            {c.title}
          </h2>
          <p className="landing-contact-subtitle">{c.subtitle}</p>
        </div>

        <div className="landing-contact-grid">
          <aside className="landing-contact-details">
            <div className="landing-contact-detail">
              <span className="landing-contact-detail-label">{c.phoneLabel}</span>
              <a href={`tel:${d.footer.phone.replace(/\s+/g, "")}`} className="landing-contact-detail-value">
                {d.footer.phone}
              </a>
            </div>
            <div className="landing-contact-detail">
              <span className="landing-contact-detail-label">{c.emailLabel}</span>
              <a href={`mailto:${d.footer.email}`} className="landing-contact-detail-value">
                {d.footer.email}
              </a>
            </div>
            <div className="landing-contact-detail">
              <span className="landing-contact-detail-label">{c.addressLabel}</span>
              <p className="landing-contact-detail-value">{d.footer.address}</p>
            </div>
          </aside>

          <form className="landing-contact-form" onSubmit={onSubmit} noValidate>
            <FormField
              label={c.name}
              htmlFor={nameId}
              variant="auth"
              error={fieldErrors.name}
            >
              <Input
                id={nameId}
                name="name"
                autoComplete="name"
                variant="auth"
                value={name}
                onChange={(e) => {
                  setName(sanitizePersonNameInput(e.target.value));
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.name;
                    return next;
                  });
                }}
                placeholder={c.namePlaceholder}
                maxLength={LIMITS.personName}
                required
              />
            </FormField>
            <FormField
              label={c.email}
              htmlFor={emailId}
              variant="auth"
              error={fieldErrors.email}
            >
              <Input
                id={emailId}
                name="email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="email"
                variant="auth"
                value={email}
                onChange={(e) => {
                  setEmail(sanitizeEmailInput(e.target.value));
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.email;
                    return next;
                  });
                }}
                placeholder={c.emailPlaceholder}
                maxLength={LIMITS.email}
                required
              />
            </FormField>
            <FormField
              label={c.message}
              htmlFor={messageId}
              variant="auth"
              error={fieldErrors.message}
            >
              <textarea
                id={messageId}
                name="message"
                rows={5}
                required
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.message;
                    return next;
                  });
                }}
                placeholder={c.messagePlaceholder}
                maxLength={LIMITS.message}
                className="landing-contact-textarea"
              />
            </FormField>

            {status === "error" && Object.keys(fieldErrors).length === 0 ? (
              <p className="landing-contact-feedback landing-contact-feedback--error" role="alert">
                {c.error}
              </p>
            ) : null}
            {status === "success" ? (
              <p className="landing-contact-feedback landing-contact-feedback--success" role="status">
                {c.success}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              className="landing-contact-submit"
              disabled={!canSubmit || pending}
            >
              {pending ? c.submitting : c.submit}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
