import { openai, createAgent } from "@inngest/agent-kit";
import { Sandbox } from "@e2b/code-interpreter";

import { inngest } from "./client";
import { getSandbox } from "./utils";

export const helloWorld = inngest.createFunction(
  { id: "hello-world2" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("vibe-dev-next-js-test-20");

      return sandbox.sandboxId;
    });

    const summariser = createAgent({
      name: "summariser",
      system: "You are an expert summariser.  You summarise in 2 words",
      model: openai({ model: "gpt-4o" }),
    });

    const { output } = await summariser.run(
      `Summarise the following text: ${event.data.value}`
    );

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);

      return `https://${host}`;
    });

    return { output, sandboxUrl };
  }
);
