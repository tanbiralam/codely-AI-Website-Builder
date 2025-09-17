import {
  openai,
  createAgent,
  createTool,
  createNetwork,
  type Tool,
  type Message,
  createState,
} from "@inngest/agent-kit";
import { Sandbox } from "@e2b/code-interpreter";

import { inngest } from "./client";
import {
  getSandbox,
  lastAssitantTextMessageContent,
  parseAgentOutput,
} from "./utils";
import { z } from "zod";
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "@/prompt";
import { prisma } from "@/lib/database";
import { SANDBOX_TIMEOUT } from "./types";

interface AgentState {
  summary: string;
  files: { [path: string]: string };
}

export const devAgent = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("vibe-dev-next-js-test-20");
      await sandbox.setTimeout(SANDBOX_TIMEOUT);
      return sandbox.sandboxId;
    });

    //agent memory for context of the chat in a project
    const previousMessages = await step.run(
      "get-previous-messages",
      async () => {
        const formattedMessages: Message[] = [];

        const messages = await prisma.message.findMany({
          where: {
            projectId: event.data.projectId,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        });

        //TODO: Add message index tracking for better context
        for (const message of messages) {
          formattedMessages.push({
            type: "text",
            role: message.role === "ASSISTANT" ? "assistant" : "user",
            content: message.content,
          });
        }

        return formattedMessages.reverse();
      }
    );

    const state = createState<AgentState>(
      {
        summary: "",
        files: {},
      },
      {
        messages: previousMessages,
      }
    );

    const codeAgent = createAgent<AgentState>({
      name: "code-agent",
      description: "An expert coding agent",
      system: PROMPT,
      model: openai({
        model: "gpt-4.1",
        defaultParameters: { temperature: 0.1 },
      }),
      tools: [
        //Terminal Access To the Agent for running commands
        createTool({
          name: "terminal",
          description: "Use the terminal to run command",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };

              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  },
                });

                return result.stdout;
              } catch (e) {
                console.error(
                  `Command Failed: ${e} \nstdout: ${buffers.stdout}\stderr: ${buffers.stderr}`
                );

                return `Command Failed: ${e} \nstdout: ${buffers.stdout}\stderr: ${buffers.stderr}`;
              }
            });
          },
        }),

        //Create or Update of Files Access To the Agent
        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              })
            ),
          }),

          handler: async (
            { files },
            { step, network }: Tool.Options<AgentState>
          ) => {
            const newFiles = await step?.run(
              "createOrUpdateFiles",
              async () => {
                try {
                  const updatedFiles = network.state.data.files || {};
                  const sandbox = await getSandbox(sandboxId);
                  for (const file of files) {
                    await sandbox.files.write(file.path, file.content);
                    updatedFiles[file.path] = file.content;
                  }

                  return updatedFiles;
                } catch (e) {
                  return "Error: " + e;
                }
              }
            );

            if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
            }
          },
        }),

        // Read Access of Files to the Agent
        createTool({
          name: "readFiles",
          description: "Read files from the Sandbox",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents = [];
                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }
                return JSON.stringify(contents);
              } catch (e) {
                return "Error: " + e;
              }
            });
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssitantMessageText =
            lastAssitantTextMessageContent(result);

          if (lastAssitantMessageText && network) {
            if (lastAssitantMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssitantMessageText;
            }
          }
          return result;
        },
      },
    });

    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 15,
      defaultState: state,
      router: async ({ network }) => {
        const summary = network.state.data.summary;

        if (summary) {
          return;
        }

        return codeAgent;
      },
    });

    const result = await network.run(event.data.value, { state });

    const fragmentTitleGenerator = createAgent({
      name: "fragment-title-generator-agent",
      description: "A fragment title generator",
      system: FRAGMENT_TITLE_PROMPT,
      model: openai({
        model: "gpt-4o",
      }),
    });

    const responseGenerator = createAgent({
      name: "response-generator-agent",
      description: "A response generator",
      system: RESPONSE_PROMPT,
      model: openai({
        model: "gpt-4o",
      }),
    });

    const { output: fragmentTitleOutput } = await fragmentTitleGenerator.run(
      result.state.data.summary
    );
    const { output: responseOutput } = await responseGenerator.run(
      result.state.data.summary
    );

    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);

      return `https://${host}`;
    });

    await step.run("save-result", async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong. Please try again",
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      }

      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: parseAgentOutput(responseOutput),
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: sandboxUrl,
              title: parseAgentOutput(fragmentTitleOutput),
              files: result.state.data.files,
            },
          },
        },
      });
    });

    return {
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  }
);
