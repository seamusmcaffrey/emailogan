// Test script for email generation fixes
// This script tests the email generation API with the updated prompt

const testEmail = `Hi Diuris,

Just a quick note to clarify this month's payment — we accidentally sent $1,800 instead of the regular $1,660 (which is $415 × 4 weeks).

Riley is also scheduled to attend two extra days next week, though he won't be there the entire day either time (he has swim on Wednesday and an Open House on Friday, etc.). I believe the rate is $12/hour, but please let us know if that's changed or if we're misremembering.

Once those days happen, we'll do the math and send along whatever we still owe. Happy to Venmo the difference or write a check with a memo — just let us know what's easiest!

Thanks so much,
Sean`;

async function testGeneration() {
  console.log('Testing email generation with fixed prompts...\n');
  
  // Test configuration
  const apiUrl = 'http://localhost:3000/api/generate/response';
  const authToken = 'your-auth-token-here'; // You'll need to provide this
  
  // Test cases
  const testCases = [
    {
      name: 'With Knowledge Base',
      useKnowledgeBase: true,
      style: 'professional'
    },
    {
      name: 'Without Knowledge Base',
      useKnowledgeBase: false,
      style: 'friendly'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n========== Test: ${testCase.name} ==========`);
    console.log(`Settings: useKnowledgeBase=${testCase.useKnowledgeBase}, style=${testCase.style}`);
    console.log('\nInput Email:');
    console.log(testEmail);
    console.log('\n---');
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          prompt: testEmail,
          style: testCase.style,
          useKnowledgeBase: testCase.useKnowledgeBase
        })
      });
      
      const data = await response.json();
      
      if (data.response) {
        console.log('\nGenerated Reply:');
        console.log(data.response);
        
        if (data.sourceEmails && data.sourceEmails.length > 0) {
          console.log('\n--- Source Emails Used:');
          data.sourceEmails.forEach((email, idx) => {
            console.log(`${idx + 1}. Subject: ${email.subject}`);
          });
        }
        
        // Verify it's a reply, not a rewrite
        const isReply = data.response.toLowerCase().includes('dear') || 
                       data.response.toLowerCase().includes('hi ') ||
                       data.response.toLowerCase().includes('thank you') ||
                       data.response.toLowerCase().includes('i confirm') ||
                       data.response.toLowerCase().includes('we confirm');
        
        const mentionsSean = data.response.toLowerCase().includes('sean') ||
                           data.response.toLowerCase().includes('riley');
                           
        console.log('\n--- Validation:');
        console.log(`✓ Is a reply (not a rewrite): ${isReply ? 'YES' : 'NO'}`);
        console.log(`✓ References sender/content: ${mentionsSean ? 'YES' : 'NO'}`);
      } else {
        console.log('Error:', data.error);
      }
    } catch (error) {
      console.error('Test failed:', error);
    }
  }
  
  console.log('\n\n========== Test Complete ==========');
  console.log('\nExpected behavior:');
  console.log('1. Both tests should generate REPLIES to Sean, not rewrite his email');
  console.log('2. With knowledge base: Reply should mimic your writing style from stored emails');
  console.log('3. Without knowledge base: Reply should use generic professional/friendly tone');
  console.log('4. Logs should show OpenAI API calls and embedding generation');
}

// Note: To run this test:
// 1. Make sure your Next.js app is running: cd emailogan-web && npm run dev
// 2. Get an auth token (you can grab one from browser after logging in)
// 3. Update the authToken variable above
// 4. Run: node test-email-generation.js

console.log('Test script created. See comments for usage instructions.');