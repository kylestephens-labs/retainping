import { useAuth } from "@/react-app/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Users, Mail, TrendingUp, Zap, MessageCircle, Upload, Plus, X } from "lucide-react";
import Navbar from "@/react-app/components/Navbar";
import EmptyState from "@/react-app/components/EmptyState";
import type { DashboardStats } from "@/shared/types";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchDashboardStats();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  // Check if user has dismissed onboarding
  useEffect(() => {
    const dismissed = localStorage.getItem('retainping-onboarding-dismissed');
    if (dismissed === 'true') {
      setShowOnboarding(false);
    }
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch dashboard data');
      }
    } catch {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const dismissOnboarding = () => {
    localStorage.setItem('retainping-onboarding-dismissed', 'true');
    setShowOnboarding(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
                  <div className="h-12 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = stats?.total_members === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header with gradient background */}
        <div className="relative mb-8 p-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back, {user.google_user_data?.name || user.email.split('@')[0]} — let's keep your subscribers engaged.
              </h1>
              <p className="mt-2 opacity-90">
                Your retention command center
              </p>
            </div>
            {!isEmpty && (
              <div className="flex space-x-3">
                <Link
                  to="/app/import"
                  className="flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import</span>
                </Link>
                <Link
                  to="/app/campaigns"
                  className="flex items-center space-x-2 px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Campaign</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Onboarding Banner */}
        {showOnboarding && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8 relative">
            <button
              onClick={dismissOnboarding}
              className="absolute top-4 right-4 p-1 text-blue-400 hover:text-blue-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="pr-8">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">
                👋 Welcome to RetainPing!
              </h2>
              <p className="text-blue-800 mb-4">
                Step 1: Import your subscribers → Step 2: Create a message template → Step 3: Launch your first campaign.
              </p>
              <div className="flex space-x-3">
                <Link
                  to="/app/import"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Upload className="w-4 h-4" />
                  <span>1. Import Subscribers</span>
                </Link>
                <Link
                  to="/app/templates"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>2. Create Template</span>
                </Link>
                <Link
                  to="/app/campaigns"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  <Zap className="w-4 h-4" />
                  <span>3. Launch Campaign</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {isEmpty ? (
          <EmptyState
            icon={Users}
            title="Get Started with RetainPing"
            subtitle="Start your first retention campaign and watch inactive members return automatically."
            buttonText="Import Your First List"
            onButtonClick={() => window.location.href = "/app/import"}
            gradient="from-purple-100 to-pink-100"
          />
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-3xl font-bold text-gray-900">{stats?.total_members || 0}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Total Members</h3>
                <p className="text-sm text-gray-500">Subscribers in your list</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="text-3xl font-bold text-gray-900">{stats?.inactive_members || 0}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Inactive Members</h3>
                <p className="text-sm text-gray-500">Not active in 7+ days</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-3xl font-bold text-gray-900">{stats?.reactivated_members || 0}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Reactivated</h3>
                <p className="text-sm text-gray-500">Members won back</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-3xl font-bold text-gray-900">{stats?.active_campaigns || 0}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Active Campaigns</h3>
                <p className="text-sm text-gray-500">Running automations</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <Mail className="w-6 h-6 text-indigo-600" />
                  </div>
                  <span className="text-3xl font-bold text-gray-900">{stats?.messages_sent || 0}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Messages Sent</h3>
                <p className="text-sm text-gray-500">Total outreach messages</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                to="/app/import"
                className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow group border border-gray-100"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Import Members</h3>
                    <p className="text-sm text-gray-500">Add new subscribers via CSV</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/app/campaigns"
                className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow group border border-gray-100"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Manage Campaigns</h3>
                    <p className="text-sm text-gray-500">Create and edit automations</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/app/templates"
                className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow group border border-gray-100"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                    <MessageCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Message Templates</h3>
                    <p className="text-sm text-gray-500">Create reusable messages</p>
                  </div>
                </div>
              </Link>
            </div>
          </>
        )}

        {error && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mt-6">
            <p className="text-blue-800">
              Your data will appear here once you've added subscribers and created your first campaign.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
