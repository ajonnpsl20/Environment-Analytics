"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  waterFormSchema,
  type WaterFormValues,
  WATER_SOURCES,
  WATER_SOURCE_LABEL,
} from "@/lib/validations/water";
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

const EMPTY: WaterFormValues = {
  siteId: "",
  meterId: "",
  readingStart: "",
  readingEnd: "",
  consumptionM3: "",
  source: "MAINS",
  periodStart: "",
  periodEnd: "",
};

type ApiError = { error?: string; fieldErrors?: Record<string, string> };

export function WaterForm({
  sites,
  recordId,
  defaultValues,
  onSuccess,
}: {
  sites: SiteOption[];
  /** Present ⇒ edit mode (PATCH); absent ⇒ create (POST). */
  recordId?: string;
  defaultValues?: Partial<WaterFormValues>;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<WaterFormValues>({
    resolver: zodResolver(waterFormSchema),
    defaultValues: { ...EMPTY, ...defaultValues },
  });

  function submit(values: WaterFormValues) {
    startTransition(async () => {
      try {
        const url = recordId ? `/api/water/${recordId}` : "/api/water";
        const res = await fetch(url, {
          method: recordId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        if (res.ok) {
          toast.success(recordId ? "Record updated" : "Record submitted for review");
          router.refresh();
          onSuccess();
          return;
        }

        const data = (await res.json().catch(() => ({}))) as ApiError;
        if (data.fieldErrors) {
          for (const [field, message] of Object.entries(data.fieldErrors)) {
            if (field in EMPTY) {
              form.setError(field as keyof WaterFormValues, { message });
            }
          }
        }
        toast.error(data.error ?? "Could not save the record.");
      } catch {
        toast.error(
          "Couldn't reach the server. Check your connection and try again.",
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
            name="meterId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meter ID</FormLabel>
                <FormControl>
                  <Input placeholder="WM-1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="readingStart"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reading start</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" placeholder="184320" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="readingEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reading end</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" placeholder="186110" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="consumptionM3"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Consumption (m³)</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" placeholder="1790" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {WATER_SOURCES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {WATER_SOURCE_LABEL[s]}
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
            name="periodStart"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Period start</FormLabel>
                <FormControl>
                  <DatePicker value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="periodEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Period end</FormLabel>
                <FormControl>
                  <DatePicker value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
