"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  airEmissionFormSchema,
  type AirEmissionFormValues,
  POLLUTANT_TYPES,
  CONCENTRATION_UNITS,
  MEASUREMENT_METHODS,
  MEASUREMENT_METHOD_LABEL,
} from "@/lib/validations/air-emission";
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

const EMPTY: AirEmissionFormValues = {
  siteId: "",
  stackId: "",
  measuredAt: "",
  pollutantType: "",
  concentration: "",
  concentrationUnit: "mg/m³",
  flowRate: "",
  totalEmissions: "",
  measurementMethod: "CONTINUOUS",
  equipmentReference: "",
};

type ApiError = { error?: string; fieldErrors?: Record<string, string> };

export function AirEmissionForm({
  sites,
  recordId,
  defaultValues,
  onSuccess,
}: {
  sites: SiteOption[];
  /** Present ⇒ edit mode (PATCH); absent ⇒ create (POST). */
  recordId?: string;
  defaultValues?: Partial<AirEmissionFormValues>;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<AirEmissionFormValues>({
    resolver: zodResolver(airEmissionFormSchema),
    defaultValues: { ...EMPTY, ...defaultValues },
  });

  function submit(values: AirEmissionFormValues) {
    startTransition(async () => {
      const url = recordId
        ? `/api/air-emissions/${recordId}`
        : "/api/air-emissions";
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
            form.setError(field as keyof AirEmissionFormValues, { message });
          }
        }
      }
      toast.error(data.error ?? "Could not save the record.");
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
            name="stackId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stack ID</FormLabel>
                <FormControl>
                  <Input placeholder="STK-1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="measuredAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Measured at</FormLabel>
                <FormControl>
                  <DatePicker value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pollutantType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pollutant</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select pollutant" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {POLLUTANT_TYPES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
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
            name="concentration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Concentration</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" placeholder="125.4" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="concentrationUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CONCENTRATION_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
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
            name="flowRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Flow rate (m³/h, optional)</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" placeholder="12000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="totalEmissions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total emissions (optional)</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" placeholder="3400" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="measurementMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Measurement method</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MEASUREMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {MEASUREMENT_METHOD_LABEL[m]}
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
            name="equipmentReference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Equipment reference (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="CEMS-204" {...field} />
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
