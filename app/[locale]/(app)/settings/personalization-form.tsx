"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Lock, X } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { BrandThemeTokens } from "@/types";
import { BRAND_PALETTE_TEMPLATES } from "@/lib/branding/palettes";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AmrapLogo } from "@/components/landing/amrap-logo";
import {
  applyPaletteTemplateAction,
  removeGymLogoAction,
  uploadGymLogoAction,
  type SettingsActionState,
} from "./actions";
import { ConfirmDialog } from "@/components/confirm-dialog";

type Props = {
  locale: Locale;
  logoUrlLight: string | null;
  logoUrlDark: string | null;
  themeLight: BrandThemeTokens;
  themeDark: BrandThemeTokens;
  canCustomizeBrand: boolean;
};

function LogoModeBlock({
  locale,
  mode,
  logoUrl,
  label,
  uploadPending,
  removePending,
  uploadSuccess,
  fieldError,
  logoAction,
  removeAction,
}: {
  locale: Locale;
  mode: "light" | "dark";
  logoUrl: string | null;
  label: string;
  uploadPending: boolean;
  removePending: boolean;
  uploadSuccess?: string;
  fieldError?: string;
  logoAction: (payload: FormData) => void;
  removeAction: (payload: FormData) => void;
}) {
  const d = getDictionary(locale);
  const logoId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const wasPending = useRef(false);
  const previewUrlRef = useRef<string | null>(null);
  const [hasFile, setHasFile] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);

  function replacePreview(file: File | null) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (file) {
      const url = URL.createObjectURL(file);
      previewUrlRef.current = url;
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }

  function clearSelection() {
    setHasFile(false);
    replacePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  useEffect(() => {
    if (wasPending.current && !uploadPending && uploadSuccess) {
      clearSelection();
    }
    wasPending.current = uploadPending;
  }, [uploadPending, uploadSuccess]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const displayUrl = previewUrl || logoUrl;

  return (
    <div className="relative flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
      <div className="flex items-start justify-between gap-2 pr-8">
        <h4 className="text-sm font-semibold text-[var(--color-text)]">{label}</h4>
        {logoUrl && !previewUrl ? (
          <button
            type="button"
            onClick={() => setRemoveOpen(true)}
            disabled={removePending}
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] disabled:opacity-50"
            aria-label={d.settings.removeLogo}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
      {displayUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={displayUrl}
          src={displayUrl}
          alt=""
          className="h-12 w-auto max-w-[180px] object-contain object-left"
        />
      ) : (
        <AmrapLogo className="h-12 w-auto max-w-[180px]" />
      )}
      <form action={logoAction} className="flex flex-col gap-2">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="mode" value={mode} />
        <FormField
          label={d.settings.uploadLogo}
          htmlFor={logoId}
          variant="auth"
          error={fieldError}
        >
          <Input
            ref={fileRef}
            id={logoId}
            name="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            variant="auth"
            required
            onChange={(e) => {
              const file = e.currentTarget.files?.[0] ?? null;
              setHasFile(Boolean(file));
              replacePreview(file);
            }}
          />
        </FormField>
        <Button
          type="submit"
          variant="primary"
          disabled={uploadPending || !hasFile}
        >
          {uploadPending ? d.settings.saving : d.settings.uploadLogo}
        </Button>
      </form>

      <ConfirmDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title={d.settings.removeLogo}
        description={d.settings.confirmRemoveLogo}
        closeLabel={d.members.cancel}
        cancelLabel={d.members.cancel}
        confirmLabel={d.settings.removeLogo}
        action={removeAction}
        pending={removePending}
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="mode" value={mode} />
      </ConfirmDialog>
    </div>
  );
}

export function PersonalizationForm({
  locale,
  logoUrlLight,
  logoUrlDark,
  canCustomizeBrand,
}: Props) {
  const d = getDictionary(locale);
  const router = useRouter();
  const [paletteState, paletteAction, palettePending] = useActionState(
    applyPaletteTemplateAction,
    null as SettingsActionState,
  );
  const [logoState, logoAction, logoPending] = useActionState(
    uploadGymLogoAction,
    null as SettingsActionState,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeGymLogoAction,
    null as SettingsActionState,
  );

  const [displayLight, setDisplayLight] = useState(logoUrlLight);
  const [displayDark, setDisplayDark] = useState(logoUrlDark);
  const [prevLight, setPrevLight] = useState(logoUrlLight);
  const [prevDark, setPrevDark] = useState(logoUrlDark);
  if (logoUrlLight !== prevLight) {
    setPrevLight(logoUrlLight);
    setDisplayLight(logoUrlLight);
  }
  if (logoUrlDark !== prevDark) {
    setPrevDark(logoUrlDark);
    setDisplayDark(logoUrlDark);
  }

  const [handledLogo, setHandledLogo] = useState<SettingsActionState>(null);
  if (logoState?.success && logoState !== handledLogo) {
    setHandledLogo(logoState);
    if (logoState.logoMode === "light") {
      setDisplayLight(logoState.logoUrl ?? null);
    } else if (logoState.logoMode === "dark") {
      setDisplayDark(logoState.logoUrl ?? null);
    }
  }
  const [handledRemove, setHandledRemove] = useState<SettingsActionState>(null);
  if (removeState?.success && removeState !== handledRemove) {
    setHandledRemove(removeState);
    if (removeState.logoMode === "light") setDisplayLight(null);
    else if (removeState.logoMode === "dark") setDisplayDark(null);
  }

  useEffect(() => {
    if (paletteState?.success || logoState?.success || removeState?.success) {
      router.refresh();
    }
  }, [
    paletteState?.success,
    logoState?.success,
    removeState?.success,
    router,
  ]);

  const flash =
    paletteState?.success || logoState?.success || removeState?.success;
  const error =
    paletteState?.error || logoState?.error || removeState?.error;

  if (!canCustomizeBrand) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="font-title text-2xl font-bold text-[var(--color-text)]">
            {d.settings.personalization}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-[var(--color-muted)]">
            {d.settings.personalizationHint}
          </p>
        </div>
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--color-muted)]/15 text-[var(--color-muted)]">
              <Lock className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-title text-lg font-bold text-[var(--color-text)]">
                {d.settings.whitelabelLocked}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {d.settings.whitelabelLockedHint}
              </p>
            </div>
            <Link
              href={`/${locale}/organization#subscription`}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary-on)] shadow-sm transition-opacity hover:opacity-90"
            >
              {d.settings.upgradeWhitelabel}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-title text-2xl font-bold text-[var(--color-text)]">
            {d.settings.personalization}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-[var(--color-muted)]">
            {d.settings.personalizationHint}
          </p>
        </div>
        {flash ? (
          <p
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--color-success)]/20 bg-[var(--color-success)]/10 px-3 py-2 text-sm font-medium text-[var(--color-success)]"
            role="status"
          >
            <Check className="h-4 w-4" aria-hidden strokeWidth={2.5} />
            {flash}
          </p>
        ) : null}
      </div>

      {error ? (
        <p
          className="rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-4 py-3 text-sm font-medium text-[var(--color-primary)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <section className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6">
        <h3 className="font-title text-xl font-bold text-[var(--color-text)]">
          {d.settings.palettes}
        </h3>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {d.settings.palettesHint}
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {BRAND_PALETTE_TEMPLATES.map((tpl) => (
            <form key={tpl.id} action={paletteAction} className="contents">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="paletteId" value={tpl.id} />
              <button
                type="submit"
                disabled={palettePending}
                className="flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-left transition-colors hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-surface-hover)] disabled:opacity-60"
              >
                <span className="text-sm font-semibold text-[var(--color-text)]">
                  {d.settings[tpl.nameKey]}
                </span>
                <span className="flex gap-1.5">
                  <span
                    className="h-7 flex-1 rounded-md"
                    style={{ background: tpl.light.primary }}
                    title={d.settings.lightMode}
                  />
                  <span
                    className="h-7 flex-1 rounded-md"
                    style={{ background: tpl.light.bg }}
                  />
                  <span
                    className="h-7 flex-1 rounded-md border border-[var(--color-border)]"
                    style={{ background: tpl.light.surface }}
                  />
                </span>
                <span className="flex gap-1.5">
                  <span
                    className="h-7 flex-1 rounded-md"
                    style={{ background: tpl.dark.primary }}
                    title={d.settings.darkMode}
                  />
                  <span
                    className="h-7 flex-1 rounded-md"
                    style={{ background: tpl.dark.bg }}
                  />
                  <span
                    className="h-7 flex-1 rounded-md border border-[var(--color-border)]"
                    style={{ background: tpl.dark.surface }}
                  />
                </span>
                <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)]">
                  {palettePending ? d.settings.saving : d.settings.applyPalette}
                </span>
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6">
        <h3 className="font-title text-xl font-bold text-[var(--color-text)]">
          {d.settings.logo}
        </h3>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {d.settings.logoHint}
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <LogoModeBlock
            locale={locale}
            mode="light"
            logoUrl={displayLight}
            label={d.settings.logoLight}
            uploadPending={logoPending}
            removePending={removePending}
            uploadSuccess={logoState?.success}
            fieldError={logoState?.fieldErrors?.logo}
            logoAction={logoAction}
            removeAction={removeAction}
          />
          <LogoModeBlock
            locale={locale}
            mode="dark"
            logoUrl={displayDark}
            label={d.settings.logoDark}
            uploadPending={logoPending}
            removePending={removePending}
            uploadSuccess={logoState?.success}
            fieldError={logoState?.fieldErrors?.logo}
            logoAction={logoAction}
            removeAction={removeAction}
          />
        </div>
      </section>
    </div>
  );
}
