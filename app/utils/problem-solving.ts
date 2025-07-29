import { Prompts } from "./prompts";
import type { ClientApi, RequestMessage } from "../client/api";
import { getClientApi } from "../client/api";
import { ModelConfig } from "@/app/store/config";
import { createMessage } from "../store";

// 检查解题步骤
export async function checkFramework(
  framework: string,
  modelConfig: ModelConfig,
): Promise<string | undefined> {
  const teacherPrompt =
    "你是一名个人助手，请你根据历史记录，改进解题步骤，使其【通过】。如果需要，请写代码并执行来保证解题步骤的正确性。注意不要修改解题步骤的格式";
  const judgePrompt = Prompts.check_framework;
  const api: ClientApi = getClientApi(modelConfig.providerName);

  let teacherMessages: RequestMessage[] = [
    { role: "system", content: teacherPrompt },
    { role: "system", content: framework },
  ];

  let judgeMessages: RequestMessage[] = [
    { role: "system", content: judgePrompt },
    { role: "user", content: framework },
  ];

  let passed = false;
  let lastJudge: string = "";
  let lastTeacher: string = framework;

  while (!passed) {
    await api.llm.chat({
      messages: judgeMessages,
      config: { ...modelConfig, stream: false },
      onFinish: (message) => {
        lastJudge = message;
      },
    });

    if (lastJudge == "【通过】") {
      passed = true;
      framework = lastTeacher;
      break;
    }

    teacherMessages.concat([
      {
        role: "user",
        content: lastJudge,
      },
    ]);
    judgeMessages.concat([
      {
        role: "assistant",
        content: lastJudge,
      },
    ]);

    await api.llm.chat({
      messages: teacherMessages,
      config: { ...modelConfig, stream: false },
      onFinish: (message) => {
        lastTeacher = message;
      },
    });
    teacherMessages.concat([
      {
        role: "assistant",
        content: lastTeacher,
      },
    ]);
    judgeMessages.concat([
      {
        role: "user",
        content: lastTeacher,
      },
    ]);
  }

  return framework;
}

// 主函数：获取解题步骤
export async function getProblemFramework(
  problem: string,
  modelConfig: ModelConfig,
): Promise<string | undefined> {
  if (typeof window !== "undefined") {
    window.alert("解题框架生成函数已被调用");
  }

  // 第一步：生成解题框架
  let framework: string = "";
  const api: ClientApi = getClientApi(modelConfig.providerName);

  const userMessage = createMessage({
    role: "user",
    content: problem,
  });

  const messages = [
    { role: "system" as const, content: Prompts.solve_problem },
    userMessage,
  ];

  await api.llm.chat({
    messages: messages,
    config: { ...modelConfig, stream: false },
    onFinish: (message) => {
      framework = message;
    },
  });

  // 第二步：检查解题步骤
  let checkedFramework = await checkFramework(framework, modelConfig);

  return checkedFramework;
}
