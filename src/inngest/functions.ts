import { openai, createAgent } from "@inngest/agent-kit";

import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world2" },
  { event: "test/hello.world" },
  async ({ event }) => {
    const summariser = createAgent({
      name: "summariser",
      system: "You are an expert summariser.  You summarise in 2 words",
      model: openai({ model: "gpt-4o" }),
    });

    const { output } = await summariser.run(
      `Summarise the following text: ${event.data.value}`
    );
    console.log(output);

    return { output };
  }
);
