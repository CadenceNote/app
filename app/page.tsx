// app/page.tsx
"use client";
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types/auth';
import { ArrowRight, Calendar, Clock, Users, MessageSquare, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    checkUser();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription?.unsubscribe();
  }, []);
  return (
    <Layout>
      {/* Hero Section with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(30deg,#4f46e540_1.56%,#4f46e510_50.52%,#ffffff10_100%)]" />
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 blur-3xl opacity-20">
            <div className="aspect-square h-[600px] rounded-full bg-blue-400" />
          </div>
          <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 blur-3xl opacity-20">
            <div className="aspect-square h-[600px] rounded-full bg-purple-400" />
          </div>
        </div>

        {/* Main content */}
        <div className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
            <div className="text-center space-y-8">
              <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl lg:text-7xl">
                Take Smart Notes for
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Agile Meetings</span>
              </h1>
              <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-600">
                Streamline your agile ceremonies with intelligent note-taking. Capture important decisions, action items, and insights effortlessly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {!user ? (
                  <>
                    <a
                      href="/signup"
                      className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition"
                    >
                      Get started free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                    <a
                      href="/login"
                      className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition"
                    >
                      Log in
                    </a>
                  </>
                ) : (
                  <a
                    href="/dashboard"
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Meeting Templates</h3>
              <p className="text-gray-600">
                Pre-built templates for standups, retros, and planning sessions. Start taking notes instantly.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-time Collaboration</h3>
              <p className="text-gray-600">
                Work together with your team in real-time. Everyone stays in sync, automatically.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Action Tracking</h3>
              <p className="text-gray-600">
                Turn discussions into trackable action items. Never lose track of important tasks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Trusted by agile teams everywhere
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-60">
            {/* Replace with actual company logos */}
            <div className="h-8 w-32 bg-gray-400 rounded"></div>
            <div className="h-8 w-32 bg-gray-400 rounded"></div>
            <div className="h-8 w-32 bg-gray-400 rounded"></div>
            <div className="h-8 w-32 bg-gray-400 rounded"></div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-16 sm:px-12 sm:py-20">
            <div className="relative mx-auto max-w-4xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to transform your agile meetings?
              </h2>
              <p className="mt-4 text-lg text-blue-100">
                Join thousands of teams who have already improved their meeting efficiency.
              </p>
              <div className="mt-10">
                <a
                  href="/signup"
                  className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 transition"
                >
                  Get started now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}