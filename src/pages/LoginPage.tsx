import React, { useState, useEffect } from 'react';
import { UserIcon, LockIcon } from 'lucide-react';

interface User {
  userId: number;
  employeeId: number;
  roleId: number;
  username: string;
  password: null;
  status: number;
  visible: number;
  token: string;
}

interface LoginPageProps {
  onLogin: (username: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        const data: User[] = await response.json();
        const activeUsers = data.filter((u) => u.status === 1 && u.visible === 1);
        setUsers(activeUsers);
        if (activeUsers.length > 0) setSelectedUser(activeUsers[0]);
      } catch (err) {
        setError('Could not load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setLoginError('Please enter a password');
      return;
    }
    if (!selectedUser) {
      setLoginError('Please select a user');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await fetch('http://localhost:8080/api/users/check-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: selectedUser.username,
          password: password,
        }),
      });

      if (response.ok) {
        localStorage.setItem('userId', String(selectedUser.userId));
        localStorage.setItem('username', selectedUser.username);
        onLogin(selectedUser.username); // ← pass username to parent
      } else {
        setLoginError('Invalid password. Please try again.');
      }
    } catch (err) {
      setLoginError('Login failed. Please check your connection.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Left Side */}
        <div className="flex w-full flex-col justify-between p-8 md:w-2/3 lg:p-12">
          <div className="flex flex-col items-center justify-center flex-1">
            <img src="assets/logo.png" width={200} />

            <h2 className="mb-6 text-2xl font-semibold text-gray-800">Welcome Back</h2>

            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Selected User</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={selectedUser?.username ?? ''}
                    readOnly
                    placeholder={loading ? 'Loading users...' : 'Select a user'}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 py-3 pl-10 pr-3 text-gray-900 sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <LockIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setLoginError('');
                    }}
                    placeholder="Enter your password"
                    className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 sm:text-sm"
                  />
                </div>
                {loginError && <p className="text-sm text-red-500">{loginError}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoggingIn || loading || !selectedUser}
                className="flex w-full justify-center rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                {isLoggingIn ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center text-xs text-gray-400">Powered by Petal Pink</div>
        </div>

        {/* Right Side - User Selection */}
        <div className="hidden w-1/3 flex-col border-l border-gray-100 bg-gray-50 md:flex">
          <div className="border-b border-gray-200 bg-gray-100 px-6 py-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-600">
              Select User
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
              </div>
            ) : error ? (
              <p className="text-center text-sm text-red-500 py-4">{error}</p>
            ) : (
              <ul className="space-y-2">
                {users.map((user) => (
                  <li key={user.userId}>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setLoginError('');
                      }}
                      className={`flex w-full items-center rounded-lg px-4 py-3 text-left transition-all ${
                        selectedUser?.userId === user.userId
                          ? 'bg-teal-50 border-teal-200 border shadow-sm ring-1 ring-teal-500'
                          : 'bg-white border border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                      }`}
                    >
                      <div
                        className={`mr-3 flex h-8 w-8 items-center justify-center rounded-full ${
                          selectedUser?.userId === user.userId
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span
                        className={`font-medium ${
                          selectedUser?.userId === user.userId ? 'text-teal-900' : 'text-gray-700'
                        }`}
                      >
                        {user.username}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}