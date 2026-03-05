import React, { useState } from 'react';
import { UserIcon, LockIcon } from 'lucide-react';
interface LoginPageProps {
  onLogin: () => void;
}
export function LoginPage({ onLogin }: LoginPageProps) {
  const [selectedUser, setSelectedUser] = useState('Super Admin');
  const [password, setPassword] = useState('');
  const users = ['Super Admin', 'Cashier 1', 'Manager'];
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      onLogin();
    } else {
      alert('Please enter a password');
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Left Side - Branding & Login Form */}
        <div className="flex w-full flex-col justify-between p-8 md:w-2/3 lg:p-12">
          <div className="flex flex-col items-center justify-center flex-1">
            {/* Logo Area */}
            <div className="mb-8 flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-yellow-100 to-yellow-300 p-1 shadow-lg ring-4 ring-yellow-500/20">
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white text-center">
                <span className="text-3xl font-bold text-teal-800">Petal</span>
                <span className="text-2xl font-light text-teal-600">Pink</span>
                <span className="mt-1 text-[10px] uppercase tracking-widest text-gray-400">
                  Beauty Products
                </span>
              </div>
            </div>

            <h2 className="mb-6 text-2xl font-semibold text-gray-800">
              Welcome Back
            </h2>

            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Selected User
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={selectedUser}
                    readOnly
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 py-3 pl-10 pr-3 text-gray-900 focus:border-teal-500 focus:ring-teal-500 sm:text-sm" />

                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <LockIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 sm:text-sm" />

                </div>
              </div>

              <button
                type="submit"
                className="flex w-full justify-center rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">

                Sign In
              </button>
            </form>
          </div>

          <div className="mt-8 text-center text-xs text-gray-400">
            Powered by Petal Pink
          </div>
        </div>

        {/* Right Side - User Selection */}
        <div className="hidden w-1/3 flex-col border-l border-gray-100 bg-gray-50 md:flex">
          <div className="border-b border-gray-200 bg-gray-100 px-6 py-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-600">
              Select User
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {users.map((user) =>
              <li key={user}>
                  <button
                  onClick={() => setSelectedUser(user)}
                  className={`flex w-full items-center rounded-lg px-4 py-3 text-left transition-all ${selectedUser === user ? 'bg-teal-50 border-teal-200 border shadow-sm ring-1 ring-teal-500' : 'bg-white border border-gray-200 hover:border-teal-300 hover:bg-gray-50'}`}>

                    <div
                    className={`mr-3 flex h-8 w-8 items-center justify-center rounded-full ${selectedUser === user ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600'}`}>

                      {user.charAt(0)}
                    </div>
                    <span
                    className={`font-medium ${selectedUser === user ? 'text-teal-900' : 'text-gray-700'}`}>

                      {user}
                    </span>
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>);

}