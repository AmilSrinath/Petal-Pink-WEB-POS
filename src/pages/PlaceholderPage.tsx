import React from 'react';
import { ConstructionIcon } from 'lucide-react';
interface PlaceholderPageProps {
  title: string;
}
export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center p-6 text-center">
      <div className="mb-6 rounded-full bg-teal-50 p-6 text-teal-600">
        <ConstructionIcon className="h-16 w-16" />
      </div>
      <h1 className="mb-2 text-3xl font-bold text-gray-900">{title}</h1>
      <p className="max-w-md text-lg text-gray-500">
        This module is currently under development and will be available in a
        future update.
      </p>
      <button
        onClick={() => window.history.back()}
        className="mt-8 rounded-lg bg-teal-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700">

        Go Back
      </button>
    </div>);

}