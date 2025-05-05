"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

type ActivityItem = {
  id: string;
  title: string;
  date: string;
  description: string;
  type: "info" | "success" | "warning";
};

export default function UserDashboard() {
  const { data: session } = useSession();
  
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([
    {
      id: "1",
      title: "Profile Updated",
      date: "2 hours ago",
      description: "You updated your profile information.",
      type: "info",
    },
    {
      id: "2",
      title: "Login Detected",
      date: "Yesterday",
      description: "New login from Chrome on Windows.",
      type: "success",
    },
    {
      id: "3",
      title: "Password Changed",
      date: "3 days ago",
      description: "You changed your password successfully.",
      type: "warning",
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold">Welcome, {session?.user?.name || "User"}!</h1>
        <p className="text-gray-600 mt-2">Here's what's happening with your account</p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm font-medium uppercase">Account Status</h2>
          <p className="mt-2 text-xl font-semibold text-green-600">Active</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm font-medium uppercase">Member Since</h2>
          <p className="mt-2 text-xl font-semibold text-gray-900">May 5, 2025</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm font-medium uppercase">Email Status</h2>
          <p className="mt-2 text-xl font-semibold text-blue-600">Verified</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm font-medium uppercase">Account Type</h2>
          <p className="mt-2 text-xl font-semibold text-purple-600">{session?.user?.role || "User"}</p>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {activityItems.map((item) => (
            <div key={item.id} className="flex items-start p-4 border rounded-lg">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                item.type === "info" ? "bg-blue-100 text-blue-500" :
                item.type === "success" ? "bg-green-100 text-green-500" :
                "bg-yellow-100 text-yellow-500"
              }`}>
                {item.type === "info" && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {item.type === "success" && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {item.type === "warning" && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <div>
                <div className="flex justify-between">
                  <h3 className="text-sm font-medium text-gray-900">{item.title}</h3>
                  <span className="text-xs text-gray-500">{item.date}</span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Quick Links */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/profile" className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
            <svg className="w-6 h-6 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm font-medium text-gray-900">Edit Profile</span>
          </a>
          
          <a href="#" className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
            <svg className="w-6 h-6 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <span className="text-sm font-medium text-gray-900">Change Password</span>
          </a>
          
          <a href="#" className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
            <svg className="w-6 h-6 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-gray-900">Help & Support</span>
          </a>
        </div>
      </div>
    </div>
  );
}