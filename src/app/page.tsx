"use client";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const Page = () => {
  const [value, setValue] = useState("");
  const trpc = useTRPC();
  const invoke = useMutation(
    trpc.invoke.mutationOptions({
      onSuccess: () => {
        toast.success("Background job Started!");
      },
    })
  );

  return (
    <div className="p-4 max-w-7-xl mx-auto">
      <Input value={value} onChange={(e) => setValue(e.target.value)} />
      <Button
        disabled={invoke.isPending}
        onClick={() => invoke.mutate({ value: value })}
      >
        Invoke Background Jobs
      </Button>
    </div>
  );
};

export default Page;
