import { useAuth } from "@/react-app/contexts/AuthContext";
import { useState } from "react";
import { Zap, Users, MessageCircle, ArrowRight, CheckCircle } from "lucide-react";
import Navbar from "@/react-app/components/Navbar";
import ArcadeEmbed from "@/react-app/components/ArcadeEmbed";
import DemoMock from "@/react-app/components/DemoMock";

// Get environment variable for Arcade demo URL
const ARCADE_DEMO_URL = import.meta.env.VITE_ARCADE_EMBED_URL || "";

export default function Home() {
  const { user, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleTryFree = async () => {
    if (user) {
      window.location.href = "/app/dashboard";
    } else {
      setIsLoading(true);
      try {
        await login();
        // login() handles the redirect to OAuth, no need for additional redirect
      } catch (error) {
        console.error('Login failed:', error);
        setIsLoading(false);
      }
    }
  };

  const scrollToDemo = () => {
    document.getElementById('demo-section')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Win back lost subscribers
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent block">
              automatically
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Smart reactivation via Discord or email. Set it up once; let automation do the rest.
          </p>
          
          <div className="flex flex-col items-center space-y-4 mb-8">
            <button
              onClick={handleTryFree}
              disabled={isLoading}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isLoading ? "Starting Trial..." : "Try Free for 7 Days"}</span>
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
            <button
              onClick={scrollToDemo}
              className="text-gray-600 hover:text-gray-900 transition-colors text-sm underline"
            >
              See how it works ↓
            </button>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo-section" className="px-4 py-16 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              A quick peek at your reactivation feed
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto">
            {ARCADE_DEMO_URL ? (
              <ArcadeEmbed 
                url={ARCADE_DEMO_URL} 
                className="shadow-2xl rounded-xl overflow-hidden"
              />
            ) : (
              <div className="max-w-2xl mx-auto">
                <DemoMock />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Three simple steps to start winning back subscribers
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-shadow">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Import Subscribers</h3>
              <p className="text-gray-600">
                Upload a CSV or connect your platform.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-shadow">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Set Your Trigger</h3>
              <p className="text-gray-600">
                Choose how long before inactive members get pinged.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-shadow">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Watch Reactivations Roll In</h3>
              <p className="text-gray-600">
                We DM/email automatically; you see results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Proof + Guarantee */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">Creators recovered $317 last week.</p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-green-900">Money-Back Guarantee</h3>
            </div>
            <p className="text-green-800">
              Recover 5+ members in 7 days or pay $0.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
            Ready to win back your subscribers?
          </h2>
          <button
            onClick={handleTryFree}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center space-x-2 mx-auto"
          >
            <span>Try Free for 7 Days</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="bg-gray-900 text-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} RetainPing • <a href="#" className="hover:text-white transition-colors">Privacy</a> • <a href="#" className="hover:text-white transition-colors">Terms</a></p>
        </div>
      </footer>
    </div>
  );
}
