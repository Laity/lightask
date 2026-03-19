// Prompt template engine: variable substitution for scene card prompts

export interface PromptTemplate {
  system: string
  user: string
}

/**
 * Render a prompt template by replacing {{variable}} placeholders with actual values.
 */
export function renderPrompt(template: PromptTemplate, variables: Record<string, string>): PromptTemplate {
  const render = (text: string): string =>
    text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? '')

  return {
    system: render(template.system),
    user: render(template.user),
  }
}
