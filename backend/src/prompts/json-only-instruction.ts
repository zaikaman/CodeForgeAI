/**
 * CRITICAL JSON-ONLY OUTPUT INSTRUCTION
 * Use this in ALL code generation agents to enforce strict JSON output
 */

export const JSON_ONLY_OUTPUT_INSTRUCTION = `

<ABSOLUTE_JSON_ONLY_OUTPUT_REQUIREMENT>
🚨🚨🚨 CRITICAL - NO EXCEPTIONS 🚨🚨🚨

YOU ARE **FORBIDDEN** FROM RETURNING TEXT/STRINGS.
YOU **MUST** RETURN **ONLY** VALID JSON OBJECTS.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ WORKFLOW WITH TOOLS (like generate_image):

1. **TOOL CALL PHASE** (Optional):
   - You MAY call tools (generate_image, github_*, etc.)
   - Tools will execute and return results
   - You can see returned data (image URLs, etc.)
   
2. **FINAL OUTPUT PHASE** (MANDATORY):
   - After ALL tools finish (or if no tools used)
   - Output **ONLY** a JSON object
   - Format: {{ "files": [...] }}
   - **ABSOLUTELY NO TEXT BEFORE OR AFTER THE JSON**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ FORBIDDEN RESPONSES (WILL BE REJECTED):

Example 1 - NO EXPLANATIONS:
"I'll help you build a shoe store..."
{{ "files": [...] }}
❌ REJECTED - Text before JSON

Example 2 - NO MARKDOWN:
\`\`\`json
{{ "files": [...] }}
\`\`\`
❌ REJECTED - Markdown code fence

Example 3 - NO CONVERSATIONS:
"Here's the complete application with all files:"
{{ "files": [...] }}
❌ REJECTED - Conversational text

Example 4 - NO DESCRIPTIONS:
{{ "files": [...] }}
"I've created 10 files for you."
❌ REJECTED - Text after JSON

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ CORRECT RESPONSE (ONLY THIS FORMAT):

{{"files":[{{"path":"package.json","content":"..."}},{{"path":"src/App.tsx","content":"..."}}]}}

That's it. Nothing else. Just pure JSON.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 MENTAL MODEL:

Think of your response as being piped directly to JSON.parse():
- If JSON.parse(your_response) throws an error → YOU FAILED
- If it parses successfully → YOU SUCCEEDED

Your ENTIRE response = ONE JSON object
NOT: explanation + JSON object
NOT: markdown + JSON object
JUST: JSON object

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 PRE-SUBMISSION CHECKLIST:

Before sending your response, verify:
1. ✅ First character is {{ (opening brace)
2. ✅ Last character is }} (closing brace)
3. ✅ ZERO text before the {{
4. ✅ ZERO text after the }}
5. ✅ No markdown code fences
6. ✅ No explanations or comments
7. ✅ Valid JSON that would pass JSON.parse()

If ANY of these fail → YOUR RESPONSE WILL BE REJECTED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 REMEMBER:

- We don't care about your thoughts or explanations
- We don't want to see your reasoning process
- We ONLY want the JSON object
- Think all you want, but OUTPUT ONLY JSON
- Your job: Generate code → Package as JSON → Send ONLY that JSON

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THIS IS NON-NEGOTIABLE. NO EXCEPTIONS. JSON ONLY.

</ABSOLUTE_JSON_ONLY_OUTPUT_REQUIREMENT>
`;
