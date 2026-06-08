"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Paperclip, FileWarning } from "lucide-react";

import {
  wasteFormSchema,
  type WasteFormValues,
  WASTE_TYPES,
  WASTE_TYPE_LABEL,
  WASTE_STREAMS,
  DISPOSAL_METHODS,
  CONTRACTORS,
} from "@/lib/validations/waste";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SiteOption = { id: string; name: string; siteId: string };

const EMPTY: WasteFormValues = {
  siteId: "",
  wasteType: "NON_HAZARDOUS",
  streamCategory: "",
  weightKg: "",
  disposalMethod: "",
  contractor: "",
  wtnReference: "",
  transferDate: "",
  wtnDocumentR2Key: "",
};

type ApiError = { error?: string; fieldErrors?: Record<string, string> };

function SelectField({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string | null) => void;
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <FormControl>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function WasteForm({
  sites,
  r2Enabled,
  recordId,
  defaultValues,
  onSuccess,
}: {
  sites: SiteOption[];
  /** Whether R2 file storage is configured; gates the WTN attachment UI. */
  r2Enabled: boolean;
  recordId?: string;
  defaultValues?: Partial<WasteFormValues>;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const form = useForm<WasteFormValues>({
    resolver: zodResolver(wasteFormSchema),
    defaultValues: { ...EMPTY, ...defaultValues },
  });

  const existingKey = defaultValues?.wtnDocumentR2Key;

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f && f.type !== "application/pdf") {
      toast.error("Please choose a PDF file.");
      e.target.value = "";
      setFile(null);
      return;
    }
    setFile(f);
  }

  function submit(values: WasteFormValues) {
    startTransition(async () => {
      try {
        let wtnKey = values.wtnDocumentR2Key ?? "";

        // Upload the WTN PDF first (direct to R2 via a presigned URL), if attached.
        if (r2Enabled && file) {
          const presign = await fetch("/api/uploads/wtn", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: file.name, contentType: "application/pdf" }),
          });
          if (!presign.ok) {
            const e = (await presign.json().catch(() => ({}))) as ApiError;
            toast.error(e.error ?? "Could not start the file upload.");
            return;
          }
          const { key, uploadUrl } = (await presign.json()) as {
            key: string;
            uploadUrl: string;
          };
          // A CORS/network failure here REJECTS (it doesn't return !ok), so the
          // whole submit is wrapped in try/catch to surface a toast rather than
          // letting the throw bubble up and blank the page.
          const put = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": "application/pdf" },
            body: file,
          });
          if (!put.ok) {
            toast.error("Could not upload the file to storage.");
            return;
          }
          wtnKey = key;
        }

        const payload = { ...values, wtnDocumentR2Key: wtnKey || undefined };
        const url = recordId ? `/api/waste/${recordId}` : "/api/waste";
        const res = await fetch(url, {
          method: recordId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          toast.success(recordId ? "Record updated" : "Record submitted for review");
          router.refresh();
          onSuccess();
          return;
        }

        const data = (await res.json().catch(() => ({}))) as ApiError;
        if (data.fieldErrors) {
          for (const [fieldName, message] of Object.entries(data.fieldErrors)) {
            if (fieldName in EMPTY) {
              form.setError(fieldName as keyof WasteFormValues, { message });
            }
          }
        }
        toast.error(data.error ?? "Could not save the record.");
      } catch {
        toast.error(
          "Couldn't reach the server or file storage. Check your connection and try again.",
        );
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="siteId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Site</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sites.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.siteId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="wasteType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Waste type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {WASTE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {WASTE_TYPE_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="streamCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stream</FormLabel>
                <SelectField
                  options={WASTE_STREAMS}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select stream"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="weightKg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (kg)</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" placeholder="1240" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="disposalMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Disposal method</FormLabel>
                <SelectField
                  options={DISPOSAL_METHODS}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select method"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contractor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contractor</FormLabel>
                <SelectField
                  options={CONTRACTORS}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select contractor"
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="wtnReference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WTN reference (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="WTN-2026-0001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="transferDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transfer date</FormLabel>
                <FormControl>
                  <DatePicker value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* WTN document attachment — degrades gracefully when R2 is unconfigured. */}
        <div className="space-y-1.5">
          <FormLabel>WTN document (PDF, optional)</FormLabel>
          {r2Enabled ? (
            <>
              {existingKey && (
                <a
                  href={`/api/uploads/wtn/${existingKey}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
                >
                  <Paperclip className="size-3.5" />
                  View current attachment
                </a>
              )}
              <Input
                type="file"
                accept="application/pdf,.pdf"
                onChange={onFileChange}
              />
              {existingKey && (
                <p className="text-xs text-muted-foreground">
                  Choosing a file replaces the current attachment.
                </p>
              )}
            </>
          ) : (
            <div className="flex items-start gap-2 rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
              <FileWarning className="mt-0.5 size-4 shrink-0" />
              <span>
                File storage isn&apos;t configured — attachments are unavailable.
                The WTN reference above is still recorded. Add the R2 credentials
                to enable uploads.
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            {recordId ? "Save changes" : "Submit record"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
