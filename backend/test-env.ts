/**
 * Test if environment variables are accessible
 */

console.log("Environment variables check:");
console.log("OPENAI_API_KEY exists?", !!process.env.OPENAI_API_KEY);
console.log(
	"OPENAI_API_KEY value:",
	process.env.OPENAI_API_KEY?.substring(0, 10) + "...",
);
console.log("ANTHROPIC_API_KEY exists?", !!process.env.ANTHROPIC_API_KEY);
console.log("GOOGLE_API_KEY exists?", !!process.env.GOOGLE_API_KEY);
