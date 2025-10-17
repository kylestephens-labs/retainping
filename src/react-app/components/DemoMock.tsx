import { useEffect, useState } from "react";
import { Users, Mail, TrendingUp, ArrowUp } from "lucide-react";

export default function DemoMock() {
  const [stats, setStats] = useState({
    inactiveDetected: 0,
    messagesSent: 0,
    reactivations: 0,
    recovered: 0
  });

  useEffect(() => {
    const animateCounters = () => {
      const duration = 2000; // 2 seconds
      const steps = 60;
      const stepTime = duration / steps;

      const targets = {
        inactiveDetected: 23,
        messagesSent: 18,
        reactivations: 7,
        recovered: 847
      };

      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        const easeOut = 1 - Math.pow(1 - progress, 3);

        setStats({
          inactiveDetected: Math.floor(targets.inactiveDetected * easeOut),
          messagesSent: Math.floor(targets.messagesSent * easeOut),
          reactivations: Math.floor(targets.reactivations * easeOut),
          recovered: Math.floor(targets.recovered * easeOut)
        });

        if (currentStep >= steps) {
          clearInterval(timer);
          setStats(targets);
        }
      }, stepTime);

      return () => clearInterval(timer);
    };

    const cleanup = animateCounters();
    return cleanup;
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Activity Feed</h3>
        <p className="text-sm text-gray-600">Your reactivation campaigns in action</p>
      </div>

      <div className="space-y-4">
        {/* Inactive Detection */}
        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Inactive Members Detected</p>
              <p className="text-xs text-gray-600">Last 24 hours</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-orange-600">{stats.inactiveDetected}</p>
            <p className="text-xs text-orange-500 flex items-center">
              <ArrowUp className="w-3 h-3 mr-1" />
              +12%
            </p>
          </div>
        </div>

        {/* Messages Sent */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Messages Sent</p>
              <p className="text-xs text-gray-600">Automated outreach</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-blue-600">{stats.messagesSent}</p>
            <p className="text-xs text-blue-500">Auto-sent</p>
          </div>
        </div>

        {/* Reactivations */}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Members Reactivated</p>
              <p className="text-xs text-gray-600">Engaged again</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-green-600">{stats.reactivations}</p>
            <p className="text-xs text-green-500 flex items-center">
              <ArrowUp className="w-3 h-3 mr-1" />
              39% response
            </p>
          </div>
        </div>

        {/* Revenue Recovered */}
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-sm font-bold text-purple-600">$</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Revenue Recovered</p>
              <p className="text-xs text-gray-600">This month</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-purple-600">${stats.recovered}</p>
            <p className="text-xs text-purple-500 flex items-center">
              <ArrowUp className="w-3 h-3 mr-1" />
              +24%
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-center text-gray-500">
          Real-time updates • Last sync: Just now
        </p>
      </div>
    </div>
  );
}
