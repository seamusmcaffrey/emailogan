'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import Navigation from '@/components/Layout/Navigation';

export default function InstructionsPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (mounted && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router, mounted]);

  if (!mounted || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            How to Use This Damn Thing
          </h1>
          <p className="text-gray-600 mb-8">
            Because apparently clicking buttons is hard
          </p>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="border-l-4 border-indigo-500 pl-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
                  1
                </span>
                Archive Your Shit
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Look, we need your actual emails to learn how you write. Not screenshots, not copy-paste, 
                but the real deal. Export your emails as <code className="bg-gray-100 px-2 py-1 rounded text-sm">.eml</code> files. 
                Don't know how? Google it. We're not your IT department.
              </p>
              <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Pro tip:</strong> The more emails you upload, the less your responses will sound 
                  like they were written by a robot having an existential crisis.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="border-l-4 border-indigo-500 pl-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
                  2
                </span>
                Upload That Crap
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Navigate your ass over to the <span className="font-semibold">Upload</span> tab. 
                Drag and drop your .eml files like you're 2024's hottest DJ. Or click the button 
                like it's 2005. We don't judge (much).
              </p>
              <div className="mt-3 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm text-indigo-800">
                  <strong>Note:</strong> We'll process these bad boys and learn your writing style. 
                  It's like having a digital twin, but less creepy and more useful.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="border-l-4 border-indigo-500 pl-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
                  3
                </span>
                Generate Some Magic
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Head to <span className="font-semibold">Generate Response</span>. Paste in whatever 
                email you need to respond to. Hit the big blue button. Watch as we craft a response 
                that sounds like you, but on your best day after three cups of coffee and a motivational 
                podcast.
              </p>
              <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Reality check:</strong> We're using AI to mimic your style based on your past 
                  emails. It's not mind-reading, it's pattern matching. Still pretty fucking cool though.
                </p>
              </div>
            </div>

            {/* Bonus */}
            <div className="border-l-4 border-purple-500 pl-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
                  🎉
                </span>
                That's It, You're Done
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Seriously, that's the whole thing. Three steps. If you can't figure this out, 
                maybe email isn't your problem. Check out the <span className="font-semibold">Knowledge Base</span> tab 
                to see what we've learned about you (spoiler: you say "per my last email" way too much).
              </p>
            </div>
          </div>

          <div className="mt-12 p-6 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Still Confused? Here's the TL;DR:
            </h3>
            <ol className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="font-mono mr-2">1.</span>
                Export emails as .eml files (from Gmail, Outlook, whatever)
              </li>
              <li className="flex items-start">
                <span className="font-mono mr-2">2.</span>
                Upload them here so we can learn your style
              </li>
              <li className="flex items-start">
                <span className="font-mono mr-2">3.</span>
                Paste new emails, get AI-generated responses that sound like you
              </li>
            </ol>
            <p className="mt-4 text-sm text-gray-600 italic">
              If you're still lost, maybe try turning it off and on again? 
              Or just write your own damn emails like a normal person.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}