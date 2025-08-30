// Test runner script for all Edge Function tests
// Usage: deno run --allow-all supabase/functions/tests/run-tests.ts

import "https://deno.land/std@0.208.0/dotenv/load.ts";

// Load test environment variables
const testEnvPath = new URL("./.env.test", import.meta.url).pathname;
try {
  const envContent = await Deno.readTextFile(testEnvPath);
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        Deno.env.set(key.trim(), value.trim());
      }
    }
  }
} catch (error) {
  console.warn("Could not load .env.test file:", error.message);
}

console.log("🧪 Running Edge Functions Test Suite\n");

// Test categories to run
const testCategories = [
  {
    name: "Validation Utils",
    file: "validation-test.ts",
    description: "Input validation and sanitization"
  },
  {
    name: "Error Handling", 
    file: "errors-test.ts",
    description: "Error response formatting and types"
  },
  {
    name: "AI Provider Adapters",
    file: "ai-providers-test.ts", 
    description: "AI provider factory and adapter pattern"
  },
  {
    name: "Exercise Selection",
    file: "exercises-test.ts",
    description: "Context-aware exercise generation and filtering"
  },
  {
    name: "Analytics Hierarchy",
    file: "analytics-test.ts",
    description: "Event → System → Exercise analytics calculations"
  },
  {
    name: "Programs & Workouts",
    file: "programs-workouts-test.ts",
    description: "Program generation and workout management logic"
  }
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

for (const category of testCategories) {
  console.log(`\n📂 ${category.name} - ${category.description}`);
  console.log("─".repeat(60));
  
  const testPath = new URL(`./${category.file}`, import.meta.url).pathname;
  
  try {
    // Run the test file
    const cmd = new Deno.Command("deno", {
      args: [
        "test",
        "--allow-all",
        "--quiet",
        testPath
      ],
      stdout: "piped",
      stderr: "piped"
    });
    
    const { code, stdout, stderr } = await cmd.output();
    
    const output = new TextDecoder().decode(stdout);
    const errors = new TextDecoder().decode(stderr);
    
    if (code === 0) {
      // Parse test results from output
      const lines = output.split('\n');
      const resultLine = lines.find(line => line.includes('test result:'));
      
      if (resultLine) {
        const matches = resultLine.match(/(\d+) passed/);
        if (matches) {
          const passed = parseInt(matches[1]);
          totalTests += passed;
          passedTests += passed;
          console.log(`✅ ${passed} tests passed`);
        }
      } else {
        console.log("✅ Tests completed successfully");
      }
    } else {
      console.log("❌ Tests failed");
      if (errors) {
        console.log("Errors:", errors);
      }
      if (output) {
        console.log("Output:", output);
      }
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ Error running tests: ${error.message}`);
    failedTests++;
  }
}

// Summary
console.log("\n" + "=".repeat(60));
console.log("🏁 TEST SUMMARY");
console.log("=".repeat(60));

if (totalTests > 0) {
  console.log(`Total Tests Run: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
} else {
  console.log("No test results parsed - check test output above");
}

if (failedTests === 0) {
  console.log("\n🎉 All tests passed! Ready to continue development.");
} else {
  console.log("\n⚠️  Some tests failed. Please fix issues before continuing.");
  Deno.exit(1);
}